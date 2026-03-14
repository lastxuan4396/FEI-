import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../config/site";

export const GET: APIRoute = async () => {
  const [posts, projects, games] = await Promise.all([
    getCollection("posts", ({ data }) => !data.draft),
    getCollection("projects", ({ data }) => !data.draft),
    getCollection("games", ({ data }) => !data.draft)
  ]);

  const urls = [
    "",
    ...posts.map((item) => `/posts/${item.data.slug}/`),
    ...projects.map((item) => `/projects/${item.data.slug}/`),
    ...games.map((item) => `/games/${item.data.slug}/`)
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((path) => `  <url><loc>${new URL(path, siteConfig.siteUrl).href}</loc></url>`)
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
};