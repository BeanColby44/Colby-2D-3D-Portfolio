import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Ctx, Stage, easeInOut, easeOut, lerp, range, seeded } from "../engine/stage";
import { glowTexture, symbolTexture } from "../engine/textures";
import { createStars } from "./particles";
import { DragSpin } from "../engine/pokes";

const SYMBOLS: [string, string][] = [
  ["</>", "#22d3ee"], ["{ }", "#8b5cf6"], ["Go", "#38bdf8"], ["TS", "#3b82f6"], ["Py", "#a78bfa"],
  ["Ng", "#f472b6"], ["C#", "#8b5cf6"], [".NET", "#a78bfa"], ["SQL", "#38bdf8"], ["API", "#22d3ee"],
  ["AI", "#e879f9"], ["K8s", "#3b82f6"], ["AWS", "#f59e0b"], ["λ", "#22d3ee"], ["$_", "#a78bfa"],
  ["LLM", "#e879f9"], ["MCP", "#8b5cf6"], ["CI/CD", "#38bdf8"], ["RN", "#22d3ee"], ["#", "#f472b6"],
];

const coreVertex = /* glsl */ `
  varying vec3 vN; varying vec3 vV; varying vec3 vP;
  void main() {
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    vP = position;
    gl_Position = projectionMatrix * mv;
  }
`;
const coreFragment = /* glsl */ `
  uniform float uTime, uIntensity;
  varying vec3 vN; varying vec3 vV; varying vec3 vP;
  void main() {
    // clamp: rounding can push the dot product past 1, and pow(negative) is NaN
    float fres = pow(clamp(1.0 - dot(vN, vV), 0.0, 1.0), 2.2);
    float bands = 0.5 + 0.5 * sin(vP.y * 9.0 + uTime * 2.4 + sin(vP.x * 5.0 + uTime) * 1.5);
    float swirl = 0.5 + 0.5 * sin(atan(vP.z, vP.x) * 6.0 + uTime * 3.0 + vP.y * 4.0);
    vec3 inner = vec3(0.8, 0.6, 1.0);
    vec3 rim = vec3(0.3, 0.85, 1.0);
    vec3 col = mix(inner * (0.35 + bands * 0.35 + swirl * 0.3), rim * 1.7, fres);
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`;

interface Chip {
  mesh: THREE.Mesh;
  face: THREE.MeshPhysicalMaterial;
  radius: number;
  phase: number;
  speed: number;
  incl: THREE.Quaternion;
  tumbleAxis: THREE.Vector3;
  tumble: number;
  base: number;
  appear: number;
}

/**
 * Section 03 (experience snapshot): a reactor core inside a metal gyroscope, with thick glass
 * technology chips orbiting on tilted 3D paths, tumbling and catching the core's light.
 */
export class SymbolsStage extends Stage {
  private group = new THREE.Group();
  private core: THREE.Mesh;
  private coreMat: THREE.ShaderMaterial;
  private halo: THREE.Sprite;
  private gimbals: THREE.Mesh[] = [];
  private gimbalGlow: THREE.Mesh[] = [];
  private chips: Chip[] = [];
  private light: THREE.PointLight;
  private stream: THREE.Points;
  private streamSeed: Float32Array;
  private tmpQ = new THREE.Quaternion();
  private tmpV = new THREE.Vector3();

