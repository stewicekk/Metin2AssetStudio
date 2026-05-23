# C++ CMake Build Skill

## Presets (CMakePresets.json)
- `default`: VS 2022 x64 Release, build/release
- `debug`: VS 2022 x64 Debug, build/debug

## Targets
- `Metin2AssetStudioCpp` — main executable (src/)
- `Metin2AssetStudioCpp_tests` — test executable (tests/)

## Dependencies (vcpkg.json)
- qt6, opengl, nlohmann-json, catch2

## Configuration
```bash
# With vcpkg
cmake --preset default -DCMAKE_TOOLCHAIN_FILE=<vcpkg>/scripts/buildsystems/vcpkg.cmake

# Without vcpkg (system deps)
cmake --preset default
```

## Troubleshooting
- "Could not find Qt6" → set CMAKE_PREFIX_PATH to Qt install dir
- "OpenGL not found" → install mesa or GPU drivers
- "Catch2 not found" → tests target skipped (app builds fine)
- "Link errors" → check CMAKE_BUILD_TYPE matches Qt DLLs (Debug/Release)
