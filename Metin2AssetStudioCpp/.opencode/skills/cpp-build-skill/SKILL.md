# C++ Build & Test Skill

## Commands
- `cmake --preset default` — configure Release
- `cmake --preset debug` — configure Debug
- `cmake --build --preset default` — build Release
- `cmake --build --preset debug` — build Debug
- `ctest --preset default` — run tests Release
- `ctest --preset debug` — run tests Debug

## Architecture
```
src/
  core/         Types.h, MseParser, MseExporter, EffExporter, MdeExporter, ProjectManager
  runtime/      ParticleSimulation, SeededRandom, TextureRegistry, CameraController, ParticleRenderer
  ui/           MainWindow, EmitterListPanel, PropsPanel, ViewportWidget, TimelinePanel, PresetsPanel, SceneSettingsPanel, GizmoLayer
  utils/        CurveUtils, MathUtils
  i18n/         Translation (EN/CS)
tests/          Catch2 test suite
```

## Coding Standards
- C++23, strict const-correctness
- Qt 6 signal/slot for UI communication
- OpenGL 3.3 core profile for rendering
- nlohmann/json for serialization
- No raw loops where algorithms suffice
- All allocations via RAII containers

## Known Gotchas
- QOpenGLWidget requires initializeGL before any GL calls
- CameraController uses spherical coords (phi/theta/radius)
- SeededRandom LCG: state = (1664525 * state + 1013904223) & 0xFFFFFFFF
