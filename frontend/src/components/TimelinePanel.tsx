import { useCallback, useRef, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { pluginManager } from '../plugins';
import { useT } from '../i18n';

export function TimelinePanel() {
  const { t } = useT();
  const emitters = useAppStore(s => s.emitters);
  const globalTime = useAppStore(s => s.globalTime);
  const playing = useAppStore(s => s.playing);
  const setPlaying = useAppStore(s => s.setPlaying);
  const setGlobalTime = useAppStore(s => s.setGlobalTime);
  const autoCycle = useAppStore(s => s.autoCycle);
  const setAutoCycle = useAppStore(s => s.setAutoCycle);
  const exportEffectName = useAppStore(s => s.exportEffectName);
  const exportEffectPath = useAppStore(s => s.exportEffectPath);
  const setExportModal = useAppStore(s => s.setExportModal);
  const trackRef = useRef<HTMLDivElement>(null);

  const maxDuration = Math.max(...emitters.map(e => e.cycle), 2);
  const normalized = maxDuration > 0 ? (globalTime % maxDuration) / maxDuration : 0;

  const handlePlay = useCallback(() => setPlaying(true), [setPlaying]);
  const handlePause = useCallback(() => setPlaying(false), [setPlaying]);
  const handleStop = useCallback(() => { setPlaying(false); setGlobalTime(0); }, [setPlaying, setGlobalTime]);
  const handleToggleCycle = useCallback(() => setAutoCycle(!autoCycle), [autoCycle, setAutoCycle]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    setGlobalTime(ratio * maxDuration);
  }, [maxDuration, setGlobalTime]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalTime((Number(e.target.value) / 1000) * maxDuration);
  }, [maxDuration, setGlobalTime]);

  const handleExportMSE = useCallback(() => {
    const result = pluginManager.export(emitters, 'mse', { effectName: exportEffectName });
    if (result) setExportModal({ open: true, title: t('export_mse_title'), content: result.data, ext: 'mse' });
  }, [emitters, exportEffectName, setExportModal, t]);

  const handleExportEFF = useCallback(() => {
    const result = pluginManager.export(emitters, 'eff', { effectName: exportEffectName, effectPath: exportEffectPath });
    if (result) setExportModal({ open: true, title: t('export_eff_title'), content: result.data, ext: 'eff' });
  }, [emitters, exportEffectName, exportEffectPath, setExportModal, t]);

  const handleExportMDE = useCallback(() => {
    const result = pluginManager.export(emitters, 'mde', { effectName: exportEffectName, effectPath: exportEffectPath });
    if (result) setExportModal({ open: true, title: t('export_mde_title'), content: result.data, ext: 'mde' });
  }, [emitters, exportEffectName, exportEffectPath, setExportModal, t]);

  const tracks = useMemo(() => emitters.map((e, idx) => {
    const birth = e.delay || 0;
    const life = (e.life || 1) + (e.lifeRnd || 0) * 0.5;
    const start = birth / maxDuration;
    const dur = Math.min(life / maxDuration, 1 - start);
    return { uid: e.uid, name: e.name, color: e.color, start, dur, loop: e.loop, idx };
  }), [emitters, maxDuration]);

  return (
    <div className="timeline-panel">
      <div className="timeline-controls">
        <button className="btn sm" onClick={handlePlay} title={t('tl_play')}>▶</button>
        <button className="btn sm" onClick={handlePause} title={t('tl_pause')}>⏸</button>
        <button className="btn sm" onClick={handleStop} title={t('tl_stop')}>■</button>
        <button className={`btn sm ${autoCycle ? 'active' : ''}`} onClick={handleToggleCycle} title={t('tl_cycle')} style={{ color: autoCycle ? 'var(--acc)' : undefined }}>↺</button>
      </div>
      <div
        ref={trackRef}
        className="timeline-tracks"
        onClick={handleSeek}
        style={{ position: 'relative', flex: 1, height: tracks.length > 0 ? `${12 + tracks.length * 14}px` : 24, cursor: 'pointer', minHeight: 24, background: 'var(--bg0)', borderRadius: 3, overflow: 'hidden' }}
      >
        {tracks.map(t => (
          <div key={t.uid} style={{
            position: 'absolute',
            left: `${t.start * 100}%`,
            width: `${Math.max(t.dur * 100, 2)}%`,
            top: `${4 + t.idx * 14}px`,
            height: 10,
            borderRadius: 3,
            background: t.color,
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 4,
            fontSize: 8,
            color: '#fff',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textShadow: '0 0 2px rgba(0,0,0,0.8)',
            minWidth: 4,
          }}>
            {t.name.length * 4 < t.dur * 100 && t.name}
          </div>
        ))}
        <div style={{
          position: 'absolute',
          left: `${normalized * 100}%`,
          top: 0,
          width: 2,
          height: '100%',
          background: 'var(--acc)',
          pointerEvents: 'none',
          transition: playing ? 'none' : 'left 0.1s ease',
          boxShadow: '0 0 4px var(--acc)',
        }} />
      </div>
      <span className="timeline-time" style={{ fontSize: 9, minWidth: 38, textAlign: 'right' }}>{globalTime.toFixed(2)}s</span>
      <input type="range" className="timeline-slider" min="0" max="1000" value={Math.round(normalized * 1000)} onChange={handleSliderChange} style={{ width: 60 }} />
      <span className="timeline-duration" style={{ fontSize: 9, minWidth: 38 }}>{maxDuration.toFixed(2)}s</span>
      <div className="timeline-export">
        <button className="btn sm" onClick={handleExportMSE} title={t('tl_export_mse')}>.mse</button>
        <button className="btn sm" onClick={handleExportEFF} title={t('tl_export_eff')}>.eff</button>
        <button className="btn sm" onClick={handleExportMDE} title={t('tl_export_mde')}>.mde</button>
      </div>
    </div>
  );
}
