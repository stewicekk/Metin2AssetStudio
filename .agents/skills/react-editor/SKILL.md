---
name: react-editor
description: "Metin2 Asset Studio React editor component architecture: Zustand store patterns, component tree, tab system, presets, property editors, error boundaries. Use when working on the editor UI, store state management, or component rendering."
allowed-tools: "Bash(belt *), Read, Write, Edit, Grep, Glob"
---

# React Editor Skill

## Component Tree
```
App
├── EmitterList           — action bar (duplicate/delete/move/copy/paste/randomize) + emitter rows
├── PropsPanel            — 7 collapsible sections (Emitter, Physics, Size, Advanced, Texture, Curves, Color Keys)
├── PresetsPanel          — 70+ presets in 8 categories, search
├── SceneSettings         — 5 themes + expert settings (precision, auto-play)
├── Viewport              — mounts RendererHost (useEffect [], cleanup disposes)
├── TimelinePanel         — play/pause/stop + slider + MSE/EFF/MDE export
├── ValidationPanel       — validateProject(emitters, importedEffects)
├── DependencyPanel       — buildDependencyGraph from imported MSE
├── GraphPanel            — AST node graph with SVG connection lines + drag/drop
└── ErrorBoundary         — class-based, wraps Viewport/PropsPanel/GraphPanel
```

## Store — Zustand Anti-Patterns

### CRITICAL: Never subscribe to the full store
```typescript
// WRONG — subscribes to ALL state, 60fps globalTime updates re-render everything
const { emitters, globalTime } = useAppStore();

// CORRECT — subscribe only to what you need
const emitters = useAppStore(s => s.emitters);
```

### Never mutate state directly
```typescript
// WRONG — bypasses React reconciliation
state.emitters.push(newEmitter);

// CORRECT — use store actions
addEmitterFromTemplate(name, updates);
```

### Store actions are stable
- Functions returned by `create()` are stable across renders
- Safe to use in `useEffect` deps or `useCallback` deps
- Destructuring individual selectors is fine

### Animation loop store access
- `RendererHost` reads store via `useAppStore.getState()` (no subscription)
- `setGlobalTime()` called 60fps from rAF — this is OK only for TimelinePanel

## PropsPanel Editor Sections
Each section is a `<Section>` wrapper with collapsible toggle:
1. **Emitter** — name, blend, shape, rate, burst, life, maxP, loop/cycle, delay
2. **Physics** — speed, spread, yaw/pitch, gravity, wind, drag, spin, init rot, vel stretch
3. **Size** — init scale ±Rnd, non-uniform Y
4. **Advanced** — coord type, rotation type, UV scroll, shape radius, ground bounce, attractor, emit surface, color mod
5. **Texture** — built-in type, sheet cols/rows, UV anim mode, FPS, tex path
6. **Curves** — size/alpha/speed/spin curve editors with Reset/Flat buttons
7. **Color Keys** — gradient preview + presets (Fire/Ice/Lightning/Blood)

- `handleNumber(field, value)` — parse float, NaN-safe
- `handleChange(field, value)` — non-numeric fields

## PresetsPanel
- 70+ presets across 8 categories: COMBAT, MAGIC, ENVIRONMENT, BUFF, WEAPON, SKILLS, ARMOR, SPECIAL
- Each preset defined as `Partial<Emitter>` with values for all physics/visual params
- Search filters by name or category
- If no emitter selected, creates new from preset

## EmitterList Action Bar
- Duplicate (Ctrl+D), Delete (Delete), Move Up/Down, Randomize, Copy (Ctrl+C), Paste (Ctrl+V)
- Uses `handlePaste` → `useAppStore.getState().addEmitterFromTemplate()` (must call getState() directly to avoid stale closure)

## Error Boundaries
- `ErrorBoundary` wraps: Viewport, GraphPanel, ValidationPanel, DependencyPanel, PropsPanel, PresetsPanel, SceneSettings
- Prevents single component crash from killing entire app

## Key Files
- `src/App.tsx` — shell layout, keyboard shortcuts, export modal
- `src/store/useAppStore.ts` — all state + actions
- `src/components/*.tsx` — all React components
- `src/editor/nodeGraph/model.ts` — buildEffectGraph
- `src/editor/validation/validateProject.ts`
- `src/styles/variables.css` — CSS custom properties for theming
- `src/styles/layout.css` — layout, form, button, panel classes
- `src/App.css` — component-specific styles

## Known Gotchas
- **GraphPanel infinite loop**: `buildEffectGraph()` creates new arrays → compare `.length` not reference
- **StrictMode double-effects**: Viewport's RendererHost created twice → cleanup disposes old
- **useEffect deps on settings**: `settings` is a new object each render → `settings.autoPlay` primitive value is stable
- **Keyboard handler**: uses `useAppStore.getState()` to read current state (not stale closure)
- **Export modal**: checks `exportModal?.open` — `null?.open` is undefined (falsy), `{open:true}?.open` is true
