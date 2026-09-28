# Hasil pengujian — Kastriva Invitation v1.7.3

Tanggal: 24 September 2026. Basis ZIP v1.7.2. Runtime Node 22.16.0, npm 10.9.2, TypeScript global 5.8.3.

## Status

**652 tes fungsi/simulasi/kontrak lulus. Build Next.js tetap belum berhasil dan gerbang rilis BERHENTI.** Tidak ada pengujian Supabase live, PostgreSQL engine, browser React/Next lengkap, CI atau deployment pada akun Diky. Tidak ada uang, pesan, akun atau data pelanggan yang diubah.

## Pemeriksaan aktual

| Pemeriksaan | Hasil | Batas makna |
|---|---|---|
| Baseline v1.7.2 `npm test` | 618/618 lulus | Dijalankan sebelum perubahan. |
| v1.7.3 `npm test` | **652/652 lulus**, 0 gagal/skip | 618 tes lama (kontrak hook dipindah ke controller) + 34 tes baru. Bukan 652 operasi Supabase nyata. |
| Sintaks/import lokal | **165 TS/TSX**, 0 error | Parser/transpiler TS 5.8.3, bukan typecheck Next lengkap. |
| Batas browser/server | **31 client roots, 135 source files**, 0 temuan statis | Analisis graf import, bukan bundle atau audit independen. |
| Strict semantic check kode transaksi | Lulus | 4 entry file baru/diubah dan dependensi logika lokal; tipe Node dari tooling lokal. Tidak mencakup hook React/Next/SDK. |
| Reproduksi HTTP 408 pada fungsi asli | Baseline `rejected`; patch `uncertain` | Response Node terinjeksi, bukan respons Supabase. |
| Reproduksi body tidak selesai | Baseline masih pending pada observasi 40 ms; patch selesai `uncertain` dengan deadline uji 20 ms | Stream terinjeksi yang tidak mengikuti abort/cancel; bukan pengukuran waktu browser normal. |
| Instalasi npm terbatas, ignore-scripts | STOP timeout 18 detik, exit 124 | Tidak menghasilkan instalasi atau lockfile tervalidasi. |
| `npm run diagnose -- --registry-only` | FAIL, DNS_UNAVAILABLE, exit 1 | Probe nyata; tidak menyimpulkan paket tidak ada atau laptop Diky bermasalah. |
| `npm run typecheck` seluruh aplikasi | FAIL, exit 2 | Dependensi/tipe Next/React/Supabase belum terpasang. Error lain dapat muncul setelah instalasi. |
| `npm run build` | FAIL, exit 127 | Prebuild demo lulus; `next: not found`. |
| `npm run verify:release` | STOP pada `check:lock`, exit 1 | Mekanisme berhenti bekerja, bukan rilis lulus. |
| Browser aplikasi / SQL / Supabase / CI / Vercel | **Belum dijalankan** | Tidak ada screenshot E2E atau klaim integrasi live baru. |

Log terbaru ada pada `docs/test-results/stage7fix3/`. Percobaan awal tes baru mempunyai kurung penutup yang kurang pada helper tes; diperbaiki sebelum seluruh 652 tes dan syntax dijalankan ulang. Log awal disimpan terpisah. Hasil unit final adalah `unit-final.log`.

## Cakupan tes baru

22 tes controller menguji journal-before-send, double click, snapshot immutable, callback sync/async gagal, lifecycle stop/start, respons lama, ganti akun, pemulihan catatan v1, penyimpanan diblokir, kegagalan hapus catatan, compare-before-clear, penolakan pasti, ACK salah dan gabungan controller dengan transport sebenarnya.

12 tes transport menguji deadline fetch/body dengan implementasi yang mengabaikan abort, cancel tidak selesai, byte aktual dan Content-Length palsu, UTF-8 invalid/split, redirect, endpoint rusak, HTTP 408, dan stream error. Fetch/storage diganti adapter memori/Response Node; kode controller/transport adalah implementasi proyek, bukan salinan model terpisah.

Hook React berlangganan controller melalui useSyncExternalStore dan mengaktifkan lifecycle pada effect. Kesesuaian kode dengan runtime React/Next dan pergantian halaman asli **belum diuji**. Tes tidak membuktikan kebijakan RLS telah dipasang atau bank menerima dana.

## Temuan dan tindakan

Kode lama dapat melewati reset busy bila callback refresh gagal; tidak memiliki penjagaan lifecycle untuk late response; melepas ref pending walaupun removeItem gagal. Ini temuan penelaahan kode, bukan laporan insiden produksi. Controller baru mengatasi kasus-kasus tersebut pada tes terisolasi. HTTP 408 dipertahankan sebagai hasil belum pasti. Batas byte diterapkan sambil membaca body, dan redirect ditolak pada fetch.

## Pelestarian

Migration 001–007, kedua JSON tema/harga, `.env.example`, dan seluruh dependency/devDependency dibandingkan dengan ZIP input dan tetap identik. Versi aplikasi 1.7.3; skema tetap 7. Tidak ada file SQL baru atau key baru. Tidak ada database pelanggan diimpor.

ZIP tidak memuat `.env.local`, `.npmrc`, token nyata, node_modules, .next/.next-test, tsbuildinfo, database, font, atau lockfile fiktif. Lihat `SOURCE_PROVENANCE.json`, `CHANGED_FILES.json`, `OUTPUT_MANIFEST.json` dan `preservation.json`.

## Yang masih menghalangi rilis

Instalasi dan lockfile nyata, full typecheck/build, browser demo, SQL lokal, Supabase staging dua akun, seluruh alur transaksi, backup/restore, beban/kuota/retensi dan review keamanan masih perlu diselesaikan. Perbaikan transaksi ini **tidak menyelesaikan hambatan jaringan instalasi** dan tidak membuka layanan secara otomatis.
