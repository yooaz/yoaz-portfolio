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

test('new scripts and functions are valid JavaScript', () => {
  for (const filename of [
    'assets/js/yoaz-instagram-stable.js', 'assets/js/yoaz-case-navigation.js',
    'netlify/functions/instagram-feed.js', 'netlify/functions/create-checkout.js'
  ]) assert.doesNotThrow(() => new vm.Script(read(filename), {filename}));
});

test('static project pages and sitemap are complete', () => {
  const xml = read('sitemap.xml');
  assert.doesNotMatch(xml, /https:\/\/yoaz\.fr\/#/);
  for (const slug of caseNames) {
    assert.match(home, new RegExp('href="/projets/' + slug + '\\.html"'));
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
      assert.ok(xml.includes('https://yoaz.fr/' + filepath));
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
