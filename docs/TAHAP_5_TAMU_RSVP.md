> **Riwayat tahap sebelumnya.** Untuk pemasangan sekarang gunakan `UPGRADE_v1.8.0.md`: schema dasar tetap 7, fitur008–011 dan diagnostik012. Jangan memakai nomor versi atau keterangan fitur lama di bawah untuk downgrade.

# Kastriva Invitation — Tahap 5 / v1.5.0

Tanggal: 24 September 2026. Basis: `Kastriva-Invitation-Tahap-4-v1.4.0.zip`.

**Kode tamu, RSVP, ucapan, dan moderasi ditambahkan; belum dipasang ke Supabase/Vercel Diky.** Build Next.js penuh dan SQL pada engine database belum terverifikasi. Jangan menerima pelanggan nyata dari hasil pengujian parsial saja. Tidak ada perubahan akun eksternal, transaksi dana, atau pengiriman pesan yang dilakukan penyusun.

## 1. Pasang dengan cadangan

Ekstrak ke folder baru. Simpan folder tahap 4 sebagai cadangan. Salin `.env.local` Next.js yang benar secara lokal; jangan menyalin environment Express, `node_modules`, `.next`, atau lockfile Express. Jangan kirim konfigurasi, key, token email, atau tautan tamu lengkap ke chat/GitHub.

Gunakan Node **22.x**. PowerShell pada folder yang mempunyai `package.json`:

```powershell
node -v
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm install
npm test
npm run check:syntax
npm run typecheck
npm run build
```

Berhenti jika install/typecheck/build gagal. Versi dependensi dipertahankan dari tahap 4; kombinasi paket belum berhasil diunduh di lingkungan penyusunan. Tidak dibuat lockfile fiktif. Setelah instalasi dan pemeriksaan berhasil, commit `package-lock.json` hasilnya lalu gunakan `npm ci`. Bila muncul `ETARGET`, periksa paket yang disebut; jangan mengganti semua ke `latest` atau mematikan typecheck tanpa pengujian.

## 2. Upgrade database yang sama

Cadangkan proyek Supabase Invitation yang sama, bukan proyek aplikasi Kastriva lain. Migrasi tidak memindahkan data ke proyek baru dan tidak menghapus tabel lama.

| Kondisi database | Yang dijalankan di SQL Editor |
|---|---|
| 001–004 sudah berhasil dipasang | **Hanya `005_guestbook_rsvp.sql`.** |
| Belum sampai 004 | Lengkapi migrasi yang belum dipasang sesuai urutan, lalu 005. |
| Proyek Invitation baru | 001 → 002 → 003 → 004 → 005, masing-masing file lengkap. |

Lokasi: `supabase/migrations/005_guestbook_rsvp.sql`. Jangan menjalankan ulang 001–004 setelah 005. Jangan menonaktifkan RLS untuk mengatasi error. 005 dibungkus transaksi, menerima skema 4/5, tidak mereset pengaturan RSVP ketika dijalankan ulang pada versi 5; tetap uji di staging karena SQL belum dieksekusi penyusun.

```sql
select public.ki_schema_version(); -- hasil yang diharapkan: 5
select enabled, revision from public.ki_guest_platform where id=1;
-- enabled=false pada pemasangan pertama
```

Lima tabel baru: `ki_guest_platform`, `ki_guest_settings`, `ki_guests`, `ki_rsvps`, `ki_guest_mutations`. Akses langsung role browser ditutup; akses dilakukan melalui fungsi RPC dengan pemeriksaan pemilik/tautan. `/admin/sistem` menampilkan pemeriksaan tambahan. Indikator skema saja bukan bukti isolasi akun sudah benar.

## 3. Environment dan gerbang aktivasi

Tambahkan satu variabel baru di `.env.local` dan nantinya environment Vercel:

```dotenv
ENABLE_RSVP=false
```

Tahap ini **tidak membutuhkan secret baru**. URL, publishable key, Auth, dan secret server untuk foto tahap 4 tetap digunakan. Secret foto tetap hanya server, bukan `NEXT_PUBLIC_`; bucket `ki-media` tetap privat.

```powershell
npm run check:env
npm run check:supabase
npm run dev
```

Buka `http://localhost:3000/setup`; harus membaca skema 5. Login, periksa `/admin/sistem`, dan uji akun/editor/pesanan tahap sebelumnya dahulu.

Untuk pengujian terkendali, ada **tiga gerbang RSVP** yang harus terbuka:

| Gerbang | Pengaturan |
|---|---|
| Aplikasi/deployment | `ENABLE_RSVP=true` dan `ENABLE_PUBLIC_INVITATIONS=true`; restart dev/redeploy setelah perubahan. |
| Platform database | Admin → **Tamu & RSVP** (`/admin/tamu`) → aktifkan layanan dan simpan. |
| Undangan pemilik | Dashboard → **Tamu & RSVP** → pilih pesanan → centang **Terima RSVP**; **Tampilkan ucapan** terpisah. |

