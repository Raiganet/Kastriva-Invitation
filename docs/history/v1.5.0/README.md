# Kastriva Invitation — Tahap 5 / v1.5.0

Katalog/demo → akun → editor → checkout/verifikasi manual → publikasi → **daftar tamu, tautan personal, RSVP, ucapan dan moderasi**.

**Status: pengembangan/staging, belum siap menerima transaksi pelanggan.** Source melanjutkan tahap4. Unit/syntax/subset typecheck/layout statis diuji; full Next.js build dan database nyata belum terverifikasi. Tidak ada deployment, uang, email, atau akun eksternal yang diubah.

## Mulai dari sini

Panduan aktif: **[TAHAP_5_TAMU_RSVP.md](docs/TAHAP_5_TAMU_RSVP.md)**. Checklist: [UJI_TAMU_TAHAP5.md](docs/UJI_TAMU_TAHAP5.md). Hasil sebenarnya: [TEST_REPORT.md](docs/TEST_REPORT.md).

Node22.x, ekstrak ke folder baru; gunakan `.env.local` Next.js yang benar secara lokal. Jangan menyalin node_modules/.next atau environment Express lama.

```powershell
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm install
npm test
npm run check:syntax
npm run typecheck
npm run build
```

Jangan lanjut bila gagal. Setelah berhasil, `npm run dev`. Database yang sudah 001–004: jalankan **005 saja**. Database baru: 001 → 002 → 003 → 004 → 005. `/setup` harus membaca skema5. Jangan menjalankan ulang migrasi lama setelah005 atau menonaktifkan RLS.

Tambahkan `ENABLE_RSVP=false`. Untuk uji RSVP, environmentRSVP dan publikasi, flag database `/admin/tamu`, serta penerimaan pemilik perlu aktif sesuai panduan. Undangan harus paid, published, unexpired. Tidak diperlukan secret baru; secret foto tahap4 tetap hanya server dan bucket privat.

## Fitur baru

Pemilik: `/dashboard/tamu` → pesanan → tambah25 nama perbatch, cari/filter/paginasi, kapasitas1–10, batas teknis500 rombongan. Tautan khusus tiap tamu, salin pesan atau buka WhatsApp manual. Token dapat diganti atau tautan dinonaktifkan; riwayat tetap disimpan. CSV seluruh daftar tanpa token.

Tamu: satu jawaban terbaru Hadir/Tidak hadir/Belum pasti, berlaku untuk seluruh undangan. Ucapan privat secara default; izin tamu + moderasi pemilik diperlukan untuk publikasi. Edit mengulang moderasi; izin dapat ditarik. Konfirmasi bukan check-in. Tautan berfungsi sebagai kredensial bearer, bukan verifikasi identitas atau penguncian seluruh halaman undangan.

Mutasi dicatat sebelum dikirim; hasil tidak pasti dicoba lagi dengan ID dan isi sama. Skrip unit tidak membuktikan database/RLS sebenarnya terpasang. Uji staging wajib. Default lama transaksi/publikasi tetap tidak diubah. Tema/harga dan migration001–004 dipertahankan.

## Pengujian dan batas

318 tes unit/mock/kontrak,128 TS/TSX syntax,8-file subset semantic check,24 layout statis. Full install gagal/timeout; probe npm menunjukkan DNS EAI_AGAIN; build belum berjalan. Laporan menjelaskan batas semua angka tersebut.

SQL005 integration opsional memakai fixture BEGIN/ROLLBACK hanya staging; belum dijalankan penyusun. Tidak ada lockfile fiktif. Setelah install/audit/build benar-benar berhasil, commit lockfile dan gunakan npmci. Jangan menghapus typecheck untuk melewati error.

Musik, hadiah, QRcheck-in, WhatsAppblast, RSVP peracara, CMS lengkap, gateway pembayaran, penghapusan/retensi otomatis, dan audit produksi belum tersedia. Hapus/nonaktif berbeda: nonaktif mempertahankan riwayat. Dokumen tahaplama adalah sejarah, bukan instruksi downgrade.
