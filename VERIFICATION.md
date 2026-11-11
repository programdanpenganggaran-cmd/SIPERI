# Status terbaru: redesign SiPERI, 11 November 2026

## Redesign 11 November 2026

- Referensi DeepBook ditangkap dengan Firecrawl dan pikselnya ditinjau. Header horizontal native menu, pembuka hitam/biru, layanan gelap, area baca putih dan footer biru diterapkan di CSS portal; tidak mengimpor library Webflow atau aset pihak ketiga.
- Pemeriksaan katalog, PDF, asisten dan motion lulus. Motion test mencakup fallback tanpa observer, konten tetap terlihat, reveal sekali, reduced-motion berubah saat berjalan, menu ditutup lewat tautan/Escape, serta pemulihan fokus.
- Kontras diukur: putih/#1e6ef3 4.585364:1; #bcc3cc/#101113 10.629800:1; #606975/putih 5.563120:1; #9bc1ff/#191919 9.599351:1. Border kontrol #858d98/putih 3.354279:1, dipakai untuk batas bidang, bukan warna teks.
- Tangkapan Firecrawl produksi ditinjau pada desktop 1440×1700 dan PAGU 2026 pada 320×900 (tangkapan penuh 320×3042): navigasi, judul, tombol, filter, sembilan hasil, dan footer tampil tanpa terpotong pada area yang ditangkap. Label sapaan maskot disembunyikan pada HP untuk mengurangi tutupan atas kontrol. Ini pemeriksaan piksel pada dua konfigurasi, bukan bukti seluruh ukuran/keadaan.
- Review kode memperbaiki outline maskot agar terlihat di latar gelap/terang, fokus kembali ke summary saat tautan menu mengarah ke halaman yang sama, dan dialog bot dapat digulir menyeluruh ketika visual viewport kurang dari 500px. Mock menguji perpindahan kelas compact saat viewport berubah. Keyboard fisik, penyelesaian CAPTCHA, keyboard HP dan zoom browser 200% belum diuji langsung.
- Beranda 320×1000 juga ditinjau: judul/uraian terbungkus, tautan katalog dan menu terlihat, label balon maskot tidak lagi menutup kontrol. Header dan toolbar pembaca PDF pada halaman 22 ditinjau pada 1440×1100; viewer asli masih memuat halaman dalam tangkapan sehingga pemeriksaan ini tidak mengklaim isi PDF telah selesai dirender. File PDF dan logika pembaca tidak diganti.
- Border pencarian gelap diperkuat ke #788492: 4.926093:1 terhadap #101215 dan 3.888756:1 terhadap latar tombol #24282e, memenuhi batas 3:1 untuk tanda kontrol. Teks di dalamnya memakai warna lain yang lebih terang.

- Maskot `peri-asn.webp` ditinjau visual setelah generasi dan optimasi: RGBA, latar transparan, seluruh karakter/sayap/sepatu terlihat. Tetap memakai ruang tombol yang sama, tanpa animasi berulang baru.
- Pengujian composer lulus: Enter mengirim, Shift+Enter dan IME tidak ditangkap, tombol modifier tetap normal, repeat/pending tidak mengirim ganda, field kosong saat request berjalan, sukses tetap kosong, kegagalan kuota memulihkan pertanyaan, verifikasi belum selesai mempertahankan pertanyaan. Penelusuran katalog juga mengosongkan input setelah dijalankan.
- Kontras hint keyboard #526273 di putih: 6.262298:1. Browser/native host masih tidak tersedia; keyboard perangkat nyata, reflow 320 px, dan zoom visual 200% belum diverifikasi pada revisi ini.

## Riwayat integrasi Cloudflare, 9 November 2026

- Integrasi dipublikasikan pada commit `3852c23c50450dff0c11e69c7019f32f0d227042`; kedua workflow GitHub Pages selesai sukses. Lightpanda memuat versi publik, membuka dialog, memilih Tanya AI, dan memastikan panel verifikasi ditampilkan. Lightpanda tidak menguji penyelesaian CAPTCHA atau tata letak CSS visual.

- Worker berhasil diterbitkan; GET `/health` produksi melalui WSL mengembalikan HTTP 200 dan configured=true. CORS preflight 204; tanpa token, token palsu, dan origin tidak sesuai ditolak 403. Koneksi Node/PowerShell Windows mengalami kegagalan TLS, sedangkan curl HTTPS WSL berhasil tanpa menonaktifkan validasi sertifikat.
- Model Gemma 4 Workers AI menjawab dua pertanyaan nyata (definisi revisi; alur dan kelengkapan) dengan penanda halaman sumber. Ini pengujian model dan konteks, bukan bukti ketepatan seluruh jawaban hukum.
- `cloudflare/check.mjs`: retrieval, CORS, verifikasi hostname/action/token, ukuran kiriman, blok 16 digit, sumber palsu, error penyedia, rate limit, batas global 50 reservasi dan reset UTC diuji dengan mock. Reservasi bersamaan diuji dengan penyimpanan transaksi tiruan; kontrak serialisasi produksi mengikuti Durable Objects.
- `bot-check.cjs`: pencarian lokal tanpa request AI, verifikasi, sumber bernomor, token kedaluwarsa, error kuota, input tetap tersimpan, aria-busy, blok 16 digit, dan fokus kembali diuji di DOM tiruan. Katalog dan pembaca PDF tetap lulus pemeriksaan masing-masing.
- Kontras terukur: #526273/#f5f8fb = 5.875366:1; #123453/#ffffff = 12.790661:1; #73501a/#ffffff = 7.263048:1.
- Host browser dan native computer-use tidak tersedia. Verifikasi Turnstile oleh manusia, tata letak visual 320 px/zoom 200%, keyboard nyata dan keyboard HP belum diuji. Widget kompak, native dialog, fokus, dan ukuran input dipertahankan; ini bukan klaim kepatuhan WCAG menyeluruh.
- Indeks berisi 304 potongan buku dan metadata katalog yang sudah publik. Tidak mengimpor indeks privat Netlify Blobs. Jawaban memakai maksimal 4 kutipan; nomor kutipan yang valid tidak otomatis membuktikan seluruh penjelasan benar.

