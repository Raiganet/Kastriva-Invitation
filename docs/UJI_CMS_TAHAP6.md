# Checklist staging — CMS dan operasional tahap 6

Belum dijalankan end-to-end oleh penyusun. Catat hasil nyata, jangan menandai PASS hanya karena source tersedia. Gunakan proyek Invitation staging, bukan akun/data/uang pelanggan. Siapkan admin A terkonfirmasi, admin B untuk konflik, pelanggan C, dan browser/incognito tanpa login.

## Gerbang awal

Install, typecheck, build, Next.js browser/hydration, SQL001–006, `/setup` versi6, `/admin/sistem` harus lulus. Uji login/logout/reset dan akun terisolasi. Gerbang transaksi/RSVP tetap false kecuali perlu fixture staging. Migrasi tidak dijalankan oleh `npm run build`.

## Skenario wajib

| Skenario | Yang harus diperiksa |
|---|---|
| Akses | Tanpa login/C tidak bisa membaca CMS draft, sejarah, ringkasan, directory, atau API CMS; metadata admin palsu tidak memberi akses. |
| RPC langsung | Browser anon/authenticated tidak SELECT/UPDATE tabel CMS; nonadmin tidak memanggil mutasi admin. Jangan hanya mengandalkan tombol disembunyikan. |
| Simpan draft | Edit judul unik, simpan. Private preview server berubah, halaman publik/anon tetap lama. |
| Publish | Persetujuan dan draft tersimpan diperlukan. Setelah publish dan refresh publik, judul/navbar/footer baru muncul; SQL published_revision cocok. |
| Preview | Formulir belum tersimpan tampil hanya pada Preview isian. Preview draft server membaca versi tersimpan. Href preview tidak membuka CMS tanpa akun admin. |
| Kontak | Isi email/WhatsApp/website valid, publish, periksa tujuan link. JavaScript URL, HTML, extra keys dan input terlalu panjang ditolak baik API maupun RPC. |
| Harga konsisten | Catat harga awal; buat pesanan staging A. Edit harga di CMS, simpan tetapi jangan publish: publik belum berubah. Publish: landing/katalog/harga/pilih tema/editor/checkout baru menampilkan harga baru. Pesanan A masih harga lama. |
| Kuotasi stale | Tab checkout dibuka sebelum harga berubah. Sesudah publish, submit harus meminta peninjauan ulang, bukan menerima harga klien lama. |
| Tema nonaktif | Matikan tema yang punya draft/pesanan terbit. Katalog dan pilihan baru menghilang. Draft lama tetap dapat diedit dengan tema sama. Undangan paid/published lama tidak dicabut. Checkout baru ditolak. |
| Kategori demo | Tema ulang tahun/aqiqah/corporate tidak tiba-tiba memiliki editor/pembayaran pernikahan. |
| Dua admin | A dan B buka versi sama. A simpan, B simpan harus konflik. B unduh JSON, perbarui data server, cocokkan, lalu simpan. Tidak ada force overwrite. |
| Harga edit SQL | Hanya staging: operator mengubah harga database setelah CMS dibuka. Save/publish versi baca lama harus konflik katalog; perbarui data server dan Muat Published. |
| Hilang balasan | Simulasikan response putus setelah server commit. UI tidak menyatakan gagal pasti. Retry memakai request ID/payload sama, revision dan history tidak bertambah dua kali. |
| Refresh/penyimpanan | Refresh tab dengan request tertunda menawarkan retry sama. Browser yang memblokir sessionStorage tidak mengirim mutasi. Ketikan tanpa save/journal tidak diasumsikan pulih. |
| Riwayat/backup | Salinan JSON dapat diunduh/dimuat tanpa otomatis publish. Sejarah dimuat ke formulir saja. Periksa harga lama sebelum republish. Salinan HTML/JSON asing/extra keys ditolak. |
| Layanan gagal | Putuskan akses backend staging. Katalog menampilkan unavailable, bukan harga statis lama. Admin tidak menampilkan angka nol/blank draft seolah berhasil. |
| Operasional | Ringkasan cocok SQL pesanan fixture. Directory hanya akun yang pernah pesan, filter/search/page tepat. Tidak menampilkan password/draft/buku tamu/ucapan pelanggan. |
| SEO | Default noindex dan disallow. Publish allowIndex true pada staging privat: periksa robots.txt dan meta tiga halaman marketing. Admin/akun/demo/undangan tetap noindex. Jangan menganggap ini autentikasi. |
| HP/desktop | Uji klik nyata semua9 tab, keyboard/fokus, submit/retry/import, preview dan header pada320/390/768/1440px. Screenshot statis tidak menggantikan uji ini. |
| Regresi | Akun A/B, autosave offline/retry, foto privat, checkout manual, pembayaran/publikasi, token RSVP, kapasitas, consent, moderasi, tarik izin, dan CSV tetap diuji dari panduan tahap2–5. |

## SQL opsional

`supabase/tests/006_cms_integration.sql` memakai fixture auth dan pesanan simulasi BEGIN/ROLLBACK. Jalankan hanya staging sebagai postgres, seluruh file. Ia menguji kontrak server, bukan email/browser/Storage/pembayaran nyata. Status penyusun: **BELUM DIEKSEKUSI**. Exception menandakan kegagalan; jangan menghapus guard agar tampak lulus.

SQL uji003/004/005 diperluas prasyaratnya agar menerima6, sedangkan migration001–005 tidak diubah. Kesesuaian semua uji tetap perlu eksekusi nyata. Perintah `test:supabase` otomatis sebelumnya memerlukan opt-in dan akun staging; tidak dijalankan dengan kredensial dalam paket ini.

## Catatan hasil

Simpan tanggal, commit/build, versi skema, skenario, hasil PASS/FAIL, langkah reproduksi dan log tanpa secrets. Keamanan produksi memerlukan review terpisah, backup teruji, retensi/kuota, pembatasan trafik dan audit dependensi. Jangan membuka transaksi pelanggan sebelum kegagalan diperbaiki.
