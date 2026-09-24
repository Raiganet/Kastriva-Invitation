> **Pembaruan v1.2.0:** pasang SQL 002 setelah 001. Ikuti `TAHAP_2_SUPABASE.md`. Saat backend diisi pada Vercel, `NEXT_PUBLIC_SITE_URL` wajib origin HTTPS aplikasi yang tepat. Jangan gunakan localhost atau domain portfolio. Panduan di bawah adalah dasar deployment yang tetap berlaku.

# Deploy staging ke GitHub–Vercel

Penyusun belum push repository atau membuat deployment. ZIP adalah source untuk Diky uji. Jangan timpa deployment Express yang masih dipakai sebelum build dan uji data berhasil.

## Lokal dahulu

Gunakan folder baru yang berisi `app/`, `package.json`, dan `next.config.ts`. Jangan mencampurkan `server.js`, routes Express, `.env`, node_modules, lockfile, atau `setup.js` lama. Node target 22.x.

Jalankan `npm install`, lalu `npm run check`. Perintah ini memeriksa environment, 93 tes fungsi/mock/statis, syntax/import lokal, typecheck, dan build. Error `next: not found` berarti dependensi belum terpasang; error `EAI_AGAIN` berarti kegagalan resolusi jaringan registry pada mesin yang melakukan install. Jangan menghapus validasi agar log tampak berhasil. Simpan log dan perbaiki penyebabnya.

Lockfile harus dihasilkan di mesin yang berhasil install, kemudian disertakan dalam commit. Sesudahnya gunakan `npm ci`. Workflow GitHub `verify.yml` juga disertakan, tetapi belum dieksekusi di akun Diky. Workflow bukan pengganti uji Supabase karena tanpa akun uji ia hanya membangun mode demo.

## Repository

Gunakan repository baru atau branch kerja terlebih dahulu. Pastikan `git status` tidak memasukkan `.env.local`, password, key privat, DB lama, node_modules, atau folder hasil build. `.gitignore` disediakan. Jangan force-push/menimpa riwayat untuk mengatasi konflik.

## Vercel

Import repository, gunakan preset **Next.js**, root directory folder yang mempunyai package.json, Node 22.x. Build command `npm run build`; jangan menggunakan start command `node server.js` atau output directory `public` dari panduan Express lama. Biarkan output Next.js ditangani preset.

Deployment demo boleh tanpa Supabase. Untuk mengaktifkan Auth/draft pada staging, masukkan environment sesuai `.env.example`, dengan `NEXT_PUBLIC_SITE_URL` origin HTTPS deployment yang benar dan redirect Auth yang sesuai. Jangan memasukkan service_role key. `ENABLE_ORDER_REQUESTS=false` dahulu.

Setelah perubahan environment, redeploy. Periksa log build, buka katalog dan 8 demo, lalu lakukan `UJI_MANUAL.md` setelah backend dikonfigurasi. Tabel dan bucket tidak dibuat oleh build; SQL harus dijalankan terpisah oleh pemilik Supabase.

## Jangan menerima pembayaran dulu

Paket ini belum mempunyai pembayaran/penerbitan/masa aktif/RSVP nyata. Header noindex dan robots disallow dipasang sengaja untuk staging. Perlindungan deployment atau Auth dibutuhkan untuk membatasi akses; robots bukan kontrol keamanan. Cocokkan paket hosting dan layanan email/database dengan ketentuan penggunaan serta kebutuhan komersial saat peluncuran.

Sumber implementasi: https://vercel.com/docs/frameworks/full-stack/nextjs dan https://supabase.com/docs/guides/auth/server-side/creating-a-client
