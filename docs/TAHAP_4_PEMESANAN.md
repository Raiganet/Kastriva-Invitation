> **Riwayat tahap sebelumnya.** Untuk pemasangan sekarang gunakan `UPGRADE_v1.8.0.md`: schema dasar tetap 7, fitur008–011 dan diagnostik012. Jangan memakai nomor versi atau keterangan fitur lama di bawah untuk downgrade.

> **Dokumen tahap sebelumnya.** Untuk pemasangan v1.5.0 gunakan `TAHAP_5_TAMU_RSVP.md`: skema 5, migrasi 005 setelah 004, dan aktivasi RSVP terpisah. Jangan mengikuti nomor versi lama untuk downgrade.

# Kastriva Invitation — Tahap 4 / v1.4.0

Tanggal paket: 24 September 2026 WIB. Melanjutkan ZIP tahap 3 v1.3.0, bukan proyek baru. **Kode checkout, verifikasi manual, dan penerbitan telah ditambahkan; belum terpasang/teruji di Supabase atau Vercel Diky.** Tidak ada transaksi uang, deployment, atau perubahan akun eksternal yang dilakukan penyusun. Build Next.js belum terverifikasi karena dependensi belum berhasil diunduh.

## 1. Pasang tanpa menimpa cadangan

Ekstrak ke folder baru. Simpan proyek tahap 3. Salin `.env.local` Next.js tahap 3 secara lokal hanya bila sudah benar. Jangan menyalin `node_modules`, `.next`, atau environment/lockfile Express lama. Jangan unggah key/password ke chat atau GitHub.

Gunakan Node **22.x**, lalu PowerShell di folder `package.json`:

```powershell
node -v
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm install
npm test
npm run check:syntax
npm run typecheck
npm run build
```

Berhenti bila instalasi/typecheck/build gagal. Source bukan bukti build selesai. Belum ada `package-lock.json` tervalidasi dari penyusun. Setelah pemasangan dan tes pada mesin Diky berhasil, simpan lockfile tersebut dan gunakan `npm ci` selanjutnya. Jangan mengganti seluruh dependensi ke `latest` atau mematikan pengecekan tipe untuk menyembunyikan error.

## 2. Upgrade database yang sama

Cadangkan dahulu dan gunakan proyek khusus Invitation yang sama dengan akun/draft tahap sebelumnya. Jangan memakai database aplikasi Kastriva lain. **004 menambah transaksi, bukan mengubah permintaan bantuan lama menjadi lunas.**

| Kondisi proyek | SQL yang dijalankan |
|---|---|
| 001–003 sudah berhasil dipasang | **Hanya `004_commerce_publication.sql`.** |
| Baru 001–002 | 003, kemudian 004. |
| Proyek Invitation benar-benar baru | 001 → 002 → 003 → 004, masing-masing file lengkap. |

Semua ada di `supabase/migrations/`. Jangan menjalankan ulang migrasi lama setelah 004. Jangan menghapus tabel atau melonggarkan RLS. 004 menggunakan transaksi, menerima skema 3/4, dan tidak menulis ulang draft lama. Eksekusinya **belum diperiksa pada engine PostgreSQL nyata oleh penyusun**; uji staging dahulu. Re-run 004 tidak mereset pengaturan yang sudah ada, tetapi tetap ikuti urutan versi.

```sql
select public.ki_schema_version(); -- 4
select checkout_enabled, publishing_enabled, active_days
from public.ki_commerce_settings where id=1;
```

Empat tabel baru: `ki_commerce_settings`, `ki_sales`, `ki_publications`, `ki_sale_events`. Default kedua flag **false**, rekening kosong. Default masa aktif **365 hari adalah nilai awal yang dapat Diky ubah**, bukan keputusan harga/layanan yang sebelumnya disepakati. Rentang 1–730 hari. Harga lima tema pernikahan berasal dari `ki_templates`; katalog/editor statis masih memakai harga referensi JSON, tidak otomatis tersinkron oleh CMS.

## 3. Environment tambahan

Pertahankan konfigurasi Auth dari tahap 2/3, kemudian tambahkan:

