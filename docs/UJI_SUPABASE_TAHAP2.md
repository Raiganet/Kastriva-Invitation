> **Pembaruan v1.3.0:** pemeriksaan akun tetap relevan, tetapi pasang skema 3 terlebih dahulu. Skrip integrasi sekarang mengharapkan versi 3 dan fixture multi-acara. Lanjutkan dengan `UJI_EDITOR_TAHAP3.md`.

# Uji tahap 2 pada proyek Supabase staging

**Jangan jalankan uji tulis pada database pelanggan.** Gunakan proyek khusus staging dan dua akun non-admin yang sudah dikonfirmasi. Pisahkan dari akun admin Diky. Skenario di sini belum dijalankan pada Supabase Diky oleh penyusun.

## Pemeriksaan melalui browser

| Skenario | Hasil yang diharapkan |
|---|---|
| Katalog/demo tanpa login | Masih bisa dibuka, tidak meminta akun hanya untuk melihat demo. |
| Daftar dengan password tidak sama | Form menolak sebelum meminta pendaftaran. |
| Daftar → konfirmasi email | Akun dapat masuk ke tujuan internal yang benar, termasuk tema yang dipilih. |
| Kirim ulang konfirmasi | Pesan generik, cooldown UI, email diterima bila pengiriman diaktifkan. |
| Lupa password → buka email → reset | Dua password baru harus sama; password lama tidak bisa login setelah perubahan berhasil. |
| Link email dipakai dua kali / kedaluwarsa | Tidak membuat sesi baru secara diam-diam; tampil pesan minta link baru. |
| Simpan draft → refresh → logout/login | Draft kembali dari server, bukan dari local storage. |
| Akun A dan B pada dua browser | Dashboard masing-masing hanya memuat draft miliknya. URL editor/preview ID akun lain tidak menampilkan isi. |
| Dua tab mengedit satu draft | Simpan tab terbaru berhasil, simpan versi lama memberi konflik; tidak diam-diam menimpa. |
| Unggah JPEG/PNG/WebP, simpan, buka preview | Foto milik akun muncul melalui signed URL; nama file di bawah folder UID pemilik. |
| URL foto tanpa signed token | Ditolak; tidak berubah menjadi bucket publik. Signed URL itu sendiri adalah bearer link, jangan bagikan. |
| Akun B mencoba sign/download path foto A | Ditolak. Memiliki signed URL A yang masih berlaku berbeda dari meminta URL baru sebagai B. |
| Hapus draft, lalu retry request create lama | Draft tetap terhapus karena marker ID. |
| Hapus memakai revision lama | Ditolak. Data baru tidak ikut hilang. |
| Hapus draft yang diajukan | Ditolak; fitur permintaan tahap ini tetap default OFF. |
| Akun biasa membuka `/admin/sistem` | Ditolak/dialihkan; RPC admin juga ditolak lewat API langsung. |
| Logout lalu buka lagi URL editor | Diminta login, bukan mendapat konten cache milik sesi sebelumnya. |

## Skrip integrasi opsional — bukan prasyarat pemula

Skrip tidak memasang migrasi dan tidak membuat akun. Skrip membuat dua draft fixture, menguji read/write lintas akun, revision, retry, akses admin, dan penghapusan. Cleanup hanya mencoba menghapus ID yang dibuat pada eksekusi ini. Tidak membuat foto, pesanan, atau pembayaran. Akun test dan marker ID penghapusan tetap ada.

Siapkan file terpisah:

```powershell
if (!(Test-Path .env.test.local)) { Copy-Item .env.test.example .env.test.local }
```

Isi URL/key **staging**, email/password dua akun uji, exact project ref, dan `KI_TEST_ALLOW_WRITES=true`. `.env.test.local` diabaikan Git; jangan dibagikan. Skrip sengaja tidak mengambil `.env.local` saat mode test untuk menghindari penggunaan koneksi produksi tanpa sengaja.

Perintah tanpa persetujuan hanya berhenti dan menampilkan SKIP:

```powershell
npm run test:supabase
```

Setelah benar-benar siap untuk membuat fixture pada staging:

```powershell
npm run test:supabase -- --write
```

Syarat pengaman: argumen `--write`, `KI_TEST_ALLOW_WRITES=true`, project ref cocok dengan hostname, dan dua akun berbeda/non-admin. Token sesi hanya di memori dan tidak dicetak. Skrip menggunakan REST langsung, bukan browser; hasilnya tidak membuktikan cookie SSR, email delivery, atau interaksi Next.js.

Hasil PASS harus diikuti cleanup berhasil. Bila koneksi putus setelah write, fixture bisa sudah tersimpan walaupun respons tidak diterima. Skrip mencatat ID sebelum mengirim dan tetap mencoba cleanup pada finally. Bila muncul `PERIKSA CLEANUP`, periksa **ID tersebut saja**; jangan menjalankan DELETE massal atau menghapus semua draft. Marker penghapusan minimal tidak dihapus otomatis agar retry lama tetap ditolak.

## Batas skrip

Tidak menguji CAPTCHA/rate-limit produksi, malware/verifikasi biner foto, load test, masa berlaku signed URL, backup, atau pemulihan bencana. Jangan membuka penerimaan pelanggan hanya berdasarkan satu tombol atau satu test suite. Gunakan hasil browser + Supabase + build aplikasi secara bersama.
