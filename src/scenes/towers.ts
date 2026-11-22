import * as THREE from "three";
import { Ctx, Stage, damp, easeInOut, easeOut, lerp, range } from "../engine/stage";
import { beamTexture, glowTexture, labelTexture } from "../engine/textures";
import { createStars } from "./particles";
import { DragSpin } from "../engine/pokes";
import type { SkillGroup } from "../data";

const PLATFORM_R = 6;
const TOWER_R = 3.7;

const platformFragment = /* glsl */ `
  uniform float uTime, uOn;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv - 0.5;
    float r = length(c) * 2.0;
    float a = atan(c.y, c.x);
    float rings = smoothstep(0.03, 0.0, abs(fract(r * 7.0 - uTime * 0.15) - 0.5) - 0.46);
    float spokes = smoothstep(0.02, 0.0, abs(fract(a / 6.2831 * 28.0) - 0.5) - 0.47) * step(0.25, r);
    float edge = smoothstep(0.9, 0.98, r) * smoothstep(1.0, 0.98, r);
    vec3 col = vec3(0.2, 0.45, 1.1) * (rings * 0.22 + spokes * 0.1) + vec3(0.3, 1.0, 1.8) * edge * 0.6;
    col += vec3(0.03, 0.025, 0.08) * (1.0 - r);
    float mask = step(r, 1.0);
    gl_FragColor = vec4(col * uOn, mask * uOn);
  }
`;

interface Tower {
  group: THREE.Group;
  body: THREE.Mesh;
  edges: THREE.LineSegments;
  cap: THREE.Mesh;
  beam: THREE.Mesh;
  label: THREE.Mesh;
  height: number;
  color: THREE.Color;
  angle: number;
  lift: number;
  hi: number;
}

/** Scene 5: luminous technology towers rise from a circular platform; one per skill group. */
export class TowersStage extends Stage {
  readonly towers: Tower[] = [];
  private platform = new THREE.Group();
  private surface: THREE.Mesh;
  private ring: THREE.Mesh;
  private ringGlow: THREE.Mesh;
  private spin = 0;
  active = 0;
  /** tower under the pointer (-1 = none) */
  hovered = -1;
  private raycaster = new THREE.Raycaster();

  constructor(ctx: Ctx, groups: SkillGroup[]) {
    super(ctx);
    this.bloom = 0.8;
    this.scene.fog = new THREE.FogExp2(0x03030c, 0.03);
    this.scene.add(new THREE.AmbientLight(0x8090ff, 0.4));
    const key = new THREE.PointLight(0x9d8cff, 30, 30);
    key.position.set(0, 9, 4);
    this.scene.add(key);
    this.scene.add(this.platform);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(PLATFORM_R, PLATFORM_R + 0.25, 0.45, 96),
      new THREE.MeshStandardMaterial({ color: 0x0a0b1c, metalness: 0.85, roughness: 0.35 })
    );
    base.position.y = -0.23;
    this.platform.add(base);

