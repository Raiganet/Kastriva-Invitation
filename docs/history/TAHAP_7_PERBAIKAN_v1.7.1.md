# Kastriva Invitation v1.7.1 — Perbaikan tahap 7

Tanggal: 24 September 2026. Basis: ZIP Tahap 7 v1.7.0, bukan proyek baru.

**Tidak ada migrasi SQL baru, fitur bisnis baru, perubahan harga, perubahan tema, atau aktivasi transaksi.** Skema database tetap **7**. Paket belum dinyatakan siap produksi; instalasi lengkap, build Next.js, dan Supabase live belum berhasil diverifikasi oleh penyusun.

## 1. Yang benar-benar berubah

- Adapter HTTP server kini membatasi durasi satu request sampai selesai membaca badan respons, juga ketika pemanggil menyertakan AbortSignal. Kode lama memilih salah satu sinyal dengan `init?.signal || AbortSignal.timeout(...)`, sehingga sinyal pemanggil dapat menggantikan deadline.
- Respons backend dibatasi maksimal 5 MiB saat dibaca, sebelum SDK mengubahnya menjadi Blob/JSON. Kode lama baru memeriksa ukuran foto setelah `.download()` selesai. Batas berlaku untuk respons berhasil maupun gagal, termasuk tanpa Content-Length atau dengan nilai palsu.
- Request SDK privat/anonim hanya boleh ke origin Supabase terkonfigurasi dan tidak mengikuti redirect. Client pelanggan/admin bersesi tetap memakai mekanisme lama; akses dan RLS tidak dilonggarkan.
- Diagnostik lokal membedakan dependensi belum terpasang, versi terpasang tidak cocok, kendala DNS, timeout, sertifikat, dan metadata versi tidak ditemukan.
- Persiapan lokal dapat menjalankan instalasi dan verifikasi kode demo secara berurutan, tanpa menjalankan SQL, deploy, atau mengubah flag layanan.
- Proses pengujian yang melewati deadline dihentikan beserta turunannya. Log dirangkai sebelum penyamaran pola key/token sehingga pecahan key lintas chunk tidak dicetak secara terpisah. Pemeriksaan log ini bukan jaminan semua data sensitif tersamarkan.

Adapter menggunakan Web Streams/fetch yang asli pada Node dalam tes, tetapi respons backend masih fixture. Integrasi SDK Supabase dan Next nyata tetap harus diuji setelah dependensi tersedia.

## 2. Pemasangan yang paling sederhana

Ekstrak ZIP ke folder baru. Jangan langsung menimpa folder kerja lama. Gunakan **Node 22.x**. Salin `.env.local` dari versi Next.js sebelumnya secara lokal hanya jika sudah benar. Jangan menyalin `node_modules`, `.next`, `.next-test`, `.env` Express lama, atau berkas credential ke GitHub/chat.

Buka PowerShell di folder berisi `package.json`:

```powershell
node -v
npm run setup:local
```

Perintah ini:

1. Memastikan runtime Node sesuai.
2. Jika ada lockfile, memeriksanya sebelum menjalankan `npm ci`. Jika belum ada, menjalankan `npm install` sesuai versi manifest.
3. Membuat `.env.local` dari contoh hanya bila file tersebut **belum ada**. Isi konfigurasi yang sudah ada tidak ditimpa.
4. Memasang Chromium melalui Playwright lokal yang sudah terpasang.
5. Menjalankan `verify:release` pada mode demo yang menonaktifkan backend dan flag transaksi untuk pengujian.
6. Berhenti pada kegagalan, mencatat hasil di `.diagnostics/setup-report.json` dan log per langkah. Tidak melanjutkan ke deploy atau SQL.

Pemasangan npm menggunakan konfigurasi jaringan/proxy npm yang sudah ada; skrip tidak mengubah registry, TLS, DNS sistem, atau `.npmrc`. Pemeriksaan registry lewat Node bersifat terpisah dan tidak memblokir npm yang mungkin memakai proxy korporat.

**`npm ci` akan mengganti isi `node_modules`**, bukan source, database, atau environment. Gunakan folder baru sesuai instruksi. Instalasi dapat menjalankan lifecycle scripts dependensi sebagaimana npm biasa. Paket tidak menyertakan lockfile buatan; simpan dan commit `package-lock.json` yang benar-benar dihasilkan setelah diperiksa dan pengujian berhasil.

Lihat rencana tanpa memasang atau menulis konfigurasi:

```powershell
npm run setup:plan
```

Alternatif manual:

```powershell
npm install
npx --no-install playwright install chromium
npm run verify:release
```

Setelah pemeriksaan kode demo berhasil, `npm run dev` membuka aplikasi lokal menggunakan konfigurasi Diky. `npm run build` terpisah tetap diperlukan dengan environment yang akan dipakai pada deployment. Hasil `.next-test` adalah hasil demo, bukan build produksi dengan Supabase.

