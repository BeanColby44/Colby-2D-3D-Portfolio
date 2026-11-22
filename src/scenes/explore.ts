import * as THREE from "three";
import { Ctx, Stage, damp, easeInOut, lerp, range, seeded } from "../engine/stage";
import { DragSpin } from "../engine/pokes";
import { glowTexture, labelTexture } from "../engine/textures";
import { createStars } from "./particles";

const HUB_COLORS = [new THREE.Color(1.4, 0.5, 2.6), new THREE.Color(0.35, 1.6, 2.6), new THREE.Color(2.2, 0.55, 1.6), new THREE.Color(0.5, 0.85, 2.8)];

/** Section 10: a living neural network, one hub per topic being explored. Press nodes to fire signals. */
export class ExploreStage extends Stage {
  private net = new THREE.Group();
  private hubs: { mesh: THREE.Mesh; halo: THREE.Sprite; label: THREE.Sprite; pos: THREE.Vector3; hi: number; fire: number }[] = [];
  private nodePos: THREE.Vector3[] = [];
  private nodeHub: number[] = [];
  private edges: [number, number][] = [];
  private pulses: THREE.Points;
  private pulseSeed: Float32Array;
  private lines: THREE.LineSegments;
  private nodes: THREE.Points;
  active = 0;
  private fireAll = 0;

