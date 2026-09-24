# Kastriva Invitation v1.7.2 — sesi akun dan logout

Tanggal: 24 September 2026. Melanjutkan `Kastriva-Invitation-Perbaikan-Tahap-7-v1.7.1.zip`.

**Kode perbaikan dan pengujian parsial tersedia. Build Next.js, browser aplikasi, SQL/Supabase nyata, dan deployment belum terverifikasi.** Tidak ada perubahan pada GitHub, Vercel, Supabase, rekening, akun, atau data pelanggan Diky. Tidak ada fitur layanan yang diaktifkan.

## 1. Masalah yang diperbaiki

| Kondisi sebelumnya | Perubahan v1.7.2 |
|---|---|
| `apiUser` mengubah setiap error `getUser` menjadi 401, termasuk gangguan layanan. Editor memperlakukan 401 sebagai sesi habis dan melepas identitas permintaan tertunda. | Error jaringan, batas permintaan Auth, respons 5xx, dan respons tak dikenal dikembalikan sebagai 503. Editor mempertahankan ID serta payload untuk percobaan ulang. Sesi yang secara eksplisit hilang/dicabut tetap meminta login. |
| `requireUser` mengarahkan setiap kegagalan pemeriksaan akun ke login. | Hanya sesi hilang/ditolak yang diarahkan ke login. Gangguan layanan masuk ke halaman error dengan tombol Coba lagi. Halaman tetap tidak memberi akses tanpa verifikasi akun. |
| Gagal membaca peran admin dianggap bukan admin. | Hasil boolean `false` tetap ditolak. Error RPC atau respons yang bukan boolean dinyatakan belum dapat diperiksa; tidak ada akses tambahan. |
| Adapter pembatas koneksi hanya terpasang pada klien anonim dan klien secret server. | Adapter yang sama kini dipasang pada klien SDK pengguna di server, proxy penyegaran sesi, dan SDK browser. |
| Tombol logout menerima semua HTTP 2xx sebagai berhasil dan tidak mempunyai deadline pembacaan respons. | Logout hanya dikonfirmasi oleh HTTP 200, tipe JSON, dan objek tepat `{"ok":true}`. HTML200, redirect, respons terpotong/terlalu besar, dan timeout tidak dianggap berhasil. Klik ganda ditahan. |

Pemeriksaan akun tetap memakai `getUser()` dari SDK. Tidak diganti dengan identitas dari form, metadata signup, atau `getSession()`. Penanganan error tidak menciptakan izin akses ketika server tidak dapat dihubungi.

Pembatas SDK berlaku **per permintaan fetch**: maksimal 15 detik sampai seluruh respons terbaca, maksimum 5 MB, hanya origin Supabase yang dikonfigurasi, tidak mengikuti redirect. Ini bukan jaminan bahwa keseluruhan operasi SDK/form selesai tepat 15 detik; SDK dapat melakukan beberapa permintaan, retry, atau menunggu penguncian sesi. Upload dan WebSocket realtime bukan hal yang diverifikasi oleh uji patch ini.

Logout di browser memakai deadline 18 detik, termasuk badan respons, dan batas respons 2 KB. Jika hasil tidak pasti, tombol kembali dapat digunakan, tetapi jangan menganggap sesi sudah ditutup. Tidak ada pengulangan logout otomatis atau penghapusan token secara paksa oleh kode tombol.

## 2. Pemasangan

Ekstrak ZIP ke **folder baru**. Simpan v1.7.1 untuk cadangan. Salin `.env.local` dari proyek Next.js sebelumnya secara lokal hanya apabila sudah benar. Jangan salin `node_modules`, `.next`, `.next-test`, atau konfigurasi Express lama. Jangan mengunggah environment atau secret ke chat/GitHub.

Gunakan Node 22.x yang mutakhir. Di PowerShell pada folder yang berisi `package.json`:

```powershell
node -v
npm run setup:local
```

`setup:local` memasang dependensi, memasang Chromium, lalu menjalankan pemeriksaan kode/browser mode demo terisolasi. Ia berhenti jika ada langkah gagal; tidak menjalankan SQL, melakukan deployment, atau membuka transaksi. Kelulusan kode demo bukan kelulusan Supabase live.

Untuk instalasi yang sudah valid dan mempunyai lockfile yang telah ditinjau, pemasangan dapat menggunakan `npm ci`. Jangan membuat lockfile manual atau menyalin lockfile Express. Versi semua dependency/devDependency pada patch ini **sama dengan v1.7.1**, bukan upgrade massal ke `latest`.

