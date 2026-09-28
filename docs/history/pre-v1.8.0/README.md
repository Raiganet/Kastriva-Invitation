# Kastriva Invitation — v1.7.3

Melanjutkan v1.7.2, **bukan proyek baru**. Patch kontrol transaksi dan retry. Skema database tetap 7.

**STATUS: BELUM LOLOS RILIS.** 652 tes fungsi/simulasi/kontrak lulus; instalasi lengkap, typecheck seluruh aplikasi, build Next.js, browser aplikasi, SQL, dan Supabase live belum berhasil diverifikasi di lingkungan penyusunan. Tidak ada deployment atau perubahan akun Diky.

## Mulai

Gunakan Node 22.x. Ekstrak ke folder baru; simpan folder lama. Salin `.env.local` Next.js lama secara lokal hanya bila benar. Jangan salin `node_modules`/`.next` atau environment Express.

```powershell
node -v
npm run setup:local
```

Jika gagal, jalankan `npm run diagnose`. Baca `.diagnostics/setup-report.json` dan `.diagnostics/report.json`; periksa dan hapus data rahasia sebelum membagikan. Tidak ada lockfile buatan. Setelah npm berhasil membuat lockfile, tinjau dan simpan ke repository; gunakan `npm ci` selanjutnya.

**Jika SQL 007 sudah terpasang, tidak ada SQL tambahan atau key baru untuk patch ini.** Tidak ada checkout, publikasi atau RSVP yang dibuka otomatis. Jangan menjalankan ulang migrasi lama.

## Lingkup patch

Kontrol checkout, tindakan pembayaran, penerbitan dan pengaturan transaksi sekarang memakai controller terpisah per akun/entitas. Respons dari controller yang sudah ditutup tidak memperbarui halaman baru. Callback tampilan yang gagal tidak membatalkan konfirmasi server atau meninggalkan tombol sibuk. Jurnal retry disalin dan dibekukan; kegagalan membersihkan jurnal menahan tindakan baru.

Transport transaksi membatasi badan respons nyata hingga 16 KB dan waktu 20 detik untuk fetch + pembacaan. HTTP 408/429 dan balasan tidak dikenal tetap belum pasti; retry menggunakan ID/isi sama. Redirect ditolak sebelum payload dapat diikuti ke tujuan lain. Ini bukan koneksi bank otomatis, anti-DDoS atau jaminan transaksi produksi.

## Fitur yang tetap tersedia dalam source

Katalog/delapan demo; lima tema pernikahan dalam editor; akun Supabase; editor/draft/foto; checkout dan verifikasi manual; publikasi; daftar tamu/RSVP/moderasi; CMS dan ringkasan admin. Tiga tema nonpernikahan masih demo. Musik, gateway pembayaran otomatis, QR check-in, paket kuota terpisah dan retensi otomatis belum dibuat.

## Dokumen aktif

- `docs/TAHAP_7_PERBAIKAN.md`: pemasangan v1.7.3 dan batas fitur.
- `docs/UJI_TRANSAKSI_v1.7.3.md`: skenario browser staging setelah build berhasil.
- `docs/TEST_REPORT.md`: hasil aktual, termasuk pengujian yang gagal/belum berjalan.
- `docs/TAHAP_7_RILIS.md`: konfigurasi dan upgrade skema 7 bila belum terpasang.
- `docs/BACKUP_ROLLBACK.md`: cadangan dan batas pemulihan.

Semua riwayat tahap lama tetap ada sebagai riwayat, bukan bukti hasil v1.7.3. Jangan membuka data/uang pelanggan sampai instalasi, build, SQL terisolasi, dua akun dan alur staging benar-benar lulus.
