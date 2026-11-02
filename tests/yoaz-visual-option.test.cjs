// Offline QA for optional YOAZ visual direction. No preview CSS is loaded by the live homepage.
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const home=read('index.html'), css=read('assets/css/yoaz-visual-option-2026.css');

test('visual option is opt-in and cannot silently replace the production styling',()=>{
  assert.doesNotMatch(home,/src="[^"]*yoaz-visual-option-2026\.css"/);
  assert.doesNotMatch(home,/href="[^"]*yoaz-visual-option-2026\.css"/);
  assert.doesNotMatch(css,/@import\s|url\s*\(/i);
  assert.doesNotMatch(css,/display\s*:\s*none\s*!important/i);
  assert.doesNotMatch(css,/(?:document\.|window\.|fetch\s*\()/);
});

test('visual direction preserves branded artwork, poster count and section order',()=>{
  const ids=['hero','client','shop','gallery','video','about','instagram','faq','contact'];
  const offsets=ids.map(id=>home.indexOf('id="'+id+'"'));
  assert.ok(offsets.every((x,i)=>x!==-1&&(i===0||x>offsets[i-1])),'Homepage sections moved');
  assert.match(home,/images\/hero-transparent\.png/,'Original horse absent');
  for(const logo of ['brand-white-adobe.png','brand-white-visa.png','brand-white-nike.png']) {
    assert.ok(home.includes(logo),logo+' missing');
  }
  assert.equal((home.match(/class="edition-card"/g)||[]).length,5,'Five posters must remain');
  assert.match(css,/#client \.cw-grid/);
  assert.match(css,/#shop \.edition-grid/);
  assert.match(css,/#gallery \.gal-grid/);
  assert.match(css,/prefers-reduced-motion/);
});
