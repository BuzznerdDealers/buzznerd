# BuzzNerd Dealer Site Template

A flexible, content-driven **Astro** template for dealer brand sites, deployed to
**Cloudflare Workers** (with Static Assets). Clone it per dealer, fill in
`dealer.config.json`, edit `content/`, and ship.

- **No CMS, no database.** Content lives as flat files in Git (JSON + Markdown).
- **Flexible pages.** Every page is composed from reusable sections — reorder,
  add, or remove sections by editing a JSON array.
- **SEO + AIO built in.** Meta tags, Open Graph, canonical, JSON-LD structured
  data, `sitemap.xml`, `robots.txt`, and `llms.txt` are all generated for you.
- **One URL for everything.** A Cloudflare Worker proxies `/inventory/*` to the
  Remix commerce app; everything else is static.

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
5. **Deploy** — see below.

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
  index.ts                  Cloudflare Worker (inventory proxy)
wrangler.toml               Worker + static assets config
.nvmrc                      Node version for the Cloudflare build (22)
```

## Deployment

Deploys are handled by **Cloudflare's Git integration** (connect the repo to a
Cloudflare Workers project). No GitHub Actions workflow is used.

- **Push to any branch except the production branch** → isolated **preview** deploy.
- **Merge a PR into the production branch (`main`)** → **production** deploy to
  the custom domain.
- Set the production branch to `main` in the Cloudflare project settings, and
  branch-protect `main` (require a PR) so production never changes from a direct push.

### Cloudflare build settings

| Setting | Value |
| ------- | ----- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node version | 22 (from `.nvmrc`; or set `NODE_VERSION=22`) |

Set `name` in `wrangler.toml` to a unique per-dealer value (e.g. `dealer-abc`).

## Adding a new section type

1. Create `src/components/sections/MySection.astro`.
2. Register it in `src/components/SectionRenderer.astro`.
3. Use it by adding `{ "type": "mySection", ... }` to a page's `sections` array.

See `CLAUDE.md` for the full section reference and content schemas.
