> **Dokumen tahap sebelumnya.** Untuk pemasangan v1.5.0 gunakan `TAHAP_5_TAMU_RSVP.md`: skema 5, migrasi 005 setelah 004, dan aktivasi RSVP terpisah. Jangan mengikuti nomor versi lama untuk downgrade.

> **HISTORIS — sebelum tahap 4.** Untuk versi 1.4.0, ikuti `TAHAP_4_PEMESANAN.md` dan `UPGRADE_TAHAP_4.md`: skema4, flagbaru, serta keyprivat server untuk proxyfoto. Nomor versi/urutan SQL/klaim fitur belumtersedia di tekslama adalah catatan tahap sebelumnya, bukan instruksi downgrade.

# Kastriva Invitation — Tahap 3 / v1.3.0

Tanggal paket: 24 September 2026. Basis: `Kastriva-Invitation-Tahap-2-v1.2.0.zip`.

**Source editor tahap 3 sudah ditambahkan. Aktivasi Supabase Diky, build Next.js lengkap, dan pengujian aplikasi nyata belum terverifikasi.** Paket ini tidak menerbitkan undangan atau menerima pembayaran. Tidak ada perubahan pada akun GitHub, Vercel, atau Supabase yang dilakukan penyusun. Hasil lengkap ada pada `docs/TEST_REPORT.md`.

## 1. Pasang pada folder baru

Ekstrak ZIP baru. Jangan campur source Next.js dengan Express lama. Simpan folder sebelumnya sebagai pembanding. Salin `.env.local` dari proyek **Next.js tahap 2** secara lokal hanya bila konfigurasi tersebut sudah benar; jangan menyalin `node_modules`, `.next`, atau lockfile dari Express. Jangan kirim konfigurasi privat ke chat/GitHub.

Pada PowerShell di folder yang mempunyai `package.json`:

```powershell
node -v
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm install
npm test
npm run typecheck
npm run build
```

Gunakan Node **22.x**. Berhenti dan perbaiki jika install/typecheck/build gagal. Jangan menghapus validasi agar build tampak berhasil. Dependensi dipertahankan dari tahap 2; tidak ada lockfile buatan. Setelah resolusi paket dan pemeriksaan benar-benar berhasil, commit `package-lock.json` hasilnya dan gunakan `npm ci` pada pemasangan berikutnya. `ETARGET` memerlukan pemeriksaan versi paket, bukan penggantian semua paket menjadi `latest` tanpa pengujian.

## 2. Upgrade database yang sama

Gunakan proyek Supabase khusus Invitation yang sudah digunakan pada tahap 2. **Jangan membuat proyek baru bila akun/draft lama ingin tetap dipakai.** Cadangkan database sebelum migrasi. Tidak ada database pelanggan di dalam ZIP, dan tidak ada data yang dipindahkan penyusun.

| Kondisi database | SQL yang dijalankan di SQL Editor |
|---|---|
| 001 dan 002 sudah terpasang | **Hanya `003_editor_events.sql`.** |
| Baru 001 terpasang | 002, kemudian 003. |
| Proyek Invitation benar-benar baru | 001, kemudian 002, kemudian 003. |

Semua file berada dalam `supabase/migrations/`. Jalankan file lengkap dan berurutan. Jangan menjalankan ulang 001/002 setelah 003 dan jangan menghapus tabel untuk mengatasi error. Migration 003 mengubah validator konten dan penanda skema, bukan menulis ulang isi draft atau menghapus foto. Pengaman simpan/hapus dari 002 dipertahankan. Rerun 003 pada versi 3 dirancang tidak membuat duplikasi, tetapi belum diuji terhadap engine PostgreSQL oleh penyusun.

Periksa di SQL Editor:

```sql
select public.ki_schema_version(); -- harus 3
```

Editor akan menampilkan petunjuk setup dan tidak membuka formulir bila skema belum versi 3 atau pemeriksaan gagal. Draft lama tanpa daftar acara dibaca sebagai satu acara; tambahan struktur baru hanya dikirim ketika pengguna benar-benar menyimpan perubahan. Jangan downgrade aplikasi ke tahap 2 setelah draft mulai memakai struktur multi-acara tanpa merencanakan kompatibilitas data.

