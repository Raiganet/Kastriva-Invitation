# Deployment staging v1.5.0

Penyusun belum push GitHub, mengubah environment, atau deploy ke akun Diky. Uji lokal sesuai `TAHAP_5_TAMU_RSVP.md` sebelum menyentuh deployment lama.

Gunakan repository/branch kerja, Node22.x, preset Next.js, root folder yang memiliki package.json, build `npm run build`. Jangan menggunakan start Express atau output directory public. Jangan force-push untuk mengatasi konflik. Pastikan `.env.local`, node_modules, .next, DB lama, password dan kunci tidak masuk commit.

Setelah install dan pemeriksaan berhasil, commit package-lock hasil aktual. Gunakan npmci berikutnya. Workflow `.github/workflows/verify.yml` disertakan tetapi belum dijalankan pada akun pengguna.

Isi environment yang sama dengan staging lokal; NEXT_PUBLIC_SITE_URL harus origin HTTPS aplikasi Invitation, bukan localhost/portfolio. Sesuaikan redirect dan email Auth tahap2. SUPABASE_SECRET_KEY untuk foto tetap server-only, bukan NEXT_PUBLIC. Bucket tetap privat.

Build tidak menjalankan SQL. Upgrade database yang sama ke5 dahulu sesuaipanduan. Setelah environment diubah, redeploy. Cek /setup, /admin/sistem, /admin/tamu, lalu checklist dua akun dan publikasi/RSVP. ENABLE_RSVP, ENABLE_CHECKOUT, dan ENABLE_PUBLIC_INVITATIONS tetapfalse sampai prasyarat dan pengujian siap. Flagdatabase punya cakupan seluruh deployment yang memakai database itu; matikanflagdatabase untuk penghentian global.

Robots/noindex bukan pembatasan akses. Lengkapi perlindungan staging, rate-limit, review dependency, backup/retensi, dan ketentuan hosting komersial sebelum launching. File ZIP bukan bukti deployment sukses.
