const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');
const book=JSON.parse(fs.readFileSync(path.join(__dirname,'buku-saku.json'),'utf8'));
class Element{constructor(){this.hidden=false;this.value='';this.children=[];this.attributes={};this.handlers={};this.textContent='';}append(...x){this.children.push(...x);}replaceChildren(){this.children=[];}setAttribute(k,v){this.attributes[k]=v;}removeAttribute(k){delete this.attributes[k];}addEventListener(k,f){this.handlers[k]=f;}}
const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
const location={hash:'#buku-saku'};const window={addEventListener(){}};let fail=false;
const context=vm.createContext({document:{getElementById:el,createElement:()=>new Element()},window,location,URLSearchParams,fetch:async()=>({ok:!fail,json:async()=>book})});
vm.runInContext(fs.readFileSync(path.join(__dirname,'buku-saku.js'),'utf8'),context);
(async()=>{
 await new Promise(r=>setImmediate(r));
 assert.equal(book.pageCount,96);assert.equal(book.pages.length,96);
 assert.equal(el('book-page-select').children.length,96);
 assert.equal(el('book-prev').disabled,true);assert.equal(el('book-cover').hidden,false);
 el('book-search').value='kewenangan';el('book-search').handlers.input();assert.ok(el('book-toc').children.length>0);
 el('book-search').value='zzzznotfound123';el('book-search').handlers.input();assert.equal(el('book-toc').children.length,0);
 location.hash='#buku-saku?halaman=22';await window.renderPocketBook();
 assert.ok(el('book-page-text').textContent.includes('KPA'));assert.equal(el('book-cover').hidden,true);
 el('book-pdf-mode').handlers.click();assert.equal(el('book-pdf-frame').hidden,false);assert.ok(el('book-pdf-frame').src.includes('page=22'));
 location.hash='#buku-saku?halaman=96';await window.renderPocketBook();assert.equal(el('book-next').disabled,true);
 location.hash='#buku-saku?halaman=invalid';await window.renderPocketBook();assert.equal(el('book-page-select').value,'1');
 assert.ok(fs.readFileSync(path.join(__dirname,'buku-saku-revisi-2026.pdf')).subarray(0,5).equals(Buffer.from('%PDF-')));
 console.log('PASS book: 96 pages, search, no results, original-page mode, boundary controls, invalid route and PDF signature');
})().catch(e=>{console.error(e);process.exitCode=1;});
