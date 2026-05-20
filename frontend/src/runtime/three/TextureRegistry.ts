import * as THREE from 'three';
import type { Emitter } from '../../types';

export class TextureRegistry {
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly loadingPromises = new Map<string, Promise<THREE.Texture>>();
  private readonly atlasOffsets = new Map<number, { u: number; v: number }>();
  private readonly atlasScale = new Map<number, { u: number; v: number }>();
  private atlasTexture: THREE.Texture | null = null;

  getBuiltin(type: string): THREE.Texture {
    const key = type || 'circle';
    const cached = this.textures.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context is unavailable');

    ctx.clearRect(0, 0, 128, 128);
    this.drawTexture(ctx, key);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.textures.set(key, texture);
    return texture;
  }

  resolveTexture(emitter: Emitter): THREE.Texture {
    if (emitter.texDataUrl) {
      const cached = this.textures.get(emitter.texDataUrl);
      if (cached) return cached;
      const img = new Image();
      const texture = new THREE.Texture(img);
      texture.colorSpace = THREE.SRGBColorSpace;
      img.onload = () => { texture.needsUpdate = true; };
      img.src = emitter.texDataUrl;
      this.textures.set(emitter.texDataUrl, texture);
      return texture;
    }
    return this.getBuiltin(emitter.builtinTex || 'circle');
  }

  async loadTexture(url: string): Promise<THREE.Texture> {
    const cached = this.textures.get(url);
    if (cached) return cached;

    const pending = this.loadingPromises.get(url);
    if (pending) return pending;

    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          this.textures.set(url, texture);
          this.loadingPromises.delete(url);
          resolve(texture);
        },
        undefined,
        (err) => {
          this.loadingPromises.delete(url);
          reject(err);
        },
      );
    });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  buildAtlas(emitters: Emitter[]): { texture: THREE.Texture; offsets: Map<number, { u: number; v: number }> } {
    this.atlasOffsets.clear();
    this.atlasScale.clear();

    const uniqueTextures = new Map<string, { emitterIds: number[]; tex: THREE.Texture }>();

    for (const emitter of emitters) {
      const tex = this.resolveTexture(emitter);
      const key = emitter.texDataUrl || emitter.builtinTex || 'circle';
      let entry = uniqueTextures.get(key);
      if (!entry) {
        entry = { emitterIds: [], tex };
        uniqueTextures.set(key, entry);
      }
      entry.emitterIds.push(emitter.uid);
    }

    if (uniqueTextures.size <= 1) {
      const iter = uniqueTextures.entries();
      const first = iter.next();
      if (first.done) {
        const defaultTex = this.getBuiltin('circle');
        return { texture: defaultTex, offsets: this.atlasOffsets };
      }
      const [, entry] = first.value;
      for (const id of entry.emitterIds) {
        this.atlasOffsets.set(id, { u: 0, v: 0 });
        this.atlasScale.set(id, { u: 1, v: 1 });
      }
      return { texture: entry.tex, offsets: this.atlasOffsets };
    }

    const atlasSize = 1024;
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = atlasSize;
    atlasCanvas.height = atlasSize;
    const ctx = atlasCanvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    ctx.clearRect(0, 0, atlasSize, atlasSize);

    const count = uniqueTextures.size;
    const gridCols = Math.ceil(Math.sqrt(count));
    const gridRows = Math.ceil(count / gridCols);
    const tileW = atlasSize / gridCols;
    const tileH = atlasSize / gridRows;

    let idx = 0;
    for (const [, entry] of uniqueTextures) {
      const tx = (idx % gridCols) * tileW;
      const ty = Math.floor(idx / gridCols) * tileH;
      const srcTex = entry.tex;
      if (srcTex.image && (srcTex.image instanceof HTMLImageElement || srcTex.image instanceof HTMLCanvasElement || srcTex.image instanceof ImageBitmap)) {
        ctx.drawImage(srcTex.image as CanvasImageSource, tx, ty, tileW, tileH);
      }
      const u = tx / atlasSize;
      const v = ty / atlasSize;
      const su = tileW / atlasSize;
      const sv = tileH / atlasSize;
      for (const id of entry.emitterIds) {
        this.atlasOffsets.set(id, { u, v });
        this.atlasScale.set(id, { u: su, v: sv });
      }
      idx++;
    }

    if (this.atlasTexture) {
      this.atlasTexture.dispose();
    }

    const atlasTex = new THREE.CanvasTexture(atlasCanvas);
    atlasTex.colorSpace = THREE.SRGBColorSpace;
    atlasTex.generateMipmaps = true;
    atlasTex.minFilter = THREE.LinearMipmapLinearFilter;
    this.atlasTexture = atlasTex;
    this.textures.set('__atlas__', atlasTex);

    return { texture: atlasTex, offsets: this.atlasOffsets };
  }

  getAtlasOffset(emitterId: number): { u: number; v: number } {
    return this.atlasOffsets.get(emitterId) || { u: 0, v: 0 };
  }

  getAtlasScale(emitterId: number): { u: number; v: number } {
    return this.atlasScale.get(emitterId) || { u: 1, v: 1 };
  }

  getAtlasTexture(): THREE.Texture | null {
    return this.atlasTexture;
  }

  dispose(): void {
    this.textures.forEach((texture) => texture.dispose());
    this.textures.clear();
    this.loadingPromises.clear();
    this.atlasTexture = null;
    this.atlasOffsets.clear();
    this.atlasScale.clear();
  }

  private drawTexture(ctx: CanvasRenderingContext2D, type: string): void {
    if (type === 'ring') {
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      ctx.lineWidth = 12;
      ctx.shadowColor = 'rgba(255,255,255,.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(64, 64, 48, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    if (type === 'spark' || type === 'arrow') {
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.22, 'rgba(255,255,255,.95)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save();
      ctx.translate(64, 64);
      ctx.scale(type === 'arrow' ? 0.32 : 1, type === 'arrow' ? 1 : 0.16);
      ctx.fillStyle = gradient;
      ctx.fillRect(-64, -360, 128, 720);
      ctx.restore();
      return;
    }

    if (type === 'flame') {
      const gradient = ctx.createRadialGradient(64, 92, 0, 64, 92, 58);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.25, 'rgba(255,220,110,.9)');
      gradient.addColorStop(0.62, 'rgba(255,90,0,.45)');
      gradient.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(64, 124);
      ctx.bezierCurveTo(28, 86, 42, 38, 64, 10);
      ctx.bezierCurveTo(88, 42, 102, 86, 64, 124);
      ctx.fill();
      return;
    }

    if (type === 'star') {
      ctx.save();
      ctx.translate(64, 64);
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.beginPath();
      for (let i = 0; i < 5; i += 1) {
        const outer = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const inner = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
        if (i === 0) ctx.moveTo(58 * Math.cos(outer), 58 * Math.sin(outer));
        else ctx.lineTo(58 * Math.cos(outer), 58 * Math.sin(outer));
        ctx.lineTo(24 * Math.cos(inner), 24 * Math.sin(inner));
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,.95)');
    gradient.addColorStop(0.65, 'rgba(255,255,255,.45)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
}
