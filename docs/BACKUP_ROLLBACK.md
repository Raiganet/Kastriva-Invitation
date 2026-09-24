# Backup, penghentian layanan, dan pemulihan

Runbook manual sebelum peluncuran. Tidak ada backup, restore, penghapusan, atau rotasi kredensial yang dilakukan otomatis oleh paket. Uji di staging. Jangan mengirim kredensial/backup ke chat atau repository publik.

## Cadangkan tiga hal secara terpisah

**Kode dan konfigurasi:** simpan ZIP tahap6, ZIP tahap7, commit dan lockfile yang tervalidasi. Inventaris environment/domain/Auth URL/email template disimpan privat; jangan memasukkan nilai secret ke README. Simpan akses pemulihan akun pengelola secara aman.

**Database:** gunakan mekanisme backup/ekspor yang sesuai proyek Supabase dan paket layanan sebenarnya. Catat waktu, schema, tabel/fungsi/grant/policy, Auth dan jejak migrasi yang dicakup. Jangan menganggap ekspor CMS JSON, CSV tamu, atau JSON draft sebagai backup database. Periksa kelengkapan terhadap kebutuhan pemulihan, bukan hanya keberadaan file.

**Storage/media:** pastikan bytes foto pada bucket ki-media dicadangkan secara terpisah beserta path/metadata yang diperlukan. Backup database saja tidak membuktikan foto dapat dipulihkan. Tautan signed yang sudah kedaluwarsa bukan backup. Jaga bucket tetap privat di tujuan.

## Latihan restore

Pulihkan ke proyek staging terpisah dengan akses terbatas; jangan menguji restore pertama kali dengan menimpa proyek asli. Cocokkan jumlah/identitas akun dan draft, snapshot harga/pesanan, jadwal, path foto dan bytes, publikasi, tamu/kunci, jawaban/consent/moderasi, CMS, role/grant/RLS. Pemetaan UID harus tetap benar; membuat akun baru dengan email sama tidak otomatis memakai UID lama.

Uji sesi baru, verifikasi autentikasi/email/template di staging, akses A/B, foto privat dan buka undangan setelah flag terkendali. Domain/origin/token/link yang masih menunjuk produksi tidak boleh dipakai diam-diam sebagai bukti restore. Jangan kirim email atau WhatsApp massal dari fixture. Catat berapa data yang dipulihkan dan kapan backup dibuat; tentukan kehilangan data/downtime yang dapat diterima pemilik.

## Penghentian layanan

Matikan **flag database** publishing dan RSVP melalui panel admin terkait; bila admin tidak tersedia, operator berwenang mengikuti prosedur insiden proyek yang sudah ditetapkan. Environmentfalse hanya menutup satu deployment, bukan semua pengguna database. Checkout dapat ditutup terpisah tanpa mengubah pesanan menjadi batal/lunas. Jangan menghapus tabel untuk menghentikan traffic. Data yang sudah tampil/screenshot tidak bisa ditarik kembali.

## Rollback setelah007

007 menutup hak RPC publik anonim. Kode1.6 tidak kompatibel dengan akses publik baru. Pilihan awal adalah tetap menutup layanan dan memperbaiki kode1.7 secara forward. Jangan menjalankan ulang001–006, mengubah bucketmenjadi publik, atau memberikan EXECUTE ke anon untuk menyembunyikan kegagalan.

Bila benar-benar perlu restore seluruh database dari backup pra007, rencanakan bersama versi kode, foto, domain, sesi, jejak transaksi serta perubahan sejakbackup. Restore dapat kehilangan pesanan/RSVP baru; lakukan hanya setelah persetujuan pemilik dan uji terpisah. Tidak disertakan skrip downgrade/destruktif otomatis.

## Secret dan log

Rotasi key yang pernah bocor di provider asal; menghapus file tidak mencabut key. HMACharian bukan enkripsi atau data anonim. Tabel limiter dapat berisi pseudonim lebih dari24jam bila tidak ada traffic baru, dan backup/log punya retensi sendiri. Tentukan retensi log/backup serta prosedur penghapusan akun/tamu/foto sebelum produksi. Jangan mengaktifkan logging badan RSVP, fragment guest, Authorization atau tokenemail.

Referensi konsep backup layanan: https://supabase.com/docs/guides/platform/backups . Kapabilitas dan retensi aktual harus diperiksa pada proyek/paket yang digunakan; runbook tidak menyatakan backup otomatis tersedia untuk semua paket.
