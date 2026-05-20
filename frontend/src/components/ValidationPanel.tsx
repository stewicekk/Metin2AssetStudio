import { useMemo } from 'react';
import { validateProject } from '../editor/validation/validateProject';
import { useAppStore } from '../store/useAppStore';
import { useT } from '../i18n';

export function ValidationPanel() {
  const { t } = useT();
  const emitters = useAppStore(s => s.emitters);
  const importedEffects = useAppStore(s => s.importedEffects);
  const issues = useMemo(() => validateProject(emitters, importedEffects), [emitters, importedEffects]);

  return (
    <div className="studio-card validation-panel">
      <div className="studio-card__header">
        <span>{t('val_title')}</span>
        <span className="muted">{issues.length} {t('vp_checks')}</span>
      </div>
      <div className="validation-list">
        {issues.map((issue, index) => (
          <div className={`validation-row validation-row--${issue.severity}`} key={`${issue.message}:${index}`}>{issue.message}</div>
        ))}
      </div>
    </div>
  );
}