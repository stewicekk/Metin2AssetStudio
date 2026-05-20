import * as THREE from 'three';
import type { Emitter, Particle } from '../../types';
import { sampleColor, sampleCurve } from '../../utils/curveUtils';
import { clamp } from '../../utils/math';
import { SeededRandom } from './SeededRandom';
import { vec3Pool } from '../../utils/mathPool';

export interface RuntimeEmitter {
  emitter: Emitter;
  particles: Particle[];
  freeSlots: number[];
  aliveCount: number;
  spawnAcc: number;
  localTime: number;
  rng: SeededRandom;
  dirty: boolean;
}

export function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    alive: false, age: 0, life: 0,
    px: 0, py: 0, pz: 0,
    vx: 0, vy: 0, vz: 0,
    rot: 0, spin: 0, baseSize: 1,
    col: { r: 1, g: 1, b: 1, a: 1 },
    frame: 0,
    boneOx: 0, boneOy: 0, boneOz: 0,
    stretchRot: 0, stretch: 0,
  }));
}

export function resetRuntime(runtime: RuntimeEmitter): void {
  const p = runtime.particles;
  for (let i = 0; i < p.length; i++) p[i].alive = false;
  runtime.freeSlots = Array.from({ length: runtime.particles.length }, (_, i) => runtime.particles.length - 1 - i);
  runtime.aliveCount = 0;
  runtime.spawnAcc = 0;
  runtime.localTime = 0;
  runtime.rng = new SeededRandom(runtime.emitter.uid * 2654435761);
  runtime.dirty = false;
}

export function spawnParticle(runtime: RuntimeEmitter): void {
  const emitter = runtime.emitter;
  const idx = runtime.freeSlots.pop();
  if (idx === undefined) return;
  const slot = runtime.particles[idx];
  runtime.aliveCount++;

  slot.alive = true;
  slot.age = 0;
  slot.life = Math.max(0.01, emitter.life + runtime.rng.centered(emitter.lifeRnd));

  const radius = Math.max(0.01, emitter.shapeRadius || 0.35);
  let ox = 0, oy = 0, oz = 0;

  if (emitter.shape === 'box') {
    ox = runtime.rng.centered(radius * 0.7);
    oy = runtime.rng.centered(radius * 0.7);
    oz = runtime.rng.centered(radius * 0.7);
  } else if (emitter.shape === 'sphere' || emitter.shape === 'spherevol') {
    const r = emitter.shape === 'spherevol' ? Math.cbrt(runtime.rng.next()) * radius : radius;
    const theta = runtime.rng.next() * Math.PI;
    const phi = runtime.rng.next() * Math.PI * 2;
    ox = r * Math.sin(theta) * Math.cos(phi);
    oy = r * Math.cos(theta);
    oz = r * Math.sin(theta) * Math.sin(phi);
  } else if (emitter.shape === 'ring' || emitter.shape === 'disc' || emitter.shape === 'cone') {
    const angle = runtime.rng.next() * Math.PI * 2;
    const r = emitter.shape === 'ring' ? radius
      : emitter.shape === 'cone' ? Math.sqrt(runtime.rng.next()) * radius * 0.7
      : Math.sqrt(runtime.rng.next()) * radius;
    ox = r * Math.cos(angle);
    oz = r * Math.sin(angle);
  }

  slot.boneOx = 0;
  slot.boneOy = 0;
  slot.boneOz = 0;
  slot.px = ox;
  slot.py = oy;
  slot.pz = oz;

  const yaw = THREE.MathUtils.degToRad(emitter.dirYaw);
  const pitch = THREE.MathUtils.degToRad(emitter.dirPitch);
  const direction = vec3Pool.acquire();
  direction.set(Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)).normalize();
  const axis = vec3Pool.acquire();
  axis.set(runtime.rng.centered(), runtime.rng.centered(), runtime.rng.centered()).normalize();
  direction.applyAxisAngle(axis, runtime.rng.centered(THREE.MathUtils.degToRad(emitter.spread) * 0.5));
  const speed = Math.max(0, emitter.speed + runtime.rng.centered(emitter.speedRnd));
  slot.vx = direction.x * speed;
  slot.vy = direction.y * speed;
  slot.vz = direction.z * speed;
  vec3Pool.release(axis);
  vec3Pool.release(direction);

  if (emitter.rotType === 'NONE') {
    slot.rot = 0;
    slot.spin = 0;
  } else if (emitter.rotType === 'RANDOM') {
    slot.rot = THREE.MathUtils.degToRad(runtime.rng.next() * 360);
    slot.spin = 0;
  } else {
    slot.rot = THREE.MathUtils.degToRad(emitter.initRot + runtime.rng.centered(emitter.initRotRnd));
    slot.spin = THREE.MathUtils.degToRad(emitter.spin + runtime.rng.centered(Math.abs(emitter.spinRnd)));
  }

  slot.baseSize = Math.max(0.001, emitter.sizeX + runtime.rng.centered(emitter.sizeRnd));
  slot.col = { ...sampleColor(emitter.colorKeys, 0) };
  slot.frame = emitter.uvAnim === 'rand' ? Math.floor(runtime.rng.next() * emitter.sheetCols * emitter.sheetRows) : 0;
}

