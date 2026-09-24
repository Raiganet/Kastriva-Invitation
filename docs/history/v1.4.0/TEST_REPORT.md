# Hasil pengujian — Kastriva Invitation Tahap 4 / v1.4.0

Tanggal paket: 24 September 2026 WIB; log runtime menggunakan UTC 23 September. Basis: `Kastriva-Invitation-Tahap-3-v1.3.0.zip`. Node 22.16.0, TypeScript global 5.8.3. Tidak ada perubahan pada GitHub/Vercel/Supabase Diky, transaksi dana, atau email yang dilakukan penyusun.

## Kesimpulan

**Kode tahap 4 sudah ditambahkan dan pemeriksaan parsial dijalankan. Aplikasi belum dinyatakan siap transaksi.** npm install gagal karena DNS registry (`EAI_AGAIN`). Build Next.js dan semantic typecheck seluruh aplikasi belum berhasil. SQL 004 serta RLS/RPC/Storage nyata belum dieksekusi. Jumlah tes di bawah bukan jumlah transaksi/database hidup yang berhasil.

| Pemeriksaan yang benar-benar dijalankan | Hasil | Batas arti |
|---|---|---|
| `npm test` | **241/241 lulus**, 0 gagal, 0 skip | Fungsi, simulasi transport/controller, dan inspeksi kontrak source. 142 tes lama dipertahankan, 99 ditambahkan. |
| `check-syntax.cjs` | **107 TS/TSX**, tanpa error sintaks/import lokal | Transpile/parse TS5.8.3; bukan semantic typecheck React/Next/Supabase. |
| Strict semantic typecheck inti | **7 modul + 3 file tes lulus** | commerce, commerce-transport, public-media, readiness, system-status, domain, types; Node types lokal ts-node. Tidak mencakup React/SDK. |
| Decoder foto | **9/9 lulus** | Implementasi `renderPublicPhoto` nyata, Sharp lokal **0.34.1**, bukan pin aplikasi **0.35.4**. Fixture biner; tidak HTTP/Storage. |
| Layout HTML statis | **28/28 tanpa overflow horizontal** | 7 fixture pada lebar 320/390/768/1440 px. Adapter TSX minimal, bukan React/Next/hydration. |
| `check:env` tanpa kredensial | PASS mode demo | Tidak menyatakan Supabase terhubung. |
| `check:supabase` tanpa kredensial | SKIP, exit 2 | Tidak melakukan request backend. |
| `test:supabase` tanpa opt-in | SKIP, exit 2 | Akun/data tidak disentuh. Bukan tes pembayaran. |
| npm install bounded, tanpa install scripts | **Gagal EAI_AGAIN**, exit 1 | DNS registry npm gagal; tidak ada instalasi/lockfile tervalidasi. |
| `npm run typecheck` penuh | **Gagal**, exit 2 | Modul/definisi Next, React, Node dan Supabase belum terpasang; banyak error turunan. Tidak dinyatakan lulus. |
| `npm run build` | **Gagal**, exit 127 | Prebuild mode demo berhasil; `next: not found`. |
| SQL 004 + SQL integrasi | **Belum dijalankan** | Script disediakan untuk staging, tidak dihitung sebagai lulus. |
| Auth/HTTP/Storage/proxy foto/pembayaran/publikasi pada layanan nyata | **Belum diuji** | Tidak ada proyek staging berkredensial atau deployment yang dipakai. |

Log aktual berada di `docs/test-results/stage4/`. Log di subfolder tahap sebelumnya merupakan riwayat, bukan hasil tahap 4. Pemeriksaan tipe penuh sempat menemukan satu fixture tes yang kekurangan ID acara; fixture diperbaiki dan pemeriksaan modul/tes inti dijalankan ulang sampai lulus. Kegagalan dependensi pada pemeriksaan penuh tetap dilaporkan.

## Cakupan penting dan yang tidak dibuktikan

