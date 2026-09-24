# v1.2.0 — Tahap 2 (23 September 2026)

- Pemeriksaan koneksi baca-saja di /setup dan check:supabase, terpisah dari check:env.
- Migrasi 002: confirmed-email gate, validasi keberadaan media, fungsi delete/revision, tombstone ID, diagnostik admin, dan schema marker.
- Halaman akun sendiri, kirim ulang konfirmasi, konfirmasi password, dan no-referrer pada link Auth.
- Halaman /admin/sistem dengan status RLS/grant/bucket dan peringatan policy tambahan.
- Hapus draft dengan konfirmasi; tidak menghapus foto atau draft yang terhubung permintaan.
- Alat uji dua akun staging berpengaman, tambahan unit/mock/static tests, panduan aktivasi dan upgrade.
- Penolakan interpolasi secret publik dan URL localhost untuk deployment Vercel dengan backend.
- Pembayaran/publish/RSVP produksi/CMS tetap belum tersedia. Tidak ada migrasi akun eksternal atau push repository oleh penyusun.

---

# v1.1.0 — 2026-09-23

Penyelarasan Kastriva-Undangan.zip ke arahan Kastriva Invitation. Framework diubah dari Express/EJS/SQLite menjadi Next.js/Supabase. 8 tema/harga awal dipertahankan. Branding/navigasi/demo dan tampilan responsif diperbarui. RSVP simulasi ditandai, musik semu dihapus, API tamu anonim ditutup. Kode Auth SSR, editor privat/manual save, optimistic revision/idempotent retry, Storage privat, permintaan pengerjaan opsional/admin allowlist ditambahkan. Pengaman secret sebelum build, setup lama non-destruktif, 45 tes, SQL, dokumentasi, dan workflow verifikasi ditambahkan.

Bukan production release. Dependency install/build/typecheck penuh terhalang koneksi registry di lingkungan penyusun. Belum ada migrasi DB pelanggan, backend live terverifikasi, pembayaran, publish, RSVP nyata atau CMS lengkap.
