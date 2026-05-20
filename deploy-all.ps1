# deploy-all.ps1 — Complete Build + Deploy Pipeline for Metin2 Asset Studio
# Usage:
#   .\deploy-all.ps1                     # Build everything locally
#   .\deploy-all.ps1 -deploy vercel     # Build + deploy to Vercel (needs vercel CLI)
#   .\deploy-all.ps1 -deploy render     # Build + push to GitHub (for Render auto-deploy)
#   .\deploy-all.ps1 -deploy fly        # Build + deploy to Fly.io (needs flyctl)
#   .\deploy-all.ps1 -deploy docker     # Build Docker image

param(
    [string]$deploy = "build",
    [string]$repo = "https://github.com/YOUR_USER/Metin2-Asset-Studio"
)

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Metin2 Asset Studio — Deploy Pipeline"  -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ---- Step 1: Build frontend ----
Write-Host "[1/3] Building frontend..." -ForegroundColor Yellow
Set-Location "$ROOT/frontend"
npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  -> Frontend build OK" -ForegroundColor Green

# ---- Step 2: Verify tests ----
Write-Host "[2/3] Running tests..." -ForegroundColor Yellow
npm test 2>&1 | Select-String -Pattern "Results:"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tests failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  -> Tests OK" -ForegroundColor Green

# ---- Step 3: Deploy ----
Write-Host "[3/3] Deploying..." -ForegroundColor Yellow

switch ($deploy) {
    "build" {
        Write-Host "  -> Build complete! Use -deploy vercel/render/fly/docker to deploy." -ForegroundColor Green
        Write-Host "  -> Frontend dist: $ROOT/frontend/dist/" -ForegroundColor Green
    }

    "vercel" {
        Write-Host "  -> Deploying to Vercel..." -ForegroundColor Yellow
        vercel --prod --cwd "$ROOT" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  -> Vercel deploy complete!" -ForegroundColor Green
        } else {
            Write-Host "  -> Vercel deploy failed. Install CLI: npm i -g vercel" -ForegroundColor Red
        }
    }

    "render" {
        Write-Host "  -> Preparing for Render.com deployment..." -ForegroundColor Yellow
        # Initialize git if needed
        if (-not (Test-Path "$ROOT/.git")) {
            Set-Location $ROOT
            git init
            git add -A
            git commit -m "Initial commit v1.1.0"
            Write-Host "  -> Git initialized. Push to your GitHub repo:" -ForegroundColor Cyan
            Write-Host "     git remote add origin $repo" -ForegroundColor Cyan
            Write-Host "     git push -u origin master" -ForegroundColor Cyan
        } else {
            Set-Location $ROOT
            git add -A
            git commit -m "Deploy commit $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
            git push
        }
        Write-Host "  -> Then connect https://render.com -> New Web Service -> Your GitHub repo" -ForegroundColor Green
    }

    "fly" {
        Write-Host "  -> Deploying to Fly.io..." -ForegroundColor Yellow
        flyctl deploy --config "$ROOT/fly.toml" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  -> Fly.io deploy complete!" -ForegroundColor Green
        } else {
            Write-Host "  -> Fly.io deploy failed. Install CLI: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Red
        }
    }

    "docker" {
        Write-Host "  -> Building Docker image..." -ForegroundColor Yellow
        docker build -t metin2-asset-studio:latest -f "$ROOT/Dockerfile" "$ROOT" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  -> Docker image built: metin2-asset-studio:latest" -ForegroundColor Green
            Write-Host "  -> Run: docker run -p 3000:3000 metin2-asset-studio:latest" -ForegroundColor Green
        } else {
            Write-Host "  -> Docker build failed." -ForegroundColor Red
        }
    }

    default {
        Write-Host "Unknown deploy target: $deploy" -ForegroundColor Red
        Write-Host "Options: build, vercel, render, fly, docker" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Done!"                                 -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
