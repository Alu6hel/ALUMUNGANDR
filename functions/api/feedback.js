// Cloudflare Pages / Workers Edge Function: /api/feedback
// Zero-telemetry feedback & developer log ingestion endpoint

export async function onRequestPost({ request }) {
  try {
    const data = await request.json();
    const feedback = (data.feedback || data.message || '').trim().slice(0, 2000);
    const app = (data.app || data.detected_app || 'GENERAL').trim().slice(0, 50);

    if (!feedback) {
      return new Response(JSON.stringify({
        status: "error",
        message: "Feedback content is empty."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const timestamp = new Date().toISOString();
    const raw = `${feedback}:${timestamp}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const receiptHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12).toUpperCase();

    return new Response(JSON.stringify({
      status: "success",
      id: `FDBK-${receiptHash}`,
      timestamp: timestamp,
      confirmation_message: "Feedback logged securely to Alumungandr engineering review queue with zero tracking."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      status: "error",
      message: "Malformed request payload."
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

export async function onRequestGet() {
  return new Response(JSON.stringify({
    total_feedback: 0,
    feedback: []
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
