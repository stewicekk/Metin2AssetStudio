import * as THREE from 'three';

export class ShaderCache {
  private materials = new Map<string, THREE.ShaderMaterial>();

  getOrCreate(key: string, factory: () => THREE.ShaderMaterial): THREE.ShaderMaterial {
    const existing = this.materials.get(key);
    if (existing) return existing;
    const material = factory();
    this.materials.set(key, material);
    return material;
  }

  invalidate(key: string): void {
    const mat = this.materials.get(key);
    if (mat) {
      mat.dispose();
      this.materials.delete(key);
    }
  }

  dispose(): void {
    this.materials.forEach((mat) => mat.dispose());
    this.materials.clear();
  }
}
