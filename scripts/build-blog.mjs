/**
 * build-blog.mjs — generate /blog (index) and /blog/<slug>/ (54 posts) as static
 * HTML from blog/posts.js, using the design's exact markup + inline styles and the
 * shared chrome (header/footer) from the built static pages. Per-post <head>
 * (title, canonical, OG/Twitter, BlogPosting + Breadcrumb JSON-LD) is baked in.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "node-html-parser";
import { imageSize } from "image-size";

const DC = "/tmp/claude-0/-home-user-astra-start/921c426a-a779-5f68-a225-af3123476db7/scratchpad/zip7/design_handoff_buzznerd_site";
const ROOT = "/home/user/astra-start";
const SITE = "https://www.buzznerd.com";
// Self-hosted fonts — see build-site.mjs for the full rationale.
const FONTS = `<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/bricolage-grotesque.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/plus-jakarta-sans.woff2" crossorigin>
<style>
@font-face{font-family:'Bricolage Grotesque';font-style:normal;font-weight:600 800;font-display:optional;src:url(/assets/fonts/bricolage-grotesque.woff2) format('woff2')}
@font-face{font-family:'Plus Jakarta Sans';font-style:normal;font-weight:400 700;font-display:optional;src:url(/assets/fonts/plus-jakarta-sans.woff2) format('woff2')}
</style>`;

// ---- posts data ----
const win = {};
new Function("window", readFileSync(`${DC}/blog/posts.js`, "utf8"))(win);
const POSTS = win.BZ_POSTS;

// ---- shared chrome from an already-built static page ----
const solutions = readFileSync(`${ROOT}/solutions/index.html`, "utf8");
const HEADER = addMissingImageDimensions(solutions.match(/<header[\s\S]*?<\/header>/i)[0]);
const FOOTER = addMissingImageDimensions(solutions.match(/<footer[\s\S]*?<\/footer>/i)[0]);

// ---- helmet/style helpers ----
function styleBlock(file) {
  const helmet = readFileSync(`${DC}/${file}`, "utf8").match(/<helmet>([\s\S]*?)<\/helmet>/i)[1];
  return (helmet.match(/<style>[\s\S]*?<\/style>/i) || [""])[0];
}
function indexHead() {
  const helmet = readFileSync(`${DC}/Buzznerd Blog.dc.html`, "utf8").match(/<helmet>([\s\S]*?)<\/helmet>/i)[1];
  const h = parse(helmet, { comment: false });
  const out = [];
  for (const n of h.childNodes) {
    if (!n.tagName) continue;
    const t = n.tagName.toLowerCase();
    if (t === "script") { if ((n.getAttribute("type") || "").includes("ld+json")) out.push(n.toString()); }
    else if (["title", "meta", "link", "style"].includes(t)) {
      // Drop the design's Google Fonts links — fonts are self-hosted (see FONTS).
      const href = n.getAttribute("href") || "";
      if (t === "link" && /fonts\.(googleapis|gstatic)\.com/.test(href)) continue;
      out.push(n.toString());
    }
  }
  return out.join("\n");
}
const POST_STYLE = styleBlock("Buzznerd Blog Post.dc.html");

// ---- design logic ----
const CAT_BG = { "Artificial Intelligence": "linear-gradient(135deg,#2B7BFF,#1E5FD6)", "Product": "linear-gradient(135deg,#1E5FD6,#0C1322)", "Case Study": "linear-gradient(135deg,#2B7BFF,#63A0FF)", "Insights": "linear-gradient(135deg,#0C1322,#2B3A57)", "Company": "linear-gradient(135deg,#FFD23F,#E6B421)", "Events": "linear-gradient(135deg,#63A0FF,#2B7BFF)", "Industry": "linear-gradient(135deg,#48526A,#0C1322)" };
const CAT_EMOJI = { "Artificial Intelligence": "⚡", "Product": "🔌", "Case Study": "📈", "Insights": "💡", "Company": "🎸", "Events": "📣", "Industry": "🚛" };
const catBg = (c) => CAT_BG[c] || "linear-gradient(135deg,#2B7BFF,#1E5FD6)";
const catEmoji = (c) => CAT_EMOJI[c] || "⚡";
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");
function fmtMetaShort(p) { const d = p.date ? new Date(p.date + "T00:00:00") : null; return [d ? d.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "", p.readMin ? p.readMin + " min read" : ""].filter(Boolean).join(" · "); }
function fmtMetaLong(p) { const d = p.date ? new Date(p.date + "T00:00:00") : null; return [d ? d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "", p.readMin ? p.readMin + " min read" : ""].filter(Boolean).join(" · "); }
function inline(s) { let t = esc(s); t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); t = t.replace(/\*(.+?)\*/g, "<em>$1</em>"); return t; }
function blockHtml(b) {
  if (b.p) return '<p style="font-size:17.5px;line-height:1.72;color:#2A3346;font-weight:400;margin:0 0 22px">' + inline(b.p) + "</p>";
  if (b.h2) return '<h2 style="font-family:\'Bricolage Grotesque\';font-weight:800;font-size:29px;letter-spacing:-.02em;line-height:1.12;margin:38px 0 14px">' + inline(b.h2) + "</h2>";
  if (b.h3) return '<h3 style="font-family:\'Bricolage Grotesque\';font-weight:700;font-size:22px;letter-spacing:-.01em;line-height:1.18;margin:30px 0 12px">' + inline(b.h3) + "</h3>";
  if (b.h4) return '<h4 style="font-family:\'Plus Jakarta Sans\';font-weight:700;font-size:17.5px;margin:24px 0 8px;color:#0C1322">' + inline(b.h4) + "</h4>";
  if (b.ul) return '<ul style="margin:0 0 22px;padding-left:4px;list-style:none;display:grid;gap:11px">' + b.ul.map((li) => '<li style="position:relative;padding-left:26px;font-size:16.5px;line-height:1.6;color:#2A3346"><span style="position:absolute;left:0;top:1px;color:#2B7BFF;font-weight:800">▸</span>' + inline(li) + "</li>").join("") + "</ul>";
  if (b.ol) return '<ol style="margin:0 0 22px;padding-left:22px;display:grid;gap:11px">' + b.ol.map((li) => '<li style="font-size:16.5px;line-height:1.6;color:#2A3346;padding-left:4px">' + inline(li) + "</li>").join("") + "</ol>";
  if (b.img) return '<figure style="margin:8px 0 26px"><img src="' + escAttr(b.img) + '" alt="' + escAttr(b.alt || "") + '" style="width:100%;height:auto;border-radius:16px;border:1px solid rgba(12,19,34,.08)"></figure>';
  if (b.quote) return '<blockquote style="margin:8px 0 26px;padding:22px 26px;background:#F1F5FC;border-left:4px solid #2B7BFF;border-radius:0 14px 14px 0;font-size:18px;line-height:1.6;color:#0C1322;font-weight:600;font-style:italic">' + inline(b.quote) + "</blockquote>";
  if (b.cta) return '<div style="margin:12px 0 26px"><a href="' + escAttr(b.cta.href) + '" style="display:inline-block;background:#2B7BFF;color:#fff;font-weight:700;font-size:15.5px;padding:14px 26px;border-radius:999px;text-decoration:none">' + esc(b.cta.label) + " →</a></div>";
  if (b.table) {
    const head = "<tr>" + b.table.head.map((h) => '<th style="text-align:left;padding:14px 16px;background:#0C1322;color:#fff;font-size:14px;font-weight:700">' + inline(h) + "</th>").join("") + "</tr>";
    const rows = b.table.rows.map((r, i) => "<tr>" + r.map((c) => '<td style="padding:14px 16px;border-bottom:1px solid rgba(12,19,34,.08);font-size:15px;line-height:1.55;color:#2A3346;vertical-align:top;background:' + (i % 2 ? "#F6F8FC" : "#fff") + '">' + inline(c) + "</td>").join("") + "</tr>").join("");
    return '<div style="overflow-x:auto;margin:8px 0 26px"><table style="width:100%;border-collapse:collapse;border-radius:14px;overflow:hidden;border:1px solid rgba(12,19,34,.1)">' + head + rows + "</table></div>";
  }
  return "";
}

