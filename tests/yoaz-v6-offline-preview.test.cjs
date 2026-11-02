// Off-network QA for the optional YOAZ V6 editorial portfolio preview.
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('previews/YOAZ_V6_EDITORIAL_OFFLINE_20261102.html');
const live=read('index.html');
const assets=[...html.matchAll(/window\.YOAZ_ASSETS\["([^"]+)"\]="data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)";/g)]
 .map(m=>({name:m[1],mime:m[2],base64:m[3]}));
const originals=['adobe','apple','nike','adidas','playstation','marvel','fortune','cadillac','converse','asics','visa'];

test('all 27 distinct source artworks and original brand marks are embedded and valid',()=>{
  assert.equal(assets.length,27);
  assert.equal(new Set(assets.map(a=>a.name)).size,27);
  for(const a of assets){
    const bytes=Buffer.from(a.base64,'base64');
    assert.ok(bytes.length>1000,a.name+' empty or truncated');
    if(a.mime==='image/png')assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',a.name);
    else if(a.mime==='image/webp'){
      assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF',a.name);
      assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP',a.name);
    } else if(a.mime==='image/jpeg')assert.equal(bytes.subarray(0,2).toString('hex'),'ffd8',a.name);
    else assert.fail('Unknown media type '+a.mime);
  }
  const cited=[...html.matchAll(/data-file="([^"]+)"/g)].map(m=>m[1]);
  assert.ok(cited.length>=30);
  for(const name of cited)assert.ok(assets.some(a=>a.name===name),'Image not embedded: '+name);
});

test('V6 keeps the 11 real brand PNGs, exact original order and logo section',()=>{
  const begin=html.indexOf('<div class="logo-grid"');
  const end=html.indexOf('</section>',begin);
  assert.ok(begin>=0&&end>begin);
  const brandOrder=[...html.slice(begin,end).matchAll(/data-file="brand-white-([^"]+)\.png"/g)].map(m=>m[1]);
  assert.deepEqual(brandOrder,originals);
  assert.equal((html.match(/class="mark" role="listitem"/g)||[]).length,11);
  for(const n of originals){
    assert.ok(live.includes('images/brand-white-'+n+'.png'));
    assert.ok(assets.some(a=>a.name==='brand-white-'+n+'.png'));
  }
  assert.match(html,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('V6 has five authentic selected clients, seven personal works and five posters',()=>{
  for(const [klass,count] of [['project',5],['artwork',7],['poster',5]])
    assert.equal((html.match(new RegExp('class="'+klass+'"','g'))||[]).length,count,klass);
  for(const f of ['client-adobe.webp','client-adidas-paris.webp','client-playstation-metro.webp',
    'client-hoppy.jpg','projects/converse-01.jpg','gallery-soleil.webp',
    'gallery-metamorphose.webp','gallery-ames-jumelles.webp'])
    assert.ok(assets.some(x=>x.name===f),'Missing '+f);
  assert.equal((live.match(/class="edition-card"/g)||[]).length,5,'Production posters preserved');
  assert.doesNotMatch(live,/YOAZ_V6_EDITORIAL_OFFLINE_20261102\.html/,'Preview must remain isolated');
});

test('no external resources or indexed preview; original section order preserved',()=>{
  assert.match(html,/name="robots" content="noindex,nofollow"/);
  assert.doesNotMatch(html,/<(?:script|link)[^>]*\b(?:src|href)="https?:/);
  assert.doesNotMatch(html,/\bfetch\s*\(/);
  const names=['hero','client','logos','shop','gallery','motion','about','instagram','faq','contact'];
  const positions=names.map(n=>html.indexOf('id="'+n+'"'));
  assert.ok(positions.every((p,i)=>p>=0&&(i===0||p>positions[i-1])));
  assert.match(html,/hero-cutout\.webp/);
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  assert.equal(scripts.length,2);
  for(const script of scripts)assert.doesNotThrow(()=>new Function(script));
});
