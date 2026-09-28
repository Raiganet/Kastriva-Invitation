# Hasil pemeriksaan — v1.9.0 / prioritas kedua

Tanggal: 28 September 2026. Basis ZIP v1.8.0 ditambah audio TS2352 fix dari GitHub `40725a8c369d64d2350243c1f9e248513f808283`; main masih pada commit tersebut ketika diperiksa kembali sebelum penyerahan. Runtime lokal Node 22.16.0, npm 10.9.2, TypeScript global 5.8.3. Pin proyek TS ~5.9.3, Next 16.3.6 dan SDK tidak diubah.

## Status sebenarnya

**Kode ucapan umum dan pembaruan navigasi telah disiapkan. Pengujian fungsi/simulasi/statis berhasil; build aplikasi baru, SQL engine, browser Next dan Supabase nyata belum terverifikasi.** Tidak ada commit, deployment, pemasangan SQL 013, aktivasi layanan, perubahan database pelanggan atau pengiriman ucapan live yang dilakukan dalam pekerjaan ini. Keberhasilan v1.8.0 yang dilaporkan Diky tidak dinyatakan sebagai kelulusan build v1.9.0.

## Hasil yang benar-benar dijalankan

| Pemeriksaan | Hasil | Batas makna |
|---|---|---|
| Suite proyek sebelum penambahan tes baru | 711/711 lulus | Baseline fungsi/simulasi/statis. |
| `npm test` akhir | **773/773 lulus**, 0 gagal/skip | 62 tes tambahan; bukan operasi database hidup. |
| `check:syntax` | **229 TS/TSX**, tanpa error sintaks/import lokal | TypeScript global, bukan semantic typecheck SDK/React. |
| `check:security` | **48 client roots, 187 file source**, tanpa temuan pada guard/import statis | Bukan audit independen atau bundle/pentest. |
| `check:lock` | Lulus | Manifest/lock cocok; bukan audit keamanan dependency. |
| `check:release-contract` | Lulus: **13 migrasi, 34 langkah, 15 renderer** | Memeriksa daftar dan keberadaan berkas; tidak menjalankan SQL. |
| Typecheck ketat modul logika | Lulus untuk 3 entrypoint baru beserta dependensi logika yang diimpor | `open-wishes`, `customer-journey`, `account-navigation`; tidak mencakup komponen/route Next atau SDK. |
| Chromium layout HTML statis | **28/28** tanpa overflow halaman pada 320/390/768/1440 px | Tujuh fixture; adapter TSX/hooks tiruan, bukan React/Next/hydration. |
| `check:env` | Lulus mode demo | Tidak menguji koneksi akun. |
| `npm ci` terbatas | Timeout exit 124, belum selesai | Tidak menghasilkan instalasi lengkap. |
| Probe `npm view next@16.3.6 version` | Gagal exit 1, **EAI_AGAIN** | DNS registry gagal di lingkungan penyusun, bukan diagnosis laptop/Vercel Diky. |
| Typecheck seluruh aplikasi | Gagal exit 2 | Tipe Next/React/Node/SDK tidak terpasang lengkap. Error lain tetap mungkin muncul setelah instalasi. |
| `npm run build` | Gagal exit 127 | Prebuild demo lulus, kemudian `next: not found`. |
| `verify:release` | STOP pada `check:installed` | Lock dan kontrak lulus, paket belum terpasang; bukan kelulusan rilis. |
| `test:e2e` | STOP, belum ada `.next-test/BUILD_ID` | Tidak menjalankan Playwright pada aplikasi. |
| `test:sql:local` dengan opt-in lokal | Gagal: `psql` tidak tersedia | Tidak menghubungi database apa pun. |
| SQL 013, lima tabel/RPC baru, konkurensi, UI live/Supabase | Belum dijalankan | Checklist lokal/staging disertakan, tidak dihitung sebagai tes lulus. |

Log akhir berada pada `docs/test-results/v1.9.0/`. `command-results.json` mencatat exit code. Percobaan subset awal memakai daftar lib tanpa `DOM.Iterable`; diperbaiki sesuai konfigurasi proyek. Sesudah `npm ci` yang terputus membuat folder tipe kosong, subset dijalankan dengan typeRoots kosong agar tidak memasukkan paket yang belum terpasang. Tidak dibuat tipe tiruan React/Next untuk menamai aplikasi lulus; pemeriksaan subset tetap hanya logika murni.

