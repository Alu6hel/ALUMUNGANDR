// Alumungandr Edge Gateway & API Router
// Bridges Cloudflare Workers + Static Assets with /api endpoints and zero-tracking services

import * as aiRealities from './functions/api/ai-realities.js';
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

    // Route /api/ai-realities & /api/ai-matrix (Automated AI Capability Reality Matrix API)
    if (url.pathname === '/api/ai-realities/sync') {
      const syncResult = await aiRealities.runWeeklyObservatorySync(env);
      return new Response(JSON.stringify(syncResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (url.pathname === '/api/ai-realities' || url.pathname === '/api/ai-matrix') {
      if (method === 'POST' && aiRealities.onRequestPost) return aiRealities.onRequestPost({ request, env, ctx });
      if (method === 'GET' && aiRealities.onRequestGet) return aiRealities.onRequestGet({ request, env, ctx });
    }

    // Route /api/qa (Alumungandr Founder & Platform Q&A Engine)
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

    // Fall back to Cloudflare Static Assets with Zero-FOUC Theme Pre-bootstrap
    const res = await env.ASSETS.fetch(request);
    const contentType = res.headers.get('content-type') || '';
    if (res.status === 200 && contentType.includes('text/html')) {
      const html = await res.text();
      const themeScript = `<script>try{var t=localStorage.getItem('alu_theme');if(t==='paper'||t==='amber')document.documentElement.setAttribute('data-theme',t);}catch(e){}</script>`;
      return new Response(html.replace('<head>', '<head>' + themeScript), {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers
      });
    }
    return res;
  },

  // Cloudflare Worker Cron Trigger: Runs weekly on Sunday at midnight UTC (100% Free, zero maintenance)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(aiRealities.runWeeklyObservatorySync(env));
  }
};
