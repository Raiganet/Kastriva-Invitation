# Mulai dari sini — v1.7.2

Perbaikan sesi akun, pembatas koneksi SDK, dan konfirmasi logout. Database tetap skema 7; **tidak ada SQL atau key tambahan**.

Ekstrak ke folder baru, simpan versi sebelumnya, lalu gunakan Node 22.x. Salin `.env.local` Next.js lama secara lokal hanya jika konfigurasinya benar. PowerShell di folder `package.json`:

```powershell
node -v
npm run setup:local
```

Jika instalasi berhenti, jalankan `npm run diagnose`. Jangan menghapus validasi atau memakai `--force` untuk melewati masalah.

Panduan: [docs/TAHAP_7_PERBAIKAN.md](docs/TAHAP_7_PERBAIKAN.md). Hasil aktual: [docs/TEST_REPORT.md](docs/TEST_REPORT.md).

**618 tes fungsi/simulasi/source lulus, tetapi build penuh, SQL dan Supabase nyata belum terverifikasi. Belum siap produksi.** Jangan membagikan environment atau membuka transaksi sebelum seluruh gerbang pengujian selesai.