const LINK_MAP = {
  "Buzznerd Home.dc.html": "/", "Buzznerd Solutions.dc.html": "/solutions",
  "Buzznerd Products.dc.html": "/products", "Buzznerd Services.dc.html": "/services",
  "Buzznerd AI Websites.dc.html": "/ai-websites", "Buzznerd AI E-Commerce.dc.html": "/ai-ecommerce",
  "Buzznerd AI Platform.dc.html": "/ai-platform", "Buzznerd AI Marketing.dc.html": "/ai-driven-marketing",
  "Buzznerd Content Restructuring.dc.html": "/content-restructuring-for-aio",
  "Buzznerd Workflows.dc.html": "/custom-workflows-integrations",
  "Buzznerd AI Presence Score.dc.html": "/ai-presence-score", "Buzznerd About.dc.html": "/about-us",
  "Buzznerd Careers.dc.html": "/careers", "Buzznerd Contact.dc.html": "/contact",
  "Buzznerd Blog.dc.html": "/blog", "Buzznerd Privacy.dc.html": "/privacy", "Buzznerd Terms.dc.html": "/terms",
};
function rewriteLinks(html) {
  return html.replace(/href="(Buzznerd%20[^"#]*?\.dc\.html)([^"]*)"/g, (m, file, anchor) =>
    `href="${LINK_MAP[decodeURIComponent(file)] ?? "/"}${anchor}"`);
}

