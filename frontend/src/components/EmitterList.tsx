import { useCallback, useRef, useState } from 'react';
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
  const batchGroupEmitters = useAppStore(s => s.batchGroupEmitters);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [groupInputValue, setGroupInputValue] = useState('');
  const groupInputRef = useRef<HTMLInputElement>(null);

  const filteredEmitters = searchQuery
    ? emitters.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : emitters;

  const ungrouped: typeof filteredEmitters = [];
  const groups = new Map<string, typeof filteredEmitters>();
  for (const emitter of filteredEmitters) {
    if (emitter.group) {
      const arr = groups.get(emitter.group);
      if (arr) arr.push(emitter);
      else groups.set(emitter.group, [emitter]);
    } else {
      ungrouped.push(emitter);
    }
  }
  const sortedGroups = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const toggleCollapsed = (name: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleGroupSelect = (groupName: string) => {
    const ids = filteredEmitters.filter(e => e.group === groupName).map(e => e.uid);
    setSelectedIds(new Set(ids));
  };

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

  const toggleBatchSelect = (uid: number, ctrl: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (ctrl) {
        if (next.has(uid)) next.delete(uid); else next.add(uid);
      } else {
        next.clear();
        next.add(uid);
      }
      return next;
    });
  };

  const batchDuplicate = () => {
    selectedIds.forEach(uid => {
      const emitter = emitters.find(e => e.uid === uid);
      if (emitter) {
        useAppStore.getState().addEmitterFromTemplate(emitter.name + '_copy', { ...emitter });
      }
    });
  };

  const batchDelete = () => {
    selectedIds.forEach(uid => deleteEmitter(uid));
    setSelectedIds(new Set());
  };

  const batchToggleVis = (vis: boolean) => {
    selectedIds.forEach(uid => updateEmitter(uid, { visible: vis }));
  };

  const emitRow = (emitter: typeof filteredEmitters[number]) => (
    <div
      key={emitter.uid}
      className={'emitter-row' + (activeEmitterId === emitter.uid ? ' active' : '') + (selectedIds.has(emitter.uid) ? ' batch-sel' : '')}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          toggleBatchSelect(emitter.uid, true);
        } else if (e.shiftKey && filteredEmitters.length > 0) {
          const idx = filteredEmitters.indexOf(emitter);
          if (idx >= 0) {
            const newSel = new Set(selectedIds);
            filteredEmitters.slice(0, idx + 1).forEach(em => newSel.add(em.uid));
            setSelectedIds(newSel);
          }
        } else {
          toggleBatchSelect(emitter.uid, false);
        }
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
          selectEmitter(emitter.uid);
        }
      }}
    >
      <input
        type="checkbox"
        className="emit-chk"
        checked={selectedIds.has(emitter.uid)}
        onChange={() => toggleBatchSelect(emitter.uid, true)}
        onClick={e => e.stopPropagation()}
      />
      <button className="emit-vis"
        onClick={(event) => {
          event.stopPropagation();
          updateEmitter(emitter.uid, { visible: !emitter.visible });
        }}
      >
        {emitter.visible ? t('el_visible_on') : t('el_visible_off')}
      </button>
      <div className="emit-dot" style={{ backgroundColor: emitter.color }} />
      <span className="emit-name">{emitter.name}</span>
      {emitter.group && <span className="badge group">{emitter.group}</span>}
      <span className={'badge ' + (emitter.blend === 'add' ? 'add' : emitter.blend === 'modulate' ? 'mod' : 'alp')}>
        {emitter.blend.toUpperCase()}
      </span>
    </div>
  );

  return (
    <div className="emitter-panel">
      <div className="emitter-toolbar">
        <span>{t('el_title')}</span>
        <button className="btn sm" onClick={() => addEmitter()}>{t('el_add')}</button>
      </div>
      <div className="emitter-search">
        <input
          type="text"
          className="search-input flex1"
          placeholder={t('el_search_placeholder')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="emitter-actions">
        <button className="btn sm" onClick={() => activeEmitterId && duplicateEmitter(activeEmitterId)} title={t('el_duplicate')}>{t('el_duplicate_short')}</button>
        <button className="btn sm danger" onClick={() => activeEmitterId && deleteEmitter(activeEmitterId)} title={t('el_delete')}>{t('el_delete_short')}</button>
        <button className="btn sm" onClick={() => activeEmitterId && moveEmitterUp(activeEmitterId)} title={t('el_move_up')}>↑</button>
        <button className="btn sm" onClick={() => activeEmitterId && moveEmitterDown(activeEmitterId)} title={t('el_move_down')}>↓</button>
        <button className="btn sm" onClick={() => activeEmitterId && randomizeEmitter(activeEmitterId)} title={t('el_randomize')}>{t('el_randomize_short')}</button>
        <button className="btn sm" onClick={(e) => activeEmitterId && handleCopy(e, activeEmitterId)} title={t('el_copy')}>{t('el_copy_short')}</button>
        <button className="btn sm" onClick={handlePaste} title={t('el_paste')} disabled={!copiedEmitter}>{t('el_paste_short')}</button>
        {selectedIds.size > 0 && (
          <>
            <span className="sep-v" />
            <span className="batch-count">{selectedIds.size}</span>
            <button className="btn sm" onClick={batchDuplicate} title={t('el_batch_dup')}>{t('el_duplicate_short')}</button>
            <button className="btn sm danger" onClick={batchDelete} title={t('el_batch_del')}>{t('el_delete_short')}</button>
            <button className="btn sm" onClick={() => batchToggleVis(true)} title={t('el_batch_show')}>{t('el_visible_on')}</button>
            <button className="btn sm" onClick={() => batchToggleVis(false)} title={t('el_batch_hide')}>{t('el_visible_off')}</button>
            <button className="btn sm" onClick={() => { setShowGroupInput(true); setTimeout(() => groupInputRef.current?.focus(), 0); }}>{t('el_group')}</button>
            <button className="btn sm" onClick={() => { batchGroupEmitters([...selectedIds], ''); setSelectedIds(new Set()); }}>{t('el_ungroup')}</button>
            {showGroupInput && (
              <span className="emitter-group-inline">
                <input
                  ref={groupInputRef}
                  type="text"
                  className="emitter-group-input"
                  placeholder={t('el_group_placeholder')}
                  value={groupInputValue}
                  onChange={e => setGroupInputValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && groupInputValue.trim()) {
                      batchGroupEmitters([...selectedIds], groupInputValue.trim());
                      setShowGroupInput(false);
                      setGroupInputValue('');
                    }
                    if (e.key === 'Escape') {
                      setShowGroupInput(false);
                      setGroupInputValue('');
                    }
                  }}
                />
                <button className="btn sm" onClick={() => {
                  if (groupInputValue.trim()) {
                    batchGroupEmitters([...selectedIds], groupInputValue.trim());
                    setShowGroupInput(false);
                    setGroupInputValue('');
                  }
                }}>{t('el_group')}</button>
              </span>
            )}
          </>
        )}
      </div>
      <div className="emitter-list">
        {ungrouped.map(emitRow)}
        {sortedGroups.map(([groupName, groupEmitters]) => (
          <div key={groupName}>
            <div className="emitter-group-hdr">
              <span className="emitter-group-arrow" onClick={() => toggleCollapsed(groupName)}>
                {collapsedGroups.has(groupName) ? '▶' : '▼'}
              </span>
              <span className="emitter-group-name" onClick={() => handleGroupSelect(groupName)}>
                {groupName}
              </span>
              <span className="emitter-group-count">({groupEmitters.length})</span>
            </div>
            {!collapsedGroups.has(groupName) && groupEmitters.map(emitRow)}
          </div>
        ))}
      </div>
    </div>
  );
}
