import * as THREE from "three";
import { Ctx, seeded } from "../engine/stage";
import { DISPLAY_FONT } from "../engine/textures";

const vertex = /* glsl */ `
  attribute vec3 aGal;
  attribute vec3 aScatter;
  attribute vec3 aText;
  attribute vec4 aRand;
  uniform float uTime, uRot, uDisperse, uForm, uExit, uSize, uAlpha, uGalR;
  uniform vec3 uMouse;      // cursor on the text plane
  uniform float uHover;     // 0..1 cursor is over the name
  uniform vec3 uShockPos;   // where the name was pressed
  uniform float uShockT;    // seconds since the press
  uniform float uShockAmp;  // 0 = no shock
  uniform float uCarve;     // world x the comet has carved up to
  uniform float uCarveMode; // 1 while the comet is carving
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Spiral galaxy with differential rotation (inner stars orbit faster).
    float r = aGal.x;
    float speed = 1.0 / (0.35 + r * 0.22);
    float a = aGal.y + uRot * speed;
    vec3 g = vec3(cos(a) * r, aGal.z, sin(a) * r);

    // Dispersed cloud with slow drift.
    vec3 s = aScatter + vec3(
      sin(uTime * 0.3 + aRand.x * 6.283),
      cos(uTime * 0.25 + aRand.y * 6.283),
      sin(uTime * 0.2 + aRand.z * 6.283)) * 0.6;

    float d = clamp(uDisperse * 1.35 - aRand.x * 0.35, 0.0, 1.0);
    d = d * d * (3.0 - 2.0 * d);
    vec3 p = mix(g, s, d);

    // Assemble into the name, each particle with its own delay and arc.
    float f = clamp(uForm * 1.5 - aRand.y * 0.5, 0.0, 1.0);
    f = f * f * (3.0 - 2.0 * f);
    // comet carving: particles snap into the letters right behind the comet head
    float behind = uCarve - aText.x;
    float cf = uCarveMode * clamp(behind * 1.6 - aRand.y * 0.45, 0.0, 1.0);
    f = max(f, cf * cf * (3.0 - 2.0 * cf));
    float hot = uCarveMode * step(0.0, behind) * exp(-max(behind, 0.0) * 0.8);
    vec3 t = aText + vec3(sin(uTime * 1.3 + aRand.z * 20.0), cos(uTime * 1.1 + aRand.x * 20.0), 0.0) * 0.012;
    vec3 arc = vec3(0.0, (aRand.x - 0.5) * 2.0, (aRand.z - 0.5) * 7.0) * sin(f * 3.14159);
    p = mix(p, t, f) + arc;

    // Cursor field: letters part around the pointer and lift toward the camera.
    vec2 dm = p.xy - uMouse.xy;
    float dmL = length(dm);
    float rep = uHover * f * exp(-dmL * dmL / 1.3);
    float swirl = sin(uTime * 6.0 + aRand.x * 30.0) * 0.12;
    p.xy += normalize(dm + vec2(1e-4)) * rep * (0.6 + aRand.z * 0.6) + vec2(-dm.y, dm.x) * rep * swirl;
    p.z += rep * (1.0 + aRand.y * 2.2);

    // Press: a blast at the press point and a shockwave ring racing through the letters.
    vec2 sv = p.xy - uShockPos.xy;
    float sd = length(sv);
    vec2 sdir = sv / max(sd, 1e-3);
    float R = uShockT * 11.0;
    float ringD = sd - R;
    float ring = exp(-(ringD * ringD) / 0.6) * exp(-uShockT * 1.2) * uShockAmp;
    float blast = exp(-sd * sd / 4.5) * exp(-uShockT * 2.2) * uShockAmp * smoothstep(0.0, 0.05, uShockT);
    p.xy += sdir * (ring * 1.2 + blast * (2.0 + aRand.x * 4.5)) * f;
    p.z += (ring * 2.4 + blast * (aRand.y - 0.3) * 12.0) * f;
    float glow = clamp(rep * 1.2 + ring * 1.6 + blast * 1.2 + hot * 1.8, 0.0, 1.8);

    // Exit: particles stream outward past the camera.
    vec3 dir = normalize(p + vec3(0.001, 0.002, 0.003));
    p += dir * uExit * (1.5 + aRand.x * 9.0);
    p.z += uExit * uExit * (2.0 + aRand.y * 14.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // the dispersed dust is smaller so the carved letters stay the focus
    float size = mix(aRand.w * mix(1.0, 0.5, d), 0.045 + aRand.w * 0.25, f);
    gl_PointSize = max(1.0, uSize * size / -mv.z);

    vec3 cCore = vec3(1.0, 0.86, 1.0);
    vec3 cViolet = vec3(0.56, 0.36, 0.99);
    vec3 cBlue = vec3(0.25, 0.52, 0.98);
    vec3 cCyan = vec3(0.2, 0.85, 0.95);
    float rn = clamp(r / uGalR, 0.0, 1.0);
    vec3 gc = mix(cCore, cViolet, smoothstep(0.0, 0.22, rn));
    gc = mix(gc, cBlue, smoothstep(0.35, 0.85, rn));
    gc = mix(gc, cCyan, step(0.94, aRand.z));
    float tx = clamp(aText.x / 10.0 + 0.5, 0.0, 1.0);
    vec3 tc = mix(cViolet, cBlue, smoothstep(0.1, 0.9, tx));
    tc = mix(tc, vec3(0.88, 0.92, 1.0), step(0.86, aRand.x));
    vColor = mix(gc, tc, f);
    // energised particles burn white-cyan
    vColor = mix(vColor, vec3(0.75, 0.95, 1.0), clamp(glow, 0.0, 1.0) * 0.8);

    float twinkle = 0.7 + 0.3 * sin(uTime * 2.0 + aRand.x * 40.0);
    // the dense galaxy core and the packed letters would saturate under additive blending
    float coreDim = mix(0.35, 1.0, smoothstep(0.0, 0.3, rn));
    vAlpha = uAlpha * mix(twinkle * coreDim, 0.42, f) * (1.0 + glow * 1.4) * (1.0 - smoothstep(0.55, 1.0, uExit));
    gl_PointSize *= 1.0 + glow * 0.6;
  }
`;

const fragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a = a * a;
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

export class ParticleName {
  readonly points: THREE.Points;
  readonly material: THREE.ShaderMaterial;
  private geo: THREE.BufferGeometry;
  private count: number;
  private lines: string[] = [];

  constructor(private ctx: Ctx, count: number, seed = 7) {
    this.count = count;
    const rnd = seeded(seed);
    const GAL_R = 9;
    const gal = new Float32Array(count * 3);
    const scatter = new Float32Array(count * 3);
    const rand = new Float32Array(count * 4);
    const arms = 4;

    for (let i = 0; i < count; i++) {
      const r = Math.pow(rnd(), 1.5) * GAL_R + 0.15;
      const arm = (i % arms) / arms;
      const spin = r * 0.75;
      const spread = Math.pow(rnd(), 2.5) * (0.35 + r * 0.16);
      const ang = arm * Math.PI * 2 + spin + (rnd() - 0.5) * spread;
      const rr = r + (rnd() - 0.5) * spread * 1.5;
      gal[i * 3] = rr;
      gal[i * 3 + 1] = ang;
      gal[i * 3 + 2] = (rnd() - 0.5) * (0.55 * Math.exp(-r * 0.35) + 0.08);

      // scatter: shell around the scene
      const u = rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const sr = 5 + Math.pow(rnd(), 0.7) * 16;
      const sq = Math.sqrt(1 - u * u);
      scatter[i * 3] = Math.cos(th) * sq * sr * 1.4;
      scatter[i * 3 + 1] = u * sr * 0.7;
      scatter[i * 3 + 2] = Math.sin(th) * sq * sr - 4;

      rand[i * 4] = rnd();
      rand[i * 4 + 1] = rnd();
      rand[i * 4 + 2] = rnd();
      rand[i * 4 + 3] = 0.04 + Math.pow(rnd(), 3) * 0.14;
    }

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    this.geo.setAttribute("aGal", new THREE.BufferAttribute(gal, 3));
    this.geo.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
    this.geo.setAttribute("aText", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    this.geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));
    this.geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);

    this.material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uRot: { value: 0 },
        uDisperse: { value: 0 },
        uForm: { value: 0 },
        uExit: { value: 0 },
        uAlpha: { value: 1 },
        uSize: { value: 300 },
        uGalR: { value: GAL_R },
        uMouse: { value: new THREE.Vector3(99, 99, 0) },
        uHover: { value: 0 },
        uShockPos: { value: new THREE.Vector3() },
        uShockT: { value: 99 },
        uShockAmp: { value: 0 },
        uCarve: { value: -1000 },
        uCarveMode: { value: 0 },
      },
    });
    this.points = new THREE.Points(this.geo, this.material);
    this.points.frustumCulled = false;
  }

  /* ---------- interaction: cursor field + press shockwave ---------- */
  /** world-space bounds of the formed name (z = 0 plane) */
  readonly bounds = new THREE.Box2();
  private hover = 0;
  private hoverTarget = 0;
  private mouseTarget = new THREE.Vector3(99, 99, 0);
  private shockT = 99;
  private ray = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private hit = new THREE.Vector3();

  /** Feed the pointer (NDC). Returns true while it is over the name. */
  pointer(ndc: THREE.Vector2 | null, enabled: boolean) {
    if (!ndc || !enabled) {
      this.hoverTarget = 0;
      return false;
    }
    this.ray.setFromCamera(ndc, this.ctx.camera);
    if (!this.ray.ray.intersectPlane(this.plane, this.hit)) {
      this.hoverTarget = 0;
      return false;
    }
    const m = 0.45;
    const b = this.bounds;
    const inside = this.hit.x > b.min.x - m && this.hit.x < b.max.x + m && this.hit.y > b.min.y - m && this.hit.y < b.max.y + m;
    if (this.hover < 0.02) this.material.uniforms.uMouse.value.copy(this.hit);
    this.mouseTarget.copy(this.hit);
    this.hoverTarget = inside ? 1 : 0;
    return inside;
  }

  /** Detonate a shockwave at the current pointer position. */
  shock() {
    this.material.uniforms.uShockPos.value.copy(this.mouseTarget);
    this.shockT = 0;
  }

  tick(dt: number) {
    const u = this.material.uniforms;
    this.hover += (this.hoverTarget - this.hover) * (1 - Math.exp(-6 * dt));
    (u.uMouse.value as THREE.Vector3).lerp(this.mouseTarget, 1 - Math.exp(-12 * dt));
    u.uHover.value = this.hover;
    this.shockT += dt;
    u.uShockT.value = this.shockT;
    u.uShockAmp.value = this.shockT < 5 ? 1 : 0;
  }

  /** Sample the name into particle target positions, sized to fit the view. */
  setText(lines: string[], worldWidth: number, centerY: number) {
    this.lines = lines;
    const W = 2048;
    // fit the (wide) display font inside the sampling canvas
    const probe = document.createElement("canvas").getContext("2d")!;
    let fontPx = lines.length > 1 ? 300 : 260;
    probe.font = `800 ${fontPx}px ${DISPLAY_FONT}`;
    const widest = Math.max(...lines.map((l) => probe.measureText(l).width)) * 1.04;
    if (widest > W * 0.92) fontPx = Math.floor((fontPx * W * 0.92) / widest);
    const lineH = fontPx * 1.05;
    const H = Math.ceil(lineH * lines.length + 80);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d", { willReadFrequently: true })!;
    g.fillStyle = "#fff";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `800 ${fontPx}px ${DISPLAY_FONT}`;
    if ("letterSpacing" in g) (g as any).letterSpacing = `${fontPx * 0.02}px`;
    lines.forEach((l, i) => g.fillText(l, W / 2, 40 + lineH * (i + 0.5)));

    const data = g.getImageData(0, 0, W, H).data;
    // find the ink bounds
    let minX = W, maxX = 0, minY = H, maxY = 0;
    const pts: number[] = [];
    const step = 3;
    for (let y = 0; y < H; y += step)
      for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 140) {
          pts.push(x, y);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    const inkW = Math.max(1, maxX - minX);
    const scale = worldWidth / inkW;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const n = pts.length / 2;
    this.bounds.min.set((minX - cx) * scale, -(maxY - cy) * scale + centerY);
    this.bounds.max.set((maxX - cx) * scale, -(minY - cy) * scale + centerY);
    const attr = this.geo.getAttribute("aText") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const rnd = seeded(99);
    for (let i = 0; i < this.count; i++) {
      // With more particles than pixels, every pixel gets one and extras land randomly.
      // With fewer (phones), sample evenly across all pixels so every letter is covered.
      const k = this.count >= n ? (i < n ? i : Math.floor(rnd() * n)) : Math.min(n - 1, Math.floor(((i + rnd()) * n) / this.count));
      const px = pts[k * 2] + (rnd() - 0.5) * step;
      const py = pts[k * 2 + 1] + (rnd() - 0.5) * step;
      arr[i * 3] = (px - cx) * scale;
      arr[i * 3 + 1] = -(py - cy) * scale + centerY;
      arr[i * 3 + 2] = (rnd() - 0.5) * 0.12;
    }
    attr.needsUpdate = true;
  }

  get textLines() {
    return this.lines;
  }

  setPixelScale() {
    const { renderer, camera, height } = this.ctx;
    const proj = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    this.material.uniforms.uSize.value = proj * renderer.getPixelRatio();
  }
}

/** Distant starfield used as a backdrop in several scenes. */
export function createStars(count: number, radius: number, seed = 3, size = 1.6) {
  const rnd = seeded(seed);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const palette = [new THREE.Color("#ffffff"), new THREE.Color("#a5b4fc"), new THREE.Color("#c4b5fd"), new THREE.Color("#67e8f9")];
  for (let i = 0; i < count; i++) {
    const u = rnd() * 2 - 1;
    const th = rnd() * Math.PI * 2;
    const r = radius * (0.6 + rnd() * 0.4);
    const sq = Math.sqrt(1 - u * u);
    pos[i * 3] = Math.cos(th) * sq * r;
    pos[i * 3 + 1] = u * r;
    pos[i * 3 + 2] = Math.sin(th) * sq * r;
    const c = palette[Math.floor(rnd() * palette.length)];
    const b = 0.35 + rnd() * 0.65;
    col[i * 3] = c.r * b;
    col[i * 3 + 1] = c.g * b;
    col[i * 3 + 2] = c.b * b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}
