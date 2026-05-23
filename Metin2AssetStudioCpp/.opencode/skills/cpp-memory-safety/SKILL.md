# C++ Memory Safety & RAII Skill

## Conventions
- No raw `new`/`delete` — use std::vector, std::unique_ptr, QObject ownership
- All OpenGL resources owned by VisualRuntime struct (RAII via destructor)
- CameraController, GizmoLayer: QObject parented to ViewportWidget
- Translation: Meyer's singleton (static local)

## OpenGL Resource Lifecycle
- VAO/VBO created in initGL → destroyed in ViewportWidget destructor
- Shader programs compiled once, reused across emitter runtimes
- Textures: generated on first use, cached in TextureRegistry

## Qt Memory Management
- All QWidgets parented to MainWindow → Qt deletes on close
- QTimer parented to MainWindow → auto-stop on destruction
- QSplitter, QTreeWidget, etc: parented, no manual delete

## Thread Safety
- Single-thread: UI thread only
- No mutable global state (Translation singleton is const after init)
- SeededRandom per RuntimeEmitter (no shared RNG state)