// Same fix as build-site.mjs: seed intrinsic aspect ratio for local images
// that render with CSS width/height:auto, so the browser reserves space
// before the image loads (avoids a Lighthouse CLS flag). No-ops on the
// remote CloudFront post images, which aren't in /assets/.
function addMissingImageDimensions(html) {
  return html.replace(
    /<img\s+((?:(?!width=|height=)[^>])*?)src="(\/assets\/[^"]+\.(?:png|jpe?g))"((?:(?!width=|height=)[^>])*?)>/gi,
    (full, pre, src, post) => {
      if (/\bwidth=/.test(pre) || /\bwidth=/.test(post) || /\bheight=/.test(pre) || /\bheight=/.test(post)) {
        return full;
      }
      const file = join(ROOT, src);
      if (!existsSync(file)) return full;
      try {
        const { width, height } = imageSize(readFileSync(file));
        return `<img ${pre}src="${src}"${post} width="${width}" height="${height}">`;
      } catch {
        return full;
      }
    },
  );
}

function docWrap(head, body) {
  body = addMissingImageDimensions(rewriteLinks(body));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/assets/favicon.png" type="image/png">
${FONTS}
${head}
</head>
<body>
<div style="overflow-x:hidden" id="bz-page">
${HEADER}
${body}
${FOOTER}
</div>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

const sorted = POSTS.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));

