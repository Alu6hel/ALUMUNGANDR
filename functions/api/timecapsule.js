// Cloudflare Pages Function: /api/timecapsule
// Encrypted Digital Time Capsule Storage with KV and in-memory fallback

const inMemoryCapsules = new Map();

function getKV(env) {
  return env?.OBSERVATORY_KV || env?.TIMECAPSULE_KV || null;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { id, encryptedPayload, unlockDate, createdAt, hint } = body;

    if (!id || !encryptedPayload || !unlockDate) {
      return new Response(JSON.stringify({ error: "Missing required capsule fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const capsuleRecord = {
      id: String(id).slice(0, 64),
      encryptedPayload: String(encryptedPayload),
      unlockDate: Number(unlockDate),
      createdAt: Number(createdAt) || Date.now(),
      hint: hint ? String(hint).slice(0, 140) : ""
    };

    const kv = getKV(env);
    if (kv) {
      // Calculate TTL: keep capsule until unlockDate + 365 days (1 year retention)
      const now = Date.now();
      const ttlSeconds = Math.max(86400, Math.ceil((capsuleRecord.unlockDate - now) / 1000) + (365 * 86400));
      await kv.put(`capsule:${capsuleRecord.id}`, JSON.stringify(capsuleRecord), {
        expirationTtl: Math.min(ttlSeconds, 10 * 365 * 86400) // max 10 years
      });
    } else {
      inMemoryCapsules.set(capsuleRecord.id, capsuleRecord);
    }

    return new Response(JSON.stringify({
      success: true,
      id: capsuleRecord.id,
      unlockDate: capsuleRecord.unlockDate,
      message: "Encrypted capsule sealed into spacetime."
    }), {
      status: 201,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ error: "Capsule ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  let capsule = null;
  const kv = getKV(env);
  if (kv) {
    const raw = await kv.get(`capsule:${id}`);
    if (raw) {
      try { capsule = JSON.parse(raw); } catch (e) {}
    }
  }
  if (!capsule) {
    capsule = inMemoryCapsules.get(id);
  }

  if (!capsule) {
    return new Response(JSON.stringify({ error: "Capsule not found in timeline" }), {
      status: 404,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  const now = Date.now();
  const isUnlocked = now >= capsule.unlockDate;

  return new Response(JSON.stringify({
    id: capsule.id,
    unlockDate: capsule.unlockDate,
    createdAt: capsule.createdAt,
    hint: capsule.hint,
    isUnlocked,
    // Return encrypted payload if unlocked
    encryptedPayload: isUnlocked ? capsule.encryptedPayload : null,
    serverTime: now
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
