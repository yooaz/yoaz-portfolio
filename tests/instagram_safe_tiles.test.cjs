'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname,'../scripts/instagram-safe-tiles.js'),'utf8');

class NodeMock {
  constructor(tag) {this.tagName=tag;this.children=[];this.attributes={};}
  appendChild(value){this.children.push(value);return value;}
  setAttribute(k,v){this.attributes[k]=v;}
  replaceChildren(fragment){this.children=[...fragment.children];}
  set innerHTML(_v){throw new Error('unsafe innerHTML');}
}
function load(){
  const window={};
  const document={createDocumentFragment:()=>new NodeMock('#fragment'),createElement:tag=>new NodeMock(tag)};
  vm.runInNewContext(code,{window,document,URL},{timeout:1000});
  return {render:window.yoazRenderInstagramTiles,grid:new NodeMock('div')};
}
const valid={media_url:'https://scontent.cdninstagram.com/picture.jpg',permalink:'https://www.instagram.com/p/ABC123/',caption:'Illustration'};

test('legitimate Instagram tile preserves class, URL and accessibility',()=>{
  const {render,grid}=load();assert.equal(render(grid,[valid]),1);
  const card=grid.children[0]; assert.match(card.className,/ig-latest/);
  assert.equal(card.href,valid.permalink);assert.equal(card.rel,'noopener noreferrer');
  assert.equal(card.attributes['data-ig-rank'],'1');assert.equal(card.attributes.role,'listitem');
  assert.equal(card.children[0].src,valid.media_url);assert.equal(card.children[0].alt,'Illustration');
});
test('HTML quote payload is never parsed or written as innerHTML',()=>{
  const {render,grid}=load();const attack='" onerror="alert(1)';
  render(grid,[{...valid,caption:attack}]);assert.equal(grid.children[0].children[0].alt,attack);
  assert.equal(Object.keys(grid.children[0].children[0].attributes).length,0);
});
test('javascript: and impostor Instagram permalinks fall back to the known profile',()=>{
  const {render,grid}=load();render(grid,[{...valid,permalink:'javascript:alert(1)'},{...valid,permalink:'https://www.instagram.com.evil.test/p/X'}]);
  assert.equal(grid.children[0].href,'https://www.instagram.com/iamyoaz/');assert.equal(grid.children[1].href,'https://www.instagram.com/iamyoaz/');
});
test('rejects foreign, data, HTTP, credential-bearing and control URLs for media',()=>{
  const {render,grid}=load();for(const bad of ['http://scontent.cdninstagram.com/a.jpg','https://evil.test/a.jpg','data:image/svg+xml,abc','https://user:pass@scontent.cdninstagram.com/a','https://scontent.cdninstagram.com\n.evil.test/a']){
    assert.throws(()=>render(grid,[{...valid,media_url:bad}]),/HOLD_INSTAGRAM_NO_SAFE_ITEMS/);
  }
  assert.equal(grid.children.length,0);
});
test('Meta fbcdn.net and cdninstagram.com media remain supported',()=>{
  const {render,grid}=load();assert.equal(render(grid,[{...valid,media_url:'https://scontent-cdg4-2.cdninstagram.com/a.jpg'}, {...valid,media_url:'https://scontent.fna.fbcdn.net/b.jpg'}]),2);
});
test('bad item shapes and empty responses fail closed without clearing old results',()=>{
  const {render,grid}=load();render(grid,[valid]);
  assert.throws(()=>render(grid,{}),/HOLD_INSTAGRAM_ITEMS/);
  assert.throws(()=>render(grid,[null,{},'bad']),/HOLD_INSTAGRAM_NO_SAFE_ITEMS/);
  assert.equal(grid.children.length,1);
});
test('max 9 tiles; first two eager, rest lazy',()=>{
  const {render,grid}=load();assert.equal(render(grid,Array(30).fill(valid)),9);
  assert.equal(grid.children[0].children[0].loading,'eager');
  assert.equal(grid.children[1].children[0].loading,'eager');
  assert.equal(grid.children[2].children[0].loading,'lazy');
  assert.equal(grid.children[8].attributes['data-ig-rank'],'9');
});
test('media URL quote payload and SVG URL remain inert or rejected',()=>{
  const {render,grid}=load();assert.throws(()=>render(grid,[{...valid,media_url:'data:image/svg+xml,<svg onload=alert(1)>'}]),/HOLD/);
  render(grid,[{...valid,media_url:'https://scontent.cdninstagram.com/p.jpg" onerror="alert(1)'}]);
  assert.equal(grid.children[0].children[0].attributes.onerror,undefined);
});
