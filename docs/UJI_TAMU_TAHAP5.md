# Checklist staging — Tahap 5

**Belum dijalankan terhadap Supabase/Next.js nyata oleh penyusun.** Catat tanggal, versi commit, browser, akun fixture, hasil aktual, dan kegagalan. Jangan mencatat password, secret, token email, atau tautan tamu lengkap dalam log. Gunakan data acara dan tamu fiktif berizin, bukan pelanggan.

## Prasyarat

Install → unit test → syntax → typecheck → build benar-benar berhasil. Database khusus Invitation dengan 001–005; Auth/Storage dan pengujian dua akun dari tahap 2/3 lolos. Uji checkout/manual-payment/publication tahap 4 terlebih dahulu. Tidak perlu transfer uang nyata untuk fixture; status paid pada SQL fixture bukan pembayaran komersial.

Siapkan dua akun pelanggan A/B dan akun admin C terpisah. A memiliki undangan diterbitkan dengan masa aktif valid. B memiliki undangan berbeda. Jangan memberi B role admin untuk mempermudah pengujian. Buka browser/profil terpisah serta tab tamu tanpa login.

| Kasus | Hasil yang wajib diperiksa |
|---|---|
| Instalasi 005 | Versi 5, tabel/RPC terpasang, akun/draft/pesanan lama tidak hilang. Re-run 005 pada staging tidak mereset pengaturan. |
| Default tertutup | RSVP tidak terbuka hanya karena source sudah diunggah. Gate environment, platform, dan per-undangan diperiksa. |
| Tambah daftar | 1–25 nama tersimpan; 26 ditolak; kapasitas 1–10; total maksimum 500. Batch ganda dengan ID request sama tidak membuat duplikasi. |
| Daftar dan pencarian | Reload menampilkan data server; filter/status/paginasi 25 bekerja; nama sama tidak diam-diam digabung. |
| Akun lain | B tidak dapat membaca, menambah, mengedit, menonaktifkan, mengambil link, atau mengekspor daftar A meski mengganti sale/guest ID pada request. |
| Admin bukan pemilik | C dapat mengatur global gate, tetapi RPC/UI baru tidak membuka buku tamu A/B. Metadata signup tidak memberi role admin. |
| Anon/direct database | Tabel tamu/RSVP/keys tidak dapat di-select/update langsung dari anon atau authenticated. Jangan menganggap UI tersembunyi membuktikan RLS. |
| Tautan umum | Parameter nama saja tidak dapat membuat RSVP. |
| Tautan personal | Fragment lengkap membuka konteks rombongan yang sesuai; salah token/slug tidak membuka jawaban orang lain. Tidak ada secret/path Storage dalam HTML. |
| Tautan & WhatsApp | Salin link dan salin pesan, fallback clipboard pada HP, WhatsApp manual mempertahankan fragment. Tidak ada pengiriman massal otomatis. |
| Navigasi acara | Tombol Lihat detail acara menggulir tanpa menghapus fragment tamu. Refresh tetap mempunyai akses selama token valid. |
| RSVP | Hadir wajib 1–kapasitas; Tidak hadir/Belum pasti menyimpan 0. Jawaban bertahan setelah reload, satu jawaban per tamu. |
| Ucapan privat | Tanpa consent tidak muncul di publik dan admin pemilik tidak dapat menyetujuinya secara paksa. |
| Ucapan berizin | Nama publik wajib; status awal pending; setelah pemilik setujui baru tampil. Daftar publik tanpa kapasitas/jumlah/identitas internal/token. |
| Edit jawaban | Respons berizin yang diedit kembali pending; hitungan orang diperbarui, bukan menambahkan respons duplikat. |
| Tutup penerimaan | Submit biasa ditolak; data lama terbaca. Penarikan izin yang mempertahankan jawaban masih diperbolehkan ketika undangan aktif. |
| Penarikan izin | Ucapan tidak diberikan pada pembacaan baru; jumlah orang tidak berubah. Snapshot yang sudah dibuka tetap dapat ada. |
| Pergantian kunci | Tautan lama tidak berlaku; tautan baru membuka jawaban yang sama. |
| Nonaktifkan | Tautan ditutup, ucapan publik hilang, dikeluarkan dari rekap aktif, riwayat tetap ada. Reaktivasi membutuhkan masa aktif valid. |
| Perubahan kapasitas | Tidak dapat dikurangi di bawah jumlah orang yang sudah dikonfirmasi. |
| Dua tab | Edit bersamaan menghasilkan satu versi dan konflik yang jelas, bukan saling menimpa diam-diam. |
| Jaringan/timeout | Matikan koneksi sebelum request dan hilangkan balasan setelah commit secara terkontrol; retry pakai payload/ID lama. Tidak tampil sukses palsu atau membuat tamu ganda. |
| Sesi browser | Refresh tab memulihkan request; storage diblokir menahan write; akun berubah tidak memakai journal akun sebelumnya. |
| Input berbahaya | HTML tampil sebagai teks. Tolak control bytes, Unicode melebihi batas, kolom tambahan, status paid palsu, token duplikat, dan invalid revision. Uji API serta RPC langsung. |
| Rate-limit | Jeda 30 detik/20 per jendela 24 jam; duplikat exact-request tidak mengonsumsi kuota. Owner normal 40 per menit; privasi tidak terhalang limiter normal. |
| CSV | Seluruh daftar termasuk nonaktif, tanpa token; formula prefix terlindung; Unicode/kutip/baris baru benar; pengguna lain tidak bisa ekspor. |
| Penutupan global | Flag database off memblokir RPC tamu langsung, bukan hanya halaman; owner tetap dapat membaca riwayat dan menonaktifkan. |
| Pembayaran/publikasi | Ditolak bila unpaid/revoked/expired/unpublished. Mengatur tamu tidak membuat paid, mengubah paket, atau memperpanjang masa aktif. |
| Mobile | Lebar 320–390 px; menu/tombol/form tidak terpotong, fokus jelas, sentuh/copy berjalan. Keyboard dan screen-reader label diuji nyata. |

## SQL opsional

`supabase/tests/005_guestbook_integration.sql` mencakup fixture tiga akun, satu paid order fiktif, owner access, isolation B/admin, token/capacity, retry, moderation, consent withdrawal, rate checks, rotation, deactivation, global closure, expiry. Ia tidak menguji React, HTTP, Auth email, Storage, konkurensi multi-connection, limit 500 secara beban, atau uang sungguhan.

Jalankan seluruh file di SQL Editor sebagai postgres **hanya staging khusus**; berhenti saat ada exception. Skrip akan ROLLBACK row fixture, tetapi sequence dapat maju dan custom trigger bisa berjalan. Jangan mengeksekusi potongan tanpa bagian rollback. Rekam hasil aktual sebelum menganggap tes lulus. Jangan melonggarkan keamanan hanya agar tes hijau.

## Gerbang sebelum tahap produksi

Semua alur di atas diperiksa, kegagalan diperbaiki, dependency audit dijalankan, batas penyimpanan/retensi/backup dan rate-limit HTTP dipasang, serta uji beban mencakup foto publik dan daftar ucapan. Rilis kode tidak menggantikan pemeriksaan ini.
