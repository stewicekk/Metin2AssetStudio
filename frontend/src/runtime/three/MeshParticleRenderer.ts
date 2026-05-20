import * as THREE from 'three';
import type { Emitter } from '../../types';
import { sampleCurve } from '../../utils/curveUtils';
import { clamp } from '../../utils/math';
import { TextureRegistry } from './TextureRegistry';
import { ShaderCache } from './ShaderCache';
import { SeededRandom } from './SeededRandom';
import { createParticles, resetRuntime, updateRuntime, type RuntimeEmitter } from './ParticleSimulation';
import type { CameraController } from './CameraController';

function meshVertexShader(): string {
  return `
    attribute vec3 aCenter; attribute vec2 aCorner; attribute vec3 aColor;
    attribute vec2 aSize; attribute float aAlpha; attribute float aRot; attribute float aFrame;
    attribute vec2 aUV;
    uniform float uScale; uniform vec2 uSizeScale;
    varying float vAlpha; varying vec3 vCol; varying float vFrame; varying vec2 vUV;
    void main(){
      vCol=aColor; vAlpha=aAlpha; vFrame=aFrame; vUV=aUV;
      vec3 cr=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);
      vec3 cu=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
      float c=cos(aRot),s=sin(aRot);
      vec2 rc=vec2(c*aCorner.x-s*aCorner.y,s*aCorner.x+c*aCorner.y);
      vec3 off=cr*rc.x*aSize.x*uScale + cu*rc.y*aSize.y*uScale*uSizeScale.y;
      vec4 mp=modelViewMatrix*vec4(aCenter,1.0);
      mp.xyz+=off;
      gl_Position=projectionMatrix*mp;
    }`;
}

function meshFragmentShader(useAtlas: boolean): string {
  const atlasUniforms = useAtlas
    ? 'uniform vec2 uTileOffset; uniform vec2 uTileScale;\n'
    : '';
  const atlasSampling = useAtlas
    ? 'vec2 atlasUV = uTileOffset + scrollUV * uTileScale;\n      vec4 tex = texture2D(uTex, atlasUV);'
    : 'vec4 tex = texture2D(uTex, scrollUV);';

  return `
    uniform sampler2D uTex; uniform float uCols; uniform float uRows;
    uniform vec2 uUVScroll; uniform float uTime; uniform float uColorMod;
    varying float vAlpha; varying vec3 vCol; varying float vFrame; varying vec2 vUV;
    ${atlasUniforms}
    void main(){
      if(vAlpha<0.003) discard;
      float cols=max(1.0,uCols), rows=max(1.0,uRows);
      float fi=mod(vFrame,cols*rows);
      float cx=mod(fi,cols), cy=floor(fi/cols);
      vec2 scrollUV = vec2(cx/cols,cy/rows)+(vUV+uUVScroll*uTime)/vec2(cols,rows);
      ${atlasSampling}
      if(tex.a<0.008) discard;
      vec3 finalColor = uColorMod>0.5 ? vCol+tex.rgb : vCol*tex.rgb;
      gl_FragColor=vec4(finalColor,vAlpha*tex.a);
    }`;
}

interface MeshVisualRuntime extends RuntimeEmitter {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  mesh: THREE.Mesh;
  signature: string;
  maxParticles: number;
  dirty: boolean;
  lodSkip: boolean;
}

function makeMeshSignature(emitter: Emitter): string {
  return [
    emitter.maxP, emitter.blend,
    emitter.texDataUrl ? 'custom' : (emitter.builtinTex || 'circle'),
    emitter.sheetCols, emitter.sheetRows,
    emitter.uvScrollX || 0, emitter.uvScrollY || 0,
    emitter.colorMod || 'multiply',
  ].join('|');
}

const CORNER_UV = [
  -1, -1, 0, 0,
   1, -1, 1, 0,
   1,  1, 1, 1,
  -1,  1, 0, 1,
];

