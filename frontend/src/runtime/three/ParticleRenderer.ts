import * as THREE from 'three';
import type { Emitter } from '../../types';
import { sampleCurve } from '../../utils/curveUtils';
import { clamp } from '../../utils/math';
import { SeededRandom } from './SeededRandom';
import { createParticles, resetRuntime, updateRuntime, type RuntimeEmitter } from './ParticleSimulation';
import { TextureRegistry } from './TextureRegistry';
import { ShaderCache } from './ShaderCache';
import { MeshParticleRenderer } from './MeshParticleRenderer';
import type { CameraController } from './CameraController';

interface DirtyRange {
  min: number;
  max: number;
}

interface VisualRuntime extends RuntimeEmitter {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  points: THREE.Points;
  signature: string;
  maxParticles: number;
  dirtyRange: DirtyRange;
  needsFullUpload: boolean;
  lodSkip: boolean;
}

function makeShaderKey(emitter: Emitter, useAtlas: boolean): string {
  return [
    emitter.blend,
    emitter.texDataUrl ? 'custom' : (emitter.builtinTex || 'circle'),
    emitter.sheetCols,
    emitter.sheetRows,
    useAtlas ? 'atlas' : 'single',
    emitter.uvScrollX || 0,
    emitter.uvScrollY || 0,
    emitter.colorMod || 'multiply',
  ].join('|');
}

function makeBaseSignature(emitter: Emitter): string {
  return [
    emitter.maxP,
    emitter.blend,
    emitter.builtinTex,
    emitter.texDataUrl ? 'custom' : '',
    emitter.sheetCols,
    emitter.sheetRows,
  ].join('|');
}

function buildVertexShader(): string {
  return `
    attribute float aSize; attribute float aAlpha; attribute float aFrame; attribute float aRot;
    varying float vAlpha; varying vec3 vCol; varying float vFrame; varying float vRot;
    uniform float uScale;
    void main(){
      vCol=color; vAlpha=aAlpha; vFrame=aFrame; vRot=aRot;
      vec4 mv=modelViewMatrix*vec4(position,1.0);
      gl_PointSize=max(0.5,aSize*uScale*(420.0/-mv.z));
      gl_Position=projectionMatrix*mv;
    }`;
}

function buildFragmentShader(useAtlas: boolean): string {
  const atlasUniforms = useAtlas
    ? 'uniform vec2 uTileOffset; uniform vec2 uTileScale;\n'
    : '';
  const atlasSampling = useAtlas
    ? 'vec2 atlasUV = uTileOffset + scrollUV * uTileScale;\n      vec4 tex = texture2D(uTex, atlasUV);'
    : 'vec4 tex = texture2D(uTex, scrollUV);';

  return `
    uniform sampler2D uTex; uniform float uCols; uniform float uRows;
    uniform vec2 uUVScroll; uniform float uTime; uniform float uColorMod;
    varying float vAlpha; varying vec3 vCol; varying float vFrame; varying float vRot;
    ${atlasUniforms}
    void main(){
      if(vAlpha<0.003) discard;
      float cols=max(1.0,uCols), rows=max(1.0,uRows);
      float fi=mod(vFrame,cols*rows);
      float cx=mod(fi,cols), cy=floor(fi/cols);
      vec2 uv=gl_PointCoord-0.5;
      float c=cos(vRot), s=sin(vRot);
      uv=vec2(c*uv.x-s*uv.y,s*uv.x+c*uv.y)+0.5;
      if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0) discard;
      vec2 scrollUV = vec2(cx/cols,cy/rows)+(uv+uUVScroll*uTime)/vec2(cols,rows);
      ${atlasSampling}
      if(tex.a<0.008) discard;
      vec3 finalColor = uColorMod>0.5 ? vCol+tex.rgb : vCol*tex.rgb;
      gl_FragColor=vec4(finalColor,vAlpha*tex.a);
    }`;
}

export class ParticleRenderer {
  private readonly runtimes = new Map<number, VisualRuntime>();
  private readonly scene: THREE.Scene;
  private readonly textures: TextureRegistry;
  private readonly shaderCache: ShaderCache;
  private readonly meshRenderer: MeshParticleRenderer;
  private cameraController: CameraController | null = null;

  constructor(scene: THREE.Scene, textures: TextureRegistry) {
    this.scene = scene;
    this.textures = textures;
    this.shaderCache = new ShaderCache();
    this.meshRenderer = new MeshParticleRenderer(scene, textures);
  }

  setCameraController(cc: CameraController | null): void {
    this.cameraController = cc;
    this.meshRenderer.setCameraController(cc);
  }

