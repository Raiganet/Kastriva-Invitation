$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$cssPath = Join-Path $root 'app\invitation-elegant-ornaments.css'

if (-not (Test-Path -LiteralPath $cssPath)) {
  throw "File tidak ditemukan: app/invitation-elegant-ornaments.css. Extract ZIP ini ke root project Kastriva-Invitation terlebih dahulu."
}

$requiredAssets = @(
  'public\ornaments\elegant-rose\rose-cluster.png',
  'public\ornaments\elegant-rose\floral-divider-mask.png',
  'public\ornaments\elegant-rose\filigree-corner-mask.png'
)
foreach ($asset in $requiredAssets) {
  $assetPath = Join-Path $root $asset
  if (-not (Test-Path -LiteralPath $assetPath)) {
    throw "Asset ornamen belum ada: $asset. Terapkan paket Elegant Rose Ornaments sebelumnya terlebih dahulu."
  }
}

$startMarker = '/* === Elegant Rose visual polish v2:start === */'
$current = [System.IO.File]::ReadAllText($cssPath)

if ($current.Contains($startMarker)) {
  Write-Host 'Elegant Rose visual polish v2 sudah pernah diterapkan. Tidak ada perubahan.' -ForegroundColor Yellow
  exit 0
}

$patch = @'
/* === Elegant Rose visual polish v2:start === */
/* Readability, story placeholder detail, couple divider and bottom-nav safe spacing. */

.theme-elegant-rose .inv-closing > p{
  color:#6d3f4b!important;
  opacity:1!important;
  font-size:clamp(13px,1.45vw,15px);
  line-height:1.9;
  font-weight:500;
  max-width:430px;
  margin-inline:auto;
}
.theme-elegant-rose .inv-closing > small{
  display:block;
  color:#8a5d68!important;
  opacity:1!important;
  letter-spacing:.035em;
  margin-top:4px;
}
.theme-elegant-rose .inv-closing .inv-button{
  background:#fff9f9d9;
  color:var(--er-wine);
  border-color:#8d4054a8;
  box-shadow:0 12px 30px #6b28351a;
}
.theme-elegant-rose .inv-closing::before{
  width:178px;
  height:178px;
  left:-30px;
  bottom:-31px;
  opacity:.46;
}
.theme-elegant-rose .inv-closing::after{
  opacity:.72;
}

.theme-elegant-rose .elegant-story-placeholder{
  isolation:isolate;
  background:
    radial-gradient(circle at 22% 22%,#fff9fa 0 8%,transparent 8.5%),
    linear-gradient(135deg,#f4dfe4,#fff5f6);
}
.theme-elegant-rose .elegant-story-placeholder::before{
  content:"";
  position:absolute;
  z-index:0;
  width:clamp(118px,30vw,170px);
  height:clamp(88px,23vw,128px);
  right:-18px;
  top:-19px;
  background:url('/ornaments/elegant-rose/rose-cluster.png') center/contain no-repeat;
  opacity:.17;
  filter:saturate(.62) sepia(.08);
  transform:rotate(13deg);
  pointer-events:none;
}
.theme-elegant-rose .elegant-story-placeholder::after{
  content:"";
  position:absolute;
  z-index:0;
  inset:12px;
  border:1px solid #a7587030;
  border-radius:13px;
  pointer-events:none;
}
.theme-elegant-rose .elegant-story-placeholder > span{
  position:relative;
  z-index:2;
  display:grid;
  place-items:center;
  width:54px;
  height:54px;
  border-radius:50%;
  background:#fff8f9b8;
  border:1px solid #a6536a2c;
  color:#b55671;
  font-size:31px;
  line-height:1;
  box-shadow:0 12px 30px #6c2d3b13;
}
.theme-elegant-rose .elegant-story-copy p{
  color:#744a55;
}

.theme-elegant-rose .elegant-couple-person p{
  color:#754955;
}
.theme-elegant-rose .elegant-couple-person p:not(:empty)::before{
  content:"";
  display:block;
  width:64px;
  height:22px;
  margin:2px auto 8px;
  background:var(--er-gold,#d7954b);
  -webkit-mask:url('/ornaments/elegant-rose/floral-divider-mask.png') center/contain no-repeat;
  mask:url('/ornaments/elegant-rose/floral-divider-mask.png') center/contain no-repeat;
  opacity:.44;
}

.theme-elegant-rose:not(.inv-embedded) .inv-content{
  padding-bottom:calc(142px + env(safe-area-inset-bottom));
}
.theme-elegant-rose [data-inv-section],
.theme-elegant-rose .inv-closing{
  scroll-margin-bottom:96px;
}
.theme-elegant-rose .elegant-story-timeline > li:last-child{
  padding-bottom:68px;
}

@media(max-width:600px){
  .theme-elegant-rose .inv-closing > p{font-size:13px;max-width:300px}
  .theme-elegant-rose .inv-closing::before{
    width:132px;
    height:132px;
    left:-18px;
    bottom:-18px;
    opacity:.42;
  }
  .theme-elegant-rose .elegant-story-placeholder::before{
    width:116px;
    height:88px;
    right:-13px;
    top:-12px;
  }
  .theme-elegant-rose .elegant-story-placeholder::after{inset:9px}
  .theme-elegant-rose .elegant-story-placeholder > span{
    width:48px;
    height:48px;
    font-size:27px;
  }
  .theme-elegant-rose .elegant-couple-person p:not(:empty)::before{
    width:56px;
    height:20px;
  }
  .theme-elegant-rose:not(.inv-embedded) .inv-content{
    padding-bottom:calc(132px + env(safe-area-inset-bottom));
  }
  .theme-elegant-rose .elegant-story-timeline > li:last-child{
    padding-bottom:58px;
  }
}

@media(prefers-reduced-motion:reduce){
  .theme-elegant-rose .elegant-story-placeholder::before{
    animation:none!important;
  }
}
/* === Elegant Rose visual polish v2:end === */
'@

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::AppendAllText($cssPath, [Environment]::NewLine + [Environment]::NewLine + $patch + [Environment]::NewLine, $utf8NoBom)

Write-Host ''
Write-Host 'OK - Elegant Rose visual polish v2 berhasil diterapkan.' -ForegroundColor Green
Write-Host 'Perubahan: closing contrast, story floral placeholder, couple divider, nav safe spacing.' -ForegroundColor Cyan
Write-Host 'Lanjutkan: npm test ; npm run typecheck ; npm run build' -ForegroundColor Yellow
