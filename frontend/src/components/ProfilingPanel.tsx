import { useEffect, useRef, useState } from 'react';
import { fpsHistory, profilingStore, type ProfilingSnapshot } from '../runtime/three/ProfilingStore';
import { t } from '../i18n';

export function ProfilingPanel() {
  const [data, setData] = useState<ProfilingSnapshot>(profilingStore.getSnapshot());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const unsub = profilingStore.subscribe(setData);
    return unsub;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const minRange = 60;
    const maxFps = Math.max(minRange, ...fpsHistory);
    const lineColor = getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#c89b3c';

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const x = (w / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let i = 1; i < 3; i++) {
      const y = (h / 3) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const len = fpsHistory.length;
    if (len < 2) return;

    ctx.beginPath();
    for (let i = 0; i < len; i++) {
      const x = (i / 119) * w;
      const y = h - (fpsHistory[i] / maxFps) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = lineColor + '99';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const lastX = ((len - 1) / 119) * w;
    ctx.lineTo(lastX, h);
    ctx.lineTo(0, h);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, lineColor + '40');
    gradient.addColorStop(1, lineColor + '05');
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [data.fps]);

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
      <div className="perf-chart">
        <canvas ref={canvasRef} width={240} height={60} />
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
