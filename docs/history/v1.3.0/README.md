# Kastriva Invitation — Tahap 3 / v1.3.0

Kelanjutan source lengkap **Next.js + Supabase tahap 2**, bukan kembali ke Express/SQLite. Fokus: studio editor, simpan otomatis, pemulihan draft, multi-acara, galeri/sampul, dan preview privat. Delapan tema serta harga referensi lama dipertahankan; editor menggunakan lima tema pernikahan.

**Paket pengembangan untuk diuji, bukan siap menerima pembayaran.** Tidak ada deployment atau perubahan database di akun Diky. Build Next.js dan backend nyata belum terverifikasi; batas pengujian ada pada `docs/TEST_REPORT.md`.

## Pasang di Windows

Ekstrak folder baru. Gunakan Node 22.x dan salin konfigurasi `.env.local` Next.js sebelumnya secara lokal hanya bila sudah benar. Jangan menyalin node_modules, .next, atau .env Express.

```powershell
node -v
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm install
npm test
npm run typecheck
npm run build
```

Jika gagal, hentikan dan perbaiki. Penyusun tidak berhasil memasang dependensi karena EAI_AGAIN/DNS registry npm. Versi dipertahankan dari v1.2.0; tidak dibuat package-lock fiktif. Setelah install dan pengujian berhasil, commit lockfile hasil resolusi lalu gunakan npm ci.

## Upgrade Supabase

Database yang sudah memasang 001 + 002 cukup menjalankan **supabase/migrations/003_editor_events.sql**. Proyek baru menjalankan 001 → 002 → 003. Jangan menjalankan ulang versi lama setelah 003. Akun, draft, bucket, dan environment tetap di proyek Invitation yang sama; data lama tidak dihapus/migrasikan ulang. Build tidak menjalankan SQL.

```powershell
npm run check:env
npm run check:supabase
npm run dev
```

Buka http://localhost:3000/setup. Pemeriksaan harus membaca skema 3; kemudian uji akun dan editor. Pertahankan `ENABLE_ORDER_REQUESTS=false`. Belum menyiapkan Supabase/Auth? Ikuti `docs/TAHAP_2_SUPABASE.md` dengan urutan SQL versi 3.

## Fitur tahap 3

| Area | Implementasi |
|---|---|
| Editor | Lima langkah, desktop berdampingan preview, tab Edit/Preview pada HP. |
| Acara | 1–3 acara, tanggal/tempat/zona waktu terpisah, kalender tiap acara. |
| Simpan | Autosave sekitar 1,5 detik setelah berhenti mengetik, tombol manual, satu request, revision, exact retry. |
| Pemulihan | Jurnal per akun/ID pada sesi tab; pilihan restore eksplisit dan konflik tidak menimpa server. |
| JSON | Unduh/impor isi tervalidasi; impor menjeda autosave, tidak membawa status/identity server atau token. |
| Galeri | Maksimal 6 foto, upload berurutan, pemrosesan WebP, urutan/sampul, lepas tanpa delete Storage. |
| Preview | Langsung dari formulir atau halaman privat versi server; tautan foto sementara diperbarui. |
| Database | Migration 003 additive validator events; pengaman save/delete dari 002 dipertahankan. |

sessionStorage bukan backup permanen dan tidak dienkripsi. JSON hanya berisi referensi foto, bukan foto asli. Preview bukan tanda sudah disimpan/diterbitkan. Pemeriksaan biner server, cleanup/kuota media total, dan hapus akun otomatis masih lanjutan.

## Panduan dan pengujian

- `docs/TAHAP_3_EDITOR.md`: instalasi, SQL, penggunaan dan batas fitur.
- `docs/UJI_EDITOR_TAHAP3.md`: checklist aplikasi nyata, dua akun/dua tab/offline.
- `docs/TEST_REPORT.md`: hasil yang benar-benar dijalankan, bukan klaim semua uji selesai.

`npm test` menjalankan 142 tes fungsi/mock/kontrak statis. `npm run check:syntax` memeriksa sintaks/import lokal setelah TypeScript tersedia. `npm run typecheck` dan `npm run build` perlu semua dependensi. `npm run test:supabase` tanpa opt-in adalah SKIP, bukan sukses koneksi. Optional validator SQL berada di `supabase/tests/003_editor_validation.sql`, belum dieksekusi penyusun.

## Belum aktif

Pembayaran, publikasi /u/, masa aktif, RSVP sungguhan, musik, amplop digital, QR check-in, CMS penuh, dan operasi produksi. Permintaan bantuan dasar tetap ada tetapi nonaktif secara default dan bukan bukti lunas. Harga yang tampil referensi historis, bukan perubahan paket bisnis baru.

Log dan preview lama tetap historis. Laporan terbaru hanya `docs/TEST_REPORT.md` dan `docs/test-results/stage3/`. Artefak gambar pada `docs/previews/stage3/` adalah inspeksi layout statis, bukan screenshot runtime Next.js.
