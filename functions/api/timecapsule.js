// Cloudflare Pages Function: /api/timecapsule
// Encrypted Digital Time Capsule Storage with KV and in-memory fallback

const inMemoryCapsules = new Map();

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
      id,
      encryptedPayload,
      unlockDate: Number(unlockDate),
      createdAt: Number(createdAt) || Date.now(),
      hint: hint ? String(hint).slice(0, 120) : ""
    };

    // Attempt to store in Cloudflare KV if bound
    if (env && env.TIMECAPSULE_KV) {
      await env.TIMECAPSULE_KV.put(`capsule:${id}`, JSON.stringify(capsuleRecord));
    } else {
      // In-memory fallback
      inMemoryCapsules.set(id, capsuleRecord);
    }

    return new Response(JSON.stringify({
      success: true,
      id,
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
  if (env && env.TIMECAPSULE_KV) {
    const raw = await env.TIMECAPSULE_KV.get(`capsule:${id}`);
    if (raw) capsule = JSON.parse(raw);
  } else {
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
    // Only return encrypted payload if unlocked or for client-side timer verification
    encryptedPayload: isUnlocked ? capsule.encryptedPayload : null,
    serverTime: now
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
