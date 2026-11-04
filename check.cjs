const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalog-sources.json'), 'utf8'));
const services = JSON.parse(fs.readFileSync(path.join(__dirname, 'services.json'), 'utf8'));
class Element {
  constructor() { this.value=''; this.children=[]; this.handlers={}; this.hidden=false; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children=items; }
  addEventListener(type, fn) { const previous=this.handlers[type]; this.handlers[type]=previous ? (...args)=>{previous(...args);fn(...args);} : fn; }
  scrollIntoView() {}
  focus() {}
  select() {}
}
const ids = new Map();
const document = {getElementById(id) {if(!ids.has(id)) ids.set(id,new Element());return ids.get(id);},createElement() {return new Element();},querySelector(selector){return this.getElementById(selector);},querySelectorAll(){return [];}};
document.getElementById('year').value='2026';
document.getElementById('stage').value='Pagu Anggaran';
document.getElementById('category').value='all';
let failFetch = false;
const location = {hash:'#pagu',href:'http://localhost:4173/#pagu'};
const history = {replaceState(a,b,hash){location.hash=hash;location.href='http://localhost:4173/'+hash;}};
const context = vm.createContext({document,URL,URLSearchParams,history,console,location,window:{addEventListener(){}},fetch:async url=>({ok:!failFetch,json:async()=>url.includes('services')?services:data})});
vm.runInContext(fs.readFileSync(path.join(__dirname,'app.js'),'utf8'),context);
const tick = () => new Promise(resolve=>setImmediate(resolve));
(async()=>{
  await tick();
  document.getElementById('year').value='2026';
  document.getElementById('stage').value='Pagu Anggaran';
  document.getElementById('year').handlers.change();
  assert.equal(document.getElementById('results').children.length,9);
  document.getElementById('search').value='template tor rab';
  document.getElementById('search').handlers.input();
  assert.equal(document.getElementById('results').children.length,1);
  document.getElementById('search').value='review';
  document.getElementById('search').handlers.input();
  assert.equal(document.getElementById('results').children.length,1);
  document.getElementById('reset').handlers.click();
  document.getElementById('year').value='2026';
  document.getElementById('stage').value='Pagu Alokasi';
  document.getElementById('stage').handlers.change();
  assert.equal(document.getElementById('empty').hidden,false);
  document.getElementById('clear-search').handlers.click();
  assert.equal(document.getElementById('results').children.length,111);
  document.getElementById('search').value='zzzz-no-match';
  document.getElementById('search').handlers.input();
  assert.equal(document.getElementById('results').children.length,0);
  document.getElementById('reset').handlers.click();
  assert.equal(document.getElementById('results').children.length,111);
  for(const source of data.sources) for(const item of source.resources) assert.ok(['https:','http:'].includes(new URL(item.url).protocol));
  failFetch=true;
  await document.getElementById('retry').handlers.click();
  assert.equal(document.getElementById('error').hidden,false);
  failFetch=false;
  await document.getElementById('retry').handlers.click();
  assert.equal(document.getElementById('error').hidden,true);
  assert.equal(document.getElementById('results').children.length,111);
  for(const [service,items] of Object.entries(services)) {
    location.hash='#'+service;
    vm.runInContext('route()',context);
    assert.equal(document.getElementById('results').children.length,items.length);
    assert.ok(items.every(item=>!item.url.includes('sites.google.com')));
  }
  location.hash='#beranda';vm.runInContext('route()',context);
  assert.equal(document.getElementById('results').children.length,138);
  assert.equal(services.monitoring.length,1);
  const publicData = JSON.stringify(services);
  assert.ok(!publicData.includes('16x1RVNcvO3x9iPnN5yffEj1dZXSvIcizrBiKkppA66_07A6kzbg_VKnO'));
  assert.ok(!publicData.includes('1ZwabcEZq6warOoEaYLMG6Gqa80otPH8V'));
  location.hash='#arsip';vm.runInContext('route()',context);
  assert.equal(document.getElementById('results').children.length,104);
  location.hash='#pagu?tahun=2025&tahap=Pagu+Alokasi';vm.runInContext('route()',context);
  assert.equal(document.getElementById('results').children.length,9);
  assert.equal(document.getElementById('year').value,'2025');
  document.getElementById('share').handlers.click();
  assert.ok(document.getElementById('share-url').value.includes('tahun=2025'));
  location.hash='#pagu?tahun=invalid&tahap=invalid';vm.runInContext('route()',context);
  assert.equal(document.getElementById('results').children.length,111);
  console.log('PASS: default catalog, filters, search, synonym, empty state, reset, URL format, failed load and retry. Browser layout/keyboard not tested.');
})().catch(error=>{console.error(error);process.exitCode=1;});
