/**
 * build-site.mjs — assemble the final static site from:
 *   - build/<comp>.body.html  (resolved DOM extracted by extract-dc.mjs)
 *   - the source <helmet> head of each Buzznerd *.dc.html (verbatim)
 *   - blog/posts.js (54 posts) for /blog and /blog/<slug>/
 * Output: static .html at the repo root (clean routes), /assets copied separately.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { parse } from "node-html-parser";

const DC = "/tmp/claude-0/-home-user-astra-start/921c426a-a779-5f68-a225-af3123476db7/scratchpad/zip7/design_handoff_buzznerd_site";
const ROOT = "/home/user/astra-start";

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap">';

const LINK_MAP = {
  "Buzznerd Home.dc.html": "/",
  "Buzznerd Solutions.dc.html": "/solutions",
  "Buzznerd Products.dc.html": "/products",
  "Buzznerd Services.dc.html": "/services",
  "Buzznerd AI Websites.dc.html": "/ai-websites",
  "Buzznerd AI E-Commerce.dc.html": "/ai-ecommerce",
  "Buzznerd AI Platform.dc.html": "/ai-platform",
  "Buzznerd AI Marketing.dc.html": "/ai-driven-marketing",
  "Buzznerd Content Restructuring.dc.html": "/content-restructuring-for-aio",
  "Buzznerd Workflows.dc.html": "/custom-workflows-integrations",
  "Buzznerd AI Presence Score.dc.html": "/ai-presence-score",
  "Buzznerd About.dc.html": "/about-us",
  "Buzznerd Careers.dc.html": "/careers",
  "Buzznerd Contact.dc.html": "/contact",
  "Buzznerd Blog.dc.html": "/blog",
  "Buzznerd Privacy.dc.html": "/privacy",
  "Buzznerd Terms.dc.html": "/terms",
};

const PAGES = [
  ["Buzznerd Home.dc.html", "/", "home"],
  ["Buzznerd Solutions.dc.html", "/solutions", "solutions"],
  ["Buzznerd Products.dc.html", "/products", "products"],
  ["Buzznerd Services.dc.html", "/services", "services"],
  ["Buzznerd AI Websites.dc.html", "/ai-websites", "ai-websites"],
  ["Buzznerd AI E-Commerce.dc.html", "/ai-ecommerce", "ai-ecommerce"],
  ["Buzznerd AI Platform.dc.html", "/ai-platform", "ai-platform"],
  ["Buzznerd AI Marketing.dc.html", "/ai-driven-marketing", "ai-driven-marketing"],
  ["Buzznerd Content Restructuring.dc.html", "/content-restructuring-for-aio", "content-restructuring-for-aio"],
  ["Buzznerd Workflows.dc.html", "/custom-workflows-integrations", "custom-workflows-integrations"],
  ["Buzznerd AI Presence Score.dc.html", "/ai-presence-score", "ai-presence-score"],
  ["Buzznerd About.dc.html", "/about-us", "about-us"],
  ["Buzznerd Careers.dc.html", "/careers", "careers"],
  ["Buzznerd Contact.dc.html", "/contact", "contact"],
  ["Buzznerd Privacy.dc.html", "/privacy", "privacy"],
  ["Buzznerd Terms.dc.html", "/terms", "terms"],
];

function rewriteLinks(html) {
  return html.replace(/href="(Buzznerd%20[^"#]*?\.dc\.html)([^"]*)"/g, (m, file, anchor) => {
    const route = LINK_MAP[decodeURIComponent(file)] ?? "/";
    return `href="${route}${anchor}"`;
  });
}
function rewriteAssets(html) {
  return html
    .replace(/(src=")assets\//g, "$1/assets/")
    .replace(/(srcset=")assets\//g, "$1/assets/")
    .replace(/((?:data-before|data-after)=")assets\//g, "$1/assets/");
}

/**
 * The "Find a location" widget (AI Websites page) is fully React-state-driven
 * (brand/service filters recompute the location list, map pins, and active
 * chips) — none of that survives static-DOM extraction (React never writes
 * onClick handlers into the DOM). Replace its rendered markup with an empty
 * mount point; assets/location-finder.js renders and drives it client-side
 * from the same data/logic as the design's data-dc-script.
 */
