# Elegant Rose — Story Final Patch

Perbaikan terakhir untuk story berdasarkan pengujian undangan dengan data nyata.

Perubahan:
- `##`, `###`, dst tidak lagi terlihat oleh tamu.
- Heading Markdown menjadi judul card timeline.
- Heading umum seperti `## Kisah Kami` tidak menjadi chapter tersendiri.
- Format lama `2022 — Pertemuan pertama` tetap didukung.
- Tahun pada Markdown heading juga menjadi label timeline.
- Foto story dipakai satu kali sesuai urutan.
- Jika jumlah chapter melebihi jumlah foto, chapter berikutnya memakai placeholder floral.
- Tidak ada perubahan database/Supabase.

Cara pasang:
1. Extract ZIP ke root `C:\kastriva\Kastriva-Invitation`.
2. Jalankan:
   `powershell -ExecutionPolicy Bypass -File .\APPLY_ELEGANT_ROSE_STORY_FINAL.ps1`
3. Jalankan:
   `npm test`
   `npm run typecheck`
   `npm run build`
4. Jika PASS, hapus script patch lalu commit:
   `Remove-Item .\APPLY_ELEGANT_ROSE_STORY_FINAL.ps1`
   `git add components/InvitationStory.tsx lib/invitation-extras.ts tests/elegant-rose-story-parser.test.ts`
   `git commit -m "fix: finalize Elegant Rose story rendering"`
   `git push origin main`
