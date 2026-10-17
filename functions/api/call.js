// Alumungandr WebRTC Ephemeral Signaling Gateway
// Enables cross-device, cross-network WebRTC P2P audio & video call negotiation worldwide
// Combines ultra-fast edge in-memory cache with Cloudflare KV global propagation

const ROOM_SIGNALS = new Map();
const SIGNAL_TTL_MS = 120 * 1000; // 2 minutes

function cleanupOldSignals() {
  const now = Date.now();
  for (const [room, signals] of ROOM_SIGNALS.entries()) {
    const valid = signals.filter(s => (now - s.timestamp) < SIGNAL_TTL_MS);
    if (valid.length === 0) {
      ROOM_SIGNALS.delete(room);
    } else if (valid.length !== signals.length) {
      ROOM_SIGNALS.set(room, valid);
    }
  }
}

export async function onRequestPost({ request, env }) {
  cleanupOldSignals();
  try {
    const body = await request.json();
    const room = (body.room || '').trim().toLowerCase();
    const sender = (body.sender || '').trim();
    const type = body.type; // 'peer-ready', 'offer', 'answer', 'ice-candidate', 'call-mode', 'chat'

    if (!room || !sender || !type) {
      return new Response(JSON.stringify({ error: 'room, sender, and type are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    let roomQueue = ROOM_SIGNALS.get(room) || [];
    
    // Check KV if local memory doesn't have it
    if (roomQueue.length === 0 && env && env.OBSERVATORY_KV) {
      try {
        const kvQueue = await env.OBSERVATORY_KV.get('call:' + room, { type: 'json' });
        if (Array.isArray(kvQueue)) {
          const now = Date.now();
          roomQueue = kvQueue.filter(s => (now - s.timestamp) < SIGNAL_TTL_MS);
        }
      } catch (e) {
        console.warn('KV read signal err:', e);
      }
    }

    const signalItem = {
      id: 'sig_' + Math.random().toString(36).substring(2, 9),
      type,
      sender,
      payload: body.payload || null,
      mode: body.mode || 'video', // 'video' or 'audio'
      timestamp: Date.now()
    };

    roomQueue.push(signalItem);

    // Limit room queue length to prevent unbounded growth
    if (roomQueue.length > 60) {
      roomQueue = roomQueue.slice(-60);
    }

    ROOM_SIGNALS.set(room, roomQueue);

    // Persist to KV for global cross-colo visibility
    if (env && env.OBSERVATORY_KV) {
      try {
        await env.OBSERVATORY_KV.put('call:' + room, JSON.stringify(roomQueue), {
          expirationTtl: 300 // 5 minutes ephemeral TTL
        });
      } catch (e) {
        console.warn('KV put signal err:', e);
      }
    }

    return new Response(JSON.stringify({ success: true, signalId: signalItem.id }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestGet({ request, env }) {
  cleanupOldSignals();
  const url = new URL(request.url);
  const room = (url.searchParams.get('room') || '').trim().toLowerCase();
  const client = (url.searchParams.get('client') || '').trim();
  const since = parseInt(url.searchParams.get('since') || '0', 10);

  if (!room) {
    return new Response(JSON.stringify({ error: 'room is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  let signals = ROOM_SIGNALS.get(room) || [];

  // If local memory has few/no signals, pull from KV to bridge across global edges
  if (env && env.OBSERVATORY_KV) {
    try {
      const kvSignals = await env.OBSERVATORY_KV.get('call:' + room, { type: 'json' });
      if (Array.isArray(kvSignals)) {
        const seenIds = new Set(signals.map(s => s.id));
        for (const s of kvSignals) {
          if (!seenIds.has(s.id)) {
            signals.push(s);
          }
        }
        signals.sort((a, b) => a.timestamp - b.timestamp);
        ROOM_SIGNALS.set(room, signals);
      }
    } catch (e) {
      console.warn('KV get signals err:', e);
    }
  }

  // Return signals intended for other peers, created strictly after 'since'
  const newSignals = signals.filter(s => s.sender !== client && s.timestamp > since);

  return new Response(JSON.stringify({
    room,
    signals: newSignals,
    serverTime: Date.now()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
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
