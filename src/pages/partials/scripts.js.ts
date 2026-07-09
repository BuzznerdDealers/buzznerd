import type { APIRoute } from "astro";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Chrome JS (mobile nav toggle, etc.).
 * Remix loads this after injecting the header partial so the menu works
 * on inventory/checkout pages.
 */
export const GET: APIRoute = async () => {
  // Read from project root — import.meta.url points at dist/ during prerender.
  const js = readFileSync(
    join(process.cwd(), "src/scripts/chrome.js"),
    "utf8",
  );

  return new Response(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
};
