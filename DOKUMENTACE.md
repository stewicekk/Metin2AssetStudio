# Metin2 Asset Studio — Kompletní Dokumentace Projektu

> **Verze:** 1.1.0 · **Poslední aktualizace:** 20. května 2026

---

## 1. Přehled

Metin2 Asset Studio je web + desktop aplikace pro vytváření, editaci a export částicových efektů pro MMORPG **Metin2**. Nahrazuje původní desktopové nástroje (Python/PyQt6) moderním webovým rozhraním s realtime 3D náhledem, PWA offline podporou a plnou kompatibilitou s herními formáty (MSE, EFF, MDE).

**Klíčové vlastnosti:** 7 spawn shapes, 3 blend módy, gravity/wind/drag/bounce/turbulence/attractor fyzika, deterministická seeded RNG simulace, 5 témat, undo/redo (50-level), AST node graph, import 660+ reálných .mse souborů, Express produkční server na :3000, Electron desktop, CI/CD pipeline, PWA.

---

## 2. Aktuální Stav

### ✅ Hotovo
- **Build:** `npm run build` prochází (tsc -b + vite build, 829kB JS gzip 222kB)
- **Server:** Express server na :3000, SPA fallback, API endpointy
- **Pipeline:** `start-pipeline.ps1` pro produkci i dev mód (build + test + serve)
- **Testy:** 660+ MSE fixture souborů — 100% pass (`npm test`)

### 3D Runtime
- **RendererHost:** rAF smyčka (ne setAnimationLoop), clamped dt ≤ 0.05s, raw Three.js, ResizeObserver, WebGL context recovery, reusable Fog (žádná alokace per frame), cached Background Color, character wireframe (13 primitives), auto-spin, auto-cycle, grid/axis/floor/fog/ambient/FOV/Bloom, FPS overlay s perf badge
- **ParticleSimulation:** 7 spawn shapes (box, sphere, spherevol, ring, disc, cone s `*0.7` faktorem), gravity/wind/drag/bounce/turbulence/attractor fyzika, free-list slot alokátor (O(1) spawn/despawn místo O(n) find()), velStretch computation, curves (size/alpha/speed/spin), seeded RNG (LCG), point/cone/box/sphere/disc/ring/disc
- **ParticleRenderer:** THREE.Points + ShaderMaterial (AdditiveBlending, MultiplyBlending, NormalBlending), signature-based sync, sprite sheet UV, distance-based point sizing, velStretch rotation override, custom texture support (texDataUrl), proper GPU dispose
- **CameraController:** Spherical orbit (RMB), pan (MMB), zoom (scroll), 3 view presets (front/top/persp), pre-alokované Vector3 (žádné alokace v hot path)
- **TextureRegistry:** 6 built-in textur (circle, ring, spark, arrow, flame, star) + `resolveTexture(emitter)` pro načtení `texDataUrl`

### Store (useAppStore.ts)
- Všechny akce, cílené selectory, žádné přímé mutace
- Undo/Redo (50-level history s JSON deep clone snapshot)
- Project JSON export/import
- Export validation warnings (groundBounce, uvScroll, velStretch, windX/Z)
- Auto-save do localStorage (30s interval)
- Toast notifications pro save/export/validate/undo/redo

### UI Komponenty
- **App.tsx:** 5-tab sidebar (Emitters/Props/Presets/Scene/Library), viewport toolbar (play/pause/stop/cycle/warm-fill/camera presets/scale/MDE export/EFF export), drag & drop .mse import, project browser modal, toast overlay, error boundary
- **EmitterList:** Emitter list s color indikátory, add/remove/duplicate
- **PropertyEditor:** Všechny emitter properties organizované do sekcí
- **PresetsPanel:** 70+ built-in presetů
- **SceneSettings:** bg color, grid/axis/char/floor toggles, bone select, fog density, ambient color, FOV, bloom, 5 theme tiles, export precision, expert toggles, shortcut reference (včetně undo/redo)
- **LibraryPanel:** 10 community effect packs (Fireball, Explosion, Heal, Ice, Poison, Lightning, Shield, Blood, Aura, Spark)
- **TimelinePanel:** Visual emitter tracks s lifecycle bars, seek-by-click, playhead indikátor
- **GraphPanel:** AST visualization — opraven infinite loop (`useMemo` + `.length`)
- **ErrorBoundary:** Chrání všech 7 rizikových panelů

