import * as THREE from "three";
import { Ctx, Stage, damp, easeInOut, lerp, range, viewSize } from "../engine/stage";
import { glowTexture } from "../engine/textures";
import { ParticleName, createStars } from "./particles";

const NAME_DIST = 14;

function nameLayout(ctx: Ctx, name: string) {
  const { w, h } = viewSize(ctx.camera, NAME_DIST);
  const narrow = ctx.aspect < 0.85;
  const lines = narrow ? name.split(" ") : [name];
  const width = narrow ? w * 0.82 : Math.min(w * 0.78, 17);
  // Name sits slightly above the centre so the DOM tagline fits underneath.
  return { lines, width, y: h * (narrow ? 0.1 : 0.08) };
}

/**
 * Scene 1: loader galaxy → disperse → particle name → tagline.
 * The loader timeline values live in `state` and are driven by main.ts (GSAP).
 */
export class IntroStage extends Stage {
  readonly field: ParticleName;
  private core: THREE.Sprite;
  private stars: THREE.Points;
  readonly state = { spin: 0.18, hold: 0, disperse: 0, form: 0, view: 0, core: 1, progress: 0, collapse: 0 };
  private rig = new THREE.Group();
  private arcs: THREE.Mesh[] = [];
  private wire: THREE.LineSegments;
  private wireCount: number;
  private streams: THREE.Points;
  private streamSeeds: Float32Array;
  private rot = 0;
  private camPos = new THREE.Vector3();
  private camTarget = new THREE.Vector3();

