> **HISTORIS — sebelum tahap 4.** Untuk versi 1.4.0, ikuti `TAHAP_4_PEMESANAN.md` dan `UPGRADE_TAHAP_4.md`: skema4, flagbaru, serta keyprivat server untuk proxyfoto. Nomor versi/urutan SQL/klaim fitur belumtersedia di tekslama adalah catatan tahap sebelumnya, bukan instruksi downgrade.

# Upgrade v1.2.0 → v1.3.0

Panduan lengkap: `TAHAP_3_EDITOR.md`. Gunakan folder baru, cadangkan database, pertahankan konfigurasi Next.js yang benar secara lokal, install dan uji build sebelum menggunakan data pelanggan.

Database yang sudah memasang 001+002 hanya menjalankan **003_editor_events.sql**. Jangan menjalankan ulang 001/002 setelahnya. Proyek baru menjalankan 001 → 002 → 003. Skema yang dibutuhkan aplikasi menjadi 3; environment dan akun tetap sama.

Draft lama tidak ditulis ulang saat migrasi. Pada editor, satu acara legacy ditampilkan sebagai acara pertama. Baru saat perubahan disimpan struktur events ikut tersimpan. Harga/katalog, SQL001/002, Auth, kepemilikan, revision/idempotency, dan tombstone dipertahankan. Jangan mengembalikan aplikasi tahap 2 setelah data memakai events tanpa analisis kompatibilitas.

Tidak ada pembuatan database, migrasi SQLite pelanggan, perubahan GitHub, atau deployment Vercel otomatis. Build tidak menjalankan SQL. Jangan mencampur folder Express, node_modules, atau .env Express. Setelah build dan SQL terpasang, periksa `/setup` dan jalankan `UJI_EDITOR_TAHAP3.md`.
