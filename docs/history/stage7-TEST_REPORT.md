# Hasil pengujian — Tahap 7 / v1.7.0

Tanggal: 24 September 2026. Basis ZIP tahap6 v1.6.0. Runtime Node22.16.0, TypeScript global5.8.3, Sharp lokal0.34.1.

## Kesimpulan yang sebenarnya

**492 tes fungsi/simulasi/kontrak source lulus, tetapi gerbang rilis BERHENTI dan aplikasi BELUM dinyatakan siap produksi.** npm install tidak selesai dalam batas waktu; probe registry menghasilkan EAI_AGAIN. Belum ada lockfile tervalidasi, Next.js build, semantic typecheck seluruh aplikasi, browser Next, engine PostgreSQL atau Supabase live yang berhasil diuji. Tidak ada perubahan akun GitHub/Vercel/Supabase, deployment, pesan/email, atau transaksi dana oleh penyusun.

| Pemeriksaan yang benar-benar dijalankan | Hasil | Batas makna |
|---|---|---|
| npm test | **492/492 lulus**, 0 gagal/skip | Fungsi, Web Streams nyata pada Node, transport simulasi, kontrak source. Bukan 492 transaksi Supabase. |
| check:syntax | **154 TS/TSX**, 0 error sintaks/import lokal | TypeScript global5.8.3, bukan dependency-aware typecheck. |
| check:security | **31 client roots, 131 source files**, 0 temuan pada pemeriksaan | Graph import statis dan pola server-only/gateway. Bukan audit keamanan menyeluruh/bundler runtime. |
| Typecheck ketat subset | **7 file terpilih lulus** | 4 modul baru (http-errors, request-guard, public-rate, launch-status) dan 3 file tes. Tidak mencakup React/Next/Supabase SDK. |
| node --check scripts | **11 MJS lulus** | Pemeriksaan parser, bukan seluruh eksekusi skrip. |
| Decoder foto regresi | **9/9 lulus** | Sharp lokal0.34.1, berbeda dari pin aplikasi0.35.4. Binary fixture, bukan upload/HTTP. |
| check:env tanpa credential | PASS demo, exit0 | Format kosong; tidak menyatakan Supabase terhubung. |
| check:supabase tanpa credential | SKIP exit2 | Tidak menghubungi backend. |
| npm install bounded, ignore-scripts | Timeout exit124 | Belum selesai; tidak menghasilkan instalasi/lockfile tervalidasi. |
| Probe npm view next@16.3.6 | Gagal EAI_AGAIN, exit1 | Registry tidak terjangkau dari runtime. |
| npm run typecheck penuh | Gagal exit2 | Definisi Next/React/Supabase belum terpasang; error turunan. Error lain tetap mungkin muncul setelah instalasi. |
| npm run build | Gagal exit127 | Prebuild demo lulus lalu `next: not found`. |
| npm run verify:release | **STOP exit1 pada check:lock** | Mekanisme berhenti berfungsi; ini BUKAN kelulusan gerbang rilis. `.release/report.json` disalin sebagai bukti. |
| npm run test:e2e | STOP exit1 | Tidak ada `.next-test/BUILD_ID`; browser aplikasi tidak dijalankan. |
| test:sql:local tanpa opt-in | SKIP exit2 | Tidak mengakses database. |
| test:sql:local dengan opt-in lokal | Gagal exit1 | psql client tidak tersedia; tidak ada database yang disentuh. |
| SQL007, RLS/RPC, konkurensi engine | **Belum dieksekusi** | Migration dan skrip PostgreSQL disediakan, bukan diklaim lulus. |
| Playwright UI, login, Supabase nyata, publikasi, RSVP/CMS | **Belum diuji end-to-end** | Suite demo disiapkan; checklist live tetap wajib. |
| Workflow GitHub/CI dan Vercel | **Tidak dijalankan pada akun Diky** | File workflow bukan bukti pipeline/deployment berhasil. |

Log aktual berada di `docs/test-results/stage7/`. `unit-first.log` dan `unit-second.log` adalah percobaan sebelum penyesuaian kontrak lama/regex inspeksi, bukan hasil akhir. Hasil akhir `unit-tests.log` berisi492 tes. Laporan/test tahap1–6 adalah riwayat; tidak digabung sebagai pengujian runtime tahap7. Tidak dibuat snapshot UI baru lalu disebut browser E2E.

## Perubahan yang diuji secara fungsi/statis

417 tes sebelumnya dipertahankan; **75 tes ditambahkan**. Ekspektasi skema aktif diperbarui ke7, sementara migration001–006 dipertahankan identik. Tes HTTP lama dialihkan untuk memeriksa modul validasi baru; pemeriksaan tidak dihapus untuk menghindari kegagalan.

