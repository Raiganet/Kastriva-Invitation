$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$cssPath = Join-Path $root 'app\invitation-elegant-ornaments.css'

if (-not (Test-Path -LiteralPath $cssPath)) {
  throw "File tidak ditemukan: app/invitation-elegant-ornaments.css. Extract ZIP ke root project Kastriva-Invitation."
}

$startMarker = '/* === Elegant Rose final mobile polish v4:start === */'
$current = [System.IO.File]::ReadAllText($cssPath)

if ($current.Contains($startMarker)) {
  Write-Host 'Elegant Rose final mobile polish v4 sudah pernah diterapkan.' -ForegroundColor Yellow
  exit 0
}

$patch = @'
/* === Elegant Rose final mobile polish v4:start === */
/* Final mobile QA: compact empty gallery, safe story ending, smaller music control. */

@media(max-width:600px){

  /* Empty gallery:
     the global 4/5 aspect ratio made the first placeholder excessively tall.
     On Elegant Rose mobile we use compact stationery cards instead. */
  .theme-elegant-rose .photo-placeholders{
    gap:12px;
    margin-top:26px;
    margin-bottom:12px;
  }

  .theme-elegant-rose .photo-placeholders > div{
    aspect-ratio:auto!important;
    min-height:158px!important;
    padding:18px 12px;
    border-radius:22px!important;
    background:
      radial-gradient(circle at 84% 14%,#e8bcc522 0 16%,transparent 17%),
      linear-gradient(145deg,#fffafa,#f9ecef);
    box-shadow:0 14px 34px #6d2d3c0d;
  }

  .theme-elegant-rose .photo-placeholders > div:first-child{
    min-height:225px!important;
  }

  .theme-elegant-rose .photo-placeholders span{
    margin:4px 0 10px;
    opacity:.62;
  }

  .theme-elegant-rose .photo-placeholders small{
    font-size:14px;
    color:#744451;
  }

  .theme-elegant-rose .inv-caption{
    margin-top:16px;
    padding-inline:16px;
  }

  /* Give the final story card enough trailing room to scroll fully above the fixed nav. */
  .theme-elegant-rose .elegant-story-timeline > li:last-child{
    padding-bottom:118px!important;
  }

  /* Music remains accessible but no longer competes visually with the content/nav. */
  .theme-elegant-rose .inv-music{
    right:12px;
    bottom:calc(101px + env(safe-area-inset-bottom));
  }

  .theme-elegant-rose .music-toggle{
    width:48px;
    min-height:48px;
    padding:6px;
    gap:2px;
    font-size:8px;
    box-shadow:0 9px 24px #5b26331c;
  }

  .theme-elegant-rose .music-bars{
    height:14px;
    gap:2px;
  }

  .theme-elegant-rose .music-bars i{
    width:2px;
  }

  /* Keep the last page content safely clear of the dock on phones with gesture bars. */
  .theme-elegant-rose:not(.inv-embedded) .inv-content{
    padding-bottom:calc(148px + env(safe-area-inset-bottom));
  }
}

/* Extra-narrow phones: keep the gallery balanced without squeezing labels. */
@media(max-width:380px){
  .theme-elegant-rose .photo-placeholders{
    grid-template-columns:1fr;
  }

  .theme-elegant-rose .photo-placeholders > div:first-child{
    grid-column:auto;
    min-height:205px!important;
  }

  .theme-elegant-rose .photo-placeholders > div{
    min-height:145px!important;
  }
}
/* === Elegant Rose final mobile polish v4:end === */
'@

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::AppendAllText(
  $cssPath,
  [Environment]::NewLine + [Environment]::NewLine + $patch + [Environment]::NewLine,
  $utf8NoBom
)

Write-Host ''
Write-Host 'OK - Elegant Rose final mobile polish v4 berhasil diterapkan.' -ForegroundColor Green
Write-Host 'Perubahan: galeri kosong dipadatkan, story aman dari nav, tombol musik diperkecil.' -ForegroundColor Cyan
Write-Host 'Lanjutkan: npm test ; npm run typecheck ; npm run build' -ForegroundColor Yellow
