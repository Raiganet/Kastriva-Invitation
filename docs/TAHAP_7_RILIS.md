> **Riwayat tahap sebelumnya.** Untuk pemasangan sekarang gunakan `UPGRADE_v1.8.0.md`: schema dasar tetap 7, fitur008–011 dan diagnostik012. Jangan memakai nomor versi atau keterangan fitur lama di bawah untuk downgrade.

> **Patch v1.7.1:** ikuti `TAHAP_7_PERBAIKAN.md` untuk instalasi dan diagnostik terbaru. Patch tidak menambah SQL setelah 007. Dokumen berikut menjelaskan tahap 7 dasar.

# Kastriva Invitation — Tahap 7 / v1.7.0

Tanggal paket: 24 September 2026 (WIB). Basis: ZIP tahap 6 v1.6.0. **Source hardening dan alat verifikasi ditambahkan; belum merupakan kelulusan produksi.** Akun GitHub, Vercel, Supabase, rekening, dan data pelanggan tidak disentuh oleh penyusun.

## A. Pemasangan kode dahulu

Ekstrak ke folder baru. Jangan menimpa satu-satunya salinan tahap 6. Salin `.env.local` dari Next.js sebelumnya secara lokal hanya jika benar. Jangan salin `.env` Express, `node_modules` atau `.next`. Gunakan Node **22.x**.

```powershell
node -v
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm install
npx --no-install playwright install chromium
npm run verify:release
```

Hentikan pada error; PowerShell tidak selalu menghentikan rangkaian perintah setelah satu program gagal. Jangan mematikan pemeriksaan tipe. Jangan membuat `package-lock.json` manual atau mengganti semua paket ke `latest`. Simpan hasil lockfile setelah dihasilkan npm, review, kemudian commit bersama kode. Untuk instalasi berikutnya gunakan `npm ci`.

`verify:release` menjalankan **check:lock → check:env → test → check:syntax → check:security → typecheck → build → test:media → test:e2e**. Urutannya berhenti pada kegagalan pertama. Laporan `.release/report.json` mencatat langkah yang benar-benar berjalan, termasuk `passed=false` bila berhenti. Credential Supabase dikosongkan dan flag layanan ditutup hanya dalam child process pengujian; `.env.local` asli tidak ditulis ulang. Build tes berada di `.next-test`, bukan `.next` produksi. Tutup server lokal yang memakai port 3000 sebelum tes browser; server lama tidak dipakai ulang.

Gerbang ini menguji aplikasi **mode demo**, bukan login, pembayaran, CMS/RSVP nyata. Kelulusan tidak mengaktifkan layanan. Workflow `.github/workflows/verify.yml` menambahkan pemeriksaan advisori npm, gerbang kode/browser, dan PostgreSQL terisolasi; workflow baru berjalan ketika kode tersebut benar-benar dipasang di repository. Tidak ada workflow yang telah dijalankan pada akun Diky dalam pekerjaan ini.

## B. Perubahan akses yang disengaja

Pada tahap 6, beberapa RPC undangan/RSVP dapat dipanggil oleh role anonim/autentikasi langsung. Validasi token/status di SQL memang ada, tetapi pembatasan di Next.js saja dapat dilewati melalui Data API.

Migration 007 mencabut akses langsung `anon`, `authenticated`, dan `PUBLIC` pada `ki_public_invitation`, `ki_guest_context`, `ki_submit_rsvp`, dan `ki_public_wishes`. Gateway Next.js memakai secret server setelah limiter mengizinkan akses. Pemeriksaan slug, token tamu, pemilik, status paid, publikasi, expiry dan consent di fungsi lama tetap dipertahankan. Foto juga melewati gateway. RPC pelanggan/admin tetap memakai sesi asli pengguna, bukan secret server.

Ini **bukan undangan privat dengan kata sandi**, bukan verifikasi identitas tamu, dan tidak memusnahkan screenshot/salinan yang sudah diterima. Kunci tautan tamu tetap bersifat bearer. Teks, token, path Storage dan IP mentah tidak dicatat oleh limiter baru. Secret operator database tetap berhak tinggi; jangan membagikannya.

## C. Siapkan konfigurasi server

