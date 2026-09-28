# Kastriva Invitation — v1.9.3

Production-sync patch untuk Kastriva Invitation. Fokus versi ini: **Ucapan & doa auto-publish yang tetap consent-bound**, readiness 014/015, dan pemulihan branding Classic Emblem setelah source `main` sempat kembali ke header/footer lama.

## Status kontrak database

Skema dasar tetap **7**. Migrasi aktif yang perlu dikenal source sekarang adalah 001–015.

- 013: ucapan umum terpisah dari RSVP personal.
- 014: ucapan yang memberi izin tampil dapat otomatis dipublikasikan; default penerimaan/penayangan untuk pesanan baru dibuat ramah auto-publish.
- 015: diagnostik read-only untuk memeriksa auto-publish/default trigger melalui `/setup` dan `/admin/rilis`.

Production Supabase sudah memasang 014 dan 015. **Jangan menjalankan ulang SQL production hanya karena source ini dipush.** Untuk database baru/staging, jalankan seluruh migrasi berurutan.

## Build lokal

Gunakan Node 22.x:

```powershell
npm ci
npm test
npm run check:lock
npm run check:release-contract
npm run check:security
npm run typecheck
npm run build
```

`npm test`, release contract, syntax dan security bukan pengganti build Next.js atau uji browser/Supabase hidup.

## Ucapan umum

Pengunjung tautan umum dapat mengirim nama + ucapan tanpa akun. Jika izin tampil dicentang, ucapan dapat muncul otomatis. Jika izin tidak dicentang, pesan tetap privat untuk pemilik undangan. Pemilik tetap dapat menyembunyikan atau menghapus isi.

Kode penghapusan tamu tetap privat dan tidak dikirim lewat URL.

## Branding

Header/footer menggunakan Classic Emblem `Kastriva Invitation`, favicon/app icon menggunakan aset `/public/brand/crest-v1`, dan manifest tetap aktif.

## Catatan produksi

- `ENABLE_PUBLIC_WISHES=true` diperlukan di deployment production.
- RLS tetap wajib aktif; bucket `ki-media` tetap privat.
- Auto-publish bukan anti-spam/CAPTCHA. Rate limit dan moderasi/hide/remove tetap disediakan.
- Log/backup punya retensi provider terpisah.
