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
        <button className="btn sm" onClick={handlePlay} title={t('tl_play')} disabled={playing}>{t('tl_play')}</button>
        <button className="btn sm" onClick={handlePause} title={t('tl_pause')} disabled={!playing}>{t('tl_pause')}</button>
        <button className="btn sm" onClick={handleStop} title={t('tl_stop')}>{t('tl_stop')}</button>
        <button className={'btn sm' + (autoCycle ? ' active' : '')} onClick={handleToggleCycle} title={t('tl_cycle')}>{t('tl_cycle')}</button>
      </div>
      <div ref={trackRef} className="timeline-tracks"
        onClick={handleSeek}
        style={{ height: tracks.length > 0 ? `${12 + tracks.length * 14}px` : 24 }}
      >
        {tracks.map(t => (
          <div key={t.uid} className="timeline-track-bar"
            style={{
              left: `${t.start * 100}%`,
              width: `${Math.max(t.dur * 100, 2)}%`,
              top: `${4 + t.idx * 14}px`,
              background: t.color,
            }}
          >
            {t.name.length * 4 < t.dur * 100 && t.name}
          </div>
        ))}
        <div className="timeline-playhead" style={{ left: `${normalized * 100}%` }} />
      </div>
      <span className="timeline-time">{globalTime.toFixed(2)}s</span>
      <input type="range" className="timeline-slider" min="0" max="1000"
        value={Math.round(normalized * 1000)} onChange={handleSliderChange}
      />
      <span className="timeline-duration">{maxDuration.toFixed(2)}s</span>
      <div className="timeline-export">
        <button className="btn sm" onClick={handleExportMSE} title={t('tl_export_mse')}>.mse</button>
        <button className="btn sm" onClick={handleExportEFF} title={t('tl_export_eff')}>.eff</button>
        <button className="btn sm" onClick={handleExportMDE} title={t('tl_export_mde')}>.mde</button>
      </div>
    </div>
  );
}
