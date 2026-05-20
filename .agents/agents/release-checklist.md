# Metin2 Asset Studio — Release Checklist

## Pre-Release Validation
- [ ] `npm run build` — TypeScript + Vite build passes
- [ ] `npm test` — all 660+ MSE tests pass
- [ ] `npm run lint` — no ESLint errors
- [ ] Vite dev server starts on :5173
- [ ] No console errors in browser dev tools

## Core Functionality
- [ ] App loads with default FireBall_Main emitter
- [ ] Viewport shows grid + axes + particles rendering
- [ ] Play/Pause/Stop controls work
- [ ] Timeline slider scrubs through time
- [ ] Auto-cycle toggles correctly

## Emitter Management
- [ ] Add new emitter creates with default values
- [ ] Duplicate emitter creates independent copy
- [ ] Delete emitter removes correctly
- [ ] Move Up/Down reorders emitters
- [ ] Randomize generates random properties
- [ ] Copy/Paste between emitters
- [ ] Click on emitter row selects it
- [ ] Visibility toggle hides/shows in viewport

## Property Editor (PropsPanel)
- [ ] All 7 sections expand/collapse
- [ ] Name field updates store
- [ ] Blend type (add/alpha/modulate) updates viewport
- [ ] Spawn shape changes affect particles
- [ ] Rate/life/burst numeric inputs work
- [ ] Speed/spread/yaw/pitch physics inputs work
- [ ] Gravity/wind/drag updates particle behavior
- [ ] Size ±Rnd inputs update scale
- [ ] Texture type changes sprite appearance
- [ ] Sheet cols/rows update sprite slicing
- [ ] UV anim mode changes frame behavior
- [ ] Size curve reset/flat works
- [ ] Alpha curve reset/flat works
- [ ] Color key presets apply correctly
- [ ] Color key gradient preview renders

## Presets
- [ ] All 8 categories display
- [ ] Presets apply to selected emitter
- [ ] Preset creates new emitter if none selected
- [ ] Search filters by name and category
- [ ] All 70+ presets produce visible particle effects

## Scene Settings
- [ ] 5 themes switch correctly (dark/neon/crimson/emerald/light)
- [ ] High precision export toggle works
- [ ] Auto-play toggle works
- [ ] Export precision selector works

## 3D Viewport
- [ ] Orbit (RMB drag) rotates camera
- [ ] Pan (MMB drag) moves target
- [ ] Scroll zoom works
- [ ] Grid and axes visible
- [ ] FPS counter updates
- [ ] Particle count displays
- [ ] Particles render with correct blending
- [ ] Seeded RNG gives deterministic playback
- [ ] Camera reset restores initial position

## Import/Export
- [ ] Import .mse file creates emitters in store
- [ ] Imported emitter parameters show in PropsPanel
- [ ] Imported effects render in viewport
- [ ] Export .mse produces correct format
- [ ] Export .eff produces correct format
- [ ] Export .mde produces correct format
- [ ] Copy to clipboard works
- [ ] Download file works
- [ ] Export modal shows correctly

## Keyboard Shortcuts
- [ ] Space: Play/Pause
- [ ] Ctrl+D: Duplicate emitter
- [ ] Ctrl+S: Save (export .mse)
- [ ] Ctrl+C: Copy emitter
- [ ] Ctrl+V: Paste emitter
- [ ] Delete: Remove emitter

## Error Handling
- [ ] Error boundaries catch component crashes
- [ ] Import of invalid .mse shows error toast
- [ ] Empty state shows "No emitter selected"
- [ ] Missing texture falls back to circle texture

## Dependency & Validation
- [ ] Dependency graph shows imported file dependencies
- [ ] Validation panel reports emitter issues
- [ ] AST node graph renders with correct nodes/links
- [ ] Graph nodes are draggable
- [ ] Clicking graph node selects emitter

## Export Format Verification
- [ ] MSE export matches `website.html` reference format
- [ ] EFF export matches `website.html` reference format (lines ~2441-2600+)
- [ ] MDE export matches reference format
- [ ] Color keyframes use 0-255 integer range
- [ ] Curves sorted by time in export
- [ ] Shape codes map correctly (POINT/CONE/BOX/SPHERE/DISC)
