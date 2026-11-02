// node --test tests/yoaz-current.test.cjs
// No Netlify deploy, payment, Instagram token or external network request.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const home = read('index.html');
const caseNames = ['adobe-max','playstation-god-of-war','adidas-paris','converse-citadium','relic-cipher'];

test('preserve homepage structure, assets and commercial elements', () => {
  const ids = ['hero','client','shop','gallery','video','about','instagram','faq','contact'];
  let pos = -1;
  for (const id of ids) {
    const at = home.indexOf('id="' + id + '"');
    assert.ok(at > pos, 'Section absent or moved: ' + id);
    pos = at;
  }
  assert.match(home, /images\/hero-transparent\.png/);
  assert.match(home, /brand-white-adobe\.png/);
  assert.match(home, /brand-white-visa\.png/);
  assert.match(home, /id="yoaz-mobile-hero"/);
  assert.equal((home.match(/class="edition-card"/g) || []).length, 5);
});

test('single stable contact and Stripe controllers without duplicate handlers', () => {
  assert.match(home, /assets\/js\/yoaz-contact-stable\.js/);
  assert.match(home, /assets\/js\/yoaz-checkout-stable\.js/);
  assert.match(home, /window\.YOAZ_CHECKOUT_MANAGED = true/);
  assert.doesNotMatch(home, /document\.getElementById\('contact-form'\)\.addEventListener\('submit'/);
  assert.equal((home.match(/id="contact-form"/g) || []).length, 1);
  assert.match(home, /formspree\.io\/f\/xlgpnrze/);
  assert.ok((home.match(/YOAZ_CHECKOUT_MANAGED\) return/g) || []).length >= 4);
});

test('one Instagram renderer, retired Behold and old scripts gated', () => {
  assert.doesNotMatch(home, /BEHOLD_FEED_URL/);
  assert.match(home, /YOAZ_INSTAGRAM_MANAGED = true/);
  assert.match(home, /assets\/js\/yoaz-instagram-stable\.js/);
  const legacyHandlers = [
    'function improveInstagram(){', 'function ensureInstagramFallback(){',
    'ensureInstagramFallback.force=function(){', 'async function loadInstagram(){',
    'function instagramFeed(){', 'function instagram(){'
  ];
  for (const prefix of legacyHandlers) {
    assert.ok(home.includes(prefix + ' if (window.YOAZ_INSTAGRAM_MANAGED) return;'),
      'Legacy renderer may still execute: ' + prefix);
  }
});

test('historic regression: no globally self-triggering card observer or duplicate IDs', () => {
  assert.doesNotMatch(home, /mo\.observe\(document\.documentElement,\{childList:true,subtree:true\}\)/);
  const ids = [...home.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]);
  const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
  assert.deepEqual(duplicates, []);
  assert.match(home, /class="yoaz-project-detail-links" role="navigation"/);
  for (const tag of home.match(/<a\b[^>]*target="_blank"[^>]*>/g) || []) {
    assert.match(tag, /\brel="[^"]*noopener/, 'External link missing noopener: ' + tag);
  }
});

test('new scripts and functions are valid JavaScript', () => {
  for (const filename of [
    'assets/js/yoaz-instagram-stable.js', 'assets/js/yoaz-case-navigation.js',
    'assets/js/yoaz-contact-stable.js', 'assets/js/yoaz-checkout-stable.js',
    'netlify/functions/instagram-feed.js', 'netlify/functions/create-checkout.js'
  ]) assert.doesNotThrow(() => new vm.Script(read(filename), {filename}));
});

