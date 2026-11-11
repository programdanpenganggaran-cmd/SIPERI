# Status terbaru: redesign SiPERI, 11 November 2026

## Data Bedah DIPA di beranda

Tautan /exe diperiksa dan memberi 404; /exec mengarah ke login Google. Panel beranda menggunakan /exec dengan keterangan memerlukan akun Google, tanpa iframe atau penyalinan data. Isi aplikasi dan izin setelah login belum diuji. Chrome lokal 1280x900 dan 320x900: panel terlihat hanya di beranda, tersembunyi pada Revisi, batas panel berada di viewport, tautan dapat difokuskan dengan keyboard dan target setinggi 48px. Tangkapan ponsel ditinjau. Pemeriksaan katalog, buku, bot, motion dan build lulus. Token warna panel memakai pasangan navy/teks/aksi yang sudah diukur sebelumnya.

Delivery Gate cakupan ini: Hard PASS (tujuan nyata, label login, keyboard dan reflow teruji); Purpose PASS (akses layanan beranda dengan pola panel yang sudah ada); Liveliness PASS (identitas dan dials tetap); Craftsmanship PASS (HTML/CSS/route langsung, tanpa dependensi dan tanpa klaim akses dokumen setelah login).

## Kajian komponen dan scroll asisten

- Arc UI, Arc MCP, dan beUI Native diperiksa dari sumber GitHub pada SHA yang dicatat di UI_REFERENCES.md. Arc UI tidak diimpor karena lisensi tidak jelas dan reset global berbenturan dengan tema; Arc MCP adalah alat deployment, bukan komponen; beUI Native memakai React Native. Tidak menjalankan CLI repositori, memasang dependency, atau memberikan kredensial baru.
- Sumber beUI terpilih diarsipkan dengan LICENSE MIT untuk referensi pengembangan. Allowlist prepare.cjs tidak memuat folder references maupun UI_REFERENCES.md; arsip dapat ditelusuri di repository, bukan dimuat sebagai aset situs atau dimasukkan ke indeks jawaban bot.
- Perilaku Message Scroller diimplementasikan mandiri di bot.js. Saat membaca pesan lama, jawaban tidak menggulir atau memangkas riwayat yang sedang dibaca. Mengirim pertanyaan atau memilih Ke pesan terbaru melanjutkan mengikuti akhir percakapan. Scroll dibatasi pada panel/dialog, tanpa scrollIntoView yang dapat menggerakkan halaman portal. Tidak ada animasi scroll baru.
- bot-check.cjs lulus dengan metrik DOM tiruan: balasan asinkron saat membaca pesan lama, perlindungan riwayat lebih dari 12 pesan, tombol terbaru dan fokus tanpa menggeser halaman, ambang 56px untuk mengikuti kembali, sumber/catatan selesai sebelum gulir akhir, panel normal dan dialog compact. Enter/IME, kirim ganda, teks kosong setelah kirim, pemulihan teks saat gagal, verifikasi, dan penelusuran lokal tetap lulus.
- Chrome headless lokal memakai Playwright dan profil terisolasi, tanpa akun pengguna: viewport 1280x900, 320x850, dan 390x450. Setiap konfigurasi membuka asisten, mengirim empat penelusuran TOR dengan Enter, menerima respons AI simulasi setelah menggulir ke atas, memastikan posisi baca/halaman tetap, mengaktifkan tombol terbaru lewat Enter, dan menutup dengan Escape serta fokus kembali ke launcher. Tidak ada pageerror, tidak ada overflow horizontal halaman pada keadaan ini, tombol 44px terlihat di dalam viewport termasuk compact. Tangkapan ketiganya ditinjau. Respons AI disimulasikan melalui route browser; tidak memakai model atau melewati verifikasi produksi.
- Kontras baru: tautan tombol #9ac2ff terhadap #141e2b 9.225286:1 dan #1b2e48 7.534225:1. Batas kontrol #718096 terhadap #141e2b 4.183041:1 memenuhi syarat non-teks 3:1; warna ini tidak dipakai untuk teks tombol. Hover/fokus memakai token yang sudah diukur. Zoom 200%, pembaca layar, dan keyboard HP nyata belum diuji pada revisi ini.

Delivery Gate untuk perubahan ini:

- Hard Gate PASS: kontrol native bernama, Tab/fokus/Enter/Escape dan respons nyata di Chrome diuji sebagaimana daftar di atas; keadaan gagal dan input dilindungi di mock; sumber dan angka bukan rekaan; tidak ada aset visual baru atau navigasi palsu.
- Purpose Gate PASS: tombol terbaru menyediakan jalan kembali dari pesan lama, panah menandai arah bawah; tidak menambah glow, font, ilustrasi, animasi berulang, atau efek dekoratif. Alasan dan arah tercatat di DESIGN.md.
- Liveliness PASS: arah dan dials yang disetujui tetap dipertahankan; perubahan perilaku tidak mengganti palet navy, hierarki isi, motif dokumen atau maskot ASN.
- Craftsmanship PASS: implementasi berada langsung di HTML/CSS/JS, hanya satu kontrol ditambahkan dengan perilaku teruji, tanpa dependency baru. Hasil dibatasi pada konfigurasi dan simulasi yang disebut di atas, bukan klaim audit WCAG lengkap atau uji AI produksi.

## Palet gelap sesuai masukan pengguna

- Skill awwwards yang dilampirkan dibaca; konsep, token, signature moment, dan batas penerapan dicatat sebelum pengubahan tema di DESIGN.md. Folder references pendamping tidak tersedia; tidak ada skor/prediksi penghargaan atau klaim metrik performa Awwwards.
- Area putih pada katalog, perpustakaan, filter, toolbar/index buku, fullscreen, dan asisten diganti permukaan navy bertingkat. `color-scheme: dark`, tautan/fokus terang, kontrol dan warning disesuaikan bersama. Turnstile memakai tema dark dan opsi itu diperiksa melalui bot-check.cjs. Halaman/sampul PDF tidak diinversi.
- Kontras terukur: #eef3fb/#0e1520 16.435949:1; #a8b5c8/#19283c 7.168669:1; #9ac2ff/#19283c 8.180071:1; batas kontrol #718096/#141e2b 4.183041:1 (syarat non-teks 3:1); warning #ffe0a0/#2c2316 12.082969:1. Hasil ini pasangan tertentu, bukan audit seluruh WCAG.
- Daftar aset statis awal (HTML/CSS/JS, katalog, logo, maskot dan sampul) berjumlah 243.584 byte mentah; ini penjumlahan file, bukan pengukuran waterfall browser, LCP, CLS, INP atau fps. PDF diakses terpisah saat pembaca dibuka. Tidak menambah dependency atau aset gambar baru.
- Pemeriksaan katalog, pembaca buku, asisten dan animasi tetap lulus. Tangkapan render baru ditinjau setelah deployment; keyboard/perangkat nyata dan CWV belum diukur.
- Hasil produksi 6999c38 ditinjau melalui Firecrawl: beranda desktop 1440×2700 dan katalog PAGU 2026 pada viewport 320×900/tangkapan penuh 320×3044. Panel perpustakaan, buku dan katalog tidak lagi membentuk bidang putih besar; filter, metadata, judul, tombol dan footer terlihat pada kedua konfigurasi. Gambar sampul asli tetap terang. Review tambahan memeriksa label/error, hover dan selected reader; tidak ditemukan pasangan teks gelap di permukaan gelap pada kode yang diperiksa.

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
