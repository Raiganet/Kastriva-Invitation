# Roadmap yang diselaraskan

## Tahap sekarang: perbaikan fondasi, bukan langsung lanjut pembayaran

Kode Express/SQLite diganti ke Next.js/Supabase, identitas Kastriva, tema/harga awal dipertahankan, alur demo diperjelas. Kode akun/editor/permintaan dasar ditambahkan untuk menyatukan fondasi. Build dan integrasi live masih harus lolos; jangan memberi label seluruh tahap 1–3 selesai hanya karena file sudah ada.

| Tahap arahan awal | Posisi paket ini | Target sebelum lanjut |
|---|---|---|
| 1. Website/katalog/demo | Kode tersedia, review statis dilakukan | Install/typecheck/build, navigasi/interaksi React nyata pada HP dan desktop lulus |
| 2. Database/akun | SQL dan Auth SSR disiapkan, belum integrasi live | Konfirmasi email, login/logout/recovery dan isolasi 2 akun lulus |
| 3. Dashboard/editor | Editor manual, foto, preview privat, revision checks disiapkan | Simpan lintas perangkat, konflik tab, validasi serta Storage privat lulus |
| 4. Order/payment/publish | Hanya permintaan bantuan opsional OFF | Paket dan entitlements, verifikasi pembayaran admin, aktivasi, slug publik, snapshot published, masa aktif |
| 5. Tamu/RSVP | Demo lokal saja | Link personal/token tamu, RSVP nyata, moderasi, anti-spam, izin akses data tamu |
| 6. Admin/CMS | Daftar permintaan/status dasar | Edit data pelanggan secara terotorisasi, katalog/paket/harga terpusat, konten website, audit dan panduan lengkap |
| 7. Launch | Belum | Audit/pengujian menyeluruh, backup-restore, rate limits, quota/retensi, performa, SEO, monitoring dan penerimaan bisnis |

Autosave dengan indikator/recovery draft, beberapa jadwal akad/resepsi terpisah, waktu melewati tengah malam, musik berlisensi, hadiah digital, dan desain galeri lebih kaya perlu tahap editor/penerbitan berikutnya. Saat ini satu rentang acara per hari didukung. Dua jalur jualan (buat sendiri/dibantu admin) belum dinyatakan sepenuhnya selesai.

Prioritas sesudah Diky mengekstrak ZIP: pastikan `npm install` dan `npm run build` berhasil. Baru konfigurasi Supabase dan uji dua akun. Jangan sekaligus menambah pembayaran/CMS sebelum fondasi berhasil.
