# Kastriva Invitation — v1.9.0

Prioritas kedua audit: **Ucapan & doa dari tautan umum**, terpisah dari RSVP personal, disertai moderasi/penghapusan dan perbaikan menu/progres pelanggan. Basis v1.8.0 ditambah perbaikan build audio yang sama dengan commit `40725a8`. Tidak ada perubahan pin dependensi, harga, desain atau aset tema; 15 tema tetap dipertahankan.

**Panduan aktif: `docs/UPGRADE_v1.9.0.md`. Hasil aktual: `docs/TEST_REPORT.md`.** Paket ini bukan klaim sudah diterapkan ke Supabase/Vercel atau telah lulus seluruh tes produksi.

## Mulai

Gunakan Node 22.x. Simpan cadangan, jangan salin node_modules/.next atau secret ke GitHub. Jalankan berurutan:

```powershell
npm ci
npm test
npm run check:release-contract
npm run typecheck
npm run build
```

## Database dan aktivasi

Jika sudah sampai 012, **hanya `supabase/migrations/013_public_wishes.sql`**. Jangan menjalankan ulang migrasi 001–012, mereset tabel atau mengubah penanda schema. Schema dasar tetap **7**; `ki_open_wish_version()` mengembalikan **1**. Uji staging dan cadangan sebelum menerapkan SQL pada layanan pelanggan.

Tambahkan `ENABLE_PUBLIC_WISHES=false`. Setelah pengujian, untuk membuka fitur: flag tersebut dan `ENABLE_PUBLIC_INVITATIONS` true pada deployment, layanan `/admin/ucapan` terbuka, lalu pemilik mengaktifkan penerimaan/penayangan pada `/dashboard/ucapan`. Tidak ada secret baru. RSVP personal tidak perlu diaktifkan hanya untuk ucapan umum.

Tamu mengisi nama/pesan/izin pada tautan `/u/...` tanpa `#guest`. Pesan berizin menunggu moderasi; pesan tanpa izin privat. Pemilik tidak dapat menyetujui pesan tanpa izin. Tamu menyimpan kode penghapusan privat dan dapat menghapus di `/ucapan/hapus`. Jangan membagikan kode. Riwayat RSVP, harga, dan pembayaran tidak diubah oleh ucapan.

Batas versi ini: nama 80, pesan 500 unit UTF-16; 2000 kiriman termasuk marker per undangan; lima kiriman per identitas jaringan harian dengan jeda 30 detik. Bukan anti-DDoS atau CAPTCHA. Kode/sessionStorage bukan cadangan permanen; penghapusan nama/pesan bukan penghapusan semua log/backup.

## Fitur sebelumnya tetap ada

15 tema (12 pernikahan/3 demo), editor enam langkah, foto privat, musik Serenade sintetis, maksimal tiga rekening hadiah, galeri modal, transfer/verifikasi manual, persetujuan publikasi, tamu/RSVP personal, CMS/harga dan pengelolaan admin. Musik bukan unggah MP3, rekening hadiah bukan pembayaran paket. Ucapan umum dan ucapan RSVP masih dua modul terpisah.

## Pengujian

`check:release-contract` memeriksa 13 migrasi/34 langkah, bukan menjalankan SQL. `verify:release` menguji kode/build/browser mode demo; tidak membuka layanan. `test:sql:local` hanya database fixture lokal, tidak menerima URL produksi. Playwright tambahan memakai HTTP mock pada halaman React fixture, bukan Supabase hidup. Jangan menyetel `KI_E2E_DEMO` di Vercel; halaman fixture harus 404 pada konfigurasi hosting normal.

Header login menyesuaikan status sebagai petunjuk navigasi; akses server tetap diperiksa. Progres ditampilkan per undangan, bukan satu progres untuk semua akun. Menu baru: `/admin/ucapan`, `/dashboard/ucapan`, `/dashboard/pesanan/[id]/ucapan`, `/ucapan/hapus`.

Dokumen tahap/versi lama dan laporan lamanya adalah riwayat. Startup aktif memakai `npm run dev/build/start` (Next.js). Source legacy Express masih ada dari sumber awal, jangan menjalankannya atau mencampurkan backend lama.
