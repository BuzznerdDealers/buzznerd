export default {
    async fetch(request: Request, env: any): Promise<Response> {
      const url = new URL(request.url);
  
      // Proxy /inventory/* to Remix on Fly.io
      if (url.pathname.startsWith('/inventory')) {
        const remixUrl = new URL(url.pathname + url.search, 'https://a1.buzznerdrv.com/');
        const headers = new Headers(request.headers);
        headers.set('X-Dealer-Domain', url.hostname);
        return fetch(remixUrl.toString(), {
          method: request.method,
          headers,
          body: request.body,
        });
      }
  
      // Everything else: serve static assets (your Astro build)
      return env.ASSETS.fetch(request);
    }
  };