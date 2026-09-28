# Upgrade prioritas pertama audit — v1.8.0

Tanggal: 28 September 2026. Basis: ZIP terbaru `Kastriva-Invitation-main.zip`, manifest 1.7.3 tetapi sudah berisi musik/hadiah dan 15 tema. Paket ini bukan hasil deployment ke akun Diky. Semua hasil pengujian, termasuk keterbatasan, ada di `TEST_REPORT.md`.

## A. Yang berubah dan tidak berubah

A02/A03/A04/A10 audit ditangani: pemisahan readiness akun/fitur, sumber versi tunggal, urutan SQL 001–012, browser 15 demo + interaksi tambahan, dan dokumentasi aktif. `package.json` menjadi 1.8.0, `ki_schema_version()` tetap **7**. Tidak ada key/flag baru, pemindahan database, perubahan harga/desain, pembukaan layanan, atau penghapusan data.

Migrasi 001–011 dan aset/katalog asli dipertahankan. **012 hanya menambahkan fungsi baca-saja** `ki_feature_readiness()`. Fungsi memakai dokumen sintetis untuk memeriksa validator dan membaca metadata katalog/CMS, bukan isi undangan pelanggan. Yang dikembalikan hanya boolean/count dan penanda kontrak. Ia bukan ledger/sertifikat bahwa semua migrasi historis pernah dijalankan.

## B. Pasang kode di folder terpisah

Gunakan Node 22.x. Salin `.env.local` Next.js sebelumnya secara lokal bila benar. Jangan salin node_modules, .next/.next-test, file konfigurasi Express, atau secret ke GitHub.

```powershell
node -v
npm ci
npm test
npm run check:release-contract
npm run typecheck
npm run build
```

Perintah berurutan, berhenti jika gagal. Lockfile sudah ada dan pin dependensi tetap sama dengan source Diky. `npm run diagnose` tersedia untuk diagnosis; penyamaran log bukan jaminan semua rahasia terhapus. Jangan mematikan typecheck/RLS/SSL sebagai jalan pintas.

Untuk browser lokal, setelah instalasi:

```powershell
npx --no-install playwright install chromium
npm run verify:release
```

Gerbang ini membangun mode demo loopback terisolasi dengan backend kosong. Hasil di `.release/report.json`; mode ini tidak menguji akun/Supabase. `KI_E2E_DEMO` adalah khusus runner; **jangan dipasang pada Vercel atau dipakai untuk build situs pelanggan**. Vercel memakai `npm run build`, bukan `verify:release`.

## C. Tentukan keadaan database sebelum menulis SQL

Gunakan proyek khusus Invitation yang sama. Cadangkan database **dan objek foto**; baca `BACKUP_ROLLBACK.md`. Uji lebih dahulu pada staging terpisah; jangan mengasumsikan backup sudah bisa dipulihkan hanya karena ada file panduan.

| Posisi yang diketahui | Langkah |
|---|---|
| Sudah 001–011 | Jalankan **012_feature_readiness.sql saja**. Tidak perlu menjalankan 008–011 lagi. |
| Baru sampai 007 | Lengkapi **008 → 009 → 010 → 011 → 012** satu file penuh per langkah. Lihat urutan deploy di bagian D. |
| Sudah 008 atau 009/010 | Jalankan hanya file sesudah tahap terakhir yang diketahui sampai 012, secara berurutan. |
| Proyek Invitation benar-benar baru | 001 → 002 → ... → 012. Jangan memakai database aplikasi lain. |
| Tidak tahu / pernah mengubah SQL manual | Jalankan `supabase/diagnostics/preflight_008_011.sql` dahulu; skrip ini **BEGIN READ ONLY → ROLLBACK**, tanpa membuat fungsi/tabel atau mengubah harga. |

Preflight menunjukkan schema dasar, kemampuan validator musik/hadiah, tema pada katalog CMS, dan keberadaan diagnostik 012. Angka schema **7 tidak berarti berhenti pada migrasi 007**. Hasil campuran juga bukan alasan menjalankan ulang semua file: misalnya Botanical sudah ada tetapi heritage hilang perlu diperiksa, bukan mengembalikan validator 009 di atas 011.

Fungsi 012 memang dapat membaca kemampuan yang belum lengkap pada schema 7, tetapi pemasangan normal mengikuti urutan di atas. Jangan mengubah `ki_schema_version()` menjadi 12 atau menandai nomor migrasi secara manual supaya indikator menjadi hijau.

## D. Urutan aman untuk instalasi yang belum punya tema baru

Migrasi 009–011 menambah renderer dan mengganti validator CMS; kode lama yang hanya mengenal 8 tema mungkin tidak cocok membaca hasil baru. Karena itu:

