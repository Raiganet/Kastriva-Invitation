> **Riwayat tahap sebelumnya.** Untuk pemasangan sekarang gunakan `UPGRADE_v1.8.0.md`: schema dasar tetap 7, fitur008–011 dan diagnostik012. Jangan memakai nomor versi atau keterangan fitur lama di bawah untuk downgrade.

> **Dokumen tahap sebelumnya.** Untuk pemasangan v1.5.0 gunakan `TAHAP_5_TAMU_RSVP.md`: skema 5, migrasi 005 setelah 004, dan aktivasi RSVP terpisah. Jangan mengikuti nomor versi lama untuk downgrade.

# Upgrade ke 1.4.0

Panduan lengkap: `TAHAP_4_PEMESANAN.md`. Simpan cadangan source/database, ekstrak folder baru, gunakan environment Next.js yang benar. Jangan overwrite deployment lama sebelum tes staging lulus.

001–003 sudah terpasang: jalankan **004 saja**. Proyek baru: urutan 001→002→003→004. Jangan downgrade/re-run migrasi lama. 001–003 beserta delapan referensi tema dipertahankan identik dengan ZIP tahap 3. SQL004 belum dieksekusi penyusun di engine nyata.

Tambahkan `ENABLE_CHECKOUT=false`, `ENABLE_PUBLIC_INVITATIONS=false`, `SUPABASE_SECRET_KEY=`. Pertahankan `ENABLE_ORDER_REQUESTS=false` untuk bantuan lama. Key privat hanya server, tidak `NEXT_PUBLIC_`. Bucket tetap privat. Admin memasukkan rekening dan mengaktifkan flag database secara terpisah setelah uji. Nilai awal masa aktif 365 hari dapat diubah sebelum menerima pesanan.

Tahap 4 menambah tabel transaksi/publikasi baru. `ki_orders` lama tetap permintaan, tidak otomatis menjadi paid. Akun/draft yang ada tetap dipakai; satu draft satu pesanan. Draft berpesanan tidak dapat dihapus. Tarik publikasi tidak menghapus transaksi/foto.

Periksa `npm install`, `npm test`, `npm run typecheck`, `npm run build`, `/setup` skema4, `/admin/sistem`, lalu uji dengan dua pelanggan+admin. Jangan menyatakan produksi siap dari jumlah tes unit. Ringkasan tes aktual di `TEST_REPORT.md`.

Menonaktifkan fitur: matikan checkout/publikasi di `/admin/transaksi` sesuai kebutuhan, kemudian matikan environment. Database flag diperlukan untuk penghentian RPC global. Masa aktif pesanan tetap berjalan. Rollback source ke tahap3 tidak membatalkan/menghapus transaksi tahap4; jangan menjalankan SQLlama sebagai rollback. Pemulihan database cadangan perlu keputusan terpisah setelah mempertimbangkan transaksi baru.
