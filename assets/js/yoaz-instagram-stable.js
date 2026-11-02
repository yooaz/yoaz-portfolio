/* YOAZ — Instagram controller: one rendering owner, safe DOM, graceful local fallback.
 * No build tooling. Requires the #ig-grid markup already in the existing homepage.
 */
(() => {
  'use strict';
  const GRID_ID = 'ig-grid';
  const PROFILE = 'https://www.instagram.com/iamyoaz/';
  const API = '/.netlify/functions/instagram-feed';
  let started = false;

  function validUrl(value, kind) {
    try {
      const url = new URL(String(value || ''));
      if (url.protocol !== 'https:' || url.username || url.password) return null;
      if (kind === 'post' && !/^(www\.)?instagram\.com$/.test(url.hostname)) return null;
      return url.href;
    } catch (_) { return null; }
  }

  function cardFor(item, index) {
    const link = validUrl(item.permalink, 'post');
    const image = validUrl(item.media_url || item.thumbnail_url, 'image');
    if (!link || !image) return null;
    const a = document.createElement('a');
    a.className = 'ig-tile reveal' + (index === 0 ? ' ig-latest' : '');
    a.dataset.igRank = String(index + 1);
    a.href = link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('role', 'listitem');
    a.setAttribute('aria-label', 'Instagram @iamyoaz — publication ' + (index + 1));
    const img = document.createElement('img');
    img.src = image;
    img.alt = String(item.caption || 'Illustration YOAZ sur Instagram').replace(/[\u0000-\u001f]/g,' ').slice(0, 150);
    img.decoding = 'async';
    img.loading = index < 2 ? 'eager' : 'lazy';
    img.width = 900;
    img.height = 900;
    a.appendChild(img);
    return a;
  }

  function install() {
    if (started) return;
    started = true;
    const grid = document.getElementById(GRID_ID);
    if (!grid) return;
    const localCards = [...grid.children].map(element => element.cloneNode(true));
    const heading = document.getElementById('ig-heading');
    const fallbackLabels = {
      fr: 'Sélection d’œuvres',
      en: 'Selected artwork',
      nl: 'Geselecteerde kunstwerken',
      es: 'Obras seleccionadas'
    };
    const liveLabels = {
      fr: 'Sur Instagram',
      en: 'On Instagram',
      nl: 'Op Instagram',
      es: 'En Instagram'
    };
    let isLive = false;
    const language = () => {
      const candidate = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
      return Object.prototype.hasOwnProperty.call(fallbackLabels, candidate) ? candidate : 'fr';
    };
    const updateTitle = () => {
      if (heading) {
        const desired = (isLive ? liveLabels : fallbackLabels)[language()];
        if (heading.textContent !== desired) heading.textContent = desired;
        heading.removeAttribute('data-key');
      }
    };
    const fallback = () => {
      isLive = false;
      grid.replaceChildren(...localCards.map(element => element.cloneNode(true)));
      grid.setAttribute('data-ig-feed', 'curated-local');
      grid.classList.remove('ig-grid--pending', 'instagram-grid--real');
      grid.classList.add('ig-grid--loaded', 'instagram-grid--featured');
      grid.querySelectorAll('a').forEach(a => {
        a.href = PROFILE;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.setAttribute('aria-label', 'Voir le profil Instagram officiel @iamyoaz');
      });
      updateTitle();
    };

    fallback();
    /* Existing language switch updates <html lang>. No polling or per-second timers. */
    new MutationObserver(updateTitle).observe(document.documentElement, { attributes:true, attributeFilter:['lang'] });
    // Legacy translation scripts sometimes rewrite this heading after language changes.
    if (heading) new MutationObserver(updateTitle).observe(heading, {childList:true, subtree:true, characterData:true});
    const aborter = new AbortController();
    const timeout = setTimeout(() => aborter.abort(), 8000);
    fetch(API, { headers:{ Accept:'application/json' }, cache:'no-store', signal:aborter.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Instagram API unavailable');
        const payload = await response.json();
        if (!payload || payload.ok !== true || !Array.isArray(payload.items)) throw new Error('Invalid Instagram API response');
        const cards = payload.items.slice(0, 9).map(cardFor).filter(Boolean);
        if (!cards.length) throw new Error('No usable Instagram media');
        return cards;
      })
      .then(cards => {
        isLive = true;
        grid.replaceChildren(...cards);
        grid.setAttribute('data-ig-feed', 'instagram-graph-api');
        grid.classList.remove('ig-grid--pending', 'instagram-grid--featured');
        grid.classList.add('ig-grid--loaded', 'instagram-grid--real');
        /* Broken external media must not leave an empty / flashing gallery. */
        grid.querySelectorAll('img').forEach(img => img.addEventListener('error', fallback, { once:true }));
        updateTitle();
      })
      .catch(() => { if (!isLive) fallback(); })
      .finally(() => clearTimeout(timeout));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