  constructor(ctx: Ctx, topics: { title: string }[]) {
    super(ctx);
    this.bloom = 0.7;
    this.scene.fog = new THREE.FogExp2(0x03020c, 0.028);
    this.scene.add(this.net);
    const rnd = seeded(1010);
    const glow = glowTexture("rgba(255,255,255,1)", "rgba(150,110,255,.35)");

    topics.forEach((tp, i) => {
      const a = (i / topics.length) * Math.PI * 2 + 0.4;
      const pos = new THREE.Vector3(Math.cos(a) * 3.6, Math.sin(i * 2.1) * 1.1, Math.sin(a) * 3.6);
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), new THREE.MeshBasicMaterial({ color: HUB_COLORS[i % 4], wireframe: true }));
      mesh.position.copy(pos);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: HUB_COLORS[i % 4], blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      halo.scale.setScalar(2.2);
      halo.position.copy(pos);
      const { texture, aspect } = labelTexture([{ text: tp.title, size: 54, color: "#ffffff", weight: 700 }], { width: 1100, align: "center" });
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 }));
      label.scale.set(2.6, 2.6 / aspect, 1);
      label.position.copy(pos).add(new THREE.Vector3(0, 0.95, 0));
      this.net.add(mesh, halo, label);
      const hub = { mesh, halo, label, pos, hi: 0, fire: 0 };
      this.hubs.push(hub);
      this.pokes.add(mesh, { hit: [mesh, halo], spin: 1.4, bounce: 1.5, onPress: () => (hub.fire = 1) });
      // satellites
      this.nodePos.push(pos);
      this.nodeHub.push(i);
      for (let k = 0; k < 34; k++) {
        const d = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(0.7 + rnd() * 1.8);
        this.nodePos.push(pos.clone().add(d));
        this.nodeHub.push(i);
      }
    });
    // a few free-floating nodes in the middle
    for (let k = 0; k < 40; k++) {
      this.nodePos.push(new THREE.Vector3((rnd() - 0.5) * 3, (rnd() - 0.5) * 2, (rnd() - 0.5) * 3));
      this.nodeHub.push(-1);
    }
    // connect near neighbours
    const P = this.nodePos;
    for (let i = 0; i < P.length; i++)
      for (let j = i + 1; j < P.length; j++) {
        const d = P[i].distanceTo(P[j]);
        if (d < 1.15 && rnd() < 0.55) this.edges.push([i, j]);
      }
    // hub-to-hub highways
    for (let i = 0; i < topics.length; i++) {
      const hi = this.nodeHub.indexOf(i);
      const hj = this.nodeHub.indexOf((i + 1) % topics.length);
      this.edges.push([hi, hj]);
      this.edges.push([hi, P.length - 1 - i]);
    }

    const lp = new Float32Array(this.edges.length * 6);
    const lc = new Float32Array(this.edges.length * 6);
    this.edges.forEach(([a, b], e) => {
      lp.set([P[a].x, P[a].y, P[a].z, P[b].x, P[b].y, P[b].z], e * 6);
    });
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(lp, 3));
    lg.setAttribute("color", new THREE.BufferAttribute(lc, 3));
    this.lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.net.add(this.lines);

    const np = new Float32Array(P.length * 3);
    P.forEach((v, i) => np.set([v.x, v.y, v.z], i * 3));
    const ng = new THREE.BufferGeometry();
    ng.setAttribute("position", new THREE.BufferAttribute(np, 3));
    this.nodes = new THREE.Points(ng, new THREE.PointsMaterial({ size: 0.09, color: new THREE.Color(0.8, 0.9, 2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.net.add(this.nodes);

    // signals travelling along edges
    const pc = ctx.quality === "high" ? 260 : 120;
    this.pulseSeed = new Float32Array(pc * 2);
    for (let i = 0; i < pc; i++) {
      this.pulseSeed[i * 2] = Math.floor(rnd() * this.edges.length);
      this.pulseSeed[i * 2 + 1] = rnd();
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pc * 3), 3));
    this.pulses = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.13, color: new THREE.Color(2.4, 2.4, 3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.pulses.frustumCulled = false;
    this.net.add(this.pulses);

    this.scene.add(createStars(2000, 130, 1011, 1.3));
    this.rotor = new DragSpin(this.net, 0.7);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(5.5, 16, 12), new THREE.MeshBasicMaterial({ visible: false }));
    this.net.add(hit);
    this.pokes.add(this.net, { hit: [hit], spin: 0.4, bounce: 0.35, onPress: () => (this.fireAll = 1) });
  }

  indexFor(p: number) {
    return Math.min(this.hubs.length - 1, Math.max(0, Math.floor(range(p, 0.15, 0.95) * this.hubs.length)));
  }
  progressFor(i: number) {
    return 0.15 + ((i + 0.5) / this.hubs.length) * 0.8;
  }

  update(p: number, dt: number) {
    const t = this.ctx.time;
    this.active = this.indexFor(p);
    const on = easeInOut(range(p, 0.02, 0.2));
    this.fireAll *= Math.exp(-2 * dt);

    this.hubs.forEach((h, i) => {
      h.hi = damp(h.hi, p > 0.14 && i === this.active ? 1 : 0, 5, dt);
      h.fire *= Math.exp(-2.5 * dt);
      const k = 0.6 + h.hi * 1.2 + h.fire * 2 + this.fireAll;
      (h.mesh.material as THREE.MeshBasicMaterial).color.copy(HUB_COLORS[i % 4]).multiplyScalar(k);
      h.mesh.rotation.set(t * 0.5 + i, t * 0.7, 0);
      h.mesh.scale.setScalar(on * (1 + h.hi * 0.35));
      (h.halo.material as THREE.SpriteMaterial).opacity = on * (0.2 + h.hi * 0.35 + h.fire);
      (h.label.material as THREE.SpriteMaterial).opacity = on * (0.25 + h.hi * 0.75);
    });

    // edge colours: brighter around the active hub / fired hubs
    const col = this.lines.geometry.getAttribute("color") as THREE.BufferAttribute;
    this.edges.forEach(([a], e) => {
      const hub = this.nodeHub[a];
      const boost = hub >= 0 ? this.hubs[hub].hi * 0.8 + this.hubs[hub].fire * 1.5 : 0.1;
      const c = hub >= 0 ? HUB_COLORS[hub % 4] : HUB_COLORS[1];
      const k = on * (0.12 + boost + this.fireAll * 0.6);
      col.setXYZ(e * 2, c.r * k, c.g * k, c.b * k);
      col.setXYZ(e * 2 + 1, c.r * k, c.g * k, c.b * k);
    });
    col.needsUpdate = true;

    const pp = this.pulses.geometry.getAttribute("position") as THREE.BufferAttribute;
    const speed = 0.6 + this.fireAll * 3;
    for (let i = 0; i < pp.count; i++) {
      const [a, b] = this.edges[this.pulseSeed[i * 2]];
      const u = (this.pulseSeed[i * 2 + 1] + t * speed * 0.5) % 1;
      const A = this.nodePos[a], B = this.nodePos[b];
      pp.setXYZ(i, lerp(A.x, B.x, u), lerp(A.y, B.y, u), lerp(A.z, B.z, u));
    }
    pp.needsUpdate = true;
    (this.pulses.material as THREE.PointsMaterial).opacity = on;
    (this.nodes.material as THREE.PointsMaterial).opacity = on;

    // orbit so the active hub swings toward the camera
    const target = this.hubs[this.active].pos;
    const want = -Math.atan2(target.x, target.z) + 0.35;
    let d = want - this.net.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.net.rotation.y += d * (1 - Math.exp(-2 * dt));

    const shift = this.ctx.aspect > 1 ? -3.4 : 0;
    const k = easeInOut(range(p, 0, 0.2));
    this.aim(new THREE.Vector3(shift * 0.3, lerp(4, 2, k), lerp(21, 12.5, k)), new THREE.Vector3(shift, 0.2, 0), 0.6);
  }
}
