import { retrieve, promptFor, knowledgeVersion } from './retrieval.mjs';
const encoder = new TextEncoder();
const warning = 'Ringkasan AI dapat keliru. Periksa halaman sumber dan aturan resmi sebelum mengambil keputusan. Arsip Drive privat belum diindeks.';
export class DailyBudget {
  constructor(state) { this.state = state; }
  async fetch() {
    const day = new Date().toISOString().slice(0, 10);
    const result = await this.state.storage.transaction(async storage => {
      const previous = await storage.get('usage');
      const usage = previous?.day === day ? previous : { day, count: 0 };
      // Batas global mencakup semua lokasi, termasuk percobaan inferensi yang gagal.
      if (usage.count >= 50) return { allowed: false };
      usage.count++;
      await storage.put('usage', usage);
      return { allowed: true };
    });
    return Response.json(result);
  }
}
async function boundedJSON(request) {
  if (!request.headers.get('Content-Type')?.includes('application/json')) throw new Error('JSON_REQUIRED');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('INVALID_JSON');
  let length = 0;
  const chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 12000) { await reader.cancel(); throw new Error('BODY_TOO_LARGE'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) { if (error.message === 'BODY_TOO_LARGE') throw error; throw new Error('INVALID_JSON'); }
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowedOrigins = (env.ALLOWED_ORIGINS || env.ALLOWED_ORIGIN || '').split(',').map(value => value.trim()).filter(Boolean);
    const allowedOrigin = allowedOrigins.includes(origin);
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Origin', 'X-Content-Type-Options': 'nosniff' };
    const reply = (body, status = 200) => Response.json(body, { status, headers });
    if (origin && !allowedOrigin) return reply({ error: 'Origin tidak diizinkan.' }, 403);
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type' } });
    const ready = Boolean(env.AI && env.DAILY_BUDGET && env.PER_IP && env.GLOBAL_RATE && env.TURNSTILE_SECRET_KEY);
    if (url.pathname === '/health' && request.method === 'GET') return reply({ service: 'siperi-assistant', configured: ready, knowledge_version: knowledgeVersion });
    if (url.pathname !== '/chat') return reply({ error: 'Endpoint tidak ditemukan.' }, 404);
    if (request.method !== 'POST') return reply({ error: 'Gunakan POST.' }, 405);
    if (!allowedOrigin) return reply({ error: 'Buka asisten melalui website SiPERI.' }, 403);
    if (!ready) return reply({ code: 'AI_NOT_CONFIGURED', error: 'AI belum siap. Gunakan Cari rujukan.' }, 503);
    try {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (!(await env.PER_IP.limit({ key: ip })).success || !(await env.GLOBAL_RATE.limit({ key: 'chat' })).success) return reply({ code: 'RATE_LIMIT', error: 'Terlalu banyak pertanyaan. Tunggu satu menit atau gunakan Cari rujukan.' }, 429);
      const body = await boundedJSON(request);
      const question = typeof body.question === 'string' ? body.question.trim() : '';
      if (!question || question.length > 1500) return reply({ error: 'Isi pertanyaan antara 1–1.500 karakter.' }, 400);
      if (/\b\d{16}\b/.test(question)) return reply({ error: 'Hapus nomor identitas 16 digit sebelum mengirim.' }, 400);
      if (typeof body.turnstileToken !== 'string' || !body.turnstileToken || body.turnstileToken.length > 2048) return reply({ code: 'VERIFY_REQUIRED', error: 'Selesaikan verifikasi pengunjung, lalu kirim ulang.' }, 403);
      const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: body.turnstileToken, remoteip: ip }), signal: AbortSignal.timeout(7000)
      });
      const verified = await verification.json();
      if (!verified.success || verified.hostname !== new URL(origin).hostname || verified.action !== 'siperi-ai') return reply({ code: 'VERIFY_REQUIRED', error: 'Verifikasi kedaluwarsa atau belum berhasil. Ulangi verifikasi lalu kirim kembali.' }, 403);
      const sources = retrieve(question);
      if (!sources.length) return reply({ reply: 'Belum ditemukan rujukan yang cukup untuk pertanyaan ini. Sebutkan topik, istilah, atau tahun yang dimaksud; kamu juga bisa menggunakan Cari rujukan.', sources: [], grounded: false, warning });
      const messages = promptFor(question, sources);
      if (encoder.encode(JSON.stringify(messages)).byteLength > 14000) return reply({ error: 'Pertanyaan terlalu panjang untuk konteks ini. Ringkas pertanyaan lalu coba lagi.' }, 400);
      const budget = env.DAILY_BUDGET.get(env.DAILY_BUDGET.idFromName('siperi-global'));
      if (!(await (await budget.fetch('https://budget.internal/reserve', { method: 'POST' })).json()).allowed) return reply({ code: 'DAILY_LIMIT', error: 'Jatah uji coba AI hari ini sudah terpakai. Tersedia lagi pukul 07.00 WIB. Cari rujukan tetap bisa digunakan.' }, 429);
      const output = await env.AI.run(env.AI_MODEL, { messages, max_tokens: 512, temperature: 0.1, chat_template_kwargs: { enable_thinking: false } });
      let text = (output.choices?.[0]?.message?.content || output.response || '').trim();
      if (!text) throw new Error('EMPTY_RESPONSE');
      const citations = [...text.matchAll(/\[(\d+)\]/g)].map(match => Number(match[1]));
      if (!citations.length || citations.some(number => number < 1 || number > sources.length)) return reply({ reply: 'Rujukan terkait ditemukan, tetapi jawaban AI belum dapat dipastikan dukungan sumbernya. Buka halaman berikut untuk memeriksa langsung.', grounded: false, sources: sources.map(({ title, url, page }) => ({ title, url, page })), warning });
      text = text.replace(/https?:\/\/\S+/g, '(lihat tautan sumber di bawah)').slice(0, 5000);
      return reply({ reply: text, grounded: true, sources: sources.map(({ title, url, page }) => ({ title, url, page })), warning });
    } catch (error) {
      const badRequest = ['JSON_REQUIRED', 'INVALID_JSON', 'BODY_TOO_LARGE'].includes(error.message);
      if (badRequest) return reply({ error: 'Format permintaan tidak valid atau terlalu besar.' }, error.message === 'BODY_TOO_LARGE' ? 413 : 400);
      // Pertanyaan, token verifikasi, dan isi sumber tidak ditulis ke log.
      return reply({ code: 'AI_UNAVAILABLE', error: 'AI sedang tidak tersedia atau kuotanya habis. Gunakan Cari rujukan atau coba kembali nanti.' }, 503);
    }
  }
};
