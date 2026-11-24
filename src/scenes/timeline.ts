import * as THREE from "three";
import { Ctx, Stage, easeInOut, lerp, range, seeded, smooth } from "../engine/stage";
import { beamTexture, glowTexture, labelTexture } from "../engine/textures";
import { createStars } from "./particles";

const NODE_GAP = 16;

/** Paints a violet-to-cyan-to-pink gradient along a line's length. */
function paintLine(geo: THREE.BufferGeometry) {
  const pos = geo.getAttribute("position");
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    if (z < min) min = z;
    if (z > max) max = z;
  }
  const span = Math.max(0.001, max - min);
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getZ(i) - min) / span;
    c.setHSL(0.76 - u * 0.42, 0.85, 0.66);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

/** Splits progress into "dwell at stop i, then travel to i+1" for n stops. */
export function dwell(p: number, n: number, hold = 0.55) {
  const u = Math.min(p * n, n - 1e-4);
  const i = Math.floor(u);
  const f = u - i;
  return { index: i, f, travel: smooth(range(f, hold, 1)) };
}

const JOB_COLORS = ["#c4b5fd", "#67e8f9", "#f9a8d4"];

/**
 * Scene 4: a colored light line the camera travels along.
 * Progress map: 0–0.08 intro · 0.08–0.82 three jobs · 0.82–1 metrics.
 */
export class TimelineStage extends Stage {
  private nodes: { core: THREE.Mesh; ring: THREE.Mesh; beam: THREE.Mesh; glow: THREE.Sprite }[] = [];
  private streaks: THREE.Points;
  private streakSeeds: Float32Array;
  private ribbon: THREE.Mesh;
  private ribbonUniforms?: { uFlex: { value: number } };
  private pulse: THREE.Sprite;
  private railLen = 1;
  private centerZ = 0;

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
    this.bloom = 0.55;
    this.bloomThreshold = 0.62;
    this.scene.fog = new THREE.FogExp2(0x03030b, 0.028);

    const span = Math.max(1, (count - 1) * NODE_GAP);
    this.railLen = span + 36;
    this.centerZ = -span / 2;
    const wave: THREE.Vector3[] = [];
    for (let i = 0; i <= 72; i++) {
      const localZ = -this.railLen / 2 + (i / 72) * this.railLen;
      const p = this.pathPoint(this.centerZ + localZ);
      wave.push(new THREE.Vector3(p.x, p.y, localZ));
    }
    const ribbonGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wave), 140, 0.045, 8, false);
    paintLine(ribbonGeo);
    const ribbonMat = new THREE.MeshBasicMaterial({ vertexColors: true });
    ribbonMat.onBeforeCompile = (shader) => {
      shader.uniforms.uFlex = { value: 0 };
      shader.uniforms.uCenter = { value: this.centerZ };
      this.ribbonUniforms = shader.uniforms as { uFlex: { value: number } };
      shader.vertexShader =
        "uniform float uFlex;\nuniform float uCenter;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           float wz = transformed.z + uCenter;
           transformed.x += sin(wz * 0.16 + uFlex) * 0.7;
           transformed.y += cos(wz * 0.12 + uFlex * 0.8) * 0.45;`
        );
    };
    this.ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    this.ribbon.position.z = this.centerZ;
    this.scene.add(this.ribbon);

    const beamTex = beamTexture();
    for (let i = 0; i < count; i++) {
      const color = new THREE.Color(JOB_COLORS[i % JOB_COLORS.length]);
      const z = -i * NODE_GAP;
      const spot = this.pathPoint(z);
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 24, 16),
        new THREE.MeshBasicMaterial({ color })
      );
      core.position.copy(spot);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.72, 0.028, 10, 64),
        new THREE.MeshBasicMaterial({ color, transparent: true })
      );
      ring.position.copy(core.position);
      const beam = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55, 4.2),
        new THREE.MeshBasicMaterial({
          map: beamTex,
          color,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      beam.position.set(spot.x, spot.y + 2.1, spot.z);
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTexture(color.getStyle(), "rgba(0,0,0,0)"),
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        })
      );
      glow.position.copy(core.position);
      glow.scale.setScalar(2.4);
      this.scene.add(core, ring, beam, glow);
      this.nodes.push({ core, ring, beam, glow });
    }

    this.pulse = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture("rgba(255,255,255,1)", "rgba(103,232,249,0.45)"),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      })
    );
    this.pulse.scale.setScalar(1.6);
    this.scene.add(this.pulse);

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

  /** A broad bend, so the career light follows a curve instead of a straight rail. */
  private pathPoint(worldZ: number) {
    const centerZ = -Math.max(1, (this.count - 1) * NODE_GAP) / 2;
    const u = (worldZ - centerZ + this.railLen / 2) / this.railLen;
    return new THREE.Vector3(
      Math.sin(u * Math.PI * 2.15) * 1.7,
      Math.sin(u * Math.PI * 1.45 + 0.8) * 1.35,
      worldZ
    );
  }

  /** Extra sway so the light line keeps flexing after the curve is drawn. */
  private flexAt(worldZ: number, flex: number) {
    return {
      x: Math.sin(worldZ * 0.16 + flex) * 0.7,
      y: Math.cos(worldZ * 0.12 + flex * 0.8) * 0.45,
    };
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

    const drift = (t * 0.05) % 1;
    (this.ribbon.material as THREE.MeshBasicMaterial).color.setHSL(drift, 0.55, 0.82);
    const flex = t * 0.55;
    if (this.ribbonUniforms) this.ribbonUniforms.uFlex.value = flex;
    const along = (t * 0.18) % 1;
    const pulseZ = -along * (this.count - 1) * NODE_GAP;
    const pulseAt = this.pathPoint(pulseZ);
    const pulseFlex = this.flexAt(pulseZ, flex);
    this.pulse.position.set(pulseAt.x + pulseFlex.x, pulseAt.y + pulseFlex.y, pulseAt.z);
    this.pulse.scale.setScalar(1.3 + Math.sin(t * 4) * 0.25);

    this.nodes.forEach((nd, i) => {
      const z = -i * NODE_GAP;
      const spot = this.pathPoint(z);
      const sway = this.flexAt(z, flex);
      spot.x += sway.x;
      spot.y += sway.y;
      nd.core.position.copy(spot);
      nd.ring.position.copy(spot);
      nd.glow.position.copy(spot);
      nd.beam.position.set(spot.x, spot.y + 2.1, spot.z);
      const near = Math.max(0, 1 - Math.abs(pos - i) * 1.4);
      nd.core.scale.setScalar(0.75 + near * 0.5 + Math.sin(t * 3 + i) * 0.05);
      nd.ring.rotation.set(Math.PI / 2.4, t * (0.7 + i * 0.2), t * 0.35);
      nd.ring.scale.setScalar(0.8 + near * 0.45 + Math.sin(t * 2 + i) * 0.05);
      (nd.ring.material as THREE.MeshBasicMaterial).opacity = 0.35 + near * 0.6;
      (nd.beam.material as THREE.MeshBasicMaterial).opacity = 0.14 + near * 0.4 + Math.sin(t * 2.1 + i) * 0.05;
      nd.beam.scale.y = 0.82 + near * 0.28 + Math.sin(t * 1.3 + i) * 0.06;
      (nd.glow.material as THREE.SpriteMaterial).opacity = 0.2 + near * 0.4;
      nd.glow.scale.setScalar(1.5 + near * 1.5);
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
