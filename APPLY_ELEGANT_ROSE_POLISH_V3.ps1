$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$cssPath = Join-Path $root 'app\invitation-elegant-ornaments.css'

if (-not (Test-Path -LiteralPath $cssPath)) {
  throw "File tidak ditemukan: app/invitation-elegant-ornaments.css. Extract ZIP ini ke root project Kastriva-Invitation terlebih dahulu."
}

$startMarker = '/* === Elegant Rose visual polish v3:start === */'
$current = [System.IO.File]::ReadAllText($cssPath)

if ($current.Contains($startMarker)) {
  Write-Host 'Elegant Rose visual polish v3 sudah pernah diterapkan. Tidak ada perubahan.' -ForegroundColor Yellow
  exit 0
}

$patch = @'
/* === Elegant Rose visual polish v3:start === */
/* Final micro-polish from deployed screenshots: remove placeholder bubble,
   balance closing ornaments, and make desktop bottom navigation less intrusive. */

/* Story placeholder: remove the large white circular highlight seen in desktop. */
.theme-elegant-rose .elegant-story-placeholder{
  background:
    linear-gradient(145deg,#f4dfe4 0%,#f9e8ec 48%,#fff7f7 100%)!important;
}

/* Keep the floral watermark, but make it feel printed into the paper. */
.theme-elegant-rose .elegant-story-placeholder::before{
  opacity:.13;
  filter:saturate(.55) sepia(.08);
}
.theme-elegant-rose .elegant-story-placeholder > span{
  background:#fffafad4;
  border-color:#a6536a24;
  box-shadow:0 10px 26px #6c2d3b10;
}

/* Closing: use a second soft rose cluster at bottom-left for visual balance. */
.theme-elegant-rose .inv-closing::before{
  content:"";
  position:absolute;
  z-index:1;
  left:-42px;
  bottom:-36px;
  width:170px;
  height:128px;
  background:url('/ornaments/elegant-rose/rose-cluster.png') center/contain no-repeat!important;
  -webkit-mask:none!important;
  mask:none!important;
  opacity:.24;
  filter:saturate(.62) sepia(.08);
  transform:rotate(194deg);
  pointer-events:none;
}
.theme-elegant-rose .inv-closing::after{
  opacity:.68;
}

/* The fixed nav is useful, but on desktop it should cover less invitation content. */
@media(min-width:701px){
  .theme-elegant-rose .inv-bottom-nav{
    width:344px;
    bottom:12px;
    gap:3px;
    padding:5px;
    border-radius:20px;
  }
  .theme-elegant-rose .inv-bottom-nav button{
    min-height:47px;
    padding:5px 3px;
    gap:2px;
    border-radius:14px;
    font-size:9px;
  }
  .theme-elegant-rose .inv-bottom-nav svg{
    width:18px;
    height:18px;
  }
  .theme-elegant-rose:not(.inv-embedded) .inv-content{
    padding-bottom:calc(128px + env(safe-area-inset-bottom));
  }
}

/* Slightly refine the couple information ornament. */
.theme-elegant-rose .elegant-couple-person p:not(:empty)::before{
  width:54px;
  height:18px;
  margin:3px auto 10px;
  opacity:.36;
}

@media(max-width:600px){
  .theme-elegant-rose .inv-closing::before{
    left:-30px;
    bottom:-26px;
    width:132px;
    height:100px;
    opacity:.2;
  }
  .theme-elegant-rose .elegant-story-placeholder::before{
    opacity:.11;
  }
}
/* === Elegant Rose visual polish v3:end === */
'@

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::AppendAllText(
  $cssPath,
  [Environment]::NewLine + [Environment]::NewLine + $patch + [Environment]::NewLine,
  $utf8NoBom
)

Write-Host ''
Write-Host 'OK - Elegant Rose visual polish v3 berhasil diterapkan.' -ForegroundColor Green
Write-Host 'Perubahan: story bubble dihapus, closing diseimbangkan, nav desktop diperkecil.' -ForegroundColor Cyan
Write-Host 'Lanjutkan: npm test ; npm run typecheck ; npm run build' -ForegroundColor Yellow
