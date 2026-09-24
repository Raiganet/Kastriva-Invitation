# Hasil pengujian — Tahap 5 / v1.5.0

Tanggal: 24 September 2026. Basis: ZIP tahap 4 v1.4.0. Runtime Node 22.16.0, TypeScript global 5.8.3, Chromium lokal.

**Source tahap 5 dan pengujian parsial selesai. Full build Next.js, SQL engine, Supabase nyata, dan deployment belum terverifikasi.** Tidak ada perubahan ke akun GitHub/Vercel/Supabase Diky, pengiriman pesan/email, atau transaksi dana.

| Pemeriksaan yang dijalankan | Hasil aktual | Batas makna |
|---|---|---|
| `npm test` | **318/318 lulus**, 0 gagal/skip | Pure functions, HTTP mock, dan kontrak source; bukan 318 tes database nyata. |
| Syntax/import lokal | **128 TS/TSX**, 0 error | Transpile/parser TS5.8.3, bukan dependency-aware typecheck aplikasi. |
| Strict semantic check subset tahap 5 | **8 file**, 0 error | 5 modul logika (types, domain, commerce, guests, guest-transport) dan 3 file tes. Tidak termasuk React, Next handlers, atau SDK Supabase. |
| Layout statis | **24/24 tanpa overflow horizontal** | 6 fixture × 320/390/768/1440 px. Adapter TSX, bukan React/Next atau interaksi browser aplikasi. |
| Decoder foto regresi tahap 4 | **9/9 lulus** | Binary Sharp lokal0.34.1, bukan pin proyek0.35.4; tidak HTTP/Storage. |
| `check:env` tanpa kredensial | PASS mode demo | Bukan bukti backend terhubung. |
| `check:supabase` tanpa kredensial | SKIP exit2 | Tidak ada request ke Supabase. |
| `test:supabase` tanpa opt-in | SKIP exit2 | Pengaman mencegah perubahan akun/data; bukan uji RSVP. |
| `npm install` bounded | Timeout exit124 | Tidak selesai, tidak menghasilkan instalasi/lockfile tervalidasi. |
| Probe npm next16.3.6 | Gagal exit1 **EAI_AGAIN** | DNS registry.npmjs.org gagal. Tidak membuktikan versi tersedia/tidak tersedia. |
| `npm run typecheck` seluruh aplikasi | Gagal exit2 | Dependensi/definisi Next, React, SDK belum tersedia; tidak diklaim lulus. |
| `npm run build` | Gagal exit127 | Prebuild demo lulus, kemudian `next: not found`. |
| SQL005 + integration fixture | **Belum dijalankan** | Source review dan kontrak statis, bukan kompilasi/eksekusi PostgreSQL. |
| Browser Next, Auth, Supabase, WhatsApp aktual, concurrent requests multi-session | **Belum diuji live** | Wajib staging checklist. |

## Cakupan baru

241 tes baseline dipertahankan (ekspektasi versi aktif diperbarui ke5). Ditambahkan **77 tes**: payload tiap tindakan, kapasitas/batch, consent dan nama publik, token dan fragment, batas Unicode/karakter kontrol, parsing proyeksi, binding request/revision, session journal per-owner/per-guest, CSV formula/quoting, unknown HTTP/body/timeout, serta pemeriksaan kontrak keamanan source SQL/API.

HTTP mock menggunakan implementasi transport asli, tetapi bukan server Next atau RPC Supabase. Pemeriksaan source memastikan guard tertulis, bukan membuktikan guard telah dipasang di database. Hook journal ditinjau dan diperiksa kontraknya; interaksi useEffect/state/sessionStorage origin aplikasi tidak diuji dengan runtime React nyata.

## Perbaikan selama pemeriksaan

Dua halaman editor dan halaman checkout masih mengunci skema4; diperbarui ke5. Pesan setup/editor/health diperbarui. Penanganan HTTP404 readiness yang sempat salah diubah menjadi504 saat upgrade sudah dikoreksi dan diuji. Tes kontrak skema lama diselaraskan dengan5 tanpa menghapus tesnya.

Tombol navigasi ke acara pada undangan publik sekarang menggulir tanpa menimpa fragment akses RSVP. Parser ack yang gagal setelah mutasi mengembalikan503 agar klien mempertahankan retry, bukan menganggap write pasti gagal. Penambahan batch mereset form hanya setelah server mengonfirmasi. Aturan SQL teks diselaraskan dengan unit UTF16/karakter kontrol agar pemanggilan RPC langsung tidak membuat data yang merusak pembacaan daftar.

## Tampilan yang benar-benar diperiksa

Fixture: daftar dengan tamu/ucapan, keadaan kosong/tertutup, RSVP berizin, RSVP privat, tema gelap, pengaturan admin. Screenshot memuat label **CONTOH STATIS/FIXTURE**. Foto/nama/status pada fixture bukan data pelanggan dan bukan hasil penyimpanan server.

Adapter mengeksekusi render TSX dengan hook tiruan, lalu `page.set_content` di Chromium dengan CSS asli. Tidak menguji hydration, klik, router, perubahan state, pengiriman, clipboard, WhatsApp, autentikasi, atau akses database. Screenshot desktop buku tamu dan formulir mobile terang/gelap diperiksa visual. Input/helper text tema gelap disesuaikan agar terbaca.

Log tahap ini: `docs/test-results/stage5/`. Log percobaan gagal sebelum perbaikan tetap diberi nama terpisah; hasil unit final ada di `unit-tests.log`. Log/skrinshot tahap1–4 adalah riwayat, bukan hasil tahap5. Alat reproduksi subset ada di `docs/testing-tools/`.

## Data dan keamanan keluaran

Migration001–004 dan dua JSON katalog diverifikasi identik byte-for-byte dengan input tahap4; hasil SHA256 ada di `preservation.json`. Optional test SQL004 hanya diperbarui prasyarat kompatibilitas skema5, bukan migration004. Tidak ada database pelanggan yang diimpor atau diubah. Harga/theme referensi tidak diubah. Buku tamu baru tidak memberi role admin akses daftar pelanggan lain melalui aplikasi, tetapi operator database/secret berhak tinggi tetap berbeda.

Tidak disertakan `.env.local`, key/password nyata, `node_modules`, `.next`, tsbuildinfo, database lokal, atau berkas font. Package pin dipertahankan; resolusi/audit dependensi dan lockfile belum terverifikasi. Dokumen dan laporan tahap4 disimpan sebagai sejarah; panduan aktif adalah `TAHAP_5_TAMU_RSVP.md`.

## Batas sebelum rilis

Source bukan bukti seluruh platform siap produksi. Wajib full install/typecheck/build, migrasi staging, pengujian dua akun dan token anonim, uji konkurensi, lalu alur pembayaran/publikasi/RSVP nyata tanpa uang pelanggan. Perlu rate-limit HTTP terdistribusi, kuota/beban, dependency audit, backup/retensi/hapus data, dan review keamanan. Default baru `ENABLE_RSVP=false` serta flag databasefalse; checkout/publikasi tidak dinyalakan oleh paket.
