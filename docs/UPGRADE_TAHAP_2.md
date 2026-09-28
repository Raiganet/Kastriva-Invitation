> **Riwayat tahap sebelumnya.** Untuk pemasangan sekarang gunakan `UPGRADE_v1.8.0.md`: schema dasar tetap 7, fitur008–011 dan diagnostik012. Jangan memakai nomor versi atau keterangan fitur lama di bawah untuk downgrade.

> **HISTORIS — sebelum tahap 4.** Untuk versi 1.4.0, ikuti `TAHAP_4_PEMESANAN.md` dan `UPGRADE_TAHAP_4.md`: skema4, flagbaru, serta keyprivat server untuk proxyfoto. Nomor versi/urutan SQL/klaim fitur belumtersedia di tekslama adalah catatan tahap sebelumnya, bukan instruksi downgrade.

> **Riwayat tahap 2, bukan instruksi upgrade terbaru.** Untuk v1.3.0 gunakan `TAHAP_3_EDITOR.md` dan `TEST_REPORT.md`.

# Upgrade v1.1.0 → v1.2.0 tanpa mengulang dari Express

Simpan ZIP/folder sebelumnya sebagai cadangan. Ekstrak paket tahap 2 ke folder baru; paket ini sudah lengkap dan bukan patch. Jangan mencampur `node_modules` atau lockfile Express. Tidak ada file akun/rahasia pengguna yang disertakan di ZIP ini.

Bila sudah mengisi `.env.local` pada **Next.js v1.1.0**, salin secara lokal ke folder baru dan jalankan `npm run check:env`. Bila belum, buat dari contoh. Copy contoh dengan guard agar tidak menimpa file yang sudah ada:

```powershell
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Database tetap proyek Supabase Invitation yang sama. Jika 001 sudah selesai, jalankan 002 saja. Jika belum, 001 lalu 002. Migrasi 002 tidak menghapus draft/pesanan/media lama. Ia mengganti fungsi save, menambah helper/kontrol akun, diagnostik, fungsi delete terjaga, dan marker penghapusan.

Jangan menjalankan kembali 001 setelah 002 karena definisi fungsi lama dapat menggantikan versi baru. Berhenti pada error SQL; jangan membuka akses publik tabel sebagai perbaikan sementara.

Untuk mencoba kembali kode lama, simpan snapshot/cadangan dahulu dan nilai kompatibilitas schema. Jangan mencabut tabel marker penghapusan atau menonaktifkan RLS sebagai rollback. Paket tidak menyediakan destructive down-migration.

Setelah install/typecheck/build dan uji staging lolos, pindahkan perubahan source ke repository yang benar. Periksa Git sebelum push: `.env.local`, `.env.test.local`, `node_modules`, dan folder `.next` harus diabaikan. Commit `package-lock.json` yang dibuat oleh instalasi berhasil pada proyek Next.js ini, bukan lockfile lama Express.

Tidak ada push GitHub atau perubahan Vercel yang dilakukan penyusun pada tahap ini.
