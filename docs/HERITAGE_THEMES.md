# Koleksi Islami dan Nusantara

Lima renderer pernikahan baru: `islami-sakinah`, `adat-sunda`, `adat-minang`, `adat-jawa`, dan `adat-bali`. Harga awal masing-masing Rp200.000, dikonfirmasi pemilik pada 27 September 2026. Harga dan status selanjutnya mengikuti CMS/database.

Ornamen SVG asli berada di `components/HeritageArtwork.tsx`. Desain menggunakan lengkung geometris, daun/melati, gonjong, pola terinspirasi kawung, dan gerbang terbelah. Semuanya interpretasi dekoratif; tidak menggambarkan tata upacara atau atribut wajib adat. Referensi bentuk gonjong: [Kementerian Pariwisata — Rumah Gadang](https://www.indonesia.travel/id/id/travel-ideas/culture/rumah-gadang). Tidak ada foto, font, musik, atau gambar eksternal yang disalin.

Semua tema memakai alur undangan yang sama: foto privat, acara/lokasi, galeri, musik opsional, amplop digital, RSVP sesuai aktivasi, dan publikasi setelah pembayaran diverifikasi. Ornamen tidak menangkap klik, diabaikan pembaca layar, dan mengikuti pengaturan pengurangan animasi yang sudah ada.

## Urutan rilis

1. Deploy aplikasi yang mengenali 13 slug dan masih menerima dokumen CMS historis dengan 8 tema.
2. Jalankan `supabase/migrations/009_heritage_themes.sql` setelah migrasi 001–008.
3. Periksa `/tema?category=pernikahan&collection=nusantara`, kelima demo, pilihan editor, harga checkout, dan halaman CMS.

Migrasi menjaga schema capability 7, ACL fungsi yang sudah ada, RLS, flag layanan, data pelanggan, dan snapshot tagihan. Baris tema memakai `ON CONFLICT DO NOTHING`; menjalankan ulang tidak mengembalikan harga ke nominal awal. Metadata tema baru ditambahkan hanya bila belum ada di draft/publikasi CMS. Teks draft CMS yang belum dipublikasikan tetap dipertahankan.

Riwayat dan backup CMS lama tetap bisa dibaca. Ketika dimuat ke formulir, tema yang belum ada dalam salinan ditambahkan memakai metadata/harga katalog database terbaru. Mutasi SQL menolak katalog parsial setelah katalog diperluas, agar riwayat lama tidak menghapus tema baru.

Tidak ada perubahan skema konten pelanggan atau migrasi draft pribadi yang diperlukan. Tema berbeda dapat dipilih sebelum checkout; publikasi pesanan lama tetap memakai tema yang dibeli.
