import { create } from 'zustand';
import type { MSEDocument } from '../core/mseParser';
import type { AppSettings, Dependency, Emitter, MseEffect } from '../types/index';
import { setLocale } from '../i18n';

interface ExportValidationIssue {
  type: 'error' | 'warning' | 'info';
  emitter: string;
  message: string;
}

interface ProjectData {
  version: string;
  name: string;
  timestamp: string;
  settings: AppSettings;
  emitters: Emitter[];
  scene: {
    vpScale: number;
    sceneBg: string;
    showGrid: boolean;
    showAxis: boolean;
    showChar: boolean;
    charSpin: boolean;
    envBone: string;
    envFog: boolean;
    envFogDensity: number;
    envAmbient: string;
    envFov: number;
    envBloom: boolean;
    envFloor: boolean;
    envCharVisible: boolean;
    gizmoEnabled: boolean;
    gizmoTarget: { x: number; y: number; z: number };
    gizmoMode: string;
  };
}

interface AppState {
  settings: AppSettings;
  emitters: Emitter[];
  importedEffects: MseEffect[];
  activeEmitterId: number | null;
  activeEffectId: number | null;
  globalTime: number;
  playing: boolean;
  activeCurve: 'size' | 'alpha' | 'speed' | 'spin';
  curveInterp: 'linear' | 'smooth';
  curveDragIdx: number | null;
  autoSpinAngle: number;
  importedMesh: number[][] | null;
  importedMeshName: string | null;
  autoCycle: boolean;
  autoCycleTimer: number;
  copiedEmitter: Emitter | null;
  _uidCounter: number;
  _undoStack: Emitter[][];
  _redoStack: Emitter[][];
  _lastHistoryTime: number;
  exportEffectName: string;
  exportEffectPath: string;
  exportModal: { open: boolean; title: string; content: string; ext: string } | null;

  vpScale: number;
  sceneBg: string;
  showGrid: boolean;
  showAxis: boolean;
  showChar: boolean;
  charSpin: boolean;
  envBone: string;
  envFog: boolean;
  envFogDensity: number;
  envAmbient: string;
  envFov: number;
  envBloom: boolean;
  envFloor: boolean;
  envCharVisible: boolean;

  gizmoEnabled: boolean;
  gizmoTarget: { x: number; y: number; z: number };
  gizmoMode: 'translate' | 'rotate' | 'scale';

  setSettings: (newSettings: Partial<AppSettings>) => void;
  resetProject: () => void;
  addEmitter: (name?: string) => void;
  addEmitterFromTemplate: (name: string, updates: Partial<Emitter>) => void;
  importMse: (name: string, rawData: MSEDocument, dependencies: Dependency[]) => void;
  duplicateEmitter: (id: number) => void;
  deleteEmitter: (id: number) => void;
  deleteEffect: (id: number) => void;
  selectEmitter: (id: number | null) => void;
  selectEffect: (id: number | null) => void;
  applyPreset: (emitterId: number, presetEffect: { e: Partial<Emitter> }) => void;
  updateEmitter: (id: number, updates: Partial<Emitter>) => void;
  batchGroupEmitters: (ids: number[], groupName: string) => void;
  setGroup: (id: number, groupName: string) => void;
  batchUpdateEmitters: (updates: Array<{ id: number; updates: Partial<Emitter> }>) => void;
  setPlaying: (value: boolean) => void;
  setGlobalTime: (time: number) => void;
  setActiveCurve: (curve: 'size' | 'alpha' | 'speed' | 'spin') => void;
  setCurveInterp: (interp: 'linear' | 'smooth') => void;
  setCurveDragIdx: (idx: number | null) => void;
  setAutoSpinAngle: (angle: number) => void;
  setImportedMesh: (mesh: number[][] | null, name: string | null) => void;
  setAutoCycle: (value: boolean) => void;
  setCopiedEmitter: (emitter: Emitter | null) => void;
  setExportEffectName: (name: string) => void;
  setExportEffectPath: (path: string) => void;
  setExportModal: (modal: { open: boolean; title: string; content: string; ext: string } | null) => void;
  moveEmitterUp: (id: number) => void;
  moveEmitterDown: (id: number) => void;
  randomizeEmitter: (id: number) => void;
  setVpScale: (v: number) => void;
  setSceneBg: (v: string) => void;
  setShowGrid: (v: boolean) => void;
  setShowAxis: (v: boolean) => void;
  setShowChar: (v: boolean) => void;
  setCharSpin: (v: boolean) => void;
  setEnvBone: (v: string) => void;
  setEnvFog: (v: boolean) => void;
  setEnvFogDensity: (v: number) => void;
  setEnvAmbient: (v: string) => void;
  setEnvFov: (v: number) => void;
  setEnvBloom: (v: boolean) => void;
  setEnvFloor: (v: boolean) => void;
  setEnvCharVisible: (v: boolean) => void;
  setGizmoEnabled: (v: boolean) => void;
  setGizmoTarget: (v: { x: number; y: number; z: number }) => void;
  setGizmoMode: (v: 'translate' | 'rotate' | 'scale') => void;
  setAutoCycleTimer: (v: number) => void;
  exportProjectToJSON: () => string;
  importProjectFromJSON: (json: string) => boolean;
  validateForExport: () => ExportValidationIssue[];
  autoSaveProject: () => void;
  loadAutoSavedProject: () => boolean;
  undo: () => void;
  redo: () => void;
  _pushHistory: () => void;
}

