> **Patch v1.7.2:** ikuti `TAHAP_7_PERBAIKAN.md` untuk instalasi dan diagnostik terbaru. Patch tidak menambah SQL setelah 007. Dokumen berikut menjelaskan tahap 7 dasar.

# Deployment v1.7.0

**Jangan deploy untuk pelanggan sebelum gerbang pada TAHAP_7_RILIS.md lulus.** ZIP dan source workflow bukan bukti deployment berhasil.

Gunakan Node 22.x, root folder yang berisi package.json, framework Next.js, build `npm run build` (bukan verify:release), serta output default Next.js. Commit lockfile asli setelah npm install/ci terverifikasi. Jangan set KI_E2E_DEMO pada hosting; gerbang demo memakai .next-test yang berbeda dari .next produksi.

Gunakan database Invitation staging untuk Preview, dengan origin aplikasi, template email, dan pengaturan Auth yang sesuai. Jangan memakai secret produksi pada job pull request atau mencoba pembayaran dengan uang pelanggan.

Secret server adalah SUPABASE_SECRET_KEY dan RATE_LIMIT_HMAC_KEY. Browser memakai NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. NEXT_PUBLIC_SITE_URL harus origin HTTPS deployment yang benar. Password database bukan public key.

Sebelum upgrade 007 pada layanan aktif, gunakan jendela pemeliharaan; kode 1.6 tidak kompatibel dengan grant baru. Baca BACKUP_ROLLBACK.md dan pertahankan bucket foto privat. Flag fitur tetap false sampai pengujian berhasil; aktivasi juga harus sesuai dengan flag database.

Periksa /setup dengan skema 7, /admin/sistem, dan /admin/rilis. Jalankan checklist dua akun dengan data fixture sebelum membuka layanan. Hasil verify:release yang lolos hanya menunjukkan gerbang demo; staging/produksi tetap perlu build dan uji dengan konfigurasi tujuannya.

Gateway publik bergantung pada identitas tepercaya Vercel; jangan menyetel VERCEL=1 secara manual di hosting lain. Origin yang digunakan browser harus sama dengan origin resmi. Reverse proxy atau alias domain harus diuji, bukan diterima otomatis. Periksa paket dan biaya hosting yang mengizinkan penggunaan bisnis saat peluncuran.
