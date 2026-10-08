// Alumungandr Edge Gateway & API Router
// Bridges Cloudflare Workers + Static Assets with /api endpoints, security policies, and zero-tracking services

import * as aiRealities from './functions/api/ai-realities.js';
import * as qa from './functions/api/qa.js';
import * as feedback from './functions/api/feedback.js';
import * as clip from './functions/api/clip.js';
import * as stats from './functions/api/stats.js';
import * as timecapsule from './functions/api/timecapsule.js';
import * as ama from './functions/api/ama.js';
import * as subscriptions from './functions/api/subscriptions.js';
import * as drop from './functions/api/drop.js';

// Edge Rate Limiter (Token bucket / sliding window per IP)
const RATE_LIMIT_MAP = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_API_REQUESTS_PER_WINDOW = 80;

function checkRateLimit(ip) {
  const now = Date.now();
  let record = RATE_LIMIT_MAP.get(ip);
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    RATE_LIMIT_MAP.set(ip, record);
    if (RATE_LIMIT_MAP.size > 2000) {
      for (const [k, v] of RATE_LIMIT_MAP.entries()) {
        if (now > v.resetAt) RATE_LIMIT_MAP.delete(k);
      }
    }
    return { allowed: true, remaining: MAX_API_REQUESTS_PER_WINDOW - 1 };
  }
  record.count++;
  if (record.count > MAX_API_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  return { allowed: true, remaining: MAX_API_REQUESTS_PER_WINDOW - record.count };
}

