# Kastriva Invitation — Elegant Rose Visual Polish v2

Patch lanjutan untuk tema `elegant-rose` setelah paket ornament pertama terpasang.

## Perbaikan
- Kontras teks closing/thank-you card.
- Filigree kiri bawah closing dibuat lebih terlihat.
- Placeholder story tanpa foto mendapat watermark mawar + inner border.
- Body story dibuat sedikit lebih gelap.
- Keterangan orang tua pada pasangan mendapat divider floral emas kecil.
- Safe-space bawah ditambah untuk fixed bottom navigation.
- Tambahan ruang pada chapter story terakhir.

## Cara pasang
1. Extract ZIP ke root project, contoh `C:\kastriva\Kastriva-Invitation`.
2. Jalankan:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_ELEGANT_ROSE_POLISH_V2.ps1
```

3. Test:

```powershell
npm test
npm run typecheck
npm run build
```

4. Jika semuanya PASS:

```powershell
git add .
git commit -m "style: polish Elegant Rose ornaments"
git push origin main
```

## Rollback

```powershell
powershell -ExecutionPolicy Bypass -File .\ROLLBACK_ELEGANT_ROSE_POLISH_V2.ps1
```

Patch ini tidak mengubah komponen React, database, Supabase, atau aset ornamen.