function hueColor(h: number): string {
  h = ((h % 360) + 360) % 360;
  return `hsl(${h},68%,54%)`;
}

const initialSettings: AppSettings = {
  theme: 'dark',
  showPerf: true,
  showDebug: true,
  particleDebug: false,
  autoPlay: true,
  hiPrec: false,
  exportPrec: 4,
  language: 'en',
};

function createEmitterTemplate(uid: number, name?: string): Emitter {
  const newEmitter: Emitter = {
    uid: uid,
    name: name || ('Emitter_' + uid),
    visible: true,
    color: hueColor(uid * 47),

    blend: 'add',
    shape: 'point',

    rate: 60, burst: 0, life: 1.2, lifeRnd: 0.3, maxP: 512,
    loop: 1, cycle: 2.0, delay: 0,

    speed: 4.0, speedRnd: 1.0, spread: 20, dirYaw: 0, dirPitch: 80,
    gravity: -6, windX: 0, windZ: 0, drag: 0, turb: 0, turbFreq: 1.0,

    sizeX: 1.0, sizeRnd: 0.2, sizeY: 1.0, sizeNonUniform: false,
    spin: 0, spinRnd: 0, initRot: 0, initRotRnd: 180,
    velStretch: 0,

    builtinTex: 'circle', texFile: null, texDataUrl: null, texPath: '',
    sheetCols: 1, sheetRows: 1, uvAnim: 'loop', animFPS: 12,

    coordType: 'WORLD', rotType: 'RANDOM',
    uvScrollX: 0, uvScrollY: 0,
    shapeRadius: 0.35,
    groundBounce: false, bounceFac: 0.4,
    attractorStr: 0, attractorY: 0.5,
    emitSurface: 'none', colorMod: 'multiply',

    sizeCurve: [{ t: 0, v: 1 }, { t: 0.5, v: 1 }, { t: 1, v: 0.2 }],
    alphaCurve: [{ t: 0, v: 1 }, { t: 0.8, v: 0.9 }, { t: 1, v: 0 }],
    speedCurve: [{ t: 0, v: 1 }, { t: 1, v: 1 }],
    spinCurve: [{ t: 0, v: 1 }, { t: 1, v: 1 }],
    colorKeys: [{ t: 0, r: 1, g: 1, b: 1, a: 1 }, { t: 1, r: 0.2, g: 0.1, b: 0.05, a: 0 }],
  };
  return newEmitter;
}

const MAX_UNDO = 50;
const LAZY_HISTORY_THRESHOLD_MS = 500;
const AUTOSAVE_DEBOUNCE_MS = 30000;

