export interface ProfilingSnapshot {
  fps: number;
  totalMs: number;
  simulateMs: number;
  uploadMs: number;
  meshSimMs: number;
  meshUploadMs: number;
  aliveParticles: number;
  pointEmitters: number;
  meshEmitters: number;
  memoryBytes: number;
  drawCalls: number;
  triangles: number;
  bottlenecks: string[];
}

const defaultSnapshot: ProfilingSnapshot = {
  fps: 0,
  totalMs: 0,
  simulateMs: 0,
  uploadMs: 0,
  meshSimMs: 0,
  meshUploadMs: 0,
  aliveParticles: 0,
  pointEmitters: 0,
  meshEmitters: 0,
  memoryBytes: 0,
  drawCalls: 0,
  triangles: 0,
  bottlenecks: [],
};

let current: ProfilingSnapshot = { ...defaultSnapshot };
let listeners: Array<(s: ProfilingSnapshot) => void> = [];

export const profilingStore = {
  getSnapshot: () => current,
  update: (snap: Partial<ProfilingSnapshot>) => {
    current = { ...current, ...snap };
    listeners.forEach(l => l(current));
  },
  reset: () => {
    current = { ...defaultSnapshot };
  },
  subscribe: (listener: (s: ProfilingSnapshot) => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
};
