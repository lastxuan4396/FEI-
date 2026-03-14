import { defineConfig } from "astro/config";

const site = process.env.SITE_URL || "https://is.gd/dianjidefanplus2";

export default defineConfig({
  site,
  vite: {
    server: {
      host: true
    }
  }
});