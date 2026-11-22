import * as THREE from "three";
import { glowTexture } from "../engine/textures";

const TRAIL = 140;
const SPARKS = 90;

const trailVertex = /* glsl */ `
  attribute float aAge;
  uniform float uSize;
  varying float vAge;
  void main() {
    vAge = aAge;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, uSize * (1.0 - aAge * 0.85) / -mv.z);
  }
`;
const trailFragment = /* glsl */ `
  uniform vec3 uHot;
  uniform vec3 uCool;
  uniform float uAlpha;
  varying float vAge;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uHot, uCool, smoothstep(0.0, 0.5, vAge));
    gl_FragColor = vec4(col, a * a * (1.0 - vAge) * uAlpha);
  }
`;

/**
 * A glowing comet: bright head + hot core, a long tapering trail, and sparks shed behind it.
 * `launch` takes a path function (u: 0..1 → world position) that is evaluated every frame,
 * so paths can follow the camera (screen-space flybys) or the world (carving the name).
 */
export class Comet {
  readonly group = new THREE.Group();
  private head: THREE.Sprite;
  private core: THREE.Sprite;
  private flare: THREE.Sprite;
  private trail: THREE.Points;
  private trailPos = new Float32Array(TRAIL * 3);
  private trailAge = new Float32Array(TRAIL);
  private history: THREE.Vector3[] = [];
  private sparks: THREE.Points;
  private sp = new Float32Array(SPARKS * 3);
  private sv = new Float32Array(SPARKS * 3);
  private sl = new Float32Array(SPARKS);
  private sparkHead = 0;
  private path: ((u: number) => THREE.Vector3) | null = null;
  private dur = 1;
  private t = 0;
  private fade = 0;
  private last = new THREE.Vector3();
  /** 0..1 progress along the path (−1 when idle) */
  u = -1;
  readonly position = new THREE.Vector3();
  onDone: (() => void) | null = null;

