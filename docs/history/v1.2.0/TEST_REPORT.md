# Hasil pengujian — Kastriva Invitation Tahap 2 / v1.2.0

Tanggal penyusunan: 23 September 2026. Basis: ZIP Perbaikan v1.1.0. Node pengujian 22.16.0, TypeScript global 5.8.3.

## Kesimpulan

**Kode tahap 2 dan panduan aktivasi sudah disiapkan, tetapi build Next.js penuh dan koneksi Supabase nyata belum terverifikasi.** Tidak ada deployment, pembuatan proyek Supabase, pemasangan SQL, perubahan Auth, atau pengiriman email pada akun Diky yang dilakukan dalam pekerjaan ini. Paket belum layak dinyatakan siap transaksi.

## Hasil yang benar-benar dijalankan

| Pemeriksaan | Hasil | Batas makna |
|---|---|---|
| `npm test` | **93/93 lulus**, 0 gagal, 0 skip | Tes fungsi domain/environment, HTTP mock, dan inspeksi kontrak source/SQL. Bukan 93 uji database hidup. |
| Sintaks TS/TSX dan import lokal | **69 file**, 0 error | TypeScript 5.8.3; bukan semantic typecheck Next.js beserta dependensinya. |
| Strict semantic typecheck modul inti | **5 file lulus** | Hanya `types`, `domain`, `account-flow`, `readiness`, `system-status`; tidak meliputi komponen React, route Next atau SDK Supabase. |
| `node --check` skrip MJS | **5 skrip lulus** | Memeriksa sintaks, bukan akses layanan nyata. |
| `check:env` tanpa kredensial | PASS mode demo | Konfigurasi kosong tidak dianggap sudah terhubung. |
| `check:supabase` tanpa kredensial | SKIP, exit 2 | Tidak ada request backend. Bukan PASS koneksi. |
| `test:supabase` tanpa opt-in | SKIP, exit 2 | Pengaman uji tulis bekerja; akun/data tidak disentuh. |
| `npm install` | Dihentikan batas waktu, exit 124 | Belum menghasilkan instalasi yang selesai atau lockfile yang tervalidasi. |
| Probe `npm view next@16.3.6 version` | Gagal, **EAI_AGAIN**, exit 1 | DNS `registry.npmjs.org` gagal. Tidak membuktikan versi paket ada atau tidak ada. |
| `npm run typecheck` aplikasi penuh | Gagal, exit 2 | Definisi Next/React/Supabase belum tersedia. Tidak dianggap semantic typecheck aplikasi yang lulus. |
| `npm run build` | Gagal dijalankan, exit 127 | Prebuild environment lulus; `next: not found` karena paket belum terpasang. |
| SQL/RPC/RLS/Storage pada PostgreSQL/Supabase | **Belum dijalankan** | SQL ditinjau statis, bukan hasil eksekusi engine database. |
| Browser Next nyata, hydration, auth/email, upload, Vercel | **Belum diuji** | Memerlukan instalasi dan proyek staging yang terhubung. |

Log tersedia di `docs/test-results/stage2/`. Log di luar subfolder itu adalah riwayat v1.1.0, bukan bukti tahap 2.

## Lingkup 93 tes

Tes mencakup validasi data/tanggal/kalender, redirect internal, pemeriksaan environment dan penolakan secret publik, password dan revision, kontrak RLS/grant/RPC, status admin yang gagal-tertutup, protokol readiness tanpa membocorkan key, URL yang tidak dipengaruhi input request, respons salah/terlalu besar/timeout/HTTP gagal, serta pengaman opt-in pada skrip integrasi. Sebagian pengujian membaca source untuk memeriksa adanya guard; tes semacam itu **tidak membuktikan policy SQL benar-benar ditegakkan**.

Log terbaru berisi 93 tes tanpa menghapus tes lama. Fungsi readiness memakai balasan HTTP simulasi, bukan menamai mock sebagai backend nyata.

## Batas versi dependensi

Versi Next/React/Supabase dipertahankan dari v1.1.0. Registry tidak dapat diakses dari lingkungan penyusun, sehingga keberadaan/resolusi kombinasi paket ini belum terverifikasi. Tidak dibuat lockfile fiktif. Bila mesin pengujian menampilkan `ETARGET`, periksa versi paket tersebut dan lakukan perubahan terukur; jangan mengganti semua dependensi menjadi `latest` tanpa pengujian. Jangan menyatakan deployment berhasil sebelum install/typecheck/build benar-benar lulus.

## Pemeriksaan pelestarian sumber

Delapan data tema/harga referensi dan migration `001_foundation.sql` dipertahankan byte-for-byte dari v1.1.0. SQL tahap 2 berada pada file **002** terpisah. Untuk proyek yang sudah memakai 001, jalankan 002 saja; jangan menjalankan ulang 001 setelah 002. File input v1.1.0 dan ZIP Express asli tidak diubah.

Tidak ada database pelanggan dalam input awal, jadi tidak ada klaim migrasi data pelanggan. Tidak ada password/key privat nyata, `node_modules`, hasil `.next`, ataupun `.env.local` yang disertakan dalam keluaran.

## Gerbang berikutnya pada staging

1. `npm install` → `npm test` → `npm run typecheck` → `npm run build` harus berhasil.
2. Proyek khusus Invitation: jalankan 001 lalu 002 pada proyek baru; 002 saja pada proyek yang sudah memakai 001. Isi environment dan Auth URL/template.
3. `npm run check:supabase` atau `/setup` harus berhasil untuk pemeriksaan dasar. Itu belum membuktikan email terkirim atau isolasi akun.
4. Ikuti `UJI_SUPABASE_TAHAP2.md` dengan dua akun nonadmin terkonfirmasi dan akun admin terpisah. Uji foto privat dan tautan reset di browser lain.
5. Uji tulis otomatis opsional hanya pada staging khusus, dengan opt-in yang jelas. Skrip membersihkan fixture draft buatannya; marker penghapusan minimal dan akun test tetap ada. Jangan memakai service-role key atau akun pelanggan nyata.

Pesanan tetap nonaktif secara default. Pembayaran, link publik tamu, RSVP produksi, musik, CMS lengkap, cleanup media/akun, dan autosave bukan bagian yang dinyatakan selesai.