function cloneEmitters(emitters: Emitter[]): Emitter[] {
  return JSON.parse(JSON.stringify(emitters));
}

let _autosaveTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedAutoSave(get: () => AppState): void {
  if (_autosaveTimer) return;
  _autosaveTimer = setTimeout(() => {
    _autosaveTimer = null;
    try {
      const state = get() as AppState;
      const projectData: ProjectData = {
        version: '1.0.0',
        name: state.exportEffectName,
        timestamp: new Date().toISOString(),
        settings: state.settings,
        emitters: state.emitters,
        scene: {
          vpScale: state.vpScale,
          sceneBg: state.sceneBg,
          showGrid: state.showGrid,
          showAxis: state.showAxis,
          showChar: state.showChar,
          charSpin: state.charSpin,
          envBone: state.envBone,
          envFog: state.envFog,
          envFogDensity: state.envFogDensity,
          envAmbient: state.envAmbient,
          envFov: state.envFov,
          envBloom: state.envBloom,
          envFloor: state.envFloor,
          envCharVisible: state.envCharVisible,
          gizmoEnabled: state.gizmoEnabled,
          gizmoTarget: state.gizmoTarget,
          gizmoMode: state.gizmoMode,
        },
      };
      localStorage.setItem('metin2_asset_studio_autosave', JSON.stringify(projectData));
    } catch (e) {
      console.warn('Auto-save failed:', e);
    }
  }, AUTOSAVE_DEBOUNCE_MS);
}