## 3. Konfigurasi dan akun

Environment dan template Auth dari tahap 2 tetap digunakan. Tidak diperlukan secret baru atau service-role key. Pertahankan:

```dotenv
ENABLE_ORDER_REQUESTS=false
```

Untuk proyek baru, isi URL Supabase, publishable key, dan `NEXT_PUBLIC_SITE_URL` sesuai `.env.example`. Siapkan konfirmasi email, Site URL/Redirect URLs, template email, akun uji, dan akun admin mengikuti `docs/TAHAP_2_SUPABASE.md`. Dokumen tersebut sudah diberi pembaruan urutan SQL untuk versi ini.

Jalankan:

```powershell
npm run check:env
npm run check:supabase
npm run dev
```

Buka `http://localhost:3000/setup`. Pemeriksaan dasar harus membaca **skema 3**, tetapi indikator itu bukan bukti email terkirim atau akun terisolasi. Periksa `/admin/sistem` dari akun admin. Akun biasa tidak mendapat hak admin hanya dengan mengubah metadata daftar.

## 4. Cara menggunakan studio editor

Buka Dashboard → Buat draft atau Edit draft. Editor terdiri dari lima langkah; preview langsung mengikuti isian tanpa menunggu penyimpanan server.

| Langkah | Cara penggunaan |
|---|---|
| Pasangan | Isi nama mempelai dan keterangan keluarga. |
| Acara | Satu sampai tiga acara. Akad dan resepsi dapat berbeda tanggal, tempat, Maps, dan zona waktu. Acara pertama menjadi tanggal di sampul. Setiap acara masih memiliki waktu mulai dan selesai pada hari yang sama. |
| Cerita | Kalimat pembuka maksimal 1.000 karakter dan cerita 4.000 karakter; baris baru dipertahankan. |
| Galeri | Maksimal enam foto per draft. Pilih beberapa foto sekaligus, periksa hasil per berkas, urutkan dengan panah, dan pilih foto sampul. |
| Tema & review | Ganti di antara lima tema pernikahan tanpa menghapus isian. Periksa enam indikator kelengkapan; indikator tidak berarti paket aktif atau undangan terbit. |

Pada desktop, formulir dan preview berdampingan. Pada HP, gunakan tombol **Edit isian / Preview langsung**. Contoh nama tamu hanya untuk tampilan. Tombol Buka undangan pada preview menampilkan konten privat, bukan menerbitkan link. Setiap acara yang valid mempunyai unduhan kalender tersendiri. Tautan Maps hanya dibuka bila memakai HTTPS yang valid.

Delapan katalog tema dan harga referensi lama dipertahankan. Lima tema pernikahan didukung editor; tiga kategori lain tetap demo, bukan editor lengkap kategori baru.

## 5. Simpan otomatis dan status

Autosave aktif saat editor baru dibuka. Perubahan valid dikirim sekitar **1,5 detik setelah berhenti mengetik**, satu permintaan pada satu waktu. Tombol Simpan sekarang tetap tersedia. Membuka draft lama tanpa mengubah isian tidak otomatis mengirim perubahan atau membuat pesanan.

| Status | Arti dan tindakan |
|---|---|
| Draft baru | Belum ada versi server. Mulai mengisi atau simpan manual. |
| Perubahan belum tersimpan | Teks di formulir berbeda dari versi yang telah dikonfirmasi. |
| Menyimpan | Permintaan sedang berlangsung. Ketikan baru tetap dipertahankan. |
| Tersimpan di server | ID, revision, dan waktu balasan cocok dengan permintaan. Ini bukan status terbit. |
| Offline / hasil simpan belum pasti | Jangan tutup sebelum mengunduh salinan. Setelah koneksi kembali, coba kembali bila diperlukan. |
| Simpan dijeda | Periksa input atau kegagalan yang ditampilkan. Tanggal/jam/link setengah diketik tidak dikirim sebagai data valid. |
| Konflik versi | Versi server berubah atau draft dihapus. Unduh perubahan sendiri, lalu muat ulang; tidak ada force overwrite atau penggabungan otomatis. |
| Login diperlukan | Sesi berubah/berakhir. Unduh salinan, login sebagai pemilik, lalu muat ulang. |

