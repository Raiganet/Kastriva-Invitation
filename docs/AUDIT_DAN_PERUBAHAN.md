> **HISTORIS — sebelum tahap 4.** Untuk versi 1.4.0, ikuti `TAHAP_4_PEMESANAN.md` dan `UPGRADE_TAHAP_4.md`: skema4, flagbaru, serta keyprivat server untuk proxyfoto. Nomor versi/urutan SQL/klaim fitur belumtersedia di tekslama adalah catatan tahap sebelumnya, bukan instruksi downgrade.

> Catatan v1.3.0: dokumen dasar v1.1.0 dipertahankan sebagai referensi. Lihat `TAHAP_3_EDITOR.md`, `UJI_EDITOR_TAHAP3.md`, dan `TEST_REPORT.md` untuk perubahan serta hasil uji terbaru.

# Audit dan perubahan — 23 September 2026

## Kesimpulan sumber

Berkas yang diunggah adalah aplikasi Express/EJS/SQLite bermerek **UndanganKu**, bukan proyek Next.js/Supabase tahap 3. Audit dilakukan terhadap source code yang diekstrak dari ZIP; aplikasi Express lama tidak dijalankan. Folder `node_modules` dan `.env` disertakan pada input, tetapi tidak disebarkan ulang. Tidak ditemukan berkas database SQLite dalam ZIP, sehingga tidak ada pesanan/tamu/akun produksi yang diimpor.

Penyelarasan dilakukan dengan mengganti fondasi framework dan menulis ulang modul relevan. Ini perubahan besar yang disengaja sesuai arahan awal, bukan pernyataan bahwa kode lama sebenarnya sudah Next.js. Simpan ZIP lama untuk pembanding/rollback. Jangan menimpa deployment lama sebelum versi baru lolos uji.

## Temuan dan tindakan

| Temuan pada sumber | Lokasi sumber lama | Perubahan pada versi baru |
|---|---|---|
| Express + EJS + better-sqlite3 | `package.json`, `server.js`, `db.js:1-10` | Next.js App Router, Supabase Auth/SQL/Storage; tidak ada SQLite lokal |
| Session admin lokal, tanpa session store persisten terkonfigurasi | `server.js:17-22` | Sesi Supabase SSR; autentikasi ulang pada halaman/API, cache privat |
| Password admin fallback yang diketahui | `db.js:76-79` | Tidak ada login default; admin melalui `ki_admins`, diberikan pemilik proyek SQL |
| Pengambilan data tamu/ucapan dengan kode pesanan tanpa verifikasi akun | `routes/api.js` | Endpoint lama ditutup 410. Draft/order baru menggunakan kepemilikan akun/RLS |
| RSVP di tampilan demo hanya mengubah DOM, tidak memanggil penyimpanan backend | `views/undangan/preview.ejs:394` dan seterusnya | Ditulis sebagai SIMULASI LOKAL secara eksplisit; RSVP produksi ditunda |
| Input tamu dimasukkan melalui HTML mentah | `views/undangan/preview.ejs`, fungsi `submitRSVP` | Rendering string melalui React, tidak ada `innerHTML`/`dangerouslySetInnerHTML` pada demo |
| Tombol musik hanya mengganti ikon/status, bukan memutar audio | `views/undangan/preview.ejs:386-391` | Tombol semu tidak dibawa; musik ditempatkan pada roadmap |
| Isi demo pernikahan dipakai untuk kategori lain | `views/undangan/preview.ejs` | Label/nama/acara disesuaikan kategori; editor tahap ini tetap khusus pernikahan |
| Branding UndanganKu dan klaim pemasaran yang belum didukung | `views/partials/*`, `views/index.ejs` | Kastriva Invitation; tidak ada angka pelanggan/testimoni/rating buatan |
| 404 merender landing tanpa data yang biasanya diperlukan | `server.js:34` dan seterusnya | `app/not-found.tsx` dan penanganan error tersendiri |
| Generator besar dapat menimpa file hasil perbaikan | `setup.js` | Diganti pengaman non-destruktif yang berhenti dengan petunjuk README |
| Belum ada akun pelanggan/editor privat | struktur source lama | Kode Auth, dashboard, editor dan preview privat ditambahkan; masih perlu uji integrasi Supabase |

