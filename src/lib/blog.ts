import { getCollection } from "astro:content";

/**
 * Posts shown per page on /blog (and /blog/page/N).
 * Kept low so the example content demonstrates pagination; raise it for
 * production (9–12 is typical). New posts in content/blog/*.md appear
 * automatically — nothing else to wire up.
 */
export const POSTS_PER_PAGE = 9;

/** All non-draft posts, newest first. */
export async function getSortedPosts() {
  return (await getCollection("blog"))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** URL for a given page number: page 1 lives at /blog, the rest at /blog/page/N. */
export function blogPageHref(page: number): string {
  return page <= 1 ? "/blog" : `/blog/page/${page}`;
}