1. Uji build versi ini dan susun jendela pemeliharaan bila situs sudah melayani pengguna.
2. Pasang kode yang mengenal 15 tema **sebelum** menambahkan tema baru ke katalog live. Selama jendela upgrade, tahan penyuntingan CMS/draft; jangan mengubah atau membatalkan pembayaran pelanggan.
3. Lengkapi migrasi yang memang belum terpasang secara berurutan hingga 012. Masing-masing file menggunakan transaksi; kegagalan harus diperiksa, bukan dilompati.
4. Buka `/setup` dan `/admin/rilis`, kemudian uji CMS, draft, foto, pesanan lama, dan publikasi dengan data staging.

Jika 011 sudah terpasang seperti pada proyek terbaru yang digunakan, ini hanya upgrade kode + diagnostik 012, bukan pengulangan penambahan tema. Database tidak diubah oleh proses build atau ZIP ini.

## E. Periksa hasil diagnostik

```sql
select public.ki_schema_version(); -- tetap 7
select public.ki_feature_readiness(); -- kontrak diagnostik 1, diagnostics_migration 12
```

```powershell
npm run check:supabase
```

Atau gunakan `/setup`. Hasil dibagi menjadi **Koneksi akun** dan **Fitur terbaru**. Akun dapat siap diuji sementara fitur belum lengkap. CLI mengembalikan gagal (exit 1) jika kemampuan terbaru belum berhasil diperiksa; konfigurasi kosong adalah SKIP (exit 2).

Jumlah tema aktif tidak harus 15. Tema nonaktif tetap dihitung sebagai terpasang. Jika semuanya sengaja disembunyikan, daftar publik diberi peringatan tetapi itu tidak dianggap migrasi hilang. Aktifkan tema pilihan melalui CMS sebelum menguji pesanan baru.

`/admin/rilis` tetap mewajibkan akun admin. Diagnostik baru tidak membuka draft pelanggan, buku tamu, atau RPC undangan publik kepada role browser. Pembayaran, publikasi, dan RSVP tetap dikendalikan pengaturan lama.

## F. Pengujian SQL engine terisolasi

`check:release-contract` hanya memeriksa rencana; menjalankannya bukan bukti SQL dapat dikompilasi. Runner sekarang menjalankan **30 langkah**, termasuk semua migrasi 001–012, tes pra-007 pada posisi yang benar, upgrade dengan harga kustom/tema tersembunyi, serta pengulangan migrasi terakhir.

Untuk benar-benar menjalankan SQL diperlukan PostgreSQL lokal kosong dengan nama/port khusus dari `docs/UJI_RILIS_TAHAP7.md` / file compose proyek. Runner hanya mengizinkan `127.0.0.1:55432`, database `ki_isolated_test`, user/password fixture lokal. Ia tidak membaca `.env` atau menerima URL database produksi.

```powershell
$env:KI_SQL_TEST_ALLOW_CREATE = 'yes'
npm run test:sql:local
Remove-Item Env:KI_SQL_TEST_ALLOW_CREATE
```

Jangan menjalankan file fixture pada Supabase produksi. `008_011_upgrade_seed.sql` sengaja membuat data sintetis persisten dalam database lokal sementara untuk diperiksa lintas file migrasi. Fixture lain memakai ROLLBACK; seluruh database lokal dapat dibuang setelah uji. Runner menolak database yang tidak kosong; untuk pengulangan siapkan ulang **database fixture**, bukan mereset proyek Supabase.

Log `.sql-test/report.json` mencatat setiap file yang benar-benar dijalankan. Tidak ada SQL yang dilewati diam-diam ketika file migrasi baru tidak terdaftar. Meskipun PostgreSQL lokal lulus, schema auth/storage di harness adalah stub; Auth HTTP, Storage, email, dan RLS pada Supabase nyata tetap perlu pengujian.

## G. Deploy dan uji staging

Jangan push `.env.local`, `.npmrc`, token tamu, atau key server. Pakai environment yang sudah benar dan proyek Supabase yang sama. Tidak ada penambahan secret pada versi ini. Jangan ubah key server menjadi NEXT_PUBLIC_ atau bucket foto menjadi publik.

Setelah deployment terbaru selesai, periksa halaman setup/rilis, akun A/B, CMS simpan–preview–publish, harga yang berubah saat checkout, pesanan lama, musik/hadiah, dan tautan tamu. `docs/UJI_v1.8.0.md` berisi checklist. GitHub Actions telah diperbarui tetapi belum berarti workflow telah berjalan di repository Diky.

## H. Batas cakupan

Prioritas pertama selesai di tingkat source/perbaikan yang dijelaskan pada laporan. **Ucapan & doa umum**, menu login dinamis/progres, kuota/cleanup media, penguatan CSP, pemisahan legacy, dan bukti restore masih pekerjaan berikutnya. Tidak ada klaim seluruh aplikasi siap produksi atau test live berhasil dari jumlah tes unit saja.
