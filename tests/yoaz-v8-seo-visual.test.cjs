// YOAZ V8 — SEO and visual-regression guard. Pure local filesystem, no network or deploy.
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const live=read('index.html');
const preview=read('previews/YOAZ_V8_CORE_IMAGES_EMBEDDED_20261102.html');
const css=read('assets/css/yoaz-editorial-v8-option.css');
const slugs=['adobe-max','playstation-god-of-war','adidas-paris','converse-citadium','relic-cipher','fast-company'];
const logos=['adobe','apple','nike','adidas','playstation','marvel','fortune','cadillac','converse','asics','visa'];

test('V8 is opt-in only: existing canonical page remains indexable and SEO metadata untouched',()=>{
  assert.match(live,/<title>Yoaz/);
  assert.match(live,/<meta name="description"/);
  assert.match(live,/<meta name="robots" content="index,follow/);
  assert.match(live,/<link rel="canonical" href="https:\/\/yoaz\.fr\/"/);
  for(const lang of ['fr','en','nl','es','x-default'])
    assert.ok(live.includes('hreflang="'+lang+'"'),'Missing original hreflang '+lang);
  for(const tag of ['og:title','og:description','og:image','og:url','twitter:card'])
    assert.ok(live.includes(tag),'Missing metadata '+tag);
  assert.match(live,/<script type="application\/ld\+json">/);
  assert.match(live,/"@type": "Person"/);
  assert.match(live,/"@type": "WebSite"/);
  assert.doesNotMatch(live,/yoaz-editorial-v8-option\.css|YOAZ_V8_CORE_IMAGES_EMBEDDED_20261102/);
  assert.match(preview,/noindex,nofollow/);
  assert.doesNotMatch(preview,/<link[^>]*rel="canonical"/i);
});
test('original internal sections, pages, logos and shop remain available to crawlers',()=>{
  let last=-1;
  for(const id of ['hero','client','shop','gallery','video','about','instagram','faq','contact']){
    const i=live.indexOf('id="'+id+'"');
    assert.ok(i>last,'Original section removed or moved: '+id);
    last=i;
  }
  assert.equal((live.match(/class="edition-card"/g)||[]).length,5);
  for(const slug of slugs) assert.ok(live.includes('href="/projets/'+slug+'/"'),'Missing indexed project '+slug);
  for(const logo of logos)assert.ok(live.includes('images/brand-white-'+logo+'.png'),'Lost original client logo '+logo);
  assert.match(read('robots.txt'),/Sitemap: https:\/\/yoaz\.fr\/sitemap\.xml/);
  assert.match(read('robots.txt'),/Sitemap: https:\/\/yoaz\.fr\/image-sitemap\.xml/);
});
test('V8 preview contains authentic visual assets (5 clients, 11 logos, 5 posters, 19 originals)',()=>{
  const tags=preview.match(/<img\b[^>]*>/g)||[];
  assert.equal(tags.length,42,'Missing preview images');
  assert.equal((preview.match(/data-original-src="https:\/\/yoaz\.fr\/images\//g)||[]).length,31,'Core images not embedded');
  assert.equal((preview.match(/class="poster"/g)||[]).length,5,'Poster selection changed');
  assert.equal((preview.match(/class="artwork"/g)||[]).length,19,'Gallery selection changed');
  assert.equal((preview.match(/class="proj"/g)||[]).length,5,'Editorial projects changed');
  const originalSrcs=tags.map(t=>(t.match(/data-original-src="([^"]+)"/)||t.match(/src="([^"]+)"/)||[])[1]);
  for(const logo of logos) assert.ok(originalSrcs.includes('https://yoaz.fr/images/brand-white-'+logo+'.png'),'Missing '+logo+' PNG');
  assert.match(preview,/src="data:image\/webp;base64,/);
  assert.match(preview,/src="data:image\/png;base64,/);
  assert.equal((preview.match(/<h1\b/g)||[]).length,1);
  for(const n of ['selected','shop','artworks','motion','instagram','faq','contact'])
    assert.ok(preview.includes('id="'+n+'"'),n+' missing');
});
test('optional design stylesheet cannot remove indexable content',()=>{
  assert.match(css,/yoaz-v8-ink/);
  for(const selector of ['#client .cw-grid','#shop .edition-grid','#gallery .gal-grid','.yoaz-real-logo-row.yoaz-visible-client-logos']){
    assert.ok(css.includes(selector),'V8 CSS missed '+selector);
  }
  assert.doesNotMatch(css,/@import|url\s*\(|display\s*:\s*none|visibility\s*:\s*hidden|content-visibility\s*:\s*hidden/i);
  assert.match(css,/object-fit:contain/);
  assert.match(css,/prefers-reduced-motion/);
});
