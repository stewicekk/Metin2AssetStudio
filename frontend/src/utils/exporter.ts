import type { Emitter } from '../types';

export interface ExportOptions {
  precision: number;
  effectName: string;
  effectPath: string;
}

const defaultOptions: ExportOptions = {
  precision: 4,
  effectName: 'MyEffect',
  effectPath: 'effect/skill/',
};

function fmt(value: number, precision: number): string {
  if (!Number.isFinite(value)) return '0.0000';
  return value.toFixed(precision);
}

function shapeCode(shape: string): string {
  const map: Record<string, string> = {
    point: 'POINT', cone: 'CONE', box: 'BOX',
    sphere: 'SPHERE', spherevol: 'SPHERE',
    ring: 'DISC', disc: 'DISC',
  };
  return map[shape] || 'POINT';
}

function sortByTime<T extends { t: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a.t - b.t);
}

const DEFAULT_COLOR_KEYS = [
  { t: 0 as const, r: 1, g: 1, b: 1, a: 1 },
  { t: 1 as const, r: 0.2, g: 0.1, b: 0.05, a: 0 },
];

const DEFAULT_SIZE_CURVE = [
  { t: 0 as const, v: 1 },
  { t: 0.5 as const, v: 1 },
  { t: 1 as const, v: 0.2 },
];

const DEFAULT_ALPHA_CURVE = [
  { t: 0 as const, v: 1 },
  { t: 0.8 as const, v: 0.9 },
  { t: 1 as const, v: 0 },
];

const DEFAULT_SPEED_CURVE = [
  { t: 0 as const, v: 1 },
  { t: 1 as const, v: 1 },
];

const DEFAULT_SPIN_CURVE = [
  { t: 0 as const, v: 1 },
  { t: 1 as const, v: 1 },
];

