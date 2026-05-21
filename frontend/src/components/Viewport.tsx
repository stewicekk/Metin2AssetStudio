import { useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import type { ForwardedRef } from 'react';
import { RendererHost } from '../runtime/three';
import { useAppStore } from '../store/useAppStore';
import { Minimap } from './Minimap';
import { t } from '../i18n';

export interface ViewportHandle {
  reset: () => void;
  setView: (f: string) => void;
  screenshot: () => void;
  fullscreen: () => void;
}

export const Viewport = forwardRef(function Viewport(
  { cameraRef }: { cameraRef?: (ref: ViewportHandle | null) => void },
  ref: ForwardedRef<ViewportHandle>
) {
  const mountRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const perfRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<RendererHost | null>(null);

  useImperativeHandle(ref, () => ({
    reset: () => hostRef.current?.resetCamera(),
    setView: (f: string) => hostRef.current?.setCameraView(f as 'front' | 'top' | 'persp'),
    screenshot: () => hostRef.current?.requestScreenshot(),
    fullscreen: () => mountRef.current?.requestFullscreen?.() || (mountRef.current as any)?.webkitRequestFullscreen?.(),
  }), []);

  useEffect(() => {
    if (!mountRef.current) return undefined;
    const host = new RendererHost(mountRef.current, {
      fps: fpsRef.current,
      info: infoRef.current,
      perf: perfRef.current,
    });
    hostRef.current = host;
    cameraRef?.({
      reset: () => host.resetCamera(),
      setView: (f: string) => host.setCameraView(f as 'front' | 'top' | 'persp'),
      screenshot: () => host.requestScreenshot(),
      fullscreen: () => mountRef.current?.requestFullscreen?.() || (mountRef.current as any)?.webkitRequestFullscreen?.(),
    });
    return () => {
      host.dispose();
      hostRef.current = null;
      cameraRef?.(null);
    };
  }, [cameraRef]);

  const emitters = useAppStore(s => s.emitters);
  const minimapDots = useMemo(() => emitters.map(e => ({
    px: e.shape === 'box' ? 0 : 0,
    py: 0,
    pz: 0,
    name: e.name,
    color: e.color,
  })), [emitters]);

  return (
    <div id="vp-wrap" ref={mountRef}>
      <div id="vp-overlay">
        <div id="fps-ctr" ref={fpsRef}>-- {t('vp_fps')}</div>
        <div id="axis-lbl">{t('vp_title')}</div>
        <div id="vp-info" ref={infoRef}></div>
        <div id="vp-perf-badge" ref={perfRef}></div>
      </div>
      <Minimap emitters={minimapDots} />
    </div>
  );
});