  sync(emitters: Emitter[]): void {
    const uniqueTexKeys = new Set(emitters.map(e => e.texDataUrl || e.builtinTex || 'circle'));
    const useAtlas = uniqueTexKeys.size > 1;

    if (useAtlas) {
      this.textures.buildAtlas(emitters);
    }

    this.meshRenderer.sync(emitters);
    const pointEmitters = emitters.filter(e => !MeshParticleRenderer.needsMeshMode(e));
    const activeIds = new Set(pointEmitters.map((emitter) => emitter.uid));

    this.runtimes.forEach((_runtime, uid) => {
      if (!activeIds.has(uid)) this.disposeRuntime(uid);
    });

    pointEmitters.forEach((emitter) => {
      const baseSig = makeBaseSignature(emitter);
      const current = this.runtimes.get(emitter.uid);
      if (!current || current.signature !== baseSig) {
        if (current) this.disposeRuntime(emitter.uid);
        this.runtimes.set(emitter.uid, this.createRuntime(emitter, baseSig, useAtlas));
      } else {
        current.emitter = emitter;
        current.points.visible = emitter.visible;
        const mu = current.material.uniforms;
        if (mu.uCols) {
          mu.uCols.value = emitter.sheetCols;
          mu.uRows.value = emitter.sheetRows;
        }
        if (mu.uUVScroll) {
          mu.uUVScroll.value.set(emitter.uvScrollX || 0, emitter.uvScrollY || 0);
        }
        if (mu.uColorMod) {
          mu.uColorMod.value = emitter.colorMod === 'add' ? 1 : 0;
        }
        if (useAtlas) {
          const off = this.textures.getAtlasOffset(emitter.uid);
          const sc = this.textures.getAtlasScale(emitter.uid);
          if (mu.uTileOffset) {
            mu.uTileOffset.value.set(off.u, off.v);
          }
          if (mu.uTileScale) {
            mu.uTileScale.value.set(sc.u, sc.v);
          }
        }
        current.needsFullUpload = true;
      }
    });
  }

  reset(): void {
    this.runtimes.forEach(resetRuntime);
    this.meshRenderer.reset();
  }

  update(dt: number, playing: boolean, viewportScale: number): number {
    let alive = 0;
    let cameraDistance = 8;
    if (this.cameraController) {
      cameraDistance = this.cameraController.distance;
    }

    this.runtimes.forEach((runtime) => {
      const mat = runtime.material;
      mat.uniforms.uScale.value = viewportScale;
      mat.uniforms.uTime.value += dt;

      const lodFactor = clamp(1 - (cameraDistance - 5) / 45, 0, 1);
      const effectiveMaxP = Math.max(8, Math.floor(runtime.maxParticles * lodFactor));

      runtime.lodSkip = effectiveMaxP < 8;
      if (runtime.lodSkip) return;

      alive += updateRuntime(runtime, dt, playing, lodFactor);
      this.writeAttributes(runtime);
    });
    alive += this.meshRenderer.update(dt, playing, viewportScale);
    return alive;
  }

  getRuntime(uid: number): VisualRuntime | undefined {
    return this.runtimes.get(uid);
  }

  runtimeCount(): number {
    return this.runtimes.size;
  }

  meshCount(): number {
    return this.meshRenderer.runtimeCount();
  }

  bufferBytes(): number {
    let bytes = 0;
    this.runtimes.forEach((rt) => {
      for (const attr of Object.values(rt.geometry.attributes)) {
        bytes += (attr as THREE.BufferAttribute).array.byteLength;
      }
    });
    bytes += this.meshRenderer.bufferBytes();
    return bytes;
  }

  dispose(): void {
    Array.from(this.runtimes.keys()).forEach((uid) => this.disposeRuntime(uid));
    this.meshRenderer.dispose();
    this.shaderCache.dispose();
  }