function createMeshRuntime(emitter: Emitter, textures: TextureRegistry, shaderCache: ShaderCache, useAtlas: boolean): MeshVisualRuntime {
  const maxP = clamp(Math.floor(emitter.maxP), 8, 8192);
  const vertCount = maxP * 4;
  const geom = new THREE.BufferGeometry();

  const center = new Float32Array(vertCount * 3);
  const corner = new Float32Array(vertCount * 2);
  const color = new Float32Array(vertCount * 3);
  const size = new Float32Array(vertCount * 2);
  const alpha = new Float32Array(vertCount);
  const rot = new Float32Array(vertCount);
  const frame = new Float32Array(vertCount);
  const uv = new Float32Array(vertCount * 2);

  for (let i = 0; i < maxP; i++) {
    const vi = i * 4;
    for (let j = 0; j < 4; j++) {
      const idx = vi + j;
      const cj = j * 4;
      corner[idx * 2] = CORNER_UV[cj];
      corner[idx * 2 + 1] = CORNER_UV[cj + 1];
      uv[idx * 2] = CORNER_UV[cj + 2];
      uv[idx * 2 + 1] = CORNER_UV[cj + 3];
      const i3 = idx * 3;
      center[i3] = 99999; center[i3 + 1] = 99999; center[i3 + 2] = 99999;
    }
  }

  geom.setAttribute('position', new THREE.BufferAttribute(center, 3));
  geom.setAttribute('aCenter', new THREE.BufferAttribute(center, 3));
  geom.setAttribute('aCorner', new THREE.BufferAttribute(corner, 2));
  geom.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
  geom.setAttribute('aSize', new THREE.BufferAttribute(size, 2));
  geom.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  geom.setAttribute('aRot', new THREE.BufferAttribute(rot, 1));
  geom.setAttribute('aFrame', new THREE.BufferAttribute(frame, 1));
  geom.setAttribute('aUV', new THREE.BufferAttribute(uv, 2));

  const indices = new Uint16Array(maxP * 6);
  for (let i = 0; i < maxP; i++) {
    const bi = i * 4;
    const ii = i * 6;
    indices[ii] = bi; indices[ii + 1] = bi + 1; indices[ii + 2] = bi + 2;
    indices[ii + 3] = bi; indices[ii + 4] = bi + 2; indices[ii + 5] = bi + 3;
  }
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  const shaderKey = [
    'mesh', emitter.blend,
    emitter.texDataUrl ? 'custom' : (emitter.builtinTex || 'circle'),
    emitter.sheetCols, emitter.sheetRows,
    emitter.uvScrollX || 0, emitter.uvScrollY || 0,
    emitter.colorMod || 'multiply',
  ].join('|');

  const baseMat = shaderCache.getOrCreate(shaderKey, () => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: emitter.blend === 'add'
        ? THREE.AdditiveBlending
        : emitter.blend === 'modulate'
          ? THREE.MultiplyBlending
          : THREE.NormalBlending,
      vertexColors: false,
      uniforms: {
        uTex: { value: textures.resolveTexture(emitter) },
        uCols: { value: emitter.sheetCols },
        uRows: { value: emitter.sheetRows },
        uScale: { value: 1 },
        uSizeScale: { value: new THREE.Vector2(1, emitter.sizeNonUniform ? (emitter.sizeY / Math.max(0.001, emitter.sizeX)) : 1) },
        uUVScroll: { value: new THREE.Vector2(emitter.uvScrollX || 0, emitter.uvScrollY || 0) },
        uTime: { value: 0 },
        uColorMod: { value: emitter.colorMod === 'add' ? 1 : 0 },
        ...(useAtlas ? {
          uTileOffset: { value: new THREE.Vector2(0, 0) },
          uTileScale: { value: new THREE.Vector2(1, 1) },
        } : {}),
      },
      vertexShader: meshVertexShader(),
      fragmentShader: meshFragmentShader(useAtlas),
    });
  });

  const material = baseMat.clone();

  if (useAtlas) {
    const off = textures.getAtlasOffset(emitter.uid);
    const sc = textures.getAtlasScale(emitter.uid);
    const atlasTex = textures.getAtlasTexture();
    if (atlasTex) material.uniforms.uTex.value = atlasTex;
    if (material.uniforms.uTileOffset) material.uniforms.uTileOffset.value.set(off.u, off.v);
    if (material.uniforms.uTileScale) material.uniforms.uTileScale.value.set(sc.u, sc.v);
  } else {
    material.uniforms.uTex.value = textures.resolveTexture(emitter);
  }

  const mesh = new THREE.Mesh(geom, material);
  mesh.visible = emitter.visible;
  mesh.frustumCulled = false;

  const freeSlots = Array.from({ length: maxP }, (_, i) => maxP - 1 - i);
  return {
    emitter,
    particles: createParticles(maxP),
    freeSlots,
    aliveCount: 0,
    spawnAcc: 0,
    localTime: 0,
    rng: new SeededRandom(emitter.uid * 2654435761),
    geometry: geom,
    material,
    mesh,
    signature: makeMeshSignature(emitter),
    maxParticles: maxP,
    dirty: true,
    lodSkip: false,
  } as unknown as MeshVisualRuntime;
}

