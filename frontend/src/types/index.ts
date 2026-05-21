// frontend/src/types/index.ts
import type { MSEDocument } from '../core/mseParser';

export type BlendType = 'add' | 'alpha' | 'modulate';
export type ShapeType = 'point' | 'cone' | 'box' | 'sphere' | 'spherevol' | 'ring' | 'disc';
export type UVAnimType = 'loop' | 'once' | 'rand' | 'life';
export type CoordType = 'WORLD' | 'LOCAL';
export type RotType = 'NONE' | 'RANDOM' | 'SPIN';
export type EmitterSurfaceType = 'none' | 'surface' | 'edge';
export type ColorModType = 'multiply' | 'add';
export type CurveInterpolationType = 'linear' | 'smooth';

export interface CurvePoint {
  t: number;
  v: number;
}

export interface ColorKey {
  t: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Particle {
  alive: boolean;
  age: number;
  life: number;
  px: number; py: number; pz: number;
  vx: number; vy: number; vz: number;
  rot: number;
  spin: number;
  baseSize: number;
  col: { r: number; g: number; b: number; a: number; };
  frame: number;
  boneOx: number; boneOy: number; boneOz: number;
  stretchRot: number;
  stretch: number;
}

export interface Emitter {
  uid: number;
  name: string;
  visible: boolean;
  color: string;
  group?: string;

  blend: BlendType;
  shape: ShapeType;

  rate: number;
  burst: number;
  life: number;
  lifeRnd: number;
  maxP: number;
  loop: 0 | 1;
  cycle: number;
  delay: number;

  speed: number;
  speedRnd: number;
  spread: number;
  dirYaw: number;
  dirPitch: number;

  gravity: number;
  windX: number; windZ: number;
  drag: number;
  turb: number;
  turbFreq: number;

  sizeX: number;
  sizeRnd: number;
  sizeY: number;
  sizeNonUniform: boolean;

  spin: number;
  spinRnd: number;
  initRot: number;
  initRotRnd: number;

  velStretch: number;

  builtinTex: string;
  texFile: string | null;
  texDataUrl: string | null;
  texPath: string;

  sheetCols: number;
  sheetRows: number;
  uvAnim: UVAnimType;
  animFPS: number;

  coordType: CoordType;
  rotType: RotType;
  uvScrollX: number; uvScrollY: number;
  shapeRadius: number;
  groundBounce: boolean;
  bounceFac: number;
  attractorStr: number;
  attractorY: number;
  emitSurface: EmitterSurfaceType;
  colorMod: ColorModType;

  sizeCurve: CurvePoint[];
  alphaCurve: CurvePoint[];
  speedCurve: CurvePoint[];
  spinCurve: CurvePoint[];
  colorKeys: ColorKey[];

  _particles?: Particle[];
  _geom?: unknown;
  _mat?: unknown;
  _points?: unknown;
  _spawnAcc?: number;
  _localTime?: number;
  _dirty?: boolean;
  _uvOffset?: number;
}

export interface Dependency {
  path: string;
  type: 'mesh' | 'texture' | 'animation' | 'other';
  resolved?: boolean;
  data?: unknown;
}

export interface MseEffect {
  uid: number;
  name: string;
  rawData: MSEDocument;
  dependencies: Dependency[];
  visible: boolean;
}

export interface AppSettings {
  theme: string;
  showPerf: boolean;
  showDebug: boolean;
  particleDebug: boolean;
  autoPlay: boolean;
  hiPrec: boolean;
  exportPrec: number;
  language: string;
}
