import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Ctx, Stage, easeInOut, lerp, range, seeded, smooth } from "../engine/stage";
import { DragSpin } from "../engine/pokes";
import { beamTexture, glowTexture } from "../engine/textures";
import { createStars } from "./particles";
import { bezier } from "./comet";

/* Problem (chaos) → solution (order) colour ramp */
const RED = new THREE.Color(1.7, 0.28, 0.55);
const CYAN = new THREE.Color(0.3, 1.45, 2.4);
const tmpC = new THREE.Color();
const mixC = (s: number, out = tmpC) => out.copy(RED).lerp(CYAN, s);

const edges = (geo: THREE.BufferGeometry) =>
  new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: RED.clone(), transparent: true }));

interface Sub {
  group: THREE.Group;
  update(s: number, t: number, dt: number, jolt: number): void;
}

/* ------------------------------------------------------------------ */
/* 1 · Mobile data drifting out of sync: phone ⇄ server packet lanes  */
/* ------------------------------------------------------------------ */
class SyncSub implements Sub {
  group = new THREE.Group();
  private N = 200;
  private seeds: Float32Array;
  private lanes: THREE.Vector3[][] = [];
  private packets: THREE.Points;
  private laneLines: THREE.Line[] = [];
  private phoneEdge: THREE.LineSegments;
  private screen: THREE.Mesh;
  private serverEdges: THREE.LineSegments[] = [];
  private leds: THREE.Mesh[] = [];

