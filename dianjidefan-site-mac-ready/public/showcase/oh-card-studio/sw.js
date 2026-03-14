const CACHE_NAME = "oh-card-studio-v17";
const APP_SHELL = "./index.html";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./icon.svg",
  "./data/oh-image-deck.json",
  "./data/oh-word-deck.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isCacheableResponse(request, response) {
  if (!response || !response.ok) {
    return false;
  }
  try {
    const requestUrl = new URL(request.url);
    return requestUrl.origin === self.location.origin;
  } catch (error) {
    return false;
  }
}

async function networkFirst(request, allowShellFallback) {
  try {
    const response = await fetch(request);
    if (isCacheableResponse(request, response)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    } else if (!response.ok) {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    if (allowShellFallback) {
      const shell = await caches.match(APP_SHELL);
      if (shell) {
        return shell;
      }
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  let requestUrl;
  try {
    requestUrl = new URL(event.request.url);
  } catch (error) {
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  const isNavigation = event.request.mode === "navigate" || event.request.destination === "document";
  event.respondWith(networkFirst(event.request, isNavigation));
});
