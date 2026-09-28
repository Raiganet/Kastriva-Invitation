> **Riwayat tahap sebelumnya.** Untuk pemasangan sekarang gunakan `UPGRADE_v1.8.0.md`: schema dasar tetap 7, fitur008–011 dan diagnostik012. Jangan memakai nomor versi atau keterangan fitur lama di bawah untuk downgrade.

> **Riwayat tahap 2, bukan instruksi upgrade terbaru.** Untuk v1.3.0 gunakan `TAHAP_3_EDITOR.md` dan `TEST_REPORT.md`.

# Perubahan tahap 2 / v1.2.0

Basis file: `Kastriva-Invitation-Perbaikan-v1.1.0.zip`. Ini source lengkap, bukan patch yang memerlukan generator lama. Delapan tema/harga tetap; bukan redesign ulang katalog.

## Yang ditambah

- `/setup`: petunjuk bertahap dan tombol pemeriksaan backend baca-saja. Format environment, Auth settings, versi SQL dan katalog dipisahkan; tidak ada status koneksi palsu dari adanya key saja.
- `check:supabase`: pemeriksaan yang sama dari PowerShell/terminal; pesan disaring, timeout dibatasi, tanpa akses data pelanggan.
- `/kirim-konfirmasi`: kirim ulang email signup. Form konfirmasi password dan kontrol lihat/sembunyikan password; pencegahan submit ganda. Cooldown bukan pengganti rate limit Auth.
- `/dashboard/akun`: identitas akun yang diverifikasi server, UID, konfirmasi email, peran dari allowlist database, tautan pemulihan.
- `/admin/sistem`: metadata konfigurasi RLS, bucket, grant, policy tambahan, dan flag pesanan. Status tidak menggantikan uji keamanan dua akun.
- Hapus draft dengan konfirmasi dan pemeriksaan revision. Permintaan lama tidak boleh menghidupkan kembali draft yang sudah dihapus; penanda minimal disimpan tanpa isi undangan. Draft terkait permintaan tidak dapat dihapus.
- Migration `002_account_readiness.sql`: additive, transaksi, prasyarat migration 001, guard email terkonfirmasi, pemeriksaan keberadaan foto, penanda penghapusan, dan RPC diagnostik terbatas.
- Dua template email siap tempel: konfirmasi signup dan reset password; bukan kredensial/token nyata.
- Panduan konfigurasi, upgrade, uji manual dua akun, skrip integrasi staging opt-in, dan 48 tes tambahan sehingga total 93.

## Tidak dilakukan

Tidak ada perubahan di akun GitHub/Vercel/Supabase Diky. Tidak ada migrasi data pengguna. Tidak ada transaksi atau publikasi undangan otomatis. Install/build dan koneksi Supabase nyata belum lolos verifikasi; lihat `TEST_REPORT.md`.

## Risiko operasional yang tetap harus diperhatikan

Foto yang dilepas/draft yang dihapus belum otomatis dibersihkan dari Storage. Penghapusan akun/retensi data membutuhkan prosedur admin terpisah. Editor tetap simpan manual. Tidak ada audit penetration test. Pada proyek yang pernah dikonfigurasi aplikasi lain, policy tambahan dapat memperluas hak akses: gunakan proyek khusus dan tinjau semua temuan sebelum pelanggan mendaftar.