export function shallowEmitterArrays(a: Emitter[], b: Emitter[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].uid !== b[i].uid) return false;
    if (a[i].name !== b[i].name) return false;
    if (a[i].visible !== b[i].visible) return false;
    if (a[i].rate !== b[i].rate) return false;
    if (a[i].life !== b[i].life) return false;
    if (a[i].maxP !== b[i].maxP) return false;
  }
  return true;
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: initialSettings,
  emitters: [],
  importedEffects: [],
  activeEmitterId: null,
  activeEffectId: null,
  globalTime: 0,
  playing: initialSettings.autoPlay,
  activeCurve: 'size',
  curveInterp: 'linear',
  curveDragIdx: null,
  autoSpinAngle: 0,
  importedMesh: null,
  importedMeshName: null,
  autoCycle: false,
  autoCycleTimer: 0,
  copiedEmitter: null,
  _uidCounter: 1,
  _undoStack: [],
  _redoStack: [],
  _lastHistoryTime: 0,
  exportEffectName: 'MyEffect',
  exportEffectPath: 'effect/skill/',
  exportModal: null,

  vpScale: 1,
  sceneBg: '#04060a',
  showGrid: true,
  showAxis: true,
  showChar: false,
  charSpin: false,
  envBone: 'root',
  envFog: false,
  envFogDensity: 0.02,
  envAmbient: '#303845',
  envFov: 45,
  envBloom: false,
  envFloor: false,
  envCharVisible: false,
  gizmoEnabled: false,
  gizmoTarget: { x: 0, y: 1, z: 0 },
  gizmoMode: 'translate',

  setSettings: (newSettings) => {
    if (newSettings.language && newSettings.language !== get().settings.language) {
      setLocale(newSettings.language as 'en' | 'cs');
    }
    set((state) => ({ settings: { ...state.settings, ...newSettings } }));
  },
  setExportEffectName: (name: string) => set({ exportEffectName: name }),
  setExportEffectPath: (path: string) => set({ exportEffectPath: path }),
  setExportModal: (modal) => set({ exportModal: modal }),

  _pushHistory: () => {
    const state = get();
    const snapshot = cloneEmitters(state.emitters);
    const newStack = [...state._undoStack, snapshot];
    if (newStack.length > MAX_UNDO) newStack.shift();
    set({ _undoStack: newStack, _redoStack: [], _lastHistoryTime: performance.now() });
    debouncedAutoSave(get);
  },

  undo: () => {
    const state = get();
    if (state._undoStack.length === 0) return;
    const prevEmitters = state._undoStack[state._undoStack.length - 1];
    const newUndo = state._undoStack.slice(0, -1);
    const currentSnapshot = cloneEmitters(state.emitters);
    const newRedo = [...state._redoStack, currentSnapshot];
    set({
      emitters: prevEmitters,
      _undoStack: newUndo,
      _redoStack: newRedo,
      activeEmitterId: prevEmitters.length > 0 ? prevEmitters[0].uid : null,
      _lastHistoryTime: performance.now(),
    });
    debouncedAutoSave(get);
  },

  redo: () => {
    const state = get();
    if (state._redoStack.length === 0) return;
    const nextEmitters = state._redoStack[state._redoStack.length - 1];
    const newRedo = state._redoStack.slice(0, -1);
    const currentSnapshot = cloneEmitters(state.emitters);
    const newUndo = [...state._undoStack, currentSnapshot];
    set({
      emitters: nextEmitters,
      _redoStack: newRedo,
      _undoStack: newUndo,
      activeEmitterId: nextEmitters.length > 0 ? nextEmitters[0].uid : null,
      _lastHistoryTime: performance.now(),
    });
    debouncedAutoSave(get);
  },

  resetProject: () => {
    get()._pushHistory();
    set({ emitters: [], importedEffects: [], activeEmitterId: null, activeEffectId: null, globalTime: 0, playing: get().settings.autoPlay, _uidCounter: 1 });
  },

  addEmitter: (name) => {
    get()._pushHistory();
    set((state) => {
      const uid = state._uidCounter;
      const newEmitter = createEmitterTemplate(uid, name);
      return {
        emitters: [...state.emitters, newEmitter],
        activeEmitterId: newEmitter.uid,
        _uidCounter: state._uidCounter + 1,
      };
    });
  },

  addEmitterFromTemplate: (name, updates) => {
    get()._pushHistory();
    set((state) => {
      const uid = state._uidCounter;
      const newEmitter = { ...createEmitterTemplate(uid, name), ...updates, uid, name };
      return {
        emitters: [...state.emitters, newEmitter],
        activeEmitterId: newEmitter.uid,
        _uidCounter: state._uidCounter + 1,
      };
    });
  },

  importMse: (name, rawData, dependencies) => set((state) => {
    const uid = state._uidCounter;
    const newEffect: MseEffect = { uid, name, rawData, dependencies, visible: true };
    return {
      importedEffects: [...state.importedEffects, newEffect],
      activeEffectId: uid,
      _uidCounter: state._uidCounter + 1,
    };
  }),

  duplicateEmitter: (id) => {
    get()._pushHistory();
    set((state) => {
      const original = state.emitters.find(e => e.uid === id);
      if (!original) return state;
      const uid = state._uidCounter;
      const copy = JSON.parse(JSON.stringify(original)) as Emitter;
      copy.uid = uid;
      copy.name += '_copy';
      copy.color = hueColor(uid * 47);
      copy._particles = undefined;
      copy._geom = undefined;
      copy._mat = undefined;
      copy._points = undefined;
      copy._spawnAcc = undefined;
      copy._localTime = undefined;
      copy._dirty = undefined;
      copy._uvOffset = undefined;
      return {
        emitters: [...state.emitters, copy],
        activeEmitterId: copy.uid,
        _uidCounter: state._uidCounter + 1,
      };
    });
  },

  deleteEmitter: (id) => {
    get()._pushHistory();
    set((state) => {
      const updatedEmitters = state.emitters.filter(e => e.uid !== id);
      let newActiveId = state.activeEmitterId;
      if (newActiveId === id) {
        newActiveId = updatedEmitters.length > 0 ? updatedEmitters[0].uid : null;
      }
      return { emitters: updatedEmitters, activeEmitterId: newActiveId };
    });
  },

  deleteEffect: (id: number) => set((state) => {
    const updatedEffects = state.importedEffects.filter(e => e.uid !== id);
    let newActiveId = state.activeEffectId;
    if (newActiveId === id) {
      newActiveId = updatedEffects.length > 0 ? updatedEffects[0].uid : null;
    }
    return { importedEffects: updatedEffects, activeEffectId: newActiveId };
  }),

  selectEmitter: (id) => set({ activeEmitterId: id }),
  selectEffect: (id) => set({ activeEffectId: id }),

  applyPreset: (emitterId, presetEffect) => {
    get()._pushHistory();
    set((state) => ({
      emitters: state.emitters.map(e => {
        if (e.uid === emitterId) {
          return { ...e, ...presetEffect.e, _dirty: true };
        }
        return e;
      })
    }));
    debouncedAutoSave(get);
  },

  updateEmitter: (id, updates) => {
    const state = get();
    const now = performance.now();
    if (now - state._lastHistoryTime > LAZY_HISTORY_THRESHOLD_MS) {
      state._pushHistory();
    }
    set((s) => ({
      emitters: s.emitters.map(e =>
        e.uid === id ? { ...e, ...updates, _dirty: true } : e
      ),
    }));
    debouncedAutoSave(get);
  },

  batchGroupEmitters: (ids, groupName) => {
    get()._pushHistory();
    set((state) => ({
      emitters: state.emitters.map(e =>
        ids.includes(e.uid) ? { ...e, group: groupName || undefined, _dirty: true } : e
      ),
    }));
    debouncedAutoSave(get);
  },

  setGroup: (id, groupName) => {
    const state = get();
    const now = performance.now();
    if (now - state._lastHistoryTime > LAZY_HISTORY_THRESHOLD_MS) {
      state._pushHistory();
    }
    set((s) => ({
      emitters: s.emitters.map(e =>
        e.uid === id ? { ...e, group: groupName || undefined, _dirty: true } : e
      ),
    }));
    debouncedAutoSave(get);
  },

  batchUpdateEmitters: (updates) => {
    const state = get();
    state._pushHistory();
    set((s) => ({
      emitters: s.emitters.map(e => {
        const found = updates.find(u => u.id === e.uid);
        return found ? { ...e, ...found.updates, _dirty: true } : e;
      }),
    }));
    debouncedAutoSave(get);
  },

  setPlaying: (value) => set({ playing: value }),
  setGlobalTime: (time) => set({ globalTime: time }),
  setActiveCurve: (curve) => set({ activeCurve: curve }),
  setCurveInterp: (interp) => set({ curveInterp: interp }),
  setCurveDragIdx: (idx) => set({ curveDragIdx: idx }),
  setAutoSpinAngle: (angle) => set({ autoSpinAngle: angle }),
  setImportedMesh: (mesh, name) => set({ importedMesh: mesh, importedMeshName: name }),
  setAutoCycle: (value) => set({ autoCycle: value }),
  setCopiedEmitter: (emitter) => set({ copiedEmitter: emitter }),

  setVpScale: (v) => set({ vpScale: v }),
  setSceneBg: (v) => set({ sceneBg: v }),
  setShowGrid: (v) => set({ showGrid: v }),
  setShowAxis: (v) => set({ showAxis: v }),
  setShowChar: (v) => set({ showChar: v }),
  setCharSpin: (v) => set({ charSpin: v }),
  setEnvBone: (v) => set({ envBone: v }),
  setEnvFog: (v) => set({ envFog: v }),
  setEnvFogDensity: (v) => set({ envFogDensity: v }),
  setEnvAmbient: (v) => set({ envAmbient: v }),
  setEnvFov: (v) => set({ envFov: v }),
  setEnvBloom: (v) => set({ envBloom: v }),
  setEnvFloor: (v) => set({ envFloor: v }),
  setEnvCharVisible: (v) => set({ envCharVisible: v }),
  setGizmoEnabled: (v) => set({ gizmoEnabled: v }),
  setGizmoTarget: (v) => set({ gizmoTarget: v }),
  setGizmoMode: (v) => set({ gizmoMode: v }),
  setAutoCycleTimer: (v) => set({ autoCycleTimer: v }),

  moveEmitterUp: (id) => {
    get()._pushHistory();
    set((state) => {
      const idx = state.emitters.findIndex(e => e.uid === id);
      if (idx <= 0) return state;
      const newEmitters = [...state.emitters];
      [newEmitters[idx - 1], newEmitters[idx]] = [newEmitters[idx], newEmitters[idx - 1]];
      return { emitters: newEmitters };
    });
  },

  moveEmitterDown: (id) => {
    get()._pushHistory();
    set((state) => {
      const idx = state.emitters.findIndex(e => e.uid === id);
      if (idx < 0 || idx >= state.emitters.length - 1) return state;
      const newEmitters = [...state.emitters];
      [newEmitters[idx], newEmitters[idx + 1]] = [newEmitters[idx + 1], newEmitters[idx]];
      return { emitters: newEmitters };
    });
  },

  randomizeEmitter: (id) => {
    get()._pushHistory();
    set((state) => {
      const emitter = state.emitters.find(e => e.uid === id);
      if (!emitter) return state;
      const rand = (min: number, max: number) => Math.random() * (max - min) + min;
      return {
        emitters: state.emitters.map(e =>
          e.uid === id ? {
            ...e,
            rate: Math.floor(rand(10, 200)),
            life: rand(0.3, 3),
            lifeRnd: rand(0, 1),
            speed: rand(1, 15),
            speedRnd: rand(0, 5),
            spread: rand(0, 180),
            sizeX: rand(0.2, 3),
            sizeRnd: rand(0, 1),
            spin: rand(-360, 360),
            spinRnd: rand(0, 200),
            colorKeys: [
              { t: 0, r: Math.random(), g: Math.random(), b: Math.random(), a: 1 },
              { t: 0.5, r: Math.random(), g: Math.random(), b: Math.random(), a: rand(0.3, 0.8) },
              { t: 1, r: Math.random() * 0.3, g: Math.random() * 0.3, b: Math.random() * 0.3, a: 0 },
            ],
          } : e
        )
      };
    });
  },

  exportProjectToJSON: () => {
    const state = get();
    const projectData: ProjectData = {
      version: '1.0.0',
      name: state.exportEffectName,
      timestamp: new Date().toISOString(),
      settings: state.settings,
      emitters: state.emitters,
      scene: {
        vpScale: state.vpScale,
        sceneBg: state.sceneBg,
        showGrid: state.showGrid,
        showAxis: state.showAxis,
        showChar: state.showChar,
        charSpin: state.charSpin,
        envBone: state.envBone,
        envFog: state.envFog,
        envFogDensity: state.envFogDensity,
        envAmbient: state.envAmbient,
        envFov: state.envFov,
        envBloom: state.envBloom,
        envFloor: state.envFloor,
        envCharVisible: state.envCharVisible,
        gizmoEnabled: state.gizmoEnabled,
        gizmoTarget: state.gizmoTarget,
        gizmoMode: state.gizmoMode,
      },
    };
    return JSON.stringify(projectData, null, 2);
  },

  importProjectFromJSON: (json: string) => {
    try {
      const data = JSON.parse(json) as ProjectData;
      if (!data.version || !data.emitters) {
        console.error('Invalid project file format');
        return false;
      }
      get()._pushHistory();
      set({
        settings: data.settings || initialSettings,
        emitters: data.emitters,
        exportEffectName: data.name || 'ImportedProject',
        vpScale: data.scene?.vpScale ?? 1,
        sceneBg: data.scene?.sceneBg ?? '#04060a',
        showGrid: data.scene?.showGrid ?? true,
        showAxis: data.scene?.showAxis ?? true,
        showChar: data.scene?.showChar ?? false,
        charSpin: data.scene?.charSpin ?? false,
        envBone: data.scene?.envBone ?? 'root',
        envFog: data.scene?.envFog ?? false,
        envFogDensity: data.scene?.envFogDensity ?? 0.02,
        envAmbient: data.scene?.envAmbient ?? '#333845',
        envFov: data.scene?.envFov ?? 45,
        envBloom: data.scene?.envBloom ?? false,
        envFloor: data.scene?.envFloor ?? false,
        envCharVisible: data.scene?.envCharVisible ?? false,
        gizmoEnabled: data.scene?.gizmoEnabled ?? false,
        gizmoTarget: data.scene?.gizmoTarget ?? { x: 0, y: 1, z: 0 },
        gizmoMode: (data.scene?.gizmoMode as 'translate' | 'rotate' | 'scale') ?? 'translate',
        activeEmitterId: data.emitters[0]?.uid ?? null,
        globalTime: 0,
  playing: initialSettings.autoPlay,
        _uidCounter: Math.max(0, ...data.emitters.map(e => e.uid)) + 1,
      });
      return true;
    } catch (e) {
      console.error('Failed to parse project JSON:', e);
      return false;
    }
  },

  validateForExport: () => {
    const state = get();
    const issues: ExportValidationIssue[] = [];

    state.emitters.forEach((e) => {
      if (!e.texDataUrl && !e.texPath) {
        issues.push({ type: 'warning', emitter: e.name, message: 'No texture path — export will reference empty path' });
      }

      if (e.gravity !== 0) {
        issues.push({ type: 'info', emitter: e.name, message: 'Only Y-axis gravity is exported to MSE (Metin2 client limitation)' });
      }

      if (e.rotType === 'NONE') {
        issues.push({ type: 'info', emitter: e.name, message: 'RotationType NONE — preview shows no rotation (exported correctly)' });
      }

      const scFlat = !e.sizeCurve || e.sizeCurve.length < 2 || e.sizeCurve.every((p, i, arr) => i === 0 || Math.abs(p.v - arr[i - 1].v) < 0.01);
      if (!scFlat) {
        issues.push({ type: 'info', emitter: e.name, message: 'SizeCurve non-flat — exported to MSE v3.2+; older clients ignore it' });
      }

      if (e.groundBounce) {
        issues.push({ type: 'warning', emitter: e.name, message: 'groundBounce is preview only — not exported to MSE/EFF (client compat varies)' });
      }

      if (e.uvScrollX !== 0 || e.uvScrollY !== 0) {
        issues.push({ type: 'warning', emitter: e.name, message: 'uvScroll is preview only — not supported in standard MSE/EFF export' });
      }

      if (e.velStretch > 0) {
        issues.push({ type: 'warning', emitter: e.name, message: 'velStretch is preview only — not in MSE/EFF export' });
      }

      if (e.windX !== 0 || e.windZ !== 0) {
        issues.push({ type: 'warning', emitter: e.name, message: 'X/Z wind is preview only — only Y gravity exported' });
      }
    });

    return issues;
  },

  autoSaveProject: () => {
    try {
      const state = get();
      const projectData: ProjectData = {
        version: '1.0.0',
        name: state.exportEffectName,
        timestamp: new Date().toISOString(),
        settings: state.settings,
        emitters: state.emitters,
        scene: {
          vpScale: state.vpScale,
          sceneBg: state.sceneBg,
          showGrid: state.showGrid,
          showAxis: state.showAxis,
          showChar: state.showChar,
          charSpin: state.charSpin,
          envBone: state.envBone,
          envFog: state.envFog,
          envFogDensity: state.envFogDensity,
          envAmbient: state.envAmbient,
          envFov: state.envFov,
          envBloom: state.envBloom,
          envFloor: state.envFloor,
          envCharVisible: state.envCharVisible,
          gizmoEnabled: state.gizmoEnabled,
          gizmoTarget: state.gizmoTarget,
          gizmoMode: state.gizmoMode,
        },
      };
      localStorage.setItem('metin2_asset_studio_autosave', JSON.stringify(projectData));
    } catch (e) {
      console.warn('Auto-save failed:', e);
    }
  },

  loadAutoSavedProject: () => {
    try {
      const saved = localStorage.getItem('metin2_asset_studio_autosave');
      if (!saved) return false;
      const data = JSON.parse(saved) as ProjectData;
      if (!data.version || !data.emitters) return false;
      get().importProjectFromJSON(saved);
      return true;
    } catch {
      return false;
    }
  },
}));
