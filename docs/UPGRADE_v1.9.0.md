# Kastriva Invitation v1.9.0 — Ucapan & doa umum

Tanggal: 28 September 2026. Melanjutkan v1.8.0 dengan perbaikan audio TS2352 dari commit GitHub `40725a8c369d64d2350243c1f9e248513f808283`. Prioritas kedua audit: ucapan dari tautan umum, menu akun, dan progres per undangan. Source dibuat pada salinan kerja; tidak ada commit/deployment atau SQL 013 pada akun Diky yang dilakukan dalam paket ini.

**Build v1.8.0 yang dilaporkan berhasil oleh Diky bukan hasil pengujian build baru v1.9.0.** Laporan aktual ada di `docs/TEST_REPORT.md`. Instalasi/dependensi Next lengkap dan engine SQL lokal belum tersedia di lingkungan penyusun. Uji staging diperlukan sebelum aktivasi pelanggan.

## 1. Fitur dan pemisahan alur

Ucapan & doa umum menerima nama (maksimal 80 unit karakter UTF-16), pesan (500), dan izin penayangan. Tidak perlu login, daftar tamu, konfirmasi kehadiran, atau kunci RSVP. Nama bukan verifikasi identitas.

Tanpa izin, ucapan bersifat privat untuk pemilik undangan melalui aplikasi. Dengan izin, status awal menunggu moderasi; pemilik harus memilih **Setujui tampil**. Pengaturan penayangan, layanan platform, publikasi, status paid dan masa aktif juga harus sesuai. Tidak ada auto-approve atau testimoni buatan.

RSVP personal dan kapasitas tamu tetap seperti sebelumnya. Ucapan yang dikirim di dalam RSVP tetap berada pada modul lama, berjudul **Ucapan dari RSVP personal**. Ucapan umum dan ucapan RSVP tidak digabung menjadi satu tabel/feed pada rilis ini. Tidak perlu membuat tamu hanya untuk memberi ucapan umum.

## 2. Pasang source tanpa menghilangkan perubahan sendiri

Simpan cadangan proyek v1.8.0. ZIP penuh berisi source aplikasi; patch hanya berkas yang berubah dari v1.8.0 + audio fix. Jangan menerapkan keduanya berulang-ulang. Untuk proyek yang sudah berjalan, salin isi patch ke root proyek (tempat `package.json`). Patch tidak menghapus file lain, tidak mengganti `.env.local`, dan tidak mengandung dependency terpasang.

Kode terbaru yang sempat diedit sendiri perlu dibandingkan sebelum menimpa file bernama sama. Patch tidak melakukan merge otomatis. Riwayat Git dan aset repository di luar ZIP dasar tidak dihapus.

Gunakan Node 22.x. Jalankan satu per satu di PowerShell:

```powershell
node -v
npm ci
npm test
npm run check:lock
npm run check:release-contract
npm run check:syntax
npm run check:security
npm run typecheck
npm run build
```

Berhenti bila ada error. Jangan menonaktifkan pemeriksaan tipe. `package-lock.json` tetap disertakan, pin semua dependensi sama dengan v1.8.0; hanya metadata versi aplikasi berubah. Perbaikan `e2e/invitation-extras.spec.ts` tetap ada pada ZIP penuh.

## 3. Satu migrasi tambahan, bukan mengulang yang lama

Pada database Invitation yang telah sampai 012, **hanya** file berikut yang diperlukan:

```text
supabase/migrations/013_public_wishes.sql
```

Migrasi 012 sudah diterapkan pada proyek Invitation dalam langkah sebelumnya. Paket ini tidak mengulang 012. Schema dasar **tetap 7**, fungsi diagnostik 012 tetap memakai kontrak 1, dan modul ucapan mempunyai protokol 1 sendiri.

```sql
select public.ki_schema_version();       -- tetap 7
select public.ki_open_wish_version();    -- 1 sesudah 013
```

Jangan mengubah penanda versi secara manual. Apabila database belum sampai 012, lengkapi hanya migrasi yang belum dipasang sesuai panduan v1.8.0; jangan mereset tabel atau menjalankan ulang seluruh migrasi.