## Cakupan fungsi/simulasi

Tes baru mencakup input nama/pesan/izin, Unicode/karakter kontrol, penolakan field RSVP/role, receipt dan pengikatannya ke undangan/ID, ACK palsu atau berlebih, salinan permintaan untuk retry, proyeksi publik/privat, larangan mengesahkan pesan tanpa izin, validasi pengaturan/admin, endpoint yang dikenal, transport HTTP tiruan untuk retry identik, label navigasi, progres tiap status pesanan, flag environment, serta kontrak source SQL/gateway.

Pemeriksaan SQL secara teks memastikan guard/grant/lock/replay/kuota/default tertutup ditulis. **Ini tidak membuktikan sintaks PL/pgSQL, RLS atau operasi paralel sudah benar pada engine.** Runner SQL lokal kini memilih migration013 → test013 → ulang migration013 → test013. Test013 memuat fixture owner/B/admin, hak role, moderasi, kode salah/benar, erase/no-revival, layanan ditutup, quota, dan tidak berubahnya RSVP/nominal pesanan. Script dibatasi database `ki_isolated_test`; jangan dijalankan pada produksi.

## Cakupan browser dan inspeksi tampilan

`e2e/public-wishes.spec.ts` menambah tiga tes untuk halaman React fixture dengan HTTP interception: tanpa token/kehadiran, consent privat/default dan kode, retry identik sesudah503, serta penerimaan tertutup. Suite tersebut disiapkan tetapi belum berjalan pada runtime Next. Ia pun bukan tes Supabase jika kelak dijalankan, karena respons HTTP ditiru.

Inspeksi 28 layout menggunakan HTML hasil adapter minimal JSX, CSS asli, dan Chromium `set_content`. Tujuh fixture: ucapan terang, gelap, tertutup, moderasi dengan data, moderasi kosong, saklar admin, dan progres dua undangan. Nama/angka/status adalah **CONTOH STATIS**, bukan data pelanggan/server. Screenshot terang/gelap mobile dan moderasi desktop ditinjau. Tidak menguji klik, clipboard, sessionStorage origin aplikasi, keyboard/hydration atau penyimpanan. Kode alat reproduksi ada di `docs/testing-tools/render-v1.9.0.cjs`.

## Pelestarian dan perubahan

SHA-256 membandingkan **22 berkas** migrasi001–012, katalog/referensi/registry tema, aset public dan e2e audio terhadap basis. Semuanya identik; daftar ada di `preservation.json`. Semua pin dependency/devDependency dan engine sama. Hanya versi metadata aplikasi menjadi1.9.0. Base schema tetap7; protocol umum1. Harga/konten personal/database tidak diimpor atau diubah.

Runtime direktori app, components, lib, data, migrations, tests, scripts, e2e, manifest/config basis telah dicocokkan dengan Git tree HEAD sebelum modifikasi. Basis penuh tetap ZIP pengguna ditambah satu file audio, bukan klaim menyalin setiap file repository/riwayat Git. Dokumen/placeholder repository di luar ZIP bisa berbeda. Patch tidak menghapus aset atau file tambahan repository.

Berkas lama tidak diubah di tempat. Output tidak memuat `.env.local`, secret operasional, node_modules, build, cache, database, atau font. String kode/bearer dalam tes adalah fixture lokal; jangan menggunakannya sebagai key operasional. Legacy Express yang tidak aktif tetap dibawa dari source; pemisahannya bukan pekerjaan rilis ini.

## Batas rilis

Default baru `ENABLE_PUBLIC_WISHES=false` dan platform/undangan tertutup. CAPTCHA, edit ucapan anonim, gabungan feed/CSV RSVP, kuota media, retensi/penghapusan semua log/backup, uji beban dan restore tidak ditambahkan. Public wish sender bukan identitas terverifikasi. Penghapusan plaintext tetap meninggalkan ID/hash/marker; replay tidak membuka kembali konten. NAT berbagi kuota, key harian berubah, bukan rate-limit bergulir presisi atau anti-DDoS penuh.

Sebelum aktivasi: full install/typecheck/build → SQL lokal → staging dua akun/admin/anon → alur tanpa token/moderasi/receipt/retry → check media/tema lama dan pemulihan. Jangan memakai jumlah tes untuk mengklaim seluruh platform siap produksi.