test('static project pages and sitemap are complete', () => {
  const xml = read('sitemap.xml');
  assert.doesNotMatch(xml, /https:\/\/yoaz\.fr\/#/);
  assert.doesNotMatch(xml, /<loc>[^<]+\.html<\/loc>/);
  assert.match(read('netlify.toml'), /pretty_urls\s*=\s*true/);
  for (const slug of caseNames) {
    assert.ok(home.includes('href="/projets/' + slug + '/"'), 'Home lacks canonical project link: ' + slug);
    for (const [locale, filepath] of [['fr', 'projets/' + slug + '.html'], ['en', 'en/projects/' + slug + '.html']]) {
      const page = read(filepath);
      assert.match(page, /<h1>/);
      assert.match(page, /<link rel="canonical"/);
      assert.match(page, /hreflang="fr"/);
      assert.match(page, /hreflang="en"/);
      assert.match(page, /<script type="application\/ld\+json">/);
      assert.ok((page.match(/<img /g) || []).length >= 4);
      assert.match(page, new RegExp('<html lang="' + locale + '"'));
      const srcs = [...page.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m=>m[1]);
      for (const src of srcs) {
        assert.ok(src.startsWith('/images/'), src);
        assert.ok(fs.existsSync(path.join(root, src)), 'Missing project image: ' + src);
      }
      const canonical = 'https://yoaz.fr/' + filepath.replace(/\.html$/, '/');
      assert.ok(xml.includes(canonical), 'Sitemap missing ' + canonical);
      assert.ok(page.includes('<link rel="canonical" href="' + canonical + '">'), 'Wrong canonical ' + filepath);
      assert.ok(page.includes('<meta property="og:url" content="' + canonical + '">'), 'Wrong Open Graph URL');
    }
  }
});

test('Instagram validators reject unsafe URLs', () => {
  const feed = require('../netlify/functions/instagram-feed.js');
  assert.equal(feed._test.safeHttps('javascript:alert(1)'), '');
  assert.equal(feed._test.safeHttps('http://example.com/image.jpg'), '');
  assert.equal(feed._test.validInstagramPost('https://evil.example/post'), '');
  assert.equal(feed._test.validInstagramPost('https://www.instagram.com/reel/ABC/'), 'https://www.instagram.com/reel/ABC/');
  const posts = feed._test.normalise([
    {id:'a',permalink:'https://www.instagram.com/p/POST01/',media_url:'https://cdn.example.org/img.jpg',timestamp:'2026-10-01T12:00:00Z'},
    {id:'b',permalink:'javascript:alert(1)',media_url:'https://cdn.example.org/bad.jpg',timestamp:'2026-10-02T12:00:00Z'}
  ],9);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].id, 'a');
});

test('Instagram cache is account/token scoped and refreshes after rotation', async () => {
  const feed = require('../netlify/functions/instagram-feed.js');
  const keys = ['INSTAGRAM_ACCESS_TOKEN','IG_GRAPH_ACCESS_TOKEN','INSTAGRAM_USER_ID','IG_USER_ID'];
  const old = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  const originalFetch = global.fetch;
  let calls = 0;
  try {
    delete process.env.IG_GRAPH_ACCESS_TOKEN; delete process.env.IG_USER_ID;
    process.env.INSTAGRAM_USER_ID = 'test-user';
    process.env.INSTAGRAM_ACCESS_TOKEN = 'test-token-ONE';
    global.fetch = async () => {
      calls++;
      return { ok:true, json:async () => ({data:[{
        id:String(calls),media_type:'IMAGE',media_url:'https://cdn.example.com/post.jpg',
        permalink:'https://www.instagram.com/p/example/',timestamp:'2026-10-01T12:00:00Z'
      }]})};
    };
    const one = await feed.handler({httpMethod:'GET'});
    assert.equal(one.statusCode,200);
    const cached = await feed.handler({httpMethod:'GET'});
    assert.equal(JSON.parse(cached.body).cached,true);
    assert.equal(calls,1);
    process.env.INSTAGRAM_ACCESS_TOKEN = 'test-token-TWO';
    const rotated = await feed.handler({httpMethod:'GET'});
    assert.equal(rotated.statusCode,200);
    assert.equal(JSON.parse(rotated.body).items[0].id,'2');
    assert.equal(calls,2);
  } finally {
    global.fetch = originalFetch;
    for (const k of keys) if(old[k]===undefined) delete process.env[k];else process.env[k]=old[k];
  }
});

test('missing Instagram access token fails closed without exposing secrets', async () => {
  const oldToken=process.env.INSTAGRAM_ACCESS_TOKEN, oldAlt=process.env.IG_GRAPH_ACCESS_TOKEN;
  try {
    delete process.env.INSTAGRAM_ACCESS_TOKEN; delete process.env.IG_GRAPH_ACCESS_TOKEN;
    const feed=require('../netlify/functions/instagram-feed.js');
    const res=await feed.handler({httpMethod:'GET'});
    assert.equal(res.statusCode, 503);
    assert.equal(JSON.parse(res.body).configured,false);
    assert.doesNotMatch(res.body, /access_token=|Bearer /i);
  } finally {
    if(oldToken===undefined) delete process.env.INSTAGRAM_ACCESS_TOKEN;else process.env.INSTAGRAM_ACCESS_TOKEN=oldToken;
    if(oldAlt===undefined) delete process.env.IG_GRAPH_ACCESS_TOKEN;else process.env.IG_GRAPH_ACCESS_TOKEN=oldAlt;
  }
});

test('checkout rejects malformed JSON, unknown products and large requests', async () => {
  const checkout=require('../netlify/functions/create-checkout.js');
  let r=await checkout.handler({httpMethod:'POST',body:'{bad-json'});
  assert.equal(r.statusCode,400);
  r=await checkout.handler({httpMethod:'POST',body:JSON.stringify({slug:'unknown-product'})});
  assert.equal(r.statusCode,400);
  r=await checkout.handler({httpMethod:'POST',body:'x'.repeat(3000)});
  assert.equal(r.statusCode,413);
  r=await checkout.handler({httpMethod:'GET'});
  assert.equal(r.statusCode,405);
});
