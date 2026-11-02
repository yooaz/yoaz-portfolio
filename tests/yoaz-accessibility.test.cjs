// Run: node --test tests/yoaz-accessibility.test.cjs
// No browser, payment, network, GitHub actions or Netlify required.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = path.resolve(__dirname, '../assets/js/yoaz-accessibility-stable.js');
const source = fs.readFileSync(file, 'utf8');
const { focusableElements, closeMenu } = require(file);

function classList(names = []) {
  const namesSet = new Set(names);
  return {
    contains: name => namesSet.has(name),
    add: name => namesSet.add(name),
    remove: name => namesSet.delete(name),
    toggle: (name, enable) => { if (enable) namesSet.add(name); else namesSet.delete(name); }
  };
}

test('dialog focus filter excludes hidden, inert and non-rendered elements', () => {
  const make = (hidden, visible, inert = false) => ({
    hidden, closest: () => inert ? {} : null,
    getClientRects: () => visible ? [{}] : []
  });
  const a = make(false, true);
  assert.deepEqual(focusableElements({ querySelectorAll: () => [
    a, make(true, true), make(false, false), make(false, true, true)
  ] }), [a]);
});

test('menu helper resets open state and accessible expanded state', () => {
  const toggle = { classList: classList(['open']), attributes: {}, setAttribute(k, v) {this.attributes[k] = v;} };
  const links = { classList: classList(['open']) };
  closeMenu(toggle, links);
  assert.equal(toggle.classList.contains('open'), false);
  assert.equal(links.classList.contains('open'), false);
  assert.equal(toggle.attributes['aria-expanded'], 'false');
});

test('modal restores keyboard focus to project card and cycles Tab in dialog', () => {
  const listeners = {};
  const attrs = {};
  let mutation;
  const doc = {
    readyState: 'complete',
    activeElement: null,
    addEventListener(type, cb) { (listeners[type] ||= []).push(cb); },
    body: { classList: classList([]) },
    getElementById(id) {return elements[id] || null;}
  };
  const focusable = el => ({
    hidden: false,
    isConnected: true,
    getClientRects: () => [{}],
    closest: () => null,
    focus() { doc.activeElement = el; }
  });
  const card = {isConnected: true, focus() { doc.activeElement = card; }, closest(sel) {return sel === '.cw-card[data-pid]' ? card : null;} };
  const close = Object.assign(focusable(null), {
    hasAttribute: () => false,
    setAttribute: (name, val) => {attrs[name] = val;},
    focus() {doc.activeElement = close;}
  });
  const next = Object.assign(focusable(null), {focus() {doc.activeElement = next;}});
  const dialog = {
    setAttribute: (name, val) => {attrs[name] = val;},
    contains: el => el === close || el === next,
    querySelectorAll: () => [close, next],
    focus() {doc.activeElement = dialog;}
  };
  const elements = {'pj-modal': dialog, 'pj-close': close};
  class Observer {
    constructor(cb) { mutation = cb; }
    observe(root, opts) {
      assert.equal(root, doc.body);
      assert.deepEqual(JSON.parse(JSON.stringify(opts)), {attributes:true,attributeFilter:['class']});
    }
  }
  vm.runInNewContext(source, {document: doc, MutationObserver: Observer, requestAnimationFrame: fn => fn()});
  assert.equal(attrs.tabindex, '-1');
  assert.equal(attrs['aria-label'], 'Fermer le projet');
  for(const listener of listeners.pointerdown) listener({target: card});
  doc.body.classList.add('pj-open'); mutation();
  assert.equal(doc.activeElement, close, 'focus must enter dialog after opening');
  const pressTab = shiftKey => {
    let prevented=false;
    for(const listener of listeners.keydown) listener({key:'Tab',shiftKey,preventDefault(){prevented=true;},target:doc.activeElement});
    return prevented;
  };
  assert.equal(pressTab(true), true);
  assert.equal(doc.activeElement, next);
  assert.equal(pressTab(false), true);
  assert.equal(doc.activeElement, close);
  doc.body.classList.remove('pj-open'); mutation();
  assert.equal(doc.activeElement,card,'focus should return to original project after closing');
});

test('mobile menu supports Escape and click outside without replacing legacy toggle', () => {
  const listeners = {};
  const doc = {
    readyState:'complete',
    body:{classList:classList([])},
    addEventListener(type, cb) {(listeners[type] ||= []).push(cb);},
    getElementById(id) {return elements[id] || null;}
  };
  const expanded = {};
  const toggle = {classList:classList(['open']),setAttribute(k,v){expanded[k]=v;},focus(){expanded.focus=true;},contains:t=>t===toggle};
  const links = {classList:classList(['open']),contains:t=>t===links};
  const elements = {'nav-toggle':toggle, 'nav-links':links};
  vm.runInNewContext(source,{document:doc});
  let prevented=false;
  listeners.keydown[0]({key:'Escape',preventDefault(){prevented=true;}});
  assert.equal(prevented,true);
  assert.equal(expanded['aria-expanded'],'false');
  assert.equal(expanded.focus,true);
  links.classList.add('open'); toggle.classList.add('open');
  listeners.pointerdown[0]({target:{}});
  assert.equal(links.classList.contains('open'),false);
});

test('homepage exposes labeled controls, stable script and visible focus styles', () => {
  const home = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  const css = fs.readFileSync(path.resolve(__dirname, '../assets/css/yoaz-current-polish.css'), 'utf8');
  assert.equal((home.match(/\/assets\/js\/yoaz-accessibility-stable\.js/g)||[]).length,1);
  assert.match(home, /id="nav-toggle"[^>]*aria-label="Ouvrir le menu"/);
  assert.match(home, /id="pj-close"[^>]*aria-label="Fermer le projet"/);
  assert.match(home, /id="pj-modal"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(css, /#client \.cw-card\[data-pid\]:focus-visible/);
  assert.match(css, /#pj-modal button:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
