# Metin2 Asset Studio

[![Live Demo](https://img.shields.io/badge/demo-github_pages-2ea44f?style=for-the-badge)](https://stewicekk.github.io/Metin2AssetStudio/)
[![Build](https://img.shields.io/github/actions/workflow/status/stewicekk/Metin2AssetStudio/deploy-pages.yml?style=for-the-badge)](https://github.com/stewicekk/Metin2AssetStudio/actions)
[![Tests](https://img.shields.io/badge/tests-152%2F152%20MSE%20%7C%202000%2F2000%20fuzz-success?style=for-the-badge)](https://github.com/stewicekk/Metin2AssetStudio/actions)

Editor, previewer, and exporter for Metin2 particle effect files (MSE, EFF, MDE).

**Live:** [stewicekk.github.io/Metin2AssetStudio](https://stewicekk.github.io/Metin2AssetStudio/)

## One-click deploy

| Platform | Type | Button |
|---|---|---|
| **Render** (recommended) | Fullstack (frontend + backend + WebSocket) | [![Deploy to Render](https://img.shields.io/badge/Deploy%20to%20Render-46E3B7?style=for-the-badge&logo=render)](https://render.com/deploy?repo=https://github.com/stewicekk/Metin2AssetStudio) |
| **Vercel** | Frontend only (static SPA) | [![Deploy to Vercel](https://img.shields.io/badge/Deploy%20to%20Vercel-000?style=for-the-badge&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/stewicekk/Metin2AssetStudio) |

## Features

- **MSE editor** — full property editing, ColorKey, CurveEditor, presets
- **3D preview** — real-time particle simulation with Three.js (GPU instanced)
- **Mesh rendering** — non-uniform size, velocity stretch
- **Lossless CST mode** — preserves original formatting when editing
- **Export** — MSE, EFF, MDE, JSON, Archive ZIP
- **i18n** — English, Čeština
- **Plugin system** — extensible export/transform/import
- **Profiling** — FPS, frame time, VRAM, draw calls
- **Web Worker** — non-blocking background parsing
- **Electron desktop** — Windows/Linux/macOS installers
- **PWA** — installable, offline-capable
- **Dark/Neon/Crimson/Emerald/Light** themes

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