  private createRuntime(emitter: Emitter, signature: string, useAtlas: boolean): VisualRuntime {
    const maxParticles = clamp(Math.floor(emitter.maxP), 8, 8192);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxParticles * 3).fill(99999), 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(maxParticles), 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxParticles * 3).fill(1), 3));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(maxParticles), 1));
    geometry.setAttribute('aFrame', new THREE.BufferAttribute(new Float32Array(maxParticles), 1));
    geometry.setAttribute('aRot', new THREE.BufferAttribute(new Float32Array(maxParticles), 1));

    const shaderKey = makeShaderKey(emitter, useAtlas);
    const baseMat = this.shaderCache.getOrCreate(shaderKey, () => {
      return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: emitter.blend === 'add'
          ? THREE.AdditiveBlending
          : emitter.blend === 'modulate'
            ? THREE.CustomBlending
            : THREE.NormalBlending,
        blendSrc: emitter.blend === 'modulate' ? THREE.ZeroFactor : THREE.SrcAlphaFactor,
        blendDst: emitter.blend === 'modulate' ? THREE.SrcColorFactor : THREE.OneMinusSrcAlphaFactor,
        vertexColors: true,
        uniforms: {
          uTex: { value: this.textures.resolveTexture(emitter) },
          uCols: { value: emitter.sheetCols },
          uRows: { value: emitter.sheetRows },
          uScale: { value: 1 },
          uUVScroll: { value: new THREE.Vector2(emitter.uvScrollX || 0, emitter.uvScrollY || 0) },
          uTime: { value: 0 },
          uColorMod: { value: emitter.colorMod === 'add' ? 1 : 0 },
          ...(useAtlas ? {
            uTileOffset: { value: new THREE.Vector2(0, 0) },
            uTileScale: { value: new THREE.Vector2(1, 1) },
          } : {}),
        },
        vertexShader: buildVertexShader(),
        fragmentShader: buildFragmentShader(useAtlas),
      });
    });

    const material = baseMat.clone();

    if (useAtlas) {
      const off = this.textures.getAtlasOffset(emitter.uid);
      const sc = this.textures.getAtlasScale(emitter.uid);
      const atlasTex = this.textures.getAtlasTexture();
      if (atlasTex) material.uniforms.uTex.value = atlasTex;
      if (material.uniforms.uTileOffset) {
        material.uniforms.uTileOffset.value = new THREE.Vector2(off.u, off.v);
      }
      if (material.uniforms.uTileScale) {
        material.uniforms.uTileScale.value = new THREE.Vector2(sc.u, sc.v);
      }
    } else {
      material.uniforms.uTex.value = this.textures.resolveTexture(emitter);
    }

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.visible = emitter.visible;
    this.scene.add(points);

    const freeSlots = Array.from({ length: maxParticles }, (_, i) => maxParticles - 1 - i);
    return {
      emitter,
      particles: createParticles(maxParticles),
      freeSlots,
      aliveCount: 0,
      spawnAcc: 0,
      localTime: 0,
      rng: new SeededRandom(emitter.uid * 2654435761),
      geometry,
      material,
      points,
      signature,
      maxParticles,
      dirtyRange: { min: maxParticles, max: -1 },
      needsFullUpload: true,
      lodSkip: false,
      dirty: true,
    };
  }

  private writeAttributes(runtime: VisualRuntime): void {
    const pos = runtime.geometry.getAttribute('position') as THREE.BufferAttribute;
    const size = runtime.geometry.getAttribute('aSize') as THREE.BufferAttribute;
    const color = runtime.geometry.getAttribute('color') as THREE.BufferAttribute;
    const alpha = runtime.geometry.getAttribute('aAlpha') as THREE.BufferAttribute;
    const frame = runtime.geometry.getAttribute('aFrame') as THREE.BufferAttribute;
    const rot = runtime.geometry.getAttribute('aRot') as THREE.BufferAttribute;

    const emitter = runtime.emitter;
    const camPos = this.cameraController?.camera?.position;
    const sx = camPos?.x ?? 0;
    const sy = camPos?.y ?? 5;
    const sz = camPos?.z ?? 10;

    const alive: { idx: number; dist: number }[] = [];
    runtime.particles.forEach((p, i) => {
      if (p.alive) {
        const dx = p.px - sx;
        const dy = p.py - sy;
        const dz = p.pz - sz;
        alive.push({ idx: i, dist: dx * dx + dy * dy + dz * dz });
      }
    });
    alive.sort((a, b) => b.dist - a.dist);

    const total = runtime.maxParticles;
    let writeIdx = 0;

    for (const entry of alive) {
      const particle = runtime.particles[entry.idx];
      const i3 = writeIdx * 3;
      const t = particle.age / particle.life;
      let sizeBase = particle.baseSize * sampleCurve(emitter.sizeCurve, t) * 14;
      if (emitter.velStretch > 0) {
        const vMag = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy + particle.vz * particle.vz);
        sizeBase += vMag * emitter.velStretch * 14;
      }
      pos.array[i3] = particle.px;
      pos.array[i3 + 1] = particle.py;
      pos.array[i3 + 2] = particle.pz;
      size.array[writeIdx] = sizeBase;
      color.array[i3] = particle.col.r;
      color.array[i3 + 1] = particle.col.g;
      color.array[i3 + 2] = particle.col.b;
      alpha.array[writeIdx] = clamp(sampleCurve(emitter.alphaCurve, t) * particle.col.a, 0, 1);
      frame.array[writeIdx] = particle.frame;
      const finalRot = particle.stretch > 0 ? particle.stretchRot : particle.rot;
      rot.array[writeIdx] = finalRot;
      writeIdx++;
    }

    for (let i = writeIdx; i < total; i++) {
      const i3 = i * 3;
      pos.array[i3] = 99999;
      pos.array[i3 + 1] = 99999;
      pos.array[i3 + 2] = 99999;
      size.array[i] = 0;
      alpha.array[i] = 0;
    }

    this.uploadAttr(pos, 0, total * 3, true);
    this.uploadAttr(size, 0, total, true);
    this.uploadAttr(alpha, 0, total, true);
    this.uploadAttr(frame, 0, total, true);
    this.uploadAttr(rot, 0, total, true);
    this.uploadAttr(color, 0, total * 3, true);
  }

  private uploadAttr(attr: THREE.BufferAttribute, offset: number, count: number, forceFull: boolean): void {
    attr.clearUpdateRanges();
    if (!forceFull) {
      attr.addUpdateRange(offset, count);
    }
    attr.needsUpdate = true;
  }

  private disposeRuntime(uid: number): void {
    const runtime = this.runtimes.get(uid);
    if (!runtime) return;
    this.scene.remove(runtime.points);
    runtime.geometry.dispose();
    runtime.material.dispose();
    this.runtimes.delete(uid);
  }
}
