# Changelog

## 1.7.3 — 24 September 2026

- Kontrol transaksi terpisah per akun/entitas, penjagaan lifecycle dan snapshot retry immutable.
- Callback tampilan gagal tidak menggagalkan ACK atau meninggalkan busy; journal cleanup gagal menahan operasi baru.
- HTTP 408 tetap belum pasti; transport menolak redirect/UTF-8 invalid serta membatasi byte dan deadline body.
- 652 tes unit/simulasi/kontrak lulus; build/SQL/live belum terverifikasi. Tidak ada SQL/key baru, skema tetap 7.

# v1.7.2 — 24 September 2026

- Bedakan kegagalan layanan akun dari sesi yang benar-benar hilang; pertahankan pending save saat respons 503.
- Batasi fetch SDK pengguna server/browser dan proxy dengan adapter origin/deadline/ukuran yang sama.
- Bedakan kegagalan RPC peran admin dari keputusan boolean false, tanpa melonggarkan akses.
- Logout memerlukan JSON ACK tepat, batas waktu/badan respons, tidak mengikuti redirect, dan pengaman klik ganda.
- Tambahkan 75 tes: total 618 lulus. Build penuh dan Supabase live belum terverifikasi.
- Tidak ada SQL/key baru; migrasi 001–007, katalog dan pin paket dipertahankan.

# v1.7.1 — 24 September 2026

- Batas waktu dan byte respons backend ditegakkan sampai pembacaan selesai; sinyal pembatalan pemanggil tidak menggantikan deadline.
- SDK server anonim/privat menolak redirect dan tujuan di luar origin proyek.
- `diagnose`, `diagnose:local`, `check:installed`, `setup:plan`, dan `setup:local` ditambahkan. Skrip tidak menjalankan SQL/deploy atau menimpa `.env.local` yang sudah ada.
- Runner subprocess menghentikan tree pada timeout, merangkai log sebelum redaksi, dan menghapus status PASS lama saat memulai pemeriksaan baru.
- 51 tes ditambahkan, 543 total lulus pada pengujian fungsi/simulasi/kontrak. Build lengkap tetap belum terverifikasi.
- SQL001–007, tema, harga, dan versi dependency dipertahankan.

# v1.7.0 — Tahap 7 (24 September 2026)

- Gateway publik server-only, shared database request budgets dan grant RPC yang diperketat melalui migration007.
- JSON streamed byte/deadline limits dan Origin resmi, no-store/no-referrer jalur sensitif.
- Admin /admin/rilis, health liveness jujur, semua gate schema7.
- Release runner berhenti saat gagal; lock integrity, static client/server graph, actual Playwright suite dan isolated PostgreSQL harness/CI ditambahkan.
- Tambahan key RATE_LIMIT_HMAC_KEY; server Supabase key diperlukan seluruh undanganpublik, bucket tetap privat.
- Migrasi001–006 dan datareferensi dipertahankan; tidak ada akun/data eksternal disentuh.
- Build, SQL dan browser nyata belumterverifikasi. Lihat laporan pengujian aktif.

# v1.6.0 — 24 September 2026

- CMS teks/FAQ/kontak/SEO dan metadata8 tema, manual draft/preview/publish, sejarah dan JSON.
- SQL006 additive, admin+confirmed email, RLS/revoke, transaksi, revision/retry, rate30/min, sidik livecatalog dan rowlocks.
- Landing/header/footer/katalog/harga/pilihan/editor dari database; tidak ada fallback harga diam-diam ketika backend gagal.
- Harga pesanan lama tidak diubah; tema nonaktif masih bisa dipakai draftlama yang sama, tidak otomatis mencabut publikasi.
- Admin overview dan sales-only customer directory; tidak membuka seluruh Authusers atau draft/guestbookprivate.
- Metadata+robots mengikuti CMS; defaulttertutup. Tombol refreshkonflik, guardretry dan teks panjangmobile dirapikan.
- 417 tes fungsi/mock/source;143file syntax;8file semantic subset;40staticlayouts;9decoderregression. Fullbuild/SQLlive belumterverifikasi.
- Migration001–005 dan referensi katalog/harga tetap identik. Tidak deploy, uang, atau perubahan akuneksternal.

# v1.5.0 — 24 September 2026

- Tahap5 buku tamu privat, batch/pencarian/paginasi/kapasitas, bearer links fragment, manual WhatsApp, CSV.
- Satu RSVP per tamu, batas jumlah, ucapan private/consent/moderasi/revokasi, pergantian token/nonaktif.
- SQL005 additive, owner-only RPC, default platform gatefalse, transaksi/version/retry/rate bounds, text Unicode/control guards.
- Public form hanya pada undangan valid; interaksi scroll acara menjaga tokenfragment; tidak membingungkan linkumum dengan RSVP.
- Server/client parsers, retained journal, schema5 diagnostics, admin gate/panduan.
- 318 tests,128 syntaxfiles,8-file semantic subset,24 static layouts; full build/database belumterverifikasi.
- Migrations001–004, tema dan harga dipertahankan. Tidak deploy, transaksiuang, pesan, atau perubahan akun eksternal.

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
