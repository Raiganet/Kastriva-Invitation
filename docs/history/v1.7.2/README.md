> **Pembaruan aktif: v1.7.2 (perbaikan sesi dan logout).** Mulai dari [MULAI_DI_SINI.md](MULAI_DI_SINI.md) dan [panduan patch](docs/TAHAP_7_PERBAIKAN.md). Tidak ada SQL/key baru; skema tetap 7. Build lengkap belum terverifikasi. Penjelasan tahap 7 sebelumnya di bawah tetap menjadi latar fitur.

# Kastriva Invitation — Tahap 7 / v1.7.0

Melanjutkan v1.6.0: akun, editor, checkout manual, publikasi, tamu/RSVP, CMS, serta operasional tetap ada. Tahap 7 menambah gateway publik server-only, pembatasan jaringan di database, pembacaan JSON berbatas waktu, audit konfigurasi admin, dan gerbang tes rilis.

**Belum siap produksi.** Dependensi belum berhasil dipasang di lingkungan penyusun; build Next.js, SQL PostgreSQL, Supabase nyata, dan browser aplikasi belum terverifikasi. Baca `docs/TEST_REPORT.md` untuk hasil yang benar-benar dijalankan. Tidak ada deployment atau perubahan pada akun/data pelanggan oleh penyusun.

## Mulai dari kode, bukan transaksi

Gunakan Node 22.x dan folder baru; pertahankan ZIP sebelumnya. Jangan menyalin `node_modules`, `.next`, atau konfigurasi Express lama. Jangan menaruh key di GitHub.

```powershell
node -v
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm install
npx --no-install playwright install chromium
npm run verify:release
```

Jalankan perintah berikutnya hanya jika perintah sebelumnya berhasil. `npm install` perlu menghasilkan lockfile asli. Gerbang memeriksa lock, env demo, seluruh tes fungsi, sintaks, batas client/server, tipe, build, decoder, dan browser Playwright. Berhenti pada kegagalan pertama. `.release/report.json` bukan persetujuan produksi.

Gerbang membangun **mode demo terisolasi ke `.next-test`**, memakai kredensial kosong, fitur publik tertutup, tanpa database pelanggan. Jangan menjalankan `npm start` dengan asumsi hasil tes ini build produksi; `npm run build` biasa membuat `.next` setelah konfigurasi staging/produksi benar. Jangan set `KI_E2E_DEMO` di Vercel.

## Upgrade yang penting

Baca **`docs/TAHAP_7_RILIS.md`** sebelum menjalankan SQL. Proyek yang sudah 001–006 hanya perlu `007_release_hardening.sql`, pada database Invitation yang sama. Cadangkan dan uji staging dahulu. **Aplikasi v1.6 tidak kompatibel dengan jalur publik setelah 007**; jangan mengembalikan grant anonim agar kode lama berjalan.

Undangan publik sekarang memerlukan `SUPABASE_SECRET_KEY` **dan** `RATE_LIMIT_HMAC_KEY` pada server, termasuk tanpa foto. Tidak ada secret baru yang dibundel. Foto tetap dalam bucket privat. Hosting publik gateway saat ini Vercel; localhost untuk pengujian. Layanan lain memerlukan adapter IP tepercaya, bukan mengaktifkan header palsu.

## Dokumen aktif

- `docs/TAHAP_7_RILIS.md`: pemasangan, konfigurasi, perubahan kompatibilitas.
- `docs/UJI_RILIS_TAHAP7.md`: gerbang kode, SQL lokal terisolasi, checklist Supabase staging.
- `docs/BACKUP_ROLLBACK.md`: pencadangan terpisah database/foto, penghentian layanan dan pemulihan.
- `docs/TEST_REPORT.md`: hasil aktual dan batas pengujian.
- `/admin/rilis`: pemeriksaan konfigurasi melalui akun admin terkonfirmasi; bukan tombol mengaktifkan produksi.

Musik, gateway pembayaran, QR check-in, editor desain baru, kuota paket, otomatisasi penghapusan/retensi, audit menyeluruh, dan uji beban masih backlog. Jangan menjualnya sebagai fitur selesai.