Konfigurasi tahap 6 tetap dipakai. Tambahkan satu kunci baru:

```dotenv
RATE_LIMIT_HMAC_KEY=
SUPABASE_SECRET_KEY=
ENABLE_ORDER_REQUESTS=false
ENABLE_CHECKOUT=false
ENABLE_PUBLIC_INVITATIONS=false
ENABLE_RSVP=false
```

Apabila `SUPABASE_SECRET_KEY` sebelumnya sudah terisi, pertahankan nilai yang benar dari proyek Invitation yang sama. **Kini secret tersebut diperlukan untuk semua undangan/RSVP publik, tidak hanya foto**. Tanpa key, halaman pemasaran dan editor privat tetap dapat diperiksa, tetapi akses publik tidak dibuka. Jangan mengubah bucket `ki-media` menjadi publik.

Buat `RATE_LIMIT_HMAC_KEY` baru di terminal laptop sendiri:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Salin 64 karakter hasilnya ke `.env.local` dan environment server Vercel. Jangan memakai nilai contoh, kunci dari tes, atau hasil yang pernah dipublikasikan. Jangan menamai kedua secret dengan `NEXT_PUBLIC_`; jangan kirim nilainya ke chat/GitHub. Rotasi HMAC mengubah hitungan aktif limiter, bukan token tamu. Key Supabase dan HMAC tidak boleh saling menggantikan.

Ketika layanan publik diaktifkan, `NEXT_PUBLIC_SITE_URL` harus origin sebenarnya. **Semua browser POST memerlukan Origin yang sama**, sehingga akses dari domain alias/preview lain perlu diarahkan ke domain resmi, bukan melonggarkan validasi. Preview Vercel menggunakan origin/deployment sendiri dan idealnya database staging sendiri.

Gateway mendukung **Vercel dengan alamat jaringan dari `x-vercel-forwarded-for`**, atau localhost dengan satu hitungan uji bersama. Non-Vercel publik ditolak sampai adapter proxy tepercaya disiapkan. Jangan menyetel `VERCEL=1` sendiri pada VPS untuk menerima header yang dikirim pengunjung. Localhost bukan jaminan akses dari HP melalui LAN.

## D. Upgrade SQL secara terkendali

Baca `BACKUP_ROLLBACK.md`, cadangkan, dan pakai database **Invitation yang sama** pada lingkungan yang dimaksud. Jangan menghapus tabel. Coba migration pada staging lebih dahulu.

| Kondisi database | Tindakan |
|---|---|
| Sudah 001–006 | Jalankan **007_release_hardening.sql saja**. |
| Belum 006 | Lengkapi file yang belum dipasang berurutan sampai 007. |
| Proyek khusus Invitation baru dan kosong | 001 → 002 → 003 → 004 → 005 → 006 → 007. |

Lokasi: `supabase/migrations/007_release_hardening.sql`. Jangan jalankan ulang 001–006 setelah 007. Migrasi menambah tabel limiter serta fungsi audit/rate, memperketat grant fungsi publik, dan memperbarui penanda skema. Tidak memindahkan akun, menulis ulang pesanan/draft, mengubah harga, memperpanjang masa aktif, atau membuka flag layanan.

**Perubahan grant memutus kode publik v1.6.0.** Untuk deployment yang sudah melayani tamu, jadwalkan jendela pemeliharaan: tutup flag publikasi/RSVP pada database, pastikan paket v1.7 siap, pasang 007, deploy v1.7 dengan key server lengkap, uji, lalu buka kembali sesuai hasil. Jangan menjadikan regrant anonim sebagai jalan pintas. Seluruh urutan SQL dalam tahap ini belum dieksekusi penyusun pada engine PostgreSQL.

```sql
select public.ki_schema_version(); -- hasil yang diharapkan 7
```

Kemudian:

```powershell
npm run check:env
npm run check:supabase
npm run build
npm run dev
```

`check:env` memeriksa format; `check:supabase` memeriksa layanan dasar/schema/catalog. Keduanya bukan bukti bahwa email, owner isolation atau pembayaran sudah berhasil. Buka `/setup`, `/admin/sistem`, lalu **`/admin/rilis`** dengan akun admin terkonfirmasi. Tidak diperlukan memberikan role admin lewat metadata akun.

