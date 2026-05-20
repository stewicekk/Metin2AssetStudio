import type { ExportPlugin, ExportResult } from '../types';
import type { Emitter } from '../../types';
import { buildMSE } from '../../utils/mseExporter';

/**
 * Example plugin: wraps MSE content in a human-readable archive header.
 * Demonstrates the ExportPlugin interface — easy to copy for custom formats.
 */
export const ArchiveExportPlugin: ExportPlugin = {
  id: 'archive-export',
  name: 'MSE Archive (.txt)',
  description: 'Wraps MSE export in a human-readable archive with metadata',
  extensions: ['txt', 'archive'],
  version: '1.0.0',

  export(emitters: Emitter[], options: Record<string, unknown>): ExportResult {
    const effectName = (options.effectName as string) || 'MyEffect';
    const date = new Date().toISOString().slice(0, 10);
    const mseContent = buildMSE(emitters, { effectName });

    const lines = [
      '╔══════════════════════════════════════╗',
      `║  Metin2 Asset Studio — Archive Export  ║`,
      '╚══════════════════════════════════════╝',
      '',
      `Effect:      ${effectName}`,
      `Emitters:    ${emitters.length}`,
      `Date:        ${date}`,
      `Plugin:      ${this.id} v${this.version}`,
      '',
      '╔══════════════════════════════════════╗',
      '║  MSE Data Below                        ║',
      '╚══════════════════════════════════════╝',
      '',
      mseContent,
      '',
      '╔══════════════════════════════════════╗',
      '║  End of Archive                         ║',
      '╚══════════════════════════════════════╝',
    ];

    return { data: lines.join('\n'), ext: 'txt', mimeType: 'text/plain' };
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
