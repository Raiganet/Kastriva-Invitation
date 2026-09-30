# Kastriva Invitation v1.10.1 — Music Volume Slider

Patch ini menambahkan volume musik per undangan yang benar-benar tersimpan.

## Perilaku
- Slider 0–100%, langkah 5%.
- Default draft lama: 75% tanpa memodifikasi data lama.
- 50% setara kurang-lebih dengan loudness engine lama; 75% lebih terdengar, 100% maksimum.
- Preview musik berubah langsung saat slider digeser.
- Nilai volume ikut tersimpan ke draft dan publikasi.
- `none` tetap mematikan musik.
- Seluruh 8 musik menggunakan slider yang sama.

## Database
Source menambah migrasi `017_music_volume.sql`.
Jangan jalankan migration 017 ke production sebelum source sudah dipush dan GitHub CI/Vercel hijau.

## Validasi lokal
- `npm test`: 796/796 PASS.
- `npm run check:release-contract`: PASS — 17 migrasi, 16 renderer, 50 langkah SQL.
- Typecheck/build lokal tidak dijalankan karena dependency tidak tersedia di paket source/cache lokal; gunakan GitHub CI/Vercel setelah push.

## Cara menerapkan
Ekstrak patch ke root project terbaru, timpa file dengan path yang sama, lalu commit/push.
