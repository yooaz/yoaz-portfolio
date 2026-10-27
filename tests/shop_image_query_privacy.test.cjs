'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditCatalog}=require('../tools/shop-catalog-audit.cjs');
function valid(image='https://cdn.shopify.com/s/files/1/example.webp?v=1773251789') {
 return {id:'synthetic',slug:'synthetic-poster',title:'Synthetic Poster',alt:'Test image',active:true,featured:false,
 currency:'EUR',priceFrom:19.83,sizes:['40x50 cm'],image,
 shopifyProductUrl:'https://yoaz-art.myshopify.com/products/synthetic-poster',printFileUrl:''};
}
const reasons=image=>auditCatalog([valid(image)]).failures.join(' ');
for(const [name,image] of [
 ['encoded secret key','https://cdn.shopify.com/s/files/1/example.webp?api%5fkey=private'],
 ['unknown query','https://cdn.shopify.com/s/files/1/example.webp?v=1773251789&private=private'],
 ['unexpected signature','https://cdn.shopify.com/s/files/1/example.webp?signature=private'],
 ['fragment carrying secret','https://cdn.shopify.com/s/files/1/example.webp?v=1773251789#private-session'],
 ['non-numeric version','https://cdn.shopify.com/s/files/1/example.webp?v=private'],
 ['repeated version','https://cdn.shopify.com/s/files/1/example.webp?v=1773251789&v=7777777777'],
 ['encoded v key','https://cdn.shopify.com/s/files/1/example.webp?%76=1773251789'],
 ['leading query separator','https://cdn.shopify.com/s/files/1/example.webp?&v=1773251789'],
]) test('reject '+name,()=>assert.match(reasons(image),/UNTRUSTED_IMAGE_URL/));
test('retain existing numeric Shopify CDN version',()=>assert.deepEqual(auditCatalog([valid()]).failures,[]));
test('allow public Shopify CDN image without query parameters',()=>assert.deepEqual(auditCatalog([valid('https://cdn.shopify.com/s/files/1/example.webp')]).failures,[]));
test('still reject untrusted external host',()=>assert.match(reasons('https://cdn.shopify.com.evil.invalid/s/files/1/test.webp?v=1773251789'),/UNTRUSTED_IMAGE_URL/));
test('reject empty query delimiter after image filename',()=>assert.match(reasons('https://cdn.shopify.com/s/files/1/example.webp?'),/UNTRUSTED_IMAGE_URL/));
test('reject empty fragment delimiter after image filename',()=>assert.match(reasons('https://cdn.shopify.com/s/files/1/example.webp#'),/UNTRUSTED_IMAGE_URL/));
test('reject double query delimiters before public version',()=>assert.match(reasons('https://cdn.shopify.com/s/files/1/example.webp??v=1773251789'),/UNTRUSTED_IMAGE_URL/));
