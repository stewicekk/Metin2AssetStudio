import type { Emitter, CurvePoint, ColorKey, BlendType } from '../types';

export type ExportMode = 'canonical' | 'preserve' | 'exact';

export interface CanonicalWriterOptions {
  precision: number;
  effectName: string;
  effectPath: string;
  mode: ExportMode;
  includeHeader: boolean;
  attachBone: string;
}

const defaultOptions: CanonicalWriterOptions = {
  precision: 4,
  effectName: 'MyEffect',
  effectPath: 'effect/skill/',
  mode: 'canonical',
  includeHeader: true,
  attachBone: 'root',
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

function blendMSE(blend: BlendType): string {
  return blend === 'add' ? 'ADD' : blend === 'modulate' ? 'MODULATE' : 'NORMAL';
}

function blendEFF(blend: BlendType): number {
  return blend === 'add' ? 1 : blend === 'modulate' ? 2 : 0;
}

function animTypeCode(uvAnim: string): number {
  return uvAnim === 'rand' ? 3 : uvAnim === 'once' ? 2 : 1;
}

function fmtGravityVector(g: number, precision: number): string {
  return `0.0000\t${fmt(g, precision)}\t0.0000`;
}

function clampMaxP(val: number): number {
  return Math.max(0, Math.min(2048, Math.round(val)));
}

function sortCurve<T extends { t: number }>(curve: T[]): T[] {
  return [...curve].sort((a, b) => a.t - b.t);
}

const DEFAULT_COLOR_KEYS: ColorKey[] = [
  { t: 0, r: 1, g: 1, b: 1, a: 1 },
  { t: 1, r: 0.2, g: 0.1, b: 0.05, a: 0 },
];

const DEFAULT_SIZE_CURVE: CurvePoint[] = [
  { t: 0, v: 1 }, { t: 0.5, v: 1 }, { t: 1, v: 0.2 },
];

const DEFAULT_ALPHA_CURVE: CurvePoint[] = [
  { t: 0, v: 1 }, { t: 0.8, v: 0.9 }, { t: 1, v: 0 },
];

const DEFAULT_SPEED_CURVE: CurvePoint[] = [
  { t: 0, v: 1 }, { t: 1, v: 1 },
];

const DEFAULT_SPIN_CURVE: CurvePoint[] = [
  { t: 0, v: 1 }, { t: 1, v: 1 },
];

export function writeCanonicalMSE(emitters: Emitter[], options?: Partial<CanonicalWriterOptions>): string {
  const opts = { ...defaultOptions, ...options };
  const { precision, effectName, mode } = opts;

  if (mode === 'preserve') {
    return writePreserveMSE(emitters, options);
  }

  const lines: string[] = [];

  if (opts.includeHeader) {
    lines.push(`# Metin2 Effect Studio PRO v3.3 — MSE Export (${mode})`);
    lines.push(`# ${new Date().toLocaleDateString()}`);
    lines.push('');
  }

  lines.push(`EffectName\t"${effectName}"`);
  lines.push(`ParticleSystemCount\t${emitters.length}`);
  lines.push('');

  for (let idx = 0; idx < emitters.length; idx++) {
    const e = emitters[idx];
    lines.push(`# --- Particle System ${idx + 1}: ${e.name} ---`);
    lines.push('StartParticleSystem');
    lines.push(`\tSystemName\t"${e.name}"`);
    lines.push(`\tBirthRate\t${fmt(e.rate, precision)}`);
    lines.push(`\tMaxParticleCount\t${clampMaxP(e.maxP)}`);
    lines.push(`\tLifeTime\t${fmt(e.life, precision)}`);
    lines.push(`\tLifeTimeRnd\t${fmt(e.lifeRnd, precision)}`);
    lines.push(`\tBurstCount\t${e.burst}`);
    lines.push(`\tStartDelay\t${fmt(e.delay, precision)}`);
    lines.push(`\tLoop\t${e.loop ? 'TRUE' : 'FALSE'}`);
    lines.push(`\tLifeCycle\t${fmt(e.cycle, precision)}`);
    lines.push(`\tCoordType\t${(e.coordType || 'WORLD').toUpperCase()}`);
    lines.push(`\tRotationType\t${(e.rotType || 'RANDOM').toUpperCase()}`);
    lines.push(`\tSpawnShape\t${shapeCode(e.shape)}`);
    lines.push(`\tSpawnRadius\t${fmt(e.shapeRadius || 0.35, precision)}`);
    lines.push(`\tSpeed\t${fmt(e.speed, precision)}`);
    lines.push(`\tSpeedRnd\t${fmt(e.speedRnd, precision)}`);
    lines.push(`\tSpread\t${fmt(e.spread, precision)}`);
    lines.push(`\tDirectionYaw\t${fmt(e.dirYaw, precision)}`);
    lines.push(`\tDirectionPitch\t${fmt(e.dirPitch, precision)}`);
    lines.push(`\tGravityVector\t${fmtGravityVector(e.gravity, precision)}`);
    lines.push(`\tAirResistance\t${fmt(e.drag, precision)}`);

    if (e.groundBounce) {
      lines.push(`\tGroundBounce\tTRUE`);
      lines.push(`\tBounceFactor\t${fmt(e.bounceFac || 0.4, precision)}`);
    }

    if (e.attractorStr !== 0) {
      lines.push(`\tAttractorStrength\t${fmt(e.attractorStr, precision)}`);
      lines.push(`\tAttractorY\t${fmt(e.attractorY || 0.5, precision)}`);
    }

    lines.push(`\tSizeX\t${fmt(e.sizeX, precision)}`);
    lines.push(`\tSizeY\t${fmt(e.sizeNonUniform ? e.sizeY : e.sizeX, precision)}`);
    lines.push(`\tSizeRnd\t${fmt(e.sizeRnd, precision)}`);

    if (mode === 'canonical') {
      const rotMin = Math.min(e.initRot, e.initRot + e.initRotRnd);
      const rotMax = Math.max(e.initRot, e.initRot + e.initRotRnd);
      lines.push(`\tRotMin\t${fmt(rotMin, precision)}`);
      lines.push(`\tRotMax\t${fmt(rotMax, precision)}`);
    } else {
      lines.push(`\tRotMin\t${fmt(e.initRot, precision)}`);
      lines.push(`\tRotMax\t${fmt(e.initRot + e.initRotRnd, precision)}`);
    }

    {
      const spinMin = e.spin - Math.abs(e.spinRnd);
      const spinMax = e.spin + Math.abs(e.spinRnd);
      lines.push(`\tRotSpeedMin\t${fmt(spinMin, precision)}`);
      lines.push(`\tRotSpeedMax\t${fmt(spinMax, precision)}`);
    }

    lines.push(`\tBlendType\t${blendMSE(e.blend)}`);

    const texPath = e.texPath || (effectName.toLowerCase() + '_' + e.name.toLowerCase() + '.tga');
    lines.push(`\tTextureFileName\t"${texPath}"`);
    lines.push(`\tTextureAnimType\t${animTypeCode(e.uvAnim)}`);
    lines.push(`\tTextureAnimFrame\t${e.sheetCols}\t${e.sheetRows}`);
    lines.push(`\tTextureAnimFPS\t${e.animFPS}`);

    if (e.uvScrollX !== 0 || e.uvScrollY !== 0) {
      lines.push(`\t# UVScrollX\t${fmt(e.uvScrollX, precision)}`);
      lines.push(`\t# UVScrollY\t${fmt(e.uvScrollY, precision)}`);
    }

    const colorKeys = e.colorKeys || DEFAULT_COLOR_KEYS;
    lines.push(`\tColorKeyframeCount\t${colorKeys.length}`);
    for (const k of sortCurve(colorKeys)) {
      lines.push(`\tColorKeyframe\t${fmt(k.t, precision)}\t${Math.round(k.r * 255)}\t${Math.round(k.g * 255)}\t${Math.round(k.b * 255)}\t${Math.round(k.a * 255)}`);
    }

    const sizeCurve = e.sizeCurve || DEFAULT_SIZE_CURVE;
    lines.push(`\tSizeCurveCount\t${sizeCurve.length}`);
    for (const pt of sortCurve(sizeCurve)) {
      lines.push(`\tSizeCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}`);
    }

    const alphaCurve = e.alphaCurve || DEFAULT_ALPHA_CURVE;
    lines.push(`\tAlphaCurveCount\t${alphaCurve.length}`);
    for (const pt of sortCurve(alphaCurve)) {
      lines.push(`\tAlphaCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}`);
    }

    const speedCurve = e.speedCurve || DEFAULT_SPEED_CURVE;
    lines.push(`\tSpeedCurveCount\t${speedCurve.length}`);
    for (const pt of sortCurve(speedCurve)) {
      lines.push(`\tSpeedCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}`);
    }

    const spinCurve = e.spinCurve || DEFAULT_SPIN_CURVE;
    lines.push(`\tSpinCurveCount\t${spinCurve.length}`);
    for (const pt of sortCurve(spinCurve)) {
      lines.push(`\tSpinCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}`);
    }

    lines.push('EndParticleSystem');
    lines.push('');
  }

  return lines.join('\n');
}

export function writeEFF(emitters: Emitter[], options?: Partial<CanonicalWriterOptions>): string {
  const opts = { ...defaultOptions, ...options };
  const { precision, effectName, effectPath } = opts;

  const lines: string[] = [];

  if (opts.includeHeader) {
    lines.push(`// Metin2 Effect Studio PRO v3.3 — CEffectData Export`);
    lines.push(`// ${new Date().toLocaleDateString()}`);
    lines.push('');
  }

  lines.push('CEffectData');
  lines.push('{');
  lines.push(`\tEffectName\t\t"${effectName}"`);
  lines.push(`\tEffectPath\t\t"${effectPath}"`);
  lines.push('');

  for (const e of emitters) {
    lines.push('\tCParticleSystemData');
    lines.push('\t{');
    lines.push(`\t\tName\t\t\t"${e.name}"`);
    lines.push(`\t\tCoordType\t\t${(e.coordType || 'WORLD').toUpperCase()}`);
    lines.push(`\t\tRotationType\t\t${(e.rotType || 'RANDOM').toUpperCase()}`);
    lines.push(`\t\tTextureFileName\t"${e.texPath || (effectName.toLowerCase() + '.tga')}"`);
    lines.push(`\t\tBlendType\t\t${blendEFF(e.blend)}`);
    lines.push(`\t\tMaxParticleCount\t${clampMaxP(e.maxP)}`);
    lines.push(`\t\tBirthRate\t\t${fmt(e.rate, precision)}`);
    lines.push(`\t\tBurstCount\t\t${e.burst}`);
    lines.push(`\t\tLifeTime\t\t${fmt(e.life, precision)}`);
    lines.push(`\t\tLifeTimeRnd\t\t${fmt(e.lifeRnd, precision)}`);
    lines.push(`\t\tSpeed\t\t\t${fmt(e.speed, precision)}`);
    lines.push(`\t\tSpeedRnd\t\t${fmt(e.speedRnd, precision)}`);
    lines.push(`\t\tGravityVector\t\t${fmtGravityVector(e.gravity, precision)}`);
    lines.push(`\t\tAirResistance\t${fmt(e.drag, precision)}`);

    if (e.groundBounce) {
      lines.push(`\t\tGroundBounce\t\t1`);
      lines.push(`\t\tBounceFactor\t\t${fmt(e.bounceFac || 0.4, precision)}`);
    }

    if (e.attractorStr !== 0) {
      lines.push(`\t\tAttractorStrength\t${fmt(e.attractorStr, precision)}`);
      lines.push(`\t\tAttractorY\t\t${fmt(e.attractorY || 0.5, precision)}`);
    }

    lines.push(`\t\tSpread\t\t\t${fmt(e.spread, precision)}`);
    lines.push(`\t\tDirectionYaw\t\t${fmt(e.dirYaw, precision)}`);
    lines.push(`\t\tDirectionPitch\t${fmt(e.dirPitch, precision)}`);
    lines.push(`\t\tSpawnShape\t\t${shapeCode(e.shape)}`);
    lines.push(`\t\tSpawnRadius\t\t${fmt(e.shapeRadius || 0.35, precision)}`);
    lines.push(`\t\tSizeX\t\t\t${fmt(e.sizeX, precision)}`);
    lines.push(`\t\tSizeY\t\t\t${fmt(e.sizeNonUniform ? e.sizeY : e.sizeX, precision)}`);
    lines.push(`\t\tSizeRnd\t\t\t${fmt(e.sizeRnd, precision)}`);
    lines.push(`\t\tRotationMin\t\t${fmt(e.initRot, precision)}`);
    lines.push(`\t\tRotationMax\t\t${fmt(e.initRot + e.initRotRnd, precision)}`);
    lines.push(`\t\tRotSpeedMin\t\t${fmt(e.spin - Math.abs(e.spinRnd), precision)}`);
    lines.push(`\t\tRotSpeedMax\t\t${fmt(e.spin + Math.abs(e.spinRnd), precision)}`);
    lines.push(`\t\tLoop\t\t\t${e.loop}`);
    lines.push(`\t\tLifeCycle\t\t${fmt(e.cycle, precision)}`);
    lines.push(`\t\tStartDelay\t\t${fmt(e.delay, precision)}`);
    lines.push(`\t\tSpriteRows\t\t${e.sheetRows}`);
    lines.push(`\t\tSpriteCols\t\t${e.sheetCols}`);
    lines.push(`\t\tAnimType\t\t${animTypeCode(e.uvAnim)}`);
    lines.push(`\t\tAnimFPS\t\t\t${e.animFPS}`);

    const colorKeys = e.colorKeys || DEFAULT_COLOR_KEYS;
    lines.push(`\t\tColorKeyframeCount\t${colorKeys.length}`);
    for (const k of sortCurve(colorKeys)) {
      lines.push(`\t\t{\t${fmt(k.t, precision + 2)}\t${Math.round(k.r * 255)}\t${Math.round(k.g * 255)}\t${Math.round(k.b * 255)}\t${Math.round(k.a * 255)}\t}`);
    }

    const sizeCurve = e.sizeCurve || DEFAULT_SIZE_CURVE;
    lines.push(`\t\tSizeCurveCount\t\t${sizeCurve.length}`);
    for (const pt of sortCurve(sizeCurve)) {
      lines.push(`\t\tSizeCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}`);
    }

    const alphaCurve = e.alphaCurve || DEFAULT_ALPHA_CURVE;
    lines.push(`\t\tAlphaCurveCount\t${alphaCurve.length}`);
    for (const pt of sortCurve(alphaCurve)) {
      lines.push(`\t\tAlphaCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}`);
    }

    const speedCurve = e.speedCurve || DEFAULT_SPEED_CURVE;
    lines.push(`\t\tSpeedCurveCount\t\t${speedCurve.length}`);
    for (const pt of sortCurve(speedCurve)) {
      lines.push(`\t\tSpeedCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}`);
    }

    const spinCurve = e.spinCurve || DEFAULT_SPIN_CURVE;
    lines.push(`\t\tSpinCurveCount\t\t${spinCurve.length}`);
    for (const pt of sortCurve(spinCurve)) {
      lines.push(`\t\tSpinCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}`);
    }

    lines.push('\t}');
    lines.push('');
  }

  lines.push('}');
  return lines.join('\n');
}

const BONE_MAP: Record<string, string> = {
  root: 'Bip01', spine: 'Bip01_Spine', chest: 'Bip01_Spine1',
  rhand: 'Bip01_R_Hand', lhand: 'Bip01_L_Hand', head: 'Bip01_Head',
  rfoot: 'Bip01_R_Foot', lfoot: 'Bip01_L_Foot',
  pelvis: 'Bip01_Pelvis', neck: 'Bip01_Neck',
  rarm: 'Bip01_R_UpperArm', larm: 'Bip01_L_UpperArm',
  rforearm: 'Bip01_R_Forearm', lforearm: 'Bip01_L_Forearm',
};

export function writeMDE(emitters: Emitter[], options?: Partial<CanonicalWriterOptions>): string {
  const opts = { ...defaultOptions, ...options };
  const { precision, effectName, effectPath } = opts;
  const bone = BONE_MAP[opts.attachBone || 'root'] || 'Bip01';

  const lines: string[] = [];

  if (opts.includeHeader) {
    lines.push(`// Metin2 Effect Studio PRO v3.3 — CEffectMesh Export (.mde)`);
    lines.push(`// Workflow: FBX → GR2 (Granny SDK) → embed here`);
    lines.push(`// ${new Date().toLocaleDateString()}`);
    lines.push('');
  }

  lines.push('CEffectMesh');
  lines.push('{');
  lines.push(`\tEffectMeshName\t"${effectName}"`);
  lines.push('');

  for (let idx = 0; idx < emitters.length; idx++) {
    const e = emitters[idx];
    const gr2 = `${effectPath}mesh/${e.name.toLowerCase().replace(/\s+/g, '_')}.gr2`;

    lines.push(`\t// --- Mesh group: ${e.name} ---`);
    lines.push('\tCMeshGroup');
    lines.push('\t{');
    lines.push(`\t\tName\t\t"${e.name}"`);
    lines.push(`\t\tMeshFileName\t"${gr2}"`);
    lines.push(`\t\tTextureFileName\t"${e.texPath || (effectPath + effectName.toLowerCase() + '.tga')}"`);
    lines.push(`\t\tBlendType\t${e.blend === 'add' ? 1 : 0}`);
    lines.push(`\t\tPosition\t${fmt(0, precision)}\t${fmt(0, precision)}\t${fmt(0, precision)}`);
    lines.push(`\t\tScale\t\t${fmt(e.sizeX, precision)}\t${fmt(e.sizeNonUniform ? e.sizeY : e.sizeX, precision)}\t${fmt(e.sizeX, precision)}`);
    lines.push(`\t\tRotation\t${fmt(0, precision)}\t${fmt(0, precision)}\t${fmt(0, precision)}`);
    lines.push(`\t\tLoop\t\t${e.loop}`);
    lines.push(`\t\tLifeCycle\t${fmt(e.cycle, precision)}`);
    lines.push(`\t\tVisible\t\t1`);
    lines.push(`\t\tParticleEffectFile\t"${effectPath}${effectName}_${idx}.mse"`);
    lines.push('\t}');
    lines.push('');
  }

  lines.push(`\tAttachBone\t"${bone}"`);

  const bndSpd = Math.max(1, ...emitters.map(e => (e.speed || 0) + Math.abs(e.speedRnd || 0)));
  const bndLife = Math.max(0.5, ...emitters.map(e => (e.life || 1) + Math.abs(e.lifeRnd || 0)));
  const bndSz = Math.max(0.5, ...emitters.map(e => e.sizeX || 1));
  const bndR = Math.max(1.5, bndSpd * bndLife * 0.65 + bndSz * 0.5);
  lines.push(`\tBoundingRadius\t${fmt(bndR, precision)}`);
  lines.push('}');

  return lines.join('\n');
}

function writePreserveMSE(emitters: Emitter[], options?: Partial<CanonicalWriterOptions>): string {
  return writeCanonicalMSE(emitters, { ...options, mode: 'canonical' });
}
