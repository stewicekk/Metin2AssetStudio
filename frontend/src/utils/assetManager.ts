// frontend/src/utils/assetManager.ts
import { useAppStore } from '../store/useAppStore';
import type { Emitter } from '../types';
import { parseMSEAsync } from './asyncParser';
import { exportMSE, findChild, readListNumber, readNumberProperty, type MSEBlock } from '../core/mseParser';
import { toast } from './toast';

function rowsToCurve(list: MSEBlock | undefined, fallback: { t: number; v: number }[]) {
  if (!list) return fallback;
  const points = list.children
    .filter((child) => child.type === 'Row' && child.values && child.values.length >= 2)
    .map((child) => ({ t: Number(child.values?.[0]), v: Number(child.values?.[child.values.length - 1]) }))
    .filter((point) => Number.isFinite(point.t) && Number.isFinite(point.v));
  return points.length ? points : fallback;
}

function groupToEmitter(group: MSEBlock, index: number): Partial<Emitter> {
  const emitterProperty = findChild(group, 'Group', 'EmitterProperty');
  const particleProperty = findChild(group, 'Group', 'ParticleProperty');
  const textureList = particleProperty ? findChild(particleProperty, 'List', 'TextureFiles') : undefined;
  const texturePath = textureList?.children.find((child) => child.type === 'Row')?.values?.[0] ?? '';
  const srcBlend = particleProperty ? readNumberProperty(particleProperty, 'SrcBlendType', 5) : 5;
  const destBlend = particleProperty ? readNumberProperty(particleProperty, 'DestBlendType', 2) : 2;
  const rotationType = particleProperty ? readNumberProperty(particleProperty, 'RotationType', 2) : 2;

  return {
    name: `${group.name}_${index + 1}`,
    maxP: emitterProperty ? readNumberProperty(emitterProperty, 'MaxEmissionCount', 256) : 256,
    cycle: emitterProperty ? readNumberProperty(emitterProperty, 'CycleLength', 2) : 2,
    loop: emitterProperty ? (readNumberProperty(emitterProperty, 'CycleLoopEnable', 1) ? 1 : 0) : 1,
    rate: emitterProperty ? readListNumber(emitterProperty, 'TimeEventEmissionCountPerSecond', 60) : 60,
    life: emitterProperty ? readListNumber(emitterProperty, 'TimeEventLifeTime', 1.2) : 1.2,
    sizeX: emitterProperty ? Math.max(0.05, readListNumber(emitterProperty, 'TimeEventSizeX', 32) / 64) : 1,
    sizeY: emitterProperty ? Math.max(0.05, readListNumber(emitterProperty, 'TimeEventSizeY', 32) / 64) : 1,
    blend: srcBlend === 5 && destBlend === 2 ? 'add' : srcBlend === 3 && destBlend === 3 ? 'modulate' : 'alpha',
    rotType: rotationType === 0 ? 'NONE' : rotationType === 2 ? 'SPIN' : 'RANDOM',
    spin: particleProperty ? readNumberProperty(particleProperty, 'RotationSpeed', 0) : 0,
    texPath: texturePath,
    builtinTex: texturePath ? 'circle' : 'spark',
    alphaCurve: particleProperty ? rowsToCurve(findChild(particleProperty, 'List', 'TimeEventAlpha'), [{ t: 0, v: 1 }, { t: 1, v: 0 }]) : undefined,
    sizeCurve: particleProperty ? rowsToCurve(findChild(particleProperty, 'List', 'TimeEventScaleX'), [{ t: 0, v: 1 }, { t: 1, v: 0.2 }]) : undefined,
  };
}

