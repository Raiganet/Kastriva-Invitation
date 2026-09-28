# Mulai v1.9.0

1. Simpan cadangan source. Baca `docs/UPGRADE_v1.9.0.md`.
2. `npm ci` → `npm test` → `npm run typecheck` → `npm run build` pada Node 22.x. Hentikan bila gagal.
3. Pertahankan environment yang benar. Tambahkan `ENABLE_PUBLIC_WISHES=false`, tanpa key baru.
4. Setelah staging/cadangan ditinjau, pasang **013_public_wishes.sql saja** bila 001–012 sudah ada. Paket ini belum menerapkannya ke Supabase Diky.
5. `/setup` dan `/admin/rilis`, lalu checklist `docs/UJI_v1.9.0.md`.
6. Buka flag deployment, layanan Admin → Ucapan umum, dan penerimaan/penayangan pemilik setelah pengujian.

Tidak perlu mendaftarkan tamu untuk ucapan umum. RSVP personal, musik, hadiah, tema dan harga tidak diubah. Jangan membagikan secret, tautan tamu, atau kode penghapusan.
