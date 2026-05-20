import type { Plugin, ExportPlugin, TransformPlugin, ImportPlugin, ExportResult, ImportResult } from './types';
import { isExportPlugin, isTransformPlugin, isImportPlugin } from './types';

type PluginEventListener = (event: { type: string; pluginId: string; data?: unknown }) => void;

export class PluginManager {
  private readonly plugins = new Map<string, Plugin>();
  private readonly listeners = new Set<PluginEventListener>();

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[PluginManager] Plugin "${plugin.id}" already registered — skipping`);
      return;
    }
    this.plugins.set(plugin.id, plugin);
    this.emit({ type: 'plugin:registered', pluginId: plugin.id });
  }

  unregister(id: string): boolean {
    const ok = this.plugins.delete(id);
    if (ok) this.emit({ type: 'plugin:unregistered', pluginId: id });
    return ok;
  }

  get<T extends Plugin>(id: string): T | undefined {
    return this.plugins.get(id) as T | undefined;
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getExportPlugins(): ExportPlugin[] {
    return this.getAll().filter(isExportPlugin);
  }

  getTransformPlugins(): TransformPlugin[] {
    return this.getAll().filter(isTransformPlugin);
  }

  getImportPlugins(): ImportPlugin[] {
    return this.getAll().filter(isImportPlugin);
  }

  /** Run all export plugins on the given emitters. Returns first successful result. */
  export(emitters: import('../types').Emitter[], format: string, options: Record<string, unknown> = {}): ExportResult | null {
    for (const plugin of this.getExportPlugins()) {
      if (plugin.extensions.includes(format) || plugin.id === format) {
        const result = plugin.export(emitters, options);
        if (result) return result;
      }
    }
    return null;
  }

  /** Run all import plugins on content. Returns first successful result. */
  import(content: string, fileName: string): ImportResult | null {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    for (const plugin of this.getImportPlugins()) {
      if (plugin.extensions.includes(ext) || plugin.extensions.includes('*')) {
        const result = plugin.import(content, fileName);
        if (result) return result;
      }
    }
    return null;
  }

  /** Run all transform plugins on emitters before export. */
  applyTransforms(emitters: import('../types').Emitter[]): import('../types').Emitter[] {
    let result = emitters;
    for (const plugin of this.getTransformPlugins()) {
      result = plugin.preExport(result);
    }
    return result;
  }

  /** Validate all export plugins' prerequisites */
  validateAll(emitters: import('../types').Emitter[]): string[] {
    const issues: string[] = [];
    for (const plugin of this.getExportPlugins()) {
      if (plugin.validate) {
        issues.push(...plugin.validate(emitters).map(m => `[${plugin.id}] ${m}`));
      }
    }
    return issues;
  }

  on(fn: PluginEventListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(event: { type: string; pluginId: string; data?: unknown }): void {
    this.listeners.forEach(fn => fn(event));
  }
}

export const pluginManager = new PluginManager();
