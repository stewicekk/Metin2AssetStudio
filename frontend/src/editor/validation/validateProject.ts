import type { Emitter, MseEffect } from '../../types';

export interface ValidationIssue {
  severity: 'ok' | 'warn' | 'error' | 'info';
  message: string;
}

export function validateProject(emitters: Emitter[], importedEffects: MseEffect[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!emitters.length) issues.push({ severity: 'error', message: 'No emitters in project' });

  emitters.forEach((emitter) => {
    if (emitter.maxP > 2048) issues.push({ severity: 'error', message: `${emitter.name}: maxP ${emitter.maxP} exceeds Metin2 safe cap 2048` });
    else if (emitter.maxP > 1024) issues.push({ severity: 'warn', message: `${emitter.name}: high particle count ${emitter.maxP}` });
    else issues.push({ severity: 'ok', message: `${emitter.name}: particle count OK` });

    if (emitter.life <= 0) issues.push({ severity: 'error', message: `${emitter.name}: life must be > 0` });
    if (!emitter.texPath && !emitter.texDataUrl) issues.push({ severity: 'warn', message: `${emitter.name}: no texture path assigned` });
    if (emitter.texPath && !/\.(dds|tga|bmp|png|jpg)$/i.test(emitter.texPath)) issues.push({ severity: 'warn', message: `${emitter.name}: texture extension is unusual for Metin2` });
    if (emitter.turb > 0) issues.push({ severity: 'info', message: `${emitter.name}: turbulence is preview-only` });
    if (emitter.velStretch > 0) issues.push({ severity: 'info', message: `${emitter.name}: velocity stretch is preview-only` });
  });

  importedEffects.forEach((effect) => {
    const diagnostics = effect.rawData?.diagnostics as string[] | undefined;
    diagnostics?.forEach((message) => issues.push({ severity: 'warn', message: `${effect.name}: ${message}` }));
  });

  if (!issues.some((issue) => issue.severity === 'error' || issue.severity === 'warn')) {
    issues.push({ severity: 'ok', message: 'Project passes current editor validation' });
  }
  return issues;
}
