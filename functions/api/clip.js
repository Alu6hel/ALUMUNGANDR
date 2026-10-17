// Cloudflare Pages Function: /api/clip
// Cross-device universal clipboard with KV global synchronization and in-memory edge cache

const CLIP_MEMORY = new Map();

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = (url.searchParams.get('code') || '').toUpperCase().trim();

  if (!code) {
    return new Response(JSON.stringify({ error: 'Missing code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  let record = null;

  // 1. Try reading from KV for cross-colo global sync
  if (env && env.OBSERVATORY_KV) {
    try {
      record = await env.OBSERVATORY_KV.get('clip:' + code, { type: 'json' });
    } catch (e) {
      console.warn('KV read clip err:', e);
    }
  }

  // 2. Fall back to in-memory map
  if (!record) {
    record = CLIP_MEMORY.get(code);
  }

  if (!record) {
    return new Response(JSON.stringify({ notFound: true }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Check Expiration
  if (record.expiresAt && Date.now() > record.expiresAt) {
    CLIP_MEMORY.delete(code);
    if (env && env.OBSERVATORY_KV) {
      try { await env.OBSERVATORY_KV.delete('clip:' + code); } catch (_) {}
    }
    return new Response(JSON.stringify({ expired: true }), {
      status: 410,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Burn after reading
  if (record.burn) {
    CLIP_MEMORY.delete(code);
    if (env && env.OBSERVATORY_KV) {
      try { await env.OBSERVATORY_KV.delete('clip:' + code); } catch (_) {}
    }
  }

  return new Response(JSON.stringify(record), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache'
    }
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const code = (body.room || '').toUpperCase().trim();

    if (!code || !body.text) {
      return new Response(JSON.stringify({ error: 'Room and text are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const ttlMs = 3600 * 1000 * 24; // 24 hours
    const expiresAt = body.expiresAt || (Date.now() + ttlMs);

    const entry = {
      room: code,
      text: body.text,
      encrypted: Boolean(body.encrypted),
      burn: Boolean(body.burn),
      expiresAt: expiresAt,
      timestamp: Date.now()
    };

    // Store in KV
    if (env && env.OBSERVATORY_KV) {
      try {
        await env.OBSERVATORY_KV.put('clip:' + code, JSON.stringify(entry), {
          expirationTtl: Math.floor(ttlMs / 1000)
        });
      } catch (kvErr) {
        console.warn('KV write clip err:', kvErr);
      }
    }

    CLIP_MEMORY.set(code, entry);

    // Limit memory size
    if (CLIP_MEMORY.size > 2000) {
      const firstKey = CLIP_MEMORY.keys().next().value;
      CLIP_MEMORY.delete(firstKey);
    }

    return new Response(JSON.stringify({ success: true, room: code }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
