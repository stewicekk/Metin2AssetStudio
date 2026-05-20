import { useState, useEffect } from 'react';
import { useT } from '../i18n';
import { pluginManager } from '../plugins';
import type { Plugin } from '../plugins/types';
import { isExportPlugin, isTransformPlugin, isImportPlugin } from '../plugins/types';

function pluginType(p: Plugin): string {
  const { t } = useT();
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
    <div className="plugin-status-panel" style={{ padding: 8, fontSize: 12 }}>
      <div className="panel-header" style={{ marginBottom: 8 }}>
        <span className="panel-title">{t('pp_title')}</span>
        <span className="uid-badge">{plugins.length} {t('pp_count')}</span>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--text2)' }}>{t('pp_export')}: {exportPlugins.length}</span>
        <span style={{ fontSize: 10, color: 'var(--text2)' }}>|</span>
        <span style={{ fontSize: 10, color: 'var(--text2)' }}>{t('pp_transform')}: {transformPlugins.length}</span>
        <span style={{ fontSize: 10, color: 'var(--text2)' }}>|</span>
        <span style={{ fontSize: 10, color: 'var(--text2)' }}>{t('pp_import')}: {importPlugins.length}</span>
      </div>

      <div className="plugin-list" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {plugins.map(p => (
          <div key={p.id}
            className={`plugin-item ${selected === p.id ? 'selected' : ''}`}
            onClick={() => setSelected(selected === p.id ? null : p.id)}
            style={{
              padding: '4px 6px', cursor: 'pointer', borderRadius: 3,
              background: selected === p.id ? 'var(--accent-dim)' : 'transparent',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--text1)', fontSize: 12 }}>{p.name}</span>
              <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'monospace' }}>{p.version}</span>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 2, alignItems: 'center' }}>
              <span className="plugin-type-badge" style={{
                fontSize: 9, padding: '1px 4px', borderRadius: 2,
                background: isExportPlugin(p) ? 'var(--accent-dim)' : isTransformPlugin(p) ? '#2a4' : '#48c',
                color: 'var(--text1)',
              }}>{pluginType(p)}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>{p.id}</span>
            </div>
            {'extensions' in p && p.extensions && (
              <div style={{ fontSize: 9, color: 'var(--text2)', marginTop: 1 }}>
                {p.extensions.map(ext => `.${ext}`).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedPlugin && 'description' in selectedPlugin && (
        <div className="plugin-detail" style={{
          marginTop: 8, padding: 6, borderRadius: 3,
          background: 'var(--bg1)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{selectedPlugin.description}</div>
        </div>
      )}

      {plugins.length === 0 && (
        <div className="empty-state" style={{ textAlign: 'center', padding: 20 }}>
          <p style={{ color: 'var(--text2)', fontSize: 11 }}>{t('pp_empty')}</p>
        </div>
      )}
    </div>
  );
}
