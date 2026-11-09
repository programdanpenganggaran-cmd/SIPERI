# Backend Asisten SiPERI

Endpoint: https://siperi-assistant-api.siperi-cloudflare.workers.dev

GitHub Pages tetap melayani website. Hanya pilihan **Tanya AI** mengirim satu pertanyaan ke Cloudflare. Tidak mengirim riwayat percakapan atau menyimpannya dalam aplikasi server. Penggunaan infrastruktur tetap tunduk pada kebijakan Cloudflare. Pencarian katalog lokal tidak menggunakan AI.

## Isi dan batas

- Model `@cf/google/gemma-4-26b-a4b-it`, reasoning dinonaktifkan, jawaban maksimum 512 token.
- Indeks 304 potongan: isi Buku Saku Revisi Anggaran 2026 yang telah disetujui untuk publikasi dan metadata katalog publik. Tidak mengambil file tujuan Drive, data privat, atau indeks Netlify Blobs.
- Retrieval memilih maksimal empat kutipan. Tautan sumber disusun server; nomor rujukan jawaban harus sesuai. Pemeriksaan ini tidak menjamin kebenaran semantik jawaban. Buku panduan bukan pengganti pemeriksaan regulasi resmi.
- Cloudflare Turnstile wajib dan diverifikasi di server, termasuk hostname dan action. Widget khusus hostname GitHub SiPERI; pengujian localhost tidak memakai sitekey produksi.
- Pembatas per IP: 5 permintaan/menit; keseluruhan: 20 permintaan/menit per lokasi Cloudflare. Rate Limiting API bersifat perkiraan per lokasi, bukan batas global ketat.
- Durable Object SQLite melakukan reservasi atomik: maksimum **50 percobaan inferensi global/hari**, termasuk inferensi gagal. Reset 00.00 UTC atau 07.00 WIB. Tidak menyimpan IP atau pertanyaan di objek; hanya hari dan hitungan. Ini batas awal uji coba untuk menjaga pemakaian gratis, bukan kapasitas final seluruh Kantah.
- Batas server: pertanyaan 1.500 karakter, body 12.000 byte, prompt 14.000 byte; nomor 16 digit ditolak. Pemeriksaan pola tidak mendeteksi seluruh data pribadi: pengguna tetap diminta tidak memasukkan data pribadi/rahasia.
- Paket berbayar tidak diaktifkan. Jatah Workers AI akun juga dapat dipakai aplikasi lain sehingga AI bisa berhenti sebelum 50 jawaban. Tidak otomatis beralih penyedia berbayar.

## Operasional

Dari folder ini:

```powershell
npx.cmd --yes wrangler@4.158.0 login
npx.cmd --yes wrangler@4.158.0 whoami
node build-knowledge.mjs
node check.mjs
npx.cmd --yes wrangler@4.158.0 deploy --dry-run --outdir .wrangler/build
npx.cmd --yes wrangler@4.158.0 deploy
```

`build-knowledge.mjs` membaca sumber portal saudara pada workspace atau berkas di root repository publik. Jalankan ulang dan deploy Worker setiap buku/katalog berubah. Deployment GitHub Pages tidak otomatis menerbitkan Worker. Workflow GitHub menguji kode backend dengan mock tanpa memakai kuota model.

Secret `TURNSTILE_SECRET_KEY` sudah disimpan langsung ke Cloudflare. Untuk menggantinya gunakan `wrangler secret put TURNSTILE_SECRET_KEY` melalui terminal pribadi, jangan melalui chat atau repository. `bot-config.js` frontend hanya memuat URL dan sitekey publik. Konfigurasi hostname widget harus sesuai ALLOWED_ORIGIN. CORS bukan autentikasi.

Saat perlu menghentikan sementara AI, kosongkan apiUrl pada bot-config.js dan deploy website; pencarian lokal tetap tersedia. Untuk menghapus backend gunakan pengelolaan Worker di dashboard setelah meninjau dampaknya. Jangan menghapus Durable Object untuk mereset kuota harian.

## Pemeriksaan 9 November 2026

GET `/health`: 200, configured=true. Preflight: 204. Tanpa token/palsu/origin lain: 403. Dua inferensi nyata model dan konteks buku berhasil. Unit test backend/frontend lulus. Browser otomatis visual tidak tersedia; penyelesaian Turnstile oleh manusia serta zoom/keyboard nyata belum diverifikasi. Koneksi Windows Node/PowerShell gagal TLS, HTTPS curl WSL berhasil; tidak mematikan verifikasi sertifikat.

Sumber: [Workers AI bindings](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/), [Gemma 4](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/), [harga Workers AI](https://developers.cloudflare.com/workers-ai/platform/pricing/), [Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing/), [rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
