/**
 * Metin2 Asset Linker
 * Scans parsed objects for external references and builds a dependency graph.
 */

export interface Dependency {
  path: string;
  type: 'mesh' | 'texture' | 'animation' | 'other';
}

export class Linker {
  static getDependencies(obj: unknown): Dependency[] {
    const dependencies: Dependency[] = [];
    this.scan(obj, dependencies);
    // Deduplicate
    const seen = new Set<string>();
    return dependencies.filter(d => {
      if (seen.has(d.path)) return false;
      seen.add(d.path);
      return true;
    });
  }

  private static scan(obj: unknown, dependencies: Dependency[]): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach(item => this.scan(item, dependencies));
      return;
    }

    for (const value of Object.values(obj as Record<string, unknown>)) {
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (lower.endsWith('.mde')) {
          dependencies.push({ path: value, type: 'mesh' });
        } else if (lower.endsWith('.dds') || lower.endsWith('.tga') || lower.endsWith('.bmp')) {
          dependencies.push({ path: value, type: 'texture' });
        } else if (lower.endsWith('.gr2')) {
          dependencies.push({ path: value, type: 'mesh' });
        }
      } else if (typeof value === 'object') {
        this.scan(value, dependencies);
      }
    }
  }
}
