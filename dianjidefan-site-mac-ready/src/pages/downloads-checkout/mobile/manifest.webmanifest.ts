import type { APIRoute } from "astro";

export const GET: APIRoute = () =>
  new Response(JSON.stringify({
    id: "/downloads-checkout/mobile/",
    name: "下载区去留器手机版",
    short_name: "下载区去留器",
    description: "把手机里已经下载、已经接收、但一直没处理的文件，一张张结掉。",
    lang: "zh-CN",
    start_url: "/downloads-checkout/mobile/",
    scope: "/downloads-checkout/mobile/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf5ed",
    theme_color: "#fbf5ed",
    icons: [
      {
        src: "/assets/pwa/downloads-mobile-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/assets/pwa/downloads-mobile-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    shortcuts: [
      {
        name: "继续今天这轮",
        short_name: "继续结账",
        url: "/downloads-checkout/mobile/#demo"
      }
    ]
  }), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8"
    }
  });
