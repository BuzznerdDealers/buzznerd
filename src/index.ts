export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/inventory')) {
      const remixUrl = new URL(
        url.pathname + url.search,
        'https://a1.buzznerdrv.com/'
      );

      const headers = new Headers(request.headers);
      headers.set('X-Dealer-Domain', url.hostname);

      return fetch(remixUrl.toString(), {
        method: request.method,
        headers,
        body: request.method !== 'GET' && request.method !== 'HEAD'
          ? request.body
          : undefined,
      });
    }

    return env.ASSETS.fetch(request);
  },
};