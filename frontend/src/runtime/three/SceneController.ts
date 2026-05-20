import * as THREE from 'three';

export class SceneController {
  readonly scene = new THREE.Scene();
  readonly grid = new THREE.GridHelper(24, 48, 0x1a2a3a, 0x0f1820);
  readonly axes = new THREE.AxesHelper(2);

  constructor() {
    this.scene.background = new THREE.Color(0x0a1118);
    this.scene.add(new THREE.AmbientLight(0x303845, 1.2));
    const key = new THREE.DirectionalLight(0xffeedd, 1.5);
    key.position.set(6, 14, 8);
    this.scene.add(key);
    this.scene.add(this.grid);
    this.scene.add(this.axes);
  }
}
