// Cloudflare Worker — Telegram Bot API Proxy
// Deploy: https://dash.cloudflare.com → Workers → Create → Paste this code
//
// Usage: Replace api.telegram.org with your worker URL in bot config
// Example: https://your-worker.username.workers.dev/bot<TOKEN>/getMe

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Proxy all requests to api.telegram.org
    const telegramUrl = `https://api.telegram.org${url.pathname}${url.search}`;
    
    try {
      const response = await fetch(telegramUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
      
      // Clone response to modify headers
      const newResponse = new Response(response.body, response);
      
      // Remove restrictive headers
      newResponse.headers.delete('content-security-policy');
      newResponse.headers.delete('x-frame-options');
      
      // Add CORS headers for browser-based clients
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', '*');
      
      return newResponse;
    } catch (err) {
      return new Response(JSON.stringify({
        ok: false,
        error: err.message
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