### Formáty
- **MSE parser/exporter:** Plně funkční roundtrip přes všech 660+ fixture souborů
- **EFF export:** CEffectData formát (CEffectData { CParticleSystemData { ... } })
- **MDE export:** CEffectMesh formát (CEffectMesh { CMeshGroup { ... } }) s GR2 referencemi
- **Precision control:** Export s nastavitelným počtem desetinných míst

### Infrastruktura
- **PWA:** manifest.json, SVG icon, VitePWA plugin s Workbox service worker (precache 9 entries)
- **IndexedDB:** `utils/projectDB.ts` — CRUD operace pro ukládání/načítání projektů
- **Electron:** `electron/main.js` s native menu (File/Edit/View/Help), IPC bridge, dev/prod mód, `electron/preload.js` context bridge, `electron/package.json` s electron-builder (Windows NSIS/Linux AppImage/macOS DMG)
- **CI/CD:** `.github/workflows/ci.yml` — build + test + electron build
- **Server API:** `/api/health`, `/api/fixtures`, `/api/fixtures/:name`, `/api/stats`, `/api/categories`, `/api/validate`, `/api/fixtures?search=`
- **AGENTS.md Projektový guide**
- **4 skill moduly + Master agent + release checklist**

### 🔄 Probíhá / Částečně
- **ColorKeyEditor:** Read-only vstupy — chybí přidání/odebrání key, drag
- **CurveEditor canvas:** Vykreslen, ale chybí vlastní kreslení křivek
- **nonUniformSize rendering:** Data se počítají v simulaci, ale point sprites nepodporují oddělené X/Y škálování

### ⏳ Budoucí fáze
- Mesh-based rendering pro velStretch a nonUniformSize
- WebAssembly GR2 parser
- Live-link s Metin2 klientem
- Node-based editor
- Unit testy

---

## 3. Architektura

```
App.tsx (shell)
├── LEFT: Sidebar (tabs: Emitters | Props | Presets | Scene | Library)
├── CENTER: Viewport (RendererHost) + TimelinePanel + toolbar
└── RIGHT: ValidationPanel + DependencyPanel + GraphPanel
```

**Data flow:** UI → `updateEmitter()` → Zustand → `RendererHost.animate()` → `getState()` → `ParticleRenderer.sync()` → `ParticleSimulation.updateRuntime()` → `writeAttributes()` → GPU

---

## 4. Technologie

| Technologie | Verze | Poznámka |
|---|---|---|
| React | 19.2.6 | StrictMode |
| TypeScript | 6.0.2 | `verbatimModuleSyntax`, `erasableSyntaxOnly` |
| Vite | 8.0.14 | Plugin: react, PWA |
| Three.js | 0.184.0 | Raw, ne R3F (MultiplyBlending existuje jen v této verzi) |
| Zustand | 5.0.13 | Single store |
| Tailwind CSS | 4.3 | PostCSS |
| Electron | ~33 | main.js + preload.js |
| Workbox | ~7 | Service worker (generateSW) |

---

## 5. Store — useAppStore.ts

Hlavní state: `settings`, `emitters[]`, `importedEffects[]`, `activeEmitterId`, `globalTime`, `playing`, `exportModal`, `undoStack[]`, `redoStack[]`

**Undo/Redo:** 50-level history — `_pushHistory()` snapshotuje emitters před každou mutací (JSON deep clone). Ctrl+Z = undo, Ctrl+Y / Ctrl+Shift+Z = redo.

**Export/Import:** `exportProjectToJSON()` — scene settings + emitters → JSON string. `importProjectFromJSON()` — parsuje a nahraje do store.

**Auto-save:** `autoSaveProject()` — ukládá do localStorage každých 30s (přes setInterval v App mount).

**Zlatá pravidla:**
1. Vždy `useAppStore(s => s.field)` — nikdy `useAppStore()` bez selectoru
2. Nikdy `state.emitters.push()` — vždy store akce
3. RendererHost čte přes `getState()` — žádná React subscription
4. Mutace emitters vždy přes `setState(s => { s.emitters = [...] })` — zajišťuje undo tracking

