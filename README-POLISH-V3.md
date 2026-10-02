# Kastriva Invitation — Elegant Rose Visual Polish v3

Micro-polish terakhir berdasarkan screenshot deployment.

## Yang diperbaiki
- Menghilangkan lingkaran putih besar pada placeholder story.
- Watermark mawar story dibuat lebih lembut.
- Closing diberi mawar lembut di kiri bawah agar seimbang dengan kanan atas.
- Bottom navigation desktop dibuat lebih kecil supaya tidak banyak menutupi isi undangan.
- Divider floral pada informasi pasangan dibuat lebih halus.

## Cara pasang

Extract ZIP ke root project:

`C:\kastriva\Kastriva-Invitation`

Lalu:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_ELEGANT_ROSE_POLISH_V3.ps1
npm test
npm run typecheck
npm run build
```

Jika semuanya PASS:

```powershell
git add .
git commit -m "style: final polish Elegant Rose"
git push origin main
```

## Rollback

```powershell
powershell -ExecutionPolicy Bypass -File .\ROLLBACK_ELEGANT_ROSE_POLISH_V3.ps1
```
