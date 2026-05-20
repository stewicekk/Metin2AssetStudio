import type { ExportPlugin, ExportResult } from '../types';
import type { Emitter } from '../../types';
import { buildMDE } from '../../utils/exporter';

export const MdeExportPlugin: ExportPlugin = {
  id: 'mde-export',
  name: 'MDE Export (CEffectMesh)',
  description: 'Exports as Metin2 .mde format (CEffectMesh)',
  extensions: ['mde'],
  version: '1.0.0',

  export(emitters: Emitter[], options: Record<string, unknown>): ExportResult {
    const data = buildMDE(emitters, {
      effectName: options.effectName as string,
      effectPath: options.effectPath as string,
      attachBone: options.attachBone as string,
      precision: options.precision as number ?? 4,
    });
    return { data, ext: 'mde', mimeType: 'text/plain' };
  },

  validate(emitters: Emitter[]): string[] {
    const issues: string[] = [];
    if (emitters.length === 0) issues.push('No emitters to export');
    emitters.forEach((e, i) => {
      if (!e.name) issues.push(`Emitter #${i} has no name`);
    });
    return issues;
  },
};
