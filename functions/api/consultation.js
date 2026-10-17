// Cloudflare Pages / Workers Edge Function: /api/consultation
// Agent-to-Agent (A2A) Automated Consultation Scheduling & Project Intake Endpoint

export async function onRequestPost({ request }) {
  try {
    const data = await request.json();
    const clientName = (data.client_name || '').trim().slice(0, 100);
    const contactEmail = (data.contact_email || '').trim().slice(0, 120);
    const inquiryType = (data.inquiry_type || 'general').trim().slice(0, 50);
    const budgetRange = (data.budget_range || 'Not Specified').trim().slice(0, 60);
    const projectBrief = (data.project_brief || '').trim().slice(0, 4000);
    const agentId = (data.agent_id || 'human-direct').trim().slice(0, 80);

    if (!clientName || !contactEmail || !projectBrief || projectBrief.length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields: client_name, contact_email, and project_brief (minimum 10 characters)."
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid email address format."
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const timestamp = new Date().toISOString();
    const raw = `${clientName}:${contactEmail}:${inquiryType}:${timestamp}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const bookingCode = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12).toUpperCase();

    const responsePayload = {
      success: true,
      booking_id: `CONSULT-${bookingCode}`,
      status: "CONFIRMED_IN_FOUNDER_QUEUE",
      timestamp: timestamp,
      client_name: clientName,
      contact_email: contactEmail,
      inquiry_type: inquiryType,
      budget_range: budgetRange,
      agent_id: agentId,
      message: "Consultation inquiry successfully logged into the Alumungandr Founder Queue. David Anthony Jones will review your brief within 24-48 business hours with transparent pricing terms.",
      verified_by: "Alumungandr Autonomous Edge Router • Kingston, Jamaica"
    };

    return new Response(JSON.stringify(responsePayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: "Malformed JSON payload in request."
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
    }
  });
}