export function updateRuntime(runtime: RuntimeEmitter, dt: number, playing: boolean, lodFactor = 1): number {
  const emitter = runtime.emitter;
  if (playing) {
    if (emitter.loop && emitter.cycle > 0 && runtime.localTime >= emitter.cycle) {
      runtime.localTime = 0;
      runtime.spawnAcc = 0;
    }
    runtime.localTime += dt;

    const delay = emitter.delay || 0;
    if (runtime.localTime >= delay) {
      if (emitter.burst > 0 && runtime.localTime - dt < delay + dt && runtime.localTime >= delay) {
        for (let i = 0; i < emitter.burst; i += 1) spawnParticle(runtime);
      }

      if (emitter.loop || runtime.localTime <= emitter.cycle) {
        const effectiveRate = emitter.rate * lodFactor;
        runtime.spawnAcc += effectiveRate * dt;
        const count = Math.floor(runtime.spawnAcc);
        runtime.spawnAcc -= count;
        for (let i = 0; i < Math.min(count, 16); i += 1) spawnParticle(runtime);
      }
    }
  }

  const totalFrames = Math.max(1, emitter.sheetCols * emitter.sheetRows);
  const drag = Math.max(0, 1 - emitter.drag * dt);
  let alive = 0;

  for (let i = 0; i < runtime.particles.length; i++) {
    const particle = runtime.particles[i];
    if (!particle.alive) continue;
    particle.age += dt;
    if (particle.age >= particle.life) {
      particle.alive = false;
      runtime.freeSlots.push(i);
      runtime.aliveCount--;
      continue;
    }

    alive += 1;
    const t = particle.age / particle.life;
    const speedMul = sampleCurve(emitter.speedCurve, t);
    particle.vy += emitter.gravity * dt;
    particle.vx += emitter.windX * dt;
    particle.vz += emitter.windZ * dt;
    particle.vx *= drag;
    particle.vy *= drag;
    particle.vz *= drag;

    if (emitter.turb && emitter.turb !== 0) {
      const phase = runtime.localTime * (emitter.turbFreq || 1);
      const tx = Math.sin(phase * 1.7 + particle.px * 3.1 + i * 0.3) * emitter.turb;
      const ty = Math.sin(phase * 2.1 + particle.py * 2.7 + i * 0.7) * emitter.turb * 0.5;
      const tz = Math.cos(phase * 1.9 + particle.pz * 3.3 + i * 0.5) * emitter.turb;
      particle.vx += tx * dt;
      particle.vy += ty * dt;
      particle.vz += tz * dt;
    }

    if (emitter.attractorStr && emitter.attractorStr !== 0) {
      const ay = emitter.attractorY ?? 0;
      const bx = 0, bz = 0;
      const dax = bx - particle.px;
      const day = ay - particle.py;
      const daz = bz - particle.pz;
      const dLen = Math.sqrt(dax * dax + day * day + daz * daz) + 0.001;
      const aF = emitter.attractorStr * dt / dLen;
      particle.vx += dax * aF;
      particle.vy += day * aF;
      particle.vz += daz * aF;
    }

    particle.px += particle.vx * speedMul * dt;
    particle.py += particle.vy * speedMul * dt;
    particle.pz += particle.vz * speedMul * dt;

    if (emitter.groundBounce && particle.py < 0 && particle.vy < 0) {
      particle.py = 0;
      particle.vy = -particle.vy * emitter.bounceFac;
      particle.vx *= 0.85;
      particle.vz *= 0.85;
    }

    particle.rot += particle.spin * sampleCurve(emitter.spinCurve, t) * dt;
    particle.col = sampleColor(emitter.colorKeys, t);

    if (emitter.velStretch && emitter.velStretch !== 0) {
      const sp = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy + particle.vz * particle.vz);
      if (sp > 0.01) {
        particle.stretchRot = Math.atan2(particle.vx, particle.vz);
        particle.stretch = emitter.velStretch;
      } else {
        particle.stretch = 0;
      }
    }

    if (emitter.uvAnim === 'loop') particle.frame = Math.floor(particle.age * emitter.animFPS) % totalFrames;
    else if (emitter.uvAnim === 'once') particle.frame = Math.min(Math.floor(particle.age * emitter.animFPS), totalFrames - 1);
    else if (emitter.uvAnim === 'life') particle.frame = clamp(Math.floor(t * totalFrames), 0, totalFrames - 1);
  }

  runtime.dirty = false;
  return alive;
}