function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildStudioMse(emitters: Emitter[]): string {
  const precision = useAppStore.getState().settings.exportPrec;
  const fmt = (value: number) => value.toFixed(precision);
  let output = 'BoundingSphereRadius   50.000000\nBoundingSpherePosition 0.000000 0.000000 0.000000\n\n';

  emitters.forEach((emitter) => {
    output += 'Group Particle\n{\n';
    output += `    StartTime           ${fmt(emitter.delay)}\n`;
    output += '    List TimeEventPosition\n    {\n        0.000000 "MOVING_TYPE_DIRECT" 0.000000 0.000000 0.000000\n    }\n';
    output += '    \n    Group EmitterProperty\n    {\n';
    output += `        MaxEmissionCount        ${Math.min(emitter.maxP, 2048)}\n`;
    output += `        CycleLength             ${fmt(emitter.cycle)}\n`;
    output += `        CycleLoopEnable         ${emitter.loop ? 1 : 0}\n`;
    output += '        LoopCount               0\n';
    output += '        EmitterShape            0\n        EmitterAdvancedType     0\n        EmitterEmitFromEdgeFlag  0\n';
    output += `        EmittingDirection       ${fmt(emitter.dirYaw)} ${fmt(emitter.dirPitch)} 0.000000\n`;
    output += `        List TimeEventEmissionCountPerSecond\n        {\n            0.000000 ${fmt(emitter.rate)}\n        }\n`;
    output += `        List TimeEventLifeTime\n        {\n            0.000000 ${fmt(emitter.life)}\n        }\n`;
    output += `        List TimeEventSizeX\n        {\n            0.000000 ${fmt(emitter.sizeX * 64)}\n        }\n`;
    output += `        List TimeEventSizeY\n        {\n            0.000000 ${fmt((emitter.sizeNonUniform ? emitter.sizeY : emitter.sizeX) * 64)}\n        }\n`;
    output += '    }\n    \n    Group ParticleProperty\n    {\n';
    output += `        SrcBlendType                 ${emitter.blend === 'add' ? 5 : 3}\n`;
    output += `        DestBlendType                ${emitter.blend === 'add' ? 2 : 3}\n`;
    output += '        ColorOperationType           4\n        BillboardType                1\n';
    output += `        RotationType                 ${emitter.rotType === 'NONE' ? 0 : emitter.rotType === 'SPIN' ? 2 : 4}\n`;
    output += `        RotationSpeed                ${fmt(emitter.spin)}\n`;
    output += '        RotationRandomStartingBegin  0\n        RotationRandomStartingEnd    0\n';
    output += '        AttachEnable                 1\n        StretchEnable                0\n';
    output += `        TexAniType                   ${emitter.uvAnim === 'rand' ? 3 : emitter.uvAnim === 'once' ? 2 : 0}\n`;
    output += `        TexAniDelay                  ${fmt(1 / Math.max(1, emitter.animFPS))}\n        TexAniRandomStartFrameEnable 0\n`;
    output += '        List TimeEventScaleX\n        {\n';
    emitter.sizeCurve.forEach((point) => { output += `            ${fmt(point.t)} ${fmt(point.v)}\n`; });
    output += '        }\n        List TimeEventAlpha\n        {\n';
    emitter.alphaCurve.forEach((point) => { output += `            ${fmt(point.t)} ${fmt(point.v)}\n`; });
    output += '        }\n        List TextureFiles\n        {\n';
    output += `            "${emitter.texPath || `${emitter.name.toLowerCase()}.dds`}"\n`;
    output += '        }\n    }\n}\n';
  });

  return output;
}

export const AssetManager = {
  importMseFile: async (file: File) => {
    const text = await file.text();
    try {
      const data = await parseMSEAsync(text);
      useAppStore.getState().importMse(file.name, data, data.dependencies);

      const importableGroups = data.groups.filter((group) => group.name.toLowerCase() === 'particle');
      importableGroups.forEach((group, idx) => {
        useAppStore.getState().addEmitterFromTemplate(`Particle_${idx + 1}`, groupToEmitter(group, idx));
      });

      if (importableGroups.length === 0) {
        useAppStore.getState().addEmitterFromTemplate(file.name.replace(/\.mse$/i, ''), { texPath: data.dependencies[0]?.path ?? '' });
      }

      toast(`Načteno: ${file.name} (${data.groups.length} group)`);
    } catch (error) {
      toast('Chyba parsování MSE', 'error');
      console.error(error);
    }
  },

  exportCurrentProject: () => {
    const emitters = useAppStore.getState().emitters;
    if (!emitters.length) {
      toast('Není co exportovat', 'warn');
      return;
    }
    downloadText('metin2_asset_studio_export.mse', buildStudioMse(emitters));
    toast('MSE export hotový');
  },

  exportImportedRaw: (effectId: number) => {
    const effect = useAppStore.getState().importedEffects.find((item) => item.uid === effectId);
    if (!effect) return;
    downloadText(effect.name, exportMSE(effect.rawData));
  },
};