## E. Apa yang diperiksa halaman Rilis

Audit database membaca versi skema, penutupan grant RPC publik, RLS dan grant tabel limiter, serta hak service role. Aplikasi memeriksa keberadaan secret server, format key HMAC dan hosting Vercel. Tidak ada secret atau daftar identitas jaringan ditampilkan. Sidik definisi fungsi SQL adalah petunjuk perbandingan, bukan tanda tangan antitamper atau bukti konfigurasi tidak dapat diubah.

Indikator yang sesuai **tidak otomatis berarti siap produksi**. Ia tidak menguji login, SMTP, transaksi, pemulihan foto, beban atau kebenaran rekening. Tidak ada tombol yang mengaktifkan semua layanan dari halaman ini.

## F. Batas trafik awal dan penanganan kegagalan

Batas dihitung di database pada jendela tetap 60 detik untuk satu identitas jaringan harian, **bukan per akun atau per undangan**:

| Jalur | Permintaan per 60 detik |
|---|---:|
| Halaman undangan | 120 |
| Konteks tamu | 120 |
| Kirim/perbarui RSVP | 60 |
| Daftar ucapan | 120 |
| Foto publik | 600 |

Angka adalah batas teknis awal, bukan jaminan kapasitas paket. Wi-Fi bersama/NAT dapat berbagi kuota; beberapa IP/rotasi IPv6 masih dapat melewati hitungan per jaringan. Ada peluang burst pada batas jendela/hari. Ini bukan perlindungan DDoS, CAPTCHA, kuota Storage atau rate-limit seluruh Auth/API admin. Tetap uji beban dan konfigurasi proteksi hosting serta layanan Auth sebelum rilis.

API/media yang melebihi batas mengembalikan 429 dengan `Retry-After`; kegagalan verifikasi limiter menghasilkan 503, tidak melanjutkan membaca/mengubah konten. Halaman HTML undangan menampilkan error umum untuk dicoba kembali; error boundary tidak dijanjikan selalu mengirim status 429. Pembacaan body JSON dibatasi 32 KB dan 8 detik. Slow stream tidak dibiarkan menggantung tanpa batas. Validasi Origin menolak header host palsu; ia bukan autentikasi tamu.

Limiter memakai HMAC harian. Tabel dibatasi 50.000 baris; pada kapasitas penuh identitas baru ditolak sampai ruang tersedia. Pembersihan maksimal 1.000 entri berumur lebih dari 24 jam dicoba saat identitas baru dibuat. **Tidak ada cron penghapusan**; tanpa trafik data dapat bertahan lebih lama. Ini pseudonimisasi, bukan anonimisasi. Backup/log provider mempunyai retensi terpisah. Batas konservatif tidak menggantikan uji konkurensi dan beban nyata.

## G. Syarat sebelum membuka pelanggan

Gerbang kode/browser, SQL lokal, Supabase staging, dua akun, album privat, pembayaran manual, publikasi, RSVP, CMS, dan latihan pemulihan backup harus diperiksa; lihat `UJI_RILIS_TAHAP7.md`. Paket ini tidak memindahkan uang atau memverifikasi mutasi bank otomatis.

Tahap 7 **belum menuntaskan** audit independen, Storage quota/cleanup, hapus akun/retensi otomatis, CSP nonce penuh, CAPTCHA, uji beban, musik, QR check-in, atau gateway pembayaran. Jangan mengaktifkan fitur berbayar hanya karena 7 ZIP sudah tersedia.

## Referensi implementasi

Diperiksa 24 September 2026. Referensi menjelaskan platform, bukan mengesahkan kode/akun Diky.
- https://nextjs.org/blog/nextjs-security-update-september-22-2026 — pin Next 16.3.6 dipertahankan; bukan downgrade.
- https://supabase.com/docs/guides/database/functions — search_path dan hak EXECUTE.
- https://supabase.com/docs/guides/api/api-keys — secret server dan hak tinggi.
- https://vercel.com/docs/headers/request-headers — identitas jaringan pada Vercel.
- https://playwright.dev/docs/test-webserver — browser dengan server aplikasi sebenarnya.
