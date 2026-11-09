const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
class Element {
 constructor(){this.children=[];this.handlers={};this.value='';this.hidden=false;this.attributes={};this.open=false;this.disabled=false;this.textContent='';}
 append(...children){this.children.push(...children);}
 setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(k,f){this.handlers[k]=f;}
 focus(){this.focused=true;}
 scrollIntoView(){}
 showModal(){this.open=true;}
 close(){this.open=false;this.handlers.close?.();}
}
const map=new Map(),el=id=>{if(!map.has(id))map.set(id,new Element());return map.get(id);};
const radios=[new Element(),new Element()];radios[0].value='catalog';radios[1].value='ai';
let response={status:200,body:{reply:'Penjelasan [1].',grounded:true,sources:[{title:'Buku Saku',url:'https://example.test/book.pdf#page=10',page:10}],warning:'Periksa sumber.'}},requests=[],widgetOptions,resets=0;
const turnstile={render:(container,options)=>{widgetOptions=options;options.callback('VERIFIED_TOKEN');return 0;},reset:()=>{resets++;},remove:()=>{}};
const context=vm.createContext({document:{getElementById:el,createElement:()=>new Element(),querySelectorAll:()=>radios},window:{turnstile,SIPERI_BOT_CONFIG:{apiUrl:'https://faq.example.test/chat',turnstileSiteKey:'PUBLIC_TEST'},siperiCatalog:[{title:'Template TOR RAB',year:2026,stage:'Pagu Anggaran',url:'https://drive.google.com/test'}]},location:{href:'https://example.test/'},URL,AbortController,setTimeout,clearTimeout,fetch:async(url,request)=>{requests.push({url,...request});return {ok:response.status===200,status:response.status,json:async()=>response.body};}});
const code=fs.readFileSync(path.join(__dirname,'bot.js'),'utf8');vm.runInContext(code,context);
const submit=async text=>{el('bot-question').value=text;await el('bot-form').handlers.submit({preventDefault(){}});};
(async()=>{
 el('bot-launcher').handlers.click({currentTarget:el('bot-launcher')});assert.equal(el('bot-dialog').open,true);
 await submit('TOR');assert.equal(requests.length,0);assert.ok(el('bot-status').textContent.includes('1 rujukan'));
 radios[1].handlers.change();await Promise.resolve();await submit('Apa itu revisi?');assert.equal(requests.length,1);assert.ok(el('bot-status').textContent.includes('Jawaban AI diterima'));assert.equal(el('bot-question').readOnly,false);assert.equal(el('bot-form').attributes['aria-busy'],'false');assert.equal(resets,1);
 const body=JSON.parse(requests[0].body);assert.equal(body.turnstileToken,'VERIFIED_TOKEN');assert.ok(!body.history);assert.ok(!requests[0].headers['x-demo-access-code']);
 await submit('Pertanyaan berikutnya');assert.equal(requests.length,1);assert.ok(el('bot-status').textContent.includes('Selesaikan verifikasi'));
 widgetOptions.callback('NEXT_TOKEN');response={status:429,body:{code:'DAILY_LIMIT',error:'Jatah uji coba habis. Cari rujukan tetap tersedia.'}};await submit('Bagaimana alurnya?');assert.ok(el('bot-messages').children.at(-1).children[1].textContent.includes('Jatah uji coba habis'));assert.equal(el('bot-question').value,'Bagaimana alurnya?');
 widgetOptions.callback('NEXT_TOKEN');const before=requests.length;await submit('1234567890123456');assert.equal(requests.length,before);
 el('bot-close').handlers.click();assert.equal(el('bot-dialog').open,false);assert.equal(el('bot-launcher').attributes['aria-expanded'],'false');assert.equal(el('bot-launcher').focused,true);
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');assert.ok(!html.includes('data-page="pengetahuan"'));assert.ok(html.includes('aria-labelledby="bot-title"'));assert.ok(html.includes('aria-describedby="bot-help bot-status"'));assert.ok(!html.includes('bot-code'));
 delete context.window.SIPERI_BOT_CONFIG;vm.runInContext(code,context);assert.equal(radios[1].disabled,true);
 console.log('PASS bot: local search without API, verified AI, numbered sources, verification expiry, quota recovery, input preserved, PII block, native dialog and focus return.');
})().catch(error=>{console.error(error);process.exitCode=1;});