  constructor(private scale = 1, hot = new THREE.Color(2.6, 2.6, 3.2), cool = new THREE.Color(0.5, 0.45, 2.4)) {
    const glow = glowTexture("rgba(255,255,255,1)", "rgba(110,190,255,0.5)");
    const mk = (s: number, color: THREE.Color, opacity = 1) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity }));
      sp.scale.setScalar(s * scale);
      return sp;
    };
    this.head = mk(2.2, new THREE.Color(0.7, 0.9, 2.2));
    this.core = mk(0.7, new THREE.Color(3, 3, 3.4));
    this.flare = mk(6, new THREE.Color(0.4, 0.3, 1.4), 0.35);

    const tg = new THREE.BufferGeometry();
    tg.setAttribute("position", new THREE.BufferAttribute(this.trailPos, 3));
    tg.setAttribute("aAge", new THREE.BufferAttribute(this.trailAge, 1));
    this.trail = new THREE.Points(
      tg,
      new THREE.ShaderMaterial({
        vertexShader: trailVertex,
        fragmentShader: trailFragment,
        uniforms: { uSize: { value: 600 * scale }, uHot: { value: hot }, uCool: { value: cool }, uAlpha: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.trail.frustumCulled = false;

    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(this.sp, 3));
    this.sparks = new THREE.Points(
      sg,
      new THREE.PointsMaterial({ size: 0.06 * scale, color: new THREE.Color(1.8, 1.9, 2.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
    );
    this.sparks.frustumCulled = false;
    this.group.add(this.flare, this.head, this.core, this.trail, this.sparks);
    this.group.visible = false;
    this.group.renderOrder = 10;
  }

  get active() {
    return this.group.visible;
  }

  /** Point-size scale: call on resize / launch with the renderer's projection scale. */
  setPixelScale(px: number) {
    (this.trail.material as THREE.ShaderMaterial).uniforms.uSize.value = px * 0.14 * this.scale;
  }

  launch(scene: THREE.Object3D, path: (u: number) => THREE.Vector3, duration: number) {
    this.group.parent?.remove(this.group);
    scene.add(this.group);
    this.path = path;
    this.dur = duration;
    this.t = 0;
    this.fade = 0;
    this.u = 0;
    this.history = [];
    this.sl.fill(0);
    this.last.copy(path(0));
    this.group.visible = true;
  }

  stop() {
    this.group.visible = false;
    this.group.parent?.remove(this.group);
    this.u = -1;
    this.path = null;
  }

  update(dt: number) {
    if (!this.group.visible || !this.path) return;
    this.t += dt;
    const u = Math.min(1, this.t / this.dur);
    const done = this.t >= this.dur;
    if (!done) {
      this.u = u;
      const p = this.path(u);
      // sub-steps keep the trail continuous at high speed
      const steps = Math.max(1, Math.min(6, Math.ceil(p.distanceTo(this.last) / 0.08)));
      for (let s = 1; s <= steps; s++) this.history.unshift(this.last.clone().lerp(p, s / steps));
      this.last.copy(p);
      this.position.copy(p);
      // shed sparks
      for (let k = 0; k < 3; k++) {
        const i = this.sparkHead++ % SPARKS;
        this.sp.set([p.x, p.y, p.z], i * 3);
        this.sv.set([(Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 2.2 - 0.6, (Math.random() - 0.5) * 2.2], i * 3);
        this.sl[i] = 0.6 + Math.random() * 0.6;
      }
    } else {
      this.u = 1;
      this.fade += dt / 0.6;
      // the trail keeps catching up with the head after it stops
      this.history.unshift(this.last.clone());
    }
    if (this.history.length > TRAIL) this.history.length = TRAIL;

    for (let i = 0; i < TRAIL; i++) {
      const h = this.history[Math.min(i, this.history.length - 1)] ?? this.last;
      this.trailPos.set([h.x, h.y, h.z], i * 3);
      this.trailAge[i] = i < this.history.length ? i / TRAIL : 1;
    }
    this.trail.geometry.getAttribute("position").needsUpdate = true;
    this.trail.geometry.getAttribute("aAge").needsUpdate = true;
    for (let i = 0; i < SPARKS; i++) {
      if (this.sl[i] <= 0) continue;
      this.sl[i] -= dt;
      this.sv[i * 3 + 1] -= dt * 1.5;
      this.sp[i * 3] += this.sv[i * 3] * dt;
      this.sp[i * 3 + 1] += this.sv[i * 3 + 1] * dt;
      this.sp[i * 3 + 2] += this.sv[i * 3 + 2] * dt;
      if (this.sl[i] <= 0) this.sp.set([0, -9999, 0], i * 3);
    }
    this.sparks.geometry.getAttribute("position").needsUpdate = true;

    const flick = 0.85 + Math.random() * 0.3;
    const a = Math.max(0, 1 - this.fade);
    for (const s of [this.head, this.core, this.flare]) s.position.copy(this.last);
    this.head.scale.setScalar(2.2 * this.scale * flick);
    (this.head.material as THREE.SpriteMaterial).opacity = a;
    (this.core.material as THREE.SpriteMaterial).opacity = a;
    (this.flare.material as THREE.SpriteMaterial).opacity = 0.35 * a * flick;
    (this.trail.material as THREE.ShaderMaterial).uniforms.uAlpha.value = a;
    (this.sparks.material as THREE.PointsMaterial).opacity = a;

    if (this.fade >= 1) {
      this.stop();
      const cb = this.onDone;
      this.onDone = null;
      cb?.();
    }
  }
}

/** Quadratic Bézier helper. */
export function bezier(a: THREE.Vector3, c: THREE.Vector3, b: THREE.Vector3, u: number, out = new THREE.Vector3()) {
  const k = 1 - u;
  return out.set(
    k * k * a.x + 2 * k * u * c.x + u * u * b.x,
    k * k * a.y + 2 * k * u * c.y + u * u * b.y,
    k * k * a.z + 2 * k * u * c.z + u * u * b.z
  );
}
