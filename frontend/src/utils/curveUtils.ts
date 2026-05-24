// frontend/src/utils/curveUtils.ts
import type { ColorKey, CurveInterpolationType, CurvePoint } from '../types';
import { lerp } from './math';

export function sampleCurve(arr: CurvePoint[], t: number, interpolation: CurveInterpolationType = 'linear'): number {
  if (!arr || arr.length === 0) return 1;

  const sorted = arr.slice().sort((a, b) => a.t - b.t);
  if (t <= sorted[0].t) return sorted[0].v;
  if (t >= sorted[sorted.length - 1].t) return sorted[sorted.length - 1].v;

  for (let i = 0; i < sorted.length - 1; i++) {
    if (t >= sorted[i].t && t <= sorted[i + 1].t) {
      const dt = sorted[i + 1].t - sorted[i].t;
      const tt = dt > 0.000001 ? (t - sorted[i].t) / dt : 0.5;
      if (interpolation === 'smooth') {
        const ss = tt * tt * (3 - 2 * tt);
        return lerp(sorted[i].v, sorted[i + 1].v, ss);
      }
      return lerp(sorted[i].v, sorted[i + 1].v, tt);
    }
  }
  return sorted[sorted.length - 1].v;
}

export function sampleColor(keys: ColorKey[], t: number): { r: number; g: number; b: number; a: number; } {
  const sorted = keys.slice().sort((a, b) => a.t - b.t);
  if (!sorted.length) return { r: 1, g: 1, b: 1, a: 1 };
  if (t <= sorted[0].t) return { ...sorted[0] };
  if (t >= sorted[sorted.length - 1].t) return { ...sorted[sorted.length - 1] };

  for (let i = 0; i < sorted.length - 1; i++) {
    if (t >= sorted[i].t && t <= sorted[i + 1].t) {
      const dt = sorted[i + 1].t - sorted[i].t;
      const tt = dt > 0.000001 ? (t - sorted[i].t) / dt : 0.5;
      return {
        r: lerp(sorted[i].r, sorted[i + 1].r, tt),
        g: lerp(sorted[i].g, sorted[i + 1].g, tt),
        b: lerp(sorted[i].b, sorted[i + 1].b, tt),
        a: lerp(sorted[i].a, sorted[i + 1].a, tt)
      };
    }
  }
  return { ...sorted[sorted.length - 1] };
}
