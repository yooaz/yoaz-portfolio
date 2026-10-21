import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../netlify/functions/instagram-feed.js', import.meta.url), 'utf8');
const item = { id: 'ig1', caption: 'Real post', media_type: 'IMAGE', media_url: 'https://cdn.example/post.jpg', permalink: 'https://instagram.com/p/example', timestamp: '2026-10-21' };
const success = () => ({ ok: true, status: 200, async json() { return { data: [item] }; } });
function server(env = {}, fetchImpl = async () => success()) {
  const calls = [];
  const sandbox = {
    exports: {},
    process: { env },
    AbortSignal,
    fetch: async (url, options) => { calls.push({url, options}); return fetchImpl(url, options); },
    Date,
  };
  vm.runInNewContext(code, sandbox, { filename: 'instagram-feed.js', timeout: 1500 });
  return { handler: sandbox.exports.handler, calls };
}
async function invoke(s) { const x = await s.handler(); return {status:x.statusCode,headers:x.headers,body:JSON.parse(x.body)}; }

test('no token returns an uncached 503 without invoking provider', async () => {
  const s=server();const r=await invoke(s);assert.equal(r.status,503);assert.equal(r.body.configured,false);
  assert.equal(r.headers['Cache-Control'],'no-store');assert.equal(s.calls.length,0);
  assert.ok(!r.body.error.includes('ACCESS_TOKEN'));
});
test('valid public media is returned and cached', async () => {
  const s=server({INSTAGRAM_ACCESS_TOKEN:'fake-token'});
  const a=await invoke(s),b=await invoke(s);
  assert.equal(a.status,200);assert.equal(a.body.items.length,1);
  assert.equal(a.body.items[0].caption,'Real post');assert.equal(a.body.cached,false);
  assert.equal(b.body.cached,true);assert.equal(s.calls.length,1);
});
test('provider requests receive AbortSignal deadlines', async () => {
  const s=server({INSTAGRAM_ACCESS_TOKEN:'fake-token'});
  await invoke(s);
  assert.ok(s.calls[0].options.signal instanceof AbortSignal);
});
test('invalid INSTAGRAM_LIMIT defaults to nine', async () => {
  const s=server({INSTAGRAM_ACCESS_TOKEN:'fake-token',INSTAGRAM_LIMIT:'not-a-number'});
  assert.equal((await invoke(s)).status,200);
  assert.equal(new URL(s.calls[0].url).searchParams.get('limit'),'9');
});
test('huge INSTAGRAM_LIMIT is capped at 24', async () => {
  const s=server({INSTAGRAM_ACCESS_TOKEN:'fake-token',INSTAGRAM_LIMIT:'999'});
  await invoke(s);assert.equal(new URL(s.calls[0].url).searchParams.get('limit'),'24');
});
test('fractional/negative INSTAGRAM_LIMIT floors and clamps', async () => {
  const a=server({INSTAGRAM_ACCESS_TOKEN:'fake-token',INSTAGRAM_LIMIT:'5.9'});
  const b=server({INSTAGRAM_ACCESS_TOKEN:'fake-token',INSTAGRAM_LIMIT:'-2'});
  await invoke(a);await invoke(b);
  assert.equal(new URL(a.calls[0].url).searchParams.get('limit'),'5');
  assert.equal(new URL(b.calls[0].url).searchParams.get('limit'),'1');
});
test('Meta Graph fallback uses second official provider if first fails', async () => {
  let n=0;const s=server({INSTAGRAM_ACCESS_TOKEN:'fake-token',INSTAGRAM_USER_ID:'123'},async()=>{
    n++;return n===1?{ok:false,status:403,async json(){return {error:{message:'denied'}};}}:success();
  });
  const r=await invoke(s);assert.equal(r.status,200);assert.equal(r.body.source,'instagram-basic-display');assert.equal(s.calls.length,2);
});
test('errors never return token-bearing URLs to visitors', async () => {
  const s=server({INSTAGRAM_ACCESS_TOKEN:'SECRET_DO_NOT_LEAK'},async url=>{throw Error('Request failed: '+url);});
  const r=await invoke(s);assert.equal(r.status,502);assert.equal(r.body.error,'Instagram feed temporarily unavailable');
  assert.ok(!JSON.stringify(r.body).includes('SECRET_DO_NOT_LEAK'));
  assert.equal(r.headers['Cache-Control'],'no-store');
});
test('Meta provider error string never leaves the server', async () => {
  const s=server({INSTAGRAM_ACCESS_TOKEN:'SECRET_DO_NOT_LEAK'},async()=>({ok:false,status:401,async json(){return {error:{message:'Bad token SECRET_DO_NOT_LEAK'}};}}));
  const r=await invoke(s);assert.equal(r.status,502);assert.ok(!JSON.stringify(r.body).includes('SECRET_DO_NOT_LEAK'));
});
test('empty provider media returns 502, no invented posts', async () => {
  const s=server({INSTAGRAM_ACCESS_TOKEN:'fake-token'},async()=>({ok:true,status:200,async json(){return {data:[]};}}));
  const r=await invoke(s);assert.equal(r.status,502);assert.deepEqual(Array.from(r.body.items),[]);
});
test('media missing a permalink are discarded', async () => {
  const s=server({INSTAGRAM_ACCESS_TOKEN:'fake-token'},async()=>({ok:true,status:200,async json(){return {data:[{id:'bad',media_url:'https://image.example'}]};}}));
  const r=await invoke(s);assert.equal(r.status,502);assert.equal(r.body.items.length,0);
});
test('an error does not populate the cache for the next request', async () => {
  let n=0;const s=server({INSTAGRAM_ACCESS_TOKEN:'fake-token'},async()=>{n++;if(n===1)throw Error('temporary');return success();});
  const a=await invoke(s),b=await invoke(s);assert.equal(a.status,502);assert.equal(b.status,200);
  assert.equal(b.body.cached,false);assert.equal(s.calls.length,2);
});
