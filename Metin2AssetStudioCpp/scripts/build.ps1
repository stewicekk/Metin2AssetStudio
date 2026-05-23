# Metin2 Asset Studio C++ - Build Script
param([switch]$Release, [switch]$Debug, [switch]$Run, [switch]$Test)

if (-not ($Release -or $Debug)) { $Release = $true }

$preset = if ($Debug) { "debug" } else { "default" }
$buildType = if ($Debug) { "Debug" } else { "Release" }

Write-Host "=== Building Metin2 Asset Studio C++ ($buildType) ===" -ForegroundColor Cyan

# Configure
cmake --preset $preset
if ($LASTEXITCODE -ne 0) { Write-Host "CMake configure failed!" -ForegroundColor Red; exit 1 }

# Build
cmake --build --preset $preset
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }

Write-Host "Build successful!" -ForegroundColor Green

if ($Run) {
    Write-Host "Launching application..." -ForegroundColor Cyan
    & "build/$buildType/Metin2AssetStudioCpp.exe"
}

if ($Test) {
    Write-Host "Running tests..." -ForegroundColor Cyan
    & "build/$buildType/tests/Metin2AssetStudioCpp_tests.exe"
}
