import { useEffect, useRef } from 'react';
import { RendererHost } from '../runtime/three';
import { t } from '../i18n';

export function Viewport({ cameraRef }: { cameraRef?: (ref: { reset: () => void; setView: (f: string) => void } | null) => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const perfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return undefined;
    const host = new RendererHost(mountRef.current, {
      fps: fpsRef.current,
      info: infoRef.current,
      perf: perfRef.current,
    });
    cameraRef?.({
      reset: () => host.resetCamera(),
      setView: (f: string) => host.setCameraView(f as 'front' | 'top' | 'persp'),
    });
    return () => {
      host.dispose();
      cameraRef?.(null);
    };
  }, [cameraRef]);

  return (
    <div id="vp-wrap" ref={mountRef}>
      <div id="vp-overlay">
        <div id="fps-ctr" ref={fpsRef}>-- {t('vp_fps')}</div>
        <div id="axis-lbl">{t('vp_title')}</div>
        <div id="vp-info" ref={infoRef}></div>
        <div id="vp-perf-badge" ref={perfRef}></div>
      </div>
    </div>
  );
}
