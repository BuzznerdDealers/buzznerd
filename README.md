# BuzzNerd Dealer Site Template

A flexible, content-driven **Astro** template for dealer brand sites, deployed to
**Vercel**. Clone it per dealer, fill in `dealer.config.json`, edit `content/`,
and ship.

- **No CMS, no database.** Content lives as flat files in Git (JSON + Markdown).
- **Flexible pages.** Every page is composed from reusable sections — reorder,
  add, or remove sections by editing a JSON array.
- **SEO + AIO built in.** Meta tags, Open Graph, canonical, JSON-LD structured
  data, `sitemap.xml`, `robots.txt`, and `llms.txt` are all generated for you.
- **One URL for everything.** Vercel rewrites `/inventory/*` to the Remix
  commerce app on Fly.io; everything else is static Astro. Remix pulls brand
  header/footer partials so inventory looks consistent with the brand site.

## Quick start (new dealer)

1. **Create a repo from this template** (GitHub → "Use this template").
2. **Fill in `dealer.config.json`** — name, slug, domain, colors, logo, contact,
   SEO, and `remixOrigin`. This is the only file that is truly per-dealer.
3. **Edit content** in `content/` — `nav.json`, `footer.json`, `site.json`, and
   the pages under `content/pages/`.
4. **Install & run locally:**
   ```bash
   npm install
   npm run dev        # http://localhost:4321
   ```
5. **Deploy** — connect the repo to Vercel (see below).

## Editing with Claude Code

Open the repo and describe changes in plain English, e.g.:

- "Change the hero headline on the homepage to …"
- "Add a Financing page and put it in the nav after Services."
- "Add a blog post about our summer service special."
- "Change the primary brand color to #2d5a8e."

Claude Code reads `CLAUDE.md` automatically and knows exactly which file to edit
and how to ship it safely (feature branch → PR → preview → merge). It will
**never** push to `main`.

## Project structure

```
dealer.config.json          Dealer identity, brand, contact, SEO (edit per dealer)
dealer.config.schema.json   JSON Schema for the config (validation + autocomplete)
vercel.json                 Generated from dealer.config (inventory rewrite) — do not hand-edit
content/
  nav.json                  Header navigation (+ dropdowns, CTA)
  footer.json               Footer columns
  site.json                 Announcement bar + top utility bar
  pages/*.json              One file per page, composed of sections
  blog/*.md                 Blog posts (validated frontmatter)
src/
  config.ts                 Typed loader/helpers for dealer.config.json
  content.config.ts         Content collection schemas (pages, blog)
  layouts/                  BaseLayout (SEO + brand tokens), PageLayout
  components/
    Header.astro, Footer.astro, Seo.astro, JsonLd.astro, Section.astro …
    sections/               The flexible section library (hero, features, faq …)
  lib/schema.ts             JSON-LD (structured data) builders
  pages/                    Routes: index, [...slug], blog, robots.txt, llms.txt
  components/Head.astro     <head> injections (analytics, pixels) — also at /partials/head.html
  pages/partials/           head/header/footer/CSS/JS fragments for Remix chrome
  styles/chrome.css         Chrome-only CSS, self-contained (also at /partials/styles.css)
  scripts/chrome.js         Mobile nav / chrome JS (also at /partials/scripts.js)
scripts/write-vercel-json.mjs  Regenerates vercel.json from remixOrigin
```

## Inventory + brand chrome (how it works)

1. **Static brand site** on Vercel serves marketing pages and five chrome partials:
   - `/partials/head.html` — dealer `<head>` injections (analytics, pixels, meta)
   - `/partials/header.html` — header/topbar/nav markup
   - `/partials/footer.html` — footer markup (+ any floating button / widget)
   - `/partials/styles.css` — self-contained chrome CSS + brand tokens
   - `/partials/scripts.js` — mobile nav (and any other chrome JS)
2. **`vercel.json`** rewrites `/inventory/*` to `dealer.remixOrigin` (Remix on Fly).
   `/partials/*` is **not** rewritten — Remix fetches those from the Vercel CDN.
3. **Remix** (SaaS, one-time change) looks up the dealer’s `brandSiteUrl`, fetches
   and caches the partials, and **embeds them server-side**: `head.html` into
   `<head>`, `header.html`/`footer.html` around its inventory content, plus the
   CSS `<link>` and JS `<script>`. Server-embedding (not client `innerHTML`) is
   required so inline analytics/pixel scripts run and pages stay SEO-friendly.

## Deployment

Deploys are handled by **Vercel’s Git integration** (connect the GitHub repo to a
Vercel project). No GitHub Actions workflow is required.

- **Push to any branch except the production branch** → isolated **preview** deploy.
- **Merge a PR into the production branch (`main`)** → **production** deploy to
  the custom domain.
- Set the production branch to `main` in Vercel, and branch-protect `main`
  (require a PR) so production never changes from a direct push.

### Vercel project settings

| Setting | Value |
| ------- | ----- |
| Framework Preset | Other |
| Build command | `npm run build` (runs `prebuild` → writes `vercel.json`) |
| Output directory | `dist` |
| Node version | 22 (from `.nvmrc`) |

`vercel.json` is generated from `dealer.config.json` on every build so the
inventory rewrite always points at this dealer’s `remixOrigin`. Do not hand-edit
it — change `remixOrigin` in `dealer.config.json` instead.

Optional: add a Vercel Deploy Hook / notification that calls the Remix cache
invalidation endpoint when the brand site redeploys, so header/footer updates
show up immediately on inventory pages.

## Adding a new section type

1. Create `src/components/sections/MySection.astro`.
2. Register it in `src/components/SectionRenderer.astro`.
3. Use it by adding `{ "type": "mySection", ... }` to a page's `sections` array.

See `CLAUDE.md` for the full section reference and content schemas.