function mountLocationFinder(page) {
  for (const div of page.querySelectorAll("div")) {
    const style = div.getAttribute("style") || "";
    if (style.includes("grid-template-columns") && div.text.includes("Find a location")) {
      const mount = parse(
        '<div id="loc-finder" style="margin-top:40px;background:#fff;border:1px solid rgba(12,19,34,.08);border-radius:28px;overflow:hidden;display:grid;grid-template-columns:352px 1fr;box-shadow:0 24px 60px -30px rgba(12,19,34,.4);min-height:600px"></div>',
      );
      div.replaceWith(mount);
      return true;
    }
  }
  console.warn("mountLocationFinder: widget container not found");
  return false;
}

function buildHead(file) {
  const src = readFileSync(`${DC}/${file}`, "utf8");
  const helmet = src.match(/<helmet>([\s\S]*?)<\/helmet>/i)[1];
  const h = parse(helmet, { comment: false });
  const out = [];
  for (const n of h.childNodes) {
    if (!n.tagName) continue;
    const t = n.tagName.toLowerCase();
    if (t === "script") {
      if ((n.getAttribute("type") || "").includes("ld+json")) out.push(n.toString());
    } else if (["title", "meta", "link", "style"].includes(t)) {
      out.push(n.toString());
    }
  }
  return rewriteAssets(out.join("\n"));
}

function cleanBody(comp) {
  const raw = readFileSync(`${ROOT}/build/${comp}.body.html`, "utf8");
  const root = parse(raw, { comment: false });
  const host = root.querySelector(".sc-host");
  const page = (host || root).querySelector("#bz-page") || host || root;
  // Drop the prototype view-switcher pill (its buttons carry data-bz-view).
  page.querySelectorAll("[data-bz-view]").forEach((b) => {
    const p = b.parentNode;
    if (p && p !== page && p.remove) p.remove();
  });
  page.querySelectorAll("script").forEach((s) => s.remove());
  if (comp === "ai-websites") mountLocationFinder(page);
  let html = page.outerHTML;
  html = html
    .replace(/\s+data-dc-tpl="[^"]*"/g, "")
    .replace(/\s+data-screen-label="[^"]*"/g, "")
    .replace(/\s+data-sc-name="[^"]*"/g, "")
    .replace(/\s+data-dc-[a-z-]+="[^"]*"/g, "");
  html = rewriteAssets(rewriteLinks(html));
  return html;
}

// Page-specific extra scripts, keyed by route, for widgets that need more
// than the shared assets/site.js (e.g. the AI Websites location finder).
const EXTRA_SCRIPTS = {
  "/ai-websites": ['<script src="/assets/location-finder.js" defer></script>'],
};

function writePage(route, head, body) {
  const dir = route === "/" ? ROOT : `${ROOT}${route}`;
  mkdirSync(dir, { recursive: true });
  const extra = (EXTRA_SCRIPTS[route] || []).join("\n");
  const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/assets/buzznerd-logo-trim.png">
${FONTS}
${head}
</head>
<body>
${body}
<script src="/assets/site.js" defer></script>${extra ? "\n" + extra : ""}
</body>
</html>
`;
  writeFileSync(`${dir}/index.html`, doc);
}

let n = 0;
for (const [file, route, comp] of PAGES) {
  if (!existsSync(`${ROOT}/build/${comp}.body.html`)) {
    console.error("missing extract:", comp);
    continue;
  }
  writePage(route, buildHead(file), cleanBody(comp));
  n++;
  console.log("built", route);
}
console.log(`done: ${n} static pages`);
