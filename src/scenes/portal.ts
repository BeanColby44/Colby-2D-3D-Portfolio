import * as THREE from "three";
import { Ctx, Stage, easeInOut, easeOut, lerp, range, seeded } from "../engine/stage";
import { glowTexture } from "../engine/textures";

const PORTAL_Z = -70;

const portalFragment = /* glsl */ `
  uniform float uTime, uOpen, uHalo;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv - 0.5;
    // bright vertical slit with soft falloff
    float w = 0.5 * uOpen;
    float dx = max(abs(c.x) - w * 0.18, 0.0);
    float dy = max(abs(c.y) - 0.4, 0.0);
    float core = exp(-dx * 90.0) * exp(-dy * 40.0);
    float halo = exp(-length(vec2(dx * 6.0, dy * 2.5)) * 6.0);
    float flicker = 0.92 + 0.08 * sin(uTime * 13.0) * sin(uTime * 7.3);
    halo *= uHalo;
    vec3 col = vec3(0.85, 0.93, 1.0) * core * 3.0 + vec3(0.35, 0.55, 1.4) * halo * 0.8;
    float a = clamp(core + halo, 0.0, 1.0);
    gl_FragColor = vec4(col * flicker * uOpen, a * uOpen);
  }
`;

/** Scene 6: darkness → glowing doorway → forward camera travel → pass through the light. */
export class PortalStage extends Stage {
  private portal: THREE.Mesh;
  private portalMat: THREE.ShaderMaterial;
  private halo: THREE.Sprite;
  private lines: THREE.LineSegments;
  private frames: THREE.LineSegments[] = [];
  private dust: THREE.Points;
  private dustSeeds: Float32Array;
  /** 0..1 white flash requested for the final pass */
  flash = 0;

  constructor(ctx: Ctx) {
    super(ctx);
    this.bloom = 0.9;
    this.scene.fog = new THREE.Fog(0x020208, 20, 90);

    this.portalMat = new THREE.ShaderMaterial({
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: portalFragment,
      uniforms: { uTime: { value: 0 }, uOpen: { value: 0 }, uHalo: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    this.portal = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), this.portalMat);
    this.portal.position.set(0, 0, PORTAL_Z);
    this.scene.add(this.portal);

    this.halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture("rgba(200,220,255,0.8)", "rgba(80,110,255,0.25)"),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        fog: false,
      })
    );
    this.halo.position.copy(this.portal.position);
    this.halo.scale.set(26, 26, 1);
    this.scene.add(this.halo);

    // perspective lines converging on the doorway (floor, ceiling, walls)
    const rnd = seeded(12);
    const pts: number[] = [];
    const cols: number[] = [];
    const W = 7, H = 4.5;
    for (let i = 0; i < 70; i++) {
      const side = i % 4;
      const u = rnd() * 2 - 1;
      let x = 0, y = 0;
      if (side === 0) { x = u * W; y = -H; }
      else if (side === 1) { x = u * W; y = H; }
      else if (side === 2) { x = -W; y = u * H; }
      else { x = W; y = u * H; }
      pts.push(x, y, 20, x * 0.06, y * 0.25, PORTAL_Z);
      const c = rnd() > 0.5 ? [0.35, 0.6, 1.8] : [0.9, 0.45, 1.8];
      const b = 0.4 + rnd() * 0.6;
      cols.push(c[0] * b * 0.3, c[1] * b * 0.3, c[2] * b * 0.3, c[0] * b, c[1] * b, c[2] * b);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    lg.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    this.lines = new THREE.LineSegments(
      lg,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.scene.add(this.lines);

    // rectangular frames along the tunnel that light up as the camera passes
    for (let i = 0; i < 9; i++) {
      const z = 6 - i * 8.5;
      const k = 1 - (i / 9) * 0.82;
      const w = W * k, h = H * k;
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-w, -h, z), new THREE.Vector3(w, -h, z),
        new THREE.Vector3(w, -h, z), new THREE.Vector3(w, h, z),
        new THREE.Vector3(w, h, z), new THREE.Vector3(-w, h, z),
        new THREE.Vector3(-w, h, z), new THREE.Vector3(-w, -h, z),
      ]);
      const f = new THREE.LineSegments(
        g,
        new THREE.LineBasicMaterial({ color: new THREE.Color(0.4, 0.6, 2.0), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      this.frames.push(f);
      this.scene.add(f);
    }

    const n = ctx.quality === "high" ? 1200 : 500;
    this.dustSeeds = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      this.dustSeeds[i * 3] = (rnd() - 0.5) * 14;
      this.dustSeeds[i * 3 + 1] = (rnd() - 0.5) * 9;
      this.dustSeeds[i * 3 + 2] = rnd();
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.dust = new THREE.Points(
      dg,
      new THREE.PointsMaterial({ size: 0.05, color: new THREE.Color(0.8, 0.85, 1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
  }

  update(p: number) {
    const t = this.ctx.time;
    const open = easeOut(range(p, 0.06, 0.3));
    this.portalMat.uniforms.uTime.value = t;
    this.portalMat.uniforms.uOpen.value = open;
    // halo shrinks in influence as we approach so the screen only whites out at the threshold
    const approach = range(p, 0.3, 0.96);
    (this.halo.material as THREE.SpriteMaterial).opacity = open * 0.55 * (1 - approach * 0.85);
    this.portalMat.uniforms.uHalo.value = 1 - Math.pow(approach, 0.7) * 0.8;
    this.bloom = 0.9 - approach * 0.55;
    (this.lines.material as THREE.LineBasicMaterial).opacity = easeOut(range(p, 0.15, 0.4));

    // forward travel accelerates toward the doorway
    const travel = easeInOut(range(p, 0.3, 0.96));
    const camZ = lerp(18, PORTAL_Z + 0.5, travel * travel * 0.4 + travel * 0.6);
    this.frames.forEach((f, i) => {
      const z = 6 - i * 8.5;
      const near = Math.max(0, 1 - Math.abs(camZ - 3 - z) / 10);
      (f.material as THREE.LineBasicMaterial).opacity = easeOut(range(p, 0.2 + i * 0.02, 0.35 + i * 0.02)) * (0.25 + near * 0.9);
    });

    const attr = this.dust.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < attr.count; i++) {
      const s = this.dustSeeds;
      const f = (s[i * 3 + 2] + t * 0.03) % 1;
      attr.setXYZ(i, s[i * 3], s[i * 3 + 1], camZ - 30 + f * 32);
    }
    attr.needsUpdate = true;

    // widen the lens slightly as we rush in
    const cam = this.ctx.camera;
    cam.fov = lerp(50, 64, travel * travel);
    cam.updateProjectionMatrix();

    this.flash = easeInOut(range(p, 0.84, 0.985));
    this.aim(new THREE.Vector3(0, 0.2, camZ), new THREE.Vector3(0, 0, PORTAL_Z - 10), 0.25 * (1 - travel));
  }
}
