# Pemesanan kategori nonpernikahan

Ulang tahun, aqiqah, dan acara kantor kini memakai alur katalog → demo → pilih tema → akun → draft privat → checkout → verifikasi pembayaran admin → publikasi atas persetujuan pemilik. Tiga tema per kategori tersedia, termasuk koleksi premium. Harga, ketersediaan tema, masa aktif, dan rekening tetap menggunakan konfigurasi yang ada.

Editor menampilkan satu nama utama, keterangan orang tua atau penyelenggara opsional, nama acara sesuai kategori, pembuka, cerita, foto, musik, serta rekening hadiah opsional. Pernikahan tetap membutuhkan dua nama mempelai. Mengganti desain hanya dalam kategori draft yang sama; buat draft baru untuk kategori lain. Salinan JSON lintas kategori ditolak sebelum mengganti formulir.

## Kompatibilitas data

Format `DraftContent` tetap kompatibel. Untuk nonpernikahan, `groom` menyimpan nama utama/judul acara, `groomParents` menyimpan keterangan orang tua/penyelenggara, dan `bride` serta `brideParents` kosong. Nama kolom internal tidak ditampilkan sebagai label mempelai pada editor nonpernikahan. Foto, acara, musik, hadiah, snapshot publik, masa aktif, dan batas isian tidak berubah.

Migrasi `20261009141633_non_wedding_orders.sql` menambahkan dua validator privat dan memperbarui RPC penyimpanan, katalog editor, checkout, publikasi, serta permintaan bantuan lama. Terapkan setelah 20 migrasi sebelumnya dan rilis kode yang mendukung editor semua kategori. Migrasi tidak mengubah data pelanggan, harga, status tema, CMS, pembayaran, atau pengaturan aktivasi. Schema dasar tetap versi 7. Menjalankan ulang migrasi menghasilkan definisi yang sama.

Validasi kategori berada di API dan database. Database tetap memeriksa autentikasi, email terkonfirmasi, kepemilikan, revisi, harga aktual, retry/idempotensi, media privat, status pembayaran, persetujuan, serta masa aktif. Tema nonaktif tidak menerima draft/checkout baru tetapi draft lama masih dapat diedit. Helper baru berjenis SECURITY INVOKER, search_path kosong, dan tidak dapat dipanggil oleh PUBLIC/anon/authenticated. RPC publik tetap melalui gateway server yang membatasi permintaan.

## Verifikasi

- `tests/invitation-category.test.ts`: seluruh identitas kategori, draft, backup, nama utama, default acara, dan validasi pernikahan.
- `supabase/tests/021_non_wedding_orders.sql`: sembilan tema melalui simpan → checkout → submit pembayaran sintetis → persetujuan admin sintetis → publikasi → pembacaan gateway. Termasuk retry, harga berubah, kepemilikan, consent, tema nonaktif, dan penolakan publikasi belum dibayar. Semua fixture berjalan pada database terisolasi dan rollback; tidak dijalankan pada produksi.
- `e2e/non-wedding-orders.spec.ts`: demo ke pemesanan untuk sembilan tema; editor kategori, payload simpan, filter desain, dan preview di desktop/HP. Tes editor memakai respons API sintetis dan fixture yang diblokir pada Vercel/produksi. Tidak melakukan transfer atau membuat pesanan produksi.

Dokumen tahap lama yang menyebut kategori nonpernikahan hanya demo adalah catatan historis, digantikan oleh perilaku rilis ini.
