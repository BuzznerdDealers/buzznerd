import dealer from "../dealer.config.json";

/**
 * Cloudflare Worker entry point.
 *
 * Only /inventory/* is handled here (see `run_worker_first` in wrangler.toml):
 * those requests are proxied to the Remix commerce app so the dealer's domain
 * can serve both the static brand site and the dynamic inventory/checkout under
 * one URL. Everything else is served from the static Astro build via ASSETS.
 *
 * Do not add brand-site routing logic here — brand pages are static assets.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/inventory")) {
      const remixUrl = new URL(url.pathname + url.search, dealer.remixOrigin);

      const headers = new Headers(request.headers);
      headers.set("X-Dealer-Domain", url.hostname);
      headers.set("X-Dealer-Slug", dealer.slug);

      return fetch(remixUrl.toString(), {
        method: request.method,
        headers,
        body:
          request.method !== "GET" && request.method !== "HEAD"
            ? request.body
            : undefined,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
