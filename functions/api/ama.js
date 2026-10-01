// Cloudflare Pages Function: /api/ama
// Handles Q&A question submission and upvotes

const AMA_SUBMISSIONS = [];

export async function onRequestGet() {
  return new Response(JSON.stringify({ questions: AMA_SUBMISSIONS }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestPost({ request }) {
  try {
    const data = await request.json();
    if (!data.question) {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const item = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      question: data.question,
      name: data.name || 'Anonymous',
      category: data.category || 'general',
      upvotes: 1,
      timestamp: Date.now(),
      status: 'pending'
    };

    AMA_SUBMISSIONS.unshift(item);
    if (AMA_SUBMISSIONS.length > 500) AMA_SUBMISSIONS.pop();

    return new Response(JSON.stringify({ success: true, item }), {
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
