# Kastriva Invitation — Tahap 4 / v1.4.0

Katalog dan demo → akun → editor → **checkout → verifikasi pembayaran manual → penerbitan oleh pemilik**.

**Status: pengembangan/staging, belum siap menerima transaksi nyata.** Kode melanjutkan tahap 3. Pengujian fungsi dan pemeriksaan source telah dijalankan, tetapi instalasi dependensi gagal DNS. Build Next.js, SQL/RLS di engine nyata, Auth/Storage, interaksi browser Next.js, dan deployment belum terverifikasi. Tidak ada uang, akun, email, atau deployment yang diubah penyusun.

## Pemasangan

Gunakan Node 22.x. Ekstrak ke folder baru, cadangkan sebelumnya. Salin konfigurasi `.env.local` Next.js yang benar secara lokal, bukan konfigurasi Express lama. Jangan menyalin `node_modules` atau `.next`.

```powershell
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm install
npm test
npm run check:syntax
npm run typecheck
npm run build
```

Jangan melanjutkan jika gagal. Sesudah berhasil, `npm run dev`. Gunakan proyek Supabase Invitation yang sama: jalankan **004 saja** bila 001–003 sudah terpasang; proyek baru memasang 001 → 002 → 003 → 004. Jangan menjalankan ulang SQL lama setelah 004. `/setup` harus membaca skema 4.

Panduan utama: **[TAHAP_4_PEMESANAN.md](docs/TAHAP_4_PEMESANAN.md)**. Ringkasan upgrade: [UPGRADE_TAHAP_4.md](docs/UPGRADE_TAHAP_4.md). Checklist staging: [UJI_TRANSAKSI_TAHAP4.md](docs/UJI_TRANSAKSI_TAHAP4.md). Hasil pengujian sebenarnya: [TEST_REPORT.md](docs/TEST_REPORT.md).

## Ruang lingkup versi ini

Satu pesanan per draft; harga, rekening, dan masa aktif direkam saat checkout. Admin memeriksa mutasi rekening secara terpisah sebelum menyetujui pembayaran. Pemilik harus menyetujui publikasi dan menerbitkan salinan draft. Edit draft tidak otomatis mengubah halaman tamu. Alamat publik tetap; masa aktif tidak bertambah ketika diterbitkan ulang. Ada tarik publikasi, pencabutan akses, riwayat, daftar pesanan, berbagi WhatsApp, dan cetak ringkasan.

Permintaan bantuan lama tetap pada `/admin/permintaan` dan tidak dianggap pembayaran. Lima tema pernikahan digunakan pada editor/checkout; tiga kategori lain tetap demo. Batas editor tetap tiga acara dan enam foto. Delapan referensi tema dan SQL 001–003 dipertahankan identik.

## Aktivasi dilakukan terpisah

Default `ENABLE_CHECKOUT=false`, `ENABLE_PUBLIC_INVITATIONS=false`; kedua flag database juga false dan rekening kosong. Nilai awal masa aktif 365 hari dapat diubah di `/admin/transaksi` sebelum membuka pesanan. Pertahankan `ENABLE_ORDER_REQUESTS=false` untuk alur bantuan lama.

**Foto publik memerlukan `SUPABASE_SECRET_KEY` hanya pada server**, tanpa awalan `NEXT_PUBLIC_`. Publishable key tetap dipakai browser. Jangan memasukkan secret ke kode atau GitHub dan jangan menjadikan bucket `ki-media` publik. Server mengambil foto berdasarkan publikasi yang masih aktif, membatasi ukuran/piksel, dan mengubah ulang gambar tanpa metadata. Tidak ada path Storage atau signed URL privat pada halaman tamu. Baca panduan sebelum aktivasi.

## Pengujian dan batas

`npm test` menjalankan fungsi domain, simulasi jaringan/penyimpanan, serta inspeksi kontrak source, bukan database nyata. `npm run test:media` menjalankan decoder gambar setelah dependensi terpasang. `npm run test:supabase` tetap skrip opt-in akun/draft dari tahap sebelumnya, bukan tes transaksi. SQL integrasi 004 opsional disertakan dan belum dijalankan penyusun.

Tidak ada gateway/QRIS, refund/perpanjangan otomatis, upload bukti transfer, RSVP nyata, musik, QR check-in, CMS lengkap, atau pembersihan data otomatis. Pengujian beban, rate-limit terdistribusi, keamanan, kuota, backup, dan ketentuan operasional masih harus diselesaikan sebelum produksi.

Tidak ada lockfile buatan. Setelah instalasi dan pemeriksaan berhasil di mesin Diky, commit lockfile hasil sebenarnya dan gunakan `npm ci`. Jangan mematikan RLS atau validasi tipe untuk melewati error. Dokumen tahap lama diberi penanda historis; untuk instalasi saat ini gunakan panduan tahap 4.
