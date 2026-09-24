# Deployment staging v1.6.0

Penyusun belum push GitHub, mengubah environment, atau deploy ke akun Diky. Ikuti `TAHAP_6_CMS.md` dahulu. Node22.x; preset Next.js; root folder berisi package.json; build `npm run build`. Jangan menjalankan start Express, memilih outputdirectory public, atau force-push untuk mengatasi konflik.

Jangan commit `.env.local`, secret, node_modules, .next, database, signed URL, atau bearer tamu. Setelah instalasi/pemeriksaan berhasil, commit package-lock aktual. GitHub workflow disertakan tetapi belum dieksekusi pada akun Diky.

Environment backend tetap proyek Invitation yang sama. NEXT_PUBLIC_SITE_URL harus origin HTTPS aplikasi ini, bukan localhost/portfolio. Sesuaikan Auth redirect/email tahap2. Secret foto tetap hanya server. Tidak ada environment baru untuk CMS; kontak terbit diisi di tab Brand & kontak.

Build tidak menjalankan SQL. Upgrade database sampai006 sesuaiurutan setelah backup/staging. Perubahan environment perlu restart/redeploy. Cek /setup, /admin/sistem, /admin/cms, lalu uji publikasiCMS dan checkout/RSVP. False pada semua gate contoh tidak boleh diubah menjadi true hanya untuk mengejar tampilan berhasil.

CMS memakai metadata dan robots.txt default tertutup. Sebelum publikasi produksi perlu persetujuan pengelola, hosting yang mengizinkan penggunaan komersial, pengamananstaging, audit dependensi, batas trafik/bandwidth, backup/retensi, dan penanganan data pribadi. ZIP bukan bukti deploy selesai.
