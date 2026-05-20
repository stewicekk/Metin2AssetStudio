import type { Emitter } from '../types';
import type { ExportDiagnostic } from './exporterDiagnostics';
import { writeCanonicalMSE, writeEFF, writeMDE } from './canonicalWriter';

const LINE_BREAK = '\n';

function countLines(text: string): number {
  if (!text) return 0;
  return text.split(/\r?\n/).length;
}

function estimateBytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function generateExportPreview(
  emitters: Emitter[],
  format: 'mse' | 'eff' | 'mde',
  diagnostics: ExportDiagnostic[],
): string {
  const hasErrors = diagnostics.some(d => d.severity === 'error');
  const warnings = diagnostics.filter(d => d.severity === 'warn');
  const infos = diagnostics.filter(d => d.severity === 'info');

  const previewLines: string[] = [];
  previewLines.push('=== Export Preview ===');
  previewLines.push(`Format: ${format.toUpperCase()}`);
  previewLines.push(`Emitters: ${emitters.length}`);
  previewLines.push('');

  if (hasErrors) {
    previewLines.push('⚠ ERRORS — export may produce invalid output:');
    for (const d of diagnostics.filter(d => d.severity === 'error')) {
      previewLines.push(`  ✗ ${d.emitterName}: ${d.message}`);
    }
    previewLines.push('');
  }

  if (warnings.length > 0) {
    previewLines.push(`! Warnings (${warnings.length}):`);
    for (const d of warnings) {
      previewLines.push(`  ! ${d.emitterName}: ${d.message}`);
    }
    previewLines.push('');
  }

  if (infos.length > 0) {
    previewLines.push(`i Notes (${infos.length}):`);
    for (const d of infos) {
      previewLines.push(`  i ${d.emitterName}: ${d.message}`);
    }
    previewLines.push('');
  }

  let generated: string;
  switch (format) {
    case 'mse':
      generated = writeCanonicalMSE(emitters, { includeHeader: true, mode: 'canonical' });
      break;
    case 'eff':
      generated = writeEFF(emitters, { includeHeader: true });
      break;
    case 'mde':
      generated = writeMDE(emitters, { includeHeader: true });
      break;
  }

  const genLines = generated.split(LINE_BREAK);
  const maxPreview = 40;
  const showAll = genLines.length <= maxPreview;

  previewLines.push(`--- Generated output (${genLines.length} lines, ${estimateBytes(generated)} bytes) ---`);
  previewLines.push('');

  const displayLines = showAll ? genLines : genLines.slice(0, maxPreview);
  for (const line of displayLines) {
    previewLines.push(line);
  }

  if (!showAll) {
    previewLines.push('');
    previewLines.push(`... (${genLines.length - maxPreview} more lines)`);
  }

  previewLines.push('');
  previewLines.push('=== End Preview ===');

  return previewLines.join(LINE_BREAK);
}

export function estimateExportSize(
  emitters: Emitter[],
  format: 'mse' | 'eff' | 'mde',
): { bytes: number; lines: number } {
  let generated: string;
  switch (format) {
    case 'mse':
      generated = writeCanonicalMSE(emitters, { includeHeader: false, mode: 'canonical' });
      break;
    case 'eff':
      generated = writeEFF(emitters, { includeHeader: false });
      break;
    case 'mde':
      generated = writeMDE(emitters, { includeHeader: false });
      break;
  }

  return {
    bytes: estimateBytes(generated),
    lines: countLines(generated),
  };
}

export function compareExportSizes(emitters: Emitter[]): Record<string, { bytes: number; lines: number }> {
  return {
    mse: estimateExportSize(emitters, 'mse'),
    eff: estimateExportSize(emitters, 'eff'),
    mde: estimateExportSize(emitters, 'mde'),
  };
}
