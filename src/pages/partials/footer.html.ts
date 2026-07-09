import type { APIRoute } from "astro";
import { experimental_AstroContainer } from "astro/container";
import Footer from "../../components/Footer.astro";

/**
 * Fragment HTML for the brand footer.
 * Remix fetches this when wrapping inventory/checkout with brand chrome.
 */
export const GET: APIRoute = async () => {
  const container = await experimental_AstroContainer.create();
  const html = await container.renderToString(Footer);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
};