export function buildEFF(emitters: Emitter[], options: Partial<ExportOptions> = {}): string {
  const opts = { ...defaultOptions, ...options };
  const { precision, effectName, effectPath } = opts;
  
  let t = `// Metin2 Effect Studio PRO v3.3 — CEffectData Export\n// ${new Date().toLocaleDateString()}\n\n`;
  t += `CEffectData\n{\n`;
  t += `\tEffectName\t\t"${effectName}"\n`;
  t += `\tEffectPath\t\t"${effectPath}"\n\n`;
  
  for (const e of emitters) {
    t += `\tCParticleSystemData\n\t{\n`;
    t += `\t\tName\t\t\t"${e.name}"\n`;
    t += `\t\tCoordType\t\t${(e.coordType || 'WORLD').toUpperCase()}\n`;
    t += `\t\tRotationType\t\t${(e.rotType || 'RANDOM').toUpperCase()}\n`;
    t += `\t\tTextureFileName\t"${e.texPath || (effectName.toLowerCase() + '.tga')}"\n`;
    t += `\t\tBlendType\t\t${e.blend === 'add' ? 1 : e.blend === 'modulate' ? 2 : 0}\n`;
    t += `\t\tMaxParticleCount\t${Math.min(Math.max(0, e.maxP), 2048)}\n`;
    t += `\t\tBirthRate\t\t${fmt(e.rate, precision)}\n`;
    t += `\t\tBurstCount\t\t${e.burst}\n`;
    t += `\t\tLifeTime\t\t${fmt(e.life, precision)}\n`;
    t += `\t\tLifeTimeRnd\t\t${fmt(e.lifeRnd, precision)}\n`;
    t += `\t\tSpeed\t\t\t${fmt(e.speed, precision)}\n`;
    t += `\t\tSpeedRnd\t\t${fmt(e.speedRnd, precision)}\n`;
    t += `\t\tGravityVector\t\t0.0000\t${fmt(e.gravity, precision)}\t0.0000\n`;
    t += `\t\tAirResistance\t${fmt(e.drag, precision)}\n`;
    
    if (e.groundBounce) {
      t += `\t\tGroundBounce\t\t1\n`;
      t += `\t\tBounceFactor\t\t${fmt(e.bounceFac || 0.4, precision)}\n`;
    }
    
    if (e.attractorStr !== 0) {
      t += `\t\tAttractorStrength\t${fmt(e.attractorStr, precision)}\n`;
      t += `\t\tAttractorY\t\t${fmt(e.attractorY || 0.5, precision)}\n`;
    }
    
    t += `\t\tSpread\t\t\t${fmt(e.spread, precision)}\n`;
    t += `\t\tDirectionYaw\t\t${fmt(e.dirYaw, precision)}\n`;
    t += `\t\tDirectionPitch\t${fmt(e.dirPitch, precision)}\n`;
    t += `\t\tSpawnShape\t\t${shapeCode(e.shape)}\n`;
    t += `\t\tSpawnRadius\t\t${fmt(e.shapeRadius || 0.35, precision)}\n`;
    t += `\t\tSizeX\t\t\t${fmt(e.sizeX, precision)}\n`;
    t += `\t\tSizeY\t\t\t${fmt(e.sizeNonUniform ? e.sizeY : e.sizeX, precision)}\n`;
    t += `\t\tSizeRnd\t\t\t${fmt(e.sizeRnd, precision)}\n`;
    t += `\t\tRotationMin\t\t${fmt(e.initRot, precision)}\n`;
    t += `\t\tRotationMax\t\t${fmt(e.initRot + e.initRotRnd, precision)}\n`;
    t += `\t\tRotSpeedMin\t\t${fmt(e.spin - Math.abs(e.spinRnd), precision)}\n`;
    t += `\t\tRotSpeedMax\t\t${fmt(e.spin + Math.abs(e.spinRnd), precision)}\n`;
    t += `\t\tLoop\t\t\t${e.loop}\n`;
    t += `\t\tLifeCycle\t\t${fmt(e.cycle, precision)}\n`;
    t += `\t\tStartDelay\t\t${fmt(e.delay, precision)}\n`;
    t += `\t\tSpriteRows\t\t${e.sheetRows}\n`;
    t += `\t\tSpriteCols\t\t${e.sheetCols}\n`;
    t += `\t\tAnimType\t\t${e.uvAnim === 'rand' ? 3 : e.uvAnim === 'once' ? 2 : 1}\n`;
    t += `\t\tAnimFPS\t\t\t${e.animFPS}\n`;
    
    const colorKeys = e.colorKeys || DEFAULT_COLOR_KEYS;
    t += `\t\tColorKeyframeCount\t${colorKeys.length}\n`;
    for (const k of sortByTime(colorKeys)) {
      t += `\t\t{\t${fmt(k.t, precision + 2)}\t${Math.round(k.r * 255)}\t${Math.round(k.g * 255)}\t${Math.round(k.b * 255)}\t${Math.round(k.a * 255)}\t}\n`;
    }
    
    const sizeCurve = e.sizeCurve || DEFAULT_SIZE_CURVE;
    t += `\t\tSizeCurveCount\t\t${sizeCurve.length}\n`;
    for (const pt of sortByTime(sizeCurve)) {
      t += `\t\tSizeCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}\n`;
    }
    
    const alphaCurve = e.alphaCurve || DEFAULT_ALPHA_CURVE;
    t += `\t\tAlphaCurveCount\t${alphaCurve.length}\n`;
    for (const pt of sortByTime(alphaCurve)) {
      t += `\t\tAlphaCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}\n`;
    }
    
    const speedCurve = e.speedCurve || DEFAULT_SPEED_CURVE;
    t += `\t\tSpeedCurveCount\t\t${speedCurve.length}\n`;
    for (const pt of sortByTime(speedCurve)) {
      t += `\t\tSpeedCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}\n`;
    }
    
    const spinCurve = e.spinCurve || DEFAULT_SPIN_CURVE;
    t += `\t\tSpinCurveCount\t\t${spinCurve.length}\n`;
    for (const pt of sortByTime(spinCurve)) {
      t += `\t\tSpinCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}\n`;
    }
    
    t += `\t}\n\n`;
  }
  
  t += `}\n`;
  return t;
}

