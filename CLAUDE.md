# BuzzNerd Dealer Site Template — Claude Code Instructions

This repo is a **reusable template** for building dealer brand sites. A new repo
is created from it for each dealer, and **you (Claude Code) build that dealer's
site from the designer's input** by writing content into flat files. It's an
Astro static site deployed to Cloudflare Workers (with Static Assets). Read this
whole file before making changes.

## How to think about this template

- **Everything in `content/` and `dealer.config.json` right now is EXAMPLE
  content.** It shows the structure and every capability available to you. It is
  a **guideline, not a requirement.** Nothing here is forced — replace it,
  reorder it, delete it, or extend it to match the design you're given.
- **The designer provides the real data and design.** Dealer name, address,
  phone, colors, logo, pages, sections, copy — these come from the designer's
  input. **Do not invent or keep placeholder business data.** Use what you're
  given; leave a field empty or a clear `TODO` placeholder when it isn't
  provided yet, and tell the human what's missing.
- **Your job is to translate the design into content files**, not to hardcode
  into components. Text, links, images, sections → JSON/Markdown. Structure and
  styling that don't exist yet → new/edited components (see below).

## Starting a new site from this template

1. **Understand the design input** (a mockup, a description, a reference site,
   brand colors, the list of pages/sections the designer wants).
2. **Fill in `dealer.config.json`** with the real identity: name, slug, domain,
   `url`, brand colors, fonts, logo, contact details, `businessType`, SEO
   defaults, and `remixOrigin`. This drives branding, SEO, and structured data
   everywhere. Only set values you actually have.
3. **Build the pages** by editing/creating `content/pages/*.json`. Compose each
   page from the section library (below). Match the designer's layout by
   choosing, ordering, and configuring sections. Replace the example pages
   (`home`, `about`, `services`, `contact`) rather than leaving example copy.
4. **Set the chrome**: `content/nav.json` (menu), `content/footer.json`
   (footer), `content/site.json` (top bar / announcement). Turn off anything the
   design doesn't use (e.g. set `topbar.enabled: false`).
5. **If a section type the design needs doesn't exist, create it** as a new
   component and register it (see "Adding a new section type"). Never hardcode
   one-off content into a page component.
6. **Run `npm run build`** and fix any schema errors before committing.

## Golden rules (do not break these)

1. **NEVER push to `main`. NEVER commit directly to `main`.** Once a dealer's
   site is live, `main` is wired to their production domain. Production only
   changes when a human merges a Pull Request.
2. **Do all work on a feature branch**, then open a Pull Request into `main`.
   Pushing a branch or opening a PR triggers an isolated **preview deploy** —
   that's where changes get reviewed. See "Workflow" below.
3. **Put content in flat files, never hardcode it in components.** Dealer name,
   phone, colors, copy, links → `dealer.config.json` or `content/*`. Components
   read from those files.
4. **Never edit `dist/`, `.astro/`, or `node_modules/`.** They are generated.
5. **Never change `src/index.ts` (the Worker) routing** unless explicitly asked.
   `/inventory/*` is proxied to Remix and must keep working.
6. Prefer **editing content** over editing components. Most requests are content
   changes, not code changes.

## Workflow (how every change ships)

```
1. git checkout -b change/<short-description>     # branch off main
2. make the edit (usually a content/*.json file)
3. npm run build                                  # must pass locally
4. git commit + git push -u origin <branch>       # triggers a PREVIEW deploy
5. Open a PR into main. Share the preview URL for review.
6. A human reviews and merges the PR  -> PRODUCTION deploys automatically.
```

