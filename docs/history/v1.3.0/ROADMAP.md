# Roadmap Kastriva Invitation

| Tahap | Target | Posisi source v1.3.0 |
|---|---|---|
| 1 | Website, katalog, demo | Delapan tema/harga referensi dipertahankan; demo tanpa akun. |
| 2 | Akun dan Supabase | Auth, RLS, diagnostik, draft privat, hapus terjaga tersedia; aktivasi/uji nyata di proyek Diky belum dibuktikan penyusun. |
| 3 | Studio editor | Multi-acara, simpan otomatis, pemulihan, JSON, foto/sampul, dan live preview ditambahkan. Tes inti, inspeksi statis, dan Canvas terisolasi dijalankan; build/integrasi masih perlu diverifikasi. |
| 4 | Pesanan, pembayaran, terbit | Belum. Verifikasi pembayaran harus berasal dari admin/gateway tervalidasi, bukan tombol Sudah bayar pelanggan. |
| 5 | Tamu, RSVP, ucapan | Belum. RSVP demo tetap simulasi lokal. |
| 6 | Admin/CMS lengkap | Belum. Admin sekarang hanya permintaan dasar dan diagnostik. |
| 7 | Audit dan peluncuran | Belum. Termasuk beban, kuota, rate-limit, keamanan server, cleanup/retensi, backup, performa, SEO, dan end-to-end. |

Kode tahap 3 disiapkan tanpa menganggap aktivasi tahap 2 otomatis selesai. Keamanan dikerjakan pada setiap tahap. Tidak ada transaksi publik sampai install/typecheck/build, dua akun, Storage, dan workflow nyata lulus uji.