// ---------- /blog index ----------
function cardHtml(p) {
  const bg = catBg(p.category);
  const media = p.hero
    ? `<img src="${escAttr(p.hero)}" alt="${escAttr(p.title)}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`
    : `<span style="font-size:52px;opacity:.9">${catEmoji(p.category)}</span>`;
  return `<a href="/blog/${p.slug}" data-bz-post="${escAttr(p.category)}" class="bz-card" style="display:flex;flex-direction:column;background:#fff;border:1px solid rgba(12,19,34,.08);border-radius:20px;overflow:hidden">
  <div style="position:relative;height:180px;background:${bg};display:grid;place-items:center;overflow:hidden">${media}</div>
  <div style="padding:22px 22px 24px;display:flex;flex-direction:column;flex:1">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <span style="background:#EAF2FF;color:#2B7BFF;font-weight:700;font-size:11px;letter-spacing:.04em;text-transform:uppercase;padding:5px 10px;border-radius:999px">${esc(p.category)}</span>
      <span style="color:#8A93A6;font-size:12.5px;font-weight:600">${esc(fmtMetaShort(p))}</span>
    </div>
    <h3 style="font-family:'Bricolage Grotesque';font-weight:700;font-size:19px;line-height:1.18;letter-spacing:-.01em">${esc(p.title)}</h3>
    <p style="font-size:14.5px;line-height:1.55;color:#48526A;font-weight:500;margin-top:10px;flex:1">${esc(p.excerpt)}</p>
    <span class="bz-link" style="color:#2B7BFF;font-weight:700;font-size:14px;margin-top:16px;align-self:flex-start">Read more →</span>
  </div>
</a>`;
}
function featuredHtml(p) {
  const media = p.hero
    ? `<img src="${escAttr(p.hero)}" alt="${escAttr(p.title)}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`
    : `<span style="font-size:88px;opacity:.9;filter:drop-shadow(0 8px 20px rgba(12,19,34,.25))">⚡</span>`;
  return `<a href="/blog/${p.slug}" data-bz-featured class="bz-card" style="display:grid;grid-template-columns:1.15fr .85fr;gap:0;background:#fff;border:1px solid rgba(12,19,34,.08);border-radius:24px;overflow:hidden">
  <div style="position:relative;min-height:320px;background:${catBg(p.category)};display:grid;place-items:center;overflow:hidden">${media}</div>
  <div style="padding:40px 40px 36px;display:flex;flex-direction:column;justify-content:center">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <span style="background:#EAF2FF;color:#2B7BFF;font-weight:700;font-size:12px;letter-spacing:.05em;text-transform:uppercase;padding:6px 12px;border-radius:999px">${esc(p.category)}</span>
      <span style="color:#8A93A6;font-size:13px;font-weight:600">${esc(fmtMetaShort(p))}</span>
    </div>
    <h2 style="font-family:'Bricolage Grotesque';font-weight:800;font-size:clamp(26px,2.6vw,38px);line-height:1.08;letter-spacing:-.02em">${esc(p.title)}</h2>
    <p style="font-size:16.5px;line-height:1.6;color:#48526A;font-weight:500;margin-top:16px">${esc(p.excerpt)}</p>
    <span class="bz-link" style="color:#2B7BFF;font-weight:700;font-size:15.5px;margin-top:22px;align-self:flex-start">Read the article →</span>
  </div>
</a>`;
}
const cats = ["All", ...Array.from(new Set(sorted.map((p) => p.category)))];
const chips = cats.map((c, i) => `<button type="button" class="bz-chip" data-on="${i === 0 ? "1" : "0"}" data-bz-chip="${escAttr(c)}">${esc(c)}</button>`).join("\n        ");
const featured = sorted[0];
const grid = sorted.slice(1).map(cardHtml).join("\n");
const indexBody = `<main>
  <section style="max-width:1240px;margin:0 auto;padding:72px 28px 24px">
    <div class="bz-rise" style="display:inline-flex;align-items:center;gap:9px;background:#fff;border:1px solid rgba(12,19,34,.09);padding:7px 14px 7px 9px;border-radius:999px;font-weight:600;font-size:13.5px;box-shadow:0 2px 10px rgba(12,19,34,.05)">
      <span style="display:inline-grid;place-items:center;width:22px;height:22px;background:#FFD23F;border-radius:6px;font-size:13px;animation:bz-bolt 1.8s ease-in-out infinite">⚡</span>
      The Buzznerd Blog
    </div>
    <h1 class="bz-rise" style="font-family:'Bricolage Grotesque';font-weight:800;font-size:clamp(38px,4.6vw,62px);line-height:1.02;letter-spacing:-.025em;margin:20px 0 0;max-width:820px">
      AI, dealership growth, and the <span style="color:#2B7BFF;font-style:italic">commercial truck</span> industry.
    </h1>
    <p class="bz-rise" style="font-size:18.5px;line-height:1.55;color:#48526A;max-width:600px;margin:20px 0 0;font-weight:500">
      Practical insight from the team building AI-powered websites, e-commerce, and marketing for truck, trailer, and equipment dealerships.
    </p>
  </section>
  <section style="max-width:1240px;margin:0 auto;padding:26px 28px 0">
    <div style="display:flex;flex-wrap:wrap;gap:10px" role="tablist" aria-label="Filter posts by category">
        ${chips}
    </div>
  </section>
  <section style="max-width:1240px;margin:0 auto;padding:34px 28px 0">
    ${featuredHtml(featured)}
  </section>
  <section style="max-width:1240px;margin:0 auto;padding:26px 28px 20px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
${grid}
    </div>
  </section>
  <section style="max-width:1240px;margin:0 auto;padding:48px 28px 90px">
    <div style="background:#0C1322;border-radius:32px;padding:72px 56px;text-align:center;position:relative;overflow:hidden">
      <div style="position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:420px;height:240px;background:radial-gradient(circle,rgba(43,123,255,.45),transparent 70%)"></div>
      <div style="position:absolute;bottom:-80px;right:8%;width:260px;height:260px;background:radial-gradient(circle,rgba(255,210,63,.25),transparent 70%)"></div>
      <div style="position:relative">
        <div style="font-size:38px;animation:bz-bolt 1.8s ease-in-out infinite">⚡</div>
        <h2 style="font-family:'Bricolage Grotesque';font-weight:800;font-size:clamp(30px,4vw,52px);line-height:1.04;letter-spacing:-.025em;color:#fff;margin:10px auto 0;max-width:680px">Put these ideas to work in your dealership.</h2>
        <p style="font-size:18px;color:#AEB6C6;font-weight:500;margin:16px auto 0;max-width:500px;line-height:1.55">Book a 20-minute demo and we'll show you where you're leaking leads — and how to plug it.</p>
        <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:32px">
          <a href="/#contact" class="bz-cta" style="background:#FFD23F;color:#0C1322;font-weight:700;font-size:17px;padding:17px 32px;border-radius:999px;box-shadow:0 12px 30px rgba(255,210,63,.3)">Book a demo</a>
        </div>
      </div>
    </div>
  </section>
</main>`;
mkdirSync(`${ROOT}/blog`, { recursive: true });
writeFileSync(`${ROOT}/blog/index.html`, docWrap(indexHead(), indexBody));
console.log("built /blog");

