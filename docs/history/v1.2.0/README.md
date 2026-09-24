# Kastriva Invitation — Tahap 2 / v1.2.0

Kelanjutan **Kastriva-Invitation-Perbaikan-v1.1.0.zip**, bukan kembali ke Express/SQLite. Source code lengkap, Next.js + Supabase. Delapan tema dan harga referensi lama dipertahankan; editor tetap khusus lima tema pernikahan.

**Fokus tahap ini: aktivasi akun, koneksi database, dan pemeriksaan akses.** Pembayaran, penerbitan link tamu, RSVP sungguhan, dan CMS penuh belum dibuat. File ini tidak otomatis mengubah GitHub, Vercel, atau Supabase Anda.

## Mulai di Windows / PowerShell

Ekstrak ZIP ke folder baru yang berisi `package.json`. Jangan gabungkan `node_modules`, `.env` atau lockfile dari aplikasi Express lama. Bila sudah memakai versi Next.js v1.1.0, salin **hanya konfigurasi `.env.local` yang benar** dari folder tersebut ke folder baru; jangan membagikannya.

```powershell
node -v
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Gunakan **Node 22.x**. Buka `http://localhost:3000/setup`. Tanpa konfigurasi Supabase, mode demo tetap tersedia dan form akun dinonaktifkan. `npm test` tidak memerlukan dependensi Next.js atau database; typecheck/build memerlukan paket terpasang.

Instalasi dependensi/build lengkap belum terverifikasi di lingkungan penyusun: registry npm tidak terjangkau. Versi dependensi tetap seperti v1.1.0; tidak ada upgrade paket sembarangan. Belum ada `package-lock.json` hasil resolusi yang dapat dipercaya. Setelah `npm install` dan semua pemeriksaan berhasil, commit lockfile baru lalu gunakan `npm ci`. Bila `npm install` melaporkan ETARGET, hentikan dan kirim pesan error (bukan kredensial), jangan mengganti semua paket menjadi latest.

## Hubungkan Supabase — panduan utama

Baca **`docs/TAHAP_2_SUPABASE.md`**. Pada proyek khusus Invitation:

1. Proyek baru: jalankan `supabase/migrations/001_foundation.sql`, lalu `002_account_readiness.sql`.
2. Sudah menjalankan 001 pada v1.1.0: jalankan **002 saja**. Jangan membuat ulang database atau menjalankan generator Express.
3. Isi environment, URL Auth, dan dua template email; restart/redeploy.
4. Jalankan `npm run check:supabase`, lalu uji daftar → konfirmasi → login → simpan/buka ulang draft.
5. Berikan akses admin melalui User UID dan periksa `/admin/sistem`. Uji isolasi dua akun sebelum menerima data pelanggan.

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT-ANDA.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=ISI_KEY_PUBLIK_YANG_BENAR
ENABLE_ORDER_REQUESTS=false
```

Jangan memakai `sb_secret_`, `service_role`, database password, atau personal access token pada `NEXT_PUBLIC_*`. Pada Vercel dengan backend terisi, `NEXT_PUBLIC_SITE_URL` wajib URL HTTPS aplikasi, bukan localhost. Nilai di atas hanyalah contoh, bukan kredensial aktif.

## Perubahan tahap 2

| Modul | Implementasi |
|---|---|
| `/setup` | Tombol diagnostik nyata baca-saja: Auth settings, versi SQL, dan katalog publik. Tidak menganggap format env valid sebagai bukti koneksi. |
| `check:supabase` | Pemeriksaan yang sama lewat terminal; bisa dijalankan tanpa npm install lengkap. Tidak menampilkan key/token. |
| Akun | Konfirmasi password, tampil/sembunyikan password, kirim ulang konfirmasi email, halaman informasi akun. Cooldown UI bukan pengganti rate-limit Supabase. |
| `/admin/sistem` | Metadata RLS tujuh tabel, bucket privat, batas MIME/ukuran, grant admin/draft, dan peringatan policy tambahan. Guard admin di halaman dan SQL. |
| Database | Simpan draft/unggah foto membutuhkan akun dengan email terkonfirmasi. Simpan juga memastikan referensi foto ada di Storage. |
| Hapus draft | Konfirmasi eksplisit, pemilik saja, revision dicek, draft terkait permintaan tidak bisa dihapus. Media tidak ikut dihapus. |
| Retry penghapusan | Marker ID mencegah request create lama membangkitkan draft yang dihapus. Marker tidak menyimpan isi undangan. |
| Tes opsional | Skrip uji dua akun STAGING dengan persetujuan eksplisit; membuat hanya fixture sendiri, tidak menyentuh pesanan/pembayaran. |

Foto tetap privat, maksimal enam referensi per draft. Kuota total upload, verifikasi biner server, cleanup media, retensi, dan hapus akun belum otomatis. Signed URL tetap dapat dibuka orang yang memiliki tautannya selama belum kedaluwarsa. Penggantian tema tetap menggunakan data yang sama. Simpan masih **manual**, bukan autosave.

## Perintah & halaman baru

```text
npm test                     Unit + mock HTTP + pemeriksaan statis source
npm run check:env             Pemeriksaan format/secret, tanpa koneksi
npm run check:supabase        Diagnostik read-only ke proyek terkonfigurasi
npm run check:syntax          Pemeriksaan sintaks/import lokal setelah TypeScript terpasang
npm run typecheck             Typecheck seluruh aplikasi setelah dependensi terpasang
npm run build                 Build Next.js setelah dependensi terpasang
npm run test:supabase         SKIP tanpa --write dan opt-in; lihat panduan pengujian

/setup                       Aktivasi backend + cek koneksi
/kirim-konfirmasi            Kirim ulang email konfirmasi signup
/dashboard/akun              Email, status konfirmasi, UID, dan peran akun sendiri
/admin/sistem                Diagnostik konfigurasi khusus admin
```

`/api/health` tetap liveness/konfigurasi saja, tidak memanggil Supabase dan tidak mengklaim backendConnectionVerified=true.

## Status pengujian

Lihat **`docs/TEST_REPORT.md`** untuk hasil yang benar-benar dijalankan dan batasnya. Pengujian unit/mock/statis tidak membuktikan SQL terpasang, email diterima, RLS efektif, atau Storage terhubung di akun Anda. Jangan aktifkan penjualan sebelum pengujian staging berhasil.

Dokumen lain: `docs/UJI_SUPABASE_TAHAP2.md`, `docs/UPGRADE_TAHAP_2.md`, `docs/DEPLOY_VERCEL.md`, `docs/ROADMAP.md`. Laporan versi sebelumnya disimpan terpisah di `docs/history/v1.1.0` dan log/screenshot lama tetap berlabel historis.