Catatan: sumber memiliki endpoint backend RSVP yang menulis SQLite. Temuannya **bukan** “sama sekali tidak ada kode penyimpanan RSVP”, melainkan demo yang terlihat pengguna tidak terhubung ke endpoint itu dan menampilkan hasil lokal.

## Data yang dipertahankan

8 slug/nama/deskripsi/ikon/harga dari seed sumber: Elegant Rose 150.000; Modern Minimalist 150.000; Tropical Paradise 200.000; Rustic Wood 175.000; Galaxy Night 250.000; Sweet Birthday 75.000; Aqiqah Blessing 75.000; Corporate Event 200.000. Mata uang IDR. Harga ini **referensi dari kode**, bukan penetapan paket bisnis baru atau bukti pembayaran.

`data/legacy-templates-reference.json` menyimpan referensi daftar fitur asli. Katalog aktif hanya menyebut fitur yang relevan dengan fondasi, tidak menjanjikan musik/RSVP produksi/QR sebelum diimplementasikan. `data/templates.json` memasok katalog aplikasi; SQL seed menyimpan harga untuk permintaan server. CMS sinkronisasi harga keduanya belum ada: jangan mengubah salah satu lalu menganggap yang lain otomatis berubah.

## Alur yang diselaraskan

Lihat demo tanpa akun → pilih tema pernikahan → daftar/login → isi editor → simpan manual ke akun → preview privat. Permintaan bantuan dapat dibuka terpisah setelah diuji. Status `new`, `contacted`, `processing`, `cancelled` bukan status pembayaran.

Draft menggunakan revision dan request ID. Percobaan ulang hasil simpan yang tidak pasti memakai payload sama, bukan membuat order/draft baru begitu saja. Tab lama mendapat konflik 409; pengguna diminta menyimpan salinan pribadi dan memuat ulang versi server. Ini tidak menggabungkan dua edit secara otomatis.

Permintaan bantuan merekam snapshot saat dikirim. Edit draft berikutnya tidak otomatis mengubah snapshot permintaan yang sudah diajukan. Admin hanya melihat data permintaan yang dikirim; bukan seluruh draft/foto privat pelanggan.

## Batas yang harus diketahui

Tidak ada migrasi database pelanggan karena DB tidak ada dalam input. Bila database asli ada di laptop/server, cadangkan dahulu; pemindahan datanya perlu tahap terpisah. Tidak ada perubahan pada repository GitHub, Vercel, ataupun Supabase Diky dalam pekerjaan ini.

Berkas `.env` lama tidak disalin. Bila secret/password lama pernah dipublikasikan atau masih dipakai pada deployment lain, rotasi di layanan asal. Menghapus dari ZIP baru tidak membatalkan secret yang sudah tersebar.

Ini fondasi pengembangan, bukan seluruh tahap 1–7 selesai. Publish, pembayaran, masa aktif, RSVP sungguhan, musik, hadiah, CMS/admin lengkap, autosave, cleanup, dan audit produksi masih tahap lanjutan.

## Dasar teknis eksternal

Vercel menjelaskan filesystem serverless tidak menyediakan file lokal permanen bersama untuk SQLite. Karena targetnya Vercel, database dipindahkan ke layanan terpisah, bukan mengganti nama file SQLite.
- https://vercel.com/kb/guide/is-sqlite-supported-in-vercel
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/database/postgres/row-level-security

Rujukan implementasi dan versi diperiksa 23 September 2026. Paket tetap perlu diunduh, dikunci, diuji, dan diaudit pada mesin yang memiliki koneksi npm.
