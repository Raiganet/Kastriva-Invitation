# Hasil pengujian — Kastriva Invitation Tahap 3 / v1.3.0

Tanggal paket: 24 September 2026 (WIB; sebagian log menggunakan UTC 23 September). Basis source: `Kastriva-Invitation-Tahap-2-v1.2.0.zip`. Runtime pemeriksaan: Node 22.16.0; TypeScript global 5.8.3; Chromium untuk inspeksi statis dan Canvas/File terisolasi.

## Kesimpulan

**Source tahap 3 telah ditambahkan dan pengujian parsial dijalankan. Build Next.js penuh, SQL pada engine PostgreSQL, serta akun/Storage/Supabase nyata BELUM terverifikasi.** Tidak ada deployment, pemasangan SQL, perubahan akun eksternal, pengiriman email, atau penerbitan undangan yang dilakukan penyusun. Kegagalan instalasi tidak dianggap kelulusan build. Paket bukan siap transaksi.

## Hasil yang benar-benar dijalankan

| Pemeriksaan | Hasil | Batas arti hasil |
|---|---|---|
| `npm test` | **142/142 lulus**, 0 gagal, 0 skip | Fungsi TypeScript, IO/HTTP simulasi, dan inspeksi kontrak source. Bukan 142 tes database hidup. |
| Sintaks/import lokal | **77 file TS/TSX**, 0 error | Parse/transpile menggunakan TS global 5.8.3; bukan dependency-aware typecheck React/Next. |
| Strict typecheck logika inti | **7 modul lulus** | types, domain, account-flow, readiness, system-status, editor-document, editor-controller. Tidak mencakup keseluruhan aplikasi/SDK. |
| Sintaks skrip MJS | **5/5 lulus** | Pemeriksaan parser, bukan koneksi layanan nyata. |
| Layout statis | **32 variasi**, 0 overflow horizontal | Ukuran 360,390,768,1440; lima langkah formulir serta tiga variasi preview. HTML melalui adapter JSX statis, bukan React. |
| Pemrosesan gambar di Chromium | **7/7 lulus** | Fungsi preparePhoto sebenarnya menggunakan Canvas/File nyata. Tidak melakukan upload Supabase. |
| `check:env` tanpa konfigurasi | PASS mode demo | Tidak menyatakan backend terhubung. |
| `check:supabase` tanpa konfigurasi | SKIP, exit 2 | Tidak ada request ke proyek Supabase. Bukan PASS koneksi. |
| `test:supabase` tanpa opt-in | SKIP, exit 2 | Pengaman uji tulis; tidak mengubah akun/data. |
| `npm install --ignore-scripts --no-audit --no-fund --fetch-retries=0 --fetch-timeout=8000` | **Gagal, EAI_AGAIN, exit 1** | DNS registry.npmjs.org gagal saat mengambil dependensi. Tidak ada lockfile/instalasi lengkap. |
| `npm run typecheck` aplikasi penuh | **Gagal, exit 2** | Definisi dependensi Next/React/Node/SDK belum terpasang. Tidak diklaim typecheck seluruh proyek lulus. |
| `npm run build` | **Gagal, exit 127** | Prebuild mode demo lulus, lalu `next: not found`. Tidak ada build Next.js yang selesai. |
| Migration003, SQL validator, RLS di engine database | **Belum dijalankan** | SQL diperiksa secara statis saja. Script11 validator disediakan untuk staging, tidak dihitung sebagai lulus. |
| Hydration, interaksi React, browser-back, sessionStorage pada origin aplikasi | **Belum diuji runtime Next.js** | Controller diuji memakai adapter IO memori; bukan sesi browser nyata pada aplikasi. |
| Auth/email/reset, dua akun, foto privat di Supabase | **Belum diuji live** | Wajib diuji mengikuti checklist staging. |
| GitHub/Vercel | **Tidak dilakukan** | Tidak ada perubahan pada repository/deployment Diky. |

Log terbaru berada di `docs/test-results/stage3/`. Hasil v1.2.0 dan v1.1.0 dipisahkan sebagai riwayat dan tidak dianggap hasil tahap ini.

## Apa yang dicakup 142 tes

93 tes dasar yang sudah ada dipertahankan. Tes readiness dan pemeriksaan source editor disesuaikan dengan skema3 dan pemisahan controller/hook, tanpa menghapus pemeriksaan keamanan sebelumnya. Ditambahkan41 tes fungsi/controller dan8 tes kontrak tahap3.

