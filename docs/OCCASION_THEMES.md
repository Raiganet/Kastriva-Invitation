# Koleksi empat kategori

| Slug | Nama | Kategori |
| --- | --- | --- |
| `velvet-vow` | Velvet Vow | Pernikahan |
| `peach-confetti` | Peach Confetti | Ulang tahun |
| `little-moon` | Little Moon | Aqiqah |
| `sapphire-summit` | Sapphire Summit | Acara kantor |

Setiap tema memiliki SVG orisinal, palet, bentuk kartu, motif katalog dan transisi pembuka. Musik, foto dan ucapan contoh memakai aset demo lokal sesuai kategori. Ornamen mengikuti pengaturan reduced motion dan berhenti saat di luar layar. Foto tetap ditampilkan utuh dan ukuran nama mengikuti lebar kartu.

## Rilis

1. Deploy kode aplikasi lebih dahulu. Kode baru menerima katalog lama 16 tema maupun katalog baru 20 tema.
2. Setelah deploy siap, jalankan `supabase/migrations/20261009115018_occasion_collection.sql` setelah migrasi 018. Jangan menjalankan ulang migrasi katalog lama setelahnya.
3. Verifikasi 20 identitas katalog, empat URL `/demo/<slug>`, dan kapabilitas `cms_catalog_complete`.

Migrasi menambahkan empat baris tanpa menimpa harga/status lama, menambahkan tema yang belum ada ke draft dan published CMS secara terpisah, mempertahankan seluruh generasi backup, serta aman dijalankan ulang. Tidak mengubah undangan, pesanan, foto atau ucapan pelanggan. Pengujian SQL berada pada `019_occasion_seed.sql` dan `019_occasion_verify.sql` dalam rencana fixture lokal.

Seluruh kategori kini dapat dipesan setelah migrasi `20261009141633_non_wedding_orders.sql`. Lihat [aktivasi kategori](NON_WEDDING_ORDERS.md).
