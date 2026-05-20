import { Router } from 'express';

const router = Router();

router.post('/mse', (req, res) => {
  const { emitters, options } = req.body;
  if (!emitters || !Array.isArray(emitters)) {
    return res.status(400).json({ error: 'Emitters array required' });
  }
  if (emitters.length > 512) {
    return res.status(400).json({ error: 'Too many emitters (max 512)' });
  }

  const precision = options?.precision ?? 4;
  const effectName = options?.effectName || 'MyEffect';

  let t = `# Metin2 Asset Studio PRO — MSE Export\n# ${new Date().toLocaleDateString()}\n\n`;
  t += `EffectName\t"${effectName}"\n`;
  t += `ParticleSystemCount\t${emitters.length}\n\n`;

  emitters.forEach((e, idx) => {
    t += `# --- System ${idx + 1}: ${e.name} ---\n`;
    t += `StartParticleSystem\n`;
    t += `\tSystemName\t"${e.name}"\n`;
    t += `\tBirthRate\t${e.rate?.toFixed(precision) ?? '60.0000'}\n`;
    t += `\tMaxParticleCount\t${Math.min(e.maxP || 512, 2048)}\n`;
    t += `\tLifeTime\t${(e.life ?? 1).toFixed(precision)}\n`;
    t += `\tLifeTimeRnd\t${(e.lifeRnd ?? 0).toFixed(precision)}\n`;
    t += `\tBurstCount\t${e.burst ?? 0}\n`;
    t += `\tStartDelay\t${(e.delay ?? 0).toFixed(precision)}\n`;
    t += `\tLoop\t${e.loop ? 'TRUE' : 'FALSE'}\n`;
    t += `\tLifeCycle\t${(e.cycle ?? 2).toFixed(precision)}\n`;
    t += `\tCoordType\t${(e.coordType || 'WORLD').toUpperCase()}\n`;
    t += `\tRotationType\t${(e.rotType || 'NONE').toUpperCase()}\n`;
    t += `\tSpawnShape\t${getShapeCode(e.shape)}\n`;
    t += `\tSpawnRadius\t${(e.shapeRadius || 0.35).toFixed(precision)}\n`;
    t += `\tSpeed\t${(e.speed ?? 1).toFixed(precision)}\n`;
    t += `\tSpeedRnd\t${(e.speedRnd ?? 0).toFixed(precision)}\n`;
    t += `\tSpread\t${(e.spread ?? 0).toFixed(precision)}\n`;
    t += `\tDirectionYaw\t${(e.dirYaw ?? 0).toFixed(precision)}\n`;
    t += `\tDirectionPitch\t${(e.dirPitch ?? 0).toFixed(precision)}\n`;
    t += `\tGravityVector\t0.0000\t${(e.gravity ?? 0).toFixed(precision)}\t0.0000\n`;
    t += `\tAirResistance\t${(e.drag ?? 0).toFixed(precision)}\n`;
    if (e.groundBounce) t += `\tGroundBounce\tTRUE\n\tBounceFactor\t${(e.bounceFac || 0.4).toFixed(precision)}\n`;
    t += `\tSizeX\t${(e.sizeX ?? 0.5).toFixed(precision)}\n`;
    t += `\tSizeY\t${(e.sizeNonUniform ? (e.sizeY ?? e.sizeX ?? 0.5) : (e.sizeX ?? 0.5)).toFixed(precision)}\n`;
    t += `\tSizeRnd\t${(e.sizeRnd ?? 0).toFixed(precision)}\n`;
    t += `\tRotMin\t${(e.initRot ?? 0).toFixed(precision)}\n`;
    t += `\tRotMax\t${((e.initRot ?? 0) + (e.initRotRnd ?? 0)).toFixed(precision)}\n`;
    t += `\tRotSpeedMin\t${((e.spin ?? 0) - Math.abs(e.spinRnd ?? 0)).toFixed(precision)}\n`;
    t += `\tRotSpeedMax\t${((e.spin ?? 0) + Math.abs(e.spinRnd ?? 0)).toFixed(precision)}\n`;
    t += `\tBlendType\t${getBlendCode(e.blend)}\n`;
    t += `\tTextureFileName\t"${e.texPath || (effectName.toLowerCase() + '_' + (e.name || 'system').toLowerCase() + '.tga')}"\n`;
    t += `\tTextureAnimType\t${getAnimType(e.uvAnim)}\n`;
    t += `\tTextureAnimFrame\t${e.sheetCols ?? 1}\t${e.sheetRows ?? 1}\n`;
    t += `\tTextureAnimFPS\t${e.animFPS ?? 15}\n`;

    const colorKeys = e.colorKeys || [{ t: 0, r: 1, g: 1, b: 1, a: 1 }, { t: 1, r: 0.2, g: 0.1, b: 0.05, a: 0 }];
    t += `\tColorKeyframeCount\t${colorKeys.length}\n`;
    [...colorKeys].sort((a, b) => a.t - b.t).forEach(k => {
      t += `\tColorKeyframe\t${k.t.toFixed(precision)}\t${Math.round(k.r * 255)}\t${Math.round(k.g * 255)}\t${Math.round(k.b * 255)}\t${Math.round(k.a * 255)}\n`;
    });

    const sizeCurve = e.sizeCurve || [{ t: 0, v: 1 }, { t: 0.5, v: 1 }, { t: 1, v: 0.2 }];
    t += `\tSizeCurveCount\t${sizeCurve.length}\n`;
    [...sizeCurve].sort((a, b) => a.t - b.t).forEach(pt => t += `\tSizeCurve\t${pt.t.toFixed(precision)}\t${pt.v.toFixed(precision)}\n`);

    const alphaCurve = e.alphaCurve || [{ t: 0, v: 1 }, { t: 0.8, v: 0.9 }, { t: 1, v: 0 }];
    t += `\tAlphaCurveCount\t${alphaCurve.length}\n`;
    [...alphaCurve].sort((a, b) => a.t - b.t).forEach(pt => t += `\tAlphaCurve\t${pt.t.toFixed(precision)}\t${pt.v.toFixed(precision)}\n`);

    const speedCurve = e.speedCurve || [{ t: 0, v: 1 }, { t: 1, v: 1 }];
    t += `\tSpeedCurveCount\t${speedCurve.length}\n`;
    [...speedCurve].sort((a, b) => a.t - b.t).forEach(pt => t += `\tSpeedCurve\t${pt.t.toFixed(precision)}\t${pt.v.toFixed(precision)}\n`);

    const spinCurve = e.spinCurve || [{ t: 0, v: 1 }, { t: 1, v: 1 }];
    t += `\tSpinCurveCount\t${spinCurve.length}\n`;
    [...spinCurve].sort((a, b) => a.t - b.t).forEach(pt => t += `\tSpinCurve\t${pt.t.toFixed(precision)}\t${pt.v.toFixed(precision)}\n`);

    t += `EndParticleSystem\n\n`;
  });

  res.json({ content: t, format: 'mse', emitterCount: emitters.length });
});

