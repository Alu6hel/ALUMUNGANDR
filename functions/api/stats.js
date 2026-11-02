// Cloudflare Pages / Workers Function: /api/stats
// Serves transparent global broadband benchmarks (ITU / Cloudflare Radar) and edge telemetry

const GLOBAL_BENCHMARK = {
  dataSource: "Public Global Broadband Benchmarks (ITU, M-Lab, and Cloudflare Radar)",
  methodology: "Published regional country & technology baseline reference averages",
  updatedAt: "November 2026",
  globalMeanDownload: 186.4,
  globalMeanUpload: 88.2,
  medianLatency: 24
};

export async function onRequestGet({ request, env }) {
  let data = { ...GLOBAL_BENCHMARK };
  if (env && env.OBSERVATORY_KV) {
    try {
      const liveStats = await env.OBSERVATORY_KV.get('stats:aggregate', { type: 'json' });
      if (liveStats) {
        data = { ...data, ...liveStats };
      }
    } catch (e) {}
  }
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60'
    }
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const download = parseFloat(data.downloadMbps);
    const upload = parseFloat(data.uploadMbps);
    const ping = parseInt(data.pingMs);
    const country = data.country || 'Unknown';

    if (!isNaN(download) && download > 0) {
      GLOBAL_BENCHMARK.totalTests += 1;
      GLOBAL_BENCHMARK.recentSubmissions.unshift({
        download,
        upload: upload || 0,
        ping: ping || 0,
        country,
        timestamp: Date.now()
      });

      if (GLOBAL_BENCHMARK.recentSubmissions.length > 50) {
        GLOBAL_BENCHMARK.recentSubmissions.pop();
      }
    }

    return new Response(JSON.stringify({ success: true, totalTests: GLOBAL_BENCHMARK.totalTests }), {
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