Catatan berikut merupakan riwayat pemeriksaan sebelumnya; pernyataan belum deploy di bagian lama tidak menggambarkan status terkini.


# Pemeriksaan purwarupa

Pengguna memilih melanjutkan tampilan bot dahulu dan mencari alternatif Netlify karena kredit hampir habis. Endpoint AI bot publik dikosongkan, pilihan AI dinonaktifkan dengan label segera hadir. Bot publik hanya menelusuri katalog browser dan tidak memanggil Netlify. Penanganan error/kredensial disiapkan untuk koneksi berikutnya dan diuji dengan mock. Perubahan backend FAQ pada faq-repair tetap lokal, tidak diterbitkan.

Asisten melayang: uji bot-check.cjs lulus untuk dialog buka/tutup, pencarian tanpa API, kode akses tidak sesuai, error autentikasi Gemini, respons sukses tiruan, penolakan nomor identitas, dan penghapusan menu Pusat Pengetahuan. Maskot hasil image_gen ditinjau visual. Kontras teks sekunder di putih 6.262298:1, navy di putih 12.790661:1. Native dialog dipakai untuk fokus modal/Escape; walkthrough keyboard, layar kecil, dan keyboard perangkat nyata belum terverifikasi. Netlify connector meminta reauthentication; kredensial Gemini belum diperiksa/diubah.

9 November 2026, buku saku: PDF 96 halaman dibaca dengan pypdf. Sampul dan tabel halaman PDF 22 dirender memakai Poppler dan ditinjau; tabel membutuhkan mode asli untuk mempertahankan kolom. PDF salinan dipertahankan utuh. Uji book-check.cjs lulus (96 halaman, pencarian, hasil kosong, batas navigasi, rute tidak valid, mode PDF, signature PDF). Lightpanda lokal memuat halaman 22 dan menampilkan judul bab Peta Kewenangan. Kontras putih di biru petrol 6.738629:1 dan teks sekunder di panel buku 6.251924:1. Pemeriksaan visual browser desktop/HP dan keyboard penuh belum dilakukan.

4 November 2026: PASS pengujian pemulihan filter dari URL Pagu Alokasi 2025 (9 akses), tautan berbagi, dan nilai parameter tidak valid. Sintaks dan persiapan artefak lulus. Browser visual dan keyboard belum diverifikasi pada iterasi ini.

2 November 2026. Status: purwarupa lokal, belum siap publikasi.

- PASS sintaks: node --check app.js.
- PASS fungsi katalog: node check.cjs menguji tampilan awal sembilan akses 2026, 111 akses lintas tahun/tahap, pencarian template, sinonim review/reviu, filter kosong, reset, kegagalan pemuatan dan pemulihan lewat coba ulang.
- PASS format URL: seluruh tujuan katalog menggunakan HTTP atau HTTPS. Ketersediaan dan izin setiap tujuan belum diverifikasi.
- PASS server lokal: index dan JSON katalog mengembalikan HTTP 200. Server pemeriksaan dihentikan setelah pengujian.
- PASS kontras terukur: putih/biru tua 12.790661:1; teks sekunder/latar halaman 5.780515:1; teks tombol/emas 7.523422:1. Ini pemeriksaan sebagian pasangan warna, bukan seluruh keadaan visual.
- Arah desain dan tujuan pilihan visual dicatat di DESIGN.md. Tidak ada logo atau gambar baru yang dibuat.

Delivery Gate antislop belum lengkap: browser access host tidak tersedia. Pemeriksaan visual 320 px, tablet, desktop, zoom 200%, klik seluruh kontrol, fokus dan keyboard belum terlaksana. Jangan menganggap seluruh gate lulus atau purwarupa ini sebagai website yang sudah siap tayang.

Belum ada push GitHub atau deployment. Palet adalah interpretasi awal arah ATR/BPN, belum validasi pedoman merek resmi. Tautan 2021 belum diterima dan Pagu Alokasi 2026 belum ada dalam sembilan sumber yang diberikan.

## Pembaruan website utuh

- PASS pengujian halaman internal: Beranda mencakup 137 akses; PAGU 111, Revisi 13, POK 8, Realisasi 5. Arsip sebelum 2026 mencakup 104 akses.
- PASS pemeriksaan tujuan layanan: tidak ada tautan Google Sites di katalog layanan baru. Navigasi utama menggunakan halaman hash internal.
- PASS persiapan artefak: node prepare.cjs menghasilkan folder public dari daftar file publik yang dibatasi. Workflow GitHub Pages tersedia untuk repository portal tersendiri.
- Dashboard angka belum diimplementasikan karena belum ada sumber data angka yang dibaca. POK menampilkan dokumen delapan unit kerja, bukan dashboard tiruan.
- CLI gh tidak tersedia, dan tidak ditemukan tool pembuatan repository pada koneksi GitHub. Repository baru dan publikasi belum dibuat.
- Gate visual/keyboard antislop masih belum lengkap; tidak ada klaim website siap produksi.

Iterasi visual kedua: pemeriksaan fungsi tetap lulus setelah perubahan hierarki beranda, sidebar gelap, panel pencarian, dan susunan layanan 4/2/1 kolom. Persiapan artefak kembali berhasil. Browser visual dan keyboard belum tersedia untuk verifikasi; status tetap purwarupa.
