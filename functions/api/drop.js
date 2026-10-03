// Cloudflare Worker API: /api/drop
// Zero-Knowledge Client-Side Encrypted Secure File Drop
// Supports AES-256-GCM ciphertext, automated TTL link expiration, and one-time burn-after-reading.

const DROP_MEMORY = new Map();

export async function onRequestPost({ request, env }) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const body = await request.json();
    const { ciphertext, iv, filename, size, mimeType, burnAfterRead, authTag } = body;

    if (!ciphertext || !iv) {
      return new Response(JSON.stringify({ error: 'Missing encrypted payload (ciphertext or iv)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Max upload size check (~10MB base64 ciphertext limit for high-speed edge distribution)
    if (ciphertext.length > 15 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Encrypted payload exceeds 10MB limit' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Generate unique 6-character claim code if not provided
    const code = (body.code || 'DROP-' + Math.random().toString(36).substring(2, 8).toUpperCase()).trim();

    // Default expiration: 24 hours, max 7 days (604800s), min 5 minutes (300s)
    const ttlSeconds = Math.min(604800, Math.max(300, parseInt(body.ttlSeconds, 10) || 86400));
    const expiresAt = Date.now() + (ttlSeconds * 1000);

    const record = {
      code,
      filename: filename ? String(filename).slice(0, 150) : 'encrypted-file.bin',
      size: Number(size) || ciphertext.length,
      mimeType: mimeType || 'application/octet-stream',
      ciphertext,
      iv,
      authTag: authTag || null,
      burnAfterRead: Boolean(burnAfterRead),
      createdAt: Date.now(),
      expiresAt
    };

    // Store in Cloudflare KV if bound
    if (env && env.OBSERVATORY_KV) {
      try {
        await env.OBSERVATORY_KV.put('drop:' + code, JSON.stringify(record), {
          expirationTtl: ttlSeconds
        });
      } catch (kvErr) {
        console.warn('KV put error, falling back to memory map:', kvErr);
      }
    }

    // Store in in-memory LRU cache
    DROP_MEMORY.set(code, record);
    if (DROP_MEMORY.size > 1000) {
      const oldestKey = DROP_MEMORY.keys().next().value;
      DROP_MEMORY.delete(oldestKey);
    }

    return new Response(JSON.stringify({
      success: true,
      code,
      filename: record.filename,
      size: record.size,
      expiresAt: record.expiresAt,
      burnAfterRead: record.burnAfterRead,
      ttlSeconds
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  let code = (url.searchParams.get('code') || '').toUpperCase().trim();

  // If path is /api/drop/XYZ
  if (!code && url.pathname.startsWith('/api/drop/')) {
    code = url.pathname.replace('/api/drop/', '').toUpperCase().trim();
  }

  if (!code) {
    return new Response(JSON.stringify({ error: 'Missing file drop code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  let record = null;

  // Try reading from KV first
  if (env && env.OBSERVATORY_KV) {
    try {
      const kvData = await env.OBSERVATORY_KV.get('drop:' + code, { type: 'json' });
      if (kvData) record = kvData;
    } catch (e) {
      console.warn('KV read error:', e);
    }
  }

  // Fallback to in-memory cache
  if (!record) {
    record = DROP_MEMORY.get(code);
  }

  if (!record) {
    return new Response(JSON.stringify({ notFound: true, error: 'Encrypted drop not found or expired' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Check TTL expiration
  if (record.expiresAt && Date.now() > record.expiresAt) {
    DROP_MEMORY.delete(code);
    if (env && env.OBSERVATORY_KV) {
      ctx?.waitUntil(env.OBSERVATORY_KV.delete('drop:' + code));
    }
    return new Response(JSON.stringify({ expired: true, error: 'Encrypted drop has expired' }), {
      status: 410,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Burn-after-reading: delete immediately upon retrieval
  if (record.burnAfterRead) {
    DROP_MEMORY.delete(code);
    if (env && env.OBSERVATORY_KV) {
      try {
        await env.OBSERVATORY_KV.delete('drop:' + code);
      } catch (delErr) {
        console.warn('KV burn delete error:', delErr);
      }
    }
  }

  return new Response(JSON.stringify({
    success: true,
    code: record.code,
    filename: record.filename,
    size: record.size,
    mimeType: record.mimeType,
    ciphertext: record.ciphertext,
    iv: record.iv,
    authTag: record.authTag,
    burned: Boolean(record.burnAfterRead),
    expiresAt: record.expiresAt
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
