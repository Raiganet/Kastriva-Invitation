# Import 63 Lagu Nikah + 2 Aqiqah ke Kastriva Invitation

Paket ini menambah dukungan MP3 hasil identifikasi ke pilihan musik Kastriva Invitation.

## Penting
File sumber tidak memiliki ID3 title/artist, jadi **jangan menebak judul**. Tool lokal akan mencoba
music recognition pada beberapa titik setiap klip. File yang tidak dikenali tidak dimasukkan ke katalog.

Music recognition dijalankan hanya di komputer developer dan tidak menjadi dependency production.

## Cara menjalankan (PowerShell)

Setelah patch ini ditimpa ke root repo:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\import_music\IMPORT_MUSIK_KASTRIVA.ps1 -InputZipOrFolder "C:\path\63 lagu nikah durasi 60 detik.zip"
```

Tool akan:
- membuat `.venv` lokal,
- memasang `shazamio` + `imageio-ffmpeg`,
- mengenali 65 MP3,
- menghasilkan `tools/import_music/output/music-identification.csv`,
- membuat salinan bernama manusia di `tools/import_music/output/nama-benar`,
- menyalin lagu unik ke `public/music/imported`,
- menghasilkan `lib/imported-music.generated.ts`,
- menjalankan `npm test` dan `npm run typecheck`.

## Review wajib
Sebelum commit, buka CSV dan dengarkan beberapa lagu untuk memeriksa hasil recognition.
Music recognition dapat salah pada cover/remix/live version.

## Hak penggunaan
Masukkan ke website publik hanya audio yang Anda memiliki izin/lisensi untuk stream/distribusikan.
Memiliki file MP3 tidak selalu berarti memiliki hak untuk menayangkannya dari layanan web komersial.

## Setelah review
Commit hasil:
```powershell
git add lib/imported-music.generated.ts public/music/imported tools/import_music/output/music-identification.csv
git commit -m "feat: import identified wedding music collection"
git push origin main
```

Migration `018_imported_music.sql` baru diterapkan ke Supabase production setelah CI hijau.
