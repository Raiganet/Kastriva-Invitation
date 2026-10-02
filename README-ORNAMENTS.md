# Kastriva Invitation — Elegant Rose Ornament Patch

Patch tambahan untuk tema `elegant-rose`. Patch ini **tidak mengganti logic undangan** dan tidak mengubah database. Ia hanya menambahkan ornament visual dari `Ornamen.zip` milik pengguna.

## Aset yang dipakai

- `rose-3416596_960_720.png` → `public/ornaments/elegant-rose/rose-cluster.png`
- `ornate-2889158_960_720.png` → `public/ornaments/elegant-rose/floral-divider-mask.png`
- `corner-47040_960_720.png` → `public/ornaments/elegant-rose/filigree-corner-mask.png`

Aset dioptimasi ukurannya, transparansi PNG tetap dipertahankan.

## Yang berubah

- Rose cluster asli pada cover Elegant Rose.
- Rose cluster pada card pasangan.
- Divider floral emas di bawah heading section.
- Filigree emas + rose cluster pada closing card.
- Ornamen sangat tipis pada story card.
- Ukuran khusus mobile dan dukungan `prefers-reduced-motion`.

## Cara pasang

1. Extract isi ZIP patch ke root project, misalnya:
   `C:\kastriva\Kastriva-Invitation`
2. Izinkan merge folder `app` dan `public`.
3. Dari root project jalankan:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_ELEGANT_ROSE_ORNAMENTS.ps1
```

4. Lalu:

```powershell
npm test
npm run typecheck
npm run build
```

5. Jika semua PASS:

```powershell
git add .
git commit -m "feat: add Elegant Rose ornaments"
git push origin main
```

## Catatan

Patch hanya menambahkan satu import baru di `app/layout.tsx`:

```ts
import './invitation-elegant-ornaments.css';
```

CSS ornament sengaja dipisah dari `invitation-elegant-reference.css` supaya mudah dibatalkan atau disetel tanpa mengganggu layout Elegant Rose yang sudah lulus test.
