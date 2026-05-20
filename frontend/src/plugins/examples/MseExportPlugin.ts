import type { ExportPlugin, ExportResult } from '../types';
import type { Emitter } from '../../types';
import { buildMSE } from '../../utils/mseExporter';

export const MseExportPlugin: ExportPlugin = {
  id: 'mse-export',
  name: 'MSE Export',
  description: 'Exports as Metin2 .mse particle system format',
  extensions: ['mse'],
  version: '1.0.0',

  export(emitters: Emitter[], options: Record<string, unknown>): ExportResult {
    const data = buildMSE(emitters, {
      effectName: options.effectName as string,
    });
    return { data, ext: 'mse', mimeType: 'text/plain' };
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