const BONE_MAP: Record<string, string> = {
  root: 'Bip01',
  pelvis: 'Bip01_Pelvis',
  spine: 'Bip01_Spine',
  chest: 'Bip01_Spine1',
  neck: 'Bip01_Neck',
  head: 'Bip01_Head',
  larm: 'Bip01_L_UpperArm',
  rarm: 'Bip01_R_UpperArm',
  lforearm: 'Bip01_L_Forearm',
  rforearm: 'Bip01_R_Forearm',
  lhand: 'Bip01_L_Hand',
  rhand: 'Bip01_R_Hand',
  lfoot: 'Bip01_L_Foot',
  rfoot: 'Bip01_R_Foot',
  lfinger: 'Bip01_L_Finger0',
  rfinger: 'Bip01_R_Finger0',
  ltoe: 'Bip01_L_Toe0',
  rtoe: 'Bip01_R_Toe0',
  weapon_l: 'Bip01_Weapon_L',
  weapon_r: 'Bip01_Weapon_R',
};

export function buildMDE(emitters: Emitter[], options: Partial<ExportOptions> & { attachBone?: string } = {}): string {
  const opts = { ...defaultOptions, ...options };
  const { precision, effectName, effectPath } = opts;
  const bone = BONE_MAP[opts.attachBone || 'root'] || 'Bip01';
  
  let t = `// Metin2 Effect Studio PRO v3.3 — CEffectMesh Export (.mde)\n`;
  t += `// Workflow: FBX → GR2 (Granny SDK) → embed here\n// ${new Date().toLocaleDateString()}\n\n`;
  t += `CEffectMesh\n{\n`;
  t += `\tEffectMeshName\t"${effectName}"\n\n`;
  
  for (let idx = 0; idx < emitters.length; idx++) {
    const e = emitters[idx];
    const gr2 = `${effectPath}mesh/${e.name.toLowerCase().replace(/\s+/g, '_')}.gr2`;
    
    t += `\t// --- Mesh group: ${e.name} ---\n`;
    t += `\tCMeshGroup\n\t{\n`;
    t += `\t\tName\t\t"${e.name}"\n`;
    t += `\t\tMeshFileName\t"${gr2}"\n`;
    t += `\t\tTextureFileName\t"${e.texPath || (effectPath + effectName.toLowerCase() + '.tga')}"\n`;
    t += `\t\tBlendType\t${e.blend === 'add' ? 1 : 0}\n`;
    t += `\t\tPosition\t${fmt(0, precision)}\t${fmt(0, precision)}\t${fmt(0, precision)}\n`;
    t += `\t\tScale\t\t${fmt(e.sizeX, precision)}\t${fmt(e.sizeNonUniform ? e.sizeY : e.sizeX, precision)}\t${fmt(e.sizeX, precision)}\n`;
    t += `\t\tRotation\t${fmt(0, precision)}\t${fmt(0, precision)}\t${fmt(0, precision)}\n`;
    t += `\t\tLoop\t\t${e.loop}\n`;
    t += `\t\tLifeCycle\t${fmt(e.cycle, precision)}\n`;
    t += `\t\tVisible\t\t1\n`;
    t += `\t\tParticleEffectFile\t"${effectPath}${effectName}_${idx}.mse"\n`;
    t += `\t}\n\n`;
  }
  
  t += `\tAttachBone\t"${bone}"\n`;
  
  const speeds = emitters.map(e => (e.speed || 0) + Math.abs(e.speedRnd || 0));
  const lives = emitters.map(e => (e.life || 1) + Math.abs(e.lifeRnd || 0));
  const sizes = emitters.map(e => Math.max(e.sizeX || 1, e.sizeNonUniform ? e.sizeY : e.sizeX || 1));
  const bndSpd = speeds.length > 0 ? Math.max(1, ...speeds) : 1;
  const bndLife = lives.length > 0 ? Math.max(0.5, ...lives) : 0.5;
  const bndSz = sizes.length > 0 ? Math.max(0.5, ...sizes) : 0.5;
  const bndR = Math.max(1.5, bndSpd * bndLife * 0.65 + bndSz * 0.5);
  t += `\tBoundingRadius\t${fmt(bndR, precision)}\n`;
  t += `}\n`;
  
  return t;
}

export function downloadText(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function copyToClipboard(content: string): void {
  navigator.clipboard.writeText(content);
}