/**
 * build-site.mjs — assemble the final static site from:
 *   - build/<comp>.body.html  (resolved DOM extracted by extract-dc.mjs)
 *   - the source <helmet> head of each Buzznerd *.dc.html (verbatim)
 *   - blog/posts.js (54 posts) for /blog and /blog/<slug>/
 * Output: static .html at the repo root (clean routes), /assets copied separately.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "node-html-parser";
import { imageSize } from "image-size";

const DC = "/tmp/claude-0/-home-user-astra-start/921c426a-a779-5f68-a225-af3123476db7/scratchpad/zip7/design_handoff_buzznerd_site";
const ROOT = "/home/user/astra-start";

/**
 * Several local images (mascot/character illustrations, mainly) render with
 * CSS `width:100%;height:auto` and no width/height HTML attributes — so the
 * browser has no intrinsic aspect ratio to reserve space with until the image
 * downloads, which Lighthouse flags as a layout-shift (CLS) culprit. Adding
 * the real width/height attributes fixes this without changing how anything
 * renders (the CSS still governs final size; the attributes only seed the
 * browser's initial space reservation).
 */
function addMissingImageDimensions(html) {
  return html.replace(
    /<img\s+((?:(?!width=|height=)[^>])*?)src="(\/assets\/[^"]+\.(?:png|jpe?g))"((?:(?!width=|height=)[^>])*?)>/gi,
    (full, pre, src, post) => {
      if (/\bwidth=/.test(pre) || /\bwidth=/.test(post) || /\bheight=/.test(pre) || /\bheight=/.test(post)) {
        return full; // already has explicit dimensions somewhere in the tag
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

// Fonts are SELF-HOSTED (assets/fonts/*.woff2, copied by scripts/setup-fonts.mjs)
// — no fonts.googleapis.com / fonts.gstatic.com request at all, which is the
// only way to fully clear Lighthouse's render-blocking + critical-chain font
// flags (the media=print + display=optional Google Fonts approach still left
// the cross-origin css2 -> woff2 chain in the LCP dependency tree).
//   - Variable wght woff2 covers every weight the design uses.
//   - Preloaded same-origin (crossorigin required even same-origin — fonts
//     are always CORS-fetched) so they arrive ASAP.
//   - font-display:optional guarantees zero layout shift (the browser never
//     swaps the font in after first paint), so it can't reintroduce CLS.
const FONTS = `<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/bricolage-grotesque.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/plus-jakarta-sans.woff2" crossorigin>
<style>
@font-face{font-family:'Bricolage Grotesque';font-style:normal;font-weight:600 800;font-display:optional;src:url(/assets/fonts/bricolage-grotesque.woff2) format('woff2')}
@font-face{font-family:'Plus Jakarta Sans';font-style:normal;font-weight:400 700;font-display:optional;src:url(/assets/fonts/plus-jakarta-sans.woff2) format('woff2')}
</style>`;

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
const ASSETS_DIR = join(ROOT, "assets");

// scripts/optimize-images.mjs converts several assets to a different format
// in place (photographic PNGs -> JPEG, logos/hero/header-logo -> WebP) for
// proper compression. Rather than hardcode which files changed extension,
// detect it from the filesystem: if assets/X.webp (or .jpg) exists but the
// path's original extension doesn't, rewrite the reference. Self-healing
// whenever optimize-images.mjs's conversion list changes.
function rewriteAssets(html) {
  html = html
    .replace(/(src=")assets\//g, "$1/assets/")
    .replace(/(srcset=")assets\//g, "$1/assets/")
    .replace(/((?:data-before|data-after)=")assets\//g, "$1/assets/");
  html = html.replace(
    /(\/assets\/[\w./-]+?)\.(png|jpe?g)\b/g,
    (full, base, ext) => {
      if (existsSync(join(ROOT, `${base}.${ext}`))) return full; // original still present
      for (const newExt of ["webp", "jpg"]) {
        if (existsSync(join(ROOT, `${base}.${newExt}`))) return `${base}.${newExt}`;
      }
      return full;
    },
  );
  return html;
}

/**
 * Before/after photo pairs (Home + Solutions) get real responsive images:
 * scripts/optimize-images.mjs generates <name>-640w.webp and <name>-1000w.webp
 * for each. A single desktop-sized (1000w) image was still "larger than
 * needed" on PageSpeed's mobile run, which renders these at ~623px CSS width,
 * not the ~900px desktop container width — so mobile needs to fetch the
 * smaller variant via srcset, not just a smaller *file* of the same shot.
 */
const RESPONSIVE_PHOTOS = [
  "before-frontqtr",
  "before-frontqtr2",
  "before-side",
  "after-frontqtr",
  "after-frontqtr2",
  "after-side",
];
const RESPONSIVE_SIZES = '(max-width: 768px) 92vw, 900px';
function srcsetFor(base) {
  return `/assets/photos/${base}-640w.webp 640w, /assets/photos/${base}-1000w.webp 1000w`;
}
function addResponsivePhotos(html) {
  for (const base of RESPONSIVE_PHOTOS) {
    if (!existsSync(join(ASSETS_DIR, "photos", `${base}-1000w.webp`))) continue;
    const fallback = `/assets/photos/${base}-1000w.webp`;
    const srcset = srcsetFor(base);
    // Main slider / illustration <img> tags (data-ba-before/data-ba-after or plain <img>).
    html = html.replace(
      new RegExp(`(<img\\s[^>]*)src="/assets/photos/${base}\\.(?:jpg|jpeg|png)"([^>]*>)`, "g"),
      (full, pre, post) => {
        if (/srcset=/.test(pre) || /srcset=/.test(post)) return full;
        return `${pre}src="${fallback}" srcset="${srcset}" sizes="${RESPONSIVE_SIZES}"${post}`;
      },
    );
    // Thumbnail-picker buttons: carry the srcset alongside data-before/data-after
    // so assets/site.js can keep the swapped-in image responsive too.
    html = html.replace(
      new RegExp(`data-(before|after)="/assets/photos/${base}\\.(?:jpg|jpeg|png)"`, "g"),
      (full, which) => `data-${which}="${fallback}" data-${which}-srcset="${srcset}"`,
    );
  }
  return html;
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
      // Drop the design's own Google Fonts <link>s (a render-blocking
      // stylesheet + preconnects) — fonts are self-hosted now (see FONTS),
      // so these external requests would only re-add the render-blocking flag.
      const href = n.getAttribute("href") || "";
      if (t === "link" && /fonts\.(googleapis|gstatic)\.com/.test(href)) continue;
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
  html = addResponsivePhotos(html);
  html = addMissingImageDimensions(html);
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
<link rel="icon" href="/assets/favicon.png" type="image/png">
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
