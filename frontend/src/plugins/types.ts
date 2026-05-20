import type { Emitter } from '../types';

export interface ExportPlugin {
  id: string;
  name: string;
  description: string;
  extensions: string[];
  version: string;

  /** Produce file content from emitters. Return { data, ext } or null if unsupported. */
  export(emitters: Emitter[], options: Record<string, unknown>): ExportResult | null;

  /** Optional validation before export. Return issue strings. */
  validate?(emitters: Emitter[]): string[];
}

export interface TransformPlugin {
  id: string;
  name: string;
  version: string;

  /** Transform emitters before MSE export */
  preExport(emitters: Emitter[]): Emitter[];
}

export interface ImportPlugin {
  id: string;
  name: string;
  description: string;
  extensions: string[];
  version: string;

  /** Parse file content into emitter data. Return null if unsupported. */
  import(content: string, fileName: string): ImportResult | null;
}

export interface ExportResult {
  data: string;
  ext: string;
  mimeType?: string;
}

export interface ImportResult {
  emitters: Emitter[];
  effectName: string;
}

export type Plugin = ExportPlugin | TransformPlugin | ImportPlugin;

export function isExportPlugin(p: Plugin): p is ExportPlugin {
  return 'export' in p;
}

export function isTransformPlugin(p: Plugin): p is TransformPlugin {
  return 'preExport' in p;
}

export function isImportPlugin(p: Plugin): p is ImportPlugin {
  return 'import' in p;
}