  constructor(ctx: Ctx, private name: string) {
    super(ctx);
    this.bloom = 0.75;
    this.scene.fog = new THREE.FogExp2(0x03030a, 0.012);
    this.field = new ParticleName(ctx, ctx.quality === "high" ? 16000 : 7000);
    this.scene.add(this.field.points);

    this.core = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture("rgba(255,240,255,1)", "rgba(150,110,255,0.45)"),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      })
    );
    this.core.scale.setScalar(5);
    this.scene.add(this.core);

    this.stars = createStars(ctx.quality === "high" ? 2500 : 1200, 120, 11);
    this.scene.add(this.stars);

    // ---- 3D loading rig: arc rings that fill with progress, an assembling core, inbound data streams ----
    this.scene.add(this.rig);
    const arcColors = [new THREE.Color(0.35, 1.4, 2.6), new THREE.Color(1.3, 0.55, 2.4), new THREE.Color(0.45, 0.75, 2.6)];
    [2.4, 3.1, 3.8].forEach((r, i) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(r, i === 1 ? 0.03 : 0.018, 8, 260),
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: { uFill: { value: 0 }, uColor: { value: arcColors[i] }, uAlpha: { value: 1 }, uTime: { value: 0 } },
          vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
          fragmentShader: /* glsl */ `
            uniform float uFill, uAlpha, uTime; uniform vec3 uColor; varying vec2 vUv;
            void main() {
              float lit = step(vUv.x, uFill);
              float head = smoothstep(0.03, 0.0, abs(vUv.x - uFill)) * step(0.001, uFill);
              float dash = step(0.5, fract(vUv.x * 120.0 - uTime * 0.5));
              vec3 col = uColor * (lit * 1.0 + head * 2.5) + uColor * 0.12 * dash * (1.0 - lit);
              gl_FragColor = vec4(col, (lit * 0.9 + head + 0.25 * dash * (1.0 - lit)) * uAlpha);
            }`,
        })
      );
      m.rotation.set(Math.PI / 2 + (i - 1) * 0.5, i * 0.7, 0);
      this.arcs.push(m);
      this.rig.add(m);
    });
    const wgeo = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.25, 1));
    this.wireCount = wgeo.getAttribute("position").count;
    this.wire = new THREE.LineSegments(wgeo, new THREE.LineBasicMaterial({ color: new THREE.Color(0.6, 0.8, 2.4), transparent: true }));
    this.rig.add(this.wire);

    const sn = ctx.quality === "high" ? 700 : 300;
    this.streamSeeds = new Float32Array(sn * 4);
    for (let i = 0; i < sn; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1);
      this.streamSeeds.set([Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th), Math.random()], i * 4);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(sn * 3), 3));
    this.streams = new THREE.Points(
      sg,
      new THREE.PointsMaterial({ size: 0.07, color: new THREE.Color(0.7, 1.3, 2.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.streams.frustumCulled = false;
    this.rig.add(this.streams);
    this.resize();
  }

  private streamT = 0;
  private updateRig(dt: number) {
    const s = this.state;
    const t = this.ctx.time;
    const show = 1 - s.collapse;
    this.rig.visible = show > 0.001;
    if (!this.rig.visible) return;
    this.rig.scale.setScalar(Math.max(0.001, show * (1 + s.hold * 0.12)));
    this.rig.rotation.y += dt * (0.2 + s.hold * 1.5);
    this.arcs.forEach((m, i) => {
      const mat = m.material as THREE.ShaderMaterial;
      // each ring fills over its own slice of the load, so they complete in sequence
      const f = Math.min(1, Math.max(0, s.progress * 1.25 - i * 0.12));
      mat.uniforms.uFill.value = f;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uAlpha.value = show;
      m.rotation.z += dt * (0.3 + s.hold * 2.5) * (i % 2 ? -1 : 1);
    });
    // wireframe core assembles edge by edge
    this.wire.geometry.setDrawRange(0, Math.floor(this.wireCount * Math.min(1, s.progress * 1.1) / 2) * 2);
    this.wire.rotation.set(t * 0.4, t * 0.6, 0);
    const wm = this.wire.material as THREE.LineBasicMaterial;
    wm.opacity = show;
    const k = 0.8 + s.hold * 1.4;
    wm.color.setRGB(0.6 * k, 0.8 * k, 2.4 * k);
    // data streams pulled toward the core
    this.streamT += dt * (0.25 + s.hold * 1.6);
    const attr = this.streams.geometry.getAttribute("position") as THREE.BufferAttribute;
    const sd = this.streamSeeds;
    for (let i = 0; i < attr.count; i++) {
      const life = (sd[i * 4 + 3] + this.streamT) % 1;
      const r = 1.3 + (1 - life) * 9;
      attr.setXYZ(i, sd[i * 4] * r, sd[i * 4 + 1] * r * 0.5, sd[i * 4 + 2] * r);
    }
    attr.needsUpdate = true;
    (this.streams.material as THREE.PointsMaterial).opacity = show * (0.5 + s.hold * 0.5);
  }

  resize() {
    const l = nameLayout(this.ctx, this.name);
    this.field.setText(l.lines, l.width, l.y);
    this.field.setPixelScale();
  }

  update(p: number, dt: number) {
    const s = this.state;
    const u = this.field.material.uniforms;
    this.updateRig(dt);
    this.field.tick(dt);
    this.rot += dt * (s.spin + s.hold * 2.2);
    u.uTime.value = this.ctx.time;
    u.uRot.value = this.rot;
    u.uDisperse.value = s.disperse;
    u.uForm.value = s.form;

    // Scroll exit: name breaks apart and streams past the camera.
    const exit = easeInOut(range(p, 0.18, 1));
    u.uExit.value = exit;

    const coreA = s.core * (1 - s.disperse);
    (this.core.material as THREE.SpriteMaterial).opacity = coreA * (0.35 + s.hold * 0.3);
    this.core.scale.setScalar(3 + s.hold * 2.5 + Math.sin(this.ctx.time * 2) * 0.15);
    this.stars.rotation.y = this.ctx.time * 0.004;

    // Camera: tilted galaxy overview → front view of the name → dolly forward on exit.
    const v = easeInOut(s.view);
    const loaderDist = lerp(17, 12.5, s.hold);
    this.camPos.set(0, lerp(7.2, 0, v) * (loaderDist / 17), lerp(loaderDist, NAME_DIST, v) - exit * 9);
    this.camTarget.set(0, lerp(-0.4, 0.4, v), 0);
    this.aim(this.camPos, this.camTarget, lerp(0.15, 0.6, v));
    this.exposure = 1;
  }
}

/** Scene 10: particles regather into the name for the final hold. */
export class OutroStage extends Stage {
  readonly field: ParticleName;
  private stars: THREE.Points;
  private formed = 0;

  constructor(ctx: Ctx, private name: string) {
    super(ctx);
    this.bloom = 0.75;
    this.field = new ParticleName(ctx, ctx.quality === "high" ? 12000 : 6000, 21);
    this.field.material.uniforms.uDisperse.value = 1;
    this.scene.add(this.field.points);
    this.stars = createStars(ctx.quality === "high" ? 2000 : 900, 120, 5);
    this.scene.add(this.stars);
    this.resize();
  }

  resize() {
    const l = nameLayout(this.ctx, this.name);
    this.field.setText(l.lines, l.width, l.y);
    this.field.setPixelScale();
  }

  update(p: number, dt: number) {
    const u = this.field.material.uniforms;
    u.uTime.value = this.ctx.time;
    this.field.tick(dt);
    this.formed = damp(this.formed, range(p, 0.1, 0.6), 4, dt);
    u.uForm.value = this.formed;
    u.uAlpha.value = range(p, 0, 0.12);
    u.uExit.value = 0;
    this.stars.rotation.y = -this.ctx.time * 0.003;
    this.aim(new THREE.Vector3(0, 0, lerp(17, NAME_DIST, easeInOut(range(p, 0, 0.7)))), new THREE.Vector3(0, 0.4, 0), 0.5);
  }
}

