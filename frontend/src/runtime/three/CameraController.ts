import * as THREE from 'three';
import { clamp } from '../../utils/math';

export class CameraController {
  private phi = Math.PI / 4;
  private theta = Math.PI / 4;
  private radius = 8;
  private readonly target = new THREE.Vector3(0, 1, 0);
  private orbiting = false;
  private panning = false;
  private last = { x: 0, y: 0 };

  private readonly _camera: THREE.PerspectiveCamera;
  private readonly element: HTMLElement;
  private readonly _v3 = new THREE.Vector3();
  private readonly _v3_2 = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, element: HTMLElement) {
    this._camera = camera;
    this.element = element;
    this.update();
    this.bind();
  }

  get distance(): number { return this.radius; }
  get camera(): THREE.PerspectiveCamera { return this._camera; }
  getTarget(): THREE.Vector3 { return this.target.clone(); }

  dispose(): void {
    this.element.oncontextmenu = null;
    this.element.onpointerdown = null;
    this.element.onpointermove = null;
    this.element.onpointerup = null;
    this.element.onwheel = null;
  }

  reset(): void {
    this.phi = Math.PI / 4;
    this.theta = Math.PI / 4;
    this.radius = 8;
    this.target.set(0, 1, 0);
    this.update();
  }

  setView(view: 'front' | 'top' | 'persp'): void {
    this.radius = 8;
    if (view === 'front') { this.phi = 0; this.theta = Math.PI / 2; }
    else if (view === 'top') { this.phi = 0; this.theta = 0.04; }
    else if (view === 'persp') { this.phi = Math.PI / 4; this.theta = Math.PI / 4; }
    this.target.set(0, 1, 0);
    this.update();
  }

  private bind(): void {
    this.element.oncontextmenu = (event) => event.preventDefault();
    this.element.onpointerdown = (event) => {
      this.element.setPointerCapture(event.pointerId);
      this.orbiting = event.button === 2;
      this.panning = event.button === 1;
      this.last = { x: event.clientX, y: event.clientY };
    };
    this.element.onpointermove = (event) => {
      if (this.orbiting) {
        this.phi -= (event.clientX - this.last.x) * 0.006;
        this.theta = clamp(this.theta + (event.clientY - this.last.y) * 0.006, 0.04, Math.PI - 0.04);
        this.last = { x: event.clientX, y: event.clientY };
        this.update();
      }
      if (this.panning) {
        const dx = (event.clientX - this.last.x) * 0.004 * this.radius;
        const dy = (event.clientY - this.last.y) * 0.004 * this.radius;
        const right = this._v3.crossVectors(this._camera.getWorldDirection(this._v3_2), new THREE.Vector3(0, 1, 0)).normalize();
        this.target.addScaledVector(right, -dx);
        this.target.y += dy;
        this.last = { x: event.clientX, y: event.clientY };
        this.update();
      }
    };
    this.element.onpointerup = () => {
      this.orbiting = false;
      this.panning = false;
    };
    this.element.onwheel = (event) => {
      this.radius = clamp(this.radius * (1 + event.deltaY * 0.001), 0.3, 500);
      this.update();
    };
  }

  private update(): void {
    const x = this.radius * Math.sin(this.theta) * Math.cos(this.phi);
    const y = this.radius * Math.cos(this.theta);
    const z = this.radius * Math.sin(this.theta) * Math.sin(this.phi);
    this._camera.position.set(this.target.x + x, this.target.y + y, this.target.z + z);
    this._camera.lookAt(this.target);
  }
}
