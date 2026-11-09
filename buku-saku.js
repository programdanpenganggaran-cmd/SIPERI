'use strict';
(() => {
  const chapters = [
    [1,'Sampul'],[3,'Kata pengantar'],[5,'Daftar isi'],[10,'01 · Revisi Anggaran Itu Apa?'],[11,'02 · Kamus Kilat Istilah'],[18,'03 · Dasar Hukum'],[21,'04 · Peta Kewenangan'],[25,'05 · Alur Revisi dan Checklist'],[30,'06 · Manajemen Pengelolaan Anggaran'],[32,'07 · Kalender dan Batas Waktu'],[35,'08 · Revisi dan IKPA'],[37,'09 · Situasi Khusus'],[40,'10 · Kesalahan Klasik'],[41,'11 · Latar Belakang Teknis'],[46,'12 · Jenis Revisi dan Batasannya'],[49,'13 · Membaca DIPA dan Kode Anggaran'],[52,'14 · Siklus Anggaran'],[58,'15 · Studi Kasus'],[62,'16 · Dokumen dan Template'],[66,'17 · SAKTI dan Satu DJA'],[69,'18 · Komunikasi'],[73,'19 · Rencana 90 Hari'],[78,'20 · Tanya Jawab'],[82,'21 · Latihan dan Pembahasan'],[84,'22 · Kebijakan TA 2026'],[90,'Lampiran dan Sumber'],[95,'Tentang Penulis']
  ];
  let book = null;
  let loading = null;
  let page = 1;
  let mode = 'text';
  const el = id => document.getElementById(id);
  const fold = value => value.toLocaleLowerCase('id').normalize('NFKD').replace(/\s+/g,' ');
  function isBook() { return location.hash.split('?')[0] === '#buku-saku'; }
  function navigate(number) {
    location.hash = 'buku-saku?halaman=' + Math.max(1,Math.min(book.pageCount,number));
  }
  function makeLink(number, title, excerpt) {
    const link = document.createElement('a');
    link.href = '#buku-saku?halaman=' + number;
    link.textContent = title;
    if(number === page) link.setAttribute('aria-current','page');
    if(excerpt) {const span = document.createElement('small');span.textContent = excerpt;link.append(span);}
    return link;
  }
  function renderIndex() {
    if(!book) return;
    const query = fold(el('book-search').value.trim());
    const target = el('book-toc');target.replaceChildren();
    if(!query) {
      chapters.forEach(([number,title]) => target.append(makeLink(number,title)));
      el('book-search-status').textContent = `${book.pageCount} halaman PDF · pilih bab atau cari kata`;
      return;
    }
    const hits = book.pages.filter(p => fold(p.text).includes(query));
    for(const hit of hits) {
      const index = fold(hit.text).indexOf(query);
      const excerpt = hit.text.replace(/\s+/g,' ').slice(Math.max(0,index-35),index+120);
      target.append(makeLink(hit.number,`Halaman PDF ${hit.number}`,excerpt));
    }
    el('book-search-status').textContent = hits.length ? `${hits.length} halaman cocok` : 'Tidak ditemukan. Coba kata lain; teks dalam gambar belum tercakup pencarian.';
  }
  function renderPage() {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const requested = Number(params.get('halaman') || 1);
    page = Number.isInteger(requested) && requested >= 1 && requested <= book.pageCount ? requested : 1;
    const current = book.pages[page-1];
    const chapter = [...chapters].reverse().find(([start]) => start <= page);
    el('book-page-label').textContent = `Halaman PDF ${page} dari ${book.pageCount}`;
    el('book-page-title').textContent = chapter ? chapter[1] : current.title;
    el('book-page-text').textContent = current.text;
    el('book-page-text').hidden = mode !== 'text' || !current.text;
    el('book-image-note').hidden = mode !== 'text' || !!current.text;
    el('book-cover').hidden = mode !== 'text' || page !== 1;
    if(page === 1) el('book-image-note').hidden = true;
    el('book-pdf-frame').hidden = mode !== 'pdf';
    const pdf = `buku-saku-revisi-2026.pdf#page=${page}&view=FitH`;
    el('book-open-pdf').href = pdf;
    if(mode === 'pdf') el('book-pdf-frame').src = pdf;
    else el('book-pdf-frame').removeAttribute('src');
    el('book-text-mode').setAttribute('aria-pressed',String(mode === 'text'));
    el('book-pdf-mode').setAttribute('aria-pressed',String(mode === 'pdf'));
    el('book-prev').disabled = page === 1;
    el('book-next').disabled = page === book.pageCount;
    el('book-page-select').value = String(page);
    renderIndex();
  }
  async function load() {
    if(!isBook()) return;
    if(book) {renderPage();return;}
    if(loading) return loading;
    el('book-retry').hidden = true;
    loading = (async() => {
      try {
        const response = await fetch('buku-saku.json');
        if(!response.ok) throw Error('Tidak dapat memuat buku');
        const data = await response.json();
        if(!Array.isArray(data.pages) || data.pages.length !== data.pageCount) throw Error('Data buku tidak lengkap');
        book = data;
        for(let number=1;number<=book.pageCount;number++) {
          const option = document.createElement('option');option.value=String(number);option.textContent=String(number);el('book-page-select').append(option);
        }
        if(isBook()) renderPage();
      } catch(error) {
        el('book-search-status').textContent='Buku belum dapat dimuat. Periksa koneksi atau buka PDF asli.';
        el('book-page-title').textContent='Buku belum tersedia';
        el('book-retry').hidden=false;
      } finally { loading=null; }
    })();
    return loading;
  }
  window.renderPocketBook = load;
  el('book-search').addEventListener('input',renderIndex);
  el('book-prev').addEventListener('click',()=>{if(book)navigate(page-1);});
  el('book-next').addEventListener('click',()=>{if(book)navigate(page+1);});
  el('book-page-select').addEventListener('change',event=>{if(book)navigate(Number(event.target.value));});
  el('book-text-mode').addEventListener('click',()=>{mode='text';if(book)renderPage();});
  el('book-pdf-mode').addEventListener('click',()=>{mode='pdf';if(book)renderPage();});
  el('book-retry').addEventListener('click',load);
  window.addEventListener('hashchange',load);
  load();
})();