Balasan simpan tidak menimpa ketikan yang masuk saat request sedang berlangsung. Ketika jaringan memberi hasil tidak pasti, editor mempertahankan **ID permintaan dan isi yang sama** untuk retry sebelum mengirim perubahan berikutnya. Respons tidak dikenal tidak ditampilkan sebagai berhasil. Server tetap memeriksa pemilik akun, email terkonfirmasi, revision, batas draft, dan keberadaan foto.

## 6. Pemulihan dan salinan JSON

Salinan sementara disimpan dalam `sessionStorage` berdasarkan akun dan ID draft. Ini hanya sesi tab browser, **tidak dienkripsi dan bukan backup permanen**. Browser dapat memblokirnya; menutup tab atau membersihkan data situs dapat menghapusnya. Jika penyimpanan sesi gagal, pengiriman simpan ditahan agar identitas retry tidak hilang diam-diam. Unduh salinan dan perbaiki izin/ruang browser.

Refresh pada tab yang sama menawarkan **Pulihkan salinan lokal** atau **Gunakan versi server**. Tidak ada pemulihan yang diam-diam menimpa versi server terbaru. Bila revision sudah berubah, salinan lokal dapat diperiksa/diunduh tetapi simpan dijeda sampai konflik diselesaikan.

**Unduh salinan JSON** mencakup teks, tema, dan referensi foto. File tidak memuat password, token login, signed URL, status pembayaran, atau ID/revision server untuk menimpa draft. File berisi data pribadi acara: simpan di tempat privat. Foto aslinya tidak berada di JSON.

**Muat salinan** memvalidasi format, ukuran maksimal 128 KB, akun pemilik, dan referensi foto. Format salinan lama `{theme,content}` tetap diterima bila valid. Hasil impor tidak mengubah kepemilikan atau mengirim otomatis: autosave dijeda untuk diperiksa, kemudian tekan Simpan sekarang. Foto harus masih ada pada akun yang sama. Penghapusan berkas Storage tidak bisa dipulihkan melalui JSON.

Peringatan sebelum meninggalkan halaman membantu, tetapi tidak menjamin browser/HP tidak pernah menutup halaman. PWA offline penuh dan antrian latar belakang bukan bagian tahap ini.

## 7. Foto privat

Input JPEG/PNG/WebP maksimal 5 MB per berkas diperiksa dan diperkecil ke WebP, sisi terpanjang maksimal 1.600 piksel. Hasil unggahan diproses satu per satu dan kegagalan per foto ditampilkan. Unggahan berhasil dan draft tersimpan adalah dua operasi berbeda: perhatikan status referensi foto.

Tautan foto sementara hanya berada di memori komponen; masa tautan yang diminta satu jam, diperbarui berkala dan saat jendela fokus. Tautan dapat dibuka pihak yang memegangnya selama masih berlaku; jangan bagikan. **Melepas foto dari draft tidak menghapus foto di Storage** karena mungkin dipakai draft lain. Upload terputus setelah server menerima dapat meninggalkan berkas yang belum ditautkan. Cleanup, batas total storage akun, dan pemeriksaan biner gambar di server tetap pekerjaan lanjutan. Pemeriksaan gambar di browser tidak boleh dianggap proteksi server yang tidak bisa dilewati.

## 8. Uji sebelum lanjut

Ikuti `docs/UJI_EDITOR_TAHAP3.md`: simpan/buka ulang, ganti tema, dua acara berbeda, multi-foto, offline, refresh pemulihan, hilang balasan, konflik dua tab, serta dua akun berbeda. Script SQL validator opsional ada di `supabase/tests/003_editor_validation.sql`; tidak dijalankan otomatis dan bukan uji RLS.

**Belum aktif:** pembayaran, publikasi `/u/`, masa aktif, RSVP sungguhan, musik, amplop digital, QR check-in, CMS penuh, penghapusan akun, cleanup otomatis. Permintaan bantuan tetap nonaktif secara default dan tidak otomatis diperbarui ketika draft berubah.

Tahap 4 baru layak dipasang setelah build, akun, Storage, dan editor pada staging lolos pengujian. Kode tahap 3 disiapkan tanpa menganggap aktivasi tahap 2 Diky sudah selesai.
