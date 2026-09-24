# Upgrade v1.5.0 → v1.6.0

Gunakan `TAHAP_6_CMS.md` sebagai panduan aktif. Folder source baru, Node22, environment Next.js sebelumnya, install → test → syntax → typecheck → build. Tidak ada dependensi/key/flag baru. Backup proyek Invitation yang sama; **006 saja** jika001–005 sudah terpasang. Jangan re-run001–005 setelah006.

`/setup` membaca6, lalu admin terkonfirmasi membuka `/admin/cms`. Isi kontak publik pada CMS (seed kosong), simpan, preview, publish. Katalog live sekarang dari database; JSON hanya referensi/visual/demo. Harga lama pesanan tidak berubah. Gerbang pembayaran/publikasi/RSVP tidak diaktifkan oleh migrasi. `/admin/sistem` memeriksa RLS dan grant tambahan.

Source/SQL disiapkan, bukan bukti build, koneksi, atau deployment berhasil. Jalankan `UJI_CMS_TAHAP6.md` dan regresi tahap sebelumnya pada staging. Jangan downgrade aplikasi atau memodifikasi deployment lama sampai uji berhasil.
