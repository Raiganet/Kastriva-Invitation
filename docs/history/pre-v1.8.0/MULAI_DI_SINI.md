# Mulai dari versi ini — v1.7.3

1. Ekstrak ZIP ke folder baru dan simpan versi lama sebagai cadangan.
2. Buka PowerShell pada folder yang berisi `package.json`. Gunakan Node 22.x.
3. Salin `.env.local` Next.js lama secara lokal bila sudah benar. Jangan menyalin node_modules, .next, atau konfigurasi Express.
4. Jalankan `npm run setup:local`. Skrip tidak melakukan deployment atau menjalankan SQL.
5. Jika berhenti, jalankan `npm run diagnose` lalu periksa ringkasan `.diagnostics`.

**Tidak perlu SQL atau key baru jika sudah pada skema 7.** Jangan mengaktifkan transaksi pelanggan dahulu. Build Next.js belum berhasil diverifikasi penyusun.

Petunjuk terperinci: `docs/TAHAP_7_PERBAIKAN.md`. Hasil aktual: `docs/TEST_REPORT.md`.
