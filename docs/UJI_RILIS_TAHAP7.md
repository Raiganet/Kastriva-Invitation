# Pengujian rilis — pisahkan empat jenis bukti

Tidak ada tes browser/SQL di dokumen ini yang dianggap telah lulus hanya karena skrip tersedia. Jangan memakai akun pelanggan atau uang nyata untuk fixture.

## 1. Gerbang kode dan browser demo

Setelah Node22, npm install dan Chromium Playwright terpasang, jalankan `npm run verify:release`. Hasil harus benar-benar `passed=true` dan semua sembilan langkah ada pada `.release/report.json`. `liveSupabaseVerified` serta `productionApproved` tetap false: memang bukan cakupannya.

Browser Playwright menggunakan Next hasil build `.next-test`, bukan gambar/HTML snapshot. Tes mencakup beranda/katalog/harga/panduan/setup/login, navigasi ponsel, delapan demo, simulasi RSVP lokal dan escaping, penutupan admin tanpa backend, Origin, API lama, dan health. Versi ponsel/desktop memakai Chromium. Tidak diuji Firefox/Safari/WhatsApp nyata, login Supabase, pesanan, atau admin CMS live pada suite otomatis ini.

Jalankan `npm audit --audit-level=high`; baca hasil advisori beserta versi yang dipakai. Kegagalan koneksi audit bukan berarti tidak ada kerentanan. Workflow CI menjalankan audit terpisah sebelum gerbang. Review lockfile yang dihasilkan nyata dan commit sebelum penggunaan produksi. Jangan menyertakan `.release`, test-results, `.env.local`, key, atau trace berisi data sungguhan ke repository publik.

## 2. PostgreSQL lokal opsional dan terisolasi

Ini memakai **PostgreSQL sebenarnya dengan stub minimal auth/storage**, bukan layanan Supabase lengkap. Tidak menguji HTTP PostgREST, login/email atau upload berkas. Tidak membaca `.env.local` atau menerima URL Supabase.

Hanya pada laptop/runner uji yang tersedia Docker dan `psql`:

```powershell
docker compose -f compose.sql-test.yml up -d --wait
$env:KI_SQL_TEST_ALLOW_CREATE = 'yes'
npm run test:sql:local
Remove-Item Env:KI_SQL_TEST_ALLOW_CREATE
```

Alamat, database, port dan password fixture sengaja tetap: localhost127.0.0.1:55432 / `ki_isolated_test` / postgres / `ki_local_fixture_only`. **Ini password fixture lokal, jangan dipakai pada layanan nyata**. Docker port diikat pada loopback. Skrip menolak database yang sudah mempunyai schema auth/storage atau objek aplikasi; tidak DROP/TRUNCATE/reset database. Bootstrap juga memeriksa nama database. Tanpa opt-in, keluar2/SKIP sebelum koneksi.

Urutan harness: bootstrap kosong → migrasi001–006 → tes SQL003–006 → migrasi007 → tes007 → jalankan ulang007 → tes007. SQL007 menguji grant role, budget sequential, reset jendela, admin audit dan flag layanan tetap tertutup. Fungsi RSVP/checkout lama diuji pada skema6 sebelum penutupan grant7; grantbaru/rate diuji pada7. Ini belum simulasi lengkap semua transaksi setelah007 atau pengujian konkurensi banyak koneksi.

Lihat `.sql-test/report.json` dan seluruh log. Berhenti pada kegagalan pertama. Bila gagal, **jangan menjalankan tes pada database produksi**; perbaiki sumber lalu buat ulang container fixture lokal. Menghapus container/volume fixture menghilangkan semua datanya; periksa nama proyek/container sebelum melakukannya. Tidak ada perintah penghapusan otomatis di runner. CI memakai service PostgreSQL17 sementara yang dibuat khusus job, tanpa secret produksi.

## 3. Checklist Supabase staging yang sesungguhnya

Gunakan proyek Invitation staging dan dua akun nonadmin A/B, satu admin terpisah. Semua tanggal, nama, foto, rekening fixture, dan konten harus jelas bertanda uji. Catat hasil, tanggal, build commit, schema dan penguji; kosong berarti BELUM diuji.

| Pemeriksaan | Hasil/bukti |
|---|---|
| Instalasi bersih dengan lockfile + build produksi nyata | Belum diuji |
| SQL007 terpasang tanpa mengubah harga/draft/pesanan lama | Belum diuji |
| `/setup` skema7 dan `/admin/rilis` audit, nonadmin ditolak | Belum diuji |
| Daftar/konfirmasi email/login/logout/reset + link kedaluwarsa | Belum diuji |
| A simpan draft/foto; B tidak dapat membaca/mengubah milik A | Belum diuji |
| Editor dua tab, offline, retry, recovery, perubahan saat menyimpan | Belum diuji |
| Checkout quote berubah; retry tidak membuat tagihan baru | Belum diuji |
| Konfirmasi transfer belum lunas; admin verifikasi manual jumlah cocok | Belum diuji |
| Publish perlu persetujuan; edit draft tidak mengubah live tanpa publish ulang | Belum diuji |
| Foto hanya pada publikasi aktif, indeks/revision benar; bucket tetap privat | Belum diuji |
| Tarik/cabut/expiry menghentikan pembacaan baru (salinan lama dapat tetap ada) | Belum diuji |
| Tautan tamu benar, salah, dinonaktifkan/dirotasi; kapasitas dan konflik jawaban | Belum diuji |
| Ucapan privat, consent+moderasi, tarik consent, ekspor CSV aman | Belum diuji |
| CMS draft/preview/publish, konflik admin dan harga tanpa perubahan tagihan lama | Belum diuji |
| Panggilan RPC publik dengan anon/authenticated ditolak di Supabase | Belum diuji |
| Gateway tetap bekerja melalui server dengan token/slug yang benar | Belum diuji |
| Rate-limit aktif, keyhilang, DBgagal, timeout, reset dan Retry-After | Belum diuji |
| Pemalsuan XFF biasa tidak mengganti identitas limiter pada Vercel | Belum diuji |
| Dua koneksi serentak tidak melewati cap / menulis RSVP ganda | Belum diuji |
| Origin resmi bekerja; domain palsu/alias tidak menulis; periksa canonical | Belum diuji |
| Akun/admin/undangan/token tidak masuk cache publik/referrer/analytics/log aplikasi | Belum diuji |
| Restore database DAN media pada lingkungan terpisah, tautan/akses diperiksa ulang | Belum diuji |

Jangan upload password, cookie, header Authorization, secret Supabase, HMAC, linkreset, atau tautan tamu lengkap sebagai bukti. Screenshot status secukupnya, samarkan nama/kontak nyata. Trace browser pada pengujian autentikasi dapat memuat rahasia; simpan privat dengan masa retensi yang disepakati.

## 4. Persetujuan operasional, bukan sekadar tes kode

Verifikasi rekening penerima di luar aplikasi, ketentuan harga/masa aktif/refund, identitas dan kontak bisnis pada CMS/privasi, kuota/bandwidth, pembatasan Auth dan hosting, backup/restore, retensi/hapus data, pemantauan error, dan prosedur insiden. Jangan menghapus data lama atau membuka uang pelanggan sampai pemilik menyetujui hasil semua gerbang. Workflow yang hijau bukan pemeriksaan rekening atau kepatuhan hukum.