013 menambahkan lima tabel baru dan fungsi-fungsi khusus ucapan umum. Ia tidak memperbarui tabel harga, pesanan, draft, publikasi, rekening, RSVP lama, atau bucket media. Layanan platform dan pengaturan setiap undangan **tertutup secara default**. File dibungkus transaksi dan batas waktu lock; ketika error, hentikan dan periksa, bukan menonaktifkan RLS. Uji staging dan kesiapan cadangan sebelum memasang pada database pelanggan. Tidak ada backup live yang dibuat penyusun.

**Skrip `supabase/tests/013_public_wishes.sql` BUKAN file migrasi.** Skrip itu sengaja membuat fixture paid dan hanya mengizinkan database lokal `ki_isolated_test`; jangan jalankan pada Supabase produksi. Runner lokal mempunyai 34 langkah sampai 013. Skrip tersedia tetapi belum dieksekusi di engine oleh penyusun.

## 4. Environment dan urutan aktivasi

Tambahkan satu flag server pada `.env.local` dan nanti Vercel:

```dotenv
ENABLE_PUBLIC_WISHES=false
```

Tidak ada key baru. Tetap gunakan URL proyek Invitation, publishable key, `SUPABASE_SECRET_KEY` server dan `RATE_LIMIT_HMAC_KEY` yang sudah benar. Jangan menambahkan awalan `NEXT_PUBLIC_` pada key privat. `ENABLE_RSVP` tidak menentukan ucapan umum. Bucket `ki-media` tetap privat.

Urutan aman: source dengan flag false → build → SQL 013 pada staging → pemeriksaan `/setup` dan `/admin/rilis` → uji → aktifkan secara sengaja. Deployment v1.8 tetap tidak menampilkan ucapan umum walaupun 013 sudah ada; deployment v1.9 yang flag-nya false juga tidak memasang formulir publik.

Untuk menguji fitur, ada tiga tingkat pengaturan:

| Tingkat | Pengaturan |
|---|---|
| Aplikasi/deployment | `ENABLE_PUBLIC_WISHES=true`, `ENABLE_PUBLIC_INVITATIONS=true`. Restart lokal atau buat deployment baru setelah perubahan Vercel. |
| Admin platform | `/admin/ucapan` → buka layanan → **Simpan layanan**. |
| Pemilik undangan | `/dashboard/ucapan` → pilih pesanan → aktifkan **Terima ucapan** dan, bila diinginkan, **Tampilkan ucapan** → **Simpan pengaturan**. |

Undangan harus telah diterbitkan, paid dan belum kedaluwarsa; publikasi pada pengaturan transaksi database harus aktif. Mengaktifkan ucapan tidak menyetujui pembayaran, menerbitkan draft, atau memperpanjang masa aktif.

Menutup flag environment hanya menutup deployment itu. Menutup layanan di `/admin/ucapan` memengaruhi semua deployment yang memakai database tersebut. Menutup penerimaan per undangan tidak menyembunyikan pesan yang sudah disetujui; matikan penayangan juga untuk menghentikan daftar.

## 5. Pengujian awal menggunakan satu ucapan sintetis

Buka tautan `/u/...` yang sudah terbit di jendela Samaran, tanpa `#guest`. Buka undangan lalu gulir atau pilih navigasi **Ucapan**. Isi nama uji dan pesan. Sebelum mengirim, periksa pilihan izin penayangan. Respons sukses baru ditampilkan setelah ACK server yang sesuai.

Pada dashboard pemilik, pilih filter **Menunggu moderasi**, lalu **Setujui tampil**. Muat ulang daftar ucapan pada halaman publik. Pesan tanpa izin harus masuk filter **Tanpa izin tampil** dan tidak mempunyai tombol setujui. Tidak ada perubahan jumlah hadir/kapasitas RSVP dari pengujian ini.

Jangan menggunakan data tamu sebenarnya sebelum uji dua akun, penutupan layanan, retry, dan penghapusan selesai. Checklist lengkap ada pada `docs/UJI_v1.9.0.md`.

## 6. Penghapusan dan kode privat

