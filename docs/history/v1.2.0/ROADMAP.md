# Roadmap — urutan tetap sesuai arahan awal

| Tahap | Target | Posisi paket v1.2.0 |
|---|---|---|
| 1 | Fondasi, katalog, demo orisinal | Kode tersedia dari v1.1.0; 8 demo lama dipertahankan. Build penuh masih perlu dijalankan dengan dependensi terpasang. |
| 2 | Supabase, akun, dan isolasi data | Paket saat ini menambah diagnostik, alur akun, SQL, delete terjaga, dan alat uji staging. Aktivasi/uji nyata pada proyek Diky belum dilakukan penyusun. |
| 3 | Dashboard/editor lebih lengkap | Berikutnya setelah gerbang tahap 2 lolos: multi-acara, pengalaman preview, autosave yang aman/penanganan konflik, dan pengelolaan media. |
| 4 | Pesanan, pembayaran manual tervalidasi, publikasi | Belum. Tombol sudah bayar tidak boleh langsung mengaktifkan paket. |
| 5 | Tamu, RSVP, ucapan, moderasi | Belum. RSVP demo tetap simulasi lokal yang dilabeli jelas. |
| 6 | Admin dan CMS penuh | Belum. Admin saat ini permintaan dasar dan diagnostik, bukan CMS penuh. |
| 7 | Audit dan peluncuran | Belum. Termasuk pemakaian storage, rate-limit, backup, retensi, performa, SEO produksi, dan E2E. |

Keamanan diterapkan pada setiap tahap, bukan hanya tahap 7. Fitur tambahan tidak berarti siap menerima pelanggan sebelum konfigurasi dan pengujian berhasil. Jangan melompati kegagalan build/SQL untuk mengejar fitur pembayaran.
