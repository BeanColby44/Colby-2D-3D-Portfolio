import * as THREE from "three";
import { Ctx, Stage, damp, easeInOut, easeOut, lerp, range, seeded } from "../engine/stage";
import { beamTexture, glowTexture } from "../engine/textures";
import { DragSpin } from "../engine/pokes";

const gridFragment = /* glsl */ `
  uniform float uOn, uTime;
  varying vec3 vW;
  float line(float v, float w) { float d = abs(fract(v - 0.5) - 0.5) / fwidth(v); return 1.0 - min(d / w, 1.0); }
  void main() {
    float minor = max(line(vW.x, 1.0), line(vW.z, 1.0));
    float major = max(line(vW.x / 5.0, 1.2), line(vW.z / 5.0, 1.2));
    float dist = length(vW.xz);
    float fade = exp(-dist * 0.045);
    float sweep = smoothstep(2.0, 0.0, abs(dist - mod(uTime * 6.0, 60.0))) * 0.6;
    vec3 col = vec3(0.15, 0.75, 1.3) * (minor * 0.35 + major * 0.9 + sweep * major);
    gl_FragColor = vec4(col * fade * uOn, (minor * 0.4 + major) * fade * uOn);
  }
`;

interface Block {
  mesh: THREE.LineSegments;
  face: THREE.Mesh;
  from: THREE.Vector3;
  to: THREE.Vector3;
  size: THREE.Vector3;
  cluster: number;
  delay: number;
  hi: number;
}

/**
 * Scene 8: wireframe structures rise from a perspective grid and assemble into one formation;
 * each cluster represents one key achievement. A vertical beam lights the final structure.
 */
export class WireframeStage extends Stage {
  private grid: THREE.Mesh;
  private blocks: Block[] = [];
  private beam: THREE.Mesh;
  private beamGlow: THREE.Sprite;
  private holder = new THREE.Group();
  active = 0;

  constructor(ctx: Ctx, private clusters: number) {
    super(ctx);
    this.bloom = 0.8;
    this.scene.fog = new THREE.FogExp2(0x02030a, 0.03);

    this.grid = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.ShaderMaterial({
        vertexShader:
          "varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
        fragmentShader: gridFragment,
        uniforms: { uOn: { value: 0 }, uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
      })
    );
    this.grid.rotation.x = -Math.PI / 2;
    this.scene.add(this.grid);
    this.scene.add(this.holder);

    const rnd = seeded(31);
    const unit = new THREE.BoxGeometry(1, 1, 1);
    unit.translate(0, 0.5, 0);
    const edges = new THREE.EdgesGeometry(unit);
    const perCluster = 6;
    for (let c = 0; c < clusters; c++) {
      // final formation: stacked rings that taper toward the top
      const tierY = c * 1.15;
      const radius = 2.5 - c * 0.38;
      for (let k = 0; k < perCluster; k++) {
        const a = (k / perCluster) * Math.PI * 2 + c * 0.5;
        const size = new THREE.Vector3(1.25 - c * 0.13, 1.05, 1.25 - c * 0.13);
        const to = new THREE.Vector3(Math.cos(a) * radius, tierY, Math.sin(a) * radius);
        const from = new THREE.Vector3((rnd() - 0.5) * 30, 0, (rnd() - 0.5) * 22 - 4);
        const mesh = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: new THREE.Color(0.3, 1.4, 2.2), transparent: true })
        );
        const face = new THREE.Mesh(
          unit,
          new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 0.4, 0.8), transparent: true, opacity: 0, depthWrite: false })
        );
        mesh.add(face); // faces ride along with the edges (and catch presses)
        this.holder.add(mesh);
        this.blocks.push({ mesh, face, from, to, size, cluster: c, delay: rnd() * 0.08, hi: 0 });
        this.pokes.add(mesh, { hit: [face], spin: 1.1, bounce: 1.2 });
      }
    }

    this.beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.9, 40, 32, 1, true),
      new THREE.MeshBasicMaterial({
        map: beamTexture(),
        color: new THREE.Color(1.2, 1.6, 2.6),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    (this.beam.material as THREE.MeshBasicMaterial).map!.rotation = Math.PI;
    this.beam.position.y = 20;
    this.scene.add(this.beam);
    this.beamGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture("rgba(220,240,255,1)", "rgba(80,160,255,0.35)"),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      })
    );
    this.beamGlow.position.y = clusters * 1.15 + 0.6;
    this.beamGlow.scale.setScalar(6);
    this.scene.add(this.beamGlow);
    this.rotor = new DragSpin(this.holder, 0.35);
  }

  /** Achievement index for a progress value. */
  indexFor(p: number) {
    return Math.min(this.clusters - 1, Math.floor(range(p, 0.2, 0.9) * this.clusters));
  }
  progressFor(i: number) {
    return 0.2 + ((i + 0.5) / this.clusters) * 0.7;
  }

  update(p: number, dt: number) {
    const t = this.ctx.time;
    const gm = this.grid.material as THREE.ShaderMaterial;
    gm.uniforms.uOn.value = easeOut(range(p, 0, 0.1));
    gm.uniforms.uTime.value = t;

    this.active = this.indexFor(p);
    const assembling = p > 0.2;
    const done = easeOut(range(p, 0.86, 0.95));

    this.blocks.forEach((b) => {
      const rise = easeOut(range(p, 0.04 + b.delay, 0.16 + b.delay));
      // each cluster flies into the formation when its achievement comes up
      const start = this.progressFor(b.cluster) - 0.12 + b.delay * 0.5;
      const move = easeInOut(range(p, start, start + 0.1));
      const pos = b.from.clone().lerp(b.to, move);
      pos.y += Math.sin(move * Math.PI) * 2.5;
      b.mesh.position.copy(pos);
      const sy = b.size.y * Math.max(0.001, rise);
      b.mesh.scale.set(b.size.x, sy, b.size.z);
      const isHi = assembling && b.cluster === this.active ? 1 : 0;
      b.hi = damp(b.hi, Math.max(isHi, done * 0.8), 5, dt);
      const placed = move > 0.99 ? 1 : 0;
      const intensity = 0.5 + placed * 0.4 + b.hi * 2.0;
      (b.mesh.material as THREE.LineBasicMaterial).color.setRGB(0.25 * intensity + b.hi * 0.6, 1.2 * intensity, 2.0 * intensity);
      (b.mesh.material as THREE.LineBasicMaterial).opacity = rise;
      (b.face.material as THREE.MeshBasicMaterial).opacity = rise * (0.04 + b.hi * 0.14);
    });

    const beamOn = easeOut(range(p, 0.8, 0.92));
    (this.beam.material as THREE.MeshBasicMaterial).opacity = beamOn * (0.75 + 0.1 * Math.sin(t * 5));
    this.beam.scale.set(0.4 + beamOn * 0.6, 1, 0.4 + beamOn * 0.6);
    (this.beamGlow.material as THREE.SpriteMaterial).opacity = beamOn;
    this.holder.rotation.y = t * 0.05 * done;

    // low orbit that rises and circles the structure
    const a = lerp(-0.9, 0.9, easeInOut(p));
    const r = lerp(19, 13, easeInOut(range(p, 0, 0.6)));
    const h = lerp(2.2, 6.5, easeInOut(p));
    const shift = this.ctx.aspect > 1 ? 3.0 : 0;
    this.aim(
      new THREE.Vector3(Math.sin(a) * r, h, Math.cos(a) * r),
      new THREE.Vector3(-Math.cos(a) * shift, 2.4, Math.sin(a) * shift),
      0.5
    );
  }
}
