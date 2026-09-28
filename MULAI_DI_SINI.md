# Mulai di sini — Kastriva Invitation v1.8.0

Simpan proyek lama sebagai cadangan. Ekstrak ke folder baru. Gunakan Node 22.x dan folder yang berisi `package.json`. Jangan membagikan `.env.local`/key/password.

```powershell
npm ci
npm test
npm run check:release-contract
npm run typecheck
npm run build
```

Jangan lanjutkan jika perintah gagal. Lockfile sudah tersedia; tidak perlu membuat ulang atau mengganti semua paket menjadi `latest`.

**Database tidak otomatis dimigrasikan saat build.** Jika 001–011 sudah terpasang, cukup jalankan `supabase/migrations/012_feature_readiness.sql`. Skema dasar tetap 7. Jika baru 007 atau tidak tahu posisinya, baca **`docs/UPGRADE_v1.8.0.md`** sebelum menjalankan SQL. Jangan menghapus tabel.

Sesudah migrasi dan konfigurasi benar:

```powershell
npm run check:supabase
npm run dev
```

Buka `/setup`, lalu `/admin/rilis` dengan akun admin. Koneksi akun dan kemampuan fitur harus diperiksa terpisah. Hasilnya belum membuktikan semua alur produksi lulus.

Tidak ada key/flag baru atau perubahan harga/desain tema pada patch ini. Ucapan umum dan kuota media masih pekerjaan berikutnya. Laporan pengujian aktual: `docs/TEST_REPORT.md`.
