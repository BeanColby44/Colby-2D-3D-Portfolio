import * as THREE from "three";

/**
 * Makes 3D objects feel alive when pressed: a springy scale bounce, a spin that settles upright,
 * and an expanding shock ring at the hit point. Transforms are applied just before rendering and
 * restored right after, so scenes can keep setting their own transforms every frame.
 */
interface PokeItem {
  obj: THREE.Object3D;
  axis: THREE.Vector3;
  spinPower: number;
  bounce: number;
  s: number;
  v: number;
  spin: number;
  spinV: number;
  savedScale: THREE.Vector3;
  savedQuat: THREE.Quaternion;
  onPress?: () => void;
}

const TAU = Math.PI * 2;

export class Pokes {
  private items: PokeItem[] = [];
  private hitMap = new Map<THREE.Object3D, PokeItem>();
  private hits: THREE.Object3D[] = [];
  private ray = new THREE.Raycaster();
  private rings: { mesh: THREE.Mesh; t: number; size: number }[] = [];
  private ringGeo = new THREE.RingGeometry(0.82, 1, 64);
  private applied = false;
  private camQuat = new THREE.Quaternion();

  constructor(private scene: THREE.Scene) {
    this.ray.params.Line = { threshold: 0.12 };
    this.ray.params.Points = { threshold: 0.15 };
  }

  /** Register an object. `hit` lists the meshes that receive clicks (defaults to the object). */
  add(
    obj: THREE.Object3D,
    opts: { hit?: THREE.Object3D[]; axis?: THREE.Vector3; spin?: number; bounce?: number; onPress?: () => void } = {}
  ) {
    const item: PokeItem = {
      obj,
      axis: opts.axis ?? new THREE.Vector3(0, 1, 0),
      spinPower: opts.spin ?? 1,
      bounce: opts.bounce ?? 1,
      s: 0,
      v: 0,
      spin: 0,
      spinV: 0,
      savedScale: new THREE.Vector3(),
      savedQuat: new THREE.Quaternion(),
      onPress: opts.onPress,
    };
    this.items.push(item);
    for (const h of opts.hit ?? [obj]) {
      this.hitMap.set(h, item);
      this.hits.push(h);
    }
    return item;
  }

  get count() {
    return this.items.length;
  }

  /** The registered item under the pointer, if any. */
  pick(ndc: THREE.Vector2, camera: THREE.Camera) {
    if (!this.hits.length) return null;
    this.ray.setFromCamera(ndc, camera);
    const res = this.ray.intersectObjects(this.hits, false).find((h) => (h.object as any).visible !== false);
    if (!res) return null;
    return { item: this.hitMap.get(res.object)!, point: res.point };
  }

  /** Press at a screen point. Returns true when something reacted. */
  press(ndc: THREE.Vector2, camera: THREE.Camera, power = 1) {
    const hit = this.pick(ndc, camera);
    if (!hit) return false;
    this.poke(hit.item, power);
    this.burst(hit.point, camera, 1.2 * power);
    hit.item.onPress?.();
    return true;
  }

  poke(item: PokeItem, power = 1) {
    item.v += 8 * power * item.bounce;
    item.spinV += (Math.random() > 0.5 ? 1 : -1) * 14 * power * item.spinPower;
  }

  /** Expanding light ring at a world position. */
  burst(at: THREE.Vector3, camera: THREE.Camera, size = 1, color = new THREE.Color(0.6, 1.6, 2.6)) {
    const mesh = new THREE.Mesh(
      this.ringGeo,
      new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    mesh.position.copy(at);
    camera.getWorldQuaternion(this.camQuat);
    mesh.quaternion.copy(this.camQuat);
    this.scene.add(mesh);
    this.rings.push({ mesh, t: 0, size });
  }

  /** Called right before rendering. */
  apply(dt: number) {
    for (const it of this.items) {
      // damped spring for the bounce
      const acc = -140 * it.s - 10 * it.v;
      it.v += acc * dt;
      it.s += it.v * dt;
      // spin decays, then settles to the nearest full turn
      it.spin += it.spinV * dt;
      it.spinV *= Math.exp(-2.4 * dt);
      if (Math.abs(it.spinV) < 1.2) it.spin += (Math.round(it.spin / TAU) * TAU - it.spin) * (1 - Math.exp(-5 * dt));
      if (Math.abs(it.s) < 1e-4 && Math.abs(it.v) < 1e-3 && Math.abs(it.spin % TAU) < 1e-3 && Math.abs(it.spinV) < 1e-3) continue;
      it.savedScale.copy(it.obj.scale);
      it.savedQuat.copy(it.obj.quaternion);
      (it as any)._on = true;
      it.obj.scale.multiplyScalar(Math.max(0.3, 1 + it.s * 0.45));
      it.obj.rotateOnAxis(it.axis, it.spin);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.t += dt / 0.7;
      const e = 1 - Math.pow(1 - Math.min(1, r.t), 3);
      r.mesh.scale.setScalar(0.15 + e * 3.2 * r.size);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - r.t) * 0.9;
      if (r.t >= 1) {
        this.scene.remove(r.mesh);
        (r.mesh.material as THREE.Material).dispose();
        this.rings.splice(i, 1);
      }
    }
    this.applied = true;
  }

  /** Called right after rendering. */
  restore() {
    if (!this.applied) return;
    for (const it of this.items) {
      if (!(it as any)._on) continue;
      it.obj.scale.copy(it.savedScale);
      it.obj.quaternion.copy(it.savedQuat);
      (it as any)._on = false;
    }
    this.applied = false;
  }
}

/** Drag-to-rotate with inertia for a scene's main group. */
export class DragSpin {
  rx = 0;
  ry = 0;
  private vx = 0;
  private vy = 0;
  private dragging = false;
  private saved = new THREE.Quaternion();
  private q = new THREE.Quaternion();
  private on = false;
  constructor(public target: THREE.Object3D, private limitX = 0.7) {}

  start() {
    this.dragging = true;
    this.vx = this.vy = 0;
  }
  move(dx: number, dy: number, dt: number) {
    const ax = dy * 0.005, ay = dx * 0.008;
    this.rx = Math.max(-this.limitX, Math.min(this.limitX, this.rx + ax));
    this.ry += ay;
    this.vx = ax / Math.max(dt, 1 / 120);
    this.vy = ay / Math.max(dt, 1 / 120);
  }
  end() {
    this.dragging = false;
  }
  get spinning() {
    return Math.abs(this.vy) > 0.05 || this.dragging;
  }

  apply(dt: number) {
    if (!this.dragging) {
      this.ry += this.vy * dt;
      this.rx += this.vx * dt;
      this.vy *= Math.exp(-1.8 * dt);
      this.vx *= Math.exp(-4 * dt);
      this.rx *= Math.exp(-1.2 * dt); // tilt drifts back to level
      this.rx = Math.max(-this.limitX, Math.min(this.limitX, this.rx));
    }
    if (Math.abs(this.rx) < 1e-4 && Math.abs(this.ry % (Math.PI * 2)) < 1e-4) return;
    this.saved.copy(this.target.quaternion);
    this.q.setFromEuler(new THREE.Euler(this.rx, this.ry, 0, "YXZ"));
    this.target.quaternion.premultiply(this.q);
    this.on = true;
  }
  restore() {
    if (!this.on) return;
    this.target.quaternion.copy(this.saved);
    this.on = false;
  }
}
