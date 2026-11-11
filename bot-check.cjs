const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
let activeDocument;
class Element {
 constructor(){this.children=[];this.handlers={};this.value='';this.hidden=false;this.attributes={};this.open=false;this.disabled=false;this.textContent='';this.classes=new Set();this.styles={};this.style={setProperty:(key,value)=>this.styles[key]=value};this.classList={toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name)};this.clientHeight=320;this._scrollTop=0;this.scrollWrites=[];}
 append(...children){for(const child of children){child.parentElement=this;this.children.push(child);}}
 get firstElementChild(){return this.children[0]||null;}
 contains(element){return this===element||this.children.some(child=>child.contains(element));}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(child=>child!==this);this.parentElement=null;}
 get scrollHeight(){return this.measureHeight?this.measureHeight():200+this.children.length*72;}
 get scrollTop(){return this._scrollTop;}
 set scrollTop(value){this._scrollTop=Math.min(Math.max(0,value),Math.max(0,this.scrollHeight-this.clientHeight));this.scrollWrites.push({top:this._scrollTop,height:this.scrollHeight,lastMessageChildren:map.get('bot-messages')?.children.at(-1)?.children.length||0});}
 setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(k,f){this.handlers[k]=f;}
 focus(options){this.focused=true;this.focusOptions=options;if(activeDocument)activeDocument.activeElement=this;}
 scrollIntoView(){throw Error('Chat scrolling must remain inside its active container.');}
 showModal(){this.open=true;}
 close(){this.open=false;this.handlers.close?.();}
 requestSubmit(){this.submitCount=(this.submitCount||0)+1;this.lastSubmission=this.handlers.submit({preventDefault(){}});}
}
const map=new Map(),el=id=>{if(!map.has(id))map.set(id,new Element());return map.get(id);};
el('bot-content').measureHeight=()=>200+el('bot-messages').children.reduce((height,message)=>height+72+message.children.filter(child=>child.href).length*32+message.children.filter(child=>child.tagName==='small').length*24,0);
el('bot-dialog').clientHeight=500;
el('bot-dialog').measureHeight=()=>300+el('bot-content').scrollHeight+(el('bot-latest').hidden?0:44);
const radios=[new Element(),new Element()];radios[0].value='catalog';radios[1].value='ai';
let response={status:200,body:{reply:'Penjelasan [1].',grounded:true,sources:[{title:'Buku Saku',url:'https://example.test/book.pdf#page=10',page:10}],warning:'Periksa sumber.'}},requests=[],widgetOptions,resets=0,fetchGate=null;
const turnstile={render:(container,options)=>{widgetOptions=options;options.callback('VERIFIED_TOKEN');return 0;},reset:()=>{resets++;},remove:()=>{}};
activeDocument={getElementById:el,createElement:tagName=>{const element=new Element();element.tagName=tagName;return element;},querySelectorAll:()=>radios,activeElement:null};
const context=vm.createContext({document:activeDocument,window:{turnstile,getComputedStyle:element=>({overflowY:element===el('bot-dialog')&&element.classes.has('bot-compact')?'auto':'hidden'}),SIPERI_BOT_CONFIG:{apiUrl:'https://faq.example.test/chat',turnstileSiteKey:'PUBLIC_TEST'},siperiCatalog:[{title:'Template TOR RAB',year:2026,stage:'Pagu Anggaran',url:'https://drive.google.com/test'}]},location:{href:'https://example.test/'},URL,AbortController,setTimeout,clearTimeout,fetch:async(url,request)=>{requests.push({url,...request});if(fetchGate)await fetchGate;return {ok:response.status===200,status:response.status,json:async()=>response.body};}});
const code=fs.readFileSync(path.join(__dirname,'bot.js'),'utf8');vm.runInContext(code,context);
const submit=async text=>{el('bot-question').value=text;await el('bot-form').handlers.submit({preventDefault(){}});};
const key=options=>{const event={key:'Enter',prevented:false,preventDefault(){this.prevented=true;},...options};el('bot-question').handlers.keydown(event);return event;};
const atBottom=container=>assert.equal(container.scrollTop,Math.max(0,container.scrollHeight-container.clientHeight));
const scrollTo=(container,top)=>{container.scrollTop=top;container.handlers.scroll();};
const holdAI=question=>{widgetOptions.callback('SCROLL_TEST_TOKEN');let finish;fetchGate=new Promise(resolve=>{finish=resolve;});el('bot-question').value=question;key({});const waiting=el('bot-form').lastSubmission;return async()=>{finish();await waiting;fetchGate=null;};};
(async()=>{
 el('bot-launcher').handlers.click({currentTarget:el('bot-launcher')});assert.equal(el('bot-dialog').open,true);
 el('bot-question').value='TOR';assert.equal(key({}).prevented,true);await el('bot-form').lastSubmission;assert.equal(requests.length,0);assert.ok(el('bot-status').textContent.includes('1 rujukan'));assert.equal(el('bot-question').value,'');
 const submissions=el('bot-form').submitCount;
 el('bot-question').value='Dua baris';for(const options of [{shiftKey:true},{ctrlKey:true},{altKey:true},{metaKey:true},{isComposing:true},{keyCode:229},{key:'a'}])assert.equal(key(options).prevented,false);assert.equal(el('bot-form').submitCount,submissions);assert.equal(el('bot-question').value,'Dua baris');assert.equal(key({repeat:true}).prevented,true);assert.equal(el('bot-form').submitCount,submissions);
 radios[1].handlers.change();await Promise.resolve();await submit('Apa itu revisi?');assert.equal(requests.length,1);assert.ok(el('bot-status').textContent.includes('Jawaban AI diterima'));assert.equal(el('bot-question').readOnly,false);assert.equal(el('bot-form').attributes['aria-busy'],'false');assert.equal(resets,1);
 assert.equal(widgetOptions.theme,'dark');
 assert.equal(el('bot-question').value,'');
 const body=JSON.parse(requests[0].body);assert.equal(body.turnstileToken,'VERIFIED_TOKEN');assert.ok(!body.history);assert.ok(!requests[0].headers['x-demo-access-code']);
 await submit('Pertanyaan berikutnya');assert.equal(requests.length,1);assert.ok(el('bot-status').textContent.includes('Selesaikan verifikasi'));
 assert.equal(el('bot-question').value,'Pertanyaan berikutnya');
 widgetOptions.callback('PENDING_TOKEN');let finishFetch;fetchGate=new Promise(resolve=>{finishFetch=resolve;});el('bot-question').value='Jelaskan revisi';assert.equal(key({}).prevented,true);const waiting=el('bot-form').lastSubmission;assert.equal(el('bot-question').value,'');assert.equal(el('bot-question').readOnly,true);const pendingRequests=requests.length;key({});assert.equal(requests.length,pendingRequests);finishFetch();await waiting;fetchGate=null;assert.equal(el('bot-question').value,'');assert.equal(el('bot-question').readOnly,false);
 widgetOptions.callback('NEXT_TOKEN');response={status:429,body:{code:'DAILY_LIMIT',error:'Jatah uji coba habis. Cari rujukan tetap tersedia.'}};await submit('Bagaimana alurnya?');assert.ok(el('bot-messages').children.at(-1).children[1].textContent.includes('Jatah uji coba habis'));assert.equal(el('bot-question').value,'Bagaimana alurnya?');
 widgetOptions.callback('NEXT_TOKEN');const before=requests.length;await submit('1234567890123456');assert.equal(requests.length,before);
 response={status:200,body:{reply:'Jawaban untuk pengujian gulir [1] [2].',grounded:true,sources:[{title:'Buku Saku',url:'https://example.test/book.pdf#page=10',page:10},{title:'Kelengkapan',url:'https://example.test/input'}],warning:'Periksa sumber dan tahun anggaran.'}};
 const content=el('bot-content'),outer=el('bot-dialog'),messages=el('bot-messages'),latest=el('bot-latest');
 while(messages.children.length<14){const history=new Element();history.append(new Element(),new Element());messages.append(history);}
 let finishAnswer=holdAI('Bagaimana kelengkapan revisi?');atBottom(content);assert.equal(messages.children.length,12);
 const oldMessages=[...messages.children];scrollTo(content,80);assert.equal(latest.hidden,false);const awayTop=content.scrollTop,writesWhileAway=content.scrollWrites.length,outerWrites=outer.scrollWrites.length;
 await finishAnswer();assert.equal(content.scrollTop,awayTop);assert.equal(content.scrollWrites.length,writesWhileAway);assert.equal(outer.scrollWrites.length,outerWrites);assert.equal(latest.hidden,false);assert.equal(messages.children.length,13);assert.deepEqual(messages.children.slice(0,12),oldMessages);
 latest.handlers.click();assert.equal(latest.hidden,true);atBottom(content);assert.equal(messages.children.length,12);assert.equal(activeDocument.activeElement,el('bot-question'));assert.equal(el('bot-question').focusOptions.preventScroll,true);
 finishAnswer=holdAI('Jelaskan dasar revisi');scrollTo(content,70);assert.equal(latest.hidden,false);scrollTo(content,content.scrollHeight-content.clientHeight-40);assert.equal(latest.hidden,true);
 await finishAnswer();atBottom(content);assert.equal(content.scrollWrites.at(-1).lastMessageChildren,5);assert.equal(content.scrollWrites.at(-1).height,content.scrollHeight);assert.equal(outer.scrollWrites.length,outerWrites);
 outer.classes.add('bot-compact');finishAnswer=holdAI('Jelaskan alur revisi pada layar pendek');atBottom(outer);scrollTo(outer,100);assert.equal(latest.hidden,false);
 const compactTop=outer.scrollTop,compactWrites=outer.scrollWrites.length,innerWrites=content.scrollWrites.length,compactOldMessages=[...messages.children];
 scrollTo(content,content.scrollHeight);assert.equal(latest.hidden,false);await finishAnswer();assert.equal(outer.scrollTop,compactTop);assert.equal(outer.scrollWrites.length,compactWrites);assert.deepEqual(messages.children.slice(0,compactOldMessages.length),compactOldMessages);assert.equal(latest.hidden,false);
 latest.handlers.click();atBottom(outer);assert.equal(latest.hidden,true);assert.equal(el('bot-question').focusOptions.preventScroll,true);assert.equal(content.scrollWrites.length,innerWrites+1);
 finishAnswer=holdAI('Apa langkah terakhir revisi?');scrollTo(outer,100);scrollTo(outer,outer.scrollHeight-outer.clientHeight-40);assert.equal(latest.hidden,true);await finishAnswer();atBottom(outer);assert.equal(outer.scrollWrites.at(-1).lastMessageChildren,5);assert.equal(outer.scrollWrites.at(-1).height,outer.scrollHeight);
 outer.classes.delete('bot-compact');
 el('bot-close').handlers.click();assert.equal(el('bot-dialog').open,false);assert.equal(el('bot-launcher').attributes['aria-expanded'],'false');assert.equal(el('bot-launcher').focused,true);
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');assert.ok(!html.includes('data-page="pengetahuan"'));assert.ok(html.includes('aria-labelledby="bot-title"'));assert.ok(html.includes('aria-describedby="bot-help bot-keyboard-help bot-status"'));assert.ok(html.includes('enterkeyhint="send"'));assert.ok(html.includes('peri-asn.webp'));assert.ok(!html.includes('bot-code'));
 delete context.window.SIPERI_BOT_CONFIG;vm.runInContext(code,context);assert.equal(radios[1].disabled,true);
 const viewport={height:320,addEventListener:(name,callback)=>viewport.resize=callback};context.window.visualViewport=viewport;vm.runInContext(code,context);assert.equal(el('bot-dialog').styles['--bot-viewport-height'],'320px');assert.equal(el('bot-dialog').classes.has('bot-compact'),true);viewport.height=900;viewport.resize();assert.equal(el('bot-dialog').classes.has('bot-compact'),false);
 console.log('PASS bot: Enter/IME, pending guard, cleared/restored drafts, verification, local references, focus and smart scrolling. Async replies preserve scrolled-away history; latest/near-bottom resume following including sources, in normal and compact containers.');
})().catch(error=>{console.error(error);process.exitCode=1;});