    this.surface = new THREE.Mesh(
      new THREE.CircleGeometry(PLATFORM_R, 96),
      new THREE.ShaderMaterial({
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: platformFragment,
        uniforms: { uTime: { value: 0 }, uOn: { value: 0 } },
        transparent: true,
        depthWrite: false,
      })
    );
    this.surface.rotation.x = -Math.PI / 2;
    this.surface.position.y = 0.005;
    this.platform.add(this.surface);

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(PLATFORM_R + 0.55, 0.05, 12, 220),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 1.6, 2.8), transparent: true })
    );
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.y = -0.2;
    this.ringGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.MeshBasicMaterial({
        map: glowTexture("rgba(80,180,255,0.12)", "rgba(120,80,255,0.05)"),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.ringGlow.rotation.x = -Math.PI / 2;
    this.ringGlow.position.y = -0.45;
    this.scene.add(this.ring, this.ringGlow);

    const beamTex = beamTexture();
    groups.forEach((g, i) => {
      const color = new THREE.Color(g.color);
      const height = 1.6 + g.items.length * 0.17;
      const angle = (i / groups.length) * Math.PI * 2;
      const group = new THREE.Group();
      group.position.set(Math.sin(angle) * TOWER_R, 0, Math.cos(angle) * TOWER_R);

      const geo = new THREE.BoxGeometry(0.95, height, 0.95);
      geo.translate(0, height / 2, 0);
      const body = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: color.clone().multiplyScalar(0.25),
          emissive: color.clone().multiplyScalar(0.18),
          metalness: 0.3,
          roughness: 0.25,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        })
      );
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: color.clone().multiplyScalar(2.2), transparent: true })
      );
      const cap = new THREE.Mesh(
        new THREE.PlaneGeometry(0.95, 0.95),
        new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(2.5), transparent: true, side: THREE.DoubleSide })
      );
      cap.rotation.x = -Math.PI / 2;
      cap.position.y = height + 0.002;
      const beam = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 7),
        new THREE.MeshBasicMaterial({
          map: beamTex,
          color: color.clone().multiplyScalar(1.4),
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      beam.rotation.z = Math.PI;
      beam.position.y = height + 3.5;
      const { texture, aspect } = labelTexture([{ text: g.short.toUpperCase(), size: 72, color: "#ffffff", weight: 700, spacing: 4 }], {
        width: 640,
        align: "center",
      });
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(1.9, 1.9 / aspect),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
      );
      label.position.y = height + 0.55;
      group.add(body, edges, cap, beam, label);
      this.platform.add(group);
      this.towers.push({ group, body, edges, cap, beam, label, height, color, angle, lift: 0, hi: 0 });
    });

    this.scene.add(createStars(1800, 140, 31, 1.3));
    this.towers.forEach((t) => this.pokes.add(t.group, { hit: [t.body], spin: 0.5, bounce: 0.9 }));
    this.rotor = new DragSpin(this.platform, 0.35);
  }

  /** Category index for a progress value (0.3 → 0.95 spans all groups). */
  indexFor(p: number) {
    return Math.min(this.towers.length - 1, Math.max(0, Math.floor(range(p, 0.28, 0.96) * this.towers.length)));
  }
  /** Progress value that focuses a given category. */
  progressFor(i: number) {
    return 0.28 + ((i + 0.5) / this.towers.length) * 0.68;
  }

  /** Returns the tower index under a normalised-device-coordinate point, or -1. */
  pick(ndc: THREE.Vector2) {
    this.raycaster.setFromCamera(ndc, this.ctx.camera);
    const hits = this.raycaster.intersectObjects(this.towers.map((t) => t.body), false);
    if (!hits.length) return -1;
    return this.towers.findIndex((t) => t.body === hits[0].object);
  }

  update(p: number, dt: number) {
    const t = this.ctx.time;
    const on = easeOut(range(p, 0.02, 0.12));
    (this.surface.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    (this.surface.material as THREE.ShaderMaterial).uniforms.uOn.value = on;
    this.platform.scale.setScalar(0.8 + on * 0.2);
    const ringOn = easeOut(range(p, 0.08, 0.2));
    (this.ring.material as THREE.MeshBasicMaterial).opacity = ringOn;
    (this.ringGlow.material as THREE.MeshBasicMaterial).opacity = ringOn;
    this.ring.scale.setScalar(0.7 + ringOn * 0.3);

    this.active = this.indexFor(p);
    const selecting = p > 0.26;

    this.towers.forEach((tw, i) => {
      const grow = easeInOut(range(p, 0.1 + i * 0.022, 0.24 + i * 0.022));
      const isActive = selecting && i === this.active;
      const isHover = i === this.hovered && grow > 0.9;
      tw.hi = damp(tw.hi, isActive ? 1 : isHover ? 0.7 : 0, 8, dt);
      tw.lift = damp(tw.lift, isActive ? 0.35 : isHover ? 0.22 : 0, 7, dt);
      tw.group.scale.set(1, Math.max(0.001, grow), 1);
      tw.group.position.y = tw.lift;
      const dim = selecting ? 0.45 + tw.hi * 0.55 : 1;
      (tw.body.material as THREE.MeshStandardMaterial).opacity = (0.22 + tw.hi * 0.3) * grow;
      (tw.edges.material as THREE.LineBasicMaterial).color.copy(tw.color).multiplyScalar((1.2 + tw.hi * 2.2) * dim);
      (tw.edges.material as THREE.LineBasicMaterial).opacity = grow;
      (tw.cap.material as THREE.MeshBasicMaterial).opacity = grow * dim;
      (tw.beam.material as THREE.MeshBasicMaterial).opacity = tw.hi * 0.85 * (0.85 + 0.15 * Math.sin(t * 4));
      const lm = tw.label.material as THREE.MeshBasicMaterial;
      lm.opacity = range(grow, 0.8, 1) * (0.5 + tw.hi * 0.5);
      // labels counter-scale so they aren't squashed while growing, and face the camera
      tw.label.scale.set(1, 1 / Math.max(0.05, grow), 1);
      tw.label.quaternion.copy(this.platform.quaternion).invert().multiply(this.ctx.camera.quaternion);
    });

    // rotate the platform so the active tower swings to the front
    const targetSpin = selecting ? -this.towers[this.active].angle + 0.55 : lerp(-0.6, 0, range(p, 0, 0.26));
    let diff = targetSpin - this.spin;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.spin += diff * (1 - Math.exp(-3 * dt));
    this.platform.rotation.y = this.spin;
    this.ring.rotation.z = -t * 0.05;

    const k = easeInOut(range(p, 0, 0.25));
    const shift = this.ctx.aspect > 1 ? -3.2 : 0;
    this.aim(
      new THREE.Vector3(lerp(-4, 0, k) + shift * 0.4, lerp(10, 6.2, k), lerp(20, 14, k)),
      new THREE.Vector3(shift, lerp(0.5, 2.0, k), 0),
      0.5
    );
  }
}
