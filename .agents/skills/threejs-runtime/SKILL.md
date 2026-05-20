---
name: threejs-runtime
description: "Custom Three.js particle runtime (NOT react-three-fiber). Covers RendererHost, ParticleSimulation, ParticleRenderer, GPU instanced points with ShaderMaterial, CameraController orbits, seeded RNG, texture atlas. Use when working on the 3D viewport, particle physics, rendering, or camera controls."
allowed-tools: "Bash(belt *), Read, Write, Edit, Grep, Glob"
---

# Three.js Runtime Skill

## Architecture — Standalone Three.js (No R3F)

The runtime is NOT using `@react-three/fiber`. It uses raw Three.js classes.

### Critical Path
```
RendererHost constructor → create scene/camera/renderer → requestAnimationFrame animate()
  animate():
    useAppStore.getState() → particles.sync(emitters) → particles.update(dt, playing) → render()
```

### RendererHost (`src/runtime/three/RendererHost.ts`)
- Owns scene, camera (PerspectiveCamera 45° FOV), WebGLRenderer
- Starts animation loop in constructor via `requestAnimationFrame`
- **Clamped dt** to 0.05s max (prevents physics explosion on tab switch)
- Reads store directly via `useAppStore.getState()` — no React hooks
- Updates `globalTime` in store when `playing` — drives UI timeline
- Scene: AmbientLight + 2 DirectionalLights + GridHelper + AxesHelper
- Background color: `0x0a1118`
- Dispose pattern: cancelAnimationFrame, remove resize listener, dispose renderer/scene objects
- **StrictMode double-mount**: RendererHost is created twice in dev. Cleanup must fully dispose.

### ParticleRenderer (`src/runtime/three/ParticleRenderer.ts`)
- Manages `Map<uid, VisualRuntime>` — one Three.js Points per emitter
- **sync(emitters)**: creates/disposes runtimes based on signature
- **Signature** = `maxP|blend|builtinTex|texDataUrl|sheetCols|sheetRows`
- When signature changes, old runtime is disposed and recreated
- **update(dt, playing, viewportScale)**: runs physics → writes GPU buffers
- **writeAttributes()**: uploads position/size/color/alpha/frame/rotation to BufferAttribute
- Dead particles: position=(99999,99999,99999), size=0, alpha=0
- Alive particles: size = baseSize × sizeCurve(t) × 14

### ParticleSimulation (`src/runtime/three/ParticleSimulation.ts`)
- Pure data functions, no Three.js dependency
- `createParticles(count)` — pre-allocate particle pool
- `resetRuntime(runtime)` — reset to clean state
- `spawnParticle(runtime)` — find dead slot, initialize from emitter params
- `updateRuntime(runtime, dt, playing)` — physics tick, returns alive count
- Seeded RNG: `SeededRandom(uid * 2654435761)` for deterministic playback
- Spawn shapes: point, box, sphere, spherevol, ring, disc, cone
- Direction: yaw/pitch → random cone within spread
- Physics: gravity (Y only), wind (X/Z), drag, ground bounce, color from colorKeys at t
- UV anim: `loop` (continous cycle), `once` (play then hold), `life` (map lifetime to frame), `rand` (random initial frame)

### ShaderMaterial (`ParticleRenderer.ts` lines 79-116)
- **Vertex**: transforms position, computes `gl_PointSize = max(0.5, aSize × uScale × (420 / -mv.z))`
- **Fragment**: sprite-sheet UV, rotation via 2D rotation matrix on gl_PointCoord
- Discards fragments: alpha<0.003, UV outside [0,1], tex alpha<0.008
- Blending: `add→AdditiveBlending`, `modulate→MultiplyBlending`, else NormalBlending
  - **MultiplyBlending exists in Three.js 0.184 but was removed in later versions!**
- Uniforms: uTex (sampler2D), uCols, uRows, uScale

### CameraController (`src/runtime/three/CameraController.ts`)
- Spherical coordinates: `phi` (horizontal), `theta` (vertical), `radius`
- Initial position: `(4, 5.66, 4)` looking at `(0, 1, 0)` — theta=π/4, phi=π/4, radius=8
- Controls: RMB drag = orbit, MMB drag = pan, scroll = zoom
- Uses `setPointerCapture` for reliable drag tracking
- Dispose: nullifies all event handlers
- Reset: `reset()` → back to initial position

### SeededRandom (`src/runtime/three/SeededRandom.ts`)
- LCG: `state = (1664525 × state + 1013904223) >>> 0`
- `next()` → [0, 1), `range(min, max)`, `centered(amount)` → uniform [-amount, amount]

### TextureRegistry (`src/runtime/three/TextureRegistry.ts`)
- Canvas-generated textures: circle, star, ring, spark, cross, flare, smoke, diamond, softglow, hexagon, flame, arrow, debris
- Cache via Map, keyed by type name
- Built-in texture fallback: 'circle'

## Key Files
- `src/runtime/three/RendererHost.ts`
- `src/runtime/three/ParticleSimulation.ts`
- `src/runtime/three/ParticleRenderer.ts`
- `src/runtime/three/CameraController.ts`
- `src/runtime/three/SeededRandom.ts`
- `src/runtime/three/TextureRegistry.ts`
- `src/runtime/three/index.ts`
- `src/utils/curveUtils.ts` — sampleCurve, sampleColor interpolation helpers
- `src/utils/math.ts` — lerp, clamp utility functions

## Known Gotchas
- **GraphPanel infinite loop**: `buildEffectGraph()` creates new arrays each call. Wrap in `useMemo`. Compare `graph.nodes.length` not `graph.nodes` reference in useEffect.
- **MultiplyBlending** exists in Three.js 0.184 but was removed in r152+. DO NOT upgrade Three.js without changing this.
- **Particle size scale factor**: `writeAttributes` multiplies by 14 (`sizeBase * 14`). This matches the original reference implementation.
- **Deterministic playback**: Seeded RNG ensures identical results for same seed. Useful for testing.