Jika proses berhenti:

```powershell
npm run diagnose
```

Baca `.diagnostics/setup-report.json` atau `.diagnostics/report.json`. Jangan membagikan `.env.local`, `.npmrc`, token, atau tautan tamu lengkap. Penyaringan log adalah bantuan, bukan jaminan bahwa setiap data rahasia selalu terdeteksi; periksa berkas sebelum membagikan.

## 3. Database dan konfigurasi

**Tidak ada SQL tambahan, key baru, atau flag baru. Skema tetap versi 7.** Jika migrasi 007 sudah terpasang, jangan menjalankannya ulang untuk patch ini. Jika database belum sampai 007, ikuti `TAHAP_7_RILIS.md` dan urutan migrasi yang benar, dengan backup/staging terlebih dahulu.

Tidak ada perubahan pada isi migrasi 001–007, katalog tema/harga referensi, atau `.env.example`. Pertahankan proyek Supabase Invitation yang sama. Key server foto/publikasi dan HMAC yang sudah benar tetap dipakai. Jangan menjadikan bucket foto publik.

Pertahankan penutupan layanan sampai pengujian staging selesai:

```dotenv
ENABLE_ORDER_REQUESTS=false
ENABLE_CHECKOUT=false
ENABLE_PUBLIC_INVITATIONS=false
ENABLE_RSVP=false
```

Menutup flag environment hanya membatasi deployment tersebut; flag database tetap mempunyai fungsi terpisah sebagaimana dijelaskan pada tahap 4–7.

## 4. Uji setelah build dan koneksi berhasil

Gunakan akun uji dan draft uji pada staging, bukan transaksi uang pelanggan.

1. Daftar/konfirmasi/login seperti sebelumnya. Buka draft, edit dan simpan; muat ulang untuk memastikan data server.
2. Dengan DevTools/network interception pada staging, simulasikan API simpan mengembalikan JSON 503. Editor harus menampilkan kegagalan sementara, bukan memaksa login. Pastikan perubahan lokal tetap ada.
3. Pulihkan layanan lalu Coba simpan kembali. ID dan payload permintaan tertunda harus tetap sama. Ketikan yang lebih baru tidak boleh ditimpa oleh balasan lama.
4. Uji sesi yang benar-benar kedaluwarsa atau dicabut. Penyimpanan tetap harus diblokir dan akun pemilik diminta login; patch bukan bypass autentikasi.
5. Uji admin benar, akun biasa, dan kegagalan RPC hak admin. Akun biasa tidak boleh diberi akses; gangguan RPC tidak boleh ditampilkan sebagai keputusan peran yang sudah pasti.
6. Uji logout normal, klik cepat dua kali, respons HTML200, respons terpotong, dan koneksi terputus. Hanya ACK yang valid boleh memicu perpindahan ke login. Setelah logout normal, muat ulang halaman privat dan uji kembali akses server.

Jangan mematikan Auth, RLS, sertifikat HTTPS, atau mengganti secret produksi untuk mensimulasikan masalah. Tetap lakukan uji dua akun, token tamu, pembayaran manual, penerbitan, RSVP/consent, CMS/harga, foto privat, dan pemulihan backup dari checklist sebelumnya.

## 5. Yang tidak dinyatakan selesai

Paket ini bukan bukti instalasi/build Next.js berhasil, SQL terpasang, isolasi akun live teruji, atau layanan siap produksi. Tidak menambah musik, gateway pembayaran, QR check-in, kuota paket baru, atau retensi otomatis. Riwayat/catatan browser tetap mengikuti batas tahap sebelumnya; sessionStorage bukan backup permanen.

Pengujian aktual ada pada `TEST_REPORT.md`. Perbaikan error akun, adapter fetch, dan controller diuji memakai respons SDK/jaringan simulasi. Tidak ada pengujian runtime SDK versi terkunci atau browser React/Next yang berhasil dilakukan di lingkungan penyusunan.

## Rujukan teknis

Diperiksa 24 September 2026; rujukan mekanisme, bukan bukti konfigurasi Diky berhasil.
- Supabase Auth error codes: https://supabase.com/docs/guides/auth/debugging/error-codes
- `getUser` untuk pemeriksaan identitas server: https://supabase.com/docs/reference/javascript/auth-getuser
- Klien SSR/browser Supabase: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Build/typecheck Next.js: https://nextjs.org/docs/app/api-reference/config/typescript
