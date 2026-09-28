# Hasil pengujian aktual — v1.8.0 / prioritas pertama audit

Tanggal: 28 September 2026. Basis: **Kastriva-Invitation-main.zip** dari Diky. Runtime pemeriksaan: Node22.16.0, npm10.9.2, TypeScript global5.8.3. Pin TypeScript aplikasi tetap ~5.9.3; versi global tersebut tidak dianggap versi SDK terpasang.

## Status

**Perbaikan source dan pengujian fungsi/kontrak selesai. Verifikasi rilis penuh belum lulus.** Build Next.js, PostgreSQL/Supabase nyata, dan browser aplikasi belum berhasil diuji di lingkungan penyusunan ini. Tidak ada deployment, pemasangan SQL, perubahan akun, transaksi uang, pengiriman email/pesan, atau aktivasi layanan pada akun Diky.

| Pemeriksaan | Hasil aktual | Batas arti |
|---|---|---|
| Baseline ZIP terbaru `npm test` | **686/686 lulus** | Dijalankan sebelum perubahan. |
| Suite akhir `npm test` | **711/711 lulus**, tanpa gagal/skip | Fungsi, respons HTTP simulasi, dan kontrak source. Bukan 711 transaksi Supabase. |
| `check:lock` | Lulus | Root metadata sesuai dan graph lock dipertahankan. Bukan audit keamanan dependensi. |
| `check:release-contract` | Lulus | 12 migrasi, 15 renderer, rencana 30 langkah SQL. **Tidak mengeksekusi SQL**. |
| `check:syntax` | **207 TS/TSX**, tanpa error sintaks/import lokal | Parser/transpiler TypeScript global5.8.3, bukan semantic build Next. |
| `check:security` | 43 client roots, 167 source files; tanpa temuan pada pemeriksaan statis | Tidak menggantikan audit keamanan/bundle atau uji eksploitasi. |
| Typecheck ketat modul baru dan tes terkait | Lulus | Root: release, database-capabilities, readiness, readiness.test, release-alignment.test; tidak mencakup React/Next/SDK. |
| Sintaks skrip MJS | Lulus | `node --check`, bukan eksekusi SQL atau koneksi layanan. |
| `check:env` | PASS mode demo | Konfigurasi backend kosong; bukan bukti terhubung. |
| Probe registry npm | **Gagal EAI_AGAIN**, exit1 | DNS registry gagal di lingkungan ini. Tidak menyimpulkan laptop Diky bermasalah atau versi paket tidak tersedia. |
| `npm ci` terbatas, tanpa install scripts/audit | **Tidak selesai; dihentikan setelah 14 detik** | Exit -9 karena pengaman timeout lokal. Tidak ada instalasi lengkap; bukan hasil build. |
| `typecheck` seluruh aplikasi | Gagal | Definisi node/react/react-dom belum terpasang. Error lain bisa muncul sesudah pemasangan. |
| `npm run build` | Gagal, exit127 | Prebuild demo lulus; `next: not found`. |
| `verify:release` | STOP pada `check:installed` | Lock dan kontrak rilis lulus, paket belum terpasang. Bukan persetujuan rilis. |
| `test:e2e` | STOP karena build demo belum ada | Test browser baru **belum dijalankan**, bukan gambar statis yang dianggap E2E. |
| `test:sql:local` tanpa opt-in | SKIP exit2 | Tidak ada perubahan database. |
| `test:sql:local` dengan opt-in fixture lokal | Gagal sebelum koneksi: `psql` tidak tersedia | **Tidak ada SQL yang dieksekusi pada engine**. |
| `check:supabase` tanpa konfigurasi | SKIP exit2 | Tidak menghubungi proyek Supabase. |
| CI GitHub, staging, Vercel, email, Storage | Tidak dijalankan | Source workflow/test bukan bukti layanan nyata telah diuji. |

Log akhir ada di `docs/test-results/v1.8.0/`. `commands.json` mencatat semua percobaan beserta exit code. `unit-before-guide-fix.log` menyimpan percobaan yang masih mengharapkan teks V1.7.0 di panduan admin. Ekspektasinya diperbarui agar mengikuti APP_VERSION, bukan menghapus tes. `unit-tests.log` adalah hasil akhir711.

## Perbaikan yang diperiksa

Pemeriksaan dasar akun tetap terpisah dari fitur. RPC diagnostik yang hilang, schema/kontrak salah, validator tambahan yang belum mendukung, katalog tidak dikenal/duplikat, dan balasan tidak valid tidak dianggap fitur siap. Semua tema boleh disembunyikan tanpa dianggap migrasi hilang; peringatan katalog kosong tetap ditampilkan.

Probe menjaga batas byte/waktu, jenis JSON, UTF8, redirect, dan pembatalan. Tes memakai Response/Streams nyata pada Node dengan metadata tiruan, bukan Supabase. Typecheck subset menemukan kemungkinan nilai config null pada closure; kode memperbaikinya dengan binding konfigurasi non-null setelah pemeriksaan. Ini bukan pelemahan validasi.

Health, ekspektasi Playwright, laporan release, dan runner SQL memakai versi package. Daftar migrasi terpusat mencegah migrasi baru dilewati diam-diam. Active README/panduan admin mengikuti 15 tema, 6 langkah editor, musik instrumental/hadiah yang sudah ada, dan migrasi tambahan.

## SQL dan browser: disiapkan tetapi belum dieksekusi

012 hanya membuat RPC metadata baca-saja, fixed search_path dan grant terbatas pada fungsi tersebut; tidak mengubah base schema, data, harga, status pembayaran, izin RPC tamu, atau flag layanan. Pemeriksaan perilakunya bukan ledger tanggal migrasi dan bukan sertifikat produksi. SQL wajib diuji pada engine/staging.

Runner SQL mencakup 001–012, fixture lama sebelum perubahan grant007, data sintetis lintas upgrade, harga/tagihan/expiry/published lama, CMS draft yang belum dipublish, tema nonaktif, legacy validator, serta repeat migrasi terakhir. Fixture persistent hanya di database lokal disposable yang namanya dikunci. Skrip mendokumentasikan bukan untuk SQL Editor produksi.

Playwright menggunakan 15 demo dari registry, Web Audio native yang dibuat setelah gesture dan ditutup setelah pause, disclosure rekening contoh, dan galeri React sebenarnya dengan gambar PNG sintetis. Route fixture dibatasi flag test, loopback origin, backend kosong, dan bukan Vercel. Semua ini **belum lulus runtime browser dalam pekerjaan ini**. Tidak ada screenshot baru yang dipakai sebagai bukti.

## Pelestarian dan batas cakupan

Seluruh migrasi001–011, kedua JSON katalog/referensi, contoh environment, aset publik dan renderer undangan dipertahankan. Graph dependency lock tidak berubah selain metadata version root; tidak ada upgrade paket menjadi latest. Hash dicatat di preservation.json.

Patch ini mengerjakan A02/A03/A04/A10 audit. Ucapan umum (A01), menu akun/progres (A06), kuota media/cleanup, CSP penuh, pemisahan legacy, dan bukti restore belum termasuk. Tidak ada klaim seluruh rekomendasi audit sudah selesai.

Keluaran tidak menyertakan node_modules, .env.local, .next/.next-test, secret nyata dari environment, font, atau backup database. Arsip source asli tidak diubah. Dokumen/source pengguna lama dipertahankan sebagai riwayat, bukan bukti hasil build versi baru.

Rujukan mekanisme pengujian browser: https://playwright.dev/docs/test-webserver . Rujukan tidak membuktikan test aplikasi ini sudah dijalankan.
