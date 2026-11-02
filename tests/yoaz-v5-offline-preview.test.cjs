// Offline and untrusted-asset QA for the isolated YOAZ V5 design preview.
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const preview=read('previews/YOAZ_V5_OFFLINE_20261102.html');
const index=read('index.html');
const originalOrder=['adobe','apple','nike','adidas','playstation','marvel','fortune','cadillac','converse','asics','visa'];
const embedded=[...preview.matchAll(/window\.YOAZ_ASSETS\["([^"]+)"\]="data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)";/g)]
 .map(m=>({name:m[1],mime:m[2],data:m[3]}));
const images=[...preview.matchAll(/\bdata-file="([^"]+)"/g)].map(m=>m[1]);

test('every V5 preview image has real, self-contained bytes with a valid signature',()=>{
 assert.equal(embedded.length,22,'All 22 real assets should be embedded, not remote');
 assert.equal(new Set(embedded.map(x=>x.name)).size,22);
 for(const asset of embedded){
   const binary=Buffer.from(asset.data,'base64');
   assert.ok(binary.length>1000,asset.name+' is empty');
   const signature=asset.mime==='image/png'?binary.subarray(0,8).toString('hex')==='89504e470d0a1a0a'
    :asset.mime==='image/webp'?binary.subarray(0,4).toString('ascii')==='RIFF'&&binary.subarray(8,12).toString('ascii')==='WEBP'
    :asset.mime==='image/jpeg'?binary[0]===255&&binary[1]===216
    :false;
   assert.ok(signature,'Invalid image header: '+asset.name);
 }
 assert.ok(images.length>=22);
 for(const name of images)assert.ok(embedded.some(a=>a.name===name),'Missing embedded image '+name);
 assert.doesNotMatch(preview,/<(?:script|link)[^>]*(?:src|href)=["']https?:/i,'No remote script or CSS');
});
test('eleven authentic client marks preserve the existing order',()=>{
 const start=preview.indexOf('class="logo-grid"');
 const end=preview.indexOf('</section>',start);
 const names=[...preview.slice(start,end).matchAll(/data-file="brand-white-([^"]+)\.png"/g)].map(m=>m[1]);
 assert.deepEqual(names,originalOrder);
 assert.equal((preview.match(/class="mark" role="listitem"/g)||[]).length,11);
 for(const name of originalOrder)assert.ok(index.includes('brand-white-'+name+'.png'));
});
test('preview does not replace the live page, delete posters or move the main sections',()=>{
 assert.ok(!index.includes('YOAZ_V5_OFFLINE_20261102.html'));
 assert.equal((index.match(/class="edition-card"/g)||[]).length,5);
 assert.equal((preview.match(/class="poster"/g)||[]).length,5);
 const order=['hero','client','logos','shop','gallery','motion','about','instagram','faq','contact'];
 const offsets=order.map(id=>preview.indexOf('id="'+id+'"'));
 assert.ok(offsets.every((p,i)=>p>=0&&(i===0||p>offsets[i-1])));
 assert.ok(preview.includes('hero-cutout.webp'));
 assert.match(preview,/name="robots" content="noindex,nofollow"/);
});
test('inline scripts parse and the preview has no network fetch requirement',()=>{
 const scripts=[...preview.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 assert.equal(scripts.length,2);
 for(const script of scripts)assert.doesNotThrow(()=>new Function(script));
 assert.doesNotMatch(preview,/\bfetch\s*\(/);
 assert.doesNotMatch(preview,/https:\/\/raw\.githubusercontent\.com/);
 assert.ok(preview.includes('class="mobile-toggle"'));
 assert.ok(preview.includes('dialog.showModal()'));
});
