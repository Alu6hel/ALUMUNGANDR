// Alumungandr Edge Gateway & API Router
// Bridges Cloudflare Workers + Static Assets with /api endpoints and zero-tracking services

import * as qa from './functions/api/qa.js';
import * as feedback from './functions/api/feedback.js';
import * as clip from './functions/api/clip.js';
import * as stats from './functions/api/stats.js';
import * as timecapsule from './functions/api/timecapsule.js';
import * as ama from './functions/api/ama.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Route /api/qa (AI Reality Matrix & Technical Q&A Engine)
    if (url.pathname === '/api/qa') {
      if (method === 'POST' && qa.onRequestPost) return qa.onRequestPost({ request, env, ctx });
      if (method === 'GET' && qa.onRequestGet) return qa.onRequestGet({ request, env, ctx });
    }

    // Route /api/feedback (Zero-telemetry feedback & developer modal)
    if (url.pathname === '/api/feedback') {
      if (method === 'POST' && feedback.onRequestPost) return feedback.onRequestPost({ request, env, ctx });
      if (method === 'GET' && feedback.onRequestGet) return feedback.onRequestGet({ request, env, ctx });
    }

    // Route /api/clip (Universal clipboard)
    if (url.pathname === '/api/clip') {
      if (method === 'POST' && clip.onRequestPost) return clip.onRequestPost({ request, env, ctx });
      if (method === 'GET' && clip.onRequestGet) return clip.onRequestGet({ request, env, ctx });
    }

    // Route /api/stats (Speedtest telemetry & leaderboard)
    if (url.pathname === '/api/stats') {
      if (method === 'POST' && stats.onRequestPost) return stats.onRequestPost({ request, env, ctx });
      if (method === 'GET' && stats.onRequestGet) return stats.onRequestGet({ request, env, ctx });
    }

    // Route /api/timecapsule (Encrypted time capsule)
    if (url.pathname === '/api/timecapsule') {
      if (method === 'POST' && timecapsule.onRequestPost) return timecapsule.onRequestPost({ request, env, ctx });
      if (method === 'GET' && timecapsule.onRequestGet) return timecapsule.onRequestGet({ request, env, ctx });
    }

    // Route /api/ama (Legacy fallback)
    if (url.pathname === '/api/ama') {
      if (method === 'POST' && ama.onRequestPost) return ama.onRequestPost({ request, env, ctx });
      if (method === 'GET' && ama.onRequestGet) return ama.onRequestGet({ request, env, ctx });
    }

    // 301 Permanent Redirects for retired pages
    if (url.pathname === '/uses' || url.pathname === '/uses.html' || url.pathname === '/ama' || url.pathname === '/ama.html') {
      return Response.redirect(new URL('/', request.url).toString(), 301);
    }

    // Fall back to Cloudflare Static Assets
    return env.ASSETS.fetch(request);
  }
};
