# Hasil pengujian — Tahap 6 / v1.6.0

Tanggal: 24 September 2026. Basis: ZIP tahap 5 v1.5.0. Runtime pemeriksaan: Node 22.16.0, TypeScript global 5.8.3, Chromium lokal, dan Sharp lokal 0.34.1.

**Kode tahap 6 sudah ditambahkan dan pemeriksaan parsial dijalankan. Build Next.js lengkap, SQL pada engine database, Supabase nyata, dan deployment belum terverifikasi.** Tidak ada perubahan pada akun GitHub/Vercel/Supabase Diky, publikasi situs nyata, pengiriman email/pesan, atau transaksi dana yang dilakukan penyusun.

## Hasil yang benar-benar dijalankan

| Pemeriksaan | Hasil aktual | Batas makna |
|---|---|---|
| `npm test` | **417/417 lulus**, 0 gagal atau skip | Fungsi domain, simulasi transport, dan pemeriksaan kontrak kode; bukan 417 operasi Supabase nyata. |
| Sintaks dan import lokal | **143 file TS/TSX**, 0 error | Parser/transpiler TypeScript, bukan typecheck seluruh aplikasi beserta dependensinya. |
| Typecheck ketat subset tahap 6 | **8 file**, 0 error | Lima modul logika dan tiga file tes. Komponen React, handler Next.js, serta SDK Supabase tidak termasuk. |
| Sintaks skrip MJS | **5/5 lulus** | `node --check`, bukan pengujian jaringan. |
| Layout HTML statis | **40/40 tanpa overflow horizontal** | Sepuluh fixture pada 320, 390, 768, dan 1440 piksel; bukan runtime React/Next.js. |
| Decoder foto regresi | **9/9 lulus** | Sharp lokal **0.34.1**, berbeda dari pin proyek **0.35.4**. Tidak melibatkan HTTP atau Storage. |
| Pemeriksaan environment tanpa kredensial | PASS mode demo, exit 0 | Tidak menyatakan backend terhubung. |
| `check:supabase` tanpa konfigurasi | SKIP, exit 2 | Tidak ada permintaan ke Supabase. |
| `test:supabase` tanpa opt-in | SKIP, exit 2 | Pengaman tidak menyentuh akun/data server. |
| Instalasi npm dengan waktu/retry dibatasi | **Gagal EAI_AGAIN**, exit 1 | DNS registry npm gagal saat mengambil `@supabase/ssr`. Tidak ada instalasi atau lockfile tervalidasi. |
| Typecheck aplikasi penuh | **Gagal**, exit 2 | Definisi dependensi belum terpasang. Tidak dianggap typecheck seluruh proyek yang lulus. |
| `npm run build` | **Gagal**, exit 127 | Prebuild mode demo berhasil, kemudian `next: not found`. Tidak ada build Next.js yang selesai. |
| SQL 006, RPC, RLS, dan konkurensi database | **Belum dieksekusi** | Inspeksi source bukan kompilasi atau eksekusi PostgreSQL. |
| Browser aplikasi, CMS live, publish, harga, dan Supabase | **Belum diuji end-to-end** | Checklist staging disertakan. |
| GitHub workflow dan Vercel | **Tidak dijalankan pada akun Diky** | Kode workflow bukan bukti deployment berhasil. |

Log aktual berada di `docs/test-results/stage6/`. Log dan gambar tahap 1–5 adalah riwayat. `unit-first.log` mencatat percobaan awal ketika ekspektasi skema 5 belum diselaraskan; hasil akhir ada di `unit-tests.log`. Tes lama tidak dihapus untuk membuat hasil tampak lulus.

## Lingkup 417 tes

318 tes sebelumnya dipertahankan dan 99 tes ditambahkan. Ekspektasi versi aktif diperbarui ke 6; migrasi historis tidak diubah. Tes baru mencakup struktur CMS, batas teks dan Unicode, karakter kontrol/HTML, tautan kontak, delapan slug tetap, duplikasi/kolom asing, harga, riwayat, pengikatan balasan ke request dan revision, jurnal menurut akun, backup JSON, transport HTTP simulasi, serta proyeksi ringkasan dan daftar pelanggan.

Pemeriksaan kontrak source mencari pengamanan yang tertulis: admin dan email terkonfirmasi, RLS/revoke, search_path tetap, replay sebelum pemeriksaan versi/frekuensi, penguncian row, sidik katalog, pemisahan draft/published, pembaruan template tanpa pembaruan tagihan lama, serta perlindungan tema nonaktif. **Hasil ini tidak membuktikan fungsi PL/pgSQL telah berhasil dikompilasi atau kebijakan akses sudah terpasang.**

Lima modul pada pemeriksaan tipe subset adalah `types`, `domain`, `cms`, `admin-operations`, dan `guest-transport`, bersama tiga file tes tahap 6. Pemeriksaan tipe penuh tetap gagal dan dilaporkan terpisah.