```dotenv
ENABLE_ORDER_REQUESTS=false
ENABLE_CHECKOUT=false
ENABLE_PUBLIC_INVITATIONS=false
SUPABASE_SECRET_KEY=
```

**`SUPABASE_SECRET_KEY` baru diperlukan ketika menerbitkan foto privat melalui server.** Isi dengan secret key proyek yang sama, lazimnya diawali `sb_secret_`. Simpan hanya pada `.env.local`/environment server Vercel. Jangan memakai awalan `NEXT_PUBLIC_`, memasukkannya ke kode, atau membagikannya. Key ini berhak akses tinggi dan melewati RLS, sehingga penggunaannya dibatasi pada modul server untuk mengambil foto yang sudah lolos pemeriksaan publikasi. Publishable key lama tetap dipakai untuk browser, akun, dan RPC pelanggan/admin. Dukungan JWT `service_role` lama tersedia, tetapi secret key baru diutamakan.

Buka pengaturan **API Keys** proyek untuk memperoleh key. Referensi resmi: https://supabase.com/docs/guides/getting-started/api-keys

Tanpa key privat, editor/foto privat lama tetap memakai sesi pemilik. Penerbitan tanpa foto dapat diuji; aplikasi menolak penerbitan melalui UI/API jika draft berfoto sedangkan proxy belum dikonfigurasi. Jangan menjadikan bucket `ki-media` publik sebagai jalan pintas. Flag database tetap penentu akses bila RPC dipanggil langsung; keberadaan key pada Vercel bukan pemeriksaan yang bisa diketahui database.

Jalankan:

```powershell
npm run check:env
npm run check:supabase
npm run dev
```

Buka `http://localhost:3000/setup`. Harus terbaca skema 4. Periksa `/admin/sistem` memakai akun admin dari `ki_admins`. Status dasar hijau bukan bukti isolasi akun, email, pembayaran, atau foto sudah lolos uji.

## 4. Aktivasi terkendali pada staging

Setelah fondasi/build/akun/editor berhasil, buka `/admin/transaksi`. Isi nama bank, nomor rekening, nama penerima, petunjuk, dan masa aktif yang benar. Tidak ada rekening contoh yang diaktifkan oleh migration. Periksa ulang nomor dan nama penerima sebelum menyimpan.

Untuk menjalankan uji alur tahap 4, aktifkan flag environment **pada deployment staging yang sama**:

```dotenv
ENABLE_CHECKOUT=true
ENABLE_PUBLIC_INVITATIONS=true
```

Restart `npm run dev`, atau redeploy bila environment Vercel berubah. Pada `/admin/transaksi`, aktifkan **Buka checkout pada database** dan **Izinkan publikasi**, lalu simpan. Dua lapis pengaturan harus sesuai: environment membatasi aplikasi/deployment, sedangkan **flag database membatasi pemanggilan RPC langsung dan seluruh aplikasi yang memakai database tersebut**. Mematikan environment saja bukan penghentian global.

`ENABLE_ORDER_REQUESTS` tetap false untuk alur bantuan lama, terpisah dari checkout baru. Jangan membuka transaksi pelanggan nyata sampai checklist di `UJI_TRANSAKSI_TAHAP4.md` lulus.

## 5. Alur pelanggan

Simpan draft valid → **Pesan & terbitkan** → periksa tema, harga final, masa aktif dan kontak → buat pesanan → transfer secara terpisah ke rekening pada detail pesanan → isi referensi pengirim/waktu dan ajukan verifikasi → admin memeriksa mutasi → pemilik meninjau preview dan menyetujui publikasi → terbitkan → salin tautan atau bagikan WhatsApp.

