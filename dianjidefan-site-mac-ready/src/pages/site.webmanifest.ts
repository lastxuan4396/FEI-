import type { APIRoute } from "astro";
import { siteConfig } from "../config/site";

export const GET: APIRoute = () =>
  new Response(JSON.stringify({
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    start_url: "/",
    display: "standalone",
    background_color: "#f6f2e9",
    theme_color: "#f6f2e9",
    icons: [
      {
        src: "/assets/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  }), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8"
    }
  });