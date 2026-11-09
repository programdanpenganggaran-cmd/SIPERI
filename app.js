'use strict';
const elements = Object.fromEntries(['search','year','stage','category','results','status','empty','error','retry','source-list','catalog-title'].map(id => [id, document.getElementById(id)]));
let sources = [];
let resources = [];
let serviceResources = [];
let page = 'beranda';
const pageInfo = {
  monitoring: ['PANTAU ATR/BPN', 'Pantau anggaran unit kerjamu.', 'Buka aplikasi Peta Anggaran Terintegrasi Antar Unit untuk memantau anggaran dan realisasi.'],
  beranda: ['Ruang kerja anggaran', 'Satu portal. Seluruh kebutuhan anggaran.', 'Temukan dokumen penyusunan, revisi, POK, dan realisasi tanpa berpindah portal.'],
  pagu: ['Penyusunan PAGU', 'Susun anggaran dengan referensi yang tepat.', 'Pilih tahun sumber dan tahap untuk menemukan pagu, template, serta dokumen pendukung.'],
  revisi: ['Revisi Anggaran', 'Dari usulan sampai penelaahan.', 'Akses dokumen proses revisi dan spreadsheet informasi progres.'],
  pok: ['POK SEKJEN', 'Rencana kegiatan, menurut unit kerja.', 'Buka dokumen Petunjuk Operasional Kegiatan Sekretariat Jenderal.'],
  realisasi: ['Realisasi Anggaran', 'Telusuri dokumen pelaksanaan anggaran.', 'Dokumen bulanan dan arsip realisasi yang tersedia dari sumber SiPERI.'],
  arsip: ['Arsip SiPERI', 'Dokumen lama tetap mudah dijangkau.', 'Telusuri katalog tahun sebelum 2026. Arsip 2021 belum tersedia.']
};
function route() {
  const [requested, queryString = ''] = location.hash.slice(1).split('?');
  const params = new URLSearchParams(queryString);
  page = Object.hasOwn(pageInfo, requested) ? requested : 'beranda';
  const [label, title, description] = pageInfo[page];
  document.querySelector('.intro .eyebrow').textContent = label;
  document.getElementById('page-title').textContent = title;
  document.querySelector('.intro > p:not(.eyebrow)').textContent = description;
  document.title = `${label} | SiPERI`;
  document.querySelectorAll('[data-page]').forEach(link => {
    const active = link.dataset.page === page;
    link.classList.toggle('current', active);
    if(active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
  });
  document.getElementById('home-services').hidden = page !== 'beranda';
  document.getElementById('workspace-heading').hidden = page !== 'beranda';
  document.getElementById('monitoring-shortcut').hidden = page !== 'beranda';
  document.getElementById('stage-filter').hidden = page !== 'pagu';
  const note = document.getElementById('page-note');
  const notes = {pok:'Dokumen POK tersedia untuk delapan unit kerja. Dashboard angka realisasi belum terhubung ke sumber data; tidak ada angka simulasi yang ditampilkan.',realisasi:'Sumber yang terbaca memuat Januari dan Februari 2026 serta arsip 2025. Bulan lain belum tersedia dalam katalog.',revisi:'Tautan dari website dan Linktree dipertahankan terpisah. Periode yang belum diketahui ditandai, bukan diasumsikan sebagai tahun 2026.'};
  note.textContent = notes[page] || '';
  note.hidden = !notes[page];
  if(page === 'monitoring') {note.hidden=true;}
  elements.year.value = 'all';
  elements.stage.value = 'all';
  elements.category.value = 'all';
  elements.search.value = '';
  if(['all','2022','2023','2024','2025','2026'].includes(params.get('tahun'))) elements.year.value = params.get('tahun');
  if(page === 'pagu' && ['all','Pagu Anggaran','Pagu Alokasi'].includes(params.get('tahap'))) elements.stage.value = params.get('tahap');
  if(['all','Pagu & TPNBP','Template & referensi','Kelengkapan & reviu','Materi & informasi'].includes(params.get('kelompok'))) elements.category.value = params.get('kelompok');
  elements.search.value = params.get('cari') || '';
  document.getElementById('share-panel').hidden = true;
  render();
  animatePage();
}
function animatePage() {
  if (!window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const id of ['page-title','katalog']) {
    const element = document.getElementById(id);
    if (!element.animate) continue;
    if(element.getAnimations) element.getAnimations().forEach(animation => animation.cancel());
    element.animate([{opacity:0.55,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}], {duration:180,easing:'ease-out'});
  }
}
function currentHash() {
  const params = new URLSearchParams();
  if(elements.year.value !== 'all') params.set('tahun',elements.year.value);
  if(page === 'pagu' && elements.stage.value !== 'all') params.set('tahap',elements.stage.value);
  if(elements.category.value !== 'all') params.set('kelompok',elements.category.value);
  if(elements.search.value.trim()) params.set('cari',elements.search.value.trim());
  return '#' + page + (params.size ? '?' + params.toString() : '');
}
function updateAddress() {
  history.replaceState(null,'',currentHash());
  if(!document.getElementById('share-panel').hidden) showShare(false);
}
function showShare(focus = true) {
  document.getElementById('share-panel').hidden = false;
  const field = document.getElementById('share-url');
  field.value = location.href.split('#')[0] + currentHash();
  if(focus) {field.focus();field.select();}
}
const normalize = value => value.toLocaleLowerCase('id').replace(/[^a-z0-9]+/g, ' ').trim();
function category(title) {
  if (/reviu|review|kelengkapan|kelang|berita acara|pemberkasan|administrasi|penelitian/i.test(title)) return 'Kelengkapan & reviu';
  if (/template|sbk|peraturan|pedoman|referensi|struktur|major project|prioritas|koridor|rekap ro/i.test(title)) return 'Template & referensi';
  if (/pagu|tpnbp/i.test(title)) return 'Pagu & TPNBP';
  return 'Materi & informasi';
}
function sourceType(url) {
  if (url.includes('script.google.com/macros/')) return 'Aplikasi PANTAU';
  if (url.includes('script.google.com/d/')) return 'Editor Apps Script';
  const host = new URL(url).hostname;
  if (host === 'docs.google.com') return 'Google Sheets';
  if (host === 'drive.google.com') return 'Google Drive';
  if (host === '1drv.ms' || host === 'onedrive.live.com') return 'OneDrive';
  return host;
}
function textElement(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}
function render() {
  if (!resources.length) return;
  const query = normalize(elements.search.value).replace(/\breview\b/g, 'reviu').replace(/\bprogress\b/g, 'progres');
  const terms = query.split(' ').filter(Boolean);
  const pool = [...resources, ...serviceResources].filter(item => page === 'beranda' || (page === 'arsip' ? item.year && item.year < 2026 : item.service === page));
  const matches = pool.filter(item =>
    (elements.year.value === 'all' || item.year === Number(elements.year.value)) &&
    (elements.stage.value === 'all' || item.stage === elements.stage.value) &&
    (elements.category.value === 'all' || item.category === elements.category.value) &&
    terms.every(term => item.search.includes(term)));
  elements.results.replaceChildren();
  for (const item of matches) {
    const row = textElement('li', '', 'result');
    const copy = document.createElement('div');
    copy.append(textElement('p', `${item.year || 'Periode belum dikonfirmasi'} · ${item.stage} · ${item.category}`, 'meta'));
    const heading = document.createElement('h3');
    const link = textElement('a', item.title.replace(/^\d+\.\s*/, '').replace(/ - Google Drive$/i, ''));
    link.href = item.url;
    heading.append(link);
    copy.append(heading);
    const years = item.title.match(/\b20\d{2}\b/g) || [];
    if (years.some(year => Number(year) !== item.year)) copy.append(textElement('p', 'Periksa periode: tahun pada judul berbeda dari tahun sumber.', 'period-warning'));
    row.append(copy, textElement('span', sourceType(item.url), 'result-type'));
    elements.results.append(row);
  }
  elements.empty.hidden = matches.length > 0;
  elements.status.textContent = `${matches.length} akses ditemukan${query ? ` untuk “${elements.search.value}”` : ''}`;
  elements['catalog-title'].textContent = `${pageInfo[page][0]} · ${elements.year.value === 'all' ? 'Semua tahun' : elements.year.value}`;
  const visibleSources = sources.filter(s => (elements.year.value === 'all' || s.year === Number(elements.year.value)) && (elements.stage.value === 'all' || s.stage === elements.stage.value));
  elements['source-list'].replaceChildren(...visibleSources.map(source => {
    const li = document.createElement('li');
    const link = textElement('a', `${source.stage} ${source.year} · Linktree asli`);
    link.href = source.url;
    li.append(link);
    return li;
  }));
}
async function load() {
  document.getElementById('catalog-loading').hidden = false;
  elements.error.hidden = true;
  elements.empty.hidden = true;
  elements.retry.disabled = true;
  elements.status.textContent = 'Memuat katalog...';
  try {
    const [response, serviceResponse] = await Promise.all([fetch('./catalog-sources.json'),fetch('./services.json')]);
    if (!response.ok || !serviceResponse.ok) throw new Error('Catalog unavailable');
    const data = await response.json();
    const services = await serviceResponse.json();
    if (!Array.isArray(data.sources)) throw new Error('Invalid catalog');
    sources = data.sources;
    resources = sources.flatMap(source => source.resources.map(item => {
      const group = category(item.title);
      let search = normalize(`${item.title} ${source.year} ${source.stage}`);
      search = search.replace(/\breview\b/g, 'reviu').replace(/\bprogress\b/g, 'progres');
      if (/template|tor|rab/i.test(item.title)) search += ' template tor rab kerangka acuan kerja rencana anggaran biaya';
      if (/reviu|apip|itjen|irjen/i.test(item.title)) search += ' reviu apip itjen irjen inspektorat jenderal';
      return {...item, service:'pagu', year: source.year, stage: source.stage, category: group, search};
    }));
    serviceResources = Object.entries(services).flatMap(([service, items]) => items.map(item => ({...item,service,stage:pageInfo[service][0],category:category(item.title),search:normalize(`${item.title} ${item.year || ''} ${pageInfo[service][0]}`).replace(/\bprogress\b/g,'progres').replace(/\breview\b/g,'reviu')})));
    route();
  } catch (error) {
    elements.results.replaceChildren();
    elements.error.hidden = false;
    elements.status.textContent = 'Katalog belum tersedia.';
  } finally { elements.retry.disabled = false; document.getElementById('catalog-loading').hidden = true; }
}
document.getElementById('search-form').addEventListener('submit', event => {event.preventDefault(); render(); document.getElementById('katalog').scrollIntoView({block:'start'});});
document.getElementById('scroll-data').addEventListener('click', event => {
  event.preventDefault();
  const target = document.getElementById('katalog');
  const reduce = !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.focus({preventScroll:true});
  target.scrollIntoView({behavior:reduce ? 'auto' : 'smooth',block:'start'});
});
elements.search.addEventListener('input', render);
for (const name of ['year','stage','category']) elements[name].addEventListener('change', () => {render();updateAddress();});
elements.search.addEventListener('input', updateAddress);
document.getElementById('reset').addEventListener('click', () => {history.replaceState(null,'','#'+page);route();});
document.getElementById('share').addEventListener('click', () => showShare());
document.getElementById('clear-search').addEventListener('click', () => {elements.year.value='all';elements.stage.value='all';elements.category.value='all';render();updateAddress();});
elements.retry.addEventListener('click', load);
window.addEventListener('hashchange', () => {route();document.getElementById('main').focus();});
load();
