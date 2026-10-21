'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'../netlify/functions');
function runModule(name,env={},fetcher=async()=>({ok:true,json:async()=>({data:[{id:'1',media_url:'https://cdn.instagram.com/a.jpg',permalink:'https://www.instagram.com/p/ok'}]})}),stripeBehavior='ok'){
  const calls=[];
  const context={exports:{},URL,Date,AbortSignal,process:{env},
    fetch:async(url,opts)=>{calls.push({url,opts});return fetcher(url,opts)},
    require(id){assert.equal(id,'stripe');return()=>({checkout:{sessions:{create:async payload=>{calls.push({payload});if(stripeBehavior==='error')throw Error('PRIVATE_STRIPE_SECRET');return {url:'https://checkout.stripe.com/test'}}}}})}
  };
  vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name,timeout:1500});
  return {handler:context.exports.handler,calls,env:context.process.env};
}
async function checkout(r,body,method='POST'){const res=await r.handler({httpMethod:method,body:typeof body==='string'?body:JSON.stringify(body)});return {code:res.statusCode,data:JSON.parse(res.body)}}
async function instagram(r){const res=await r.handler();return {code:res.statusCode,data:JSON.parse(res.body)}}
test('checkout rejects invalid JSON without Stripe API',async()=>{const r=runModule('create-checkout.js');const x=await checkout(r,'{');assert.equal(x.code,400);assert.equal(x.data.code,'INVALID_JSON');assert.equal(r.calls.length,0)});
test('checkout rejects inherited object keys',async()=>{const r=runModule('create-checkout.js');for(const slug of ['constructor','__proto__','toString'])assert.equal((await checkout(r,{slug})).code,400)});
test('checkout rejects non-object body',async()=>{const r=runModule('create-checkout.js');assert.equal((await checkout(r,'null')).code,400);assert.equal((await checkout(r,'[]')).code,400)});
test('checkout rejects non-POST',async()=>{const r=runModule('create-checkout.js');assert.equal((await checkout(r,{slug:'faces'},'GET')).code,405)});
test('checkout never accepts browser-controlled amounts',async()=>{const r=runModule('create-checkout.js',{STRIPE_SECRET_KEY:'mock-never-sent'});const x=await checkout(r,{slug:'faces',amount:1,quantity:100});assert.equal(x.code,200);assert.equal(r.calls[0].payload.line_items[0].price_data.unit_amount,5900);assert.equal(r.calls[0].payload.line_items[0].quantity,1)});
test('checkout hides provider exception',async()=>{const r=runModule('create-checkout.js',{STRIPE_SECRET_KEY:'mock-never-sent'},undefined,'error');const x=await checkout(r,{slug:'faces'});assert.equal(x.code,502);assert.ok(!JSON.stringify(x.data).includes('PRIVATE_STRIPE_SECRET'))});
test('checkout blocks invalid payment URL config',async()=>{const r=runModule('create-checkout.js',{STRIPE_LINK_FACES:'https://user:password@buy.stripe.com/abc'});const x=await checkout(r,{slug:'faces'});assert.equal(x.code,503)});
test('checkout returns configured trusted https link',async()=>{const r=runModule('create-checkout.js',{STRIPE_LINK_FACES:'https://buy.stripe.com/test'});const x=await checkout(r,{slug:'faces'});assert.equal(x.code,200);assert.equal(x.data.url,'https://buy.stripe.com/test')});
test('Instagram missing token makes no request',async()=>{const r=runModule('instagram-feed.js');const x=await instagram(r);assert.equal(x.code,503);assert.equal(r.calls.length,0)});
test('Instagram returns verified HTTPS media',async()=>{const r=runModule('instagram-feed.js',{INSTAGRAM_ACCESS_TOKEN:'test'});const x=await instagram(r);assert.equal(x.code,200);assert.equal(x.data.items.length,1);assert.ok(!JSON.stringify(x.data).includes('test'))});
test('Instagram drops unsafe media URL',async()=>{const f=async()=>({ok:true,json:async()=>({data:[{id:'x',media_url:'javascript:alert(1)',permalink:'https://www.instagram.com/p/ok'}]})});const r=runModule('instagram-feed.js',{INSTAGRAM_ACCESS_TOKEN:'token'},f);const x=await instagram(r);assert.equal(x.code,502);assert.equal(x.data.items.length,0)});
test('Instagram error responses do not echo sensitive details',async()=>{const f=async()=>({ok:false,status:403,json:async()=>({error:{message:'private-token-in-body'}})});const r=runModule('instagram-feed.js',{INSTAGRAM_ACCESS_TOKEN:'private-token'},f);const x=await instagram(r);assert.equal(x.code,502);assert.ok(!JSON.stringify(x.data).includes('private-token'))});
test('Instagram invalid limit falls back to 9',async()=>{const r=runModule('instagram-feed.js',{INSTAGRAM_ACCESS_TOKEN:'token',INSTAGRAM_LIMIT:'NaN'});await instagram(r);assert.ok(r.calls[0].url.includes('limit=9'))});
test('Instagram caches within same configuration',async()=>{const r=runModule('instagram-feed.js',{INSTAGRAM_ACCESS_TOKEN:'token'});await instagram(r);const x=await instagram(r);assert.equal(x.data.cached,true);assert.equal(r.calls.length,1)});
test('Instagram changing token forces cache refresh',async()=>{const r=runModule('instagram-feed.js',{INSTAGRAM_ACCESS_TOKEN:'token-a'});await instagram(r);r.env.INSTAGRAM_ACCESS_TOKEN='token-b';const x=await instagram(r);assert.equal(x.data.cached,false);assert.equal(r.calls.length,2)});
test('Instagram fetch includes timeout cancellation signal',async()=>{const r=runModule('instagram-feed.js',{INSTAGRAM_ACCESS_TOKEN:'token'});await instagram(r);assert.ok(r.calls[0].opts.signal)});