  constructor() {
    const rnd = seeded(81);
    const dark = new THREE.MeshStandardMaterial({ color: 0x0e1024, metalness: 0.6, roughness: 0.3 });
    const phone = new THREE.Group();
    phone.add(new THREE.Mesh(new RoundedBoxGeometry(1.3, 2.5, 0.16, 4, 0.12), dark));
    this.screen = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.15), new THREE.MeshBasicMaterial({ color: 0x223366 }));
    this.screen.position.z = 0.085;
    phone.add(this.screen);
    this.phoneEdge = edges(new THREE.BoxGeometry(1.32, 2.52, 0.18));
    phone.add(this.phoneEdge);
    phone.position.set(-3.4, 0, 0);
    phone.rotation.y = 0.5;
    const server = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const u = new THREE.Group();
      u.add(new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 1.3), dark));
      const e = edges(new THREE.BoxGeometry(1.92, 0.52, 1.32));
      u.add(e);
      this.serverEdges.push(e);
      for (let l = 0; l < 3; l++) {
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: CYAN.clone() }));
        led.position.set(-0.7 + l * 0.18, 0, 0.67);
        u.add(led);
        this.leds.push(led);
      }
      u.position.y = (k - 1) * 0.66;
      server.add(u);
    }
    server.position.set(3.4, 0, 0);
    server.rotation.y = -0.5;
    this.group.add(phone, server);

    // two lanes: request (upper arc) and response (lower arc)
    const defs: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = [
      [new THREE.Vector3(-2.7, 0.5, 0.2), new THREE.Vector3(0, 2.6, 0.8), new THREE.Vector3(2.4, 0.35, 0.2)],
      [new THREE.Vector3(2.4, -0.35, 0.2), new THREE.Vector3(0, -2.4, -0.6), new THREE.Vector3(-2.7, -0.5, 0.2)],
    ];
    defs.forEach(([a, c, b]) => {
      const pts = Array.from({ length: 121 }, (_, i) => bezier(a, c, b, i / 120));
      this.lanes.push(pts);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: CYAN.clone(), transparent: true, opacity: 0 }));
      this.laneLines.push(line);
      this.group.add(line);
    });

    this.seeds = new Float32Array(this.N * 3);
    for (let i = 0; i < this.N; i++) this.seeds.set([rnd(), rnd(), rnd()], i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(this.N * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(this.N * 3), 3));
    this.packets = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.13, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.packets.frustumCulled = false;
    this.group.add(this.packets);
  }

  update(s: number, t: number, _dt: number, j: number) {
    const pos = this.packets.geometry.getAttribute("position") as THREE.BufferAttribute;
    const col = this.packets.geometry.getAttribute("color") as THREE.BufferAttribute;
    const chaos = 1 - s;
    for (let i = 0; i < this.N; i++) {
      const r0 = this.seeds[i * 3], r1 = this.seeds[i * 3 + 1], r2 = this.seeds[i * 3 + 2];
      const lane = this.lanes[i % 2];
      // chaos: random phases and speeds; solved: evenly spaced, one shared speed
      const even = (Math.floor(i / 2) / (this.N / 2)) % 1;
      const speed = lerp(0.06 + r1 * 0.3, 0.22, s);
      const u = (((lerp(r0, even, s) + t * speed) % 1) + 1) % 1;
      const k = u * 120, i0 = Math.floor(k), f = k - i0;
      const A = lane[i0], B = lane[Math.min(120, i0 + 1)];
      const amp = chaos * (0.55 + j * 1.5);
      const fall = chaos * (r2 > 0.62 ? u * u * 3 : 0); // dropped packets fall away
      pos.setXYZ(
        i,
        lerp(A.x, B.x, f) + Math.sin(t * 2.3 + i) * amp,
        lerp(A.y, B.y, f) + Math.cos(t * 1.9 + i * 1.3) * amp - fall,
        lerp(A.z, B.z, f) + Math.sin(t * 1.5 + i * 0.7) * amp
      );
      mixC(Math.min(1, s * 1.1 + (r2 < 0.3 ? 0.15 : 0)));
      col.setXYZ(i, tmpC.r, tmpC.g, tmpC.b);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    this.laneLines.forEach((l) => ((l.material as THREE.LineBasicMaterial).opacity = s * 0.45));

    // devices blink out of phase while broken, in lock-step when synced
    const beat = (ph: number) => 0.5 + 0.5 * Math.sin(t * 5 + ph);
    (this.screen.material as THREE.MeshBasicMaterial).color.copy(mixC(s)).multiplyScalar(0.12 + beat(0) * 0.35);
    (this.phoneEdge.material as THREE.LineBasicMaterial).color.copy(mixC(s));
    this.serverEdges.forEach((e) => (e.material as THREE.LineBasicMaterial).color.copy(mixC(s)));
    this.leds.forEach((l, k) => (l.material as THREE.MeshBasicMaterial).color.copy(mixC(s)).multiplyScalar(0.3 + beat(chaos * (k * 1.7 + 2)) * 1.4));
  }
}

/* ------------------------------------------------------------------ */
/* 2 · Slow backend processing: ring accelerator, jams → light speed  */
/* ------------------------------------------------------------------ */
class SpeedSub implements Sub {
  group = new THREE.Group();
  private N = 460;
  private L = 15;
  private seeds: Float32Array;
  private streaks: THREE.LineSegments;
  private rings: THREE.Mesh[] = [];
  private travel = 0;

