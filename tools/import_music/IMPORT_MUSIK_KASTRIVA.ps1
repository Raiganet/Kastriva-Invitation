param(
  [Parameter(Mandatory=$true)]
  [string]$InputZipOrFolder
)
$ErrorActionPreference = "Stop"
$ToolDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Project = (Resolve-Path (Join-Path $ToolDir "..\..")).Path
$Venv = Join-Path $ToolDir ".venv"

Write-Host "=== Kastriva Music Identifier & Importer ===" -ForegroundColor Cyan
if (-not (Test-Path $InputZipOrFolder)) { throw "File/folder tidak ditemukan: $InputZipOrFolder" }

$PyLauncher = Get-Command py -ErrorAction SilentlyContinue
if ($PyLauncher) {
  $BasePython = @("py","-3")
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  $BasePython = @("python")
} else {
  throw "Python 3 belum terpasang. Instal Python 3 terlebih dahulu."
}

if (-not (Test-Path (Join-Path $Venv "Scripts\python.exe"))) {
  Write-Host "Membuat environment pengenal lagu..." -ForegroundColor Yellow
  if ($BasePython.Count -eq 2) { & $BasePython[0] $BasePython[1] -m venv $Venv }
  else { & $BasePython[0] -m venv $Venv }
}
$Python = Join-Path $Venv "Scripts\python.exe"
Write-Host "Memasang/mengecek library pengenal lagu (lokal dev saja)..." -ForegroundColor Yellow
& $Python -m pip install --disable-pip-version-check --quiet --upgrade shazamio imageio-ffmpeg
if ($LASTEXITCODE -ne 0) { throw "Gagal memasang library pengenal lagu. Pastikan internet aktif." }

& $Python (Join-Path $ToolDir "identify_and_import.py") $InputZipOrFolder --project $Project
if ($LASTEXITCODE -ne 0) { throw "Identifikasi/import gagal." }

Write-Host "`nMenjalankan unit test Kastriva..." -ForegroundColor Cyan
Push-Location $Project
try {
  npm test
  if ($LASTEXITCODE -ne 0) { throw "Unit test gagal." }
  npm run typecheck
  if ($LASTEXITCODE -ne 0) { throw "TypeScript check gagal." }
} finally { Pop-Location }

Write-Host "`nSelesai. Review tools\import_music\output\music-identification.csv." -ForegroundColor Green
Write-Host "Jika judul/penyanyi sudah benar, commit file generated + public\music\imported." -ForegroundColor Green
