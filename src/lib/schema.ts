import { dealer, siteUrl, absoluteUrl, socialLinks } from "../config";

type Json = Record<string, unknown>;

/**
 * Organization / LocalBusiness node. Uses the businessType from dealer.config
 * (e.g. AutoDealer) so search engines and AI answer engines understand exactly
 * what kind of business this is. Emitted on every page.
 */
export function organizationSchema(): Json {
  const c = dealer.contact ?? {};
  const node: Json = {
    "@context": "https://schema.org",
    "@type": dealer.businessType || "Organization",
    "@id": `${siteUrl}/#organization`,
    name: dealer.name,
    url: siteUrl,
    description: dealer.seo.defaultDescription,
    logo: absoluteUrl(dealer.brand.logo || "/logo.svg"),
    image: absoluteUrl(dealer.seo.ogImage || "/og-default.jpg"),
  };

  const sameAs = socialLinks().map((s) => s.url);
  if (sameAs.length) node.sameAs = sameAs;

  if (c.phone) {
    node.telephone = c.phone;
    node.contactPoint = {
      "@type": "ContactPoint",
      telephone: c.phone,
      email: c.email || undefined,
      contactType: "sales",
    };
  }
  if (c.email) node.email = c.email;

  if (c.address || c.city) {
    node.address = {
      "@type": "PostalAddress",
      streetAddress: c.address || undefined,
      addressLocality: c.city || undefined,
      addressRegion: c.state || undefined,
      postalCode: c.zip || undefined,
      addressCountry: c.country || "US",
    };
  }

  return node;
}

/** WebSite node with SearchAction, enabling sitelinks search box. */
export function websiteSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: dealer.name,
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/inventory/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/** WebPage node linking back to the site + org. */
export function webPageSchema(opts: {
  path: string;
  title: string;
  description?: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absoluteUrl(opts.path)}#webpage`,
    url: absoluteUrl(opts.path),
    name: opts.title,
    description: opts.description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#organization` },
  };
}

/** BreadcrumbList from an ordered list of {name, path}. */
export function breadcrumbSchema(
  crumbs: { name: string; path: string }[],
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/** FAQPage node — built automatically from any `faq` section on a page. */
export function faqSchema(
  items: { question: string; answer: string }[],
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** BlogPosting node for a single blog article. */
export function blogPostingSchema(opts: {
  path: string;
  title: string;
  description: string;
  date: Date;
  author: string;
  image?: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${absoluteUrl(opts.path)}#article`,
    headline: opts.title,
    description: opts.description,
    datePublished: opts.date.toISOString(),
    author: { "@type": "Person", name: opts.author },
    publisher: { "@id": `${siteUrl}/#organization` },
    image: opts.image ? absoluteUrl(opts.image) : undefined,
    mainEntityOfPage: absoluteUrl(opts.path),
  };
}
