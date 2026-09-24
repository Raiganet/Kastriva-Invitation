> Catatan v1.2.0: dokumen dasar v1.1.0 dipertahankan sebagai referensi. Lihat `TAHAP_2_SUPABASE.md`, `UJI_SUPABASE_TAHAP2.md`, dan `TEST_REPORT.md` untuk perubahan serta hasil uji terbaru.

# Uji penerimaan manual — belum dijalankan terhadap backend nyata

Gunakan database staging dan data/foto contoh, bukan pelanggan. Catat lulus/gagal setiap langkah. Uji di Chrome desktop dan HP. Jangan membuka transaksi nyata sebelum checklist ini dan tahap pembayaran/publikasi selesai.

## Tanpa Supabase

Buka beranda → koleksi tema → setiap demo → kembali. Uji filter pernikahan, ulang tahun, aqiqah, acara kantor serta kata pencarian. Slug tidak dikenal harus 404. Buka menu HP dengan tombol menu; pindah halaman dan Escape menutup menu.

Coba `/demo/elegant-rose?to=Diky%20%26%20Keluarga`: nama tampil sebagai teks. Masukkan `<img src=x onerror=alert(1)>` pada nama/ucapan demo; harus tampil sebagai teks, tidak menjalankan skrip. RSVP menulis SIMULASI, bukan tersimpan. Refresh menghilangkan hasil simulasi. Tombol simpan tanggal menghasilkan ICS; lihat jam WIB/WITA/WIT. Demo nonpernikahan tidak boleh menyebut dua mempelai.

Login tanpa env menampilkan backend belum terhubung; tidak menerima data login palsu. `/api/health` hanya menyatakan konfigurasi, tidak mengklaim DB sehat. GET/POST endpoint RSVP/tamu lama harus 410.

## Akun dan ownership — setelah SQL/config siap

1. Daftar akun A, konfirmasi email, login, logout, login lagi. Uji kata sandi salah, email belum dikonfirmasi, lupa password, link kedaluwarsa, recovery sukses.
2. Pilih Elegant Rose, isi nama pasangan/tanggal/tempat, klik Simpan draft. Refresh: nilai harus sama. Buka dari perangkat kedua milik akun A: draft harus terlihat.
3. Buka incognito dengan akun B. URL editor/preview draft A tidak boleh menampilkan data. Akses REST tabel/RPC langsung sebagai B juga harus menolak akses pemilik lain; jangan hanya menguji halaman.
4. Coba mengganti `owner_id`, `total_price`, `status`, `published` pada request: ditolak/tidak digunakan. RPC menyimpulkan pemilik dari sesi, bukan request.
5. Coba mengubah metadata signup menjadi admin: `/admin` dan RPC status tetap ditolak. Tambahkan hanya UID akun admin melalui trusted SQL, lalu admin benar dapat membuka dashboard.
6. Logout lalu buka ulang URL privat dan gunakan tombol Back. Server tidak boleh memberi akses tanpa sesi aktif. Uji koneksi Supabase gagal: UI tidak boleh menganggap data kosong atau tersimpan.

## Editor, konflik, dan retry

Simpan draft A versi 1. Buka tab kedua dari draft yang sama. Simpan perubahan tab pertama (versi 2), lalu simpan tab kedua yang masih versi 1: harus 409, bukan menimpa versi 2. Unduh salinan pribadi tab kedua sebelum reload; versi server tetap tersimpan. Tidak ada merge otomatis.

Ganggu jaringan sesudah klik Simpan sehingga hasilnya tidak pasti. Tombol ulang memakai request ID/payload sama dan tidak membuat draft tambahan. Jika tab lain menyimpan di antara percobaan, konflik harus dilaporkan. Field yang belum tersimpan harus memberi peringatan ketika meninggalkan editor. Simpan manual tetap dibutuhkan; tidak ada autosave.

Tanggal tidak valid, waktu selesai sebelum/sama mulai, URL javascript/http, teks terlalu panjang, foto lintas akun, dan lebih dari 6 foto harus ditolak. Acara lewat tengah malam belum didukung.

## Foto privat

Upload JPEG/PNG/WebP sah <5 MB. Editor menghasilkan WebP, simpan draft, buka preview dan perangkat lain akun A. SVG, file teks yang diganti ekstensi, gambar rusak, dan gambar >5 MB harus gagal. Tes juga bypass browser terhadap Storage untuk memeriksa policy pemilik.

Akun B tidak boleh membuat signed URL foto A. URL publik bucket harus gagal. Signed URL yang sudah dibuat dapat digunakan pemegang link selama valid: jangan menganggapnya sekali-pakai. Coba setelah satu jam/muat ulang untuk memperbarui. Hapus foto dari draft dan pastikan UI menjelaskan storage belum otomatis dibersihkan.

## Permintaan opsional dan admin

Default kedua flag OFF: POST API ditolak dan RPC langsung juga ditolak. Uji flag server ON/database OFF: RPC masih menolak. Baru aktifkan keduanya di staging, dari akun dengan email terkonfirmasi dan draft lengkap.

Kirim permintaan dengan nama + nomor Indonesia + persetujuan. Tercatat satu kode KI, snapshot/tema/harga server, status `new`. Kirim ulang payload sama: kode tetap sama, tidak duplikat. Ubah nilai harga/status pada request: ditolak. Uji memasukkan ID draft akun lain: ditolak. Snapshot permintaan lama tidak mengikuti edit draft berikutnya.

Admin mengubah ke contacted/processing/cancelled dan perubahan dicatat pada `ki_order_events`. Status tidak boleh lunas/published. Akun biasa tidak dapat mengubah status. Admin membaca snapshot teks permintaan; fitur edit undangan pelanggan/foto atas nama admin belum tersedia.

## Gerbang peluncuran

Checklist ini bukan bukti lulus. Lampirkan hasil tes, verifikasi RLS nyata, build, browser/hydration, keamanan upload/rate limit, backup-restore, kuota, identitas/kontak/privasi layanan, serta pembayaran/publikasi sebelum menghapus noindex dan menerima pembelian.
