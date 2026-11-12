import assert from 'node:assert/strict';
import worker, { DailyBudget } from './src/worker.mjs';
import { retrieve, promptFor } from './src/retrieval.mjs';
const origin = 'https://programdanpenganggaran-cmd.github.io';
const originalFetch = globalThis.fetch;
let verified = { success: true, hostname: new URL(origin).hostname, action: 'siperi-ai' }, calls = 0, budgetAllowed = true, modelResult = { choices: [{ message: { content: 'Penjelasan dari buku [1].' } }] };
const env = {
  ALLOWED_ORIGIN: origin, AI_MODEL: 'test-model', TURNSTILE_SECRET_KEY: 'TEST_ONLY',
  AI: { run: async (model, input) => { calls++; assert.equal(model, 'test-model'); assert.equal(input.max_tokens, 512); assert.ok(input.messages[0].content.includes('HANYA')); return modelResult; } },
  DAILY_BUDGET: { idFromName: x=>x, get: ()=>({fetch:async()=>Response.json({allowed:budgetAllowed})}) },
  PER_IP: {limit:async()=>({success:true})}, GLOBAL_RATE: {limit:async()=>({success:true})}
};
globalThis.fetch = async () => Response.json(verified);
const request = (question = 'Apa itu revisi anggaran?', extra = {}, options = {}) => new Request('https://example.test/chat', { method:'POST', headers:{Origin:origin,'Content-Type':'application/json',...options.headers}, body:JSON.stringify({question,turnstileToken:'TEST_TOKEN',...extra}) });
try {
  let response = await worker.fetch(new Request('https://example.test/health'), env);
  assert.equal((await response.json()).configured, true);
  response = await worker.fetch(new Request('https://example.test/chat', {method:'OPTIONS',headers:{Origin:origin}}), env);
  assert.equal(response.status,204); assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
  assert.equal((await worker.fetch(request(undefined,{}, {headers:{Origin:'https://evil.test'}}),env)).status,403);
  assert.equal((await worker.fetch(request(undefined,{turnstileToken:''}),env)).status,403);
  assert.equal((await worker.fetch(request('1234567890123456'),env)).status,400);
  assert.equal((await worker.fetch(request('x'.repeat(1501)),env)).status,400);
  const oversized = new Request('https://example.test/chat',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'x'.repeat(12001)});
  assert.equal((await worker.fetch(oversized,env)).status,413);
  assert.equal(calls,0);
  env.ALLOWED_ORIGINS = origin + ',https://siperi.id,https://www.siperi.id';
  for (const customOrigin of ['https://siperi.id', 'https://www.siperi.id']) {
    const preflight = await worker.fetch(new Request('https://example.test/chat', {method:'OPTIONS',headers:{Origin:customOrigin}}),env);
    assert.equal(preflight.status,204);
    assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),customOrigin);
    assert.equal((await worker.fetch(request(undefined, {}, {headers:{Origin:customOrigin}}),env)).status,403);
    verified.hostname = new URL(customOrigin).hostname;
    const customReply = await worker.fetch(request('Siapa pemenang piala dunia?',{}, {headers:{Origin:customOrigin}}),env);
    assert.equal(customReply.status,200);
  }
  verified.hostname = new URL(origin).hostname;
  verified.hostname='wrong.test'; assert.equal((await worker.fetch(request(),env)).status,403); verified.hostname=new URL(origin).hostname;
  verified.action='wrong-action'; assert.equal((await worker.fetch(request(),env)).status,403); verified.action='siperi-ai';
  verified.success=false; assert.equal((await worker.fetch(request(),env)).status,403); verified.success=true;
  assert.equal(calls,0);
  response=await worker.fetch(request('Siapa pemenang piala dunia?'),env); assert.equal((await response.json()).grounded,false); assert.equal(calls,0);
  response=await worker.fetch(request(),env); let data=await response.json(); assert.equal(response.status,200); assert.equal(data.grounded,true); assert.equal(data.sources[0].page,10); assert.equal(calls,1);
  budgetAllowed=false;response=await worker.fetch(request(),env);assert.equal(response.status,429);assert.equal((await response.json()).code,'DAILY_LIMIT');assert.equal(calls,1);budgetAllowed=true;
  modelResult={response:'Tidak ada nomor sumber.'};data=await (await worker.fetch(request(),env)).json();assert.equal(data.grounded,false);
  modelResult={response:'Nomor sumber palsu [99].'};data=await (await worker.fetch(request(),env)).json();assert.equal(data.grounded,false);
  env.AI.run=async()=>{throw Error('provider details must not leak');};data=await (await worker.fetch(request(),env)).json();assert.equal(data.code,'AI_UNAVAILABLE');assert.ok(!data.error.includes('provider details'));
  env.PER_IP.limit=async()=>({success:false});assert.equal((await worker.fetch(request(),env)).status,429);
  assert.equal(retrieve('Apa itu revisi anggaran?')[0].page,10);
  assert.ok(retrieve('Input dokumen kelengkapan').some(x=>x.id==='input-kelengkapan'));
  assert.equal(retrieve('kucing astronot galaksi zzz').length,0);
  assert.ok(promptFor('uji',retrieve('revisi'))[0].content.includes('Metadata katalog'));
  let queue=Promise.resolve();const values=new Map();const storage={get:async k=>values.get(k),put:async(k,v)=>values.set(k,structuredClone(v))};
  storage.transaction=fn=>{const result=queue.then(()=>fn(storage));queue=result.catch(()=>{});return result;};
  const budget=new DailyBudget({storage});
  const results=await Promise.all(Array.from({length:60},()=>budget.fetch().then(r=>r.json())));
  assert.equal(results.filter(x=>x.allowed).length,50);
  values.set('usage',{day:'2020-01-01',count:50});assert.equal((await (await budget.fetch()).json()).allowed,true);assert.equal(values.get('usage').count,1);
  console.log('PASS backend: retrieval, citations, verification, CORS, input limits, quota/rate limits, provider failure, daily reset and concurrent reservations.');
} finally { globalThis.fetch=originalFetch; }
