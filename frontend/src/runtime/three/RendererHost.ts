import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { useAppStore } from '../../store/useAppStore';
import { ParticleRenderer } from './ParticleRenderer';
import { TextureRegistry } from './TextureRegistry';
import { CameraController } from './CameraController';
import { GizmoLayer } from './GizmoLayer';
import { RendererProfiler } from './RendererProfiler';
import { profilingStore, pushFps } from './ProfilingStore';
import { t } from '../../i18n';

function hexToRgb(hex: string) {
  hex = hex.replace('#', '');
  const n = parseInt(hex, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

const cachedBgColor = { hex: '', r: 0, g: 0, b: 0 };

const MAX_PIXEL_RATIO = 2;
const FRAME_BUDGET_MS = 16;
const RESIZE_DEBOUNCE_MS = 100;

export class RendererHost {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.05, 5000);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly timer = new THREE.Timer();
  private readonly textures = new TextureRegistry();
  private readonly particles: ParticleRenderer;
  private readonly cameraController: CameraController;
  private readonly charGroup = new THREE.Group();
  private readonly gridHelper: THREE.GridHelper;
  private readonly axesHelper: THREE.AxesHelper;
  private readonly floorMesh: THREE.Mesh;
  private readonly ambientLight = new THREE.AmbientLight(0x303845, 1.2);
  private readonly dirLight1 = new THREE.DirectionalLight(0xffeedd, 1.5);
  private readonly dirLight2 = new THREE.DirectionalLight(0x3060a0, 0.4);
  private readonly fog = new THREE.Fog(0x04060a, 0.5, 50);
  private frame = 0;
  private disposed = false;
  private fpsFrames = 0;
  private fpsThen = performance.now();
  private resizeObserver: ResizeObserver | null = null;
  private readonly mount: HTMLElement;
  private readonly overlay: { fps: HTMLElement | null; info: HTMLElement | null; perf: HTMLElement | null };
  private readonly gizmo: GizmoLayer | null = null;
  private readonly profiler = new RendererProfiler();
  private profilerDisplayTimer = 0;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;
  private bloomComposer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private screenshotRequested = false;
  private readonly gizmoTargetVec = new THREE.Vector3();

  constructor(mount: HTMLElement, overlay: { fps: HTMLElement | null; info: HTMLElement | null; perf: HTMLElement | null }) {
    this.mount = mount;
    this.overlay = overlay;
    const s = useAppStore.getState();
    const bg = hexToRgb(s.sceneBg);
    this.scene.background = new THREE.Color(bg.r, bg.g, bg.b);
    cachedBgColor.hex = s.sceneBg;
    cachedBgColor.r = bg.r;
    cachedBgColor.g = bg.g;
    cachedBgColor.b = bg.b;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    this.mount.appendChild(this.renderer.domElement);
    this.setupContextLossHandling();

    this.bloomComposer = new EffectComposer(this.renderer);
    this.bloomComposer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.3, 0.1, 0.05);
    this.bloomComposer.addPass(this.bloomPass);
    const outputPass = new OutputPass();
    this.bloomComposer.addPass(outputPass);

    this.cameraController = new CameraController(this.camera, this.renderer.domElement);
    this.gizmo = new GizmoLayer(this.camera, this.renderer.domElement, this.scene, (pos) => {
      useAppStore.getState().setGizmoTarget(pos);
    });
    this.particles = new ParticleRenderer(this.scene, this.textures);
    this.particles.setCameraController(this.cameraController);

    this.scene.add(this.ambientLight);
    this.dirLight1.position.set(6, 14, 8);
    this.scene.add(this.dirLight1);
    this.dirLight2.position.set(-6, 8, -5);
    this.scene.add(this.dirLight2);

    this.gridHelper = new THREE.GridHelper(24, 48, 0x1a2a3a, 0x0f1820);
    this.scene.add(this.gridHelper);
    this.axesHelper = new THREE.AxesHelper(2);
    this.scene.add(this.axesHelper);

    this.charGroup.add(this.buildCharacter());
    this.charGroup.visible = false;
    this.scene.add(this.charGroup);

    this.floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshBasicMaterial({ color: 0x060d14, transparent: true, opacity: 0.4, depthWrite: false })
    );
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.visible = false;
    this.scene.add(this.floorMesh);

    this.resize();
    this.setupResizeObserver();
    this.frame = requestAnimationFrame(this.animate);
  }

  private setupContextLossHandling(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('[RendererHost] WebGL context lost, attempting recovery...');
      cancelAnimationFrame(this.frame);
    }, false);
    canvas.addEventListener('webglcontextrestored', () => {
      console.log('[RendererHost] WebGL context restored');
      this.resize();
      this.frame = requestAnimationFrame(this.animate);
    }, false);
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentBoxSize?.[0]?.inlineSize || entry.contentRect.width;
        const height = entry.contentBoxSize?.[0]?.blockSize || entry.contentRect.height;
        if (width > 0 && height > 0) {
          if (this.resizeTimer) clearTimeout(this.resizeTimer);
          this.resizeTimer = setTimeout(() => {
            this.renderer.setSize(width, height);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
          }, RESIZE_DEBOUNCE_MS);
        }
      }
    });
    this.resizeObserver.observe(this.mount);
  }

  resetCamera(): void { this.cameraController.reset(); }
  setCameraView(view: 'front' | 'top' | 'persp'): void { this.cameraController.setView(view); }

  getCameraInfo(): { position: { x: number; y: number; z: number }; target: { x: number; y: number; z: number } } {
    const pos = this.camera.position;
    const tgt = this.cameraController.getTarget();
    return {
      position: { x: pos.x, y: pos.y, z: pos.z },
      target: { x: tgt.x, y: tgt.y, z: tgt.z },
    };
  }

  requestScreenshot(): void { this.screenshotRequested = true; }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.gizmo?.dispose();
    this.cameraController.dispose();
    this.particles.dispose();
    this.textures.dispose();
    this.disposeCharacter();
    if (this.bloomComposer) {
      this.bloomComposer.dispose();
      this.bloomComposer = null;
      this.bloomPass = null;
    }
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private disposeCharacter(): void {
    this.charGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  private readonly resize = (): void => {
    const width = this.mount.clientWidth || 1;
    const height = this.mount.clientHeight || 1;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.bloomComposer) {
      this.bloomComposer.setSize(width, height);
    }
  };

  private readonly animate = (): void => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);
    const frameStart = performance.now();
    const state = useAppStore.getState();
    const dt = Math.min(this.timer.getDelta(), 0.05);
    this.profiler.beginFrame();

    if (state.charSpin && this.charGroup.visible) {
      const angle = state.autoSpinAngle + dt * 0.6;
      useAppStore.getState().setAutoSpinAngle(angle);
      this.charGroup.rotation.y = angle;
    }

    if (state.autoCycle && state.playing) {
      const maxCyc = Math.max(0.5, ...state.emitters.map(e => e.cycle || 2));
      const newTimer = state.autoCycleTimer + dt;
      useAppStore.getState().setAutoCycleTimer(newTimer);
      if (newTimer >= maxCyc) {
        state.emitters.forEach(e => { e._localTime = 0; e._spawnAcc = 0; });
        useAppStore.getState().setAutoCycleTimer(0);
      }
    }

    if (cachedBgColor.hex !== state.sceneBg) {
      const bg = hexToRgb(state.sceneBg);
      cachedBgColor.hex = state.sceneBg;
      cachedBgColor.r = bg.r;
      cachedBgColor.g = bg.g;
      cachedBgColor.b = bg.b;
      if (this.scene.background instanceof THREE.Color) {
        this.scene.background.setRGB(bg.r, bg.g, bg.b);
      }
    }

    this.gridHelper.visible = state.showGrid;
    this.axesHelper.visible = state.showAxis;
    this.charGroup.visible = state.showChar;
    this.floorMesh.visible = state.envFloor;
    this.ambientLight.color.set(state.envAmbient);
    this.camera.fov = state.envFov;
    this.camera.updateProjectionMatrix();

    if (state.envFog) {
      this.fog.far = 1 / Math.max(0.001, state.envFogDensity);
      this.scene.fog = this.fog;
    } else {
      this.scene.fog = null;
    }

    this.particles.sync(state.emitters);
    this.profiler.mark('sync');
    const alive = this.particles.update(dt, state.playing, state.vpScale);
    this.profiler.mark('simulate');
    if (state.playing) state.setGlobalTime(state.globalTime + dt);

    if (state.gizmoEnabled && this.gizmo) {
      this.gizmoTargetVec.set(state.gizmoTarget.x, state.gizmoTarget.y, state.gizmoTarget.z);
      this.gizmo.setTarget(this.gizmoTargetVec);
      this.gizmo.setMode(state.gizmoMode);
      this.gizmo.update();
    }

    if (state.envBloom && this.bloomComposer) {
      this.bloomComposer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    this.profiler.mark('render');

    if (this.screenshotRequested) {
      this.screenshotRequested = false;
      this.captureScreenshot();
    }

    this.updateOverlay(alive);
    this.profiler.endFrame();

    this.profilerDisplayTimer += dt;
    if (this.profilerDisplayTimer >= 0.5) {
      this.profilerDisplayTimer = 0;
      const stats = this.profiler.getStats();
      const marks = this.profiler.getMarks();
      const fps = stats.avgFrameTime > 0 ? Math.round(1000 / stats.avgFrameTime) : 0;
      pushFps(fps);
      profilingStore.update({
        fps,
        totalMs: Math.round(stats.avgFrameTime * 10) / 10,
        simulateMs: Math.round((marks.simulate || 0) * 10) / 10,
        uploadMs: Math.round((marks.upload || 0) * 10) / 10,
        meshSimMs: Math.round((marks.meshSimulate || 0) * 10) / 10,
        meshUploadMs: Math.round((marks.meshUpload || 0) * 10) / 10,
        aliveParticles: alive,
        pointEmitters: this.particles.runtimeCount(),
        meshEmitters: this.particles.meshCount(),
        memoryBytes: this.particles.bufferBytes(),
        drawCalls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        bottlenecks: stats.bottlenecks,
      });
    }

    const frameEnd = performance.now();
    const frameDuration = frameEnd - frameStart;
    if (frameDuration > FRAME_BUDGET_MS) {
      if (this.overlay.perf) {
        this.overlay.perf.textContent += ` ⏱${Math.round(frameDuration)}ms`;
      }
    }
  };

  private captureScreenshot(): void {
    this.renderer.render(this.scene, this.camera);
    const canvas = this.renderer.domElement;
    const link = document.createElement('a');
    link.download = `${useAppStore.getState().exportEffectName}_screenshot.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  private buildCharacter(): THREE.Group {
    const g = new THREE.Group();
    const boneMat = (c: number, wire = true) => new THREE.MeshBasicMaterial({ color: c, wireframe: wire, opacity: wire ? 0.35 : 1, transparent: wire });

    const bone: { name: string; pos: number[]; parent?: THREE.Group; rot?: number[] }[] = [
      { name: 'Bip01_Pelvis', pos: [0, 1.0, 0] },
      { name: 'Bip01_Spine', pos: [0, 0.25, 0] },
      { name: 'Bip01_Spine1', pos: [0, 0.2, 0] },
      { name: 'Bip01_Neck', pos: [0, 0.3, 0] },
      { name: 'Bip01_Head', pos: [0, 0.22, 0] },
    ];

    const joints: THREE.Group[] = [];
    bone.forEach((b, i) => {
      const jg = new THREE.Group();
      jg.userData.name = b.name;
      const pos = b.pos;
      jg.position.set(pos[0], pos[1], pos[2]);
      if (b.rot) jg.rotation.set(b.rot[0], b.rot[1], b.rot[2]);
      if (i === 0) g.add(jg);
      else joints[i - 1].add(jg);
      joints.push(jg);
    });

    const colors = [0x44aaff, 0x66bbff, 0x88ccff, 0xaaddff, 0xcceeff];
    joints.forEach((jg, i) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), boneMat(colors[i % colors.length], false));
      jg.add(s);
    });

    const armGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.5, 6);
    const legGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.6, 6);
    const forearmGeo = new THREE.CylinderGeometry(0.035, 0.025, 0.45, 6);

    const leftArm = new THREE.Group(); leftArm.position.set(0.3, 0.1, 0); leftArm.rotation.z = -0.3; leftArm.rotation.x = 0.1;
    joints[1]?.add(leftArm);
    const laMesh = new THREE.Mesh(armGeo, boneMat(0x5599dd));
    leftArm.add(laMesh);

    const leftForearm = new THREE.Group(); leftForearm.position.set(0, -0.5, 0); leftForearm.rotation.x = 0.2;
    leftArm.add(leftForearm);
    const lfMesh = new THREE.Mesh(forearmGeo, boneMat(0x77aadd));
    leftForearm.add(lfMesh);

    const rightArm = new THREE.Group(); rightArm.position.set(-0.3, 0.1, 0); rightArm.rotation.z = 0.3; rightArm.rotation.x = -0.1;
    joints[1]?.add(rightArm);
    const raMesh = new THREE.Mesh(armGeo, boneMat(0x5599dd));
    rightArm.add(raMesh);

    const rightForearm = new THREE.Group(); rightForearm.position.set(0, -0.5, 0); rightForearm.rotation.x = -0.2;
    rightArm.add(rightForearm);
    const rfMesh = new THREE.Mesh(forearmGeo, boneMat(0x77aadd));
    rightForearm.add(rfMesh);

    const leftLeg = new THREE.Group(); leftLeg.position.set(0.15, -0.1, 0); leftLeg.rotation.z = 0.05;
    joints[0]?.add(leftLeg);
    const llMesh = new THREE.Mesh(legGeo, boneMat(0x4488bb));
    leftLeg.add(llMesh);

    const rightLeg = new THREE.Group(); rightLeg.position.set(-0.15, -0.1, 0); rightLeg.rotation.z = -0.05;
    joints[0]?.add(rightLeg);
    const rlMesh = new THREE.Mesh(legGeo, boneMat(0x4488bb));
    rightLeg.add(rlMesh);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), boneMat(0xeeddcc, false));
    joints[4]?.add(head);
    head.position.y = 0.15;

    return g;
  }

  private updateOverlay(alive: number): void {
    this.fpsFrames += 1;
    const now = performance.now();
    if (now - this.fpsThen >= 600) {
      const fps = Math.round(this.fpsFrames / ((now - this.fpsThen) / 1000));
      this.fpsFrames = 0;
      this.fpsThen = now;
      if (this.overlay.fps) this.overlay.fps.textContent = `${fps} ${t('vp_fps')}`;
    }
    if (this.overlay.info) this.overlay.info.textContent = `${t('vp_particles')}: ${alive}`;
    const state = useAppStore.getState();
    const cnt = state.emitters.length;
    let badge = `${t('vp_effects')}: ${cnt}`;
    if (alive < 1024) badge += ' ✓';
    else if (alive < 2048) badge += ' ⚡';
    else badge += ' ⚠';
    if (this.overlay.perf) this.overlay.perf.textContent = badge;
  }
}
