// Cloudflare Pages Function: /api/clip
// In-Memory Edge Cache & D1/KV storage fallback for cross-device universal clipboard

const CLIP_MEMORY = new Map();

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const code = (url.searchParams.get('code') || '').toUpperCase().trim();

  if (!code) {
    return new Response(JSON.stringify({ error: 'Missing code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const record = CLIP_MEMORY.get(code);
  if (!record) {
    return new Response(JSON.stringify({ notFound: true }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Check Expiration
  if (record.expiresAt && Date.now() > record.expiresAt) {
    CLIP_MEMORY.delete(code);
    return new Response(JSON.stringify({ expired: true }), {
      status: 410,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Burn after reading
  if (record.burn) {
    CLIP_MEMORY.delete(code);
  }

  return new Response(JSON.stringify(record), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

export async function onRequestPost({ request }) {
  try {
    const body = await request.json();
    const code = (body.room || '').toUpperCase().trim();

    if (!code || !body.text) {
      return new Response(JSON.stringify({ error: 'Room and text are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const entry = {
      room: code,
      text: body.text,
      encrypted: Boolean(body.encrypted),
      burn: Boolean(body.burn),
      expiresAt: body.expiresAt || (Date.now() + 3600000),
      timestamp: Date.now()
    };

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