  constructor(ctx: Ctx) {
    super(ctx);
    this.bloom = 0.7;
    this.scene.fog = new THREE.FogExp2(0x040312, 0.03);
    this.scene.add(this.group);

    // soft studio reflections so metal and glass read as real 3D surfaces
    const pmrem = new THREE.PMREMGenerator(ctx.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    (this.scene as any).environmentIntensity = 0.35;
    this.scene.add(new THREE.AmbientLight(0x5060ff, 0.25));
    const rim = new THREE.DirectionalLight(0x9fd8ff, 1.2);
    rim.position.set(-6, 5, -4);
    this.scene.add(rim);

    // energy core + internal light
    this.coreMat = new THREE.ShaderMaterial({ vertexShader: coreVertex, fragmentShader: coreFragment, uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 } } });
    this.core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 24), this.coreMat);
    this.light = new THREE.PointLight(0xb9a6ff, 0, 30, 1.6);
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(220,210,255,0.9)", "rgba(110,80,255,0.28)"), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    this.halo.scale.setScalar(7);
    this.group.add(this.core, this.light, this.halo);

    // gyroscope: three nested metal rings with glowing inner tracks
    const metal = new THREE.MeshPhysicalMaterial({ color: 0x9aa0c8, metalness: 1, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.15 });
    const glowCols = [new THREE.Color(0.3, 1.5, 2.4), new THREE.Color(1.4, 0.5, 2.4), new THREE.Color(0.5, 0.8, 2.6)];
    [1.75, 2.15, 2.55].forEach((r, i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 24, 160), metal);
      const glow = new THREE.Mesh(new THREE.TorusGeometry(r, 0.018, 8, 200), new THREE.MeshBasicMaterial({ color: glowCols[i] }));
      glow.position.z = 0;
      ring.add(glow);
      this.group.add(ring);
      this.gimbals.push(ring);
      this.gimbalGlow.push(glow);
      this.pokes.add(ring, { spin: 1.5, bounce: 0.6, axis: new THREE.Vector3(0, 0, 1) });
    });

    // thick glass chips with the symbol on both faces
    const rnd = seeded(42);
    const geo = new RoundedBoxGeometry(1, 1, 0.24, 4, 0.13);
    const shell = new THREE.MeshPhysicalMaterial({ color: 0x141433, metalness: 0.65, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 0.6, iridescenceIOR: 1.4 });
    SYMBOLS.forEach(([sym, color], i) => {
      const tex = symbolTexture(sym, color);
      const face = new THREE.MeshPhysicalMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: new THREE.Color(1, 1, 1),
        emissiveIntensity: 0.8,
        metalness: 0.3,
        roughness: 0.25,
        clearcoat: 1,
        transparent: true,
      });
      // box groups: +x, -x, +y, -y, +z, -z
      const mesh = new THREE.Mesh(geo, [shell, shell, shell, shell, face, face]);
      const base = 0.95 + rnd() * 0.6;
      mesh.scale.setScalar(0);
      this.group.add(mesh);
      const incl = new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 1.3, rnd() * Math.PI, (rnd() - 0.5) * 0.9));
      this.chips.push({
        mesh,
        face,
        radius: 3.3 + rnd() * 4.2,
        phase: (i / SYMBOLS.length) * Math.PI * 2 + rnd() * 0.5,
        speed: (0.12 + rnd() * 0.14) * (rnd() > 0.5 ? 1 : -1),
        incl,
        tumbleAxis: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
        tumble: 0.25 + rnd() * 0.5,
        base,
        appear: 0.08 + (i / SYMBOLS.length) * 0.32,
      });
      this.pokes.add(mesh, { spin: 1.6, bounce: 1.3 });
    });
    this.pokes.add(this.core, { hit: [this.core], spin: 0.4, bounce: 1.6 });
    this.rotor = new DragSpin(this.group);

    // a helix of energy feeding the core
    const n = ctx.quality === "high" ? 900 : 400;
    this.streamSeed = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) this.streamSeed.set([rnd(), rnd()], i * 2);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.stream = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.05, color: new THREE.Color(0.7, 1.2, 2.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.stream.frustumCulled = false;
    this.group.add(this.stream);

    this.scene.add(createStars(1600, 140, 9, 1.3));
  }

  update(p: number, dt: number) {
    const t = this.ctx.time;
    const coreIn = easeOut(range(p, 0.02, 0.16));
    this.coreMat.uniforms.uTime.value = t;
    this.coreMat.uniforms.uIntensity.value = coreIn * (1 + 0.1 * Math.sin(t * 3));
    this.core.scale.setScalar(0.3 + coreIn * 0.7);
    this.core.rotation.y = t * 0.4;
    this.light.intensity = coreIn * 70;
    (this.halo.material as THREE.SpriteMaterial).opacity = coreIn * 0.4;

    // gimbals assemble, then spin on independent axes like a gyroscope
    this.gimbals.forEach((g, i) => {
      const k = easeOut(range(p, 0.06 + i * 0.05, 0.22 + i * 0.05));
      g.scale.setScalar(0.4 + k * 0.6);
      g.visible = k > 0.01;
      const sp = (i + 1) * 0.35;
      if (i === 0) g.rotation.set(t * sp, 0.3, 0);
      else if (i === 1) g.rotation.set(0.6, t * sp, t * 0.2);
      else g.rotation.set(t * 0.15, 1.1, t * sp);
    });

    // chips orbit on tilted planes and tumble in 3D; the spotlight walks through them
    const focus = Math.floor(range(p, 0.45, 0.92) * this.chips.length);
    this.chips.forEach((c, i) => {
      const a = c.phase + t * c.speed;
      this.tmpV.set(Math.cos(a) * c.radius, Math.sin(a * 2 + c.phase) * 0.35, Math.sin(a) * c.radius).applyQuaternion(c.incl);
      c.mesh.position.copy(this.tmpV);
      this.tmpQ.setFromAxisAngle(c.tumbleAxis, t * c.tumble + c.phase);
      c.mesh.quaternion.copy(this.tmpQ);
      const show = easeOut(range(p, c.appear, c.appear + 0.12));
      const lit = p > 0.45 && i === focus ? 1 : 0;
      c.mesh.scale.setScalar(c.base * show * (1 + lit * 0.3));
      c.mesh.visible = show > 0.01;
      c.face.emissiveIntensity = 0.6 + lit * 2.2;
    });

    // energy helix spiralling into the core
    const pos = this.stream.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const s0 = this.streamSeed[i * 2], s1 = this.streamSeed[i * 2 + 1];
      const life = (s0 + t * 0.18) % 1;
      const r = 1.1 + (1 - life) * 6;
      const ang = s1 * Math.PI * 2 + life * 9;
      pos.setXYZ(i, Math.cos(ang) * r, (s1 - 0.5) * 3 * (1 - life), Math.sin(ang) * r);
    }
    pos.needsUpdate = true;
    (this.stream.material as THREE.PointsMaterial).opacity = coreIn * 0.8;

    // cinematic camera: swoops from low behind, orbits ~150°, then rises
    const k = easeInOut(range(p, 0, 0.5));
    const ang = lerp(-1.4, 1.2, easeInOut(p));
    const dist = lerp(26, 12.5, k) + Math.sin(p * Math.PI) * 1.5;
    const h = lerp(-3, 2.2, easeInOut(p)) + Math.sin(t * 0.3) * 0.2;
    const shift = this.ctx.aspect > 1 ? 2.6 : 0;
    this.aim(
      new THREE.Vector3(Math.sin(ang) * dist, h, Math.cos(ang) * dist),
      new THREE.Vector3(-Math.cos(ang) * shift, 0, Math.sin(ang) * shift),
      0.5
    );
    // slight dutch roll for a filmic feel
    this.ctx.camera.rotateZ(Math.sin(p * Math.PI * 2) * 0.05);
  }
}
