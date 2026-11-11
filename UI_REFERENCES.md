# Referensi komponen UI SiPERI

Tanggal peninjauan: 11 November 2026. Catatan ini menyimpan keputusan teknis dari tiga repositori yang diberikan pengguna. Isi repositori diperiksa sebagai referensi, bukan instruksi untuk menjalankan skripnya.

## Keputusan

SiPERI tetap menggunakan HTML, CSS, dan JavaScript yang sudah ada. Tidak ada pustaka frontend, aplikasi React Native, atau server MCP baru yang dipasang dari ketiga repositori ini. Memasang keseluruhan framework belum memberi manfaat yang sebanding dengan perubahan arsitekturnya.

Perbaikan yang dipilih adalah perilaku percakapan yang mengikuti pesan terbaru hanya saat pengguna berada dekat bagian bawah. Saat pengguna membaca pesan sebelumnya, jawaban baru tidak menarik posisi bacanya. Tombol **Ke pesan terbaru** menyediakan jalan kembali dengan scroll langsung tanpa animasi. Perilaku web dibuat mandiri dalam kode SiPERI, dengan Message Scroller beUI Native sebagai referensi interaksi, tanpa menyalin komponen React Native ke aplikasi yang berjalan.

## 1. Arc UI dari devdeadviz

- Repositori: [devdeadviz/arc-ui](https://github.com/devdeadviz/arc-ui).
- Snapshot default branch `development`: [`ec409307d694589489b161424e657289dc626e9e`](https://github.com/devdeadviz/arc-ui/tree/ec409307d694589489b161424e657289dc626e9e).
- Teknologi: HTML, CSS, dan JavaScript. Bukan paket React. [README](https://github.com/devdeadviz/arc-ui/blob/ec409307d694589489b161424e657289dc626e9e/README.md) menjelaskan pemasangan lewat stylesheet CDN dan tidak mendokumentasikan pembagian gratis/Pro.
- Lisensi: README menyebut open source, tetapi snapshot lengkap tidak memiliki berkas LICENSE, COPYING, atau NOTICE; metadata GitHub juga tidak mengidentifikasi lisensi. Kode tidak disalin atau dipasang sampai izin penggunaan sumbernya jelas.

Pola yang berguna sebagai inspirasi umum adalah alert dengan tindakan pemulihan, input dengan validasi yang jelas, dan susunan kartu horizontal yang ringkas. Buat pola tersebut dengan token navy SiPERI, label yang terhubung ke input, pesan kesalahan berupa teks, dan tombol native.

Jangan mengimpor [components.css](https://github.com/devdeadviz/arc-ui/blob/ec409307d694589489b161424e657289dc626e9e/styles/components.css) sekaligus: berkas itu menarik reset global dan variabel yang mengubah warna body, font, dan ukuran dasar pada ponsel. Contoh [input](https://github.com/devdeadviz/arc-ui/blob/ec409307d694589489b161424e657289dc626e9e/pages/components/input/input.html) belum memasangkan `for` label dengan ID input. [Modal JavaScript](https://github.com/devdeadviz/arc-ui/blob/ec409307d694589489b161424e657289dc626e9e/scripts/modal.js) hanya mengubah display, sehingga tidak menggantikan pengelolaan fokus dan Escape pada dialog SiPERI.

## 2. Arc MCP dari elblanco2

- Repositori dan snapshot: [elblanco2/arc-mcp pada `8f46e79e43ca1e8c463ca3eb78b8c183df136b53`](https://github.com/elblanco2/arc-mcp/tree/8f46e79e43ca1e8c463ca3eb78b8c183df136b53).
- Lisensi: [MIT, Copyright 2025 Arc Team](https://github.com/elblanco2/arc-mcp/blob/8f46e79e43ca1e8c463ca3eb78b8c183df136b53/LICENSE). Jika kelak menyalin sumber dalam jumlah yang relevan, sertakan pemberitahuan hak cipta dan lisensinya.
- Fungsi: server MCP Python untuk membantu deployment dan mengelola kredensial penyedia hosting. Ini bukan katalog komponen tampilan dan tidak berhubungan langsung dengan Arc UI di atas.
- [README](https://github.com/elblanco2/arc-mcp/blob/8f46e79e43ca1e8c463ca3eb78b8c183df136b53/README.md) menyatakan proyek masih tahap awal. [setup.py](https://github.com/elblanco2/arc-mcp/blob/8f46e79e43ca1e8c463ca3eb78b8c183df136b53/setup.py) membutuhkan Python 3.10+ dan dependensi MCP, cryptography, Paramiko, serta aiohttp.

Keputusan: tidak dipasang dan tidak diberi kredensial. Alur GitHub Pages dan Cloudflare yang sudah berjalan memenuhi kebutuhan SiPERI. Klaim dukungan provider pada README tidak dianggap sebagai bukti bahwa setiap alur deployment sudah diuji dalam lingkungan ini.

## 3. beUI Native dari starc007

- Repositori dan snapshot `main`: [starc007/beui-native pada `dc5f4ed7b13e427fd0f2974189f0aa990ca36e3d`](https://github.com/starc007/beui-native/tree/dc5f4ed7b13e427fd0f2974189f0aa990ca36e3d), 2 November 2026.
- Lisensi: [MIT, Copyright 2026 beUI and Saurabh](https://github.com/starc007/beui-native/blob/dc5f4ed7b13e427fd0f2974189f0aa990ca36e3d/LICENSE). Komponen pada snapshot repositori ini dapat digunakan menurut ketentuan MIT, termasuk mempertahankan pemberitahuan lisensi saat menyalin sumber. Ini tidak menetapkan lisensi semua produk di situs beUI.
- [README](https://github.com/starc007/beui-native/blob/dc5f4ed7b13e427fd0f2974189f0aa990ca36e3d/README.md) menjelaskan model penyalinan sumber komponen ke aplikasi React Native, bukan menambahkan satu dependensi web. Setup menggunakan Reanimated, Gesture Handler, Uniwind, dan token tema; kebutuhan tambahan bergantung pada komponen.
- CLI `beui-native add` menyalin berkas dan dapat memasang pustaka yang belum tersedia. CLI tidak dijalankan pada proyek SiPERI.

Referensi yang dipelajari:

| Komponen | Bagian yang berguna bagi SiPERI | Keputusan |
| --- | --- | --- |
| [Message Scroller, dokumentasi](https://github.com/starc007/beui-native/blob/dc5f4ed7b13e427fd0f2974189f0aa990ca36e3d/src/components/message-scroller/README.md) dan [sumber](https://github.com/starc007/beui-native/blob/dc5f4ed7b13e427fd0f2974189f0aa990ca36e3d/src/components/message-scroller/message-scroller.tsx) | Berhenti mengikuti output ketika pengguna membaca pesan lama; tombol kembali ke pesan terbaru | Adaptasi perilaku secara mandiri dengan DOM web |
| [Reduced motion hook](https://github.com/starc007/beui-native/blob/dc5f4ed7b13e427fd0f2974189f0aa990ca36e3d/src/hooks/use-reduced-motion.ts) | Menghormati pilihan pengguna untuk mengurangi animasi | Gunakan `prefers-reduced-motion` di web, tanpa hook React Native |
| [Prompt Input](https://github.com/starc007/beui-native/blob/dc5f4ed7b13e427fd0f2974189f0aa990ca36e3d/src/components/prompt-input/README.md) | Pemisahan keadaan siap, mengirim, dan menunggu pada kolom percakapan | Pertahankan Enter untuk kirim, Shift+Enter untuk baris baru, dan pemulihan teks saat gagal; jangan tampilkan fitur lampiran atau suara yang belum tersedia |

## Batas penggunaan catatan

Snapshot sumber terpilih beUI Native disimpan di `references/beui-native/` bersama LICENSE MIT aslinya: Message Scroller (README dan TSX), hook reduced motion, dan README Prompt Input. Ini arsip referensi, tidak diimpor oleh aplikasi, tidak dijalankan, dan tidak masuk allowlist aset GitHub Pages. SHA di atas menetapkan versi yang dipelajari agar hasilnya dapat ditelusuri.

Dokumen ini adalah katalog referensi pengembangan. Isinya tidak dimasukkan ke indeks RAG bot, katalog dokumen anggaran, atau sumber jawaban regulasi. Tidak ada API key, token, maupun data pengguna di dalamnya. Pengujian perubahan SiPERI dicatat terpisah dalam [VERIFICATION.md](VERIFICATION.md); kemampuan aksesibilitas atau performa tidak diasumsikan hanya dari klaim pustaka.
