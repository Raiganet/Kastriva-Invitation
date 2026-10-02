$ErrorActionPreference = 'Stop'

$layout = Join-Path $PSScriptRoot 'app\layout.tsx'
$css = Join-Path $PSScriptRoot 'app\invitation-elegant-ornaments.css'
$assets = Join-Path $PSScriptRoot 'public\ornaments\elegant-rose'

if (-not (Test-Path $layout)) { throw "Jalankan patch ini dari root project Kastriva-Invitation. app/layout.tsx tidak ditemukan." }
if (-not (Test-Path $css)) { throw "app/invitation-elegant-ornaments.css tidak ditemukan." }
if (-not (Test-Path $assets)) { throw "Folder public/ornaments/elegant-rose tidak ditemukan." }

$content = [System.IO.File]::ReadAllText($layout)
$import = "import './invitation-elegant-ornaments.css';"

if ($content.Contains($import)) {
    Write-Host 'Import ornament CSS sudah ada. Tidak ada perubahan layout yang diperlukan.' -ForegroundColor Yellow
} else {
    $anchor = "import './invitation-elegant-reference.css';"
    if (-not $content.Contains($anchor)) {
        throw "Anchor invitation-elegant-reference.css tidak ditemukan pada app/layout.tsx."
    }
    $content = $content.Replace($anchor, "$anchor`r`n$import")
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($layout, $content, $utf8NoBom)
    Write-Host 'Import app/invitation-elegant-ornaments.css berhasil ditambahkan.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Elegant Rose ornaments siap.' -ForegroundColor Cyan
Write-Host 'Lanjutkan: npm test ; npm run typecheck ; npm run build' -ForegroundColor Yellow
