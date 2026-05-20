import * as THREE from 'three';
import { Pool } from './pool';

export const vec3Pool = new Pool<THREE.Vector3>(
  () => new THREE.Vector3(),
  (v) => v.set(0, 0, 0),
  32
);

export const mat4Pool = new Pool<THREE.Matrix4>(
  () => new THREE.Matrix4(),
  (m) => m.identity(),
  8
);

export const quatPool = new Pool<THREE.Quaternion>(
  () => new THREE.Quaternion(),
  (q) => q.set(0, 0, 0, 1),
  8
);
