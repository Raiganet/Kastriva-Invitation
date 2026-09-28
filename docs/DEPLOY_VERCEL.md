# Deployment — v1.8.0

Panduan utama: **UPGRADE_v1.8.0.md**. Target Node 22.x, framework Next.js, folder root yang berisi package.json. Instalasi `npm ci` dari lockfile; build `npm run build`; output bawaan Next.js. Jangan menjalankan `server.js` legacy.

Jangan menyetel **KI_E2E_DEMO** pada Vercel. `verify:release` membangun fixture `.next-test` untuk pengujian lokal, bukan output website pelanggan. Tidak ada versi dependensi/key/flag layanan baru pada patch ini.

Gunakan origin NEXT_PUBLIC_SITE_URL sesuai deployment. Secret Supabase dan HMAC tetap hanya server; lingkungan Preview sebaiknya memakai staging terpisah. Jangan membagikan secret dalam log/artifact atau mengaktifkan layanan pelanggan hanya karena satu indikator hijau.

Sebelum migrasi tema baru 009–011, kode yang memahami 15 tema perlu tersedia; ikuti jendela upgrade di panduan. Jika 011 sudah ada, cukup 012. Periksa `/setup`, `/admin/rilis`, lalu alur dua akun, CMS, pembayaran/publikasi/RSVP. Indikator aplikasi tidak menggantikan hasil build dan pengujian live.