function applySecurityHeaders(headers) {
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(self), microphone=(self), camera=(self), payment=(self)');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  return headers;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // Strict Canonical SEO Enforcement: 301 Permanent Redirects
    // Eliminates Google Search Console "Duplicate without user-selected canonical"
    let redirectNeeded = false;
    let targetHost = url.hostname;
    let targetPath = url.pathname;

    if (url.hostname === 'www.alumungandr.com') {
      targetHost = 'alumungandr.com';
      redirectNeeded = true;
    }
    if (targetPath === '/index.html') {
      targetPath = '/';
      redirectNeeded = true;
    } else if (targetPath.length > 1 && targetPath.endsWith('/')) {
      targetPath = targetPath.slice(0, -1);
      redirectNeeded = true;
    }

    if (redirectNeeded && method === 'GET') {
      return Response.redirect(`https://${targetHost}${targetPath}${url.search}`, 301);
    }

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      const corsHeaders = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      return new Response(null, {
        status: 204,
        headers: applySecurityHeaders(corsHeaders)
      });
    }

    // RFC 9116 security.txt Endpoint
    if (url.pathname === '/.well-known/security.txt' || url.pathname === '/security.txt') {
      const securityPolicy = `# RFC 9116 Security Disclosure Policy for Alumungandr
# https://alumungandr.com/.well-known/security.txt

Contact: mailto:security@alumungandr.com
Contact: https://alumungandr.com/contact
Expires: 2027-12-31T23:59:59.000Z
Preferred-Languages: en
Canonical: https://alumungandr.com/.well-known/security.txt
Policy: https://alumungandr.com/privacy
Acknowledgments: https://alumungandr.com/about
Hiring: https://alumungandr.com/contact
`;
      return new Response(securityPolicy, {
        status: 200,
        headers: applySecurityHeaders(new Headers({
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*'
        }))
      });
    }

    // Android Digital Asset Links (assetlinks.json)
    if (url.pathname === '/.well-known/assetlinks.json') {
      const assetlinks = JSON.stringify([
        {
          "relation": ["delegate_permission/common.handle_all_urls"],
          "target": {
            "namespace": "android_app",
            "package_name": "com.alumungandr.app",
            "sha256_cert_fingerprints": [
              "14:6D:E9:7F:0F:7D:6F:A2:1F:B1:92:02:64:1B:7D:4F:92:4A:26:FA:F2:65:C3:54:CA:0F:A4:44:03:EE:81:F2"
            ]
          }
        },
        {
          "relation": ["delegate_permission/common.handle_all_urls"],
          "target": {
            "namespace": "android_app",
            "package_name": "com.alumungandr.underwraps",
            "sha256_cert_fingerprints": [
              "A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90:12:34:56:78:9A:BC:DE:F0:12:34:56:78:9A:BC:DE:F0"
            ]
          }
        },
        {
          "relation": ["delegate_permission/common.handle_all_urls"],
          "target": {
            "namespace": "android_app",
            "package_name": "com.alumungandr.galaxsee",
            "sha256_cert_fingerprints": [
              "B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90:12:34:56:78:9A:BC:DE:F0:12:34:56:78:9A:BC:DE:F0:12"
            ]
          }
        }
      ], null, 2);
      return new Response(assetlinks, {
        status: 200,
        headers: applySecurityHeaders(new Headers({
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*'
        }))
      });
    }

    // Edge Rate Limiting on API endpoints
    if (url.pathname.startsWith('/api/')) {
      const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '127.0.0.1';
      const rl = checkRateLimit(clientIp);
      if (!rl.allowed) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded. Too many requests from this IP.',
          status: 429,
          retryAfter: rl.retryAfter
        }), {
          status: 429,
          headers: applySecurityHeaders(new Headers({
            'Content-Type': 'application/json',
            'Retry-After': String(rl.retryAfter),
            'Access-Control-Allow-Origin': '*'
          }))
        });
      }
    }

    // Route /api/ai-realities & /api/ai-matrix (Automated AI Capability Reality Matrix API)
    if (url.pathname === '/api/ai-realities/sync') {
      const syncResult = await aiRealities.runWeeklyObservatorySync(env);
      return new Response(JSON.stringify(syncResult), {
        status: 200,
        headers: applySecurityHeaders(new Headers({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }))
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

    // Route /api/subscriptions (Subscription Audit, IRS Tax Engine & Kill-Switch Runbook)
    if (url.pathname === '/api/subscriptions' || url.pathname.startsWith('/api/subscriptions/')) {
      if (method === 'OPTIONS' && subscriptions.onRequestOptions) return subscriptions.onRequestOptions({ request, env, ctx });
      if (method === 'POST' && subscriptions.onRequestPost) return subscriptions.onRequestPost({ request, env, ctx });
      if (method === 'GET' && subscriptions.onRequestGet) return subscriptions.onRequestGet({ request, env, ctx });
    }

    // Route /api/drop (Zero-Knowledge Encrypted Secure File Drop)
    if (url.pathname === '/api/drop' || url.pathname.startsWith('/api/drop/')) {
      if (method === 'OPTIONS' && drop.onRequestOptions) return drop.onRequestOptions({ request, env, ctx });
      if (method === 'POST' && drop.onRequestPost) return drop.onRequestPost({ request, env, ctx });
      if (method === 'GET' && drop.onRequestGet) return drop.onRequestGet({ request, env, ctx });
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
      const headers = new Headers(res.headers);
      headers.set('Cache-Control', 'no-cache, must-revalidate');
      applySecurityHeaders(headers);
      return new Response(html.replace('<head>', '<head>' + themeScript), {
        status: res.status,
        statusText: res.statusText,
        headers: headers
      });
    }

    // Force browsers and edge proxies to revalidate nav assets immediately
    if (url.pathname.startsWith('/assets/')) {
      const headers = new Headers(res.headers);
      headers.set('Cache-Control', 'no-cache, must-revalidate');
      applySecurityHeaders(headers);
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: headers
      });
    }

    // Apply security headers to other static responses
    if (res.status === 200) {
      const headers = new Headers(res.headers);
      applySecurityHeaders(headers);
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: headers
      });
    }

    return res;
  },

  // Cloudflare Worker Cron Trigger: Runs weekly on Sunday at midnight UTC (100% Free, zero maintenance)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(aiRealities.runWeeklyObservatorySync(env));
  }
};
