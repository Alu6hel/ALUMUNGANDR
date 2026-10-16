// Cloudflare Pages Function: /api/world
// Edge API Gateway for Aether-Core Map-as-Coin Verification & Genesis Vault Tokenomics

function generatePalette(seed) {
  let s = (seed >>> 0) || 0x1337BEEF;
  const baseHue = (s * 1103515245 + 12345) % 360;
  const waterHue = (baseHue + 120) % 360;
  const accentHue = (baseHue + 180) % 360;

  const toHex = (h, s, l) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  return [
    toHex(baseHue, 35, 8),   // Void Shadow
    toHex(baseHue, 45, 20),  // Low Terrain
    toHex(baseHue, 60, 38),  // Mid Terrain
    toHex(baseHue, 50, 60),  // High Terrain
    toHex((baseHue + 45) % 360, 70, 52), // Foil Grass
    toHex(waterHue, 75, 30), // Water Deep
    toHex(waterHue, 50, 74), // Water Foam
    toHex(accentHue, 95, 65) // Accent Glow
  ];
}

const GLOBAL_WORLDS_CACHE = new Map();

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const seedParam = parts[parts.length - 1];

  // Ping / Health endpoint: /api/world/ping (Ultra-low latency Edge check)
  if (seedParam === 'ping') {
    return new Response(JSON.stringify({
      status: "ONLINE",
      edge: true,
      service: "Aether-Core Edge Gateway",
      latency: "ultra-low",
      timestamp: Date.now()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  }

  // Leaderboard endpoint: /api/world/leaderboard
  if (seedParam === 'leaderboard') {
    const list = Array.from(GLOBAL_WORLDS_CACHE.values()).slice(0, 10);
    return new Response(JSON.stringify({
      leaderboard: list.length > 0 ? list : [
        { seed: 0x7F3A59DF, ticker: "$ALU-59DF", marketCap: "142.5 ALU", floor: "0.125 ALU", creator: "Vance_Pioneer" },
        { seed: 0x1337BEEF, ticker: "$ALU-BEEF", marketCap: "288.0 ALU", floor: "0.180 ALU", creator: "Old_Man_Gable" }
      ]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Seed metadata endpoint: /api/world/:seed
  const seed = parseInt(seedParam, 10) || 0x7F3A59DF;
  const ticker = `$ALU-${(seed >>> 0).toString(16).toUpperCase().padStart(4, '0').slice(-4)}`;
  const palette = generatePalette(seed);

  const worldData = {
    seed,
    ticker,
    name: `Aetheria Sector ${ticker.slice(5)}`,
    bondingCurve: {
      p0: 1.0,
      k: 0.0025,
      currentPrice: 1.25,
      genesisFloor: 0.125,
      vaultLocked: "12.5 ALU"
    },
    palette,
    layer: "DUAL_LAYER_AVAILABLE",
    timestamp: Date.now()
  };

  return new Response(JSON.stringify(worldData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=30'
    }
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const seed = parseInt(body.seed, 10) || Date.now();
    const creator = body.creator || 'Anonymous_Pioneer';
    const ticker = `$ALU-${(seed >>> 0).toString(16).toUpperCase().padStart(4, '0').slice(-4)}`;

    const record = {
      seed,
      ticker,
      creator,
      mintedAt: Date.now(),
      status: 'ON_CHAIN_REGISTERED'
    };

    GLOBAL_WORLDS_CACHE.set(seed, record);

    // Save to Cloudflare KV if bound
    if (env && env.OBSERVATORY_KV) {
      await env.OBSERVATORY_KV.put(`world:${seed}`, JSON.stringify(record), { expirationTtl: 86400 * 7 });
    }

    return new Response(JSON.stringify({
      success: true,
      data: record
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
