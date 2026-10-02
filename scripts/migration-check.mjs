#!/usr/bin/env node

// YOAZ — migration preflight checker.
// Usage: PREVIEW_URL=https://xxxx.pages.dev node scripts/migration-check.mjs
// Optional: LIVE_URL=https://yoaz.fr node scripts/migration-check.mjs

const LIVE = (process.env.LIVE_URL || 'https://yoaz.fr').replace(/\/$/, '');
const PREVIEW = (process.env.PREVIEW_URL || '').replace(/\/$/, '');

if (!PREVIEW) {
  console.error('PREVIEW_URL is required. Example: PREVIEW_URL=https://xxxx.pages.dev node scripts/migration-check.mjs');
  process.exit(2);
}

const criticalPaths = [
  '/',
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
  '/manifest.webmanifest',
  '/order-success.html',
  '/images/hero.jpg',
  '/images/hero.webp',
  '/images/projects/adobe-max-02.jpg',
  '/images/projects/psa-gow-01.jpg',
  '/images/projects/adidas-01.jpg',
];

function extractMeta(html) {
  const get = (re) => (html.match(re)?.[1] || '').trim();
  return {
    title: get(/<title[^>]*>([\s\S]*?)<\/title>/i),
    description: get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
      get(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i),
    canonical: get(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) ||
      get(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i),
    robots: get(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i) ||
      get(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i),
    h1Count: (html.match(/<h1\b/gi) || []).length,
  };
}

async function fetchInfo(base, path) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const type = res.headers.get('content-type') || '';
    const text = type.includes('text/') || type.includes('html') || type.includes('xml') || path.endsWith('.txt')
      ? await res.text()
      : '';
    return {
      url,
      status: res.status,
      ok: res.ok,
      finalUrl: res.url,
      contentType: type,
      contentLength: res.headers.get('content-length') || '',
      xRobotsTag: res.headers.get('x-robots-tag') || '',
      text,
    };
  } catch (error) {
    return { url, status: 0, ok: false, error: error.message, text: '' };
  }
}

let failed = false;
console.log(`\nYOAZ migration check\nLIVE:    ${LIVE}\nPREVIEW: ${PREVIEW}\n`);

for (const path of criticalPaths) {
  const [live, preview] = await Promise.all([fetchInfo(LIVE, path), fetchInfo(PREVIEW, path)]);
  const liveState = live.ok ? `${live.status}` : `${live.status || 'ERR'}`;
  const previewState = preview.ok ? `${preview.status}` : `${preview.status || 'ERR'}`;
  const pass = preview.ok;
  if (!pass) failed = true;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${path} | live=${liveState} preview=${previewState}`);
}

const [liveHome, previewHome] = await Promise.all([fetchInfo(LIVE, '/'), fetchInfo(PREVIEW, '/')]);
if (previewHome.ok) {
  const p = extractMeta(previewHome.text);
  const l = liveHome.ok ? extractMeta(liveHome.text) : null;

  console.log('\nSEO preview:');
  console.log(p);

  if (!previewHome.xRobotsTag.toLowerCase().includes('noindex') && new URL(PREVIEW).hostname.endsWith('.pages.dev')) {
    console.log('FAIL preview pages.dev is not protected by X-Robots-Tag noindex');
    failed = true;
  } else if (new URL(PREVIEW).hostname.endsWith('.pages.dev')) {
    console.log('PASS pages.dev preview has noindex protection');
  }

  if (l) {
    for (const key of ['title', 'description', 'canonical', 'h1Count']) {
      if (String(l[key]) !== String(p[key])) {
        console.log(`WARN homepage ${key} differs | live=${JSON.stringify(l[key])} preview=${JSON.stringify(p[key])}`);
      } else {
        console.log(`PASS homepage ${key} matches`);
      }
    }
  } else {
    console.log('WARN live homepage unavailable; exact live/preview SEO comparison postponed.');
  }
}

console.log(`\n${failed ? 'MIGRATION NOT READY' : 'PREFLIGHT PASSED'}\n`);
process.exit(failed ? 1 : 0);
