> **Versi aktif v1.6.0:** gunakan `TAHAP_6_CMS.md`, skema6 dan migrasi006 setelah001–005. Teks di bawah adalah riwayat; jangan mengikuti nomor lama untuk downgrade.

> **Dokumen tahap sebelumnya.** Untuk pemasangan v1.5.0 gunakan `TAHAP_5_TAMU_RSVP.md`: skema 5, migrasi 005 setelah 004, dan aktivasi RSVP terpisah. Jangan mengikuti nomor versi lama untuk downgrade.

> **HISTORIS — sebelum tahap 4.** Untuk versi 1.4.0, ikuti `TAHAP_4_PEMESANAN.md` dan `UPGRADE_TAHAP_4.md`: skema4, flagbaru, serta keyprivat server untuk proxyfoto. Nomor versi/urutan SQL/klaim fitur belumtersedia di tekslama adalah catatan tahap sebelumnya, bukan instruksi downgrade.

# Panduan Supabase — v1.3.0

Gunakan `TAHAP_3_EDITOR.md` sebagai panduan utama upgrade. Setup Auth, email, dan admin tetap dijelaskan di `TAHAP_2_SUPABASE.md` dengan pembaruan skema 3.

Database sudah 001+002: jalankan **003 saja**. Database baru: 001 → 002 → 003. Database baru 001: 002 → 003. Jangan menjalankan versi lama setelah versi baru, menghapus tabel, atau membuat ulang akun yang sudah ada. Aplikasi tidak melakukan migrasi saat build.

Periksa `/setup` atau `npm run check:supabase`, kemudian jalankan `UJI_EDITOR_TAHAP3.md`. Marker versi 3 bukan pengganti pengujian akses dua akun. Tidak ada service-role key yang diperlukan oleh frontend.