---

## 6. Three.js Runtime

### RendererHost
- rAF smyčka (bez `setAnimationLoop` — žádné double-render)
- `THREE.Timer` místo deprecated `THREE.Clock`, dt clamped ≤ 0.05s
- Reusable Fog (vytvořen jednou v constructoru, mění se jen `.far`)
- ResizeObserver pro dynamický viewport
- WebGL context lost/restore recovery
- Cached background color (hex → RGB jen při změně)
- Character wireframe (13 Cylinder/Sphere primitiv), auto-spin
- Grid 24×48, Axes, Floor, 3-point lighting, Bloom
- FPS overlay + particle count s performance badge

### ParticleSimulation
- **7 spawn shapes:** box, sphere, spherevol, ring, disc, cone, point
- **Free-list slot alokátor:** `freeSlots.pop()` = O(1) spawn/despawn místo O(n) `find()`
- **Fyzika:** gravity, windX/Z, drag, groundBounce s bounceFac + friction
- **Turbulence:** sinusové pertubace velocity (`sin(t*2.1)*turb`, `cos(t*1.7)*turb`)
- **Attractor:** pull k bodu (0, attractorY) s `attractorStr` silou
- **velStretch:** výpočet `stretchRot = atan2(vx, vz)` pro override rotace
- **Curves:** size, alpha, speed, spin — sampleCurve pro time-value interpolaci
- **Seeded RNG:** LCG `1664525 × state + 1013904223`, deterministická

### ParticleRenderer
- THREE.Points + ShaderMaterial s GLSL vertex/fragment shader
- 6 BufferAttribute: position, aSize, color (vertex), aAlpha, aFrame, aRot
- Blend módy: AdditiveBlending, MultiplyBlending, NormalBlending
- Signature-based hot-reload: `[maxP, blend, tex, sheetCols, sheetRows]`
- Custom texture via `texDataUrl` (TextureRegistry.resolveTexture)
- velStretch rotace: override particle.rot s particle.stretchRot
- Sprite sheet UV: loop/once/rand/life animace

### TextureRegistry
- 6 built-in canvas-generated textur: circle, ring, spark, arrow, flame, star
- `resolveTexture(emitter)`: načte texDataUrl → Image → Texture, fallback na builtin
- Cache + dispose support

### CameraController
- Spherical orbit (RMB drag): phi/theta/radius
- Pan (MMB drag): pre-alokované Vector3 (žádné alokace v hot path)
- Zoom (scroll wheel): clamp 0.3–500
- View presets: front, top, persp

---

## 7. Export Formáty

### MSE — Metin2 Particle System Text
- Struktura: `EffectName` → `ParticleSystemCount` → `StartParticleSystem`/`EndParticleSystem`
- Všechny vlastnosti včetně turb, attractor, velStretch, uvScroll
- Shape kódy: POINT/CONE/BOX/SPHERE/DISC
- Barvy: 0-255 integer range
- 1:1 s website.html referencí (lines 2441-2633)

### EFF — CEffectData
- `CEffectData { CParticleSystemData { ... } }`
- Blend: 0=alpha, 1=add, 2=modulate
- RotType: 0=NONE, 2=SPIN, 4=RANDOM

### MDE — CEffectMesh
- `CEffectMesh { CMeshGroup { ... } }`
- Reference .gr2 mesh files + Bip01 bone attach
- BoundingRadius computed z max speed × max life

---

## 8. Undo/Redo a Toast

### Undo/Redo System
- **50-level history:** `undoStack` a `redoStack` v store
- **Snapshot:** `JSON.parse(JSON.stringify(emitters))` před každou mutací
- **Trigger:** libovolná store akce, která mění emitters, volá `_pushHistory()`
- **Shortcuts:** Ctrl+Z = undo, Ctrl+Y / Ctrl+Shift+Z = redo
- **Indikace:** Toast notifikace při každém undo/redo

### Toast System (`utils/toast.ts`)
- **4 typy:** info, success, warn, error
- **CSS animace:** `.toast-enter` (slide-in zespodu) + `.toast-exit` (fade-out)
- **Deduplikace:** stejná zpráva se neukládá dvakrát
- **Auto-dismiss:** 3s (info/success), 5s (warn/error)
- **Integrace:** všechny store akce (save/export/validate/undo/redo) + import chyb

