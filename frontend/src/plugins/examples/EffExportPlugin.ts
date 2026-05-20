import type { ExportPlugin, ExportResult } from '../types';
import type { Emitter } from '../../types';
import { buildEFF } from '../../utils/exporter';

export const EffExportPlugin: ExportPlugin = {
  id: 'eff-export',
  name: 'EFF Export (CEffectData)',
  description: 'Exports as Metin2 .eff format (CEffectData)',
  extensions: ['eff'],
  version: '1.0.0',

  export(emitters: Emitter[], options: Record<string, unknown>): ExportResult {
    const data = buildEFF(emitters, {
      effectName: options.effectName as string,
      effectPath: options.effectPath as string,
      precision: options.precision as number ?? 4,
    });
    return { data, ext: 'eff', mimeType: 'text/plain' };
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