Browser membuat kode penghapusan berisi alamat undangan, ID kiriman, dan 32 byte acak. Database hanya menyimpan hash kode. Setelah ACK, buka **Simpan kode penghapusan ucapan Anda → Unduh kode penghapusan**. Simpan privat: pemegang kode dapat menghapus kiriman itu.

Halaman `/ucapan/hapus` menerima kode dalam badan permintaan, bukan URL. Penghapusan mengosongkan nama/pesan dan menghapus izin/tayangan dari tabel ucapan aktif. Riwayat RSVP tidak berubah. Retry submit lama hanya mengembalikan ACK penerimaan semula, tidak menghidupkan kembali pesan yang dihapus atau memulihkan moderasi lama.

Penghapusan dengan kode tetap dirancang tersedia saat penerimaan/platform/publikasi ditutup atau masa aktif habis, selama gateway/secret/HMAC tetap dikonfigurasi. Pembatasan jaringan masih berlaku. Jika kode hilang, hubungi pemilik undangan; pemilik mempunyai tindakan **Hapus isi**. Admin platform tidak diberi hak membaca seluruh ucapan pelanggan melalui halaman admin; operator database berhak tinggi merupakan akses berbeda.

ID, hash, waktu, dan penanda minimal tetap disimpan untuk mencegah replay. Ini bukan penghapusan seluruh cadangan/log dan tidak dapat menarik screenshot yang sudah diterima. Retensi/penghapusan akun otomatis masih terpisah.

## 7. Batas dan percobaan ulang

Batas teknis: 2.000 kiriman **termasuk penanda yang sudah dihapus** per undangan. Menghapus pesan tidak mengembalikan slot pada versi ini. Ini bukan perubahan paket harga.

Ada maksimum 5 kiriman yang diterima per identitas jaringan harian/per undangan dan jeda 30 detik. HMAC jaringan berubah pada pergantian hari UTC atau rotasi key; ini bukan kuota 24 jam bergulir yang presisi. Wi-Fi/NAT bersama dapat berbagi kuota. Limiter gateway tahap 7 tetap ada. Bukan CAPTCHA, anti-DDoS penuh atau verifikasi identitas. Teks dimoderasi manual; filter kata otomatis belum ada.

Sebelum mutasi, request dicatat pada sessionStorage. Balasan timeout/5xx/tidak valid mempertahankan ID, kode dan isi untuk **Coba ulang pengiriman yang sama**. Jangan kirim pesan baru sampai hasil sebelumnya jelas. Browser yang menolak penyimpanan sesi tidak mengirim mutasi baru. Catatan tidak dienkripsi, bukan backup permanen, dan bukan antrian offline penuh.

Tab mengingat kode kiriman terakhir; unduh setiap kode yang ingin disimpan. Menutup tab/clear data dapat menghilangkan catatan. Perubahan pengaturan/moderasi memakai nomor versi: konflik meminta muat data terbaru, bukan menimpa paksa.

## 8. Navigasi dan progres

Header menggunakan status akun sebagai petunjuk tampilan: **Masuk** untuk pengunjung, **Dashboard** untuk akun terdeteksi, dan **Akun** ketika status belum pasti. Izin akses halaman/API tetap diperiksa server; status browser bukan dasar memberi akses admin.

Progres dipindahkan ke tiap kartu undangan menggunakan pesanan dan publikasi undangan tersebut. Undangan A yang terbit tidak dianggap sama dengan draft B. Ketika status server gagal dibaca, aplikasi tidak menampilkan progres palsu. Bagian permintaan pengerjaan lama disembunyikan jika layanan mati dan tidak ada riwayat/error.

## 9. Yang belum termasuk

Ucapan umum belum digabung ke CSV RSVP, belum ada edit ucapan anonim, CAPTCHA, notifikasi otomatis, kuota media total/cleanup, atau audit keamanan independen. Musik, hadiah, 15 tema, harga, publikasi dan RSVP lama dipertahankan; tidak dibuat ulang. Database/Supabase live dan CI/deployment baru belum dijalankan oleh penyusun dalam pekerjaan ini.
