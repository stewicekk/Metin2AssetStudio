import { useEffect, useState } from 'react';
import { profilingStore, type ProfilingSnapshot } from '../runtime/three/ProfilingStore';
import { t } from '../i18n';

export function ProfilingPanel() {
  const [data, setData] = useState<ProfilingSnapshot>(profilingStore.getSnapshot());

  useEffect(() => {
    const unsub = profilingStore.subscribe(setData);
    return unsub;
  }, []);

  const cpuPct = data.totalMs > 0 ? ((data.simulateMs + data.uploadMs + data.meshSimMs + data.meshUploadMs) / data.totalMs * 100).toFixed(0) : '0';
  const memKb = (data.memoryBytes / 1024).toFixed(1);

  return (
    <div className="profiling-panel">
      <div className="panel-title">{t('prof_title')} <span className="count">{data.fps} {t('vp_fps')}</span></div>
      <div className="profiling-grid">
        <div className="prof-row">
          <span className="prof-label">{t('prof_frame')}</span>
          <span className="prof-val">{data.totalMs.toFixed(1)}ms</span>
        </div>
        <div className="prof-row">
          <span className="prof-label">{t('prof_cpu')}</span>
          <span className="prof-val">{cpuPct}%</span>
        </div>
        <div className="prof-row">
          <span className="prof-label">{t('prof_particles')}</span>
          <span className="prof-val">{data.aliveParticles}</span>
        </div>
        <div className="prof-row">
          <span className="prof-label">{t('prof_point_em')}</span>
          <span className="prof-val">{data.pointEmitters}</span>
        </div>
        <div className="prof-row">
          <span className="prof-label">{t('prof_mesh_em')}</span>
          <span className="prof-val">{data.meshEmitters}</span>
        </div>
        <div className="prof-row">
          <span className="prof-label">{t('prof_vram')}</span>
          <span className="prof-val">{memKb}kB</span>
        </div>
        <div className="prof-row">
          <span className="prof-label">{t('prof_draw_calls')}</span>
          <span className="prof-val">{data.drawCalls}</span>
        </div>
        <div className="prof-row">
          <span className="prof-label">{t('prof_triangles')}</span>
          <span className="prof-val">{data.triangles}</span>
        </div>
      </div>
      {data.bottlenecks.length > 0 && (
        <div className="prof-bottlenecks">
          {data.bottlenecks.map((b, i) => (
            <div key={i} className="prof-bottleneck" title={b}>
              ⚠ {b}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
