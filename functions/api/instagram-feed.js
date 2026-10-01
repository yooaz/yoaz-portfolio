// YOAZ — Cloudflare Pages version of the Instagram feed endpoint.
// Required env var: INSTAGRAM_ACCESS_TOKEN
// Optional env vars: INSTAGRAM_USER_ID, INSTAGRAM_LIMIT

let memoryCache = null;
const CACHE_MS = 10 * 60 * 1000;

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=900',
      ...extraHeaders,
    },
  });
}

function normalizeItems(data) {
  return (data || [])
    .filter((item) => item && (item.media_url || item.thumbnail_url) && item.permalink)
    .map((item) => ({
      id: item.id,
      caption: item.caption || '',
      media_type: item.media_type || 'IMAGE',
      media_url: item.media_type === 'VIDEO' ? (item.thumbnail_url || item.media_url) : item.media_url,
      thumbnail_url: item.thumbnail_url || '',
      permalink: item.permalink,
      timestamp: item.timestamp || '',
      username: item.username || 'iamyoaz',
    }));
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const data = await res.json();
  if (!res.ok || data.error) {
    const message = data && data.error ? data.error.message : `Instagram API HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export async function onRequestGet({ env }) {
  const token = env.INSTAGRAM_ACCESS_TOKEN || env.IG_GRAPH_ACCESS_TOKEN || '';
  const userId = env.INSTAGRAM_USER_ID || env.IG_USER_ID || '';
  const limit = Math.max(1, Math.min(Number(env.INSTAGRAM_LIMIT || 9), 24));

  if (!token) {
    return json(503, {
      ok: false,
      configured: false,
      error: 'INSTAGRAM_ACCESS_TOKEN missing',
      items: [],
    });
  }

  const now = Date.now();
  if (memoryCache && now - memoryCache.createdAt < CACHE_MS) {
    return json(200, { ok: true, cached: true, source: memoryCache.source, items: memoryCache.items });
  }

  const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username';
  const sources = [];

  if (userId && userId !== 'me') {
    sources.push({
      name: 'meta-graph-api',
      url: `https://graph.facebook.com/v20.0/${encodeURIComponent(userId)}/media?fields=${encodeURIComponent(fields)}&limit=${encodeURIComponent(limit)}&access_token=${encodeURIComponent(token)}`,
    });
  }

  sources.push({
    name: 'instagram-basic-display',
    url: `https://graph.instagram.com/me/media?fields=${encodeURIComponent(fields)}&limit=${encodeURIComponent(limit)}&access_token=${encodeURIComponent(token)}`,
  });

  let lastError = null;
  for (const source of sources) {
    try {
      const data = await fetchJson(source.url);
      const items = normalizeItems(data.data).slice(0, limit);
      if (!items.length) {
        lastError = new Error('Instagram API returned no displayable media');
        continue;
      }
      memoryCache = { createdAt: now, source: source.name, items };
      return json(200, { ok: true, cached: false, source: source.name, items });
    } catch (err) {
      lastError = err;
    }
  }

  return json(502, {
    ok: false,
    configured: true,
    error: lastError && lastError.message ? lastError.message : 'Instagram fetch failed',
    items: [],
  });
}

export function onRequest() {
  return json(405, { error: 'Method not allowed' });
}
