# Checklist pengujian v1.8.0

Semua langkah berikut adalah **yang perlu dijalankan**, bukan daftar hasil lulus. Hasil aktual ada di TEST_REPORT.md.

## Kode dan demo

Jalankan npm ci → npm test → check:release-contract → typecheck → build. Pasang browser Playwright lalu verify:release. Pastikan health melaporkan versi package yang sama dan tetap tidak mengklaim backend/produksi terverifikasi.

Suite browser harus membuka seluruh **15 demo** dari registry. Periksa musik native Web Audio dimulai setelah membuka undangan dan berhenti ketika dijeda; rekening contoh tidak tampil sebelum disclosure dibuka; galeri fixture bisa berpindah foto, ditutup dengan Escape, dan fokus kembali ke tombol awal. Fixture tidak memuat data pelanggan. Musik browser test memeriksa state AudioContext, bukan penilaian kualitas suara yang terdengar.

## Database dan diagnostik

Pada database lokal disposable, test:sql:local harus mencatat semua migrasi 001–012 serta setiap fixture sebagai sukses. Uji harga/nama tema kustom, tema nonaktif, CMS draft yang belum dipublish, tagihan/expiry, dan snapshot undangan lama tetap sama setelah upgrade. Pengulangan migrasi terakhir tidak menambah versi CMS.

Pada staging Supabase, jalankan preflight baca-saja sebelum upgrade bila keadaan belum jelas. Setelah 012, periksa kemampuan musik/hadiah dan katalog15. Nonaktifkan satu tema melalui CMS: bukan kegagalan migrasi. Jangan menyembunyikan tema produksi hanya untuk menjalankan tes ini.

Pemeriksaan yang hanya mendapatkan schema7 tetapi RPC diagnostik belum tersedia harus menampilkan bahwa kemampuan fitur belum terverifikasi; tidak boleh disebut seluruh fitur siap. Balasan tidak valid, timeout, dan metadata SQL salah tetap harus gagal-tertutup.

## Staging dua akun/admin

Login A dan B: data privat tetap terpisah. Buka draft lama tanpa musik/hadiah, lalu draft baru dengan Serenade dan tiga rekening hadiah. Simpan/buka ulang dan periksa konten terbit tidak berubah sampai pemilik menerbitkan versi terbaru.

Admin mengubah harga satu tema: checkout baru membacanya, pesanan lama tidak berubah. Simpan/preview/publish CMS, konflik dua tab, dan pemulihan riwayat masih bekerja. Setelah verifikasi manual dan publish, tamu membaca undangan tanpa login; RSVP personal tetap memerlukan token dan ucapan tetap melalui izin/moderasi. Jangan memakai uang atau token pelanggan nyata.

Periksa `/test-fixtures/gallery` memberi 404 pada deployment normal (tanpa KI_E2E_DEMO). Pastikan secret server tidak masuk bundle/browser dan bucket foto tetap privat. Uji foto galeri asli, dua akun, penghapusan/pencabutan, beban, dan backup/restore tetap wajib terpisah dari fixture.

## Yang tidak diuji otomatis oleh suite demo

Pengiriman email/reset, SDK Supabase produksi, mutasi rekening bank, concurrency lintas pengguna, biaya media, kualitas audio di semua perangkat, restore foto/database, serta ketahanan spam atau seluruh keamanan produksi.
