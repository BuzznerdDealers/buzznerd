#!/usr/bin/env node
/**
 * Writes vercel.json from dealer.config.json so the /inventory/* rewrite
 * always targets this dealer's remixOrigin. Run via prebuild / predev.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dealer = JSON.parse(
  readFileSync(join(root, "dealer.config.json"), "utf8"),
);

const remixOrigin = String(dealer.remixOrigin || "").replace(/\/$/, "");
if (!remixOrigin) {
  console.error("dealer.config.json is missing remixOrigin");
  process.exit(1);
}

const vercel = {
  $schema: "https://openapi.vercel.sh/vercel.json",
  buildCommand: "npm run build",
  outputDirectory: "dist",
  framework: null,
  rewrites: [
    {
      source: "/inventory",
      destination: `${remixOrigin}/inventory`,
    },
    {
      source: "/inventory/:path*",
      destination: `${remixOrigin}/inventory/:path*`,
    },
  ],
  redirects: [
    // @astrojs/sitemap emits sitemap-index.xml (the canonical entry point that
    // robots.txt points to). Alias the conventional /sitemap.xml to it so
    // crawlers and humans that look for the classic name still find it.
    {
      source: "/sitemap.xml",
      destination: "/sitemap-index.xml",
      permanent: true,
    },
  ],
  headers: [
    {
      source: "/partials/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=300, stale-while-revalidate=86400",
        },
      ],
    },
  ],
};

writeFileSync(join(root, "vercel.json"), JSON.stringify(vercel, null, 2) + "\n");
console.log(`Wrote vercel.json → ${remixOrigin}/inventory/*`);
