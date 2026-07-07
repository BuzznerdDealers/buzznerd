import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Shared SEO block that any page or blog post can override.
 * Everything is optional — falls back to dealer.config.json defaults.
 */
const seoSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    noindex: z.boolean().optional(),
    canonical: z.string().optional(),
  })
  .optional();

/**
 * A section is any block on a page. We only require `type` (which maps to a
 * component in src/components/sections). Every other field is passed straight
 * through to that component, so new section fields never require a schema
 * change. This is what keeps the template flexible across very different sites.
 */
const sectionSchema = z
  .object({
    type: z.string(),
  })
  .passthrough();

/**
 * Pages are composed from an ordered list of sections. Add/remove/reorder
 * sections in content/pages/*.json — no code changes needed for layout changes.
 */
const pages = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./content/pages" }),
  schema: z.object({
    title: z.string(),
    draft: z.boolean().default(false),
    seo: seoSchema,
    /** Optional structured-data hints (e.g. FAQ, breadcrumb) — see lib/schema.ts */
    sections: z.array(sectionSchema).default([]),
  }),
});

/**
 * Blog posts use strict frontmatter so a missing required field fails the
 * build instead of shipping a broken page.
 */
const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      author: z.string().default("Staff"),
      excerpt: z.string(),
      coverImage: image().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      seo: seoSchema,
    }),
});

export const collections = { pages, blog };
