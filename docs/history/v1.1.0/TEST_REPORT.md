# Laporan pengujian v1.1.0

Tanggal: 23 September 2026. Node 22.16.0 di lingkungan penyusunan.

## Hasil yang benar-benar dijalankan

| Pemeriksaan | Hasil | Arti hasil |
|---|---|---|
| `npm test` | **45/45 lulus** | 20 tes fungsi domain, 10 tes environment, 15 pemeriksaan statis kontrak keamanan/source |
| Pemeriksaan TS/TSX | **56 berkas, 0 error sintaks/import lokal** | Transpile/parse melalui TypeScript 5.8.3 yang tersedia, bukan semantic typecheck dengan dependensi |
| `node scripts/check-env.mjs` tanpa kredensial | **Lulus mode demo** | Tidak menyatakan Auth/DB terhubung |
| Pemeriksaan layout HTML statis | **21/21 tanpa overflow horizontal** | 7 snapshot pada lebar 320, 390, 1440 piksel, Chromium |
| `npm install` | **Gagal** | `EAI_AGAIN` saat DNS registry.npmjs.org; dependensi tidak terunduh |
| `npm run build` | **Belum terverifikasi / gagal dijalankan** | Prebuild env lulus, lalu `next: not found` karena dependensi tidak tersedia |
| `npm run typecheck` | **Belum terverifikasi / gagal** | Definisi Next/React/Supabase/@types belum tersedia; ada error modul dan turunan JSX |
| SQL migration/RPC/RLS nyata | **Belum dijalankan** | Tidak ada proyek Supabase test berkredensial atau PostgreSQL di lingkungan penyusun |
| Auth/email/Storage/pemesanan nyata | **Belum dijalankan** | Memerlukan backend nyata; bukan mock yang dianggap produksi |
| Deployment Vercel/GitHub | **Tidak dilakukan** | Tidak ada perubahan pada akun eksternal Diky |

Log mentah tersedia di `docs/test-results/`. Tes unit/statis bisa dijalankan dengan Node 22 tanpa server Supabase, tetapi hasilnya tidak membuktikan policy SQL telah terpasang atau data benar-benar terisolasi pada proyek live.

## Batas review tampilan

Snapshot HTML dibentuk dari komponen TSX dan CSS menggunakan adapter inspeksi minimal untuk JSX/Link/hooks, kemudian dimuat di Chromium. Adapter bukan React 19/Next runtime, tidak dikirim sebagai kode aplikasi, dan tidak menguji hydration, pergantian state, routing Next, atau jaringan. Hasil visual menunjukkan layout statis; **bukan tes browser end-to-end aplikasi Next.js**.

Tiga gambar di `docs/previews/` membantu memeriksa tampilan desktop/mobile dan isi undangan. Jangan memakai gambar ini sebagai bukti checkout/RSVP/server sudah bekerja.

## Yang dicakup 45 tes

Tanggal/leap year, jam/zona waktu, escaped kalender ICS dengan lipatan UTF-8, pembatasan teks/foto, penolakan kolom asing termasuk prototype-like fields, URL https aman, redirect internal, status bukan paid/published, verifikasi harga seed, struktur RLS/grant/RPC, request retry/revision, penutupan API tamu lama, penolakan secret publik sebelum build, dan fallback demo tanpa backend.

15 pemeriksaan source SQL/API mengamati kontrak tertulis, bukan mengeksekusi SQL atau simulasi penyerang terhadap Supabase. Pemeriksaan gambar sebenarnya, rate-limit, private media, dan pembatasan akun wajib diuji secara integrasi.

## Gerbang berikutnya

Di mesin dengan koneksi npm: install → syntax → typecheck → build → browser Next yang sesungguhnya. Setelah itu pasang SQL di staging dan jalankan checklist 2 akun pada `UJI_MANUAL.md`. Perbaiki error yang muncul sebelum melanjutkan pembayaran/publikasi. Status v1.1.0: **fondasi terkoreksi dengan pengujian parsial yang dinyatakan terbuka**.
