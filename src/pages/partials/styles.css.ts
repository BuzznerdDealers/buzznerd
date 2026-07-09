import type { APIRoute } from "astro";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dealer } from "../../config";

/**
 * Chrome-only CSS (header/footer + tokens/primitives they need).
 * Remix links this when wrapping inventory pages with brand chrome.
 * Brand tokens from dealer.config.json are prepended so colors/fonts match.
 */
export const GET: APIRoute = async () => {
  const brand = dealer.brand;
  const fonts = Array.from(
    new Set([brand.fontHeading, brand.fontBody].filter(Boolean)),
  );
  const fontQuery = fonts
    .map((f) => `family=${f!.replace(/ /g, "+")}:wght@400;500;600;700;800`)
    .join("&");

  const brandTokens = `:root{
  --primary:${brand.primaryColor};
  --primary-dark:${brand.primaryColorDark || brand.primaryColor};
  --accent:${brand.accentColor};
  --text:${brand.textColor || "#0f172a"};
  --font-heading:'${brand.fontHeading}',sans-serif;
  --font-body:'${brand.fontBody}',sans-serif;
}`;

  const fontImport = fonts.length
    ? `@import url("https://fonts.googleapis.com/css2?${fontQuery}&display=swap");\n`
    : "";

  // Read from project root — import.meta.url points at dist/ during prerender.
  const chromeCss = readFileSync(
    join(process.cwd(), "src/styles/chrome.css"),
    "utf8",
  );

  const css = `${fontImport}${brandTokens}\n${chromeCss}`;

  return new Response(css, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
};
