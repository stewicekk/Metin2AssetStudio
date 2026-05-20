---
name: metin2-core
description: "Metin2 file format expertise: MSE particle system text format, EFF (CEffectData), MDE (CEffectMesh). Full knowledge of parser, exporter, and asset pipeline. Use when working with any Metin2 particle effect source files, format conversion, or import/export logic."
allowed-tools: "Bash(belt *), Read, Write, Edit, Grep, Glob"
---

# Metin2 Core Format Skill

## MSE Format — Metin2 Particle System Text Format

### Structure
```
EffectName    "MyEffect"
ParticleSystemCount    1

StartParticleSystem
    SystemName    "Fire_Main"
    BirthRate     60.0
    MaxParticleCount    512
    ...
    ColorKeyframeCount    3
    ColorKeyframe    0.0000    255    255    255    255
    ...
EndParticleSystem
```

### Parser (`src/core/mseParser.ts`)
- Recursive descent parser for Metin2's custom block-based text format
- Block types: `Root`, `Group`, `List`, `Property`, `Row`, `Comment`, `Blank`
- Uses `{`/`}` block delimiters, inline `{` also supported
- Lines starting with `//` or `#` are comments
- Quoted strings (double quotes) preserve spaces
- Extracts dependencies from file paths (.mde/.gr2/.dds/.tga/.bmp/.png/.jpg)
- Assigns stable AST IDs via `assignStableIds()` — path-based like `root/Group:EmitterProperty:0/Property:MaxEmissionCount:0`
- Use `findChild(node, type, name)` and `readNumberProperty(node, name, fallback)` for MSE tree traversal
- `readListNumber(node, listName, fallback)` reads the last value from the first Row in a List

### Exporter (`src/utils/mseExporter.ts`)
- `buildMSE(emitters: Emitter[], options)` — produces 1:1 MSE text matching official format
- Options: `precision` (decimal places), `effectName`
- Properties organized by: system header → rate/life → spawn shape → physics → size/rot → blend/tex → curves → color keys
- Color keyframes use 0-255 integer range for r/g/b/a
- Curves are time-value pairs, sorted by time
- Shape mapping: `point→POINT, cone→CONE, box→BOX, sphere→SPHERE, spherevol→SPHERE, ring→DISC, disc→DISC`

### EFF Format — CEffectData (`src/utils/exporter.ts`)
- `buildEFF(emitters, options)` — wraps emitters in `CEffectData { CParticleSystemData { ... } }`
- Same parameter structure as MSE but with C++ brace syntax
- Blend codes: 1=add, 2=modulate, 0=alpha
- Rotation types: 0=NONE, 2=SPIN, 4=RANDOM
- Anim types: 1=loop, 2=once, 3=rand

### MDE Format — CEffectMesh (`src/utils/exporter.ts`)
- `buildMDE(emitters, options)` — wraps in `CEffectMesh { CMeshGroup { ... } }`
- References `.gr2` mesh files for each emitter
- Computes bounding radius from max speed × max life

### Asset Pipeline (`src/utils/assetManager.ts`)
- `AssetManager.importMseFile(file)` — parse .mse → create emitters in store
- `AssetManager.exportCurrentProject()` — save all emitters as .mse
- `AssetManager.exportImportedRaw(effectId)` — re-export raw parsed data
- Uses `groupToEmitter()` to map MSE `Group Particle` blocks to `Emitter` objects
- Call `useAppStore.getState().actions....` directly (not in React render)

## Key Files
- `src/core/mseParser.ts` — parser + exporter
- `src/utils/mseExporter.ts` — clean 1:1 MSE export
- `src/utils/exporter.ts` — EFF + MDE export + download/clipboard utils
- `src/utils/assetManager.ts` — import/export orchestration
- `src/types/index.ts` — Emitter, Particle, CurvePoint, ColorKey types
- `frontend/public/analyze-mse/` — 660+ MSE fixture files for regression

## Testing
- Test runner at `test-runner.js` parses and re-exports every `.mse` in `public/analyze-mse/`
- Run: `npm test` from `frontend/`
- Uses `tsx` to run TS directly (no vitest/jest)
