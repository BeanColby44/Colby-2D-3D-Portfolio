import * as THREE from "three";
import { Ctx, Stage, easeInOut, lerp, range } from "../engine/stage";
import { DragSpin } from "../engine/pokes";
import { glowTexture, labelTexture } from "../engine/textures";
import { createStars } from "./particles";

const R = 3.2;

function latLon(lat: number, lon: number, r = R) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const th = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}

interface Marker { pin: THREE.Mesh; ring: THREE.Mesh; label: THREE.Sprite; pos: THREE.Vector3; home: boolean; aspect: number }

/** Section 09: a point-cloud globe with arcs from home to every place the work reaches. Drag to spin. */
export class ImpactStage extends Stage {
  private globe = new THREE.Group();
  private arcs: { curve: THREE.QuadraticBezierCurve3; line: THREE.Line; dot: THREE.Mesh; off: number }[] = [];
  private markers: Marker[] = [];
  selected = -1;
  private selT = 0;

  constructor(ctx: Ctx, places: { name: string; lat: number; lon: number; home?: boolean }[]) {
    super(ctx);
    this.bloom = 0.6;
    this.scene.fog = new THREE.FogExp2(0x02030b, 0.02);
    this.scene.add(this.globe);

    // fibonacci-sphere dots
    const n = ctx.quality === "high" ? 4200 : 2200;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = g * i;
      pos.set([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R], i * 3);
      const k = 0.35 + 0.65 * Math.abs(Math.sin(th * 3 + y * 5));
      col.set([0.35 * k, 0.55 * k, 1.3 * k], i * 3);
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    dg.setAttribute("color", new THREE.BufferAttribute(col, 3));
    this.globe.add(new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, depthWrite: false })));

    // dark core + rim glow
    this.globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 64, 48), new THREE.MeshBasicMaterial({ color: 0x050616 })));
    const rim = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.12, 64, 48),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }",
        fragmentShader: "varying vec3 vN; varying vec3 vV; void main(){ float f = pow(clamp(0.75 - dot(vN, vV), 0.0, 1.0), 3.0); gl_FragColor = vec4(vec3(0.3,0.7,1.6) * f * 0.45, f * 0.6); }",
      })
    );
    this.scene.add(rim);
    // orbit rings
    [1.35, 1.6].forEach((k, i) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(R * k, 0.008, 6, 200), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 0.5, 1.8), transparent: true, opacity: 0.5 }));
      m.rotation.set(Math.PI / 2 + (i ? 0.4 : -0.25), 0, i * 0.6);
      this.scene.add(m);
    });

    // markers + arcs
    const home = places.find((p) => p.home) ?? places[0];
    const homePos = latLon(home.lat, home.lon);
    const glow = glowTexture("rgba(255,255,255,1)", "rgba(80,200,255,.4)");
    places.forEach((pl) => {
      const p = latLon(pl.lat, pl.lon, R * 1.01);
      const pin = new THREE.Mesh(new THREE.SphereGeometry(pl.home ? 0.09 : 0.07, 16, 12), new THREE.MeshBasicMaterial({ color: pl.home ? new THREE.Color(2.4, 1.4, 2.6) : new THREE.Color(0.6, 2.0, 2.8) }));
      pin.position.copy(p);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.15, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 1.8, 2.6), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      ring.position.copy(p);
      ring.lookAt(p.clone().multiplyScalar(2));
      const { texture, aspect } = labelTexture([{ text: pl.name, size: 44, color: "#e0f2fe", weight: 600 }], { width: 900, align: "center" });
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 }));
      label.scale.set(1.5, 1.5 / aspect, 1);
      label.position.copy(p.clone().multiplyScalar(1.18));
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7 }));
      halo.scale.setScalar(0.5);
      halo.position.copy(p);
      this.globe.add(pin, ring, label, halo);
      const idx = this.markers.length;
      this.markers.push({ pin, ring, label, pos: p, home: !!pl.home, aspect });
      this.pokes.add(pin, { hit: [pin, halo], spin: 0, bounce: 2.2, onPress: () => { this.selected = idx; this.selT = 0; } });

      if (!pl.home) {
        const mid = homePos.clone().add(p).multiplyScalar(0.5);
        const lift = 1 + homePos.distanceTo(p) * 0.18;
        mid.normalize().multiplyScalar(R * lift);
        const curve = new THREE.QuadraticBezierCurve3(homePos.clone().multiplyScalar(1.01), mid, p);
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(80)),
          new THREE.LineBasicMaterial({ color: new THREE.Color(0.9, 0.5, 2.2), transparent: true, opacity: 0.6 })
        );
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.6, 3) }));
        this.globe.add(line, dot);
        this.arcs.push({ curve, line, dot, off: Math.random() });
      }
    });

    this.scene.add(createStars(2400, 140, 99, 1.4));
    this.rotor = new DragSpin(this.globe, 0.6);
    // pressing the globe itself spins it
    const hit = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 16), new THREE.MeshBasicMaterial({ visible: false }));
    this.globe.add(hit);
    this.pokes.add(this.globe, { hit: [hit], spin: 0.9, bounce: 0.5 });
  }

  update(p: number, dt: number) {
    const t = this.ctx.time;
    const draw = easeInOut(range(p, 0.1, 0.45));
    this.selT += dt;
    // auto-rotation; the home marker faces the camera early on
    this.globe.rotation.y = -1.2 + p * 2.4 + t * 0.05;
    this.globe.rotation.x = 0.35;
    this.arcs.forEach((a) => {
      const pts = Math.max(2, Math.floor(80 * draw));
      a.line.geometry.setDrawRange(0, pts);
      const u = (t * 0.35 + a.off) % 1;
      a.dot.position.copy(a.curve.getPoint(u * draw));
      a.dot.visible = draw > 0.05;
    });
    this.markers.forEach((m, i) => {
      const pulse = (t * 0.8 + i * 0.17) % 1;
      m.ring.scale.setScalar(1 + pulse * 2.5);
      (m.ring.material as THREE.MeshBasicMaterial).opacity = (1 - pulse) * draw;
      const sel = i === this.selected && this.selT < 4 ? 1 : 0;
      (m.label.material as THREE.SpriteMaterial).opacity = Math.max(draw * (m.home ? 0.95 : 0.6), sel);
      m.label.scale.set(2.8 * (1 + sel * 0.3), (2.8 / m.aspect) * (1 + sel * 0.3), 1);
    });

    const shift = this.ctx.aspect > 1 ? -3.3 : 0;
    const k = easeInOut(range(p, 0, 0.2));
    this.aim(new THREE.Vector3(shift * 0.2, lerp(3, 1.2, k), lerp(21, 14.5, k)), new THREE.Vector3(shift, 0, 0), 0.5);
  }
}
