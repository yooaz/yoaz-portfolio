// Validate on-disk SEO maps without network, production requests or Netlify.
// Run with Node >=22: node --test tests/yoaz-sitemaps.test.cjs
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const slugs=['adobe-max','playstation-god-of-war','adidas-paris','converse-citadium','relic-cipher','fast-company'];
const main=read('sitemap.xml');
const images=read('image-sitemap.xml');
const namespace='xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
const urlEntries=xml=>[...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m=>({
  xml:m[1],url:(m[1].match(/<loc>(https:\/\/yoaz\.fr\/[^<]*)<\/loc>/)||[])[1]
}));

test('sitemaps use the Google-supported image namespace and valid entry URLs',()=>{
  for(const [name,xml] of [['sitemap.xml',main],['image-sitemap.xml',images]]){
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'),name+' XML preamble');
    assert.ok(xml.includes(namespace),name+' incorrect image namespace');
    assert.match(xml,/<\/urlset>\s*$/);
    const entries=urlEntries(xml);
    assert.equal(entries.length,13,name+' must have 1 homepage + 12 bilingual projects');
    assert.equal(new Set(entries.map(e=>e.url)).size,entries.length,name+' duplicate page URLs');
  }
  assert.doesNotMatch(images,/<image:(?:title|caption|geo_location|license)>/i,'Deprecated Google image tags');
});

test('each project canonical and its four local images occur in both sitemaps',()=>{
  const indexed=urlEntries(main),imageEntries=urlEntries(images);
  assert.deepEqual(new Set(indexed.map(e=>e.url)),new Set(imageEntries.map(e=>e.url)));
  const homepage=imageEntries.find(e=>e.url==='https://yoaz.fr/');
  assert.ok(homepage,'Homepage missing');
  assert.equal((homepage.xml.match(/<image:image>/g)||[]).length,4,'Homepage image count');
  for(const slug of slugs){
    const fr='https://yoaz.fr/projets/'+slug+'/';
    const en='https://yoaz.fr/en/projects/'+slug+'/';
    for(const [locale,prefix,canonical] of [['fr','projets',fr],['en','en/projects',en]]){
      const html=read(prefix+'/'+slug+'.html');
      assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),canonical+' canonical mismatch');
      const sitemap=indexed.find(e=>e.url===canonical);
      const item=imageEntries.find(e=>e.url===canonical);
      assert.ok(sitemap&&item,'Sitemaps missing '+canonical);
      for(const [language,target] of [['fr',fr],['en',en],['x-default',fr]]){
        assert.ok(sitemap.xml.includes('hreflang="'+language+'" href="'+target+'"'),canonical+' hreflang '+language);
      }
      const pageImages=[...html.matchAll(/<img[^>]*src="(\/images\/[^"]+)"/g)].map(m=>m[1]);
      assert.equal(pageImages.length,4,canonical+' expected four images');
      const indexedImages=[...item.xml.matchAll(/<image:loc>https:\/\/yoaz\.fr(\/images\/[^<]+)<\/image:loc>/g)].map(m=>m[1]);
      assert.deepEqual(indexedImages,pageImages,canonical+' mismatched images');
      for(const file of indexedImages) assert.ok(fs.existsSync(path.join(root,file.slice(1))),file+' not in repository');
    }
  }
});
