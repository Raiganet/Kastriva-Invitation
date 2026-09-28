> **Catatan pemasangan terdahulu dari source pengguna.** Ini bukan laporan pengujian v1.8.0 dan bukan pernyataan keadaan database saat ini. Untuk upgrade gunakan `UPGRADE_v1.8.0.md`; jangan memakai jumlah tema/migrasi di catatan lama untuk mereset proyek.

# Koneksi Supabase lokal

Proyek: **Kastriva-Invitation**, ref `gtuwpqnhezbexrcsjeaj`.
URL: `https://gtuwpqnhezbexrcsjeaj.supabase.co`.

## Konfigurasi yang dipasang

- `.env.local` berisi URL dan publishable key proyek serta `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. File ini diabaikan Git. Jangan menyalin key ke dokumentasi atau commit.
- `.env` lama milik aplikasi Express tetap dipertahankan. Aplikasi Next.js dijalankan lewat `npm run dev`, bukan `node server.js`.
- Migrasi `001` sampai `007` diterapkan berurutan dalam satu transaksi pada database yang sebelumnya kosong. Jangan menjalankan ulang migrasi awal setelah skema 7.
- Database melaporkan skema 7, delapan tema aktif, dan 20 tabel aplikasi dengan RLS aktif.
- Bucket `ki-media` privat, dengan batas objek 5 MB. RPC undangan publik tidak dapat dieksekusi langsung oleh role anonim.
- Supabase Auth Site URL: `http://localhost:3000`; redirect yang diizinkan: `http://localhost:3000/auth/confirm?**`.
- Template email Supabase masih template bawaan. Dashboard memerlukan SMTP khusus atau paket berbayar untuk mengubah template. Endpoint aplikasi mendukung pertukaran kode PKCE; uji konfirmasi email pada browser yang sama dengan pendaftaran.
- Fitur checkout, publikasi, RSVP, dan permintaan pesanan tetap memakai nilai awal nonaktif. Secret server tidak diperlukan untuk koneksi akun dan draft ini, dan belum dipasang.

## Menjalankan

Gunakan Node.js 22.x sesuai `package.json`.

```powershell
cd C:\kastriva\Kastriva-Invitation
npm ci
npm run check:env
npm run check:supabase
npm run dev
```

Buka `http://localhost:3000/setup` untuk pemeriksaan koneksi dan `/daftar` untuk uji akun. Pengiriman email, login pengguna nyata, isolasi dua akun, dan upload foto belum diverifikasi. Tidak ada akun admin yang dibuat atau diberi akses dalam pemasangan ini.

Untuk deployment, sesuaikan origin aplikasi dan allowlist redirect Supabase ke domain sebenarnya, kemudian lakukan uji akun sebelum mengaktifkan fitur publik.

## Hasil verifikasi pemasangan

- `check:env`, `check:supabase`, `check:lock`, `typecheck`, `check:security`, dan `build`: lulus.
- 652 tes lulus sebelum perbaikan tipe helper environment. Setelah perbaikan, seluruh 21 tes environment dijalankan ulang dan lulus.
- Lockfile lama milik Express diganti oleh hasil `npm install` sesuai manifest Next.js, tanpa mengubah versi paket dalam manifest.
- Helper tes environment menggunakan `NodeJS.ProcessEnv` dan nilai awal `NODE_ENV` agar sesuai tipe yang ditambahkan Next.js.
- Build dan pemeriksaan sesi ini menggunakan Node 24.18.0 yang terpasang di komputer. Persyaratan proyek tetap Node 22.x; hasil ini belum membuktikan pengujian pada Node 22.
- Aplikasi produksi lokal dapat dijalankan dengan `npm run start` setelah build. Port yang dipakai: 3000.
