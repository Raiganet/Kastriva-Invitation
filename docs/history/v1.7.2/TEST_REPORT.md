# Hasil pengujian v1.7.2 — sesi akun dan logout

Tanggal: 24 September 2026. Basis `Kastriva-Invitation-Perbaikan-Tahap-7-v1.7.1.zip`.
Runtime pengujian Node 22.16.0, npm 10.9.2, TypeScript global 5.8.3; Sharp lokal 0.34.1 untuk regresi decoder.

## Status

**618 tes fungsi/simulasi/kontrak source lulus. Gerbang rilis tetap BERHENTI, bukan siap produksi.** Instalasi dependensi belum selesai, registry npm tidak dapat di-resolve dari runtime, dan build Next.js belum berhasil. Tidak ada pengujian Supabase live, engine PostgreSQL, browser aplikasi Next, atau deployment yang dilakukan dalam pekerjaan ini. Tidak ada perubahan akun/data Diky.

## Perintah yang benar-benar dijalankan

| Pemeriksaan | Hasil | Batas makna |
|---|---|---|
| Baseline v1.7.1 `npm test` | 543/543 lulus | Sebelum perubahan patch. |
| v1.7.2 `npm test` | **618/618 lulus, tanpa skip/gagal** | 543 tes lama + 75 tes baru. Fungsi, Response/Streams Node dan simulasi SDK/controller, bukan transaksi nyata. |
| `check:syntax` | **162 TS/TSX, 0 error sintaks/import lokal** | TypeScript 5.8.3; bukan semantic check Next/SDK. |
| `check:security` | **31 client roots, 134 source files, 0 temuan statis** | Graph import/pola; bukan audit independen atau pemeriksaan bundle Next. |
| Typecheck ketat subset ESNext/bundler | **10 file proyek, exit 0** | Dua modul baru, tiga file tes, lima dependensi logika lokal. Tidak mencakup komponen React, proxy, Next handlers atau tipe SDK produksi. |
| Decoder foto regresi | **9/9 lulus** | Sharp lokal 0.34.1, berbeda dari pin 0.35.4; binary fixture, bukan Storage/HTTP. |
| `check:env` | PASS mode demo, exit 0 | Tidak ada credential; bukan bukti backend terhubung. |
| `npm install` terbatas | **Timeout, exit 124** | Dihentikan setelah 18 detik; tidak ada instalasi/lockfile lengkap. |
| `npm run diagnose` | **STOP, exit 1; DNS_UNAVAILABLE** | Probe nyata gagal DNS, paket berikutnya dilewati. Tidak menyimpulkan versi paket tidak tersedia atau laptop Diky bermasalah. |
| `npm run typecheck` aplikasi penuh | **Gagal, exit 2** | Dependensi/tipe Next/React/SDK belum terpasang. Error lain dapat muncul setelah instalasi. |
| `npm run build` | **Gagal, exit 127** | Prebuild demo lulus; `next: not found`. |
| `npm run verify:release` | **STOP, exit 1 pada check:lock** | Bukan kelulusan rilis. |
| Supabase/Auth/RLS/Storage/browser Next/CI/Vercel | **Belum diuji** | Tidak ada klaim atau screenshot E2E baru. |

Log aktual: `docs/test-results/stage7fix2/`. Riwayat tes tahap terdahulu bukan bukti runtime patch ini. Typecheck subset pertama memakai NodeNext/CommonJS dan menolak `import.meta` pada fixture; konfigurasi perintah diperbaiki ke ESNext/bundler sesuai proyek. Ini bukan menonaktifkan typecheck atau menghapus tes. Log percobaan pertama disimpan terpisah.

## Cakupan tambahan yang berhasil

Pembedaan sesi hilang/ditolak dari outage, batas permintaan Auth, respons 5xx, salah konfigurasi API/proxy dan respons tidak dikenal. Akun valid hanya dikembalikan dari balasan SDK `getUser` yang sesuai; data user bersamaan dengan error tidak diberi akses. Pemeriksaan peran admin menerima hanya keputusan boolean tanpa error.

Tiga tes menggabungkan implementasi `verifiedUser` dengan `EditorController` aktual melalui adapter SDK/penyimpanan memori: outage tidak membuang pending save, pemulihan mengirim payload/ID semula, ketikan baru tidak tertimpa ACK versi lama, sedangkan sesi yang benar-benar hilang tetap menghentikan simpan. Tidak ada HTTP Next, cookie browser, atau database nyata pada tes tersebut.

Transport logout diuji dengan Response/Streams Node: exact JSON ACK, HTML200, status bukan 200, respons malformed/terpotong, ukuran terlalu besar, UTF8 invalid, slow body, fetch/cancel yang tidak selesai, dan larangan retry otomatis. Pemeriksaan source memastikan komponen baru memakai transport tersebut dan lock klik. Klik React dan navigasi browser sesungguhnya belum dijalankan.

Adapter fetch versi sebelumnya dipasang pada factory pengguna server/browser serta proxy; tes koneksi adapter yang sudah ada tetap lulus. Kesesuaian adapter dengan SDK yang terkunci masih memerlukan instalasi dan uji staging. Batas 15 detik adalah per fetch, bukan seluruh operasi SDK.

## Pelestarian dan keamanan keluaran

SHA256 membandingkan seluruh migrasi 001–007, katalog/referensi tema dan `.env.example` dengan ZIP input. Semuanya dipertahankan. Seluruh pin dependency/devDependency sama; skema tetap 7, versi aplikasi 1.7.2. Tidak dibuat lockfile fiktif.

ZIP lama tidak diubah. Paket final tidak memuat environment nyata, secret/password nyata, node_modules, `.next`, `.next-test`, font, tsbuildinfo, backup database, atau laporan diagnostik yang memuat credential pelanggan. Berkas fixture menggunakan nama/domain uji. Lihat `SOURCE_PROVENANCE.json`, `CHANGED_FILES.json`, dan `OUTPUT_MANIFEST.json`.

## Sebelum rilis

Instalasi + lockfile tervalidasi → typecheck/build lengkap → browser demo → SQL terisolasi → Supabase staging → uji dua akun dan seluruh alur → peninjauan keamanan/beban/backup/retensi. Tidak ada pembukaan layanan otomatis. Patch tidak mengklaim meluluskan tahap-tahap tersebut.
