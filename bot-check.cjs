const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');
class Element {
 constructor(){this.children=[];this.handlers={};this.value='';this.hidden=false;this.attributes={};this.open=false;this.disabled=false;this.textContent='';}
 append(...children){this.children.push(...children);}
 setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(k,f){this.handlers[k]=f;}
 focus(){}
 scrollIntoView(){}
 showModal(){this.open=true;}
 close(){this.open=false;this.handlers.close?.();}
}
const map=new Map(),el=id=>{if(!map.has(id))map.set(id,new Element());return map.get(id);};
const radios=[new Element(),new Element()];radios[0].value='catalog';radios[1].value='ai';
let response={status:401,body:{error:'Kode akses uji coba salah atau belum diisi.'}},requests=[];
const session=new Map();
const context=vm.createContext({document:{getElementById:el,createElement:()=>new Element(),querySelectorAll:()=>radios},window:{SIPERI_BOT_CONFIG:{apiUrl:'https://faq.example.test/chat'},siperiCatalog:[{title:'Template TOR RAB',year:2026,stage:'Pagu Anggaran',url:'https://drive.google.com/test'}]},location:{href:'https://example.test/'},URL,AbortController,setTimeout,clearTimeout,sessionStorage:{getItem:k=>session.get(k),setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)},fetch:async(url,request)=>{requests.push({url,...request});return {ok:response.status===200,status:response.status,json:async()=>response.body};}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'bot.js'),'utf8'),context);
const submit=async text=>{el('bot-question').value=text;await el('bot-form').handlers.submit({preventDefault(){}});};
(async()=>{
 el('bot-launcher').handlers.click();assert.equal(el('bot-dialog').open,true);
 await submit('TOR');assert.equal(requests.length,0);assert.ok(el('bot-status').textContent.includes('1 rujukan'));
 radios[1].handlers.change();await submit('Apa itu revisi?');assert.equal(el('bot-access').open,true);assert.ok(el('bot-status').textContent.includes('belum berhasil'));
 el('bot-code').value='TEST_CODE';response={status:502,body:{error:'Permintaan Gemini gagal (HTTP 401).'}};await submit('Apa itu RKA?');assert.ok(el('bot-messages').children.at(-1).children[1].textContent.includes('API key'));assert.equal(requests.at(-1).headers['x-demo-access-code'],'TEST_CODE');
 response={status:200,body:{reply:'Jawaban uji, periksa sumber.',grounded:false,sources:[]}};await submit('Jelaskan RKA');assert.ok(el('bot-status').textContent.includes('Jawaban AI diterima'));assert.equal(el('bot-send').disabled,false);
 const before=requests.length;await submit('1234567890123456');assert.equal(requests.length,before);
 el('bot-close').handlers.click();assert.equal(el('bot-dialog').open,false);assert.equal(el('bot-launcher').attributes['aria-expanded'],'false');
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');assert.ok(!html.includes('data-page="pengetahuan"'));assert.ok(html.includes('aria-labelledby="bot-title"'));
 delete context.window.SIPERI_BOT_CONFIG;
 vm.runInContext(fs.readFileSync(path.join(__dirname,'bot.js'),'utf8'),context);
 assert.equal(radios[1].disabled,true);
 const previousRequests=requests.length;radios[1].handlers.change();await submit('Uji tanpa endpoint');assert.equal(requests.length,previousRequests);
 console.log('PASS bot: dialog controls, local search without API, access-code error, Gemini auth error, success, PII validation, restored launcher and no knowledge menu');
})().catch(e=>{console.error(e);process.exitCode=1;});
