const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');
const book=JSON.parse(fs.readFileSync(path.join(__dirname,'buku-saku.json'),'utf8'));
class Element{constructor(){this.hidden=false;this.value='';this.children=[];this.attributes={};this.handlers={};this.textContent='';}append(...x){this.children.push(...x);}replaceChildren(){this.children=[];}setAttribute(k,v){this.attributes[k]=v;}getAttribute(k){return this.attributes[k];}removeAttribute(k){delete this.attributes[k];}addEventListener(k,f){this.handlers[k]=f;}}
const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
const location={hash:'#buku-saku'};const window={addEventListener(){}};let fail=false;
const context=vm.createContext({document:{getElementById:el,createElement:()=>new Element(),addEventListener(){}},window,location,URLSearchParams,fetch:async()=>({ok:!fail,json:async()=>book})});
vm.runInContext(fs.readFileSync(path.join(__dirname,'buku-saku.js'),'utf8'),context);
(async()=>{
 await new Promise(r=>setImmediate(r));
 assert.equal(book.pageCount,96);assert.equal(book.pages.length,96);
 assert.ok(el('book-pdf-frame').getAttribute('src').includes('page=1'));
 el('book-search').value='kewenangan';el('book-search').handlers.input();assert.ok(el('book-toc').children.length>0);
 el('book-search').value='zzzznotfound123';el('book-search').handlers.input();assert.equal(el('book-toc').children.length,0);
 location.hash='#buku-saku?halaman=22';await window.renderPocketBook();
 assert.ok(el('book-pdf-frame').getAttribute('src').includes('page=22'));
 location.hash='#buku-saku?halaman=96';await window.renderPocketBook();assert.ok(el('book-pdf-frame').getAttribute('src').includes('page=96'));
 location.hash='#buku-saku?halaman=invalid';await window.renderPocketBook();assert.ok(el('book-pdf-frame').getAttribute('src').includes('page=1'));
 el('book-index').hidden=true;el('book-toggle-toc').handlers.click();assert.equal(el('book-index').hidden,false);el('book-toggle-toc').handlers.click();assert.equal(el('book-index').hidden,true);
 await el('book-fullscreen').handlers.click();assert.ok(el('book-reader-status').textContent.includes('tidak tersedia'));
 assert.ok(fs.readFileSync(path.join(__dirname,'buku-saku-revisi-2026.pdf')).subarray(0,5).equals(Buffer.from('%PDF-')));
 console.log('PASS book: full PDF, search, no results, page links, invalid route, collapsible contents, fullscreen fallback and PDF signature');
})().catch(e=>{console.error(e);process.exitCode=1;});
