import * as THREE from "three";
import { Ctx, Stage, easeInOut, lerp, range, seeded, smooth } from "../engine/stage";
import { beamTexture, glowTexture, labelTexture } from "../engine/textures";
import { createStars } from "./particles";

const NODE_GAP = 16;

/** Splits progress into "dwell at stop i, then travel to i+1" for n stops. */
export function dwell(p: number, n: number, hold = 0.55) {
  const u = Math.min(p * n, n - 1e-4);
  const i = Math.floor(u);
  const f = u - i;
  return { index: i, f, travel: smooth(range(f, hold, 1)) };
}

/**
 * Scene 4: the camera travels along a glowing career rail.
 * Progress map: 0–0.08 intro · 0.08–0.82 three jobs · 0.82–1 metrics.
 */
export class TimelineStage extends Stage {
  private nodes: { core: THREE.Mesh; ring: THREE.Mesh; beam: THREE.Mesh; glow: THREE.Sprite }[] = [];
  private streaks: THREE.Points;
  private streakSeeds: Float32Array;
  private rail: THREE.Mesh;

  private words: { sprite: THREE.Sprite; node: number; a: number; r: number; y: number; s: number }[] = [];

  constructor(ctx: Ctx, private count: number, stacks: string[][] = []) {
    super(ctx);
    // holographic technology words orbiting each career node
    const palette = ["#ffffff", "#c4b5fd", "#67e8f9", "#a5b4fc", "#f0abfc"];
    stacks.forEach((stack, node) => {
      stack.forEach((word, k) => {
        const { texture, aspect } = labelTexture(
          [{ text: word, size: 120, color: palette[k % palette.length], weight: 700 }],
          { width: Math.max(400, word.length * 78 + 80), align: "center", padding: 30 }
        );
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0, fog: true })
        );
        const s = 0.75 + (k % 3) * 0.18;
        sprite.scale.set(s * aspect * 0.55, s * 0.55, 1);
        this.scene.add(sprite);
        this.words.push({ sprite, node, a: (k / stack.length) * Math.PI * 2, r: 2.6 + (k % 2) * 1.3, y: 1.2 + (k % 3) * 0.9, s });
      });
    });
    this.bloom = 0.7;
    this.scene.fog = new THREE.FogExp2(0x03030b, 0.028);

    const len = (count - 1) * NODE_GAP + 60;
    this.rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, len),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.55, 1.5) })
    );
    this.rail.position.z = -((count - 1) * NODE_GAP) / 2;
    this.scene.add(this.rail);

    const railGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, len),
      new THREE.MeshBasicMaterial({
        map: beamTexture(),
        color: new THREE.Color(0.4, 0.5, 1.6),
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    railGlow.rotation.x = -Math.PI / 2;
    railGlow.rotation.z = Math.PI / 2;
    railGlow.position.copy(this.rail.position).setY(-0.02);
    railGlow.scale.set(1, 1, 1);
    this.scene.add(railGlow);

    // faint floor grid
    const grid = new THREE.GridHelper(200, 100, 0x2a1f5a, 0x14122a);
    grid.position.y = -1.6;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    this.scene.add(grid);

    const beamTex = beamTexture();
    const glowTex = glowTexture("rgba(255,255,255,1)", "rgba(120,140,255,0.35)");
    for (let i = 0; i < count; i++) {
      const z = -i * NODE_GAP;
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 32, 16),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.2, 3.0) })
      );
      core.position.set(0, 0, z);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.75, 0.02, 8, 120),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.6, 2.6), transparent: true })
      );
      ring.position.copy(core.position);
      const beam = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 9),
        new THREE.MeshBasicMaterial({
          map: beamTex,
          color: new THREE.Color(0.7, 0.6, 1.8),
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      beam.rotation.z = Math.PI;
      beam.position.set(0, 4.5, z);
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })
      );
      glow.position.copy(core.position);
      glow.scale.setScalar(3);
      this.scene.add(core, ring, beam, glow);
      this.nodes.push({ core, ring, beam, glow });
    }

    // speed streaks flowing along the rail
    const n = ctx.quality === "high" ? 900 : 400;
    const rnd = seeded(77);
    this.streakSeeds = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 2 + rnd() * 10;
      this.streakSeeds[i * 3] = Math.cos(a) * r;
      this.streakSeeds[i * 3 + 1] = Math.sin(a) * r * 0.6;
      this.streakSeeds[i * 3 + 2] = rnd();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.streaks = new THREE.Points(
      g,
      new THREE.PointsMaterial({
        size: 0.06,
        color: new THREE.Color(0.7, 0.7, 1.8),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.streaks.frustumCulled = false;
    this.scene.add(this.streaks);
    this.scene.add(createStars(1500, 150, 21, 1.2));
    this.nodes.forEach((nd) => this.pokes.add(nd.core, { hit: [nd.core, nd.ring], spin: 0.2, bounce: 1.6 }));
    this.words.forEach((w) => this.pokes.add(w.sprite, { spin: 0, bounce: 1.2 }));
  }

  /** Continuous job position (0..count-1) for a progress value, with pauses at each job. */
  jobPosition(p: number) {
    const jp = range(p, 0.06, 0.56);
    const d = dwell(jp, this.count, 0.6);
    return Math.min(d.index + d.travel, this.count - 1);
  }

  update(p: number) {
    const t = this.ctx.time;
    const pos = this.jobPosition(p);
    const metrics = easeInOut(range(p, 0.58, 0.7));
    const intro = easeInOut(range(p, 0, 0.08));
    const camZ = -pos * NODE_GAP + lerp(14, 6.5, intro);

    this.nodes.forEach((nd, i) => {
      const near = Math.max(0, 1 - Math.abs(pos - i) * 1.4);
      const s = 0.7 + near * 0.6 + Math.sin(t * 3 + i) * 0.04;
      nd.core.scale.setScalar(s);
      nd.ring.scale.setScalar(0.8 + near * 0.5);
      nd.ring.rotation.set(Math.PI / 2 + Math.sin(t * 0.5 + i) * 0.4, t * 0.6, 0);
      (nd.ring.material as THREE.MeshBasicMaterial).opacity = 0.3 + near * 0.7;
      (nd.beam.material as THREE.MeshBasicMaterial).opacity = 0.08 + near * 0.3;
      (nd.glow.material as THREE.SpriteMaterial).opacity = 0.2 + near * 0.35;
      nd.glow.scale.setScalar(1.2 + near * 1.3);
    });

    this.words.forEach((w) => {
      const near = Math.max(0, 1 - Math.abs(pos - w.node) * 1.6);
      const a = w.a + t * 0.18;
      // orbit behind the node so the words read as atmosphere, not as competing text
      w.sprite.position.set(Math.cos(a) * w.r * 1.3, w.y + Math.sin(t + w.a * 3) * 0.12 - (1 - near) * 1.5, -w.node * NODE_GAP - 3.5 + Math.sin(a) * w.r);
      (w.sprite.material as THREE.SpriteMaterial).opacity = near * near * (1 - metrics) * (this.ctx.aspect < 0.9 ? 0.1 : 0.24);
    });

    // streaks move toward the camera faster while travelling
    const speed = 0.05 + Math.abs(pos - Math.round(pos)) * 0.6;
    const attr = this.streaks.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < attr.count; i++) {
      const s = this.streakSeeds;
      const f = (s[i * 3 + 2] + t * speed) % 1;
      attr.setXYZ(i, s[i * 3], s[i * 3 + 1], camZ - 40 + f * 44);
    }
    attr.needsUpdate = true;

    // Camera sits to the side of the rail; for metrics it rises and pulls back over the whole career.
    const side = this.ctx.aspect > 1 ? 3.2 : 1.2;
    const travelPos = new THREE.Vector3(side, 1.6, camZ);
    const travelTarget = new THREE.Vector3(side * 0.15 - (this.ctx.aspect > 1 ? 1.4 : 0), 0.2, camZ - 9);
    const overPos = new THREE.Vector3(9, 11, 12);
    const overTarget = new THREE.Vector3(0, -1, -((this.count - 1) * NODE_GAP) / 2);
    this.aim(travelPos.lerp(overPos, metrics), travelTarget.lerp(overTarget, metrics), 0.45);
  }
}