Cakupan baru antara lain: teks spasi saat diketik, draft baru tidak otomatis tersimpan hanya karena dibuka, identitas simpan, journal-before-send, satu request aktif, edit saat balasan tertunda, hasil network tidak pasti, exact payload retry sebelum perubahan baru, balasan salah ID/revision/waktu, respons HTML yang tidak dianggap API sukses, timeout/offline, storage diblokir, pemulihan setelah refresh, konflik dua tab, rekonsiliasi simpan pertama yang balasannya hilang, akun berubah saat request, ownership/import JSON, legacy data, batas acara, tanggal/jam, proyeksi acara pertama, urutan foto, duplicate refs, safe URL untuk preview, dan kalender tiap acara.

Delapan pemeriksaan source memeriksa transaksi/grant/gate yang tertulis, bukan mengeksekusi SQL atau simulasi penyerang pada database. Guard SQL/RLS harus diuji secara nyata. Script integrasi opt-in lama tetap ada dan diperbarui untuk skema3/fixture multi-acara, tetapi belum dijalankan dengan akun berkredensial.

## Detail inspeksi visual dan foto

Snapshot HTML dibuat dari komponen TSX dan CSS dengan adapter minimal JSX/hooks. Adapter bukan React19/Next, tidak menjalankan efek/event/router, dan tidak membuktikan autosave atau login berjalan. Nama, revision, dan status tersimpan pada gambar adalah **fixture**, bukan respons server/pelanggan nyata. Ketiga gambar editor ditinjau visual; tidak ditemukan clipping horizontal pada32 variasi ukuran.

Tes foto menggunakan Canvas/File browser untuk memanggil implementasi preparePhoto sebenarnya. Kasus resize:2400×1600→1600×1067 WebP;1×3000→1×1600 WebP;800×800→800×800 WebP. Empat berkas tidak valid ditolak:SVG, fake PNG, berkas>5MB, dan berkas terlalu kecil. Dimensi minimum1px diperbaiki agar gambar sangat tipis tidak menjadi canvas0px. Ini tidak memeriksa semua format/metadata/orientasi dan bukan pemindaian keamanan gambar di server.

Alat reproduksi opsional: `docs/testing-tools/`. Ia hanya inspeksi statis dan Canvas terisolasi. Loopback navigation pada percobaan awal ditolak kebijakan browser; pemeriksaan kemudian menggunakan set_content untuk HTML offline. SessionStorage origin aplikasi tidak diuji melalui cara tersebut. Dokumen tidak menyamakan IO memori Node dengan browser sessionStorage.

## Pelestarian source dan batas data

Migration001 dan002, `data/templates.json` beserta8 tema/harga, dan `data/legacy-templates-reference.json` diverifikasi **identik byte-for-byte** dengan ZIP tahap2. Hash ada di `preservation.json`. Migration003 ditambahkan terpisah; tidak reset akun/tabel atau memperbarui semua row draft. Dataset SQLite pelanggan tidak ada pada input awal sehingga tidak ada klaim migrasi database pelanggan.

Harga referensi tetap: Elegant Rose150.000; Modern Minimalist150.000; Tropical Paradise200.000; Rustic Wood175.000; Galaxy Night250.000; Sweet Birthday75.000; Aqiqah Blessing75.000; Corporate Event200.000(IDR). Bukan penetapan harga baru, bukti terjual, atau transaksi terverifikasi.

Tidak ada `.env.local`, key/password nyata, node_modules, `.next`, tsbuildinfo, atau font yang dibundel. File contoh environment berisi placeholder. Dependensi dipertahankan dari tahap2; kombinasi/resolusinya belum terverifikasi melalui registry. Tidak dibuat lockfile fiktif; periksa bila mesin pemasang menampilkan ETARGET.

## Gerbang sebelum tahap4

Install→test→typecheck→build harus lulus. Pada proyek staging Invitation yang sama, upgrade sesuai urutan sampai003, periksa `/setup` dan `/admin/sistem`, lalu jalankan `UJI_EDITOR_TAHAP3.md` dan uji akun tahap2. Bukti harus mencakup dua akun, dua tab, save/reload, upload/reorder, offline/retry/recovery, serta privasi media. Perbaiki kegagalan sebelum mengaktifkan pesanan/pembayaran.

Publish, pembayaran, masa aktif, RSVP produksi, musik, amplop digital, CMS penuh, cleanup otomatis, kuota total akun, verifikasi biner server, dan hapus akun belum dinyatakan selesai.

## Rujukan implementasi

- https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/database/postgres/row-level-security

Rujukan menjelaskan mekanisme platform, bukan membuktikan konfigurasi Diky sudah benar. Desain debounce/retry dan batas fitur adalah keputusan implementasi proyek ini.
