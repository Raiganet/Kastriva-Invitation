# Kastriva Invitation — Tahap 6 / v1.6.0

Melanjutkan tahap5: **CMS konten situs, katalog/harga dari database, preview/publish, riwayat, ringkasan operasional, dan directory pelanggan pemesan**. Stages akun, editor, pembayaran manual, publikasi, dan RSVP tetap ada.

**Status: source pengembangan dengan pengujian parsial; belum siap dinyatakan produksi.** Build Next.js lengkap, SQL engine dan Supabase nyata belum terverifikasi. Tidak ada akun eksternal, deployment, email, atau uang yang diubah oleh penyusun.

## Mulai

[TAHAP_6_CMS.md](docs/TAHAP_6_CMS.md) · [UJI_CMS_TAHAP6.md](docs/UJI_CMS_TAHAP6.md) · [TEST_REPORT.md](docs/TEST_REPORT.md)

Node22.x, ekstrak ke folder baru. Gunakan `.env.local` Next.js sebelumnya secara lokal jika benar; jangan salin node_modules/.next atau konfigurasi Express.

```powershell
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm install
npm test
npm run check:syntax
npm run typecheck
npm run build
```

Berhenti jika gagal. Database sudah001–005: **006 saja**. Baru:001→002→003→004→005→006. Gunakan proyek khusus Invitation yang sama dan backup dulu. Jangan re-run migration lama setelah006. Tidak ada key/flag/dependensi baru. CMS kontak diisi melalui CMS, bukan otomatis dari environment lama.

```powershell
npm run check:env
npm run check:supabase
npm run dev
```

`/setup` harus versi6. Admin terkonfirmasi: `/admin/cms` dan `/admin/ringkasan`. Perbarui data server → Muat Published → edit → preview → simpan draft → preview server → publish. Harga baru tidak mengubah pesanan lama. Tema nonaktif berhenti dijual, bukan mematikan undangan lama. Riwayat dimuat sebagai draft, bukan rollback uang.

## Status pemeriksaan

417 tes fungsi/mock/kontrak,143 file sintaks,8 file semantic subset,40 layout statis,9 decoder foto regresi. Angka itu bukan full Next.js/Supabase E2E. Instalasi npm gagal EAI_AGAIN; typecheck/build penuh belum berhasil. Laporan memisahkan batas setiap tes dan pin Sharp yang berbeda saat decoder lokal diuji.

Tidak ada package-lock fiktif. Setelah resolusi/audit/pengujian berhasil, commit lockfile aktual dan gunakan npmci. Jangan mematikan typecheck. GitHub workflow tersedia tetapi belum dijalankan pada akun Diky.

## Batas

CMS mengubah teks/metadata dan8 tema yang ada, bukan desain bebas atau paket kuota baru. Directory hanya pelanggan yang pernah pesan, bukan seluruh akun. Musik/hadiah/gateway/QR/WhatsAppblast/hapus akun/retensi/kuota total/rate-limit HTTP menyeluruh belum selesai. Gerbang transaksi/publikasi/RSVP tetapfalse pada contoh konfigurasi. Tahap7 perlu fokus build, SQL staging, uji browser dan pengamanan produksi.
