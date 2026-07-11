# Buzznerd.com — static marketing site

Standard **static HTML/CSS/JS** implementation of the Buzznerd.com marketing site
(AI solutions for truck, trailer, and equipment dealerships). No framework, no
runtime build step — every page is plain HTML with inline styles, ported 1:1 from
the design handoff (`Buzznerd *.dc.html` → the markup inside `<x-dc>`), with the
`<helmet>` content baked verbatim into each `<head>`.

## Structure

```
/index.html                      # Home (/)
/<route>/index.html              # 15 static pages (see routes below)
/blog/index.html                 # blog index (category chips + featured + grid)
/blog/<slug>/index.html          # 54 posts, per-post <head> + BlogPosting JSON-LD
/assets/                         # images, logos, mascot art + site.js
/sitemap.xml /robots.txt /llms.txt
/vercel.json                     # static host: cleanUrls + 301 redirect map
```

Routes: `/`, `/solutions`, `/products`, `/services`, `/ai-websites`,
`/ai-ecommerce`, `/ai-platform`, `/ai-driven-marketing`,
`/content-restructuring-for-aio`, `/custom-workflows-integrations`,
`/ai-presence-score`, `/about-us`, `/careers`, `/contact`, `/blog`,
`/blog/<slug>`, `/privacy`, `/terms`.

## Behavior (vanilla JS — `/assets/site.js`)

- FAQ accordions are native `<details>/<summary>` (+ CSS `+`/`−` toggle).
- Mega-menus open on hover (CSS only).
- Demo/contact forms compose a `mailto:info@buzznerd.com` message and show an
  inline success card.
- Blog category chips filter the post grid.
- In-page `#anchor` links smooth-scroll with a sticky-header offset.

The prototype-only view-switcher pill and `support.js` are dropped; the design's
`@media(max-width:768px)` responsive rules are preserved inline.

## Deploy

Fully static — serve the repo root as-is. `vercel.json` enables clean URLs and the
legacy-URL 301 redirects (from the handoff `deploy/_redirects`).

## Authoring scripts (`/scripts`, require the design handoff bundle)

These regenerate the HTML from the `.dc.html` design files; the built HTML is what
ships, so they are not needed to deploy.

- `scripts/extract-dc.mjs` — renders each `.dc.html` with a React runtime (what the
  design tool provides) so `<sc-if>/<sc-for>/{{…}}` resolve, then captures the
  resolved DOM.
- `scripts/build-site.mjs` — assembles the 16 static pages (verbatim head + cleaned
  body; rewrites design-file links → routes and `assets/` → `/assets/`).
- `scripts/build-blog.mjs` — generates `/blog` and the 54 `/blog/<slug>/` pages from
  `blog/posts.js`, baking each post's title, canonical, OG/Twitter, and
  BlogPosting + Breadcrumb JSON-LD into its `<head>`.
