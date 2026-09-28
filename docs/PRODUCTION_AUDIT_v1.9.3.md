# Production Audit — Kastriva Invitation v1.9.3

Tanggal pemeriksaan: 2026-09-28.

## Terverifikasi

- GitHub `main` build status Vercel: success pada commit sebelum patch sync ini.
- Supabase base schema: 7.
- 15 tema terdeteksi.
- RLS aktif pada seluruh tabel `ki_*` yang diperiksa.
- Bucket `ki-media` privat.
- Ucapan umum aktif.
- Auto-publish consented wishes aktif.
- Default settings trigger untuk pesanan baru aktif.
- 2 ucapan berizin tampil; 0 pending berizin pada saat audit.
- Migrasi production tercatat sampai `public_wishes_readiness_015`.

## Temuan diperbaiki oleh patch ini

1. Repo sudah memiliki file 014 tetapi `database-contract.json` dan SQL test plan masih berhenti di 013.
2. Commit auto-publish mengembalikan `SiteHeader`, `SiteFooter`, `app/layout.tsx`, dan `robots.ts` ke versi branding lama.
3. `/setup` dan `/admin/rilis` belum dapat membuktikan readiness auto-publish 014.

Patch ini memulihkan branding Classic Emblem, menambahkan 014/015 ke kontrak migrasi, dan menambahkan probe readiness 015.

## Pengujian source patch

- `npm test`: 789/789 lulus.
- `npm run check:lock`: lulus.
- `npm run check:release-contract`: lulus, 15 migrasi / 42 langkah SQL.
- `npm run check:syntax`: lulus, 232 TS/TSX, 0 syntax/local-import error.
- `npm run check:security`: lulus, 48 client roots / 189 source files / 0 boundary error.
- Full typecheck/build tidak dijalankan pada lingkungan audit karena dependency lokal tidak terpasang. Vercel perlu menjadi verifikasi final setelah push.

## Log Supabase

PostgREST mencatat beberapa `Warp server error: Thread killed by timeout manager`. Tidak ditemukan error PostgreSQL terkait data aplikasi pada jendela audit yang sama, dan alur ucapan publik tetap berhasil. Pantau kembali jika pengguna mengalami request lambat/timeout.
