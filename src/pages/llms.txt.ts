import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { dealer, siteUrl } from "../config";

/**
 * llms.txt — an AI-optimization (AIO) file following the llmstxt.org convention.
 * It gives LLM answer engines (ChatGPT, Claude, Perplexity, Google AI Overviews)
 * a clean, structured summary of the business and its pages so they can cite it
 * accurately. Generated at build time from dealer.config + content collections.
 */
export const GET: APIRoute = async () => {
  const pages = (await getCollection("pages")).filter((p) => !p.data.draft);
  const posts = (await getCollection("blog"))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const c = dealer.contact ?? {};
  const location = [c.address, c.city, c.state, c.zip]
    .filter(Boolean)
    .join(", ");

  const lines: string[] = [];
  lines.push(`# ${dealer.name}`);
  lines.push("");
  lines.push(`> ${dealer.tagline || dealer.seo.defaultDescription}`);
  lines.push("");
  lines.push(dealer.seo.defaultDescription);
  lines.push("");

  lines.push("## Business details");
  lines.push(`- Type: ${dealer.businessType || "Business"}`);
  if (c.phone) lines.push(`- Phone: ${c.phone}`);
  if (c.email) lines.push(`- Email: ${c.email}`);
  if (location) lines.push(`- Location: ${location}`);
  lines.push(`- Website: ${siteUrl}`);
  lines.push(`- Inventory: ${siteUrl}/inventory`);
  lines.push("");

  lines.push("## Pages");
  for (const page of pages) {
    const slug = page.id === "home" ? "" : page.id;
    const url = `${siteUrl}/${slug}`.replace(/\/$/, "") || siteUrl;
    const desc = page.data.seo?.description || page.data.title;
    lines.push(`- [${page.data.title}](${url}): ${desc}`);
  }
  lines.push("");

  if (posts.length) {
    lines.push("## Blog");
    for (const post of posts) {
      lines.push(
        `- [${post.data.title}](${siteUrl}/blog/${post.id}): ${post.data.excerpt}`,
      );
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