Cakupan baru: Origin resmi/missing/cross-site/host palsu, JSON dan UTF-8 invalid, pembatasan byte nyata walau Content-Length palsu, stream lambat dan cancellation yang tidak selesai, header IP tepercaya tanpa fallback XFF, IPv6 yang setara, pseudonim harian/rotasi secret, format HMAC, ACK limiter yang gagal-tertutup, timeout dan429, konfigurasi private key, metadata audit, serta release runner yang tidak melewati kegagalan.

Satu pemeriksaan additive SQL awal keliru menafsirkan kata TRUNCATE pada daftar izin sebagai perintah menghapus data; pola diperbaiki agar memeriksa posisi perintah, bukan menghapus pengujian. Tes ini tetap **bukan parser/engine SQL**.

Graph client/server memeriksa static import/re-export lokal dan server-only yang ditetapkan, bukan seluruh dynamic import/dependency transitif npm. Tidak menggantikan build, pemindaian bundle, dependency audit, penetration test, atau pemeriksaan service-role key di deployment.

## SQL dan browser yang disiapkan, belum dijalankan

Harness PostgreSQL hanya mengizinkan database kosong bernama ki_isolated_test pada localhost:55432; tidak membaca environment Supabase atau menerima URL database nyata. Ia menjalankan migration001–006 dan fixture003–006, lalu007 dan fixture007 serta re-run007. Auth/storage minimal hanya membantu kompilasi SQL/RLS di engine, bukan Auth HTTP atau layanan Storage. Tes limiter di SQL bersifat sequential; uji banyak koneksi tetap staging.

Playwright memakai Next hasil build dan Chromium desktop/mobile, bukan adapter render statis. Cakupannya mode demo, navigasi, delapan tema, local RSVP, escaping dan API gate. Suite tersebut **belum berjalan di lingkungan ini**. Dua akun, pembayaran, CMS publish, token dan foto live tidak diuji oleh suite demo; lihat checklist staging.

## Perubahan kompatibilitas dan batas keamanan

007 mencabut EXECUTE role browser pada RPC publik, memakai gateway server dan limiter database. SUPABASE_SECRET_KEY kini dibutuhkan semua undangan/RSVP publik, ditambah RATE_LIMIT_HMAC_KEY32byte acak. Bucket tetap privat. Jalur pemilik/admin tetap memakai sesi pengguna sebenarnya. Kode1.6 tidak cocok untuk publik setelah007; jangan downgrade/mengembalikan grant publik untuk menyembunyikan error.

Budget per jaringan/jendela tetap bukan anti-DDoS. NAT/Wi-Fi berbagi kuota, banyak IP dapat melewatinya, midnight/window memungkinkan burst. Tabel50.000 baris dan cleanup bertahap membatasi pertumbuhan, bukan retensi otomatis tepat24jam. Secret yang bocor tetap berbahaya; HMAC bukan anonimisasi. Endpoint admin/Auth/Storage tidak mendapat rate-limit HTTP menyeluruh dari patch ini.

No-store/no-referrer dan validasi Origin ditambah, tetapi CSP penuh dengan nonce, CAPTCHA, quota total Storage, cleanup foto/akun, retensi otomatis, uji beban, pemulihan backup, dan audit independen masih belum selesai. Kelulusan tes source tidak membuktikan keamanan produksi.

## Pelestarian dan asal paket

SHA256 memverifikasi migration001–006 serta kedua JSON tema/harga referensi sama dengan input tahap6. Tidak ada database pelanggan diimpor. ZIP lama tidak diubah. File keluaran tidak menyertakan environment nyata, node_modules, .next/.next-test, font, atau backup database. Tidak dibuat package-lock fiktif. Password PostgreSQL pada compose adalah fixture lokal eksplisit, bukan credential akun.

Next16.3.6 dipertahankan; keberadaannya dan pembaruan keamanannya diverifikasi pada pengumuman resmi22September2026. Pin paket produksi lain dipertahankan. Playwright1.63.0 ditambahkan untuk pengujian, tetapi kombinasi dependency belum terpasang/ter-audit di runtime ini. Keberadaan versi di pengumuman bukan kelulusan build.

## Gerbang berikutnya

Hasil rilis saat ini **NO-GO / belum lolos**, bukan semua tujuh tahap selesai produksi. Selesaikan install + lock, build/types, browser demo, SQL lokal, kemudian Supabase staging, dua akun, alur bisnis, beban dan backup/restore. Simpan hasil setiap gerbang, lalu pemilik menilai kesiapan operasional sebelum membuka layanan.

Referensi:
- https://nextjs.org/blog/nextjs-security-update-september-22-2026
- https://supabase.com/docs/guides/database/functions
- https://vercel.com/docs/headers/request-headers
- https://playwright.dev/docs/test-webserver