| Halaman | Fungsi |
|---|---|
| `/dashboard/undangan/[id]/pesan` | Checkout dari draft yang tersimpan. |
| `/dashboard/pesanan` | Daftar pesanan sendiri, 20 per halaman. |
| `/dashboard/pesanan/[id]` | Rekening, status, masa aktif, 50 riwayat terakhir, penerbitan, cetak ringkasan. |
| `/admin` | Pesanan berbayar dan filter status, 20 per halaman. |
| `/admin/pesanan/[id]` | Verifikasi manual dan keputusan admin. |
| `/admin/transaksi` | Rekening, masa aktif, dan pembukaan fitur. |
| `/admin/permintaan` | Permintaan bantuan lama, **bukan pembayaran**. |
| `/u/andi-nisa` | Contoh pola alamat undangan yang diterbitkan. |

Harga, nama tema, rekening dan masa aktif disalin ke pesanan pada checkout. Perubahan pengaturan/JSON sesudahnya tidak menulis ulang tagihan. Server menolak kuotasi yang berubah dari layar checkout. **Satu draft menghasilkan satu pesanan**; klik ganda/retry tidak membuat tagihan baru untuk draft yang sama. Pesanan yang dibatalkan tidak bisa dibuka kembali pada versi ini. Untuk pesanan baru, gunakan draft baru setelah mengklarifikasi penyelesaian pesanan lama dengan admin.

## 6. Status pembayaran dan keputusan admin

| Status | Makna |
|---|---|
| Menunggu pembayaran | Pesanan tercatat; bukan bukti dana diterima. |
| Menunggu verifikasi | Pelanggan mengirim konfirmasi. Belum lunas. |
| Konfirmasi ditolak | Admin memberi alasan. Pelanggan boleh memperbaiki referensi dan mengirim ulang. |
| Pembayaran terverifikasi | Admin menyatakan dana sudah cocok dengan tagihan; masa aktif dimulai. |
| Dibatalkan | Pesanan ditutup; tidak bisa dibuka ulang melalui aplikasi ini. |
| Akses dicabut | Admin menghentikan undangan berbayar. Bukan pengembalian uang. |

Admin harus **memeriksa mutasi rekening penerima di luar aplikasi**, memasukkan jumlah yang benar-benar diterima, referensi yang dicocokkan, dan centang verifikasi. Jumlah wajib sama dengan tagihan. Aplikasi tidak terhubung API bank, tidak mengetahui mutasi otomatis, tidak memindahkan uang, dan tidak menjamin klaim transfer benar. Gambar bukti transfer tidak diunggah pada tahap ini.

Persetujuan menetapkan `paid_at` dan `expires_at` satu kali. Percobaan ulang persetujuan yang sama mengembalikan hasil semula, tidak memperpanjang masa aktif. Catatan yang terlihat di halaman boleh dibaca pelanggan; jangan tulis data rekening pihak lain, saldo, atau rahasia. Referensi pencocokan internal admin berada pada audit internal database, bukan riwayat publik.

Ringkasan dapat dicetak memakai dialog browser. Ini bukan faktur pajak, bukti penerimaan bank, atau layanan akuntansi/refund. Pembayaran kurang/lebih, pembatalan sesudah transfer, pengembalian dana, dan perpanjangan ditangani pengelola di luar fitur otomatis tahap ini.

## 7. Penerbitan dan privasi

Pemilik memilih alamat 5–64 huruf kecil/angka dengan pemisah minus. Nama sistem/tanda aneh ditolak. **Alamat menjadi tetap sejak publikasi pertama**, tetap dicadangkan meski ditarik/kedaluwarsa. Belum ada ganti slug/domain sendiri.

Penerbitan mengambil **salinan versi draft yang sudah tersimpan di server**, bukan ketikan yang belum tersimpan. Kedua nama dan seluruh tanggal, nama acara, tempat, serta alamat wajib lengkap. Maksimal tiga acara/enam foto sesuai editor. Tema terbit harus sama dengan tema yang dibeli; mengganti tema draft setelah pesan tidak otomatis mengubah paket.

Menyimpan draft berikutnya tidak mengubah undangan tamu. Gunakan **Terbitkan versi terbaru** setelah memeriksa preview dan persetujuan. Menerbitkan/menarik/menerbitkan ulang **tidak memperpanjang masa aktif**. Tautan publik aktif hanya bila status paid, belum kedaluwarsa, publication aktif, serta flag database/aplikasi sesuai. Admin menyetujui pembayaran, pemilik yang menerbitkan datanya.

