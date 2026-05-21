# Metin2 Asset Studio

[![Live Demo](https://img.shields.io/badge/demo-github_pages-2ea44f?style=for-the-badge)](https://stewicekk.github.io/Metin2AssetStudio/)
[![Build](https://img.shields.io/github/actions/workflow/status/stewicekk/Metin2AssetStudio/deploy-pages.yml?style=for-the-badge)](https://github.com/stewicekk/Metin2AssetStudio/actions)
[![Tests](https://img.shields.io/badge/tests-152%2F152%20MSE%20%7C%202000%2F2000%20fuzz-success?style=for-the-badge)](https://github.com/stewicekk/Metin2AssetStudio/actions)
[![Release](https://img.shields.io/github/v/release/stewicekk/Metin2AssetStudio?style=for-the-badge&color=blue)](https://github.com/stewicekk/Metin2AssetStudio/releases)

Editor, previewer, and exporter for Metin2 particle effect files (MSE, EFF, MDE).

**Live:** [stewicekk.github.io/Metin2AssetStudio](https://stewicekk.github.io/Metin2AssetStudio/)

## One-click deploy

| Platform | Type | Setup |
|---|---|---|
| **Render** (recommended) | Fullstack (frontend + backend + WebSocket) | Click the button → connect GitHub → done |
| **Vercel** | Frontend only (static SPA) | Click the button → connect GitHub → done |
| **GitHub Pages** | Frontend only (static SPA) | Already live — auto-deploys on push |

[![Deploy to Render](https://img.shields.io/badge/Deploy%20to%20Render-46E3B7?style=for-the-badge&logo=render)](https://render.com/deploy?repo=https://github.com/stewicekk/Metin2AssetStudio)
[![Deploy to Vercel](https://img.shields.io/badge/Deploy%20to%20Vercel-000?style=for-the-badge&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/stewicekk/Metin2AssetStudio)

> After Render deploy, set the `RENDER_DEPLOY_HOOK_URL` secret in [GitHub repo Settings → Secrets → Actions](https://github.com/stewicekk/Metin2AssetStudio/settings/secrets/actions) to enable auto-deploy on every push.

## Features (v2.0.0)

### Core 3D
- **Alpha sorting** — particles sorted by camera distance for correct transparency
- **Bloom post-processing** — UnrealBloomPass with configurable intensity
- **Screenshot capture** — one-click PNG download of viewport
- **Bip01 character** — colored bone hierarchy (Pelvis → Spine → Neck → Head + limbs)
- **Fullscreen mode** — toggle viewport to fullscreen
- **Minimap** — top-down wireframe overview with emitter positions

### Emitter Editor
- **Curve drag interaction** — drag curve points with mouse, click to add, double-click to remove
- **Search & filter** — type to filter emitters by name
- **Batch select** — Ctrl+click multi-select, batch duplicate/delete/show/hide
- **Emitter grouping** — collapsible groups with batch assign/ungroup
- **Gizmo manipulation** — 3D translate/rotate/scale axes with drag interaction

### Pipeline
- **Server hardening** — rate limiting, CORS whitelist, Helmet security headers
- **File upload** — POST `/api/upload` for .mse/.mde/.eff/.json/.png/.dds/.tga
- **Gzip compression** — all API responses compressed
- **Profiling sparkline** — live FPS history chart (120 frames)

### General
- **Full property editing** — ColorKey editor, CurveEditor, 70+ presets
- **3D preview** — real-time GPU-instanced particle simulation
- **Export** — MSE, EFF, MDE, JSON formats
- **i18n** — English & Čeština (50+ UI strings)
- **5 themes** — Dark, Neon, Crimson, Emerald, Light
- **PWA** — installable, offline-capable
- **Electron desktop** — Windows/Linux/macOS native installers

## Quick start

```bash
# Frontend
cd frontend
npm install
npm run dev          # Vite dev server on :5173

# Tests
npm test             # 152 MSE roundtrip tests
npm run fuzz         # 2000 fuzz tests

# Build
npm run build        # tsc -b && vite build

# Server (fullstack)
cd ../server
npm install
npm start            # Express + WebSocket on :3000

# Desktop (Electron)
cd ../
npm run desktop      # Build + launch
```

## Repository

```
frontend/       — React + Three.js + Vite SPA
server/         — Express + WebSocket backend
electron/       — Electron desktop shell
backend/        — Python FastAPI (experimental)
.github/        — CI/CD workflows
```

## License

MIT
