# Tahap 2 — aktifkan Supabase, akun, dan penyimpanan draft

Versi aplikasi 1.2.0. SQL dan source disiapkan; **belum diterapkan ke akun Supabase/Vercel Diky oleh penyusun**. Target tahap ini bukan pembayaran: daftar, konfirmasi email, login, simpan draft, buka ulang, isolasi akun, dan foto privat harus teruji dulu.

## A. Siapkan folder dan pastikan aplikasi bisa dibangun

Ekstrak ke folder baru. Gunakan Node 22.x. Bila `.env.local` versi Next.js sebelumnya sudah benar, salin ke folder baru secara lokal. Jangan menyalin file `.env` dari aplikasi Express lama.

```powershell
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm install
npm test
npm run typecheck
npm run build
```

Hentikan bila install/typecheck/build gagal. Simpan log error tanpa isi environment. Package-lock belum tersedia dari penyusun karena koneksi npm tidak terjangkau; gunakan hasil resolusi pada mesin Diky dan commit setelah pengujian berhasil.

## B. Buat atau pilih proyek khusus Invitation

Gunakan proyek **khusus Kastriva Invitation**. Jangan memakai database proyek aplikasi lain hanya karena sudah tersedia. Bila proyek khusus Invitation sudah dibuat pada tahap 1, gunakan proyek yang sama agar draft/akun tidak berpindah database.

Ambil **Project URL** dan **publishable key** dari informasi koneksi proyek (misalnya panel Connect). Jangan menyalin database password, personal access token, `sb_secret_`, atau JWT dengan role `service_role` ke konfigurasi publik. Aplikasi ini tidak membutuhkan service-role key.

Referensi resmi: https://supabase.com/docs/guides/auth/server-side/creating-a-client dan https://supabase.com/docs/guides/getting-started/api-keys

## C. Jalankan SQL sesuai kondisi proyek

### Proyek belum pernah menjalankan SQL v1.1.0

Buka SQL Editor, salin seluruh isi file berikut dan jalankan **berurutan, bukan bersamaan**:

```text
supabase/migrations/001_foundation.sql
supabase/migrations/002_account_readiness.sql
```

### Proyek sudah berhasil menjalankan 001

Jalankan **hanya `002_account_readiness.sql`**. Jangan menghapus tabel atau membuat ulang akun. File 002 memiliki transaksi dan pemeriksaan prasyarat; bila gagal, baca error dan jangan menonaktifkan RLS sebagai jalan pintas. Jangan menjalankan ulang 001 setelah 002 karena dapat mengembalikan fungsi simpan ke versi lama. Re-run 002 dirancang idempotent, tetapi jalankan sesuai urutan versi, bukan bolak-balik.

Setelah selesai, periksa:

```sql
select public.ki_schema_version(); -- harus 2
select id, accept_order_requests from public.ki_settings; -- id=1, false
```

Tujuh tabel aplikasi: `ki_admins`, `ki_settings`, `ki_templates`, `ki_invitations`, `ki_orders`, `ki_order_events`, `ki_deleted_drafts`. Tabel terakhir hanya marker penghapusan: ID draft, ID pemilik, dan waktu, agar retry lama tidak menghidupkan isi yang sudah dihapus. Semua tabel menggunakan RLS. Bucket `ki-media` harus PRIVATE.

`ki_schema_version()` hanya marker versi, bukan audit otomatis. Halaman admin memeriksa metadata lebih rinci, dan uji dua akun tetap wajib. Jangan menambahkan policy `using (true)` pada draft/Storage untuk mengatasi error.

## D. Isi `.env.local`

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT-ANDA.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=ISI_PUBLISHABLE_KEY_PROYEK_INI
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_CONTACT_EMAIL=
ENABLE_ORDER_REQUESTS=false
```

Isi nilai langsung, bukan `${VARIABEL_LAIN}` pada variabel publik. Legacy anon JWT tetap didukung bila memang proyek menggunakan key lama. URL dan key harus berasal dari proyek yang sama. URL Supabase harus origin tanpa `/rest/v1`, query, atau fragment.

```powershell
npm run check:env
npm run check:supabase
```

Arti hasil:

| Hasil | Makna |
|---|---|
| `check:env` PASS | Format konfigurasi valid; belum ada bukti koneksi. |
| `check:supabase` PASS | Auth settings, versi SQL=2, dan katalog publik merespons. Siap mulai uji akun, bukan siap produksi. |
| SKIP / kode keluar 2 | Konfigurasi belum terisi. Bukan keberhasilan koneksi. |
| FAIL / kode keluar 1 | Ada kegagalan koneksi, key, schema, atau katalog. Periksa pesannya. |

Alternatif melalui web: `npm run dev` → `http://localhost:3000/setup` → **Periksa koneksi Supabase**. Tombol tidak membuat akun atau menulis data. Tes tidak menampilkan key. Koneksi dibatasi waktu; kegagalan tidak ditampilkan sebagai database kosong.

## E. Authentication dan email

Pada pengaturan Authentication proyek khusus ini:

