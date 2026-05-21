import * as THREE from 'three';

export interface GizmoState {
  mode: 'translate' | 'rotate' | 'scale';
  enabled: boolean;
}

export const defaultGizmoState: GizmoState = { mode: 'translate', enabled: false };

type GizmoMode = 'translate' | 'rotate' | 'scale';
const AXIS = ['x', 'y', 'z'] as const;
const AXIS_COLORS: Record<string, number> = { x: 0xff4444, y: 0x44ff44, z: 0x4488ff };
const SHAFT_LENGTH = 0.8;
const SHAFT_RADIUS = 0.02;
const CONE_LENGTH = 0.18;
const CONE_RADIUS = 0.05;

export class GizmoLayer {
  private readonly group = new THREE.Group();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly plane = new THREE.Plane();
  private readonly v3 = new THREE.Vector3();
  private readonly v3b = new THREE.Vector3();

  private shafts: THREE.Mesh[] = [];
  private cones: THREE.Mesh[] = [];
  private axisGroups: THREE.Group[] = [];

  private target = new THREE.Vector3(0, 1, 0);
  private mode: GizmoMode = 'translate';
  private hoveredAxis: string | null = null;
  private activeAxis: string | null = null;
  private enabled = false;
  private dragging = false;
  private dragStart = new THREE.Vector3();
  private dragAxis = new THREE.Vector3();

  private readonly camera: THREE.Camera;
  private readonly domElement: HTMLElement;
  private readonly scene: THREE.Scene;
  private readonly onTargetChange: ((pos: { x: number; y: number; z: number }) => void) | null;

  private readonly handlePointerDown: (e: PointerEvent) => void;
  private readonly handlePointerMove: (e: PointerEvent) => void;
  private readonly handlePointerUp: () => void;

  constructor(
    camera: THREE.Camera,
    domElement: HTMLElement,
    scene: THREE.Scene,
    onTargetChange?: (pos: { x: number; y: number; z: number }) => void,
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.scene = scene;
    this.onTargetChange = onTargetChange ?? null;

    this.handlePointerDown = (e) => this.onPointerDown(e);
    this.handlePointerMove = (e) => this.onPointerMove(e);
    this.handlePointerUp = () => this.onPointerUp();

    this.build();
    this.bind();
  }

  get isTranslating(): boolean { return this.dragging; }

  setTarget(position: THREE.Vector3): void {
    this.target.copy(position);
  }

  setMode(mode: GizmoMode): void {
    this.mode = mode;
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
  }

  update(): void {
    this.group.position.copy(this.target);
    this.group.visible = this.enabled && this.mode === 'translate';
  }

  dispose(): void {
    this.unbind();
    this.scene.remove(this.group);
    for (const m of this.shafts) {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
    for (const m of this.cones) {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  }

  private build(): void {
    const shaftGeo = new THREE.CylinderGeometry(SHAFT_RADIUS, SHAFT_RADIUS, SHAFT_LENGTH, 8, 1);
    shaftGeo.translate(0, SHAFT_LENGTH / 2, 0);
    shaftGeo.rotateX(Math.PI / 2);

    const coneGeo = new THREE.ConeGeometry(CONE_RADIUS, CONE_LENGTH, 8);
    coneGeo.translate(0, 0, CONE_LENGTH / 2);

    for (const axis of AXIS) {
      const color = AXIS_COLORS[axis];
      const grp = new THREE.Group();

      const shaftMat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.8 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      const coneMat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 });
      const cone = new THREE.Mesh(coneGeo, coneMat);

      if (axis === 'x') { shaft.rotation.z = -Math.PI / 2; cone.rotation.z = -Math.PI / 2; }
      else if (axis === 'z') { shaft.rotation.x = Math.PI / 2; cone.rotation.x = Math.PI / 2; }

      grp.add(shaft);
      grp.add(cone);
      grp.userData.axis = axis;
      grp.userData.isGizmo = true;

      this.shafts.push(shaft);
      this.cones.push(cone);
      this.axisGroups.push(grp);
      this.group.add(grp);
    }

    this.group.position.copy(this.target);
    this.group.visible = false;
    this.scene.add(this.group);
  }

  private bind(): void {
    this.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.domElement.addEventListener('pointermove', this.handlePointerMove);
    this.domElement.addEventListener('pointerup', this.handlePointerUp);
  }

  private unbind(): void {
    this.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.domElement.removeEventListener('pointermove', this.handlePointerMove);
    this.domElement.removeEventListener('pointerup', this.handlePointerUp);
  }

  private onPointerDown(e: PointerEvent): void {
    if (!this.enabled || this.mode !== 'translate') return;
    if (e.button !== 0) return;
    const hit = this.hitTest(e);
    if (hit) {
      this.dragging = true;
      this.activeAxis = hit;
      this.dragStart.copy(this.target);
      const av = hit === 'x' ? 1 : 0;
      const bv = hit === 'y' ? 1 : 0;
      const cv = hit === 'z' ? 1 : 0;
      this.dragAxis.set(av, bv, cv);
      this.domElement.setPointerCapture(e.pointerId);
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.enabled || this.mode !== 'translate') return;

    const hit = this.hitTest(e);
    if (hit !== this.hoveredAxis) {
      this.hoveredAxis = hit;
      this.updateHighlight();
    }

    if (!this.dragging || !this.activeAxis) return;

    const rect = this.domElement.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointer.set(mx, my);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const camDir = this.v3b;
    this.camera.getWorldDirection(camDir);
    this.plane.setFromNormalAndCoplanarPoint(camDir, this.target);
    const ray = this.raycaster.ray;
    const denom = ray.direction.dot(this.plane.normal);
    if (Math.abs(denom) < 0.0001) return;
    const t = -(ray.origin.dot(this.plane.normal) + this.plane.constant) / denom;
    this.v3.copy(ray.origin).addScaledVector(ray.direction, t);

    const proj = this.v3.dot(this.dragAxis);
    const axisStart = this.dragStart.dot(this.dragAxis);
    const delta = proj - axisStart;

    this.target.copy(this.dragStart).addScaledVector(this.dragAxis, delta);
    this.onTargetChange?.({ x: this.target.x, y: this.target.y, z: this.target.z });
  }

  private onPointerUp(): void {
    this.dragging = false;
    this.activeAxis = null;
  }

  private hitTest(e: PointerEvent): string | null {
    const rect = this.domElement.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointer.set(mx, my);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const meshes: THREE.Object3D[] = [...this.shafts, ...this.cones];
    const intersects = this.raycaster.intersectObjects(meshes, false);
    if (intersects.length > 0) {
      const obj = intersects[0].object;
      const p = obj.parent;
      if (p?.userData?.isGizmo) return p.userData.axis as string;
    }
    return null;
  }

  private updateHighlight(): void {
    for (let i = 0; i < this.axisGroups.length; i++) {
      const isHovered = AXIS[i] === this.hoveredAxis;
      const matShaft = this.shafts[i].material as THREE.MeshBasicMaterial;
      const matCone = this.cones[i].material as THREE.MeshBasicMaterial;
      matShaft.opacity = isHovered ? 1.0 : 0.7;
      matCone.opacity = isHovered ? 1.0 : 0.85;
    }
  }
}
