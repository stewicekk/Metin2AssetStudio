# Metin2 Asset Studio — Pipeline Startup Script
param(
  [switch]$dev,
  [switch]$install,
  [switch]$rebuild
)

$Root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$Frontend = Join-Path $Root "frontend"
$Server = Join-Path $Root "server"

function Write-Step($msg) { Write-Host "`n  ⚔  $msg" -ForegroundColor DarkYellow }

# Install dependencies
if ($install -or (-not (Test-Path (Join-Path $Frontend "node_modules")))) {
  Write-Step "Installing frontend dependencies..."
  Set-Location $Frontend; npm install
}
if ($install -or (-not (Test-Path (Join-Path $Server "node_modules")))) {
  Write-Step "Installing server dependencies..."
  Set-Location $Server; npm install
}

# Rebuild
if ($rebuild -or (-not (Test-Path (Join-Path $Frontend "dist")))) {
  Write-Step "Building frontend..."
  Set-Location $Frontend; npm run build
}

if ($dev) {
  # Dev mode — run both frontend dev server and backend
  Write-Step "Starting in DEV mode..."
  Write-Host "  Frontend: http://localhost:5173"
  Write-Host "  Backend:  http://localhost:3000"
  Write-Host "`n  Starting both servers...`n" -ForegroundColor DarkYellow
  
  # Start backend in background
  $job = Start-Job -ScriptBlock {
    param($dir) Set-Location $dir; npm start
  } -ArgumentList $Server
  
  # Start frontend dev server
  Set-Location $Frontend; npm run dev
  
  # Cleanup
  Stop-Job $job; Remove-Job $job
} else {
  # Production mode
  Write-Step "Starting PRODUCTION server..."
  Write-Host "  http://localhost:3000`n" -ForegroundColor Green
  Set-Location $Server; npm start
}
