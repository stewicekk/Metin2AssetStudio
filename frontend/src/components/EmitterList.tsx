import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useT } from '../i18n';

export function EmitterList() {
  const { t } = useT();
  const emitters = useAppStore(s => s.emitters);
  const activeEmitterId = useAppStore(s => s.activeEmitterId);
  const selectEmitter = useAppStore(s => s.selectEmitter);
  const addEmitter = useAppStore(s => s.addEmitter);
  const duplicateEmitter = useAppStore(s => s.duplicateEmitter);
  const deleteEmitter = useAppStore(s => s.deleteEmitter);
  const updateEmitter = useAppStore(s => s.updateEmitter);
  const moveEmitterUp = useAppStore(s => s.moveEmitterUp);
  const moveEmitterDown = useAppStore(s => s.moveEmitterDown);
  const randomizeEmitter = useAppStore(s => s.randomizeEmitter);
  const copiedEmitter = useAppStore(s => s.copiedEmitter);
  const setCopiedEmitter = useAppStore(s => s.setCopiedEmitter);

  const handleCopy = useCallback((e: React.MouseEvent, emitterId: number) => {
    e.stopPropagation();
    const emitter = emitters.find(em => em.uid === emitterId);
    if (emitter) setCopiedEmitter(JSON.parse(JSON.stringify(emitter)));
  }, [emitters, setCopiedEmitter]);

  const handlePaste = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (copiedEmitter) {
      useAppStore.getState().addEmitterFromTemplate(copiedEmitter.name + '_paste', { ...copiedEmitter });
    }
  }, [copiedEmitter]);

  return (
    <div className="emitter-panel">
      <div className="emitter-toolbar">
        <span>{t('el_title')}</span>
        <button className="btn sm" onClick={() => addEmitter()}>{t('el_add')}</button>
      </div>
      <div className="emitter-actions">
        <button className="btn sm" onClick={() => activeEmitterId && duplicateEmitter(activeEmitterId)} title={t('el_duplicate')}>⧉</button>
        <button className="btn sm danger" onClick={() => activeEmitterId && deleteEmitter(activeEmitterId)} title={t('el_delete')}>✕</button>
        <button className="btn sm" onClick={() => activeEmitterId && moveEmitterUp(activeEmitterId)} title={t('el_move_up')}>↑</button>
        <button className="btn sm" onClick={() => activeEmitterId && moveEmitterDown(activeEmitterId)} title={t('el_move_down')}>↓</button>
        <button className="btn sm" onClick={() => activeEmitterId && randomizeEmitter(activeEmitterId)} title={t('el_randomize')}>🎲</button>
        <button className="btn sm" onClick={(e) => activeEmitterId && handleCopy(e, activeEmitterId)} title={t('el_copy')}>⎘</button>
        <button className="btn sm" onClick={handlePaste} title={t('el_paste')} disabled={!copiedEmitter}>⎙</button>
      </div>
      <div className="emitter-list">
        {emitters.map((emitter) => (
          <div
            key={emitter.uid}
            className={`emitter-row ${activeEmitterId === emitter.uid ? 'active' : ''}`}
            onClick={() => selectEmitter(emitter.uid)}
          >
            <button
              className="emit-vis"
              onClick={(event) => {
                event.stopPropagation();
                updateEmitter(emitter.uid, { visible: !emitter.visible });
              }}
            >
              {emitter.visible ? t('el_visible_on') : t('el_visible_off')}
            </button>
            <div className="emit-dot" style={{ backgroundColor: emitter.color }}></div>
            <span className="emit-name">{emitter.name}</span>
            <span className={`badge ${emitter.blend === 'add' ? 'add' : emitter.blend === 'modulate' ? 'mod' : 'alp'}`}>
              {emitter.blend.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}