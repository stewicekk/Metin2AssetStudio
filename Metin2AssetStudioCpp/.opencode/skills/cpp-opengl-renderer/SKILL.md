# C++ OpenGL Renderer Skill

## Architecture (src/runtime)
- ParticleRenderer: GL 3.3 core profile, VAO/VBO, GL_POINTS draw
- CameraController: spherical coords (phi/theta/radius), RMB orbit, MMB pan
- TextureRegistry: procedural QImage textures via software raster

## Shaders
Vertex: transform by MVP, compute gl_PointSize = max(0.5, aSize * uScale * (420 / -mv.z))
Fragment: sprite-sheet UV lookup, rotation via coord transform, alpha < 0.003 discard

## Viewport (src/ui/ViewportWidget)
- QOpenGLWidget, initializeGL → resizeGL → paintGL cycle
- Projection: glFrustum or manual matrix (aspect-aware)
- Camera: getPosition() from spherical → gluLookAt equivalent
- Overlays: grid (XZ lines), axis (RGB), minimap (120x120 top-right)
- Screenshot: glReadPixels(GL_RGBA) → QImage

## Gizmo (src/ui/GizmoLayer)
- Translate mode: 3 axis arrows (RGB)
- Hit test: project axis to screen, check distance < 10px
- Drag: plane-projection along active axis
