# Hasil pengujian v1.7.1 — Perbaikan tahap 7

Tanggal: 24 September 2026. Basis: `Kastriva-Invitation-Tahap-7-v1.7.0.zip`.
Runtime: Node 22.16.0, npm 10.9.2, TypeScript global 5.8.3. Source library Next/React/Supabase pin tetap dipertahankan.

## Kesimpulan

**Perbaikan kode dan alat diagnosis tersedia, tetapi build Next.js, instalasi lengkap, PostgreSQL/Supabase live, dan deployment belum terverifikasi. Paket belum disetujui untuk produksi.** Tidak ada perubahan akun GitHub/Vercel/Supabase, transaksi, pengiriman pesan, atau pemindahan data pelanggan.

## Perintah yang benar-benar dijalankan

| Pemeriksaan | Hasil | Batas arti |
|---|---|---|
| `npm test` | **543/543 lulus**, tidak ada skip/gagal | 492 tes sebelumnya + 51 tes patch. Fungsi, Web Streams Node, fixture HTTP, subprocess lokal, dan kontrak source; bukan 543 transaksi live. |
| `check:syntax` | **157 TS/TSX**, 0 error sintaks/import lokal | TypeScript global 5.8.3 via NODE_PATH; bukan semantic check Next/React lengkap. |
| `check:security` | **31 client roots, 132 source files**, 0 temuan statis | Bukan bundler runtime atau audit independen. |
| Strict subset | **4 file TS + deklarasi modul pendukung**, exit 0 | http-errors, backend-fetch, dua test patch; menggunakan types Node lokal. React/Next/SDK tidak termasuk. |
| Sintaks MJS | Seluruh skrip MJS lolos `node --check` | Parser saja. |
| Tes decoder regresi | **9/9 lulus** | Sharp lokal 0.34.1, bukan pin proyek 0.35.4. Tidak menguji Storage/HTTP nyata. |
| `diagnose:local` | **STOP exit 1** | Benar mendeteksi dependensi lokal/lock belum ada. Ini bukan lolos kesiapan. |
| `diagnose` | **STOP exit 1**, `DNS_UNAVAILABLE` | DNS registry npm gagal; paket berikutnya SKIP, bukan dianggap tidak tersedia. |
| `npm install` terbatas, `--ignore-scripts` | **Timeout exit 124** | Dihentikan setelah batas waktu pengujian. Tidak menghasilkan instalasi/lock yang lengkap. |
| `npm run typecheck` seluruh aplikasi | **Gagal exit 2** | Next/React/Supabase/types belum tersedia; error lain tetap mungkin muncul setelah instalasi. |
| `npm run build` | **Gagal exit 127** | Prebuild demo lulus, kemudian `next: not found`. Tidak ada build produksi yang berhasil. |
| `npm run verify:release` | **STOP exit 1 pada check:lock** | Runner berhenti, bukan seluruh pemeriksaan berhasil. |
| `npm run setup:plan` | **PASS rencana saja** | Tidak menjalankan setup lengkap, tidak menulis `.env.local`, tidak memasang browser. |
| PostgreSQL, Supabase, browser Next, CI/Vercel | **Belum dijalankan** | Tidak ada klaim hasil atau screenshot E2E baru. |

Log ada di `docs/test-results/stage7fix/`. Status exit juga dicatat dalam `command-results.json`, termasuk log instalasi yang kosong sebelum timeout. Log tahap lain adalah riwayat. Tidak dibuat `package-lock.json` fiktif atau shim Next/React untuk menamai build sebagai berhasil.

## Cakupan patch

21 tes adapter backend menguji batas byte aktual, Content-Length palsu/absen, banyak chunk, respons error, pembatalan pemanggil, deadline yang tetap berlaku dengan signal lain, koneksi/badan yang tidak selesai, cancel yang tidak selesai, redirect, origin lain, penyamaran error, serta header setelah decoding.

30 tes diagnostik/runner menguji klasifikasi DNS vs versi paket, semver terbatas sesuai manifest, metadata registry yang salah, timeout metadata, batas metadata, redaksi token termasuk key terpotong antar-chunk, exit code, argumen tanpa shell, proses yang tidak berhenti secara normal, serta rencana installer tanpa mutasi. Subprocess benar-benar berjalan pada Linux; cabang penghentian proses Windows disiapkan, **belum diuji pada Windows**. Tes probe registry memakai fixture kecuali perintah `diagnose` terpisah yang benar-benar menemui kegagalan DNS.

Adapter dipasang pada factory SDK server anonim dan privat. Jalur user/admin tetap memakai sesi aslinya. SDK produksi belum terinstal, sehingga kesesuaian adapter dengan versi SDK yang dikunci harus diuji lagi. Tidak ada perubahan SQL atau kelonggaran RLS.

`setup:local` otomatisasi tersedia tetapi **alur penuhnya belum lolos** di lingkungan ini. Pengujian rencananya bukan bukti npm install, download Chromium, build, atau browser berhasil.

## Pelestarian sumber

Ketujuh migration 001–007, kedua JSON katalog, `.env.example`, dan semua versi dependency/devDependency dibandingkan terhadap input. Semuanya tetap sama. Versi aplikasi berubah dari 1.7.0 menjadi 1.7.1; skema tetap 7. Daftar dan SHA256 ada di `preservation.json`.

Tidak ada secret nyata, `.env.local`, font, node_modules, build, ataupun backup database yang dibundel. Laporan baru menggantikan laporan aktif; laporan sebelumnya disimpan di `docs/history/`.

## Yang masih menghalangi rilis

Instalasi beserta lockfile nyata → full typecheck/build → browser demo → SQL terisolasi → Supabase staging → dua akun dan seluruh alur bisnis → peninjauan beban/backup/retensi. Pengamanan HTTP bukan anti-DDoS penuh. Kuota total Storage, penghapusan akun/retensi, musik, gateway pembayaran dan fitur lanjutan lain belum ditambahkan oleh patch ini.
