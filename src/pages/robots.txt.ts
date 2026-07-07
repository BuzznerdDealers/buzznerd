import type { APIRoute } from "astro";
import { siteUrl } from "../config";

// robots.txt is generated at build time so the sitemap URL always matches the
// dealer's real domain. AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
// are explicitly allowed here — see llms.txt for the AI-readable site summary.
export const GET: APIRoute = () => {
  const body = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Inventory/checkout are proxied to the commerce app; let crawlers in.
Allow: /inventory

Sitemap: ${siteUrl}/sitemap-index.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