Tes baru mencakup format dan kolom payload, harga/durasi/nomor versi, slug, izin tindakan, consent, matriks status 60 kombinasi, batas expiry, proyeksi publik tanpa path/kontak, tautan nama tamu, path/magic foto, catatan sesi menurut akun, balasan salah ID/status/revision, HTML200, JSON tidak valid, timeout/5xx, dan retry dengan payload yang sama.

Pemeriksaan source SQL memastikan kontrak yang tertulis: transaksi, quote dari DB, larangan mutasi langsung, RLS, admin/owner, harga dan durasi snapshot, persetujuan pembayaran, publikasi terpisah, penarikan tanpa terhalang audit limit, photo RPC khusus server, serta no-store. **Inspeksi teks ini tidak membuktikan fungsi PL/pgSQL berhasil dikompilasi atau policy diterapkan oleh database.** Jalankan SQL integrasi dan pengujian dua akun sebelum aktivasi nyata.

Decoder diuji menggunakan implementasi sebenarnya yang ditranspile oleh TypeScript dan Sharp yang tersedia: JPEG/PNG/WebP 2400×1600 menjadi WebP 1600×1067, metadata dibuang, gambar kecil tidak diperbesar, JPEG palsu/SVG/lebih dari5MB/lebih dari25juta piksel ditolak. Versi Sharp yang diuji berbeda dari pin dependensi proyek; ulangi `npm run test:media` setelah instalasi pin berhasil. Tes ini tidak memindai semua variasi gambar berbahaya atau membuktikan seluruh keamanan upload.

## Inspeksi visual

Tujuh fixture: checkout, tindakan pelanggan, verifikasi admin, publikasi, pengaturan, sampul publik, dan isi undangan publik. Adapter mengevaluasi TSX menjadi HTML statis dengan hooks tiruan. Gambar/nomor/nominal/status adalah fixture, bukan data pelanggan atau hasil server. Layout desktop checkout dan verifikasi serta kontrol publikasi mobile ditinjau visual. Ukuran 320–1440 tidak melebar horizontal.

Percobaan awal Playwright tidak menemukan bundled browser. Pengujian kemudian berhasil memakai `/usr/bin/chromium`. `page.set_content` dipakai tanpa server aplikasi. Ini tidak menguji klik, perubahan state React, routing, SessionStorage pada origin aplikasi, auth, hydration, atau pembayaran. Script reproduksi ada di `docs/testing-tools/`; jangan memakai screenshot sebagai bukti transaksi berhasil.

## Pelestarian dan keluaran

Migrasi001–003, `data/templates.json`, serta `data/legacy-templates-reference.json` diverifikasi identik dengan input ZIP tahap 3 menggunakan SHA256. Data/database pelanggan tidak ada dalam ZIP, sehingga tidak ada klaim migrasi data pelanggan nyata. SQL 004 menambah tabel transaksi terpisah; `ki_orders` lama tidak otomatis paid.

Tidak disertakan key/password nyata, `.env.local`, node_modules, hasil `.next`, tsbuildinfo, atau font. Tidak ada package-lock buatan. `SUPABASE_SECRET_KEY` hanya placeholder pada contoh konfigurasi; key harus diisi sendiri pada server dan tidak pernah dibagikan.

## Gerbang berikutnya

Install → typecheck → build harus benar-benar berhasil; jalankan SQL sampai004 pada staging, lalu periksa akun/editor/Storage dan checklist `UJI_TRANSAKSI_TAHAP4.md`. Uji kesesuaian mutasi bank manual dan ketentuan operasional dilakukan pengelola di luar aplikasi. Jangan membuka uang pelanggan dari hasil tes parsial ini. Rate-limit terdistribusi, kuota/beban media, backup/retensi, dependency audit, dan peninjauan keamanan tetap pekerjaan produksi.

Paket menambahkan checkout manual/publikasi, bukan payment gateway, RSVP nyata, musik, CMS lengkap, atau seluruh produk setara Wevitation. Default transaksi dan publikasi tetap nonaktif.
