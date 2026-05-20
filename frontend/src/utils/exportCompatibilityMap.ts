import type { Emitter } from '../types';

export interface FieldExportInfo {
  field: keyof Emitter;
  mseField: string;
  exported: boolean;
  previewOnly: boolean;
  mdeExported: boolean;
  effExported: boolean;
  notes: string;
  default: number | string | boolean | null;
}

export const MSE_FIELD_MAP: Record<string, FieldExportInfo> = {
  uid: {
    field: 'uid', mseField: '', exported: false, previewOnly: true,
    mdeExported: false, effExported: false,
    notes: 'Internal editor identifier, never exported', default: null,
  },
  name: {
    field: 'name', mseField: 'SystemName', exported: true, previewOnly: false,
    mdeExported: true, effExported: true,
    notes: 'Emitter name in SystemName property', default: 'Emitter',
  },
  visible: {
    field: 'visible', mseField: '', exported: false, previewOnly: true,
    mdeExported: false, effExported: false,
    notes: 'Editor visibility toggle only', default: true,
  },
  color: {
    field: 'color', mseField: '', exported: false, previewOnly: true,
    mdeExported: false, effExported: false,
    notes: 'Editor wireframe color only', default: '#ff8844',
  },
  blend: {
    field: 'blend', mseField: 'BlendType', exported: true, previewOnly: false,
    mdeExported: true, effExported: true,
    notes: 'MSE: NORMAL/ADD/MODULATE; EFF: 0/1/2; MDE: 0/1', default: 'alpha',
  },
  shape: {
    field: 'shape', mseField: 'SpawnShape', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'spherevol→SPHERE, ring→DISC lossy mapping', default: 'point',
  },
  rate: {
    field: 'rate', mseField: 'BirthRate', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Particles per second', default: 10,
  },
  burst: {
    field: 'burst', mseField: 'BurstCount', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Particles emitted instantly at start', default: 0,
  },
  life: {
    field: 'life', mseField: 'LifeTime', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Base particle lifetime in seconds', default: 2,
  },
  lifeRnd: {
    field: 'lifeRnd', mseField: 'LifeTimeRnd', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Random lifetime offset ±', default: 0.5,
  },
  maxP: {
    field: 'maxP', mseField: 'MaxParticleCount', exported: true, previewOnly: false,
    mdeExported: true, effExported: true,
    notes: 'Clamped to 2048 in export', default: 100,
  },
  loop: {
    field: 'loop', mseField: 'Loop', exported: true, previewOnly: false,
    mdeExported: true, effExported: true,
    notes: 'MSE: TRUE/FALSE; EFF: 0/1', default: 1,
  },
  cycle: {
    field: 'cycle', mseField: 'LifeCycle', exported: true, previewOnly: false,
    mdeExported: true, effExported: true,
    notes: 'Total effect cycle length', default: 5,
  },
  delay: {
    field: 'delay', mseField: 'StartDelay', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Initial delay before emission', default: 0,
  },
  speed: {
    field: 'speed', mseField: 'Speed', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Base particle speed', default: 5,
  },
  speedRnd: {
    field: 'speedRnd', mseField: 'SpeedRnd', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Random speed offset ±', default: 0,
  },
  spread: {
    field: 'spread', mseField: 'Spread', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Angular spread of emission cone', default: 0.2,
  },
  dirYaw: {
    field: 'dirYaw', mseField: 'DirectionYaw', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Direction yaw angle', default: 0,
  },
  dirPitch: {
    field: 'dirPitch', mseField: 'DirectionPitch', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Direction pitch angle', default: 0,
  },
  gravity: {
    field: 'gravity', mseField: 'GravityVector', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Y-component of GravityVector', default: 0,
  },
  windX: {
    field: 'windX', mseField: '', exported: false, previewOnly: true,
    mdeExported: false, effExported: false,
    notes: 'Preview-only wind simulation, not in MSE/EFF/MDE', default: 0,
  },
  windZ: {
    field: 'windZ', mseField: '', exported: false, previewOnly: true,
    mdeExported: false, effExported: false,
    notes: 'Preview-only wind simulation, not in MSE/EFF/MDE', default: 0,
  },
  drag: {
    field: 'drag', mseField: 'AirResistance', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Air resistance / drag', default: 0,
  },
  turb: {
    field: 'turb', mseField: '', exported: false, previewOnly: true,
    mdeExported: false, effExported: false,
    notes: 'Preview-only turbulence simulation, no MSE field', default: 0,
  },
  turbFreq: {
    field: 'turbFreq', mseField: '', exported: false, previewOnly: true,
    mdeExported: false, effExported: false,
    notes: 'Preview-only turbulence frequency', default: 1,
  },
  sizeX: {
    field: 'sizeX', mseField: 'SizeX', exported: true, previewOnly: false,
    mdeExported: true, effExported: true,
    notes: 'Base particle size X', default: 0.35,
  },
  sizeRnd: {
    field: 'sizeRnd', mseField: 'SizeRnd', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Random size offset', default: 0,
  },
  sizeY: {
    field: 'sizeY', mseField: 'SizeY', exported: true, previewOnly: false,
    mdeExported: true, effExported: true,
    notes: 'Only used when sizeNonUniform=true', default: 0.35,
  },
  sizeNonUniform: {
    field: 'sizeNonUniform', mseField: '', exported: false, previewOnly: true,
    mdeExported: false, effExported: false,
    notes: 'Controls whether SizeY is separate from SizeX', default: false,
  },
  spin: {
    field: 'spin', mseField: 'RotSpeedMin/Max', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Rotation speed', default: 0,
  },
  spinRnd: {
    field: 'spinRnd', mseField: 'RotSpeedMin/Max', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Random rotation speed offset', default: 0,
  },
  initRot: {
    field: 'initRot', mseField: 'RotMin', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Initial rotation (RotMin)', default: 0,
  },
  initRotRnd: {
    field: 'initRotRnd', mseField: 'RotMax', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'RotMax = initRot + initRotRnd', default: 0,
  },
  velStretch: {
    field: 'velStretch', mseField: '', exported: false, previewOnly: true,
    mdeExported: false, effExported: false,
    notes: 'Preview-only velocity stretch, not in MSE format', default: 0,
  },
  builtinTex: {
    field: 'builtinTex', mseField: '', exported: false, previewOnly: true,
    mdeExported: false, effExported: false,
    notes: 'Editor reference to built-in texture', default: 'grid',
  },
  texFile: {
    field: 'texFile', mseField: '', exported: false, previewOnly: true,
    mdeExported: false, effExported: false,
    notes: 'Editor reference to loaded texture file', default: null,
  },
  texDataUrl: {
    field: 'texDataUrl', mseField: '', exported: false, previewOnly: true,
    mdeExported: false, effExported: false,
    notes: 'Editor data URL for texture preview', default: null,
  },
  texPath: {
    field: 'texPath', mseField: 'TextureFileName', exported: true, previewOnly: false,
    mdeExported: true, effExported: true,
    notes: 'Fallback to effectName_emitterName.tga', default: '',
  },
  sheetCols: {
    field: 'sheetCols', mseField: 'TextureAnimFrame', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Sprite sheet columns (SpriteCols in EFF)', default: 1,
  },
  sheetRows: {
    field: 'sheetRows', mseField: 'TextureAnimFrame', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Sprite sheet rows (SpriteRows in EFF)', default: 1,
  },
  uvAnim: {
    field: 'uvAnim', mseField: 'TextureAnimType', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'loop=1, once=2, rand=3, life=1', default: 'loop',
  },
  animFPS: {
    field: 'animFPS', mseField: 'TextureAnimFPS', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Animation frame rate', default: 15,
  },
  coordType: {
    field: 'coordType', mseField: 'CoordType', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'WORLD or LOCAL coordinate system', default: 'WORLD',
  },
  rotType: {
    field: 'rotType', mseField: 'RotationType', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'NONE/RANDOM/SPIN', default: 'RANDOM',
  },
  uvScrollX: {
    field: 'uvScrollX', mseField: 'UVScrollX', exported: true, previewOnly: false,
    mdeExported: false, effExported: false,
    notes: 'Written as comment (# UVScrollX) — preview-only in practice', default: 0,
  },
  uvScrollY: {
    field: 'uvScrollY', mseField: 'UVScrollY', exported: true, previewOnly: false,
    mdeExported: false, effExported: false,
    notes: 'Written as comment (# UVScrollY) — preview-only in practice', default: 0,
  },
  shapeRadius: {
    field: 'shapeRadius', mseField: 'SpawnRadius', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Default 0.35 when missing', default: 0.35,
  },
  groundBounce: {
    field: 'groundBounce', mseField: 'GroundBounce', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'MSE: TRUE/FALSE; EFF: 1/0', default: false,
  },
  bounceFac: {
    field: 'bounceFac', mseField: 'BounceFactor', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Default 0.4 when missing', default: 0.4,
  },
  attractorStr: {
    field: 'attractorStr', mseField: 'AttractorStrength', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Only written when non-zero', default: 0,
  },
  attractorY: {
    field: 'attractorY', mseField: 'AttractorY', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Default 0.5 when missing', default: 0.5,
  },
  emitSurface: {
    field: 'emitSurface', mseField: '', exported: false, previewOnly: true,
    mdeExported: false, effExported: false,
    notes: 'Preview-only surface/edge emission type', default: 'none',
  },
  colorMod: {
    field: 'colorMod', mseField: '', exported: false, previewOnly: true,
    mdeExported: false, effExported: false,
    notes: 'Preview-only color modulation mode', default: 'multiply',
  },
  sizeCurve: {
    field: 'sizeCurve', mseField: 'SizeCurve', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Default 3-point curve when missing', default: null,
  },
  alphaCurve: {
    field: 'alphaCurve', mseField: 'AlphaCurve', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Default 3-point curve when missing', default: null,
  },
  speedCurve: {
    field: 'speedCurve', mseField: 'SpeedCurve', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Default 2-point flat curve when missing', default: null,
  },
  spinCurve: {
    field: 'spinCurve', mseField: 'SpinCurve', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Default 2-point flat curve when missing', default: null,
  },
  colorKeys: {
    field: 'colorKeys', mseField: 'ColorKeyframe', exported: true, previewOnly: false,
    mdeExported: false, effExported: true,
    notes: 'Default 2-key gradient when missing', default: null,
  },
};

export function getFieldInfo(fieldName: string): FieldExportInfo | undefined {
  return MSE_FIELD_MAP[fieldName];
}

export function getExportableFields(): FieldExportInfo[] {
  return Object.values(MSE_FIELD_MAP).filter(f => f.exported);
}

export function getPreviewOnlyFields(): FieldExportInfo[] {
  return Object.values(MSE_FIELD_MAP).filter(f => f.previewOnly);
}
