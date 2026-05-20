# Metin2 Asset Studio — Agent Guide

## Commands

| from | command | what |
|---|---|---|
| `frontend/` | `npm run dev` | Vite dev server on :5173 |
| `frontend/` | `npm run build` | `tsc -b && vite build` — **run after every change** |
| `frontend/` | `npm test` | `tsx test-runner.js` — 660+ `.mse` fixtures |
| `server/` | `npm start` | Server on :3000 (needs built dist) |
| `server/` | `powershell -File start-pipeline.ps1` | Build + test + serve |
| root | `npm run desktop` | Build + launch Electron |

## Architecture (current)

```
frontend/src/
  core/
    cst/                          # NEW: Lossless CST (v1.1.0)
      types.ts                    # Token + CSTNode with sourceRange, dirty flag
      tokenizer.ts                # Lossless tokenizer (preserves whitespace, comments)
      parser.ts                   # CST parser → dirty-tracked nodes
      serializer.ts               # Patch serializer (dirty→canonical, clean→raw passthrough)
      index.ts                    # Public API
    mseParser.ts                  # Legacy parser (preserved for backward compat)
  store/useAppStore.ts            # Zustand — undo/redo (50-level), project JSON, auto-save
  runtime/three/
    RendererHost.ts               # rAF loop (no setAnimationLoop), reusable Fog, character dispose
    ParticleSimulation.ts         # Free-list slots (O(1) spawn/despawn), cone *0.7, turb, attractor, velStretch
    ParticleRenderer.ts           # resolveTexture, velStretch rotation override
    CameraController.ts           # Pre-allocated Vector3
    TextureRegistry.ts            # resolveTexture() for texDataUrl
  styles/layout.css               # Dark fantasy industrial design system (v2)
  App.tsx                         # 5 tabs, toolbar, drag-drop, project browser, toast
  components/                     # 10 components

server/src/                       # NEW: Modular backend (v1.1.0)
  index.js                        # Express + WebSocket + modular routes
  config.js                       # Environment config
  logger.js                       # File + stdout logging
  websocket.js                    # WS server on /ws
  services/queue.js               # Job queue for async validate/export
  routes/
    fixtures.js                   # /api/fixtures (list, search, categories, content)
    projects.js                   # /api/projects (CRUD on JSON files)
    validate.js                   # /api/validate (sync + async jobs)
    export.js                     # /api/export/mse, /api/export/eff
  projects/                       # JSON project files directory
  logs/                           # Server logs directory

electron/
  main.js                         # Native menu (File/Edit/View/Help), IPC, dev/prod
  preload.js                      # contextBridge for file APIs
  package.json                    # electron-builder config (NSIS/AppImage/DMG)
```

## CST dirty tracking

- `CSTNode.dirty = false` → serializer uses `node.raw` (original text passthrough)
- `CSTNode.dirty = true` → serializer rebuilds from semantic data
- Comments, blanks, unknown fields are ALWAYS preserved when `dirty = false`
- `markDirty(node, path[])` marks specific nodes for rebuild
- `rebuildCSTFromEmitters(root, emitters)` marks all emitter blocks as dirty

## Known issues / gotchas

- **GraphPanel** infinite loop: wrap `buildEffectGraph()` in `useMemo`, compare `.length` not reference
- **StrictMode double-effects**: RendererHost created twice in dev — cleanup disposes properly
- **Three.js 0.184**: `MultiplyBlending` removed in later versions — pin to 0.184
- **`noUnusedLocals: true`** will fail build — remove unused imports
- **`erasableSyntaxOnly: true`** bans `enum`, `namespace`, constructor parameter properties
- **`verbatimModuleSyntax: true`** — use `import type { X }` for type-only imports
- **`import { Router } from 'express'`** — Express v5 uses `import` syntax
- **`ws` package** needed in server for WebSocket (installed separately)

## Export rules

- MSE: shape codes POINT/CONE/BOX/SPHERE/DISC, colors 0-255 integer
- EFF: blend 0=alpha/1=add/2=modulate, rotType 0=NONE/2=SPIN/4=RANDOM
- MDE: GR2 reference + Bip01 bone attach + bounding radius
- CST mode: dirty=false preserves original formatting exactly