  constructor() {
    const rnd = seeded(82);
    for (let k = 0; k < 9; k++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.05, 10, 90), new THREE.MeshBasicMaterial({ color: RED.clone() }));
      ring.rotation.y = Math.PI / 2;
      ring.position.x = -this.L / 2 + (k + 0.5) * (this.L / 9);
      const notch = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.025, 4, 12), ring.material);
      ring.add(notch);
      this.rings.push(ring);
      this.group.add(ring);
    }
    this.seeds = new Float32Array(this.N * 3);
    for (let i = 0; i < this.N; i++) this.seeds.set([rnd() * Math.PI * 2, Math.sqrt(rnd()) * 1.35, rnd()], i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(this.N * 6), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(this.N * 6), 3));
    this.streaks = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.streaks.frustumCulled = false;
    this.group.add(this.streaks);
    this.group.rotation.set(0.15, -0.55, 0.05);
    this.group.position.x = 1.2;
  }

  update(s: number, t: number, dt: number, j: number) {
    const speed = lerp(0.7, 16, s * s) + j * 6;
    this.travel += dt * speed;
    const pos = this.streaks.geometry.getAttribute("position") as THREE.BufferAttribute;
    const col = this.streaks.geometry.getAttribute("color") as THREE.BufferAttribute;
    const chaos = 1 - s;
    const len = 0.06 + s * s * 1.1;
    mixC(s);
    for (let i = 0; i < this.N; i++) {
      const a = this.seeds[i * 3], r = this.seeds[i * 3 + 1], o = this.seeds[i * 3 + 2];
      let x = ((((o * this.L + this.travel * (0.8 + o * 0.4 * chaos)) % this.L) + this.L) % this.L) - this.L / 2;
      // traffic jams: particles bunch into clumps while the system is slow
      x += chaos * Math.sin(x * 1.1 + t * 0.6) * 1.3;
      const jit = chaos * 0.12;
      const y = Math.cos(a) * r + Math.sin(t * 9 + i) * jit;
      const z = Math.sin(a) * r + Math.cos(t * 8 + i) * jit;
      pos.setXYZ(i * 2, x, y, z);
      pos.setXYZ(i * 2 + 1, x - len, y, z);
      col.setXYZ(i * 2, tmpC.r * 0.75, tmpC.g * 0.75, tmpC.b * 0.75);
      col.setXYZ(i * 2 + 1, tmpC.r * 0.05, tmpC.g * 0.05, tmpC.b * 0.05);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    this.rings.forEach((ring, k) => {
      ring.rotation.x = t * (0.3 + s * 5) * (k % 2 ? -1 : 1);
      ring.scale.setScalar(1 + s * 0.12 * Math.sin(t * 14 - k * 0.9));
      (ring.material as THREE.MeshBasicMaterial).color.copy(tmpC).multiplyScalar(0.6 + s * 0.8 * (0.5 + 0.5 * Math.sin(t * 10 - k)));
    });
  }
}

