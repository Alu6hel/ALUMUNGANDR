// Cloudflare Worker API: /api/drop
// Zero-Knowledge Client-Side Encrypted Secure File Drop
// Supports AES-256-GCM ciphertext, automated TTL link expiration, one-time burn-after-reading,
// and chunked storage for files up to 150MB without exceeding edge memory or KV limits.

const DROP_MEMORY = new Map();
const CHUNK_MEMORY = new Map();

export async function onRequestPost({ request, env }) {
  try {
    const url = new URL(request.url);
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const body = await request.json();

    // 1. CHUNK UPLOAD ROUTE: /api/drop/chunk
    if (url.pathname.endsWith('/chunk') || body.action === 'chunk') {
      const code = (body.code || '').toUpperCase().trim();
      const chunkIndex = parseInt(body.chunkIndex, 10);
      const totalChunks = parseInt(body.totalChunks, 10);
      const chunkData = body.chunkData; // Base64 slice

      if (!code || isNaN(chunkIndex) || !chunkData) {
        return new Response(JSON.stringify({ error: 'Missing code, chunkIndex, or chunkData' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const chunkKey = `drop:${code}:chunk:${chunkIndex}`;
      CHUNK_MEMORY.set(chunkKey, chunkData);

      if (env && env.OBSERVATORY_KV) {
        try {
          const ttlSeconds = Math.min(604800, Math.max(300, parseInt(body.ttlSeconds, 10) || 86400));
          await env.OBSERVATORY_KV.put(chunkKey, chunkData, { expirationTtl: ttlSeconds });
        } catch (kvErr) {
          console.warn('KV chunk put error:', kvErr);
        }
      }

      return new Response(JSON.stringify({ success: true, code, chunkIndex, received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 2. MAIN DROP INITIALIZATION / UPLOAD ROUTE
    const { ciphertext, iv, filename, size, mimeType, burnAfterRead, authTag, isChunked, totalChunks } = body;

    // Verify size does not exceed 150MB
    const numericSize = Number(size) || 0;
    if (numericSize > 155 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File size exceeds 150MB limit' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (!iv) {
      return new Response(JSON.stringify({ error: 'Missing initialization vector (iv)' }), {
        status: 400,
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
      size: numericSize || (ciphertext ? ciphertext.length : 0),
      mimeType: mimeType || 'application/octet-stream',
      isChunked: Boolean(isChunked),
      totalChunks: totalChunks ? Number(totalChunks) : 1,
      ciphertext: isChunked ? null : (ciphertext || null),
      iv,
      authTag: authTag || null,
      burnAfterRead: Boolean(burnAfterRead),
      createdAt: Date.now(),
      expiresAt,
      ttlSeconds
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
      isChunked: record.isChunked,
      totalChunks: record.totalChunks,
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

  // 1. GET CHUNK ROUTE: /api/drop/chunk?code=XYZ&index=N
  if (url.pathname.endsWith('/chunk')) {
    const code = (url.searchParams.get('code') || '').toUpperCase().trim();
    const index = parseInt(url.searchParams.get('index') || '0', 10);
    const chunkKey = `drop:${code}:chunk:${index}`;

    let chunkData = null;
    if (env && env.OBSERVATORY_KV) {
      try {
        chunkData = await env.OBSERVATORY_KV.get(chunkKey);
      } catch (e) {
        console.warn('KV chunk get err:', e);
      }
    }
    if (!chunkData) {
      chunkData = CHUNK_MEMORY.get(chunkKey);
    }

    if (!chunkData) {
      return new Response(JSON.stringify({ notFound: true, error: `Chunk ${index} not found` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Check if burn-after-read cleanup is requested
    const isLast = url.searchParams.get('isLast') === 'true';
    const burn = url.searchParams.get('burn') === 'true';
    if (isLast && burn) {
      cleanupDrop(code, env);
    }

    return new Response(JSON.stringify({
      success: true,
      code,
      index,
      chunkData
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }

  // 2. MAIN GET METADATA / SINGLE PAYLOAD ROUTE
  let code = (url.searchParams.get('code') || '').toUpperCase().trim();
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
    cleanupDrop(code, env);
    return new Response(JSON.stringify({ expired: true, error: 'Encrypted drop has expired' }), {
      status: 410,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // If single unchunked file & burn-after-read: delete immediately
  if (!record.isChunked && record.burnAfterRead) {
    cleanupDrop(code, env);
  }

  return new Response(JSON.stringify({
    success: true,
    code: record.code,
    filename: record.filename,
    size: record.size,
    mimeType: record.mimeType,
    isChunked: Boolean(record.isChunked),
    totalChunks: record.totalChunks || 1,
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

async function cleanupDrop(code, env) {
  const meta = DROP_MEMORY.get(code);
  DROP_MEMORY.delete(code);
  if (meta && meta.isChunked) {
    for (let i = 0; i < (meta.totalChunks || 1); i++) {
      CHUNK_MEMORY.delete(`drop:${code}:chunk:${i}`);
      if (env && env.OBSERVATORY_KV) {
        try { await env.OBSERVATORY_KV.delete(`drop:${code}:chunk:${i}`); } catch (_) {}
      }
    }
  }
  if (env && env.OBSERVATORY_KV) {
    try { await env.OBSERVATORY_KV.delete('drop:' + code); } catch (_) {}
  }
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
