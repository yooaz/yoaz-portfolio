// V3 design protection: offline Node test, no browser requests and no Netlify.
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const home=read('index.html');
const css=read('assets/css/yoaz-editorial-v3-option.css');

test('V3 stylesheet remains isolated from production homepage',()=>{
  assert.doesNotMatch(home,/href="[^"]*yoaz-editorial-v3-option\.css"/);
  assert.doesNotMatch(home,/src="[^"]*yoaz-editorial-v3-option\.css"/);
  assert.doesNotMatch(css,/@import|url\s*\(/i,'No remote fonts or files are added');
  assert.doesNotMatch(css,/display\s*:\s*none\s*!important/i,'No elements may be hidden');
});
test('V3 styles only change typography, spacing and focus of existing components',()=>{
  for(const selector of ['#hero .hname','#yoaz-mobile-hero .yoaz-mobile-title',
    '.section-mega-title','#client .cw-grid','#shop .edition-grid','#gallery .gal-grid']){
    assert.ok(css.includes(selector),'Missing '+selector);
  }
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
});
test('all original sections, horse and edition cards remain unchanged',()=>{
  const sections=['hero','client','shop','gallery','video','about','instagram','faq','contact'];
  const offsets=sections.map(id=>home.indexOf('id="'+id+'"'));
  assert.ok(offsets.every((n,i)=>n>=0&&(i===0||n>offsets[i-1])));
  assert.match(home,/images\/hero-transparent\.png/);
  assert.equal((home.match(/class="edition-card"/g)||[]).length,5);
  for(const brand of ['adobe','nike','playstation','visa']) {
    assert.ok(home.includes('brand-white-'+brand+'.png'),'Missing logo '+brand);
  }
});
