export interface GizmoState {
  mode: 'translate' | 'rotate' | 'scale';
  enabled: boolean;
}

export const defaultGizmoState: GizmoState = { mode: 'translate', enabled: false };
