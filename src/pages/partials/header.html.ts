import type { APIRoute } from "astro";
import { experimental_AstroContainer } from "astro/container";
import Header from "../../components/Header.astro";
import { siteUrl } from "../../config";

/**
 * Fragment HTML for the brand header (announcement + topbar + nav).
 * Remix fetches this when a dealer has brandSiteUrl configured and wraps
 * inventory/checkout pages with it. No <html>/<body> shell — fragment only.
 *
 * Rendered with pathname /inventory so the Inventory nav item is active
 * when this chrome is used on Remix storefront pages.
 */
export const GET: APIRoute = async () => {
  const container = await experimental_AstroContainer.create();
  const html = await container.renderToString(Header, {
    request: new Request(new URL("/inventory", siteUrl + "/").toString()),
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
};
