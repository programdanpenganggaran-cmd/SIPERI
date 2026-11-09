import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const canonical = path.join(root, '../siperi-portal');
const portal = fs.existsSync(path.join(canonical, 'buku-saku.json')) ? canonical : path.dirname(root);
const read = name => JSON.parse(fs.readFileSync(path.join(portal, name), 'utf8'));
const base = 'https://programdanpenganggaran-cmd.github.io/SIPERI/';
const book = read('buku-saku.json');
const chunks = [];
for (const page of book.pages) {
  if (page.number < 10 || page.number > 93) continue;
  const text = page.text.replace(/BUKU SAKU\s*·\s*SURVIVAL REVISI ANGGARAN K\/L\s*\d*/g, '').replace(/\s+/g, ' ').trim();
  if (text.length < 80) continue;
  for (let start = 0; start < text.length; start += 800) {
    const section = text.slice(start, start + 1000);
    if (section.length < 80) continue;
    chunks.push({ id: `book-${page.number}-${start}`, kind: 'book', title: book.title, page: page.number, url: `${base}buku-saku-revisi-2026.pdf#page=${page.number}`, text: section });
  }
}
for (const source of read('catalog-sources.json').sources) {
  for (const item of source.resources) chunks.push({ id: `catalog-${chunks.length}`, kind: 'catalog', title: item.title, url: item.url, text: `${item.title}. Tahun profil sumber: ${source.year}. Tahap: ${source.stage}. Ini metadata tautan; isi file tujuan belum diindeks.` });
}
for (const [stage, items] of Object.entries(read('services.json'))) {
  for (const item of items) chunks.push({ id: `service-${chunks.length}`, kind: 'catalog', title: item.title, url: item.url, text: `${item.title}. Kelompok: ${stage}. Periode: ${item.year || 'belum dikonfirmasi'}. Ini metadata tautan; isi file tujuan belum diindeks.` });
}
chunks.push({ id: 'input-kelengkapan', kind: 'catalog', title: 'Input Dokumen Kelengkapan', url: 'https://script.google.com/macros/s/AKfycbzvBpZ_x2EGgGf6fBf2toq_4PuV1EoMbKhNT1BEmMr7xC03MaDT_r9YSRro052pGVugaQ/exec', text: 'Input Dokumen Kelengkapan. Aplikasi untuk mengunggah dokumen kelengkapan revisi anggaran. Gunakan aplikasi ini untuk input data dukung.' });
fs.writeFileSync(path.join(root, 'src/knowledge.json'), JSON.stringify({ version: '2026-11-09', chunks }));
console.log(`${chunks.length} potongan dari buku dan katalog publik; tidak mengambil dokumen privat.`);