/* ------------------------------------------------------------------ */
/* 3 · Repetitive manual work: stalled gears → automated gear train   */
/* ------------------------------------------------------------------ */
function gearGeometry(r: number, teeth: number, depth = 0.32) {
  const shape = new THREE.Shape();
  const root = r * 0.84;
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts: [number, number][] = [[root, a], [r, a + step * 0.22], [r, a + step * 0.48], [root, a + step * 0.7]];
    pts.forEach(([rr, aa], k) => {
      const x = Math.cos(aa) * rr, y = Math.sin(aa) * rr;
      if (i === 0 && k === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, r * 0.22, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2, curveSegments: 6 });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

class GearSub implements Sub {
  group = new THREE.Group();
  private gears: { mesh: THREE.Mesh; rim: THREE.LineLoop; home: THREE.Vector3; away: THREE.Vector3; ratio: number; angle: number }[] = [];
  private boxes: THREE.Group[] = [];
  private belt: THREE.Mesh;
  private beltTravel = 0;

  constructor() {
    const metal = new THREE.MeshStandardMaterial({ color: 0x9aa3d6, metalness: 0.85, roughness: 0.28, emissive: new THREE.Color(0.05, 0.04, 0.12) });
    const defs = [
      { r: 1.5, teeth: 16, home: new THREE.Vector3(-1.4, 0.55, 0), away: new THREE.Vector3(-2.6, 1.4, -0.8) },
      { r: 0.95, teeth: 10, home: new THREE.Vector3(), away: new THREE.Vector3(2.4, 0.2, 0.9) },
      { r: 0.65, teeth: 7, home: new THREE.Vector3(), away: new THREE.Vector3(2.0, 2.4, -1.2) },
    ];
    // place the smaller gears so their pitch circles touch
    const pitch = (r: number) => r * 0.92;
    const d12 = pitch(1.5) + pitch(0.95);
    defs[1].home.set(defs[0].home.x + Math.cos(-0.35) * d12, defs[0].home.y + Math.sin(-0.35) * d12, 0);
    const d23 = pitch(0.95) + pitch(0.65);
    defs[2].home.set(defs[1].home.x + Math.cos(1.25) * d23, defs[1].home.y + Math.sin(1.25) * d23, 0);
    defs.forEach((d, i) => {
      const mesh = new THREE.Mesh(gearGeometry(d.r, d.teeth), metal);
      const rim = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(Array.from({ length: 64 }, (_, k) => new THREE.Vector3(Math.cos((k / 64) * Math.PI * 2) * d.r * 1.04, Math.sin((k / 64) * Math.PI * 2) * d.r * 1.04, 0.2))),
        new THREE.LineBasicMaterial({ color: RED.clone() })
      );
      mesh.add(rim);
      this.group.add(mesh);
      this.gears.push({ mesh, rim, home: d.home, away: d.away, ratio: 1, angle: i * 0.3 });
    });
    // ratios from the tooth counts (meshed gears turn in opposite directions)
    this.gears[1].ratio = -16 / 10;
    this.gears[2].ratio = 16 / 7;

    this.belt = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 0.9), new THREE.MeshStandardMaterial({ color: 0x15172e, metalness: 0.4, roughness: 0.6 }));
    this.belt.position.set(0, -2.3, 0);
    this.belt.add(edges(new THREE.BoxGeometry(8, 0.1, 0.9)));
    this.group.add(this.belt);
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Group();
      b.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x1b1f45, metalness: 0.3, roughness: 0.5 })));
      b.add(edges(new THREE.BoxGeometry(0.52, 0.52, 0.52)));
      this.boxes.push(b);
      this.group.add(b);
    }
  }

  update(s: number, t: number, dt: number, j: number) {
    const chaos = 1 - s;
    const base = lerp(0.25, 1.6, s);
    this.gears.forEach((g, i) => {
      g.mesh.position.copy(g.home).lerp(g.away, chaos * 0.9);
      g.mesh.position.y += Math.sin(t * 3 + i) * chaos * 0.08 + j * Math.sin(t * 30 + i) * 0.05;
      // broken: jerky and stalling, gear 2 even fights the others; fixed: smooth ratios
      const stutter = chaos * (Math.sin(t * 6 + i * 2) > 0.55 ? 2.4 : 0);
      const w = s * base * g.ratio + (i === 0 ? stutter : i === 1 ? stutter * 0.6 : 0);
      g.angle += w * dt;
      g.mesh.rotation.set(chaos * 0.4 * Math.sin(i + 1), chaos * 0.6 * Math.cos(i * 2), g.angle);
      (g.rim.material as THREE.LineBasicMaterial).color.copy(mixC(s)).multiplyScalar(0.7 + s * 0.5);
    });
    // parcels: piled up at the start while manual, flowing when automated
    this.beltTravel += dt * s * 1.8;
    this.boxes.forEach((b, i) => {
      const flowX = (((((i / 7) * 8 + this.beltTravel) % 8) + 8) % 8) - 4;
      const pileX = -3.4 + (i % 3) * 0.55;
      const pileY = -2.0 + Math.floor(i / 3) * 0.52;
      b.position.set(lerp(pileX, flowX, s), lerp(pileY, -1.98, s), 0);
      b.rotation.set(chaos * 0.3 * Math.sin(i * 3), chaos * 0.5 * Math.cos(i), chaos * 0.1 * Math.sin(t * 2 + i));
      ((b.children[1] as THREE.LineSegments).material as THREE.LineBasicMaterial).color.copy(mixC(s));
    });
    ((this.belt.children[0] as THREE.LineSegments).material as THREE.LineBasicMaterial).color.copy(mixC(s));
  }
}

