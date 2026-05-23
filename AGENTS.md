# Metin2 Asset Studio — Agent Guide

## Commands

| from | command | what |
|---|---|---|
| `frontend/` | `npm run dev` | Vite dev server on :5173 |
| `frontend/` | `npm run build` | `tsc -b && vite build` — **run after every change** |
| `frontend/` | `npm test` | `tsx test-runner.js` — 152+ `.mse` fixtures |
| `server/` | `npm start` | Server on :3000 (needs built dist) |
| root | `npm run desktop` | Build + launch Electron |

## Architecture (current)

```
frontend/src/
  store/useAppStore.ts            # Zustand — undo/redo (50-level), project JSON, auto-save
  runtime/three/
    RendererHost.ts               # rAF loop (no setAnimationLoop), bloom, fog
    ParticleSimulation.ts         # Free-list slots (O(1) spawn/despawn), shape spawn, turb, attractor
    ParticleRenderer.ts           # THREE.Points with ShaderMaterial, frustumCulled=false
    MeshParticleRenderer.ts       # Quad-based mesh particles for velStretch/sizeNonUniform
    CameraController.ts           # Spherical orbit with pre-allocated Vector3
    ShaderCache.ts                # Deduplicated ShaderMaterial cloning
    TextureRegistry.ts            # Built-in procedural textures + atlas
    GizmoLayer.ts                 # Translate gizmo for particle origin
    RendererProfiler.ts           # Per-frame timing marks
    ProfilingStore.ts             # Zustand store for profiling UI
    SeededRandom.ts               # LCG PRNG (seeded by uid)
  components/                     # Viewport, EmitterList, PropsPanel, TimelinePanel, etc.
  styles/layout.css               # Dark fantasy industrial design system (v2)
  App.tsx                         # 3-column layout, toolbar, 6 tabs, drag-drop, modals
  utils/
    assetManager.ts               # buildStudioMse() — 1:1 Metin2 game format exporter
    mseExporter.ts                # buildMSE() — alternate exporter with 6 decimals, integer blend codes
    exporter.ts                   # downloadText, copyToClipboard
    curveUtils.ts                 # sampleCurve, sampleColor
    math.ts                       # lerp, clamp
    mathPool.ts                   # Vector3 pool
    defaults.ts                   # createDefaultEmitter
    projectDB.ts                  # IndexedDB project storage (IndexedDB)
    toast.ts                      # Toast notification system
  types/index.ts                  # Emitter, Particle, ColorKey, CurvePoint, AppSettings
  i18n/                           # EN + CS translations (140+ keys)
  core/mseParser.ts               # Legacy MSE text format parser
```

## Known critical fixes (v2.0.0)

- **frustumCulled=false** — `ParticleRenderer.ts:283` THREE.Points needs this or particles culled
- **Point shape spread** — point particles get random offset (not all stacked at origin)
- **Initial spawn** — spawnAcc starts at 0.5 so first particles appear immediately
- **Auto-init** — App.tsx creates emitter + setsPlaying on first mount
- **Viewport deps** — useEffect uses `[]` not `[cameraRef]` to avoid destroy/recreate loop
- **autoPlay** — `playing` initializes from `settings.autoPlay`; resetProject/import respect it
- **shapeRadius** — uses `?? 0.35` (not `||`) to allow explicit zero
- **Cone distribution** — particles get `oy = -rndSqrt * radius * 0.5` (not flat disc)

## Dead code removed (v2.0.0)

- Metin2AssetStudioCpp/ (entire C++ Qt port — 110 files)
- 6 out-of-scope skills (agent-tools, NestJS, Python, modern-js, find-skills, AsetAgentmetin2)
- 19 unused frontend files (CST parser, editor timeline, debug utils, runtime duplicates)
- 7 .bak MSE fixture files
- Legacy Python project (pyproject.toml, requirements.txt, uv.lock)
- website.html, DOKUMENTACE.md, Dockerfile.python, fly.toml, deploy-all.ps1
- Dead CSS selectors (236 lines)

## Export rules

- MSE: shape codes 0-4, colors 0-255 integer, 6 decimal floats
- EFF: blend 0=alpha/1=add/2=modulate, rotType 0=NONE/2=SPIN/4=RANDOM
- MDE: GR2 reference + Bip01 bone attach + bounding radius
- `buildStudioMse()`: Group Particle { Group EmitterProperty { } Group ParticleProperty { } }
  - Shape-conditional geometry: EmittingSize for box, EmittingRadius for sphere/disc/cone, nothing for point
  - Integer props (MaxEmissionCount, LoopCount, EmitterShape, RotationType) NOT formatted as floats
  - All time-event lists and color keys sorted by time ascending

## Three.js notes

- **r184 pinned** — MultiplyBlending removed in later versions
- **No react-three-fiber** — custom direct Three.js usage
- **ShaderMaterial** for points, not PointsMaterial (custom size/alpha/rotation)
