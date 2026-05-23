# Metin2 Asset Studio C++ - Setup Script
Write-Host "=== Metin2 Asset Studio C++ Setup ===" -ForegroundColor Cyan

# Check for vcpkg
if (-not (Get-Command vcpkg -ErrorAction SilentlyContinue)) {
    Write-Host "vcpkg not found. Installing..." -ForegroundColor Yellow
    git clone https://github.com/Microsoft/vcpkg.git vcpkg
    & .\vcpkg\bootstrap-vcpkg.bat
    $env:Path += ";$pwd\vcpkg"
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Green
vcpkg install --triplet x64-windows

# Configure CMake
Write-Host "Configuring CMake..." -ForegroundColor Green
cmake --preset default -DCMAKE_TOOLCHAIN_FILE="$pwd/vcpkg/scripts/buildsystems/vcpkg.cmake"

Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "Run 'cmake --build --preset default' to build" -ForegroundColor White
