'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const code=fs.readFileSync(path.join(__dirname,'../scripts/instagram-safe-tiles.js'),'utf8');
const good = { ok:true, items:[{media_url:'https://scontent.cdninstagram.com/a.jpg',permalink:'https://www.instagram.com/p/123/'}]};
function setup(fetchImpl, clock=()=>1000) {
  const window={};
  vm.runInNewContext(code,{window,URL,fetch:fetchImpl,Date:{now:clock},setTimeout,clearTimeout,AbortController}, {timeout:1000});
  return window.yoazFetchInstagramFeed;
}

test('three concurrent widgets share exactly one HTTP request',async()=>{
  let calls=0, release;
  const gate=new Promise(resolve=>release=resolve);
  const get=setup(async(path,opts)=>{calls++;assert.equal(path,'/.netlify/functions/instagram-feed');assert.equal(opts.cache,'no-store');await gate;return {ok:true,json:async()=>good};});
  const p1=get(),p2=get(),p3=get();
  assert.equal(calls,1);
  release();
  const replies=await Promise.all([p1,p2,p3]);
  assert.deepEqual(replies.map(x=>x.items.length),[1,1,1]);
  assert.equal(calls,1);
});
test('recent successful response is reused only in-memory',async()=>{
  let n=0, t=1000;
  const get=setup(async()=>{n++;return {ok:true,json:async()=>good}},()=>t);
  await get();await get();t+=59_999;await get();assert.equal(n,1);
  t+=2;await get();assert.equal(n,2);
});
test('failed request is not cached; later explicit call retries',async()=>{
  let n=0;
  const get=setup(async()=>{n++;return n===1?{ok:false}:{ok:true,json:async()=>good}});
  await assert.rejects(get(),/HOLD_INSTAGRAM_HTTP/);
  const data=await get();assert.equal(data.items.length,1);assert.equal(n,2);
});
test('malformed provider data cannot be cached',async()=>{
  let n=0;
  const get=setup(async()=>{n++;return {ok:true,json:async()=> n===1?{ok:true,items:{}}:good}});
  await assert.rejects(get(),/HOLD_INSTAGRAM_RESPONSE/);
  assert.equal((await get()).items.length,1);assert.equal(n,2);
});
test('no request occurs simply by evaluating the helper',()=>{
  let n=0;const get=setup(()=>{n++;throw Error('should not run')});
  assert.equal(typeof get,'function');assert.equal(n,0);
});
test('future clock rollback invalidates cached entry',async()=>{
  let n=0, t=9000;
  const get=setup(async()=>{n++;return {ok:true,json:async()=>good}},()=>t);
  await get();t=1000;await get();assert.equal(n,2);
});
