# Upgrade Kastriva Invitation v1.10.0

Versi ini menambahkan tema **Aurora Luxe Motion** dan koleksi **8 musik instrumental sintetis** yang dibuat di browser. Tidak ada unggah MP3, URL audio pihak ketiga, atau secret baru.

## Sebelum upgrade

1. Cadangkan database Supabase dan bucket `ki-media`.
2. Uji pada staging lebih dahulu.
3. Pastikan database lama sudah sampai migrasi 015 sebelum menjalankan 016.
4. Jangan menjalankan ulang migrasi lama hanya untuk mengejar nomor versi aplikasi. Skema dasar tetap **7**.

## Urutan deployment

1. Push source v1.10.0 dan pastikan dependency lock tidak berubah di luar versi aplikasi.
2. Jalankan `npm test`, `npm run check:release-contract`, `npm run check:security`, `npm run typecheck`, dan `npm run build`.
3. Pada staging, jalankan `supabase/migrations/016_aurora_premium_music.sql`.
4. Periksa `/setup`, `/admin/rilis`, katalog tema, editor, dan demo `/demo/aurora-modern`.
5. Uji semua pilihan musik dari editor; audio baru mulai setelah interaksi pengguna.
6. Setelah staging lulus, jalankan migrasi 016 pada production dan redeploy bila diperlukan.

## Perubahan database 016

- Menambah `aurora-modern` ke katalog tanpa mengubah pesanan lama.
- Memperluas validator `music` ke `none` + 8 track bawaan.
- Memperbarui diagnostik readiness ke 16 tema.
- Mempertahankan snapshot katalog historis 8/13/14/15 tema agar backup CMS lama masih dapat dibaca.
- Tidak mengubah harga pesanan yang sudah dibuat, pembayaran, publikasi pelanggan, RSVP, atau ucapan yang sudah ada.

## Musik bawaan

`Serenade`, `Starlight`, `Moonlight Piano`, `Ever After`, `Ocean Vows`, `Sakura Promise`, `Celestial Waltz`, dan `Cinematic Bloom`. Semua track disintesis dengan Web Audio; tidak mengambil file lagu berhak cipta dari internet.

## Rollback aplikasi

Migrasi 016 dibuat additive terhadap data pelanggan. Jika UI perlu di-rollback, jangan menurunkan schema atau menghapus tema/data secara manual. Kembalikan source aplikasi secara terkontrol dan pertahankan database sampai rencana rollback database diuji di staging.
