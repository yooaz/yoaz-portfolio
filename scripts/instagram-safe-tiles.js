/* YOAZ Instagram grid: only DOM node creation and trusted Meta/Instagram HTTPS media. */
(function (root) {
  'use strict';
  const PROFILE = 'https://www.instagram.com/iamyoaz/';

  function safeUrl(raw, kind) {
    if (typeof raw !== 'string' || !raw || /[\u0000-\u001f\u007f]/.test(raw)) return null;
    try {
      const value = new URL(raw);
      if (value.protocol !== 'https:' || value.username || value.password) return null;
      const host = value.hostname.toLowerCase();
      const instagram = host === 'instagram.com' || host === 'www.instagram.com';
      if (kind === 'link') return instagram ? value.href : null;
      const metaMedia = instagram || host === 'cdninstagram.com' || host.endsWith('.cdninstagram.com') ||
        host === 'fbcdn.net' || host.endsWith('.fbcdn.net');
      return metaMedia ? value.href : null;
    } catch (_) {
      return null;
    }
  }

  function render(grid, items) {
    if (!grid || !Array.isArray(items)) throw new Error('HOLD_INSTAGRAM_ITEMS');
    const fragment = document.createDocumentFragment();
    let count = 0;
    for (const item of items.slice(0, 24)) {
      if (count >= 9) break;
      if (!item || typeof item !== 'object') continue;
      const image = safeUrl(item.media_url || item.thumbnail_url, 'image');
      if (!image) continue;
      const href = safeUrl(item.permalink, 'link') || PROFILE;
      const anchor = document.createElement('a');
      anchor.className = 'ig-tile ' + (count === 0 ? 'ig-latest ' : '') + 'reveal';
      anchor.href = href;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.setAttribute('role', 'listitem');
      anchor.setAttribute('aria-label', 'Instagram @iamyoaz');
      anchor.setAttribute('data-ig-rank', String(count + 1));
      const img = document.createElement('img');
      img.src = image;
      img.alt = (typeof item.caption === 'string' ? item.caption.slice(0, 140) : '') || 'Instagram @iamyoaz';
      img.loading = count < 2 ? 'eager' : 'lazy';
      img.decoding = 'async';
      img.width = 900;
      img.height = 900;
      anchor.appendChild(img);
      fragment.appendChild(anchor);
      count += 1;
    }
    if (!count) throw new Error('HOLD_INSTAGRAM_NO_SAFE_ITEMS');
    grid.replaceChildren(fragment);
    return count;
  }
  // A single, in-memory request shared by legacy Instagram widgets.
  // No storage, token handling, paid API, background refresh or retry loop.
  let inFlight = null;
  let cached = null;
  const FEED_CACHE_MS = 60 * 1000;
  const FEED_TIMEOUT_MS = 8000;

  async function fetchFeed() {
    const now = Date.now();
    if (cached && now >= cached.at && now - cached.at < FEED_CACHE_MS) return cached.data;
    if (inFlight) return inFlight;
    const pending = (async function () {
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      let timer;
      const deadline = new Promise(function (_resolve, reject) {
        timer = setTimeout(function () {
          reject(new Error('HOLD_INSTAGRAM_TIMEOUT'));
          if (controller) controller.abort();
        }, FEED_TIMEOUT_MS);
      });
      const request = (async function () {
        const options = { headers: { Accept: 'application/json' }, cache: 'no-store' };
        if (controller) options.signal = controller.signal;
        const response = await fetch('/.netlify/functions/instagram-feed', options);
        if (!response || !response.ok) throw new Error('HOLD_INSTAGRAM_HTTP');
        const data = await response.json();
        if (!data || data.ok !== true || !Array.isArray(data.items) || !data.items.length) {
          throw new Error('HOLD_INSTAGRAM_RESPONSE');
        }
        return data;
      })();
      try {
        const data = await Promise.race([request, deadline]);
        cached = { at: Date.now(), data };
        return data;
      } finally {
        clearTimeout(timer);
      }
    })();
    inFlight = pending;
    try {
      return await pending;
    } finally {
      if (inFlight === pending) inFlight = null;
    }
  }

  root.yoazFetchInstagramFeed = fetchFeed;
  root.yoazRenderInstagramTiles = render;
})(window);
