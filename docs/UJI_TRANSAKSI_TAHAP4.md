# Checklist staging — Tahap 4 (belum dijalankan di akun Diky)

Gunakan proyek Invitation khusus staging. Jangan memakai dana, dokumen identitas, data pelanggan nyata, atau key privat di browser. Tiga akun: pelanggan A, pelanggan B, admin C. Email terkonfirmasi. C ada di `ki_admins`; A/B tidak. Build harus berhasil dahulu.

## Gerbang awal

Install, unit, syntax, typecheck dan build lulus. SQL 001–004 berurutan; `/setup` versi 4. `/admin/sistem` memeriksa 11 tabel RLS, grants, bucket privat, dan RPC foto. Semua indikator relevan benar. Pengujian dua akun tahap 2 dan editor tahap 3 tetap wajib. Catat hasil aktual setiap pengujian berikut, bukan hanya memberi tanda selesai tanpa menjalankannya.

| Kasus | Hasil yang harus diperoleh |
|---|---|
| Kedua flag DB false, kirim checkout langsung ke RPC | Ditolak; UI juga nonaktif. |
| Non-admin membuka `/admin`, mengganti metadata jadi admin | Tetap ditolak. |
| A punya draft lengkap tanpa pembayaran | Belum ada link publik. |
| Isi bank/masa aktif staging, buka DB+environment | Checkout bisa dimulai, belum ada pemotongan uang. |
| Harga/settings berubah ketika form checkout sudah terbuka | Konflik kuotasi; pengguna memuat ulang ringkasan sebelum melanjutkan. |
| Klik dua kali / respons setelah commit dihilangkan | Satu pesanan untuk draft; retry request yang sama membaca hasil yang sama. |
| Ubah `owner_id`, harga, status paid, received_amount pada payload pelanggan | Kolom asing/peran tidak sah ditolak; jumlah final berasal dari DB. |
| B memakai ID pesanan/draft A via halaman dan RPC | Tidak dapat membaca/mengubah. |
| A mengirim ‘sudah transfer’ | Menunggu verifikasi, belum paid/published. |
| A mencoba action approve/revoke atau direct UPDATE ki_sales | Ditolak. |
| C menyetujui tanpa centang / jumlah salah / referensi kosong | Ditolak. |
| C menolak dengan alasan | A melihat alasan, dapat mengirim perbaikan referensi. |
| C menyetujui nominal benar pada fixture | Paid dan expiry tepat masa aktif; tidak otomatis terbit. |
| Ulangi exact approval / versi lama dengan request baru | Exact retry tidak menambah masa aktif; versi/status tak sesuai ditolak. |
| Dua admin/tab memverifikasi versi yang sama | Hanya satu perubahan sah; yang lain konflik atau same-id replay. |
| Pilih slug kurang dari 5 karakter, huruf besar, minus ganda, ../ atau sudah dipakai | Ditolak. Untuk tabrakan slug, buat pesanan fixture kedua. |
| Publish tanpa consent / belum paid / expired / tema draft berbeda | Ditolak. |
| Publish draft valid | `/u/slug` tanpa login berisi salinan yang diterbitkan saja. |
| Ubah draft setelah publish | Tamu tetap melihat versi lama sampai publish ulang. |
| Publish ulang | Versi/foto terbit berubah, expiry tetap. |
| HTML/script pada nama/cerita/sapaan | Ter-render teks, tidak dieksekusi; URL bukan identitas tamu. |
| Tamu membuka database langsung | Tidak dapat SELECT ki_sales/ki_publications/media privat; RPC publik hanya proyeksi aman. |
| Periksa response JSON/HTML publik | Tidak ada customer_email/phone, owner_id, receipt, session token, path privat atau secret. |
| Secret server kosong / key salah / foto dihapus | Tidak membuka foto privat; tampil error/gagal tertutup, bukan memakai URL publik fallback. |
| Foto indeks 0–5 sah / indeks negatif / versi lama / traversal / SVG / fake JPEG | Hanya foto terbit versi aktif yang didekode; data lain ditolak. |
| Tarik undangan / cabut akses / expiry / DB publishing false | Pembacaan baru halaman/foto ditolak. Salinan yang sudah dibuka tidak dijanjikan hilang. |
| Audit mencapai 200 tindakan normal | Publikasi baru/konfirmasi dibatasi; revoke/cancel/unpublish tetap dapat dilakukan. |
| Hapus draft yang terkait sales | Ditolak. Foto tidak dihapus otomatis. |
| Mengubah bank/hari/harga setelah order dibuat | Snapshot pesanan lama tetap sama. |
| Membatalkan / mencabut | Tidak memanggil refund atau memindahkan uang. |
| Cetak di HP/desktop | Ringkasan jelas, status belum paid tidak menyatakan lunas, kontrol interaksi disembunyikan. |
| sessionStorage blocked/full / logout / pergantian akun | Tidak mengirim mutasi diam-diam, retry akun lain ditolak; cek status server sebelum menyelesaikan. |
| Timeout / 503 / HTML 200 / JSON tidak valid | Tidak tampil sukses palsu; exact retry tersedia. |

## SQL opsional

`supabase/tests/004_commerce_integration.sql` disiapkan untuk sebagian kasus ownership/RLS/state/quote/idempotency/publication menggunakan fixture sementara. Jalankan satu berkas penuh sebagai postgres hanya di staging setelah cadangan. Berkas memakai SET LOCAL ROLE untuk anon/authenticated, akun fixture sementara, serta ROLLBACK. Sequence audit bisa maju walaupun rollback. Trigger custom mungkin berjalan; karena itu tidak untuk produksi. Script belum dieksekusi penyusun; jangan melaporkan jumlah assertion sebagai tes yang lulus sebelum dijalankan.

Script ini tidak menguji Auth HTTP, Supabase JS, CSRF, mail, Storage, Sharp pada deployment, atau browser Next. Bahkan bila SQL lulus, browser+network tetap harus diuji. Catat tanggal, commit deployment, skema versi, akun fixture (tanpa token), langkah, harapan, hasil, dan screenshot yang telah disamarkan. Redaksikan key/tautan konfirmasi.

## Sebelum membuka pelanggan nyata

Tetapkan syarat layanan, kebijakan refund/retensi, harga, masa aktif, kontak pengelola; ukur beban proxy foto dan quota; tambah rate-limit terdistribusi/mitigasi penyalahgunaan; review secrets/dependensi/grants; atur backup dan observabilitas tanpa log pribadi. Paket ini belum menyatakan gerbang tersebut selesai.
