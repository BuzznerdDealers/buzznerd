import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import dealer from "./dealer.config.json" with { type: "json" };

// `site` powers canonical URLs, sitemap.xml and absolute Open Graph URLs.
// It is read from dealer.config.json so each dealer repo is self-configuring.
export default defineConfig({
  site: dealer.url,
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes("/inventory"),
    }),
  ],
});
