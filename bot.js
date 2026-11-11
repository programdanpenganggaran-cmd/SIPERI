'use strict';
(() => {
  const config = window.SIPERI_BOT_CONFIG || {};
  const API = config.apiUrl || '';
  const $ = id => document.getElementById(id);
  const dialog = $('bot-dialog');
  let followingMessages = true;
  const scrollContainer = () => window.getComputedStyle(dialog).overflowY === 'auto' ? dialog : $('bot-content');
  function syncMessages() {
    if (!dialog.open) return;
    $('bot-latest').hidden = followingMessages;
    if (followingMessages) {
      const messages = $('bot-messages');
      while (messages.children.length > 12 && !messages.firstElementChild.contains(document.activeElement)) messages.firstElementChild.remove();
      const container = scrollContainer();
      container.scrollTop = container.scrollHeight;
    }
  }
  function followLatest() {
    followingMessages = true;
    syncMessages();
  }
  for (const container of [$('bot-content'), dialog]) container.addEventListener('scroll', () => {
    if (!dialog.open || container !== scrollContainer()) return;
    followingMessages = container.scrollHeight - container.clientHeight - container.scrollTop <= 56;
    $('bot-latest').hidden = followingMessages;
  }, { passive: true });
  $('bot-latest').addEventListener('click', () => { followLatest(); $('bot-question').focus({ preventScroll: true }); });
  let mode = 'catalog', pending = false, controller = null, opener = null;
  let widgetId = null, verificationToken = '', turnstileLoading = null;
  if (window.visualViewport) {
    const fit = () => {
      dialog.style.setProperty('--bot-viewport-height', window.visualViewport.height + 'px');
      dialog.classList.toggle('bot-compact', window.visualViewport.height < 500);
    };
    window.visualViewport.addEventListener('resize', fit); fit();
  }
  const status = text => { $('bot-status').textContent = text; syncMessages(); };
  const normalize = text => text.toLocaleLowerCase('id').replace(/[^a-z0-9]+/g, ' ').trim();
  function line(text, kind = 'assistant') {
    const item = document.createElement('div'); item.className = 'bot-message bot-message-' + kind;
    const label = document.createElement('strong'); label.textContent = kind === 'user' ? 'Kamu' : kind === 'error' ? 'Perlu diperiksa' : 'Asisten SiPERI';
    const body = document.createElement('p'); body.textContent = text; item.append(label, body); $('bot-messages').append(item);
    syncMessages();
    return item;
  }
  function sourceLink(source, parent, number) {
    let url; try { url = new URL(source.url, location.href); } catch { return; }
    if (!['https:', 'http:'].includes(url.protocol)) return;
    const link = document.createElement('a'); link.href = url.href;
    link.textContent = (number ? `[${number}] ` : '') + source.title + (source.page ? ' · hal. PDF ' + source.page : '');
    parent.append(link);
  }
  function searchCatalog(question) {
    const stop = new Set(['apa', 'apakah', 'bagaimana', 'yang', 'untuk', 'dengan', 'dan', 'di', 'ke', 'dari', 'saya', 'cari', 'tolong', 'dokumen']);
    const terms = normalize(question).split(' ').filter(t => t && !stop.has(t));
    const items = window.siperiCatalog || [];
    if (!items.length) { status('Katalog belum dimuat. Tunggu sebentar lalu coba lagi.'); return false; }
    if (!terms.length) { line('Gunakan kata seperti revisi, SBK, TOR, nama unit, atau tahun dokumen.'); return false; }
    const results = items.filter(item => terms.every(t => normalize(item.title + ' ' + (item.year || '') + ' ' + item.stage).includes(t))).slice(0, 8);
    const message = line(results.length ? 'Berikut tautan yang sesuai. Periksa tahun dan isi sumber sebelum digunakan.' : 'Belum ada judul yang cocok. Coba kata lebih singkat, atau jelajahi Pusat Pengetahuan. Pencarian ini belum membaca seluruh isi PDF.');
    for (const item of results) sourceLink({ title: item.title + ' · ' + (item.year || 'periode belum dikonfirmasi'), url: item.url }, message);
    status(results.length ? `${results.length} rujukan ditampilkan, maksimal 8 hasil.` : 'Tidak ada hasil yang cocok.');
    return true;
  }
  function setPending(value) {
    pending = value; $('bot-send').disabled = value; $('bot-question').readOnly = value;
    $('bot-form').setAttribute('aria-busy', String(value));
    document.querySelectorAll('input[name="bot-mode"]').forEach(input => input.disabled = value || (input.value === 'ai' && (!API || !config.turnstileSiteKey)));
  }
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    if (turnstileLoading) return turnstileLoading;
    turnstileLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true;
      script.onload = resolve;
      script.onerror = () => { script.remove(); turnstileLoading = null; reject(Error('Verifikasi belum termuat. Periksa koneksi lalu pilih Ulangi verifikasi. Cari rujukan tetap tersedia.')); };
      document.head.append(script);
    });
    return turnstileLoading;
  }
  async function mountVerification() {
    if (!API || !config.turnstileSiteKey) return;
    try {
      await loadTurnstile();
      if (mode !== 'ai' || !dialog.open || widgetId !== null) return;
      widgetId = window.turnstile.render($('bot-verification-widget'), {
        sitekey: config.turnstileSiteKey, action: 'siperi-ai', theme: 'dark', size: 'compact', language: 'id',
        callback: token => { verificationToken = token; if (!pending && mode === 'ai') status('Verifikasi berhasil. Pertanyaan siap dikirim.'); },
        'expired-callback': () => { verificationToken = ''; if (!pending && mode === 'ai') status('Verifikasi kedaluwarsa. Pilih Ulangi verifikasi.'); },
        'error-callback': () => { verificationToken = ''; if (!pending && mode === 'ai') status('Verifikasi belum berhasil. Pilih Ulangi verifikasi atau gunakan Cari rujukan.'); }
      });
    } catch (error) { status(error.message); }
  }
  function resetVerification() {
    verificationToken = '';
    if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
  }
  $('bot-retry-verify').addEventListener('click', () => {
    status('Memuat ulang verifikasi...');
    if (widgetId !== null) resetVerification(); else mountVerification();
  });
  async function askAI(question) {
    if (!API) { status('AI belum diaktifkan. Gunakan Cari rujukan.'); return; }
    if (/\b\d{16}\b/.test(question)) { status('Hapus nomor identitas 16 digit sebelum mengirim.'); return; }
    if (!verificationToken) { status('Selesaikan verifikasi pengunjung di atas, lalu kirim kembali. Pertanyaanmu tetap tersimpan.'); await mountVerification(); return; }
    controller = new AbortController(); const timeout = setTimeout(() => controller?.abort(), 35000);
    followLatest();
    setPending(true); status('Menyusun jawaban dari rujukan SiPERI...');
    line(question, 'user');
    $('bot-question').value = '';
    try {
      const response = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question, turnstileToken: verificationToken }), signal: controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(data.error || 'Layanan AI belum dapat menjawab. Coba lagi nanti atau gunakan Cari rujukan.');
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw Error('Server belum memberikan jawaban teks.');
      const item = line(data.reply);
      if (Array.isArray(data.sources)) data.sources.slice(0, 6).forEach((source, index) => sourceLink(source, item, index + 1));
      if (data.warning) { const note = document.createElement('small'); note.textContent = data.warning; item.append(note); }
      status(data.grounded ? 'Jawaban AI diterima. Buka sumber untuk memeriksa penjelasan.' : 'Rujukan belum cukup untuk jawaban yang pasti. Coba pertanyaan lebih spesifik.');
    } catch (error) {
      if (!$('bot-question').value) $('bot-question').value = question;
      if (dialog.open) {
        const message = error.name === 'AbortError' ? 'Jawaban belum diterima dalam waktu tunggu. Coba lagi atau gunakan Cari rujukan.' : error.message || 'Koneksi gagal. Coba lagi.';
        line(message, 'error');
        status(message + ' Pertanyaan tetap tersimpan.');
      }
    } finally {
      clearTimeout(timeout); controller = null; setPending(false);
      if (dialog.open && mode === 'ai') resetVerification();
    }
  }
  function openBot(event) {
    opener = event.currentTarget; dialog.showModal(); $('bot-launcher').setAttribute('aria-expanded', 'true'); $('bot-question').focus();
    if (mode === 'ai') mountVerification();
  }
  $('bot-launcher').addEventListener('click', openBot);
  $('bot-open-from-library').addEventListener('click', openBot);
  $('bot-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    controller?.abort(); verificationToken = '';
    if (widgetId !== null && window.turnstile) { window.turnstile.remove(widgetId); widgetId = null; }
    $('bot-launcher').setAttribute('aria-expanded', 'false'); (opener || $('bot-launcher')).focus();
  });
  $('bot-library').addEventListener('click', () => dialog.close());
  document.querySelectorAll('input[name="bot-mode"]').forEach(input => input.addEventListener('change', () => {
    mode = input.value; $('bot-verification').hidden = mode !== 'ai'; $('bot-send').textContent = mode === 'ai' ? 'Kirim' : 'Cari';
    status(mode === 'ai' ? 'Pertanyaan dikirim ke Cloudflare Workers AI. Selesaikan verifikasi pengunjung untuk melanjutkan.' : 'Pencarian rujukan siap digunakan.');
    if (mode === 'ai') mountVerification();
  }));
  $('bot-form').addEventListener('submit', async event => {
    event.preventDefault(); const question = $('bot-question').value.trim(); if (!question || pending) return;
    if (question.length > 1500) { status('Maksimal 1.500 karakter.'); return; }
    if (mode === 'ai') await askAI(question); else { followLatest(); line(question, 'user'); if (searchCatalog(question)) $('bot-question').value = ''; }
  });
  $('bot-question').addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    if (!pending && !event.repeat) $('bot-form').requestSubmit();
  });
  setPending(false);
})();
