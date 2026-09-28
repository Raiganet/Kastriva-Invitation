# Checklist staging — v1.9.0

Jalankan pada staging dengan data sintetis, dua akun pemilik berbeda dan satu admin. Tidak menandai pembayaran pelanggan fiktif sebagai lunas. Fixture SQL otomatis hanya untuk database lokal yang dijaga runner.

| Uji | Hasil yang diharapkan |
|---|---|
| Build source dengan audio fix | `npm ci`, tipe dan build selesai; TS2352 lama tidak kembali. |
| `/setup` dan `/admin/rilis` | Kontrak dasar 7, diagnostik 012, protokol ucapan 1 dan metadata RLS/grant baru sesuai. |
| Pemasangan 013 pada staging | Lima tabel baru, layanan false. Harga/draft/pesanan/CMS/publikasi/RSVP lama tidak berubah. |
| Gerbang masing-masing | Matikan satu tingkat aplikasi/platform/pemilik; kiriman baru ditolak. |
| Tanpa `#guest` dan tanpa login | Formulir ucapan umum tersedia ketika dibuka. Tidak meminta jumlah hadir. |
| Izin tidak dicentang | Kiriman tersimpan privat; tidak bisa disetujui tampil. |
| Izin dicentang | Masuk menunggu moderasi; tidak tampil sebelum persetujuan pemilik. |
| Persetujuan, sembunyikan, muat ulang | Daftar umum mengikuti status/izin; bukan push realtime. |
| Hak pemilik B dan admin bukan pemilik | Tidak bisa membaca/mengelola ucapan A. Admin hanya saklar platform. |
| Anon/auth RPC langsung via Data API | Tidak dapat submit/feed/withdraw tanpa gateway server, tidak membaca tabel. |
| Konfirmasi jaringan terputus setelah commit | Retry ID/receipt/isi sama tidak menggandakan pesan. |
| Dua tab pemilik | Versi lama menghasilkan konflik, tidak menimpa versi terbaru. |
| Ganti izin/teks di request ulang yang sama | Ditolak konflik; tidak memodifikasi kiriman semula. |
| Kode salah/undangan lain | Penghapusan ditolak; pesan lain tidak berubah. |
| Kode benar, layanan ditutup atau expired | Nama/pesan dihapus; riwayat RSVP tetap sama. |
| Retry pengiriman setelah dihapus | Tidak menghidupkan kembali pesan; ACK hanya mengakui penerimaan sebelumnya. |
| Banyak request paralel | Periksa hitungan 5/30 detik/2000 tidak melampaui batas; tes fungsi bukan uji konkurensi. |
| Teks panjang/emoji/HTML | Batas server diterapkan, HTML ditampilkan sebagai teks, tidak dieksekusi. |
| Header login/logout | Label sesuai, kegagalan koneksi tidak memberi akses admin. |
| Dua undangan, salah satu terbit | Progres masing-masing benar; yang paid tidak disuruh transfer ulang. |
| Musik, hadiah, galeri, 15 demo | Perilaku lama masih berfungsi. |
| Respons HP terang/gelap | Form, kode privat, tombol dan moderasi dapat dioperasikan tanpa overflow. |

Catat URL deployment, commit, tanggal, akun fixture (tanpa password), hasil, dan error yang disamarkan. Jangan membagikan receipt, token tamu, atau `.env.local`. Hapus ucapan uji melalui tombol pemilik setelah selesai; marker minimal tetap ada.

`e2e/public-wishes.spec.ts` menggunakan halaman React/Next fixture dan HTTP yang diintersep Playwright. Ia bukan pengujian Supabase nyata. Tiga tes baru mencakup formulir umum/izin/kode, retry identik dan layanan tertutup. `supabase/tests/013_public_wishes.sql` menguji SQL lokal dalam transaksi rollback, bukan lalu lintas Web/Auth/Storage nyata. Keduanya belum dijalankan penyusun karena dependensi/engine belum tersedia.
