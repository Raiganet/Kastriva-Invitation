# Elegant Rose — Final Mobile Polish v4

Patch ini dibuat setelah QA langsung pada screenshot HP.

## Fokus perbaikan

- Placeholder galeri kosong tidak lagi sangat tinggi.
- Menghapus efek `aspect-ratio: 4/5` khusus placeholder Elegant Rose mobile.
- Card galeri kosong dibuat lebih compact dan tetap bernuansa stationery.
- Story terakhir mendapat ruang ekstra supaya bisa discroll penuh di atas navbar fixed.
- Tombol musik diperkecil dari 54px menjadi 48px di mobile.
- Safe area bawah ditambah untuk perangkat dengan gesture navigation.
- Layar <= 380px mengubah placeholder galeri menjadi satu kolom.

## Instalasi

Extract ZIP ke root:

`C:\kastriva\Kastriva-Invitation`

Lalu jalankan:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_ELEGANT_ROSE_MOBILE_FINAL.ps1
npm test
npm run typecheck
npm run build
```

Jika PASS:

```powershell
git add .
git commit -m "style: finalize Elegant Rose mobile layout"
git push origin main
```

## Rollback

```powershell
powershell -ExecutionPolicy Bypass -File .\ROLLBACK_ELEGANT_ROSE_MOBILE_FINAL.ps1
```

Tidak ada perubahan React, TypeScript, database, Supabase, atau aset gambar.
