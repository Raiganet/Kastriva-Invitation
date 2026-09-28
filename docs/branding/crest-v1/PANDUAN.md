# Kastriva Invitation — Logo Classic Emblem

Tanggal: 28 September 2026. Patch branding untuk source v1.9.0 setelah perbaikan TS7016.
Basis berkas yang diganti sudah dicocokkan dengan commit `343bba8a99787e5fb1fb6fbb03d9f316c7627262` di Raiganet/Kastriva-Invitation.

## Apa yang dipasang

Logo yang dipilih pengguna: emblem K klasik dengan bingkai ornamental, bunga, daun, dan wordmark KASTRIVA INVITATION. Artwork diekspor dari gambar pilihan pengguna, bukan mengambil seluruh papan konsep beserta tulisan keterangannya.

- Header: logo horizontal responsif; tombol akun/dasbor dan menu ponsel tetap bekerja melalui kode sebelumnya.
- Footer: logo yang sama dengan ukuran lebih lega; email, WhatsApp, teks CMS, dan copyright tetap berasal dari kode/data sebelumnya.
- Favicon: ikon burgundy–emas pada varian kanan bawah desain, ukuran 16/32/48/64 dan ICO.
- Ikon layar utama: Apple 180, Android 192/512, dan maskable 512; manifest bernama Kastriva Invitation.
- Komponen bersama: `components/BrandLogo.tsx`; styling terpisah `app/brand-identity.css`.

Nama default Kastriva/INVITATION memakai gambar wordmark pilihan. Bila nama atau subjudul di CMS diganti, komponen tetap menampilkan teks CMS yang benar di samping emblem, bukan mempertahankan gambar nama yang salah.

Tidak mengubah tema undangan pelanggan, harga, musik, hadiah, checkout, kode Auth, API, SQL, key, atau flag layanan. Header/footer pemasaran tetap disembunyikan di halaman undangan, demo, dan preview, seperti perilaku sebelumnya. Ikon tab browser tetap mengikuti identitas aplikasi.

## Pemasangan

1. Simpan cadangan proyek atau commit perubahan yang sudah dikerjakan. Patch ditujukan ke source v1.9.0 yang cocok dengan commit basis di atas. Jika empat file target telah diubah sendiri setelah commit itu, gabungkan perbedaannya; jangan menimpa perubahan lain secara buta. Daftar hash dan diff ada di folder ini.
2. Ekstrak ZIP patch ke folder sementara. Salin folder `app`, `components`, `lib`, `public`, `tests`, dan `docs` dari patch ke ROOT proyek (folder yang berisi `package.json`). Gabungkan folder dan ganti hanya file bernama sama. Jangan menghapus folder tujuan terlebih dahulu.
3. Jangan menghapus atau mengganti `.env.local`, `scripts/env-tools.d.mts`, `package.json`, atau `package-lock.json`. File-file itu tidak ada di patch. Perbaikan build sebelumnya tetap dipakai.
4. Jalankan pengujian, menggunakan Node 22.x sesuai manifest proyek:

```powershell
npm test
npm run typecheck
npm run build
```

Bila dependensi belum terpasang, jalankan `npm ci` terlebih dahulu. Jangan menonaktifkan typecheck untuk menutupi error.

Setelah lulus, stage hanya file branding yang dimaksud, periksa `git diff --cached --stat`, commit, dan push:

```powershell
git add app/layout.tsx app/robots.ts app/brand-identity.css app/favicon.ico app/manifest.webmanifest components/BrandLogo.tsx components/SiteHeader.tsx components/SiteFooter.tsx lib/brand-identity.ts public/brand/crest-v1 tests/brand-identity.test.ts docs/branding/crest-v1
git diff --cached --stat
git commit -m "feat: apply Kastriva Invitation classic emblem branding"
git push origin main
```

Penyusun belum melakukan push, deployment, atau perubahan pada akun eksternal. Tidak perlu mengulang SQL 012/013 atau mengubah pengaturan Supabase untuk logo ini.

## Pemeriksaan setelah deployment

Buka beranda di komputer dan HP: logo baru di header dan footer, menu masih dapat dibuka, tautan logo kembali ke beranda. Periksa halaman dashboard/admin dan pastikan menu Dashboard/Akun masih mengikuti sesi. Kontak footer harus sama dengan CMS.

Alamat aset baru untuk pemeriksaan, relatif terhadap domain aplikasi:

```text
/brand/crest-v1/logo-horizontal.webp
/brand/crest-v1/favicon-32x32.png
/favicon.ico
/manifest.webmanifest
```

Ikon pada tab atau shortcut perangkat dapat tetap memakai cache lokal. Coba muat ulang penuh dan jendela Samaran; untuk shortcut lama, periksa ikon pada shortcut baru. Jangan mereset database karena favicon belum berubah. `public/icon.svg` lama sengaja tidak dihapus, tetapi metadata aktif tidak lagi menunjuk ke sana.

## Batas aset dan manifest

Logo web adalah WebP transparan, bukan vektor SVG. PNG transparan juga disertakan. Ikon 512 adalah ekspor raster yang diinterpolasi dari gambar pilihan; tidak diklaim memiliki detail vektor tambahan. Wordmark dipakai dari gambar sehingga tidak memerlukan file font khusus. Tidak ada berkas font dalam patch.

Manifest menyiapkan nama/ikon/presentasi aplikasi pada perangkat yang mendukungnya. Patch ini tidak menambah service worker, penyimpanan offline, atau jaminan bahwa semua browser akan menawarkan tombol instalasi.

## Dokumen pengujian

Lihat `HASIL-UJI.md`. Gambar `homepage-*-static.png` dan `footer-*-static.png` adalah pratinjau layout HTML statis dari komponen yang diubah; bukan screenshot deployment atau bukti pengujian login/checkout/Supabase.

## Rujukan implementasi

- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest

Rujukan mekanisme Next.js, bukan bukti keberhasilan deployment Diky.