- Aktifkan provider email dan pendaftaran akun, serta konfirmasi email.
- Nonaktifkan anonymous sign-ins untuk alur platform ini.
- Atur kebijakan password minimal 12 karakter agar sesuai form.
- Atur pengiriman email/SMTP dan pembatasan Auth sebelum membuka pendaftaran umum. Tombol berhasil bukan bukti email sudah masuk inbox.

Untuk pengujian lokal, Site URL:

```text
http://localhost:3000
```

Izinkan redirect berikut pada origin lokal:

```text
http://localhost:3000/auth/confirm**
http://localhost:3000/auth/callback**
```

Saat memakai domain HTTPS aplikasi, tambahkan dua jalur yang sama dengan origin domain tersebut. Jangan memakai wildcard seluruh domain. Untuk produksi gunakan origin produksi, untuk staging gunakan origin staging yang disiapkan. Pastikan `NEXT_PUBLIC_SITE_URL` sesuai origin tempat pengguna melakukan pendaftaran/pemulihan.

Di bagian Email Templates, ganti konten:

| Template Supabase | File |
|---|---|
| Confirm sign up | `supabase/email-templates/confirm-signup.html` |
| Reset password | `supabase/email-templates/reset-password.html` |

Kedua template memakai `{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}`. Link cocok dengan aplikasi yang mengirim query `type=email` atau `type=recovery`; jangan dipakai untuk flow undangan admin/invite lain tanpa menyesuaikan handler. Uji link kedaluwarsa, link dipakai ulang, dan reset dari browser berbeda. Default flow PKCE memerlukan verifier browser asal; flow token-hash yang disiapkan ini tidak bergantung pada verifier browser asal.

Jangan mengirim link email konfirmasi/reset ke chat karena mengandung token. Jangan meneruskan template yang sudah berisi token nyata. Cooldown 60 detik di form hanya membantu UX; rate-limit, CAPTCHA, dan kebijakan pengiriman harus ditegakkan oleh layanan Auth.

Referensi: https://supabase.com/docs/guides/auth/auth-email-templates , https://supabase.com/docs/guides/auth/redirect-urls , https://supabase.com/docs/reference/javascript/auth-resend

## F. Buat akun admin Diky

Daftar melalui aplikasi, konfirmasi email, kemudian login. Buka `/dashboard/akun` untuk melihat UID sendiri, atau cari User UID di Authentication → Users. Cocokkan email dengan akun Diky.

Di SQL Editor, ganti placeholder dengan User UID yang benar:

```sql
insert into public.ki_admins(user_id)
values ('GANTI-DENGAN-USER-UID-DIKY'::uuid)
on conflict(user_id) do nothing;
```

Placeholder sengaja bukan UUID valid agar tidak salah memberikan akses. Jangan memilih peran admin dari metadata signup; aplikasi hanya mengakui allowlist database. Setelah UID dimasukkan, buka `/admin/sistem` (boleh login ulang bila navigasi belum berubah).

Halaman ini memeriksa tujuh flag RLS, status bucket, batas tipe/ukuran, nama policy media, grant admin/draft, policy tambahan, dan flag permintaan. Policy tambahan merupakan peringatan untuk diperiksa, bukan langsung dihapus: bisa jadi milik layanan lain, tetapi bisa pula memperluas akses. Jangan pernah menghapus policy proyek lain hanya untuk membuat indikator hijau.

Referensi RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

## G. Uji akun dan draft

Uji akun A dan B yang berbeda, keduanya email terkonfirmasi, dengan browser/incognito berbeda. Pastikan simpan dan baca ulang berhasil, A tidak dapat membaca B, foto tidak dapat diambil tanpa hak akses, logout memblokir halaman privat, dan link reset benar. Lihat `UJI_SUPABASE_TAHAP2.md` untuk rincian dan skrip opsional.

Hapus draft memakai konfirmasi dan revision. Bila berubah di tab lain, muat ulang dahulu. Draft yang sudah terhubung permintaan tidak dihapus. Menghapus draft tidak menghapus foto dari bucket karena foto bisa dirujuk draft lain. Pembersihan Storage dan penghapusan akun tetap terpisah/manual.

## H. Aktifkan environment di Vercel setelah lokal berhasil

Set variabel yang sama di proyek Vercel untuk environment yang sesuai. Ubah `NEXT_PUBLIC_SITE_URL` menjadi URL HTTPS aplikasi Invitation, bukan situs portfolio dan bukan localhost. Build dengan backend pada Vercel akan menolak origin localhost/kosong untuk mencegah link email yang salah. Redeploy setelah perubahan environment; variabel publik ikut dibundel saat build.

Jangan menghapus backend lama atau data sebelumnya sebelum pengujian selesai. Jalankan `/setup`, `/admin/sistem`, dan uji akun kembali pada deployment tersebut. `ENABLE_ORDER_REQUESTS=false` tetap dipertahankan pada tahap ini.

## Gerbang selesai tahap 2

Selesai setelah install/typecheck/build berhasil, diagnostik dasar merespons, akun menerima email dan bisa login, draft tersimpan lintas sesi, dua akun terisolasi, foto privat, serta admin hanya akun yang ditetapkan. Hasil ini perlu diperoleh pada proyek nyata; ZIP saja tidak membuktikannya. Baru setelah itu lanjut ke tahap 3: editor yang lebih lengkap.
