# C++ Desktop Deployment Skill

## Windows Build (NSIS Installer)
- Use CPack with NSIS generator
- Bundle Qt6 DLLs via windeployqt
- Bundle OpenGL (system-provided on Windows)
- Include vcpkg redistributable DLLs

## Build Commands
```powershell
# Release build
cmake --preset default
cmake --build --preset default

# Create installer
cpack -G NSIS

# Run tests
ctest --preset default
```

## Dependencies
- Qt 6.5+ (Widgets, OpenGLWidgets, Core)
- OpenGL 3.3+ (system)
- nlohmann-json (header-only)
- Catch2 (test only)

## CI Pipeline
1. vcpkg install dependencies
2. CMake configure + build
3. Run Catch2 tests
4. windeployqt + CPack → installer artifact
