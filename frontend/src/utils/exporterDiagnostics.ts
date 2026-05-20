import type { Emitter, CurvePoint, ColorKey } from '../types';

export interface ExportDiagnostic {
  field: string;
  severity: 'info' | 'warn' | 'error';
  message: string;
  emitterName: string;
}

function hasDefaultCurve(curve: CurvePoint[] | undefined, expected: CurvePoint[]): boolean {
  if (!curve || curve.length === 0) return true;
  if (curve.length !== expected.length) return false;
  return curve.every((pt, i) => pt.t === expected[i].t && pt.v === expected[i].v);
}

function hasDefaultColorKeys(keys: ColorKey[] | undefined): boolean {
  if (!keys || keys.length === 0) return true;
  if (keys.length === 2) {
    const [k0, k1] = keys;
    if (k0.t === 0 && k0.r === 1 && k0.g === 1 && k0.b === 1 && k0.a === 1 &&
        k1.t === 1 && k1.r === 0.2 && k1.g === 0.1 && k1.b === 0.05 && k1.a === 0) {
      return true;
    }
  }
  return false;
}

export function analyzeExportCompatibility(emitters: Emitter[]): ExportDiagnostic[] {
  const diags: ExportDiagnostic[] = [];

  for (const e of emitters) {
    const emitterName = e.name;

    if (e.turb !== 0) {
      diags.push({
        field: 'turb', severity: 'warn', emitterName,
        message: `Turbulence (${e.turb.toFixed(2)}) is preview-only and will NOT be exported to MSE/EFF/MDE`,
      });
    }

    if (e.velStretch !== 0) {
      diags.push({
        field: 'velStretch', severity: 'warn', emitterName,
        message: `Velocity stretch (${e.velStretch.toFixed(2)}) is preview-only and will NOT be exported`,
      });
    }

    if (e.windX !== 0 || e.windZ !== 0) {
      diags.push({
        field: 'windX', severity: 'info', emitterName,
        message: `Wind (${e.windX.toFixed(2)}, ${e.windZ.toFixed(2)}) is preview-only and will NOT be exported`,
      });
    }

    if (e.emitSurface !== 'none') {
      diags.push({
        field: 'emitSurface', severity: 'info', emitterName,
        message: `Surface emission (${e.emitSurface}) is preview-only and will NOT be exported`,
      });
    }

    if (e.uvScrollX !== 0 || e.uvScrollY !== 0) {
      diags.push({
        field: 'uvScrollX', severity: 'info', emitterName,
        message: `UV scroll (${e.uvScrollX.toFixed(2)}, ${e.uvScrollY.toFixed(2)}) exported as comment — not supported by game engine`,
      });
    }

    if (hasDefaultColorKeys(e.colorKeys)) {
      diags.push({
        field: 'colorKeys', severity: 'info', emitterName,
        message: 'No custom color keys set — will use default white-to-dark gradient',
      });
    }

    if (hasDefaultCurve(e.sizeCurve, [{ t: 0, v: 1 }, { t: 0.5, v: 1 }, { t: 1, v: 0.2 }])) {
      diags.push({
        field: 'sizeCurve', severity: 'info', emitterName,
        message: 'No custom size curve set — will use default fade-out curve',
      });
    }

    if (hasDefaultCurve(e.alphaCurve, [{ t: 0, v: 1 }, { t: 0.8, v: 0.9 }, { t: 1, v: 0 }])) {
      diags.push({
        field: 'alphaCurve', severity: 'info', emitterName,
        message: 'No custom alpha curve set — will use default fade-out curve',
      });
    }

    if (hasDefaultCurve(e.speedCurve, [{ t: 0, v: 1 }, { t: 1, v: 1 }])) {
      diags.push({
        field: 'speedCurve', severity: 'info', emitterName,
        message: 'No custom speed curve set — will use flat default',
      });
    }

    if (hasDefaultCurve(e.spinCurve, [{ t: 0, v: 1 }, { t: 1, v: 1 }])) {
      diags.push({
        field: 'spinCurve', severity: 'info', emitterName,
        message: 'No custom spin curve set — will use flat default',
      });
    }

    if (e.shape === 'spherevol') {
      diags.push({
        field: 'shape', severity: 'info', emitterName,
        message: 'Shape "spherevol" maps to SPHERE in export (volume emission lost)',
      });
    }

    if (e.shape === 'ring') {
      diags.push({
        field: 'shape', severity: 'info', emitterName,
        message: 'Shape "ring" maps to DISC in export',
      });
    }

    if (e.maxP > 2048) {
      diags.push({
        field: 'maxP', severity: 'warn', emitterName,
        message: `Max particles ${e.maxP} exceeds 2048 — will be clamped to 2048`,
      });
    }

    if (e.maxP <= 0) {
      diags.push({
        field: 'maxP', severity: 'error', emitterName,
        message: 'Max particles is 0 — no particles will be emitted',
      });
    }

    if (e.rate <= 0 && e.burst <= 0) {
      diags.push({
        field: 'rate', severity: 'warn', emitterName,
        message: 'Birth rate and burst count are both zero — nothing will be emitted',
      });
    }

    if (e.blend === 'modulate') {
      diags.push({
        field: 'blend', severity: 'info', emitterName,
        message: 'Modulate blend type may not render correctly in all game clients',
      });
    }

    if (e.groundBounce && e.bounceFac === 0) {
      diags.push({
        field: 'bounceFac', severity: 'warn', emitterName,
        message: 'Ground bounce enabled but bounce factor is 0 — particles will stop on contact',
      });
    }

    if (e.gravity === 0 && e.drag === 0 && e.speed === 0) {
      diags.push({
        field: 'gravity', severity: 'info', emitterName,
        message: 'Zero gravity, drag, and speed — particles will remain at spawn position',
      });
    }

    if (e.life <= 0) {
      diags.push({
        field: 'life', severity: 'error', emitterName,
        message: 'Particle lifetime is zero or negative — particles will die instantly',
      });
    }

    if (e.cycle > 0 && e.life > e.cycle) {
      diags.push({
        field: 'life', severity: 'warn', emitterName,
        message: `Particle life (${e.life.toFixed(2)}s) exceeds cycle (${e.cycle.toFixed(2)}s) — particles live beyond effect loop`,
      });
    }
  }

  if (emitters.length === 0) {
    diags.push({
      field: 'emitters', severity: 'info', emitterName: 'root',
      message: 'No emitters to export — output will be empty',
    });
  }

  return diags;
}

export function formatDiagnostics(diags: ExportDiagnostic[]): string {
  if (diags.length === 0) return 'No issues found.';

  const lines: string[] = [];
  const severityOrder = { error: 0, warn: 1, info: 2 };

  const sorted = [...diags].sort((a, b) => {
    const sa = severityOrder[a.severity];
    const sb = severityOrder[b.severity];
    if (sa !== sb) return sa - sb;
    return a.emitterName.localeCompare(b.emitterName);
  });

  const counts = { error: 0, warn: 0, info: 0 };
  for (const d of diags) counts[d.severity]++;

  lines.push(`Export analysis: ${counts.error} errors, ${counts.warn} warnings, ${counts.info} notes\n`);

  for (const d of sorted) {
    const tag = d.severity === 'error' ? '✗' : d.severity === 'warn' ? '!' : 'i';
    lines.push(`  [${tag}] ${d.emitterName}: ${d.message}`);
  }

  return lines.join('\n');
}