function writeMeshAttributes(runtime: MeshVisualRuntime): void {
  const geom = runtime.geometry;
  const centerAttr = geom.getAttribute('aCenter') as THREE.BufferAttribute;
  const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
  const colorAttr = geom.getAttribute('aColor') as THREE.BufferAttribute;
  const sizeAttr = geom.getAttribute('aSize') as THREE.BufferAttribute;
  const alphaAttr = geom.getAttribute('aAlpha') as THREE.BufferAttribute;
  const rotAttr = geom.getAttribute('aRot') as THREE.BufferAttribute;
  const frameAttr = geom.getAttribute('aFrame') as THREE.BufferAttribute;

  const emitter = runtime.emitter;
  const sizeYRatio = emitter.sizeNonUniform ? (emitter.sizeY / Math.max(0.001, emitter.sizeX)) : 1;

  for (let i = 0; i < runtime.particles.length; i++) {
    const particle = runtime.particles[i];
    const vi = i * 4;

    if (!particle.alive) {
      for (let j = 0; j < 4; j++) {
        const idx = vi + j;
        const i3 = idx * 3;
        centerAttr.array[i3] = 99999;
        centerAttr.array[i3 + 1] = 99999;
        centerAttr.array[i3 + 2] = 99999;
        posAttr.array[i3] = 99999;
        posAttr.array[i3 + 1] = 99999;
        posAttr.array[i3 + 2] = 99999;
      }
      continue;
    }

    const t = particle.age / particle.life;
    const sizeBase = particle.baseSize * sampleCurve(emitter.sizeCurve, t);

    let finalSizeX = sizeBase;
    let finalSizeY = sizeBase * sizeYRatio;
    let finalRot = particle.rot;

    if (emitter.velStretch > 0) {
      const vMag = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy + particle.vz * particle.vz);
      finalSizeX += vMag * emitter.velStretch;
      finalSizeY += vMag * emitter.velStretch * sizeYRatio;
      finalRot = Math.atan2(particle.vx, particle.vz);
    }

    finalSizeX *= 14;
    finalSizeY *= 14;

    const col = particle.col;
    const frameVal = particle.frame;
    const alphaVal = clamp(sampleCurve(emitter.alphaCurve, t) * col.a, 0, 1);

    for (let j = 0; j < 4; j++) {
      const idx = vi + j;
      const i3 = idx * 3;
      centerAttr.array[i3] = particle.px;
      centerAttr.array[i3 + 1] = particle.py;
      centerAttr.array[i3 + 2] = particle.pz;
      posAttr.array[i3] = particle.px;
      posAttr.array[i3 + 1] = particle.py;
      posAttr.array[i3 + 2] = particle.pz;
      colorAttr.array[i3] = col.r;
      colorAttr.array[i3 + 1] = col.g;
      colorAttr.array[i3 + 2] = col.b;
      sizeAttr.array[idx * 2] = finalSizeX;
      sizeAttr.array[idx * 2 + 1] = finalSizeY;
      alphaAttr.array[idx] = alphaVal;
      rotAttr.array[idx] = finalRot;
      frameAttr.array[idx] = frameVal;
    }
  }

  const attrs = [centerAttr, posAttr, colorAttr, sizeAttr, alphaAttr, rotAttr, frameAttr];
  for (const attr of attrs) {
    attr.needsUpdate = true;
  }
}

function disposeMeshRuntime(rt: MeshVisualRuntime, scene: THREE.Scene): void {
  scene.remove(rt.mesh);
  rt.geometry.dispose();
  rt.material.dispose();
}

export class MeshParticleRenderer {
  private readonly runtimes = new Map<number, MeshVisualRuntime>();
  private readonly scene: THREE.Scene;
  private readonly textures: TextureRegistry;
  private readonly shaderCache: ShaderCache;
  private cameraController: CameraController | null = null;