router.post('/eff', (req, res) => {
  const { emitters, options } = req.body;
  if (!emitters || !Array.isArray(emitters)) {
    return res.status(400).json({ error: 'Emitters array required' });
  }

  let t = `CEffectData\n{\n`;
  emitters.forEach(e => {
    t += `\tCParticleSystemData\n\t{\n`;
    t += `\t\tSystemName\t"${e.name || 'system'}"\n`;
    t += `\t\tMaxParticleCount\t${Math.min(e.maxP || 512, 2048)}\n`;
    t += `\t\tLoop\t${e.loop ? 1 : 0}\n`;
    t += `\t\tBlendType\t${e.blend === 'add' ? 1 : e.blend === 'modulate' ? 2 : 0}\n`;
    t += `\t\tRotationType\t${e.rotType === 'SPIN' ? 2 : e.rotType === 'RANDOM' ? 4 : 0}\n`;
    t += `\t}\n`;
  });
  t += '}\n';

  res.json({ content: t, format: 'eff', emitterCount: emitters.length });
});

function getShapeCode(shape) {
  const map = { point: 'POINT', cone: 'CONE', box: 'BOX', sphere: 'SPHERE', spherevol: 'SPHERE', ring: 'DISC', disc: 'DISC' };
  return map[shape] || 'POINT';
}

function getBlendCode(blend) {
  return blend === 'add' ? 'ADD' : blend === 'modulate' ? 'MODULATE' : 'NORMAL';
}

function getAnimType(uvAnim) {
  if (uvAnim === 'rand') return 3;
  if (uvAnim === 'once') return 2;
  return 1;
}

export default router;
