import { useMemo } from 'react';
import { buildDependencyGraph } from '../metin2/dependencies';
import { useAppStore } from '../store/useAppStore';
import { useT } from '../i18n';

export function DependencyPanel() {
  const { t } = useT();
  const importedEffects = useAppStore(s => s.importedEffects);
  const active = importedEffects.at(-1);
  const graph = useMemo(() => active ? buildDependencyGraph(active.rawData) : null, [active]);

  return (
    <div className="studio-card dependency-panel">
      <div className="studio-card__header">
        <span>{t('dp_title')}</span>
        <span className="muted">{graph ? `${graph.nodes.length} ${t('dp_nodes')}` : t('dp_no_import')}</span>
      </div>
      {!graph ? <p className="muted">{t('dp_hint')}</p> : (
        <div className="dependency-list">
          {graph.nodes.map((node) => (
            <div className="dependency-row" key={node.id}>
              <span>{node.type}</span>
              <b>{node.label}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}