import type { Particle } from '../../types';

interface ParticleShot {
  px: number; py: number; pz: number;
  vx: number; vy: number; vz: number;
  age: number; life: number;
  rot: number; spin: number;
  baseSize: number;
  col: { r: number; g: number; b: number; a: number };
  stretch: number;
  alive: boolean;
}

interface Snapshot {
  time: number;
  particles: ParticleShot[];
}

export interface ForceArrow {
  origin: [number, number, number];
  direction: [number, number, number];
  magnitude: number;
  label: string;
  color: string;
}

interface ForceEmitter {
  gravity: number;
  windX: number;
  windZ: number;
  turb: number;
  attractorStr: number;
  attractorY: number;
}

export class ParticleDebugger {
  private snapshots: Snapshot[] = [];
  private readonly maxSnapshots = 32;

  captureSnapshot(runtime: { particles: Particle[]; localTime: number }): void {
    const snapshot: Snapshot = {
      time: runtime.localTime,
      particles: runtime.particles.map((p) => ({
        px: p.px, py: p.py, pz: p.pz,
        vx: p.vx, vy: p.vy, vz: p.vz,
        age: p.age, life: p.life,
        rot: p.rot, spin: p.spin,
        baseSize: p.baseSize,
        col: { r: p.col.r, g: p.col.g, b: p.col.b, a: p.col.a },
        stretch: p.stretch,
        alive: p.alive,
      })),
    };
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) this.snapshots.shift();
  }

  compareSnapshots(a: number, b: number): { divergences: string[]; identical: boolean } {
    const sa = this.snapshots[a];
    const sb = this.snapshots[b];
    if (!sa || !sb) return { divergences: ['Snapshot not found'], identical: false };

    const divergences: string[] = [];
    const maxLen = Math.min(sa.particles.length, sb.particles.length);

    for (let i = 0; i < maxLen; i++) {
      const pa = sa.particles[i];
      const pb = sb.particles[i];
      if (pa.alive !== pb.alive) {
        divergences.push(`Particle ${i}: alive ${pa.alive} vs ${pb.alive}`);
        continue;
      }
      if (!pa.alive) continue;
      const dx = Math.abs(pa.px - pb.px);
      const dy = Math.abs(pa.py - pb.py);
      const dz = Math.abs(pa.pz - pb.pz);
      if (dx > 0.001 || dy > 0.001 || dz > 0.001) {
        divergences.push(`Particle ${i}: position diff (${dx.toFixed(4)}, ${dy.toFixed(4)}, ${dz.toFixed(4)})`);
      }
    }

    return { divergences, identical: divergences.length === 0 };
  }

  getHeatmap(runtime: { particles: Particle[] }, bins = 16): { density: number[][]; hotspots: number[][] } {
    const density: number[][] = Array.from({ length: bins }, () => new Array(bins).fill(0));
    const alive = runtime.particles.filter((p) => p.alive);
    if (alive.length === 0) return { density, hotspots: [] };

    let minX = Infinity; let maxX = -Infinity;
    let minZ = Infinity; let maxZ = -Infinity;
    for (const p of alive) {
      if (p.px < minX) minX = p.px;
      if (p.px > maxX) maxX = p.px;
      if (p.pz < minZ) minZ = p.pz;
      if (p.pz > maxZ) maxZ = p.pz;
    }
    const rangeX = Math.max(maxX - minX, 0.01);
    const rangeZ = Math.max(maxZ - minZ, 0.01);

    for (const p of alive) {
      const bx = Math.min(Math.floor(((p.px - minX) / rangeX) * bins), bins - 1);
      const bz = Math.min(Math.floor(((p.pz - minZ) / rangeZ) * bins), bins - 1);
      density[bz][bx]++;
    }

    const hotspots: number[][] = [];
    let maxDensity = 0;
    for (let z = 0; z < bins; z++) {
      for (let x = 0; x < bins; x++) {
        if (density[z][x] > maxDensity) maxDensity = density[z][x];
      }
    }
    const threshold = maxDensity * 0.75;
    for (let z = 0; z < bins; z++) {
      for (let x = 0; x < bins; x++) {
        if (density[z][x] >= threshold) hotspots.push([x, z]);
      }
    }

    return { density, hotspots };
  }

  visualizeForces(runtime: { particles: Particle[]; emitter: ForceEmitter }): ForceArrow[] {
    const forces: ForceArrow[] = [];
    const e = runtime.emitter;

    if (e.gravity !== 0) {
      forces.push({
        origin: [0, 0, 0],
        direction: [0, -Math.sign(e.gravity), 0],
        magnitude: Math.abs(e.gravity),
        label: 'gravity', color: '#00ff00',
      });
    }

    if (e.windX !== 0 || e.windZ !== 0) {
      forces.push({
        origin: [0, 0, 0],
        direction: [e.windX, 0, e.windZ],
        magnitude: Math.sqrt(e.windX * e.windX + e.windZ * e.windZ),
        label: 'wind', color: '#0088ff',
      });
    }

    if (e.turb !== 0) {
      forces.push({
        origin: [0, 0, 0],
        direction: [1, 0, 0],
        magnitude: Math.abs(e.turb),
        label: 'turbulence', color: '#ff8800',
      });
    }

    if (e.attractorStr !== 0) {
      forces.push({
        origin: [0, e.attractorY, 0],
        direction: [0, 1, 0],
        magnitude: Math.abs(e.attractorStr),
        label: 'attractor', color: '#ff00ff',
      });
    }

    return forces;
  }

  clear(): void {
    this.snapshots = [];
  }
}
