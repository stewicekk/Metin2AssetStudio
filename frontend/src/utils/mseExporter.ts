import type { Emitter } from '../types';

export interface MSEExportOptions {
  precision: number;
  effectName: string;
}

const defaultOptions: MSEExportOptions = {
  precision: 4,
  effectName: 'MyEffect',
};

function fmt(value: number, _precision: number = 6): string {
  return value.toFixed(6);
}

function shapeCode(shape: string): string {
  const map: Record<string, string> = {
    point: 'POINT', cone: 'CONE', box: 'BOX',
    sphere: 'SPHERE', spherevol: 'SPHERE',
    ring: 'DISC', disc: 'DISC',
  };
  return map[shape] || 'POINT';
}

export function buildMSE(emitters: Emitter[], options: Partial<MSEExportOptions> = {}): string {
  const opts = { ...defaultOptions, ...options };
  const { precision, effectName } = opts;
  
  let t = `# Metin2 Effect Studio PRO v3.3 — MSE Export\n# ${new Date().toLocaleDateString()}\n\n`;
  t += `EffectName\t"${effectName}"\n`;
  t += `ParticleSystemCount\t${emitters.length}\n\n`;
  
  emitters.forEach((e, idx) => {
    t += `# --- Particle System ${idx + 1}: ${e.name} ---\n`;
    t += `StartParticleSystem\n`;
    t += `\tSystemName\t"${e.name}"\n`;
    t += `\tBirthRate\t${fmt(e.rate, precision)}\n`;
    t += `\tMaxParticleCount\t${Math.min(e.maxP, 2048)}\n`;
    t += `\tLifeTime\t${fmt(e.life, precision)}\n`;
    t += `\tLifeTimeRnd\t${fmt(e.lifeRnd, precision)}\n`;
    t += `\tBurstCount\t${e.burst}\n`;
    t += `\tStartDelay\t${fmt(e.delay, precision)}\n`;
    t += `\tLoop\t${e.loop ? 'TRUE' : 'FALSE'}\n`;
    t += `\tLifeCycle\t${fmt(e.cycle, precision)}\n`;
    t += `\tCoordType\t${(e.coordType || 'WORLD').toUpperCase()}\n`;
    t += `\tRotationType\t${(e.rotType || 'RANDOM').toUpperCase()}\n`;
    t += `\tSpawnShape\t${shapeCode(e.shape)}\n`;
    t += `\tSpawnRadius\t${fmt(e.shapeRadius || 0.35, precision)}\n`;
    t += `\tSpeed\t${fmt(e.speed, precision)}\n`;
    t += `\tSpeedRnd\t${fmt(e.speedRnd, precision)}\n`;
    t += `\tSpread\t${fmt(e.spread, precision)}\n`;
    t += `\tDirectionYaw\t${fmt(e.dirYaw, precision)}\n`;
    t += `\tDirectionPitch\t${fmt(e.dirPitch, precision)}\n`;
    t += `\tGravityVector\t0.0000\t${fmt(e.gravity, precision)}\t0.0000\n`;
    t += `\tAirResistance\t${fmt(e.drag, precision)}\n`;
    
    if (e.groundBounce) {
      t += `\tGroundBounce\tTRUE\n`;
      t += `\tBounceFactor\t${fmt(e.bounceFac || 0.4, precision)}\n`;
    }
    if (e.attractorStr !== 0) {
      t += `\tAttractorStrength\t${fmt(e.attractorStr, precision)}\n`;
      t += `\tAttractorY\t${fmt(e.attractorY || 0.5, precision)}\n`;
    }
    
    t += `\tSizeX\t${fmt(e.sizeX, precision)}\n`;
    t += `\tSizeY\t${fmt(e.sizeNonUniform ? e.sizeY : e.sizeX, precision)}\n`;
    t += `\tSizeRnd\t${fmt(e.sizeRnd, precision)}\n`;
    t += `\tRotMin\t${fmt(e.initRot, precision)}\n`;
    t += `\tRotMax\t${fmt(e.initRot + e.initRotRnd, precision)}\n`;
    t += `\tRotSpeedMin\t${fmt(e.spin - Math.abs(e.spinRnd), precision)}\n`;
    t += `\tRotSpeedMax\t${fmt(e.spin + Math.abs(e.spinRnd), precision)}\n`;
    
    t += `\tBlendType\t${e.blend === 'add' ? 1 : e.blend === 'modulate' ? 2 : 0}\n`;
    
    const texPath = e.texPath || (effectName.toLowerCase() + '_' + e.name.toLowerCase() + '.tga');
    t += `\tTextureFileName\t"${texPath}"\n`;
    t += `\tTextureAnimType\t${e.uvAnim === 'rand' ? 3 : e.uvAnim === 'once' ? 2 : 1}\n`;
    t += `\tTextureAnimFrame\t${e.sheetCols}\t${e.sheetRows}\n`;
    t += `\tTextureAnimFPS\t${e.animFPS}\n`;
    
    if (e.uvScrollX !== 0 || e.uvScrollY !== 0) {
      t += `\t# UVScrollX\t${fmt(e.uvScrollX, precision)}\n`;
      t += `\t# UVScrollY\t${fmt(e.uvScrollY, precision)}\n`;
    }
    
    const colorKeys = e.colorKeys || [{ t: 0, r: 1, g: 1, b: 1, a: 1 }, { t: 1, r: 0.2, g: 0.1, b: 0.05, a: 0 }];
    t += `\tColorKeyframeCount\t${colorKeys.length}\n`;
    [...colorKeys].sort((a, b) => a.t - b.t).forEach(k => {
      t += `\tColorKeyframe\t${fmt(k.t, precision)}\t${Math.round(k.r * 255)}\t${Math.round(k.g * 255)}\t${Math.round(k.b * 255)}\t${Math.round(k.a * 255)}\n`;
    });
    
    const sizeCurve = e.sizeCurve || [{ t: 0, v: 1 }, { t: 0.5, v: 1 }, { t: 1, v: 0.2 }];
    t += `\tSizeCurveCount\t${sizeCurve.length}\n`;
    [...sizeCurve].sort((a, b) => a.t - b.t).forEach(pt => {
      t += `\tSizeCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}\n`;
    });
    
    const alphaCurve = e.alphaCurve || [{ t: 0, v: 1 }, { t: 0.8, v: 0.9 }, { t: 1, v: 0 }];
    t += `\tAlphaCurveCount\t${alphaCurve.length}\n`;
    [...alphaCurve].sort((a, b) => a.t - b.t).forEach(pt => {
      t += `\tAlphaCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}\n`;
    });
    
    const speedCurve = e.speedCurve || [{ t: 0, v: 1 }, { t: 1, v: 1 }];
    t += `\tSpeedCurveCount\t${speedCurve.length}\n`;
    [...speedCurve].sort((a, b) => a.t - b.t).forEach(pt => {
      t += `\tSpeedCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}\n`;
    });
    
    const spinCurve = e.spinCurve || [{ t: 0, v: 1 }, { t: 1, v: 1 }];
    t += `\tSpinCurveCount\t${spinCurve.length}\n`;
    [...spinCurve].sort((a, b) => a.t - b.t).forEach(pt => {
      t += `\tSpinCurve\t${fmt(pt.t, precision)}\t${fmt(pt.v, precision)}\n`;
    });
    
    t += `EndParticleSystem\n\n`;
  });
  
  return t;
}