## 3. Diagnostik ketika instalasi gagal

```powershell
npm run diagnose
```

Tidak memerlukan dependensi aplikasi yang sudah terpasang. Membaca versi Node, manifest, paket lokal, dan format environment; melakukan GET metadata versi paket publik ke registry npm tanpa key Supabase atau akun npm. Nilai secret/config tidak ditulis ke laporan. Metadata versi yang tidak sempat diperiksa diberi **SKIP**, bukan PASS.

```text
.diagnostics/report.json
```

Untuk pemeriksaan tanpa jaringan:

```powershell
npm run diagnose:local
```

Hasilnya di `.diagnostics/local.json`. Pemeriksaan format konfigurasi bukan bukti Supabase terhubung. Range TypeScript/types diperiksa terhadap paket lokal, sedangkan resolusi range di registry tetap dikerjakan npm. Metadata satu versi yang ditemukan bukan bukti seluruh tree terpasang atau bebas kerentanan.

| Kode | Arti dan langkah |
|---|---|
| `DNS_UNAVAILABLE` | Mesin pemeriksa gagal me-resolve registry. Periksa koneksi/DNS/VPN setempat; ini tidak membuktikan versi paket tidak ada. |
| `PACKAGE_VERSION_UNAVAILABLE` | Metadata versi tidak ditemukan pada registry yang diperiksa. Catat paket/versi; jangan otomatis mengganti semuanya ke `latest`. |
| `PACKAGE_NOT_INSTALLED` | Paket belum ada di `node_modules` proyek. TypeScript global tidak menggantikan Next/React/Supabase yang belum terpasang. |
| `TLS_VERIFICATION_FAILED` | Periksa sertifikat, jam sistem, dan proxy. Jangan menonaktifkan verifikasi TLS/strict-ssl. |
| `DEPENDENCY_CONFLICT` | npm menemukan versi yang tidak cocok. Jangan memakai `--force`/`--legacy-peer-deps` sebagai cara menyembunyikan masalah. |
| `NETWORK_TIMEOUT` | Koneksi belum selesai sebelum batas waktu. Ulangi setelah jaringan diperiksa; tidak ada klaim paket hilang. |

Sebelum membagikan log, tetap tinjau dan hapus key/password/token/email/tautan tamu lengkap yang mungkin berada di keluaran paket pihak ketiga. Jangan membagikan `.env.local` atau `.npmrc`.

## 4. Database dan environment

**Bila sudah memakai skema 7, tidak perlu menjalankan SQL apa pun untuk patch ini.** Tidak ada file 008. Tetap pakai proyek Supabase Invitation yang sama. Source patch tidak menghubungi akun Diky saat disusun.

Jika belum sampai tahap 7, lengkapi prasyarat 001–007 secara berurutan pada staging, dengan backup dan prosedur pemeliharaan pada `docs/TAHAP_7_RILIS.md`. Jangan menjalankan ulang 001–006 pada skema 7; jangan melonggarkan akses anonim untuk menutup error.

Tidak ada key/flag baru. `SUPABASE_SECRET_KEY` dan `RATE_LIMIT_HMAC_KEY` tetap server-only. Bucket `ki-media` tetap privat. Nilai bawaan checkout, undangan publik, dan RSVP tetap false. Patch tidak mengganti tema/harga/pesanan atau menerbitkan konten.

## 5. Uji setelah dependensi berhasil dipasang

- `npm run verify:release`: lock, paket lokal, unit, sintaks, batas kode client/server, typecheck, build demo, decoder, browser demo. Berhenti pada langkah pertama yang gagal. Laporan `.release/report.json` bukan sertifikat produksi.
- `npm run check:supabase` dan `/setup`: setelah konfigurasi benar, harus membaca skema 7. `/admin/rilis` masih merupakan pemeriksaan metadata, bukan pengujian dua akun.
- Uji SQL terisolasi dan checklist staging lama tetap wajib: daftar/konfirmasi, dua akun, upload, save/reload, checkout, verifikasi manual, publish, tautan tamu, RSVP, moderasi, CMS publish, dan penarikan akses.
- Uji tambahan patch: foto valid tetap tampil; timeout/503 tidak dianggap transaksi gagal pasti; retry memakai request yang sama; respons lebih besar ditolak; private bucket tidak dijadikan public.

Pada lingkungan penyusunan, 543 tes unit/simulasi/kontrak lulus, tetapi registry tidak tersedia, instalasi dihentikan, build belum ada, dan tidak ada tes Supabase nyata. Lihat `docs/TEST_REPORT.md` untuk batas yang rinci.

## Rujukan teknis

Rujukan berikut menjelaskan mekanisme platform, bukan membuktikan hasil deploy:

- https://docs.npmjs.com/cli/v10/commands/npm-ci/
- https://supabase.com/docs/reference/javascript/initializing
- https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
- https://nextjs.org/blog/nextjs-security-update-september-22-2026
