// YOAZ — Instagram professional-account feed (Meta Graph API).
// Tokens ONLY in server-side environment variables, never in HTML or GitHub.
// Mode A: INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_USER_ID => Facebook Login, graph.facebook.com.
// Mode B: INSTAGRAM_ACCESS_TOKEN and no INSTAGRAM_USER_ID => Instagram Login, graph.instagram.com.
// Uses Meta Graph v26.0; the retired Instagram Basic Display fallback has been removed.

'use strict';
const { createHash } = require('node:crypto');

const GRAPH_VERSION = 'v26.0';
const DEFAULT_LIMIT = 9;
const CACHE_FOR_MS = 10 * 60 * 1000;
const STALE_FOR_MS = 24 * 60 * 60 * 1000;
let cache = null;
let pending = null;

function response(statusCode, data, cacheable = false) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheable ? 'public, max-age=120, s-maxage=300' : 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
    body: JSON.stringify(data),
  };
}
function safeHttps(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch (_) { return ''; }
}
function validInstagramPost(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && /^(www\.)?instagram\.com$/.test(url.hostname) && !url.username && !url.password
      ? url.href : '';
  } catch (_) { return ''; }
}
function normalise(items, limit) {
  if (!Array.isArray(items)) return [];
  return items.filter(Boolean).map(item => {
    const permalink = validInstagramPost(item.permalink);
    const media = safeHttps(item.media_type === 'VIDEO'
      ? (item.thumbnail_url || item.media_url)
      : (item.media_url || item.thumbnail_url));
    if (!permalink || !media) return null;
    return {
      id: String(item.id || '').slice(0, 80),
      caption: String(item.caption || '').slice(0, 400),
      media_type: ['IMAGE','VIDEO','CAROUSEL_ALBUM'].includes(item.media_type) ? item.media_type : 'IMAGE',
      media_url: media,
      permalink,
      timestamp: String(item.timestamp || '').slice(0, 40),
    };
  }).filter(Boolean).sort((a, b) => (Date.parse(b.timestamp || '') || 0) - (Date.parse(a.timestamp || '') || 0)).slice(0, limit);
}
async function getMedia(token, userId, limit) {
  const host = userId ? 'graph.facebook.com' : 'graph.instagram.com';
  const path = userId ? encodeURIComponent(userId) : 'me';
  const url = new URL('https://' + host + '/' + GRAPH_VERSION + '/' + path + '/media');
  url.searchParams.set('fields', 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp');
  url.searchParams.set('limit', String(limit));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const result = await fetch(url, {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!result.ok) throw new Error('meta_upstream_' + result.status);
    const body = await result.json();
    if (!body || !Array.isArray(body.data)) throw new Error('meta_upstream_shape');
    const posts = normalise(body.data, limit);
    if (!posts.length) throw new Error('meta_upstream_empty');
    return posts;
  } finally {
    clearTimeout(timeout);
  }
}

exports.handler = async function(event = {}) {
  if (event.httpMethod && event.httpMethod !== 'GET') return response(405, { ok:false, error:'method_not_allowed', items:[] });
  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.IG_GRAPH_ACCESS_TOKEN || '';
  const userId = process.env.INSTAGRAM_USER_ID || process.env.IG_USER_ID || '';
  const parsed = Number(process.env.INSTAGRAM_LIMIT);
  const limit = Number.isFinite(parsed) && parsed > 0 ? Math.max(1, Math.min(Math.floor(parsed), 24)) : DEFAULT_LIMIT;
  if (!token) return response(503, {ok:false, configured:false, error:'not_configured', items:[]});
  // Hash credentials for cache identity so token rotation never returns data
  // from a previous token or another account. The token is never logged/stored.
  const key = createHash('sha256').update(token).update('\\0' + userId + '\\0' + limit).digest('hex');
  const now = Date.now();
  if (cache && cache.key === key && now - cache.at < CACHE_FOR_MS) {
    return response(200, {ok:true, source:'instagram-graph', cached:true, items:cache.items}, true);
  }
  let flight = pending;
  if (!flight || flight.key !== key) {
    flight = { key, promise: getMedia(token, userId, limit) };
    pending = flight;
  }
  try {
    const items = await flight.promise;
    cache = { key, at:Date.now(), items };
    return response(200, {ok:true, source:'instagram-graph', cached:false, items}, true);
  } catch (_) {
    if (cache && cache.key === key && now - cache.at < STALE_FOR_MS) {
      return response(200, {ok:true, source:'instagram-graph', stale:true, items:cache.items}, false);
    }
    // Never expose access tokens, upstream stack traces or sensitive Meta error payloads.
    return response(502, {ok:false, configured:true, error:'upstream_unavailable', items:[]});
  } finally {
    if (pending === flight) pending = null;
  }
};

// Export pure validators for CI tests; has no impact on the Netlify handler.
exports._test = { safeHttps, validInstagramPost, normalise };
