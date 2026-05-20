---
name: build-test
description: "Build pipeline, test infrastructure, TypeScript configuration, and linting for Metin2 Asset Studio. Use when setting up builds, running tests, fixing TypeScript errors, or configuring the development environment."
allowed-tools: "Bash(belt *), Read, Write, Edit, Grep, Glob"
---

# Build & Test Skill

## Pipeline Commands

| from | command | what |
|---|---|---|
| `server/` | `powershell -File start-pipeline.ps1` | Production mode: build + serve on :3000 |
| `server/` | `powershell -File start-pipeline.ps1 -dev` | Dev mode: frontend :5173 + backend :3000 |
| `server/` | `powershell -File start-pipeline.ps1 -rebuild` | Force rebuild then production serve |
| `server/` | `npm start` | Express server on :3000 (requires `frontend/dist/`) |

## Commands (from `frontend/`)

| Command | Action | Notes |
|---------|--------|-------|
| `npm run dev` | Vite dev server | Port 5173, hot reload |
| `npm run build` | `tsc -b && vite build` | **Must run after every change** |
| `npm test` | `tsx test-runner.js` | Parses 660+ .mse fixtures |
| `npm run lint` | `eslint .` | Flat config, TS + React hooks |
| `npm run preview` | Vite preview server | Serves `dist/` |

## Build Pipeline
- `tsc -b` uses project references (`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`)
- No separate `typecheck` command — the build runs `tsc -b` automatically
- TypeScript errors are reported BEFORE vite build starts
- **Always check `tsc` output** — vite build may succeed even with TS errors if the error is in a file not imported

## TypeScript Configuration (`tsconfig.app.json`)

### Strict Rules
```json
{
  "verbatimModuleSyntax": true,    // use 'import type { X }' for type-only imports
  "erasableSyntaxOnly": true,      // no 'enum', no 'namespace', no parameter properties
  "noUnusedLocals": true,          // remove unused variables before build
  "noUnusedParameters": true,      // prefix unused params with _ or remove
  "noFallthroughCasesInSwitch": true,
  "moduleResolution": "bundler",
  "allowImportingTsExtensions": true,
  "noEmit": true                   // tsc only checks types, vite emits
}
```

### Exclusions
- `exclude: ["src/core/testParser.ts"]` — legacy test file, excluded from main compilation

### TS Version
- TypeScript 6.0.2 — use latest syntax features
- Target: `es2023`

## Test Runner (`test-runner.js`)
- Uses `tsx` to run TypeScript directly (not vitest, not jest)
- Tests all 660+ `.mse` files in `public/analyze-mse/`
- For each file: `parseMSE(content)` → `exportMSE(ast)` → check diagnostics
- Result: `660 passed, 0 failed`
- No test framework — just a Node.js script with `fs`

## Vite Configuration (`vite.config.ts`)
- Plugin: `@vitejs/plugin-react` only
- Build output: `dist/`
- PostCSS with Tailwind 4 + autoprefixer

## Dependencies
- React 19.2, Three.js 0.184, Zustand 5.0
- **Three.js `MultiplyBlending`** deprecated in r152+ but still exists in 0.184
- Tailwind CSS 4.3 with PostCSS

## Code Conventions
- **No placeholder code** — all code must be production quality
- **No emoji in code** — can use in comments/docs
- ESLint: `@eslint/js` recommended + `typescript-eslint` recommended + `react-hooks` + `react-refresh`
- CSS: CSS custom properties for theming, no inline styles where possible
- Component files: PascalCase `.tsx`
- Utility files: camelCase `.ts`
- `@types/three` version must match `three` version (0.184.x)

## Known Gotchas
- **Build fails on unused imports**: `noUnusedLocals: true` catches them
- **Build fails on unused params**: prefix with `_` if intentionally unused
- **Import assertions**: Use `import type` for types, regular `import` for values
- **Test file exclusion**: `src/core/testParser.ts` is excluded from app tsconfig — if you need to import from it, add it to include or use a separate config
- **Chunk size warning**: 797kB JS is expected (Three.js is large) — ignore unless > 1MB