/* ------------------------------------------------------------------ */
/* 4 · Slow, risky releases: wobbling pile → containers → lift-off     */
/* ------------------------------------------------------------------ */
class DeploySub implements Sub {
  group = new THREE.Group();
  private blocks: { g: THREE.Group; e: THREE.LineBasicMaterial; pile: THREE.Vector3; rot: THREE.Euler; slot: THREE.Vector3; k: number }[] = [];
  private beam: THREE.Mesh;
  private ring: THREE.Mesh;

  constructor() {
    const rnd = seeded(84);
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.85, 0.16, 64), new THREE.MeshStandardMaterial({ color: 0x10122a, metalness: 0.7, roughness: 0.35 }));
    platform.position.y = -1.95;
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(2.95, 0.045, 10, 120), new THREE.MeshBasicMaterial({ color: RED.clone() }));
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.y = -1.9;
    this.group.add(platform, this.ring);
    const body = new THREE.MeshStandardMaterial({ color: 0x161a3d, metalness: 0.45, roughness: 0.35 });
    for (let k = 0; k < 9; k++) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.64, 0.7), body));
      const e = edges(new THREE.BoxGeometry(1.07, 0.66, 0.72));
      g.add(e);
      for (let r = -2; r <= 2; r++) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.6, 0.72), e.material);
        rib.position.x = r * 0.2;
        g.add(rib);
      }
      this.group.add(g);
      const col = k % 3, row = Math.floor(k / 3);
      this.blocks.push({
        g,
        e: e.material as THREE.LineBasicMaterial,
        pile: new THREE.Vector3((rnd() - 0.5) * 5, -1.5 + rnd() * 2.6, (rnd() - 0.5) * 2.4),
        rot: new THREE.Euler((rnd() - 0.5) * 1.6, (rnd() - 0.5) * 2, (rnd() - 0.5) * 1.6),
        slot: new THREE.Vector3((col - 1) * 1.18, -1.52 + row * 0.7, 0),
        k,
      });
    }
    this.beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.7, 2.1, 14, 40, 1, true),
      new THREE.MeshBasicMaterial({ map: beamTexture(), color: new THREE.Color(0.6, 1.4, 2.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    (this.beam.material as THREE.MeshBasicMaterial).map!.rotation = Math.PI;
    this.beam.position.y = 5;
    this.group.add(this.beam);
  }

  update(s: number, t: number, _dt: number, j: number) {
    const chaos = 1 - s;
    const launch = smooth(range(s, 0.78, 1));
    this.blocks.forEach((b) => {
      // each container docks with its own delay
      const d = smooth(Math.min(1, Math.max(0, (s - b.k * 0.035) / 0.65)));
      b.g.position.copy(b.pile).lerp(b.slot, d);
      b.g.position.y += launch * (0.6 + Math.sin(t * 2 + b.k) * 0.05);
      const wob = (1 - d) * (0.25 + j);
      b.g.rotation.set(b.rot.x * (1 - d) + Math.sin(t * 3 + b.k) * wob, b.rot.y * (1 - d), b.rot.z * (1 - d) + Math.cos(t * 2.6 + b.k) * wob);
      // pipeline stages light up in sequence once everything is in place
      const stage = s > 0.6 ? 0.5 + 0.5 * Math.sin(t * 4 - b.k * 0.7) : 0;
      b.e.color.copy(mixC(d)).multiplyScalar(0.7 + stage * 1.2 + chaos * 0.3 * Math.abs(Math.sin(t * 8 + b.k)));
    });
    (this.ring.material as THREE.MeshBasicMaterial).color.copy(mixC(s)).multiplyScalar(0.8 + launch);
    (this.beam.material as THREE.MeshBasicMaterial).opacity = launch * (0.7 + 0.1 * Math.sin(t * 6));
    this.beam.rotation.y = t * 0.5;
  }
}

/**
 * Section 08: a different 3D story for every problem: chaos while it's a problem,
 * order once it's solved. Press to jolt the machinery, drag to rotate.
 */
export class SolveStage extends Stage {
  private root = new THREE.Group();
  private subs: Sub[];
  private holders: THREE.Group[] = [];
  private jolt = 0;
  private halo: THREE.Sprite;
  index = 0;
  solved = 0;

  constructor(ctx: Ctx, private count: number) {
    super(ctx);
    this.bloom = 0.7;
    this.scene.fog = new THREE.FogExp2(0x04020c, 0.03);
    this.scene.add(new THREE.AmbientLight(0x6070ff, 0.45));
    const key = new THREE.DirectionalLight(0xc8d4ff, 1.6);
    key.position.set(4, 6, 8);
    const fill = new THREE.PointLight(0xa78bfa, 40, 30);
    fill.position.set(-5, 2, 4);
    this.scene.add(key, fill, this.root);

    this.subs = [new SyncSub(), new SpeedSub(), new GearSub(), new DeploySub()];
    // each problem scene sits in a holder so the spin-in transition never fights its own pose
    this.subs.forEach((s) => {
      const h = new THREE.Group();
      h.visible = false;
      h.add(s.group);
      this.root.add(h);
      this.holders.push(h);
    });

    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(160,200,255,.5)", "rgba(110,80,255,.15)"), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    this.halo.scale.setScalar(14);
    this.halo.position.z = -3;
    this.scene.add(this.halo);
    this.scene.add(createStars(1600, 130, 88, 1.3));

    const hit = new THREE.Mesh(new THREE.SphereGeometry(4.2, 16, 12), new THREE.MeshBasicMaterial({ visible: false }));
    this.root.add(hit);
    this.pokes.add(this.root, { hit: [hit], spin: 0.5, bounce: 0.6, onPress: () => (this.jolt = 1) });
    this.rotor = new DragSpin(this.root, 0.7);
  }

  /** Problem index, how solved it is (0 chaos → 1 clean) and where we are inside its segment. */
  stateFor(p: number) {
    const u = range(p, 0.1, 0.88) * this.count;
    const i = Math.min(this.count - 1, Math.floor(u));
    const f = Math.min(1, u - i);
    return { i, f, solved: smooth(range(f, 0.15, 0.72)) };
  }
  progressFor(i: number) {
    return 0.1 + ((i + 0.75) / this.count) * 0.78;
  }

  update(p: number, dt: number) {
    const t = this.ctx.time;
    const { i, f, solved } = this.stateFor(p);
    this.index = i;
    this.solved = solved;
    this.jolt *= Math.exp(-3 * dt);
    const intro = smooth(range(p, 0, 0.1));

    this.subs.forEach((sub, k) => {
      const h = this.holders[k];
      if (k !== i) {
        h.visible = false;
        return;
      }
      // each scene spins in from the depths and spins out before the next one
      const enter = smooth(range(f, 0, 0.12));
      const exit = i < this.count - 1 ? 1 - smooth(range(f, 0.9, 1)) : 1;
      const v = Math.min(enter, exit) * intro;
      h.visible = v > 0.002;
      h.scale.setScalar(0.001 + v);
      h.position.z = (1 - v) * -6;
      h.rotation.y = (1 - v) * (enter < 1 ? 1.4 : -1.4);
      sub.update(solved, t, dt, this.jolt);
    });

    (this.halo.material as THREE.SpriteMaterial).color.copy(mixC(solved, new THREE.Color())).multiplyScalar(0.25);
    this.root.rotation.set(Math.sin(t * 0.2) * 0.12, Math.sin(t * 0.25) * 0.3, 0);

    const shift = this.ctx.aspect > 1 ? -3.8 : 0;
    const k = easeInOut(range(p, 0, 0.15));
    this.aim(new THREE.Vector3(shift * 0.25, lerp(2.5, 1.2, k), lerp(22, 14.5, k)), new THREE.Vector3(shift, 0, 0), 0.6);
  }
}
