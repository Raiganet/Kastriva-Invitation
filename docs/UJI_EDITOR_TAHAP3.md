# Uji penerimaan tahap 3 — jalankan pada STAGING

**Daftar ini adalah prosedur, bukan catatan bahwa uji ini sudah berhasil di proyek Diky.** Gunakan akun A dan B nonadmin yang telah dikonfirmasi, ditambah akun admin bila memeriksa sistem. Pakai acara/foto uji milik sendiri. Jangan membagikan token, URL konfirmasi, atau session key.

## Prasyarat

`npm install`, `npm test`, `npm run typecheck`, dan `npm run build` berhasil. Pasang migrasi berurutan sampai 003; `/setup` harus membaca versi 3. Uji email/login/reset dan isolasi akun tahap 2 tetap wajib. Pada staging, `ENABLE_ORDER_REQUESTS=false` dan flag database false.

## Skenario utama

| Skenario | Langkah | Hasil yang harus terlihat |
|---|---|---|
| Draft lama | Buka draft buatan tahap 2 tanpa mengedit. | Acara lama terbaca; revision tidak bertambah hanya karena halaman dibuka. |
| Draft baru | Dashboard → Buat draft; isi nama. Tunggu autosave. | URL berisi ID draft stabil; balasan server menaikkan revision; Dashboard hanya menampilkan satu draft. |
| Ketikan saat simpan | Perlambat jaringan pada DevTools. Edit cerita saat request sebelumnya berlangsung. | Balasan request pertama tidak mengembalikan teks ke versi lama; ketikan terbaru dikirim pada simpan berikutnya. |
| Dua acara | Isi akad dan resepsi dengan tanggal/tempat berbeda. Simpan dan buka ulang. | Keduanya bertahan; sampul memakai acara pertama; kalender masing-masing memiliki tanggal/jam yang benar. |
| Ganti tema | Ubah tema beberapa kali dan simpan. | Nama, acara, cerita, urutan foto tetap sama. Tidak membuat draft baru. |
| Isian belum valid | Kosongkan jam mulai atau ketik URL yang belum lengkap. | Form tetap bisa diketik; simpan dijeda dengan pesan. Perbaiki input lalu status dapat tersimpan. |
| Foto | Unggah beberapa JPG/PNG/WebP uji. Uji berkas >5 MB dan bukan gambar. | Hanya sukses terkonfirmasi ditautkan; kesalahan per berkas terlihat. Maksimal enam foto. |
| Sampul | Pilih Sampul pada foto kedua, ubah urutan, simpan dan buka ulang. | Foto sampul/urutan bertahan, tidak menghilangkan isian lain. |
| Lepas foto | Lepas satu foto lalu simpan. | Referensi hilang dari draft; berkas tetap privat di Storage. |
| Preview | Ubah teks belum tersimpan; lihat preview, lalu preview versi server. | Preview langsung memakai formulir; preview server hanya versi tersimpan. Tidak ada publikasi ke tamu. |
| Akun B | Login pada browser terpisah; buka ID/URL draft A dan coba media A. | Tidak memperoleh data A. Jangan mengubah RLS menjadi using(true) agar tes lewat. |

## Koneksi dan pemulihan

1. Pada draft tersimpan, jadikan browser offline melalui DevTools, ubah cerita, lalu refresh pada tab yang sama. Form tidak boleh menandai perubahan sudah tersimpan. Setelah login/backend bisa dibuka kembali, salinan lokal ditawarkan; pilih Pulihkan dan pastikan isian ada. Browser yang tidak bisa memuat halaman saat offline baru dapat memulihkan setelah kembali online: ini bukan offline app lengkap.
2. Buat draft baru, ganggu respons setelah request dikirim. Jangan memilih ID baru. Tekan Coba simpan kembali. Periksa bahwa retry memakai request_id dan payload yang sama. Setelah respons terkonfirmasi, perubahan berikutnya boleh dikirim; jumlah draft tetap satu.
3. Refresh setelah server menerima simpan pertama tetapi respons hilang. URL baru harus mengarah ke draft yang sama bila row sudah ada. Salinan lokal dapat direkonsiliasi berdasarkan last_request_id/revision; tidak membuat duplikasi.
4. Matikan autosave, ubah isian, unduh JSON. Refresh dan pilih Gunakan versi server: pilihan ini membuang salinan tab. Muat JSON lagi; autosave harus dijeda dan server belum berubah sampai disimpan.
5. Uji sessionStorage diblokir/kuota penuh pada profil browser uji. Harus ada pesan dan simpan tidak menyeberang jaringan sebelum identitas permintaan dapat dicatat. Perbaiki penyimpanan atau unduh salinan, bukan terus menekan tombol tanpa membaca pesan.
6. Tutup/bersihkan tab uji setelah mengunduh JSON. Jangan menganggap salinan sesi pasti bertahan. Pemulihan lintas perangkat menggunakan JSON dan login akun pemilik, bukan sinkronisasi sessionStorage.

## Konflik dan sesi

Buka draft A yang sama di dua tab; pada keduanya jeda autosave. Tab pertama menyimpan perubahan menjadi revision baru. Tab kedua yang masih revision lama harus mendapat konflik ketika menyimpan, tidak menimpa server. Unduh perubahan tab kedua lalu muat ulang server. Penggabungan isian tetap manual. Uji pula draft yang dihapus tab lain: request lama tidak boleh menghidupkan draft tersebut.

Saat editor terbuka, logout atau beralih akun pada tab lain. Editor harus menahan pengiriman dan meminta login pemilik. Uji permintaan yang sedang berlangsung saat perubahan akun: respons tidak boleh membuka penulisan untuk akun berbeda. Sesi/token tidak boleh berada dalam JSON atau jurnal editor.

## Script tambahan (opsional, bukan bukti peluncuran)

`supabase/tests/003_editor_validation.sql` adalah 11 pemeriksaan validator murni di dalam BEGIN/ROLLBACK, tanpa perubahan baris pelanggan atau Storage. Jalankan melalui SQL Editor staging setelah 003. Script belum dieksekusi penyusun. Tidak menguji RLS/Auth/media. Catat output atau error, jangan memberikan hak execute publik pada validator hanya supaya script klien dapat memanggilnya.

`npm run test:supabase` tanpa opt-in harus SKIP/kode 2. Untuk uji tulis fixture dua akun secara sengaja, ikuti opt-in/akun khusus pada `UJI_SUPABASE_TAHAP2.md`; script versi ini mengharapkan skema 3 dan memakai dua acara dalam fixture. Jangan menggunakan service-role key, akun pelanggan nyata, atau proyek aplikasi lain. Akun uji dan marker tombstone tetap ada setelah pembersihan fixture.

## Bukti yang dicatat

Simpan hasil build, tanggal, versi aplikasi/skema, skenario, hasil, serta screenshot tanpa kredensial. Bedakan PASS/FAIL/BELUM DIUJI. Log npm test bukan bukti email diterima atau foto terisolasi. Jangan meneruskan ke pembayaran/publikasi sebelum kegagalan prioritas data/akun terselesaikan.
