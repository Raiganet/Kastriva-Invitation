> **Riwayat tahap sebelumnya.** Untuk pemasangan sekarang gunakan `UPGRADE_v1.8.0.md`: schema dasar tetap 7, fitur008–011 dan diagnostik012. Jangan memakai nomor versi atau keterangan fitur lama di bawah untuk downgrade.

# Panduan Kastriva Invitation v1.7.3

Tanggal paket: 24 September 2026. Basis: `Kastriva-Invitation-Perbaikan-Tahap-7-v1.7.2.zip`.

**Kode perbaikan kontrol transaksi telah dibuat dan pengujian terisolasi dijalankan. Full build Next.js dan Supabase nyata belum terverifikasi.** Tidak ada repository, deployment, akun, rekening, uang, atau data pelanggan Diky yang diubah.

## 1. Perubahan yang ditemukan saat pemeriksaan

Hook transaksi lama tidak membatalkan penanganan respons ketika komponennya sudah dilepas atau konteks akun/entitas berubah. Pembersihan status `busy` juga dilakukan setelah callback tanpa `finally`; callback refresh/navigasi yang melempar error dapat melewatkan pembersihan itu. Jika penghapusan jurnal browser gagal, referensi pending sebelumnya tetap dilepas sehingga kontrol dapat menerima tindakan baru meskipun jurnal lama masih ada.

Controller baru menangani lifecycle, snapshot request, pembersihan jurnal dan hasil callback. Kodenya dipakai oleh checkout, tindakan pembayaran, publikasi, dan pengaturan transaksi. **Ini temuan kode dan tes simulasi, bukan pernyataan sudah terjadi insiden pada pelanggan.**

Transport lama menganggap HTTP 408 dengan JSON error sebagai penolakan pasti. Reproduksi terhadap fungsi asli menunjukkan `rejected`; patch mengembalikan `uncertain` agar ID percobaan sebelumnya tidak dibuang saat timeout. Respons dibaca per potongan dengan batas byte, bukan menampung seluruh `.text()` sebelum menguji ukuran.

## 2. Perilaku baru

| Kondisi | Tindakan kode |
|---|---|
| Halaman ditutup / akun atau entitas berganti | Respons milik controller sebelumnya tidak mengubah state, callback, atau menghapus jurnal. Request yang sudah dikirim tetap mungkin selesai di server. |
| Refresh tampilan gagal setelah server mengonfirmasi | Status tetap terkonfirmasi, tombol tidak terjebak sibuk, dan pengguna diminta memuat ulang untuk membaca kondisi server. Jangan membayar ulang. |
| Catatan sesi gagal dibersihkan atau diganti proses lain | Catatan tidak dihapus secara sembarang; tindakan baru ditahan. |
| Pengguna mengubah objek formulir setelah pengiriman | Retry memakai snapshot JSON yang disimpan sebelum pengiriman, bukan objek yang sudah berubah. |
| Timeout / HTTP 408 atau 429 / respons tidak dikenal | Pertahankan percobaan yang sama. Tidak membuat ID baru, tidak menganggap transfer gagal. |
| Respons HTML, redirect, UTF-8 rusak, atau lebih dari 16 KB | Tidak diterima sebagai konfirmasi. |
| Pengguna meninggalkan halaman dengan permintaan tertunda | Browser diberi peringatan sebelum meninggalkan halaman. Ini tidak menjamin semua HP/browser selalu menampilkan dialog atau mempertahankan tab. |

Penyimpanan `sessionStorage` tetap hanya untuk sesi tab, bukan backup permanen atau enkripsi. Key jurnal v1 tetap kompatibel; jurnal milik akun lain, rusak, atau tidak cocok diblokir, bukan diam-diam dipulihkan. Request sudah terkirim tidak bisa dianggap dibatalkan di database hanya karena pengguna berpindah halaman. Baca status server sebelum membuat tindakan atau transfer baru.

