const CACHE_NAME = "downloads-checkout-mobile-v1";
const APP_SHELL = [
  "/downloads-checkout/mobile/",
  "/downloads-checkout/mobile/manifest.webmanifest",
  "/downloads-mobile.js",
  "/assets/pwa/downloads-mobile-icon-192.png",
  "/assets/pwa/downloads-mobile-icon-512.png",
  "/assets/pwa/downloads-mobile-apple-touch-icon.png",
  "/assets/icon.svg",
  "/assets/downloads-checkout-cover.svg"
];

const collectPageAssets = async () => {
  try {
    const response = await fetch("/downloads-checkout/mobile/", { cache: "no-store" });
    const html = await response.text();
    const assets = Array.from(html.matchAll(/(?:href|src)="([^"]+)"/g))
      .map((match) => match[1])
      .filter((url) => url.startsWith("/") && !url.startsWith("//"))
      .filter((url) => !url.startsWith("http"))
      .filter((url) => !url.startsWith("/downloads-checkout/mobile/sw.js"));

    return Array.from(new Set([...APP_SHELL, ...assets]));
  } catch {
    return APP_SHELL;
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    collectPageAssets().then((assets) =>
      caches.open(CACHE_NAME).then((cache) => cache.addAll(assets))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

const isSameOrigin = (requestUrl) => {
  const url = new URL(requestUrl);
  return url.origin === self.location.origin;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || !isSameOrigin(request.url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/downloads-checkout/mobile/");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