Undangan juga harus **sudah diterbitkan, pembayaran terverifikasi, dan belum kedaluwarsa**; publikasi database tahap 4 harus aktif. Gerbang RSVP tidak membuat pesanan menjadi lunas dan tidak memperpanjang masa aktif. `ENABLE_CHECKOUT` tetap mengikuti tahap 4; tidak harus dibuka untuk undangan yang sudah dibayar. `ENABLE_ORDER_REQUESTS=false` tetap terpisah.

Mematikan environment hanya membatasi deployment itu. Untuk menghentikan RSVP/ucapan pada seluruh aplikasi yang memakai database tersebut, **matikan flag di `/admin/tamu`**. Jangan mengubah rekening/pembayaran demi membuka RSVP. Data yang sudah terbuka di layar tamu tidak dapat ditarik kembali.

## 4. Pemilik menyiapkan buku tamu

Buka `/dashboard/tamu`, pilih pesanan, atau masuk ke **Kelola tamu & ucapan** dari detail pesanan. Halaman buku tamu: `/dashboard/pesanan/[id]/tamu`.

Masukkan satu nama/rombongan per baris, maksimal **25 baris per penambahan**. Tentukan kapasitas **1–10 orang per nama**, termasuk pemegang tautan. Versi ini membatasi **500 nama/rombongan per undangan**. Batas tersebut teknis, bukan perubahan paket/harga yang telah disepakati. Nama yang sama tidak otomatis digabung; periksa daftar agar tidak menambahkan orang sama dua kali.

Daftar menyediakan cari nama, filter status/moderasi, 25 baris per halaman, dan tombol muat ulang. **Rencana hadir** menghitung jumlah orang pada jawaban Hadir dari tamu aktif; jumlah tamu/rombongan menjawab menghitung tautannya. Jawaban adalah rencana, bukan bukti check-in.

Satu jawaban berlaku untuk **seluruh undangan**, bukan RSVP terpisah untuk akad/resepsi. Tamu tidak dapat mengubah nama internal atau kapasitasnya sendiri. Pemilik boleh mengedit; kapasitas tidak dapat diturunkan di bawah jumlah yang sudah dikonfirmasi.

## 5. Bagikan tautan personal

Pastikan undangan terbit dan gerbang aktif. Pada satu tamu tekan **Tautan & WhatsApp**. Pilih Salin tautan, Salin pesan, atau buka WhatsApp lalu pilih penerima sendiri. Aplikasi tidak mengirim blast, memilih kontak otomatis, mencatat pesan diterima, atau melacak pesan dibaca.

Tautan mempunyai bentuk `/u/andi-nisa?to=Nama#guest=KUNCI`. Parameter `to` hanya sapaan. Bagian `#guest` adalah kunci untuk membaca/mengubah jawaban rombongan itu; tidak perlu akun tamu. Jangan memotong bagian ini ketika menyalin tautan. Tautan umum dari panel publikasi tetap menampilkan undangan, tetapi **tidak memberikan hak mengisi RSVP**.

**Tautan adalah akses, bukan verifikasi identitas.** Siapa pun yang mendapat tautan lengkap bisa memakai hak tamu tersebut. Jangan mengunggahnya ke status/grup publik. Undangan itu sendiri tidak menjadi privat hanya karena RSVP memakai kunci. Kunci berada di fragment agar tidak masuk URL request awal; kode aplikasi kemudian mengirimkannya melalui badan POST saat diperlukan. Jangan mengaktifkan analitik/log yang merekam fragment atau badan request.

Kunci disimpan dalam tabel privat agar pemilik dapat mengambil ulang tautan. Ini bukan kunci yang hanya tersimpan sebagai hash. Akun pengelola database/secret berhak tinggi tetap dapat mengakses data; fitur bukan enkripsi ujung-ke-ujung.

**Ganti kunci tautan** membuat tautan lama tidak berlaku. Jawaban tetap tersimpan; bagikan tautan baru kepada tamu yang benar. **Nonaktifkan** menghentikan tautan serta mengecualikan tamu dari hitungan aktif dan ucapan publik, bukan menghapus riwayat. Mengaktifkan lagi dapat menampilkan kembali ucapan yang sebelumnya disetujui.

## 6. Tamu memberi konfirmasi dan ucapan

Tamu membuka tautan khusus → Buka undangan → Konfirmasi kehadiran. Pilihan Hadir, Tidak hadir, atau Belum pasti. Jumlah orang hanya untuk Hadir, maksimal kapasitas; pilihan lain disimpan 0 orang. Satu tamu memiliki satu jawaban terbaru dan bisa memperbaruinya.

Ucapan opsional, maksimal 500 unit karakter teks (emoji tertentu dihitung dua unit oleh formulir). Tanpa centang persetujuan publik, ucapan tetap privat untuk pemilik dan pemegang tautan tersebut. Untuk ditampilkan, tamu harus mengisi nama tampilan dan memberikan izin. Nama tampilan publik berbeda dari nama internal buku tamu.

