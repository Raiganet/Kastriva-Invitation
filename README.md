# Kastriva Invitation — v1.8.0

Melanjutkan **ZIP terbaru `Kastriva-Invitation-main.zip`** dari Diky, bukan membuat ulang proyek dan bukan kembali ke paket 1.7.3 lama. Prioritas pertama audit: selaraskan pemeriksaan database, versi aplikasi/tes, cakupan SQL/browser, dan petunjuk upgrade.

**Status hasil aktual ada di `docs/TEST_REPORT.md`.** Kelulusan fungsi/kontrak kode tidak sama dengan build, SQL engine, pengujian Supabase, atau persetujuan produksi. Tidak ada layanan yang dinyalakan otomatis oleh rilis ini.

## Mulai dari satu panduan

Baca **`docs/UPGRADE_v1.8.0.md`**. Gunakan Node **22.x**, folder baru, dan salin `.env.local` Next.js sebelumnya secara lokal hanya bila sudah benar. Jangan salin `node_modules`, `.next`, `.next-test`, konfigurasi Express, atau secret ke GitHub.

```powershell
node -v
npm ci
npm test
npm run check:release-contract
npm run typecheck
npm run build
```

Jalankan berurutan; perbaiki kegagalan sebelum lanjut. `package-lock.json` **sudah tersedia**. Versi dependensi tidak diubah oleh patch ini; hanya metadata versi aplikasi pada manifest/lock menjadi 1.8.0.

Otomatisasi opsional: `npm run setup:local` memasang dependensi/browser lalu menguji build demo. `npm run diagnose` membantu memeriksa kegagalan; periksa log sebelum membagikannya. Skrip tidak menjalankan SQL, deploy, atau mengaktifkan layanan.

## Versi aplikasi bukan nomor migrasi

| Penanda | Rilis ini |
|---|---|
| Versi aplikasi (`package.json`) | **1.8.0** |
| Kompatibilitas skema dasar (`ki_schema_version()`) | **Tetap 7**, bukan 12 |
| Musik & hadiah | Migrasi **008** |
| Tema Islami/adat, Luxury Emerald, Botanical Blush | Migrasi **009–011** |
| Diagnostik kemampuan baca-saja | Migrasi **012_feature_readiness.sql** |

Sudah sampai 011: jalankan **012 saja**. Baru sampai 007: lengkapi **008 → 009 → 010 → 011 → 012**, mengikuti urutan deploy/migrasi pada panduan. Proyek baru: 001–012. **Jangan menghapus tabel atau menjalankan ulang migrasi lama setelah versi lebih baru.** Jika posisi migrasi tidak diketahui, gunakan preflight baca-saja di panduan; angka 7 tidak cukup untuk menentukannya.

`/setup` dan `/admin/rilis` memisahkan koneksi akun dari kemampuan fitur. Tema `active=false` tetap dihitung sebagai terpasang. Diagnostik menguji perilaku validator dan katalog; ia **bukan riwayat migrasi** atau bukti semua layanan sudah siap.

## Fitur yang ada dalam source terbaru

**15 tema**, terdiri dari **12 pernikahan** dan **3 demo nonpernikahan**. Editor enam langkah; draft dan foto privat; musik instrumental bawaan Serenade; maksimal tiga rekening amplop digital; galeri pembesaran; pembayaran transfer manual; publikasi terkontrol; tamu/RSVP/moderasi; CMS konten/harga; ringkasan admin.

Musik bukan upload MP3 atau katalog lagu. Amplop digital pasangan bukan rekening pembayaran paket. **Ucapan umum tanpa tautan tamu personal belum ditambahkan**; itu prioritas kedua audit. RSVP personal tetap berfungsi seperti sebelumnya. Tidak ada gateway/refund otomatis, QR check-in, kuota total Storage/cleanup/retensi otomatis, atau pernyataan bahwa seluruh aplikasi setara platform referensi.

## Pengujian

- `npm run check:release-contract`: memeriksa daftar 12 migrasi dan rencana pengujian, **tidak menjalankan SQL**.
- `npm run verify:release`: lock, instalasi, environment, tes, sintaks, batas browser/server, tipe, build demo, decoder, dan browser. Berhenti pada kegagalan pertama. Hasil `.release/report.json` bukan sertifikat produksi.
- `npm run test:sql:local`: hanya database lokal kosong yang sengaja disiapkan. Runner mencakup 001–012; fixture lama dijalankan sebelum 007 mengubah hak akses; fixture upgrade memeriksa pelestarian harga, tagihan, expiry, CMS, dan tema nonaktif. Lihat panduan sebelum menjalankan.
- Playwright memakai registry 15 demo, pemeriksaan versi yang sama dengan health, musik native Web Audio, amplop contoh, dan galeri fixture. Bukan data pelanggan atau tes Supabase.

**Jangan menyetel `KI_E2E_DEMO` di Vercel.** Route fixture galeri hanya dapat dibuka oleh build demo loopback dengan backend kosong. Jalur tersebut memberi 404 di konfigurasi hosting normal.

## Dokumen aktif

`docs/UPGRADE_v1.8.0.md` adalah petunjuk pemasangan; `docs/UJI_v1.8.0.md` adalah checklist; `docs/TEST_REPORT.md` adalah hasil aktual. Dokumen sebelumnya tetap disimpan sebagai riwayat. Bila nomor migrasi atau klaim fitur bertentangan, ikuti dokumen aktif ini, bukan petunjuk downgrade pada riwayat.

Startup aktif hanya `npm run dev/build/start` untuk Next.js. Berkas Express/SQLite lama masih terdapat pada source yang dikirim; jangan menjalankan `server.js`, `db.js`, atau mencampur backend lama. Pemisahan arsip legacy belum termasuk prioritas pertama ini.
