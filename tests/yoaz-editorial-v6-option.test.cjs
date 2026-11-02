// Ensures V6 remains an opt-in CSS experiment until the artist approves it.
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html');
const css=read('assets/css/yoaz-editorial-v6-option.css');

test('original homepage does not activate V6 or change core page anatomy',()=>{
  assert.ok(!html.includes('yoaz-editorial-v6-option.css'));
  const sections=['hero','client','shop','gallery','video','about','instagram','faq','contact'];
  const positions=sections.map(id=>html.indexOf('id="'+id+'"'));
  assert.ok(positions.every((p,i)=>p>=0&&(i===0||p>positions[i-1])));
  assert.match(html,/images\/hero-transparent\.png/);
  assert.equal((html.match(/class="edition-card"/g)||[]).length,5);
});
test('V6 stylesheet retains original artworks and authentic brand marks',()=>{
  for(const selector of ['#hero .hname','#yoaz-mobile-hero .yoaz-mobile-title',
    '.section-mega-title','#client .cw-grid','#shop .edition-grid','#gallery .gal-grid',
    '.yoaz-real-logo-row.yoaz-visible-client-logos .real-logo img'])
    assert.ok(css.includes(selector),'Missing CSS selector '+selector);
  assert.doesNotMatch(css,/@import|url\s*\(|display\s*:\s*none\s*!important/i);
  assert.match(css,/object-fit:contain/);
  assert.match(css,/prefers-reduced-motion/);
});
test('all eleven logo files remain in canonical HTML and the artwork repository',()=>{
  const names=['adobe','apple','nike','adidas','playstation','marvel','fortune','cadillac','converse','asics','visa'];
  const block=html.match(/<div class="yoaz-real-logo-row yoaz-visible-client-logos"[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(block);
  const found=[...block[1].matchAll(/src="images\/brand-white-([^"]+)\.png"/g)].map(m=>m[1]);
  assert.deepEqual(found,names);
  for(const name of names)assert.ok(fs.existsSync(path.join(root,'images/brand-white-'+name+'.png')));
  assert.match(css,/grid-template-columns:repeat\(4/);
  assert.match(css,/grid-template-columns:repeat\(3/);
  assert.match(css,/grid-template-columns:repeat\(2/);
});
