$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$cssPath = Join-Path $root 'app\invitation-elegant-ornaments.css'
if (-not (Test-Path -LiteralPath $cssPath)) { throw "File tidak ditemukan: $cssPath" }

$start = [regex]::Escape('/* === Elegant Rose visual polish v2:start === */')
$end   = [regex]::Escape('/* === Elegant Rose visual polish v2:end === */')
$content = [System.IO.File]::ReadAllText($cssPath)
$pattern = "(?s)\r?\n?\r?\n?$start.*?$end\r?\n?"
$updated = [regex]::Replace($content, $pattern, '')
if ($updated -eq $content) {
  Write-Host 'Blok polish v2 tidak ditemukan. Tidak ada yang dihapus.' -ForegroundColor Yellow
  exit 0
}
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($cssPath, $updated.TrimEnd() + [Environment]::NewLine, $utf8NoBom)
Write-Host 'OK - Elegant Rose visual polish v2 di-rollback.' -ForegroundColor Green