// ---------- /blog/<slug>/ ----------
function postHead(p) {
  const url = `${SITE}/blog/${p.slug}`;
  const desc = p.excerpt || p.subtitle || "";
  const img = p.hero || `${SITE}/assets/buzznerd-og.png`;
  const jsonld = { "@context": "https://schema.org", "@graph": [
    { "@type": "BlogPosting", headline: p.title, description: desc, image: img, datePublished: p.date, dateModified: p.date, author: { "@type": "Person", name: p.author || "Buzznerd" }, publisher: { "@type": "Organization", name: "Buzznerd", logo: { "@type": "ImageObject", url: `${SITE}/assets/buzznerd-logo-trim.png` } }, mainEntityOfPage: url, url },
    { "@type": "BreadcrumbList", itemListElement: [ { "@type": "ListItem", position: 1, name: "Home", item: SITE }, { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` }, { "@type": "ListItem", position: 3, name: p.title, item: url } ] },
  ] };
  return [
    `<title>${esc(p.title)} | Buzznerd Blog</title>`,
    `<meta name="description" content="${escAttr(desc)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta name="robots" content="index, follow, max-image-preview:large">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="Buzznerd">`,
    `<meta property="og:title" content="${escAttr(p.title)}">`,
    `<meta property="og:description" content="${escAttr(desc)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${escAttr(img)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escAttr(p.title)}">`,
    `<meta name="twitter:description" content="${escAttr(desc)}">`,
    `<meta name="twitter:image" content="${escAttr(img)}">`,
    `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`,
    POST_STYLE,
  ].join("\n");
}
function relatedHtml(p) {
  const others = sorted.filter((x) => x.slug !== p.slug);
  const pool = [...others.filter((x) => x.category === p.category), ...others.filter((x) => x.category !== p.category)].slice(0, 3);
  if (!pool.length) return "";
  const cards = pool.map((r) => {
    const media = r.hero ? `<img src="${escAttr(r.hero)}" alt="${escAttr(r.title)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : `<span style="font-size:46px;opacity:.9">${catEmoji(r.category)}</span>`;
    return `<a href="/blog/${r.slug}" class="bz-card" style="display:flex;flex-direction:column;background:#fff;border:1px solid rgba(12,19,34,.08);border-radius:20px;overflow:hidden">
      <div style="position:relative;height:150px;background:${catBg(r.category)};display:grid;place-items:center;overflow:hidden">${media}</div>
      <div style="padding:20px 20px 22px;display:flex;flex-direction:column;flex:1">
        <span style="color:#8A93A6;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${esc(r.category)}</span>
        <h3 style="font-family:'Bricolage Grotesque';font-weight:700;font-size:17.5px;line-height:1.2;margin-top:8px">${esc(r.title)}</h3>
      </div>
    </a>`;
  }).join("\n");
  return `<section style="max-width:1240px;margin:0 auto;padding:64px 28px 90px">
    <h2 style="font-family:'Bricolage Grotesque';font-weight:800;font-size:28px;letter-spacing:-.02em;margin-bottom:26px">More from the blog</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">${cards}</div>
  </section>`;
}
function postBody(p) {
  const bodyHtml = (p.body || [{ p: p.excerpt || "" }]).map(blockHtml).join("");
  const heroImg = p.hero ? `<div style="max-width:940px;margin:32px auto 0;padding:0 28px"><img src="${escAttr(p.hero)}" alt="${escAttr(p.title)}" style="width:100%;height:auto;max-height:460px;object-fit:cover;border-radius:22px;border:1px solid rgba(12,19,34,.08);box-shadow:0 30px 70px -34px rgba(12,19,34,.4)"></div>` : "";
  const sub = p.subtitle ? `<p style="font-size:19.5px;line-height:1.5;color:#48526A;font-weight:500;margin-top:18px">${esc(p.subtitle)}</p>` : "";
  const initial = (p.author || "B").trim().charAt(0).toUpperCase();
  return `<main>
  <article>
    <div style="max-width:820px;margin:0 auto;padding:56px 28px 0">
      <a href="/blog" class="bz-link" style="color:#8A93A6;font-weight:700;font-size:13.5px">← Back to blog</a>
      <div style="display:flex;align-items:center;gap:12px;margin-top:22px">
        <span style="background:#EAF2FF;color:#2B7BFF;font-weight:700;font-size:12px;letter-spacing:.05em;text-transform:uppercase;padding:6px 12px;border-radius:999px">${esc(p.category)}</span>
        <span style="color:#8A93A6;font-size:13.5px;font-weight:600">${esc(fmtMetaLong(p))}</span>
      </div>
      <h1 class="bz-rise" style="font-family:'Bricolage Grotesque';font-weight:800;font-size:clamp(30px,4vw,52px);line-height:1.05;letter-spacing:-.025em;margin-top:18px">${esc(p.title)}</h1>
      ${sub}
      <div style="display:flex;align-items:center;gap:12px;margin-top:26px;padding-bottom:6px">
        <span style="display:grid;place-items:center;width:42px;height:42px;background:#0C1322;color:#FFD23F;border-radius:50%;font-weight:800;font-size:16px">${esc(initial)}</span>
        <div><div style="font-weight:700;font-size:14.5px">${esc(p.author || "Buzznerd")}</div><div style="color:#8A93A6;font-size:12.5px;font-weight:600">Buzznerd</div></div>
      </div>
    </div>
    ${heroImg}
    <div class="bz-article" style="max-width:720px;margin:0 auto;padding:44px 28px 8px">${bodyHtml}</div>
  </article>
  <section style="max-width:720px;margin:40px auto 0;padding:0 28px">
    <div style="background:#0C1322;border-radius:24px;padding:40px 40px;position:relative;overflow:hidden">
      <div style="position:absolute;top:-50px;right:-20px;width:260px;height:200px;background:radial-gradient(circle,rgba(43,123,255,.4),transparent 70%)"></div>
      <div style="position:relative;display:flex;align-items:center;gap:24px;flex-wrap:wrap;justify-content:space-between">
        <div style="max-width:400px">
          <h3 style="font-family:'Bricolage Grotesque';font-weight:800;font-size:26px;color:#fff;line-height:1.1">See it working on your own lot.</h3>
          <p style="font-size:15.5px;color:#AEB6C6;font-weight:500;margin-top:10px;line-height:1.5">Book a 20-minute demo and we'll show you where the leads are hiding.</p>
        </div>
        <a href="/#contact" class="bz-cta" style="background:#FFD23F;color:#0C1322;font-weight:700;font-size:16px;padding:15px 28px;border-radius:999px;flex-shrink:0">Book a demo</a>
      </div>
    </div>
  </section>
  ${relatedHtml(p)}
</main>`;
}
let n = 0;
for (const p of POSTS) {
  mkdirSync(`${ROOT}/blog/${p.slug}`, { recursive: true });
  writeFileSync(`${ROOT}/blog/${p.slug}/index.html`, docWrap(postHead(p), postBody(p)));
  n++;
}
console.log(`built ${n} blog posts`);