Batas 20 detik berlaku per fetch transaksi termasuk pembacaan respons, bukan SLA aplikasi keseluruhan. Pembatasan ini tidak meliputi semua endpoint atau seluruh operasi SDK dan bukan perlindungan DDoS menyeluruh.

## 3. Pemasangan

Ekstrak ke **folder baru**. Simpan proyek sebelumnya dan data lokalnya. Salin `.env.local` Next.js yang benar secara lokal saja. Jangan menyalin `node_modules`, `.next`, `.next-test`, atau file Express lama.

PowerShell pada folder `package.json`:

```powershell
node -v
npm run setup:local
```

Gunakan Node 22.x. Skrip membuat `.env.local` dari contoh hanya jika belum ada, memasang dependensi, memasang Chromium, lalu menjalankan verifikasi demo terisolasi. Ia berhenti pada kegagalan dan tidak menjalankan SQL/deployment atau membuka transaksi. Alur penuh skrip ini **belum berhasil diselesaikan penyusun**, karena registry npm gagal diakses dari runtime.

Saat proses berhenti:

```powershell
npm run diagnose
```

Baca `.diagnostics/setup-report.json` dan `.diagnostics/report.json`. Jangan membagikan `.env.local`, `.npmrc`, secret, password, token email, atau tautan tamu lengkap. Penyaringan log bukan jaminan semua data sensitif tersamarkan.

Tidak ada penggantian massal versi dependency. Pin masih sama dengan v1.7.2; tidak dibuat lockfile fiktif. Jangan memakai `--force`, `--legacy-peer-deps`, atau menonaktifkan typecheck untuk menyembunyikan kegagalan.

## 4. Database dan konfigurasi

**Skema tetap 7. Tidak ada SQL, key atau flag baru.** Jika SQL 007 sudah terpasang, jangan menjalankan migrasi lagi untuk patch ini. Bila belum, ikuti `TAHAP_7_RILIS.md`, cadangkan dan uji di staging sebelum memasang file yang belum terpasang secara berurutan. Jangan menjalankan ulang 001–006 setelah 007.

Seluruh migrasi 001–007, kedua JSON katalog, dan `.env.example` dibandingkan byte-for-byte dengan ZIP input dan tetap identik. Tidak ada data pelanggan diimpor. Tetap gunakan proyek Supabase Invitation yang sama; jangan beralih ke database aplikasi Kastriva lain.

Pertahankan penutupan fitur sebelum pengujian:

```dotenv
ENABLE_ORDER_REQUESTS=false
ENABLE_CHECKOUT=false
ENABLE_PUBLIC_INVITATIONS=false
ENABLE_RSVP=false
```

Flag environment tidak menggantikan flag database. Bucket `ki-media` tetap privat. Secret Supabase dan HMAC tetap hanya server, tanpa awalan `NEXT_PUBLIC_`.

## 5. Urutan setelah instalasi berhasil

Luluskan `npm run verify:release` untuk demo, kemudian bangun ulang konfigurasi target dengan `npm run build`. Jalankan SQL lokal terisolasi dan uji Supabase staging sesuai panduan tahap 7. Uji browser pada `UJI_TRANSAKSI_v1.7.3.md` melengkapi pemeriksaan akun, editor, foto, pembayaran manual, publikasi, RSVP, CMS dan pemulihan backup sebelumnya.

**Patch ini belum meluluskan seluruh gerbang rilis.** Tidak ada musik, gateway, QR check-in, paket kuota atau retensi data baru. Pengujian React/Next, SDK produksi, PostgreSQL dan backend nyata tetap pekerjaan yang belum terverifikasi.

## Rujukan mekanisme

Rujukan menjelaskan API, bukan bukti build atau konfigurasi Diky:
- https://react.dev/reference/react/useSyncExternalStore
- https://developer.mozilla.org/en-US/docs/Web/API/Response/redirected
- https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/read
- https://nextjs.org/docs/app/api-reference/config/typescript