---

## 9. PWA, Electron a CI/CD

### PWA
- manifest.json (name, icons, display: standalone, theme_color)
- SVG icon (512×512, all-sizes)
- VitePWA plugin s generateSW (Workbox)
- Service worker: precache 9 entries (854 KiB)

### Electron
- **main.js:** BrowserWindow, native menu (File/Edit/View/Help), IPC pro save/load dialog
- **preload.js:** contextBridge pro bezpečný přístup k file system API
- **Dev mód:** načítá `localhost:5173` (Vite dev server)
- **Prod mód:** načítá `frontend/dist/index.html`
- **Build:** electron-builder s NSIS (Windows), AppImage (Linux), DMG (macOS)

### CI/CD (GitHub Actions)
- **Spouštěč:** push/PR na main
- **OS:** windows-latest
- **Kroky:** checkout → Node setup → npm ci → build → test → electron build
- **Artifacts:** Windows installer (.exe)

---

## 10. Testování

```bash
cd frontend
npm test    # tsx test-runner.js → 660+ .mse roundtrip testů

# Test runner parsuje každý .mse, re-exportuje, porovnává vlastnosti
```

---

## 11. Příkazy

```bash
# Frontend
cd frontend
npm run dev       # Vývojový server :5173
npm run build     # tsc -b && vite build (včetně PWA generování)
npm test          # 660+ MSE roundtrip testů
npm run lint      # ESLint flat config
npm run preview   # Preview dist/

# Pipeline (z root/server/)
cd server
powershell -File start-pipeline.ps1          # Produkce (build + :3000)
powershell -File start-pipeline.ps1 -dev     # Dev mód (:5173 + :3000)
powershell -File start-pipeline.ps1 -rebuild # Force rebuild
npm start                                     # Server na :3000

# Root
npm run dev       # Vite dev server :5173
npm run build     # tsc -b + vite build
npm test          # 660+ fixture testů
npm run server    # Express production server :3000
npm run pipeline  # Build + test + serve
npm run electron  # Launch Electron desktop
npm run electron:build  # Build Windows installer
npm run desktop   # Build frontend + launch Electron
```

---

## 12. Server API

### Express Server (`server/index.js`)
- **Port:** 3000
- **Static:** `frontend/dist/`
- **SPA fallback:** všechny cesty → `index.html`

### API Endpointy
| Endpoint | Metoda | Popis |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/fixtures` | GET | Seznam všech MSE fixture souborů |
| `/api/fixtures/:name` | GET | Obsah konkrétního fixture |
| `/api/stats` | GET | Statistiky (počet souborů, kategorií) |
| `/api/categories` | GET | Seznam kategorií |
| `/api/validate` | GET | Validační report |
| `/api/fixtures?search=` | GET | Fulltextové vyhledávání |

---

## 13. Klávesové Zkratky

| Zkratka | Akce |
|---|---|
| `Space` | Play/Pause |
| `W` | Warm-start (restart fill) |
| `R` | Reset emitters |
| `F1` | Camera preset Front |
| `F2` | Camera preset Top |
| `F3` | Camera preset Perspective |
| `A` | Toggle auto-cycle |
| `C` | Toggle character |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+D` | Duplicate emitter |
| `Ctrl+S` | Save project (IndexedDB) |
| `Ctrl+V` | Validate for export |
| `Delete` | Remove emitter |

---

## 14. Release Checklist

- [ ] `npm run build` prochází
- [ ] `npm test` — 660+ OK
- [ ] Viewport renderuje částice (FireBall_Main default)
- [ ] Undo/redo funguje (Ctrl+Z/Y)
- [ ] Toast notifikace pro save/export/validate/undo
- [ ] Drag & drop .mse import
- [ ] Project browser (Save/Load IndexedDB)
- [ ] Timeline visual tracks
- [ ] Import/export MSE/EFF/MDE — 1:1 s website.html
- [ ] 70+ presetů funguje
- [ ] Theme switching (5 témat)
- [ ] PWA installable (manifest + service worker)
- [ ] Electron desktop app launch
- [ ] Express server na :3000
- [ ] Keyboard shortcuts
- [ ] ErrorBoundary chrání všechny panely
