import { useState, useEffect } from 'react';
import { useT } from '../i18n';
import type { Dict } from '../i18n/types';
import { pluginManager } from '../plugins';
import type { Plugin } from '../plugins/types';
import { isExportPlugin, isTransformPlugin, isImportPlugin } from '../plugins/types';

function pluginTypeClass(p: Plugin): string {
  if (isExportPlugin(p)) return 'export';
  if (isTransformPlugin(p)) return 'transform';
  if (isImportPlugin(p)) return 'import';
  return '';
}

function pluginTypeLabel(p: Plugin, t: (k: keyof Dict) => string): string {
  if (isExportPlugin(p)) return t('pp_type_export');
  if (isTransformPlugin(p)) return t('pp_type_transform');
  if (isImportPlugin(p)) return t('pp_type_import');
  return '?';
}

export function PluginStatusPanel() {
  const { t } = useT();
  const [plugins, setPlugins] = useState<Plugin[]>(() => pluginManager.getAll());
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const unsub = pluginManager.on(() => {
      setPlugins(pluginManager.getAll());
    });
    return unsub;
  }, []);

  const selectedPlugin = selected ? plugins.find(p => p.id === selected) : null;

  const exportPlugins = plugins.filter(isExportPlugin);
  const transformPlugins = plugins.filter(isTransformPlugin);
  const importPlugins = plugins.filter(isImportPlugin);

  return (
    <div className="plugin-status-panel">
      <div className="panel-header">
        <span className="panel-title">{t('pp_title')}</span>
        <span className="uid-badge">{plugins.length} {t('pp_count')}</span>
      </div>

      <div className="plugin-counts">
        <span>{t('pp_export')}: {exportPlugins.length}</span>
        <span className="sep">|</span>
        <span>{t('pp_transform')}: {transformPlugins.length}</span>
        <span className="sep">|</span>
        <span>{t('pp_import')}: {importPlugins.length}</span>
      </div>

      <div className="plugin-list">
        {plugins.map(p => (
          <div key={p.id}
            className={'plugin-item' + (selected === p.id ? ' selected' : '')}
            onClick={() => setSelected(selected === p.id ? null : p.id)}
          >
            <div className="plugin-header">
              <span className="plugin-name">{p.name}</span>
              <span className="plugin-version">{p.version}</span>
            </div>
            <div className="plugin-meta">
              <span className={'plugin-type-badge ' + pluginTypeClass(p)}>{pluginTypeLabel(p, t)}</span>
              <span className="plugin-id">{p.id}</span>
            </div>
            {'extensions' in p && p.extensions && (
              <div className="plugin-exts">{p.extensions.map((ext: string) => `.${ext}`).join(', ')}</div>
            )}
          </div>
        ))}
      </div>

      {selectedPlugin && 'description' in selectedPlugin && (
        <div className="plugin-detail">
          <div className="desc">{selectedPlugin.description}</div>
        </div>
      )}

      {plugins.length === 0 && (
        <div className="empty-state"><p className="muted">{t('pp_empty')}</p></div>
      )}
    </div>
  );
}
