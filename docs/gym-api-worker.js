// Cloudflare Worker — Gym Tracker API Proxy
// Proxies all requests to the VPS backend at http://77.91.114.53:8000
//
// Deploy: Cloudflare Dashboard → Workers → Create → Paste this code
// Then set VITE_API_URL on Vercel to this worker's URL

const BACKEND_URL = 'http://77.91.114.53:8000';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
      });

      // Clone response to modify headers
      const newResponse = new Response(response.body, response);

      // Add CORS headers
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-Init-Data, X-Telegram-User-Id');

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Init-Data, X-Telegram-User-Id',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      return newResponse;
    } catch (err) {
      return new Response(JSON.stringify({
        detail: `Proxy error: ${err.message}`
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
};
