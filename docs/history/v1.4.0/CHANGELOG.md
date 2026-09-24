# Changelog

## 1.4.0 — 24 September 2026

- Menambah checkout, verifikasi manual, dan publikasi melalui SQL 004. Empat tabel baru memakai RLS serta RPC; permintaan lama tidak dikonversi menjadi pembayaran.
- Harga, tujuan transfer, dan masa aktif disalin dari database ke pesanan. Satu pesanan per draft; verifikasi wajib dilakukan admin dan nominal harus cocok.
- Publikasi memakai salinan draft dengan persetujuan pemilik, alamat tetap, masa aktif, serta penarikan/pencabutan akses. Ada tautan personal, WhatsApp, dan cetak ringkasan.
- Foto tetap dalam bucket privat. Proxy server memeriksa publikasi, membatasi gambar dan mengubahnya ulang, tanpa membagikan path atau signed URL privat.
- Menambah pencatatan percobaan ulang pada sesi, pemeriksaan versi, dan audit. Penarikan/pencabutan tidak terhalang batas tindakan normal.
- Menambah daftar/filter pesanan, pengaturan rekening dan flag database. Bantuan lama dipisahkan pada halaman sendiri.
- Menambah 99 tes di atas 142 tes lama: 241 total. Decoder diuji melalui 9 fixture dan layout statis melalui 28 variasi.
- Instalasi/build lengkap, SQL nyata, browser Next.js, dan deployment tetap belum terverifikasi. Lihat TEST_REPORT.

## Riwayat sebelum 1.4.0

# Changelog

## 1.3.0 — 24 September 2026

- Studio editor lima langkah dengan live preview desktop/mobile; panduan dan privasi diperbarui.
- Multi-acara 1–3, tanggal/tempat/zona waktu terpisah dan kalender per acara; kompatibilitas draft legacy.
- Autosave debounced, satu writer, revision/last_request_id, exact-payload retry, tidak menimpa ketikan saat response datang.
- Pemulihan sesi tab per pemilik/ID, pilihan eksplisit, konflik dijeda, JSON backup/import tervalidasi tanpa credentials/status server.
- Unggah multi-foto berurutan, status parsial, atur urutan/sampul, URL sementara dimemori; perbaikan dimensi minimum canvas.
- ID draft baru stabil di URL; controller dikunci per pemilik/ID; gate skema 3 sebelum editor dibuka.
- Migration003 additive, mempertahankan001/002 serta pengaman simpan/hapus; tanpa reset data.
- 49 tes tambahan sehingga142 unit/mock/statis; inspeksi77 TS/TSX,7 modul inti,32 layout statis,7 tes Canvas terisolasi.
- Instalasi gagal EAI_AGAIN; build/full typecheck/live database belum terverifikasi. Tidak ada deployment atau aktivasi akun eksternal.

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