  constructor(scene: THREE.Scene, textures: TextureRegistry) {
    this.scene = scene;
    this.textures = textures;
    this.shaderCache = new ShaderCache();
  }

  setCameraController(cc: CameraController | null): void {
    this.cameraController = cc;
  }

  static needsMeshMode(emitter: Emitter): boolean {
    return (emitter.velStretch > 0) || emitter.sizeNonUniform;
  }

  sync(emitters: Emitter[]): void {
    const meshEmitters = emitters.filter(MeshParticleRenderer.needsMeshMode);
    const activeIds = new Set(meshEmitters.map(e => e.uid));

    const uniqueTexKeys = new Set(meshEmitters.map(e => e.texDataUrl || e.builtinTex || 'circle'));
    const useAtlas = uniqueTexKeys.size > 1;

    if (useAtlas) this.textures.buildAtlas(meshEmitters);

    this.runtimes.forEach((_rt, uid) => {
      if (!activeIds.has(uid)) {
        this.disposeRuntime(uid);
      }
    });

    meshEmitters.forEach((emitter) => {
      const sig = makeMeshSignature(emitter);
      const current = this.runtimes.get(emitter.uid);
      if (!current || current.signature !== sig) {
        if (current) this.disposeRuntime(emitter.uid);
        const rt = createMeshRuntime(emitter, this.textures, this.shaderCache, useAtlas);
        this.runtimes.set(emitter.uid, rt);
        this.scene.add(rt.mesh);
      } else {
        current.emitter = emitter;
        current.mesh.visible = emitter.visible;
        const mu = current.material.uniforms;
        if (mu.uCols) { mu.uCols.value = emitter.sheetCols; mu.uRows.value = emitter.sheetRows; }
        if (mu.uUVScroll) mu.uUVScroll.value.set(emitter.uvScrollX || 0, emitter.uvScrollY || 0);
        if (mu.uColorMod) mu.uColorMod.value = emitter.colorMod === 'add' ? 1 : 0;
        const syr = emitter.sizeNonUniform ? (emitter.sizeY / Math.max(0.001, emitter.sizeX)) : 1;
        if (mu.uSizeScale) mu.uSizeScale.value.set(1, syr);
        if (useAtlas) {
          const off = this.textures.getAtlasOffset(emitter.uid);
          const sc = this.textures.getAtlasScale(emitter.uid);
          if (mu.uTileOffset) mu.uTileOffset.value.set(off.u, off.v);
          if (mu.uTileScale) mu.uTileScale.value.set(sc.u, sc.v);
        }
        current.dirty = true;
      }
    });
  }

  reset(): void {
    this.runtimes.forEach(resetRuntime);
  }

  update(dt: number, playing: boolean, viewportScale: number): number {
    let alive = 0;
    let cameraDistance = 8;
    if (this.cameraController) cameraDistance = this.cameraController.distance;

    this.runtimes.forEach((rt) => {
      const mat = rt.material;
      mat.uniforms.uScale.value = viewportScale;
      mat.uniforms.uTime.value += dt;

      const lodFactor = clamp(1 - (cameraDistance - 5) / 45, 0, 1);
      const effectiveMaxP = Math.max(8, Math.floor(rt.maxParticles * lodFactor));
      rt.lodSkip = effectiveMaxP < 8;
      if (rt.lodSkip) return;

      alive += updateRuntime(rt, dt, playing, lodFactor);
      writeMeshAttributes(rt);
    });
    return alive;
  }

  getRuntime(uid: number): MeshVisualRuntime | undefined {
    return this.runtimes.get(uid);
  }

  runtimeCount(): number {
    return this.runtimes.size;
  }

  bufferBytes(): number {
    let bytes = 0;
    this.runtimes.forEach((rt) => {
      for (const attr of Object.values(rt.geometry.attributes)) {
        bytes += (attr as THREE.BufferAttribute).array.byteLength;
      }
    });
    return bytes;
  }

  dispose(): void {
    Array.from(this.runtimes.keys()).forEach((uid) => this.disposeRuntime(uid));
    this.shaderCache.dispose();
  }

  private disposeRuntime(uid: number): void {
    const rt = this.runtimes.get(uid);
    if (!rt) return;
    disposeMeshRuntime(rt, this.scene);
    this.runtimes.delete(uid);
  }
}
