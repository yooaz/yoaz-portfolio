// YOAZ — real Instagram feed via official Meta/Instagram APIs
// Required Netlify env var: INSTAGRAM_ACCESS_TOKEN
// Optional env vars:
// - INSTAGRAM_USER_ID: Instagram Business/Creator user id. If provided, the function uses Meta Graph API.
// - INSTAGRAM_LIMIT: number of posts to return. Default: 9.
//
// Works in two modes:
// 1) Meta Graph API for Business/Creator accounts:
//    https://graph.facebook.com/v20.0/{INSTAGRAM_USER_ID}/media
// 2) Instagram Basic Display fallback for tokens that support /me/media:
//    https://graph.instagram.com/me/media
//
// The front-end never displays fake/local drawings as Instagram content.

let memoryCache = null;
const CACHE_MS = 10 * 60 * 1000;

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=900',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function normalizeItems(data) {
  return (data || [])
    .filter((item) => item && (item.media_url || item.thumbnail_url) && item.permalink)
    .filter((item) => item.media_type !== 'CAROUSEL_ALBUM' || item.media_url || item.thumbnail_url)
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
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

exports.handler = async function () {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.IG_GRAPH_ACCESS_TOKEN || '';
  const userId = process.env.INSTAGRAM_USER_ID || process.env.IG_USER_ID || '';
  const limit = Math.max(1, Math.min(Number(process.env.INSTAGRAM_LIMIT || 9), 24));

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
};
