# Alternatif backend asisten

Status 9 November 2026: backend Workers AI sudah dibuat di `cloudflare/` pada repository publik (sumber kerja lokal `siperi-cloudflare/`). Model Gemma 4, Turnstile, rate limit 5/IP/menit dan 20/lokasi/menit, serta Durable Object dengan batas global 50 percobaan inferensi/hari. Reset 00.00 UTC/07.00 WIB. Batas global bukan jaminan jumlah jawaban; kegagalan inferensi tetap memakai reservasi. Pencarian katalog lokal tetap default, tanpa kuota AI. Secret verifikasi disimpan di Cloudflare; bot-config.js hanya memuat URL dan sitekey publik. Tidak mengubah paket menjadi berbayar. Riwayat keputusan awal di bawah dipertahankan.

Pengguna memilih tampilan bot dahulu dan meminta alternatif karena kredit Netlify hampir habis. Bot saat ini menggunakan pencarian katalog di browser; API AI kosong dan tidak ada request ke Netlify dari bot baru. SiPERI tetap di GitHub Pages. Perubahan error Gemini/indikator status pada faq-repair masih lokal, belum dipush.

Rekomendasi: Cloudflare Workers sebagai endpoint server, dengan API key di secret server dan batas permintaan. Indeks privat yang saat ini bergantung pada Netlify Blobs perlu rencana migrasi tersendiri; jangan menganggap handler dapat disalin tanpa perubahan. Pencarian/FAQ terkurasi tetap menjadi jalur pertama, AI hanya ketika diperlukan. Kuota model tidak ikut pindah bersama hosting.

Alternatif: Apps Script bila pengelolaan Drive/Sheets menjadi prioritas. Kuota URL Fetch tercatat 20.000/hari untuk akun konsumen dan 100.000/hari untuk Workspace; kuota per pengguna dan dapat berubah, bukan jaminan jumlah jawaban chat. Integrasi browser perlu jalur web app/iframe yang sesuai dan tidak mengasumsikan kebebasan header CORS.

Pencarian lokal tidak menggunakan model AI atau kredit server Netlify; ini pencarian metadata katalog, bukan jawaban generatif dan bukan pencarian isi seluruh PDF.

Sumber diperiksa 9 November 2026:
- https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.google.com/apps-script/guides/services/quotas
- https://blog.google/innovation-and-ai/technology/developers-tools/more-control-over-gemini-api-costs/
