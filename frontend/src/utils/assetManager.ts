// frontend/src/utils/assetManager.ts
import { useAppStore } from '../store/useAppStore';
import type { BlendType, Emitter, RotType, ShapeType } from '../types';
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

  const shapeVal = emitterProperty ? readNumberProperty(emitterProperty, 'EmitterShape', 0) : 0;
  const shapeName: Record<number, string> = { 0: 'point', 1: 'disc', 2: 'box', 3: 'sphere', 4: 'cone' };
  const emitterRadius = emitterProperty ? readNumberProperty(emitterProperty, 'EmittingRadius', 0.35) : 0.35;

  const colorRList = particleProperty ? findChild(particleProperty, 'List', 'TimeEventColorRed') : undefined;
  const colorGList = particleProperty ? findChild(particleProperty, 'List', 'TimeEventColorGreen') : undefined;
  const colorBList = particleProperty ? findChild(particleProperty, 'List', 'TimeEventColorBlue') : undefined;
  const colorAList = particleProperty ? findChild(particleProperty, 'List', 'TimeEventAlpha') : undefined;

  function listToColorKeys(rList: MSEBlock | undefined, gList: MSEBlock | undefined, bList: MSEBlock | undefined, aList: MSEBlock | undefined): { t: number; r: number; g: number; b: number; a: number }[] {
    const rowsR = rList?.children.filter((c) => c.type === 'Row' && c.values && c.values.length >= 2) ?? [];
    const rowsG = gList?.children.filter((c) => c.type === 'Row' && c.values && c.values.length >= 2) ?? [];
    const rowsB = bList?.children.filter((c) => c.type === 'Row' && c.values && c.values.length >= 2) ?? [];
    const rowsA = aList?.children.filter((c) => c.type === 'Row' && c.values && c.values.length >= 2) ?? [];
    const allTimes = new Set<number>();
    [...rowsR, ...rowsG, ...rowsB, ...rowsA].forEach((r) => { const t = Number(r.values?.[0]); if (Number.isFinite(t)) allTimes.add(t); });
    if (allTimes.size === 0) return [];
    const times = [...allTimes].sort((a, b) => a - b);
    return times.map((t) => {
      const getVal = (rows: MSEBlock[]) => { const r = rows.find((x) => Math.abs(Number(x.values?.[0]) - t) < 0.0001); return r ? Number(r.values?.[1]) : 1; };
      return { t, r: getVal(rowsR), g: getVal(rowsG), b: getVal(rowsB), a: getVal(rowsA) };
    });
  }

  return {
    name: `${group.name}_${index + 1}`,
    maxP: emitterProperty ? readNumberProperty(emitterProperty, 'MaxEmissionCount', 256) : 256,
    cycle: emitterProperty ? readNumberProperty(emitterProperty, 'CycleLength', 2) : 2,
    loop: emitterProperty ? (readNumberProperty(emitterProperty, 'CycleLoopEnable', 1) ? 1 : 0) : 1,
    rate: emitterProperty ? readListNumber(emitterProperty, 'TimeEventEmissionCountPerSecond', 60) : 60,
    life: emitterProperty ? readListNumber(emitterProperty, 'TimeEventLifeTime', 1.2) : 1.2,
    speed: emitterProperty ? readListNumber(emitterProperty, 'TimeEventEmittingVelocity', 0) : 0,
    gravity: particleProperty ? readListNumber(particleProperty, 'TimeEventGravity', 0) : 0,
    drag: particleProperty ? readListNumber(particleProperty, 'TimeEventAirResistance', 0) : 0,
    sizeX: emitterProperty ? Math.max(0.05, readListNumber(emitterProperty, 'TimeEventSizeX', 32) / 64) : 1,
    sizeY: emitterProperty ? Math.max(0.05, readListNumber(emitterProperty, 'TimeEventSizeY', 32) / 64) : 1,
    shapeRadius: emitterRadius,
    shape: (shapeName[shapeVal] || 'point') as ShapeType,
    blend: srcBlend === 5 && destBlend === 2 ? 'add' as BlendType : srcBlend === 2 && destBlend === 5 ? 'modulate' as BlendType : 'alpha' as BlendType,
    rotType: rotationType === 0 ? 'NONE' as RotType : rotationType === 2 ? 'SPIN' as RotType : 'RANDOM' as RotType,
    spin: particleProperty ? readNumberProperty(particleProperty, 'RotationSpeed', 0) : 0,
    texPath: texturePath,
    builtinTex: texturePath ? 'circle' : 'spark',
    alphaCurve: particleProperty ? rowsToCurve(findChild(particleProperty, 'List', 'TimeEventAlpha'), [{ t: 0, v: 1 }, { t: 1, v: 0 }]) : undefined,
    sizeCurve: particleProperty ? rowsToCurve(findChild(particleProperty, 'List', 'TimeEventScaleX'), [{ t: 0, v: 1 }, { t: 1, v: 0.2 }]) : undefined,
    colorKeys: listToColorKeys(colorRList, colorGList, colorBList, colorAList),
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
  const fmt = (value: number): string => value.toFixed(6);

  function shapeCode(shape: string): number {
    const map: Record<string, number> = {
      point: 0, ring: 1, disc: 1, box: 2, sphere: 3, spherevol: 3, cone: 4,
    };
    return map[shape] ?? 0;
  }

  function emitEdgeFlag(emitSurface: string): number {
    return emitSurface === 'edge' ? 1 : 0;
  }

  function srcBlendCode(blend: string): number {
    return blend === 'add' ? 5 : blend === 'modulate' ? 2 : 3;
  }

  function destBlendCode(blend: string): number {
    return blend === 'add' ? 2 : blend === 'modulate' ? 5 : 3;
  }

  function rotTypeCode(rotType: string): number {
    return rotType === 'NONE' ? 0 : rotType === 'SPIN' ? 2 : 4;
  }

  function texAniTypeCode(uvAnim: string): number {
    return uvAnim === 'rand' ? 3 : uvAnim === 'once' ? 2 : uvAnim === 'loop' ? 1 : 0;
  }

  function emitList(name: string, rows: string[], empty = false): void {
    if (empty || rows.length === 0) {
      o += `        List ${name}\n        {\n        }\n`;
      return;
    }
    o += `        List ${name}\n        {\n`;
    rows.forEach((r) => { o += `            ${r}\n`; });
    o += '        }\n';
  }

  function emitTimeEventRows(values: { t: number; v: number }[]): string[] {
    if (!values || values.length === 0) return [];
    const sorted = [...values].sort((a, b) => a.t - b.t);
    return sorted.map((p) => `${fmt(p.t)} ${fmt(p.v)}`);
  }

  function emitColorRows(keys: { t: number; r: number; g: number; b: number; a: number }[], channel: 'r' | 'g' | 'b' | 'a'): string[] {
    if (!keys || keys.length === 0) return [];
    const sorted = [...keys].sort((a, b) => a.t - b.t);
    return sorted.map((k) => `${fmt(k.t)} ${fmt(k[channel])}`);
  }

  function i(value: number): string {
    return String(Math.round(value));
  }

  let o = 'BoundingSphereRadius   50.000000\nBoundingSpherePosition 0.000000 0.000000 0.000000\n';

  emitters.forEach((emitter) => {
    const sc = shapeCode(emitter.shape);
    o += '\nGroup Particle\n{\n';
    o += `    StartTime           ${fmt(emitter.delay)}\n`;
    o += '    List TimeEventPosition\n    {\n';
    o += `        0.000000 "MOVING_TYPE_DIRECT" 0.000000 0.000000 0.000000\n`;
    o += '    }\n';
    o += '    \n    Group EmitterProperty\n    {\n';
    o += `        MaxEmissionCount        ${Math.min(emitter.maxP, 2048)}\n`;
    o += '\n';
    o += `        CycleLength             ${fmt(emitter.cycle)}\n`;
    o += `        CycleLoopEnable         ${emitter.loop ? 1 : 0}\n`;
    o += '        LoopCount               0\n';
    o += '\n';
    o += `        EmitterShape            ${sc}\n`;
    o += '        EmitterAdvancedType     0\n';
    if (sc === 2) {
      const r = Math.max(0.01, emitter.shapeRadius ?? 0.35);
      o += `        EmittingSize            ${fmt(r)} ${fmt(r)} ${fmt(r)}\n`;
    } else if (sc !== 0) {
      o += `        EmittingRadius          ${fmt(Math.max(0.01, emitter.shapeRadius ?? 0.35))}\n`;
    }
    o += `        EmitterEmitFromEdgeFlag  ${emitEdgeFlag(emitter.emitSurface)}\n`;
    o += `        EmittingDirection       ${fmt(emitter.dirYaw)} ${fmt(emitter.dirPitch)} 0.000000\n`;
    o += '\n';
    emitList('TimeEventEmittingSize', ['0.000000 0.000000']);
    emitList('TimeEventEmittingAngularVelocity', [`0.000000 ${fmt(emitter.spin)}`]);
    emitList('TimeEventEmittingDirectionX', ['0.000000 0.000000']);
    emitList('TimeEventEmittingDirectionY', ['0.000000 0.000000']);
    emitList('TimeEventEmittingDirectionZ', ['0.000000 0.000000']);
    emitList('TimeEventEmittingVelocity', [`0.000000 ${fmt(emitter.speed)}`]);
    emitList('TimeEventEmissionCountPerSecond', [`0.000000 ${fmt(emitter.rate)}`]);
    emitList('TimeEventLifeTime', [`0.000000 ${fmt(emitter.life)}`]);
    emitList('TimeEventSizeX', [`0.000000 ${fmt(emitter.sizeX * 64)}`]);
    emitList('TimeEventSizeY', [`0.000000 ${fmt((emitter.sizeNonUniform ? emitter.sizeY : emitter.sizeX) * 64)}`]);
    o += '    }\n';
    o += '    \n    Group ParticleProperty\n    {\n';
    o += `        SrcBlendType                ${srcBlendCode(emitter.blend)}\n`;
    o += `        DestBlendType               ${destBlendCode(emitter.blend)}\n`;
    o += '        ColorOperationType          4\n';
    o += '        BillboardType               1\n';
    o += `        RotationType                ${rotTypeCode(emitter.rotType)}\n`;
    o += `        RotationSpeed               ${fmt(emitter.spin)}\n`;
    o += `        RotationRandomStartingBegin ${i(emitter.initRot)}\n`;
    o += `        RotationRandomStartingEnd   ${i(emitter.initRot + emitter.initRotRnd)}\n`;
    o += '\n';
    o += '        AttachEnable                0\n';
    o += '        StretchEnable               0\n';
    o += '\n';
    o += `        TexAniType                  ${texAniTypeCode(emitter.uvAnim)}\n`;
    o += `        TexAniDelay                 ${fmt(1 / Math.max(1, emitter.animFPS))}\n`;
    o += '        TexAniRandomStartFrameEnable 0\n';
    o += '\n';

    const gravRows = emitTimeEventRows([{ t: 0, v: emitter.gravity }]);
    const dragRows = emitTimeEventRows([{ t: 0, v: emitter.drag }]);
    emitList('TimeEventGravity', gravRows, emitter.gravity === 0);
    emitList('TimeEventAirResistance', dragRows, emitter.drag === 0);

    const sizeCurve = emitter.sizeCurve?.length ? [...emitter.sizeCurve].sort((a, b) => a.t - b.t) : null;
    const sr = sizeCurve ? emitTimeEventRows(sizeCurve) : [];
    const defaultSR = sizeCurve === null;
    emitList('TimeEventScaleX', sr, defaultSR);
    emitList('TimeEventScaleY', sr, defaultSR);

    const colorKeys = emitter.colorKeys?.length ? [...emitter.colorKeys].sort((a, b) => a.t - b.t) : null;
    if (colorKeys) {
      emitList('TimeEventColorRed', emitColorRows(colorKeys, 'r'), false);
      emitList('TimeEventColorGreen', emitColorRows(colorKeys, 'g'), false);
      emitList('TimeEventColorBlue', emitColorRows(colorKeys, 'b'), false);
    } else {
      emitList('TimeEventColorRed', [], true);
      emitList('TimeEventColorGreen', [], true);
      emitList('TimeEventColorBlue', [], true);
    }

    const alphaCurve = emitter.alphaCurve?.length ? [...emitter.alphaCurve].sort((a, b) => a.t - b.t) : null;
    const ar = alphaCurve ? emitTimeEventRows(alphaCurve) : [];
    emitList('TimeEventAlpha', ar, alphaCurve === null);

    emitList('TimeEventRotation', ['0.000000 0.000000']);

    o += `        List TextureFiles\n        {\n`;
    o += `            "${emitter.texPath || `${emitter.name.toLowerCase()}.dds`}"\n`;
    o += `        }\n`;
    o += '    }\n';
    o += '}\n';
  });

  return o;
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
