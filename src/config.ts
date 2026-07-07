import dealerConfig from "../dealer.config.json";

export type DealerConfig = typeof dealerConfig;

/**
 * The single source of truth for dealer identity, branding, contact and SEO.
 * Import this anywhere instead of hardcoding dealer-specific values.
 */
export const dealer = dealerConfig;

/** Absolute site URL with no trailing slash. */
export const siteUrl: string = dealer.url.replace(/\/$/, "");

/** Build an absolute URL for a given path. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, siteUrl + "/").toString();
}

/** Apply the configured title template to a page title. */
export function formatTitle(title?: string): string {
  if (!title) return dealer.seo.defaultTitle;
  const template = dealer.seo.titleTemplate || "%s";
  return template.includes("%s") ? template.replace("%s", title) : title;
}

/** Non-empty social links keyed by network. */
export function socialLinks(): { network: string; url: string }[] {
  const social = (dealer.social ?? {}) as Record<string, string>;
  return Object.entries(social)
    .filter(([, url]) => Boolean(url))
    .map(([network, url]) => ({ network, url }));
}
