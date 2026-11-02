// Offline safeguards for the opt-in V4 client-logo visual proposal.
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const home=read('index.html');
const style=read('assets/css/yoaz-brandwall-v4-option.css');

test('V4 grid is opt-in and never loaded in the actual homepage yet',()=>{
  assert.ok(!home.includes('yoaz-brandwall-v4-option.css'),'Unexpected automatic activation');
  assert.doesNotMatch(style,/@import|url\s*\(|display\s*:\s*none|(?:filter\s*:\s*invert)/i);
});
test('all 11 original brand marks remain present with descriptive alternatives',()=>{
  const block=home.match(/<div class="yoaz-real-logo-row yoaz-visible-client-logos"[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(block,'Canonical brand row missing');
  const images=[...block[1].matchAll(/<img\b[^>]*src="([^"]+)"[^>]*alt="([^"]+)"/g)];
  const brands=['adobe','apple','nike','adidas','playstation','marvel','fortune','cadillac','converse','asics','visa'];
  assert.equal(images.length,brands.length);
  for(const [i,brand] of brands.entries()){
    assert.equal(images[i][1],'images/brand-white-'+brand+'.png');
    assert.ok(images[i][2].toLowerCase().includes(brand),'Missing accessible name for '+brand);
    assert.ok(fs.existsSync(path.join(root,images[i][1])),'Missing original logo '+brand);
  }
});
test('V4 CSS preserves real logo images and mobile responsiveness',()=>{
  assert.match(style,/\.yoaz-real-logo-row\.yoaz-visible-client-logos/);
  assert.match(style,/grid-template-columns:\s*repeat\(4/);
  assert.match(style,/@media\(max-width:850px\)/);
  assert.match(style,/grid-template-columns:\s*repeat\(3/);
  assert.match(style,/object-fit:contain/);
  assert.match(style,/prefers-reduced-motion/);
});
test('original horse and poster collection are not replaced',()=>{
  assert.ok(home.includes('images/hero-transparent.png'));
  assert.equal((home.match(/class="edition-card"/g)||[]).length,5);
  assert.ok(home.includes('id="gallery"')&&home.includes('id="contact"'));
});
