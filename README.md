# Elegant Rose Reference Layout — Kastriva Invitation

Patch ini melanjutkan Reference Motion dan membuat Elegant Rose lebih dekat *feel* komposisinya
dengan halaman referensi yang diberikan pengguna, tetapi memakai implementasi dan aset Kastriva sendiri.

## Perubahan
- Cover lebih mirip stationery card burgundy/gold dengan floral corners.
- Dua foto pertama draft otomatis menjadi portrait pasangan (tanpa field database baru).
- Jika foto belum ada, portrait menggunakan monogram.
- Story menjadi timeline vertikal dengan heart marker + card; foto ke-3 dst dipakai bergantian jika tersedia.
- Galeri Elegant Rose menjadi main image + thumbnail strip + prev/next + auto-advance 4.8 detik.
- Auto-advance berhenti saat hover/focus dan nonaktif jika user memilih reduced motion.
- Dialog fullscreen galeri lama tetap tersedia dan accessible.
- Closing berubah menjadi floral thank-you card.
- Demo Elegant Rose memiliki 3 chapter story serta menampilkan musik/gift contoh yang sudah ada.

## Cara pasang
1. Extract ZIP ini ke root `C:\kastriva\Kastriva-Invitation` dan izinkan overwrite untuk:
   - `components/InvitationStory.tsx`
   - `components/InvitationGallery.tsx`
2. File baru lain akan ikut tersalin.
3. Jalankan:
   `powershell -ExecutionPolicy Bypass -File .\APPLY_ELEGANT_ROSE.ps1`
4. Lalu:
   `npm test`
   `npm run typecheck`
   `npm run build`
5. Jika hijau:
   `git add .`
   `git commit -m "feat: refine elegant rose reference layout"`
   `git push origin main`

Tidak ada migration Supabase baru.
