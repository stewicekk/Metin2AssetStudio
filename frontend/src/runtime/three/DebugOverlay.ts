import { t } from '../../i18n';

export interface DebugOverlayState {
  fps: number;
  particles: number;
  status: string;
}

export function formatDebugOverlay(state: DebugOverlayState): string {
  return `${state.fps} ${t('vp_fps')} | ${state.particles} ${t('vp_particles').toLowerCase()} | ${state.status}`;
}
