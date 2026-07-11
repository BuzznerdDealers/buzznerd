import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { dealer, siteUrl, socialLinks } from "../config";

/**
 * llms-full.txt — the expanded companion to llms.txt (llmstxt.org convention).
 *
 * Where llms.txt is a concise INDEX (links + one-line summaries), llms-full.txt
 * is the FULL CONTENT of the site in a single plain-text document: every page's
 * readable copy (extracted from its sections) plus every blog post's full body.
 * This lets AI answer engines ingest the entire site in one fetch and cite it
 * accurately. Generated at build time from dealer.config + content collections,
 * so it always stays in sync — never hand-maintained.
 */

// Object keys that hold styling / structural / asset values, not readable copy.
// Everything else that is a string is treated as content, so new section fields
// are picked up automatically without editing this list.
const SKIP_KEYS = new Set([
  "type",
  "id",
  "icon",
  "href",
  "url",
  "src",
  "image",
  "images",
  "coverImage",
  "backgroundImage",
  "logo",
  "logoDark",
  "favicon",
  "mapUrl",
  "style",
  "layout",
  "imageSide",
  "align",
  "background",
  "columns",
  "widget",
  "collection",
  "draft",
  "noindex",
]);

/** Recursively pull readable strings out of an arbitrary section object. */
function extractText(value: unknown, key = ""): string[] {
  if (value == null) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return SKIP_KEYS.has(key) || !trimmed ? [] : [trimmed];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => extractText(item, key));
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([k, v]) => extractText(v, k),
    );
  }
  return [];
}

export const GET: APIRoute = async () => {
  const pages = (await getCollection("pages"))
    .filter((p) => !p.data.draft)
    .sort((a, b) => (a.id === "home" ? -1 : a.id.localeCompare(b.id)));
  const posts = (await getCollection("blog"))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const c = dealer.contact ?? {};
  const location = [c.address, c.city, c.state, c.zip]
    .filter(Boolean)
    .join(", ");

  const lines: string[] = [];
  lines.push(`# ${dealer.name} — Full Content`);
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
  for (const { network, url } of socialLinks()) {
    lines.push(`- ${network}: ${url}`);
  }
  lines.push("");

  lines.push("## Pages");
  lines.push("");
  for (const page of pages) {
    const slug = page.id === "home" ? "" : page.id;
    const url = `${siteUrl}/${slug}`.replace(/\/$/, "") || siteUrl;
    lines.push(`### ${page.data.title}`);
    lines.push(`URL: ${url}`);
    const desc = page.data.seo?.description;
    if (desc) lines.push(`Summary: ${desc}`);
    lines.push("");
    for (const section of page.data.sections ?? []) {
      const text = extractText(section);
      if (text.length) lines.push(text.join("\n"), "");
    }
  }

  if (posts.length) {
    lines.push("## Blog");
    lines.push("");
    for (const post of posts) {
      const date = post.data.date.toISOString().slice(0, 10);
      lines.push(`### ${post.data.title}`);
      lines.push(`URL: ${siteUrl}/blog/${post.id}`);
      lines.push(`Date: ${date} · Author: ${post.data.author}`);
      lines.push("");
      lines.push((post.body ?? post.data.excerpt).trim());
      lines.push("");
    }
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
