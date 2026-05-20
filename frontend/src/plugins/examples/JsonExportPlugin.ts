import type { ExportPlugin, ExportResult, ImportPlugin, ImportResult } from '../types';
import type { Emitter } from '../../types';

export const JsonExportPlugin: ExportPlugin = {
  id: 'json-export',
  name: 'JSON Export',
  description: 'Exports emitters as structured JSON for external tooling',
  extensions: ['json'],
  version: '1.0.0',

  export(emitters: Emitter[], options: Record<string, unknown>): ExportResult {
    const effectName = (options.effectName as string) || 'MyEffect';
    const data = JSON.stringify({ effectName, emitters, exportedAt: new Date().toISOString() }, null, 2);
    return { data, ext: 'json', mimeType: 'application/json' };
  },

  validate(emitters: Emitter[]): string[] {
    if (emitters.length === 0) return ['No emitters to export'];
    return [];
  },
};

export const JsonImportPlugin: ImportPlugin = {
  id: 'json-import',
  name: 'JSON Import',
  description: 'Imports emitters from structured JSON',
  extensions: ['json'],
  version: '1.0.0',

  import(content: string, fileName: string): ImportResult | null {
    try {
      const parsed = JSON.parse(content);
      if (!parsed.emitters || !Array.isArray(parsed.emitters)) return null;
      return { emitters: parsed.emitters as Emitter[], effectName: parsed.effectName || fileName.replace(/\.json$/, '') };
    } catch {
      return null;
    }
  },
};