## Uji SQL yang disediakan, tetapi belum dijalankan

`supabase/tests/006_cms_integration.sql` memakai fixture staging dalam BEGIN/ROLLBACK. Skenarionya meliputi akses anonim/nonadmin, validasi server, pemisahan simpan/publish, percobaan ulang, konflik versi, perubahan harga tanpa mengubah tagihan lama, kelanjutan draft tema nonaktif, dan konflik katalog yang diubah di luar CMS.

**Script itu belum dieksekusi oleh penyusun dan tidak dihitung sebagai tes lulus.** Jangan menjalankannya pada produksi. PostgreSQL sequences dapat tetap maju dan custom triggers dapat berjalan. SQL pengujian 003–005 hanya diperluas prasyarat kompatibilitasnya agar menerima skema 6; migration 001–005 tetap identik.

## Perbaikan yang diperiksa

Katalog, harga, halaman pilih tema dan opsi editor mengambil metadata database. Saat backend gagal, harga statis lama tidak diam-diam dipakai sebagai harga aktif. Publish CMS tidak menulis ulang snapshot harga/rekening/durasi/nama tema pesanan lama. Tema nonaktif masih bisa digunakan draft lama yang sama sesuai pemiliknya, tetapi pilihan baru tetap diperiksa server.

Pengaturan robots sekarang mengikuti pilihan SEO CMS, tetap tertutup secara default. Penanganan teks panjang pada brand/navbar/footer dan hero dirapikan. Nama brand yang dipendekkan secara visual tetap tersedia melalui title/aria. Batas nama pada proyeksi pelanggan mengikuti jumlah karakter PostgreSQL, termasuk nama dengan emoji.

CMS menyediakan tombol Perbarui data server setelah pengguna menjaga salinan editnya. Muat Published menggunakan snapshot terakhir yang dimuat, bukan pembacaan baru tersembunyi. Pemulihan permintaan tertunda tidak disebut sebagai autosave seluruh ketikan.

## Pemeriksaan visual dan media

HTML dibuat dari komponen TSX/CSS aktual melalui adapter JSX dengan hooks tiruan, lalu dimuat memakai `page.set_content` di Chromium. Sepuluh fixture mencakup enam bagian CMS, preview CMS, homepage biasa, kegagalan backend, serta teks panjang. Screenshot berlabel **CONTOH STATIS / FIXTURE**; nomor versi, status, nama, dan harga pada gambar bukan respons Supabase atau data pelanggan.

Preview CMS desktop/mobile ditinjau secara visual. Empat puluh pengukuran memeriksa lebar halaman, bukan audit aksesibilitas penuh atau pengujian interaksi. Tidak diuji: hydration, klik, routing, clipboard, sessionStorage pada origin aplikasi, login, atau publish nyata. Alat reproduksi ada di `docs/testing-tools/`.

Decoder regresi memanggil fungsi pemrosesan foto sebenarnya dengan gambar biner. Versi Sharp yang tersedia berbeda dari pin proyek; ulangi tes sesudah instalasi berhasil. Tidak ada permintaan Storage/proxy HTTP di dalam tes ini.

## Pelestarian dan keamanan keluaran

SHA256 memverifikasi **migration 001–005**, `data/templates.json`, `data/legacy-templates-reference.json`, dan `.env.example` identik byte-for-byte dengan ZIP tahap 5. Hasil ada pada `preservation.json`. Katalog JSON asli tetap menjadi referensi/demo dan metadata visual; katalog live memakai database yang ada ketika 006 dipasang. Tidak ada database pelanggan yang diimpor atau dimodifikasi.

Paket tidak menyertakan `.env.local`, secret nyata, node_modules, hasil .next, tsbuildinfo, database lokal, atau berkas font. Pin dependensi dipertahankan dan tidak dibuat lockfile fiktif. SOURCE_PROVENANCE, CHANGED_FILES, dan OUTPUT_MANIFEST menjelaskan basis serta file keluaran. Panduan aktif adalah `TAHAP_6_CMS.md`; laporan lama disimpan sebagai riwayat.

## Gerbang berikutnya

Instalasi, typecheck dengan dependensi lengkap, dan build produksi harus benar-benar berhasil. Sesudah itu jalankan migrasi staging sampai 006, uji SQL, dan checklist browser: dua akun/admin, edit–preview–publish, harga checkout yang berubah, pesanan lama, RSVP/izin/moderasi dan foto privat.

Sebelum melayani pelanggan diperlukan review dependensi/keamanan, pembatasan trafik HTTP, kuota/beban, backup dan pemulihan, retensi/penghapusan data, serta konfigurasi hosting yang sesuai. CMS konten/katalog dan operasional dasar ini bukan editor desain bebas, paket kuota baru, musik/gateway/QR, atau seluruh fitur platform referensi.
