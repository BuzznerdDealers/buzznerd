import type { APIRoute } from "astro";
import { experimental_AstroContainer } from "astro/container";
import Head from "../../components/Head.astro";

/**
 * Dealer <head> injections (analytics, pixels, meta) as an HTML fragment.
 * Remix embeds this inside its <head> — server-side, so inline scripts run —
 * when a dealer has brandSiteUrl configured. Mirrors what BaseLayout renders
 * into <head> on brand pages, so tracking fires site-wide including inventory.
 */
export const GET: APIRoute = async () => {
  const container = await experimental_AstroContainer.create();
  const html = await container.renderToString(Head);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
};