Nama, keluarga, jadwal, lokasi, cerita, dan foto terpilih akan terlihat oleh siapa pun yang memiliki tautan. Parameter `?to=` hanya sapaan, bukan autentikasi tamu. Tidak ada email/WhatsApp pembayar, status pembayaran, ID pemilik, key, atau path Storage dalam proyeksi publik. Halaman diberi no-store/noindex, tetapi **noindex bukan perlindungan akses** dan salinan tamu tidak dapat ditarik kembali.

Foto publik diambil server berdasarkan slug, indeks dan versi publikasi, bukan URL arbitrer. Server memeriksa izin, mendekode JPEG/PNG/WebP, membatasi 5 MB/25 juta piksel, mengubah maksimal sisi 1.600 px dan menghapus metadata saat re-encode WebP; izin diperiksa lagi setelah pemrosesan. Bucket tetap privat. Route tidak membagikan signed URL Storage kepada tamu. Ada biaya komputasi/bandwidth per akses; rate-limit terdistribusi, cache yang aman untuk pencabutan, kuota storage dan uji beban masih perlu sebelum produksi.

Tarik undangan/cabut akses/kedaluwarsa menghentikan pembacaan baru. Data yang sudah berada di layar, cache perangkat di luar kendali, screenshot, unduhan kalender, atau salinan tamu tetap bisa ada. Signed URL privat lama yang diterbitkan editor kepada pemilik punya masa berlaku tersendiri. Tombol penarikan/pencabutan tidak diblokir oleh batas audit normal; riwayat tidak dihapus.

## 8. Percobaan ulang dan konflik

Operasi mutasi dicatat di `sessionStorage` sebelum dikirim, berdasarkan akun/entitas. Satu operasi aktif per kontrol. Respons timeout/HTML/tidak lengkap/5xx dianggap **belum pasti**, bukan otomatis gagal atau lunas. Tombol **Coba ulang** memakai isi dan request ID yang sama. Server memakai transaksi, pemeriksaan revision dan catatan hasil untuk mencegah duplikasi. Tindakan baru ditahan sampai percobaan sebelumnya selesai.

Refresh pada tab yang sama dapat memuat permintaan tertunda. Menutup tab/clear storage dapat menghilangkannya; buka daftar pesanan untuk membaca status server, **jangan transfer ulang hanya karena koneksi gagal**. Browser yang memblokir penyimpanan sesi tidak mengirim mutasi baru. Catatan sesi tidak dienkripsi dan bukan backup permanen.

Jika pengaturan berubah di tab lain, muat ulang sebelum menyimpan. Tindakan normal dibatasi sampai 200 audit/pesanan; menghindari spam, bukan pengganti rate-limit menyeluruh. Penarikan/pencabutan/pembatalan tetap dapat dilakukan saat batas tindakan normal tercapai.

## 9. Uji dan batas rilis

Baca `UJI_TRANSAKSI_TAHAP4.md`. SQL `supabase/tests/004_commerce_integration.sql` adalah **opsional, belum dijalankan penyusun, hanya staging**; memakai fixture sementara dan ROLLBACK, bukan uang/akun pelanggan. Jalankan seluruh berkas agar rollback terjaga. Periksa hasil/log sendiri, jangan menghitungnya sebagai tes lulus hanya karena file disertakan.

**Belum aktif:** pembayaran gateway/QRIS otomatis, upload bukti transfer, refund otomatis, perpanjangan, ganti tema paket setelah bayar, RSVP sungguhan/daftar tamu, musik, hadiah, QR check-in, CMS seluruh website, kuota storage total, penghapusan akun/retensi otomatis, audit keamanan dan uji beban produksi. Checkout manual dan penerbitan saat ini masih perlu tes Next.js + Supabase nyata. Referensi umum sistem:

- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control
- https://sharp.pixelplumbing.com/api-constructor/

Referensi menjelaskan mekanisme, bukan bukti konfigurasi akun Diky atau hasil transaksi nyata.