Setelah server mengonfirmasi, status tampilan berubah menjadi berhasil. Kegagalan jaringan atau balasan tidak dikenal tidak dianggap tersimpan. Mutasi biasa dibatasi **jeda 30 detik dan 20 pengiriman yang diterima per jendela 24 jam**, di database. Jendela dihitung sejak awal periode, bukan batas bergulir presisi. Percobaan ulang permintaan yang sama tidak mengonsumsi hitungan baru. Pembatasan ini bukan pengganti rate-limit HTTP/DDoS menyeluruh.

## 7. Moderasi dan penarikan izin

Pemilik memfilter **Ucapan menunggu**, lalu Setujui ucapan atau Sembunyikan. Ucapan hanya muncul bila semuanya terpenuhi: tamu aktif, izin tamu masih ada, pemilik menyetujui, tampilan ucapan diaktifkan, dan undangan/layanan masih aktif. Jumlah hadir, kapasitas, nama internal, kontak, ID pemilik, dan kunci tidak ikut dipajang di daftar ucapan.

Setiap perubahan jawaban berizin kembali ke status **menunggu moderasi**, termasuk perubahan jumlah orang. Pemilik tidak bisa memaksa ucapan tanpa izin menjadi publik. Tamu dapat menekan **Tarik izin tampilkan ucapan**: konfirmasi hadir tetap disimpan. Penarikan masih dapat dilakukan saat penerimaan RSVP ditutup, selama tautan dan undangan masih aktif. Jika layanan/undangan sudah ditarik, tidak ada tayangan baru; permintaan penghapusan data ditangani pengelola terpisah.

Perubahan tidak otomatis menghapus isi yang sudah dilihat tamu lain, screenshot, atau salinan. Tombol **Perbarui ucapan** mengambil daftar server terbaru. Ini bukan realtime push.

## 8. Ekspor, retry, dan konflik

**Unduh CSV** mengekspor seluruh daftar pesanan tersebut, bukan hanya filter layar. Berisi data pribadi termasuk ucapan privat, tetapi tidak memuat token tautan. Simpan privat. Nilai yang menyerupai formula diberi pelindung saat ekspor; jangan menghapus pelindung tersebut sebelum membuka data yang tidak dipercaya.

Mutasi dicatat di `sessionStorage` **sebelum** request. Ketika jaringan tidak pasti, Coba ulang memakai ID dan isi yang sama. Jangan membuat batch baru selama batch sebelumnya belum dipastikan. Ketika reload tab yang sama, operasi tertunda dapat dipulihkan. Tab ditutup/clear storage dapat menghilangkan catatan; baca status server dan daftar sebelum mencoba tindakan baru.

Catatan sesi tidak dienkripsi; journal RSVP dapat memuat kunci dan ucapan Anda. Tidak berisi password Auth, tetapi tetap sensitif. Jangan gunakan perangkat bersama tanpa menutup sesi/tab setelah selesai. Jika penyimpanan browser diblokir, mutasi ditahan daripada kehilangan identitas retry diam-diam.

Konflik versi meminta pemilik/tamu memuat data terbaru. Tidak ada force overwrite. Catatan hasil mutasi pemilik dibatasi 512 tindakan terakhir per undangan; retry sangat lama dapat ditolak dan harus diperiksa terhadap keadaan server, bukan diulang sebagai data baru. Pembatasan pemilik adalah 40 tindakan normal per menit per undangan; tindakan privasi tertentu tetap diizinkan.

## 9. Pengujian dan batas rilis

Ikuti `UJI_TAMU_TAHAP5.md`. Skrip **opsional** `supabase/tests/005_guestbook_integration.sql` dibuat untuk staging khusus dengan BEGIN/ROLLBACK dan fixture, belum dijalankan penyusun. Baca seluruh skrip sebelum menjalankan; bukan bukti pembayaran. Pengujian 004 dapat dijalankan pada skema 4/5 dengan skrip yang disertakan, tetapi juga belum diverifikasi di engine nyata.

Belum ada QR check-in, RSVP per acara, impor CSV, pengiriman WhatsApp otomatis, musik, hadiah, gateway pembayaran, CMS lengkap, hapus akun/data tamu otomatis, backup/retensi otomatis, kuota storage keseluruhan, atau audit/uji beban produksi. Admin platform baru hanya mengatur layanan, **tidak diberikan halaman untuk membaca buku tamu pelanggan lain**. Akses operator database tetap terpisah dan harus dibatasi.

Rujukan mekanisme, bukan bukti konfigurasi Diky berhasil:
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment
- https://nextjs.org/docs/app/api-reference/file-conventions/route
- https://www.postgresql.org/docs/current/functions-string.html
- https://www.postgresql.org/docs/current/sql-syntax-lexical.html