- Push to **any branch except main** = preview URL. Safe. Does not affect prod.
- Merge PR into **main** = production. This is the only path to the live site.
- If asked to "publish" or "go live", that means **open a PR** (and only merge
  it if you've been explicitly authorized). It never means push to `main`.

## What this project is

- **Astro** static site generator. Reads flat files (`content/`) and outputs
  pure HTML/CSS/JS at build time. No runtime server for brand pages.
- **Content-driven & config-driven.** Pages are composed from an ordered list of
  reusable "sections". Layout changes = editing a JSON array, not writing code.
- **Cloudflare Worker** (`src/index.ts`) proxies only `/inventory/*` to the
  Remix commerce app so the domain serves both the static site and dynamic
  inventory/checkout under one URL. This part is provided — don't modify it.

## File map — where to change what

| I want to change...                          | Edit this file |
| -------------------------------------------- | -------------- |
| Dealer name, logo, colors, fonts, domain, SEO defaults | `dealer.config.json` |
| Announcement bar / top utility bar           | `content/site.json` |
| Main navigation menu (+ dropdowns, CTA)      | `content/nav.json` |
| Footer columns and links                     | `content/footer.json` |
| Content/sections of the homepage             | `content/pages/home.json` |
| An existing page's content                   | `content/pages/<page>.json` |
| Add a brand-new page                         | Create `content/pages/<slug>.json` (route is auto-created at `/<slug>`) + add to `content/nav.json` |
| Add a blog post                              | Create `content/blog/YYYY-MM-DD-slug.md` |
| Add a new *type* of section                  | Create `src/components/sections/<Name>.astro` + register in `src/components/SectionRenderer.astro` |
| Global styles / design tokens                | `src/styles/global.css` |
| Inventory proxy / widget origin              | `dealer.config.json` (`remixOrigin`) — not the Worker |

> Adding a page is just adding a JSON file to `content/pages/`. The route
> `/<filename>` is generated automatically. Only `home.json` is special (it
> renders at `/`).

## The section system (this is what makes the template flexible)

A page is `{ title, seo, sections: [...] }`. Each section is an object with a
`type` and whatever fields that section needs. Sections render top-to-bottom.
To build or restructure a page, choose/reorder/add/remove objects in the
`sections` array. The section schema is permissive (`passthrough`), so you can
add fields a component supports without touching any schema.

Available section `type`s (all optional; use any, in any order, repeatable):

| type          | Purpose | Key fields |
| ------------- | ------- | ---------- |
| `hero`        | Top banner | `headline`, `subheadline`, `eyebrow`, `layout` ("split"\|"center"\|"image"), `backgroundImage`, `ctas[]`, `highlights[]` |
| `pageHeader`  | Simple page title band | `eyebrow`, `title`, `subheadline`, `ctas[]` |
| `richText`    | Prose block | `body` (\n\n between paragraphs) or `html`, `title`, `container` |
| `features`    | Card grid | `title`, `columns` (2-4), `items[]` `{title, body, icon, href}` |
| `split`       | Text + image side-by-side | `title`, `body`, `image`, `imageSide` ("left"\|"right"), `ctas[]` |
| `stats`       | Big number highlights | `items[]` `{value, label}` |
| `steps`       | Numbered process | `title`, `items[]` `{title, body}` |
| `logos`       | Brand/OEM logo row | `title`, `items[]` `{name, logo, href}` |
| `testimonials`| Customer quotes | `title`, `items[]` `{quote, author, role}` |
| `gallery`     | Image grid | `columns`, `items[]` `{image, alt, caption}` |
| `faq`         | Accordion (also emits FAQ rich-result schema) | `title`, `items[]` `{question, answer}` |
| `locations`   | Location cards | `title`, `items[]` `{name, address, city, state, zip, phone, hours, mapUrl}` |
| `cta`         | Call-to-action band | `title`, `body`, `ctas[]` |
| `contact`     | Contact form + details | `showForm`, `showDetails` |
| `inventory`   | Remix inventory widget slot | `title`, `widget` ("inventory-scroller"\|"search"), `collection` |

Common optional fields on most sections: `background` ("default"\|"muted"\|
"dark"\|"primary"), `eyebrow`, `title`, `description`, `id` (for anchor links).

A `cta` object is `{ "label": "...", "href": "...", "style": "primary" | "secondary" | "ghost" }`.

Icons available for `features`: `truck`, `wrench`, `gear`, `leaf`,
`shield`, `bolt`, `dollar`, `phone`, `check`. Add more in `src/components/Icon.astro`.

This list is the **starting library, not a limit.** If the design calls for
something not here, build a new section (below) rather than forcing the design
into an existing one.

### Example: add an FAQ section to a page

Add this object to the page's `sections` array in `content/pages/<page>.json`:

```json
{
  "type": "faq",
  "title": "Frequently asked questions",
  "items": [
    { "question": "Do you deliver?", "answer": "Yes, nationwide." }
  ]
}
```

## Adding a new section type

When the design needs a layout the library doesn't have:

1. Create `src/components/sections/MySection.astro`. Read your fields from
   `Astro.props`. Wrap content in `../Section.astro` to inherit the standard
   `background`/`container`/header handling, or render freely for full control.
2. Register it in `src/components/SectionRenderer.astro` (one import + one line
   in the `registry`).
3. Use it from content: `{ "type": "mySection", ... }` in a page's `sections`.

Keep all real text/data in the content JSON — the component defines layout only.

## Content schemas

### dealer.config.json
Single source of truth for identity, branding, contact, and SEO. Its shape is
validated by `dealer.config.schema.json`. Brand colors (`brand.primaryColor`,
`brand.accentColor`) are injected as CSS variables — components use
`var(--primary)`, `var(--accent)`, never hardcoded hex. Fill only the values you
actually have from the designer.

### Blog frontmatter (`content/blog/*.md`)
```yaml
---
title: string            # required
date: YYYY-MM-DD          # required
author: string
excerpt: string           # required, shown in listing + SEO
coverImage: /blog/x.jpg   # optional, path under public/ or src (see note)
tags: [string]
draft: false              # true hides it from build
---
```
Schemas are validated at build time (`src/content.config.ts`). A missing
required field **fails the build** — it never ships a broken page.

## SEO & AIO (already automated — keep it that way)

- Every page gets `<title>`, meta description, canonical, Open Graph, and
  Twitter tags via `src/components/Seo.astro`. Override per page with the
  `seo` block in the page JSON (`title`, `description`, `ogImage`, `noindex`).
- **Structured data (JSON-LD)** is emitted automatically: Organization/
  LocalBusiness + WebSite on every page, WebPage + BreadcrumbList per page,
  FAQPage from any `faq` section, BlogPosting on posts. See `src/lib/schema.ts`.
  It's driven by `dealer.config.json`, so filling that in accurately improves
  both search and AI-answer-engine results.
- `sitemap-index.xml`, `robots.txt`, and **`llms.txt`** (AI answer-engine
  summary) are generated at build time from config + content. When you add
  pages/posts, they appear automatically. Don't hand-maintain these.
- Keep headings semantic (one `<h1>` per page — heroes/pageHeaders provide it).

## Commands

```bash
npm install        # install deps
npm run dev        # local dev server at http://localhost:4321
npm run build      # production build into dist/ (run before committing)
npm run preview    # preview the built static output
npx wrangler dev   # run the Worker + static assets together (tests /inventory proxy)
```

## Do / Don't quick reference

- DO treat existing `content/` and `dealer.config.json` as examples to replace.
- DO put all text, links, sections, contact info, nav, footer in flat files.
- DO create `content/pages/<slug>.json` for new pages and add them to nav.
- DO build a new section component when the design needs one.
- DO run `npm run build` before committing and fix any schema errors it reports.
- DON'T invent dealer data — use the designer's input; leave TODOs for gaps.
- DON'T push/commit to `main`. DON'T merge your own PRs unless told to.
- DON'T hardcode dealer data or one-off copy inside `src/components/*`.
- DON'T edit `dist/`, `.astro/`, the Worker routing, or generated files.
