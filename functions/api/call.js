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

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control'
    }
  });
}

export async function onRequestPost({ request, env }) {
  cleanupOldSignals();
  try {
    const body = await request.json();
    const room = (body.room || '').trim().toLowerCase();
    const sender = (body.sender || '').trim();
    const type = body.type; // 'peer-ready', 'heartbeat', 'offer', 'answer', 'ice-candidate', 'call-mode', 'chat', 'peer-leave'

    if (!room || !sender || !type) {
      return new Response(JSON.stringify({ error: 'room, sender, and type are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    let roomQueue = ROOM_SIGNALS.get(room) || [];

    // Pull from KV if local isolate memory is empty
    if (env && env.OBSERVATORY_KV) {
      try {
        const kvQueue = await env.OBSERVATORY_KV.get('call:' + room, { type: 'json' });
        if (Array.isArray(kvQueue)) {
          const now = Date.now();
          const seen = new Set(roomQueue.map(s => s.id));
          for (const s of kvQueue) {
            if (!seen.has(s.id) && (now - s.timestamp) < SIGNAL_TTL_MS) {
              roomQueue.push(s);
            }
          }
          roomQueue.sort((a, b) => a.timestamp - b.timestamp);
        }
      } catch (e) {
        console.warn('KV read signal err:', e);
      }
    }

    const signalItem = {
      id: body.id || ('sig_' + Math.random().toString(36).substring(2, 9)),
      type,
      sender,
      payload: body.payload || null,
      mode: body.mode || 'video', // 'video' or 'audio'
      senderName: (body.senderName || 'Peer').slice(0, 40),
      timestamp: Date.now()
    };

    // If it's a heartbeat, replace previous heartbeat from this sender to keep queue compact
    if (type === 'heartbeat') {
      roomQueue = roomQueue.filter(s => !(s.sender === sender && s.type === 'heartbeat'));
    }

    roomQueue.push(signalItem);

    // Limit room queue length to prevent unbounded growth
    if (roomQueue.length > 80) {
      roomQueue = roomQueue.slice(-80);
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

    return new Response(JSON.stringify({
      success: true,
      signalId: signalItem.id,
      serverTime: signalItem.timestamp
    }), {
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

  // Sync with KV to bridge across global edges
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

  const now = Date.now();
  // If since is 0, give signals from the last 45 seconds so newly joined peer sees active state
  const cutoffTime = since > 0 ? since : (now - 45000);
  const newSignals = signals.filter(s => s.sender !== client && s.timestamp > cutoffTime);

  // Active peers discovery (any participant with signal or heartbeat in last 18 seconds)
  const peerMap = new Map();
  for (const s of signals) {
    if (s.sender && s.type !== 'peer-leave' && (now - s.timestamp) < 18000) {
      const existing = peerMap.get(s.sender);
      if (!existing || s.timestamp > existing.lastSeen) {
        peerMap.set(s.sender, {
          id: s.sender,
          name: s.senderName || 'Peer',
          mode: s.mode || 'video',
          lastSeen: s.timestamp
        });
      }
    }
  }

  const activePeers = Array.from(peerMap.values());
  const otherPeers = activePeers.filter(p => p.id !== client);

  return new Response(JSON.stringify({
    room,
    signals: newSignals,
    activePeers,
    otherPeers,
    peerCount: activePeers.length,
    serverTime: now
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
}
