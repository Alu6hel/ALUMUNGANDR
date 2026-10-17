// Cloudflare Pages / Workers Function: /api/contact
// Secure Communications Uplink & Dispatch Receipt System

const inMemoryDispatches = new Map();

function getKV(env) {
  return env?.OBSERVATORY_KV || env?.CONTACT_KV || null;
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
    const data = await request.json();
    const name = (data.name || "Anonymous Operator").trim().slice(0, 100);
    const email = (data.email || "unspecified@terminal.local").trim().slice(0, 150);
    const category = (data.category || "General Inquiry").trim().slice(0, 80);
    const subject = (data.subject || "Secure Uplink Dispatch").trim().slice(0, 200);
    const message = (data.message || "").trim().slice(0, 10000);

    if (!message) {
      return new Response(JSON.stringify({
        status: "error",
        message: "Message payload cannot be empty."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const timestamp = new Date().toISOString();
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    const ticketId = `TICK-ALU-${randomHex}`;

    const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const dispatchRecord = {
      ticketId,
      name,
      email,
      category,
      subject,
      message,
      clientIp,
      userAgent,
      timestamp
    };

    const kv = getKV(env);
    if (kv) {
      // Retain dispatch records for 180 days
      await kv.put(`contact:${ticketId}`, JSON.stringify(dispatchRecord), {
        expirationTtl: 180 * 86400
      });
    } else {
      inMemoryDispatches.set(ticketId, dispatchRecord);
    }

    return new Response(JSON.stringify({
      status: "ok",
      ticket_id: ticketId,
      timestamp: timestamp,
      message: "Encrypted transmission successfully logged to Alumungandr engineering core."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      status: "error",
      message: err.message || "Failed to process communication dispatch."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const ticketId = url.searchParams.get("ticket_id");

  if (ticketId) {
    const kv = getKV(env);
    let record = null;
    if (kv) {
      const raw = await kv.get(`contact:${ticketId}`);
      if (raw) {
        try { record = JSON.parse(raw); } catch (e) {}
      }
    } else {
      record = inMemoryDispatches.get(ticketId);
    }

    if (!record) {
      return new Response(JSON.stringify({ status: "error", message: "Dispatch ticket not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    return new Response(JSON.stringify({
      status: "ok",
      ticket: {
        ticketId: record.ticketId,
        category: record.category,
        subject: record.subject,
        timestamp: record.timestamp
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  const cf = request.cf || {};
  return new Response(JSON.stringify({
    status: "online",
    gateway: "Alumungandr Secure Communications Uplink",
    version: "2.5.0",
    service: "Cloudflare Edge KV Dispatch Engine",
    colo: cf.colo || "EDGE-LOCAL",
    country: cf.country || "US",
    city: cf.city || "Local",
    region: cf.region || null,
    asn: cf.asn || null,
    asOrganization: cf.asOrganization || null,
    httpProtocol: cf.httpProtocol || "HTTP/2",
    tlsVersion: cf.tlsVersion || "TLSv1.3",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store, no-cache, must-revalidate"
    }
  });
}
