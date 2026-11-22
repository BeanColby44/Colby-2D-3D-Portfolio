import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { Ctx, Stage, damp, easeInOut, lerp, range, smooth } from "../engine/stage";
import { beamTexture, glowTexture, labelTexture, placeholderScreen, BODY_FONT } from "../engine/textures";
import { CATEGORIES, type Project } from "../data";

const HALL_W = 11;
const HALL_H = 6.4;
const SPACING = 7.5;
const FIRST_Z = -6;
const FRAME_W = 4.6;
const FRAME_H = FRAME_W / (16 / 9);
const FRAME_Y = 2.35;
const EYE = 1.85;

const CAT_COLOR: Record<string, THREE.Color> = {
  platform: new THREE.Color(0.35, 1.5, 2.6),
  mobile: new THREE.Color(1.3, 0.55, 2.6),
  shopify: new THREE.Color(2.2, 0.5, 1.7),
  wordpress: new THREE.Color(0.5, 0.8, 2.6),
};

interface Exhibit {
  group: THREE.Group;
  screen: THREE.Mesh;
  border: THREE.LineSegments;
  cone: THREE.Mesh;
  pool: THREE.Mesh;
  fixture: THREE.Mesh;
  side: number;
  z: number;
  focus: number;
  color: THREE.Color;
}

/**
 * Scene 7: an exhibition corridor. Projects hang on alternating walls in their existing order.
 * Camera path: entrance → each exhibit (with a reading pause) → exit doorway.
 */
export class GalleryStage extends Stage {
  readonly exhibits: Exhibit[] = [];
  private path: THREE.CatmullRomCurve3;
  private looks: THREE.Vector3[] = [];
  private camPos = new THREE.Vector3(0, EYE, 10);
  private camLook = new THREE.Vector3(0, EYE, -20);
  private spot: THREE.SpotLight;
  private exitGlow: THREE.Sprite;
  private hallLen: number;
  private raycaster = new THREE.Raycaster();
  /** -1 while travelling / at entrance or exit */
  active = -1;
  /** exhibit under the pointer (-1 = none) */
  hovered = -1;
  /** exhibit the camera is zoomed into (-1 = none) */
  zoom = -1;
  private zoomK = 0;
  private zoomIdx = 0;
  /** continuous position along the exhibit sequence */
  position = 0;
  /** white flash at the entrance (coming out of the portal) */
  flash = 0;
  private started = false;

  constructor(ctx: Ctx, projects: Project[], private loader: THREE.TextureLoader, onTexture: () => void) {
    super(ctx);
    this.bloom = 0.75;
    this.bloomThreshold = 0.92;
    this.exposure = 1.05;
    this.scene.fog = new THREE.FogExp2(0x050510, 0.022);

    const n = projects.length;
    const lastZ = FIRST_Z - (n - 1) * SPACING;
    this.hallLen = -lastZ + 26;
    const zCenter = (10 + lastZ - 16) / 2;

    // ---------- architecture ----------
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0d0d18, roughness: 0.82, metalness: 0.15 });
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x07070f, roughness: 0.9 });
    for (const s of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(this.hallLen, HALL_H), wallMat);
      wall.rotation.y = s === -1 ? Math.PI / 2 : -Math.PI / 2;
      wall.position.set((s * HALL_W) / 2, HALL_H / 2, zCenter);
      this.scene.add(wall);
      // baseboard light strip
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.04, this.hallLen),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.35, 1.6) })
      );
      strip.position.set(s * (HALL_W / 2 - 0.05), 0.08, zCenter);
      this.scene.add(strip);
    }
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, this.hallLen), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, HALL_H, zCenter);
    this.scene.add(ceil);
    // ceiling light strips
    for (const x of [-2.2, 2.2]) {
      const s = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.03, this.hallLen),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 1.2, 1.8) })
      );
      s.position.set(x, HALL_H - 0.02, zCenter);
      this.scene.add(s);
    }
    // pilasters + ceiling beams between exhibits
    const pilGeo = new THREE.BoxGeometry(0.5, HALL_H, 0.5);
    const beamGeo = new THREE.BoxGeometry(HALL_W, 0.35, 0.4);
    const pilMat = new THREE.MeshStandardMaterial({ color: 0x14142a, roughness: 0.55, metalness: 0.4 });
    const lineMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.9, 2.0) });
    const lineGeo = new THREE.BoxGeometry(0.03, HALL_H * 0.92, 0.03);
    // halfway between consecutive exhibits, so pilasters never cross a frame
    for (let z = FIRST_Z + SPACING * 1.5; z > lastZ - 14; z -= SPACING) {
      for (const s of [-1, 1]) {
        const p = new THREE.Mesh(pilGeo, pilMat);
        p.position.set(s * (HALL_W / 2 - 0.25), HALL_H / 2, z);
        const l = new THREE.Mesh(lineGeo, lineMat);
        l.position.set(s * (HALL_W / 2 - 0.52), HALL_H / 2, z);
        this.scene.add(p, l);
      }
      const b = new THREE.Mesh(beamGeo, pilMat);
      b.position.set(0, HALL_H - 0.18, z);
      this.scene.add(b);
    }

    // reflective floor
    if (ctx.quality === "high") {
      const mirror = new Reflector(new THREE.PlaneGeometry(HALL_W, this.hallLen), {
        clipBias: 0.003,
        textureWidth: Math.floor(window.innerWidth * 0.6),
        textureHeight: Math.floor(window.innerHeight * 0.6),
        color: 0x8a8aa0,
      });
      mirror.rotation.x = -Math.PI / 2;
      mirror.position.set(0, 0, zCenter);
      this.scene.add(mirror);
      // dark glossy veil above the mirror to dim reflections
      const veil = new THREE.Mesh(
        new THREE.PlaneGeometry(HALL_W, this.hallLen),
        new THREE.MeshStandardMaterial({ color: 0x05050c, roughness: 0.3, metalness: 0.2, transparent: true, opacity: 0.72 })
      );
      veil.rotation.x = -Math.PI / 2;
      veil.position.set(0, 0.004, zCenter);
      this.scene.add(veil);
    } else {
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(HALL_W, this.hallLen),
        new THREE.MeshStandardMaterial({ color: 0x08080f, roughness: 0.25, metalness: 0.7 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, 0, zCenter);
      this.scene.add(floor);
    }
    // floor runner lights
    for (const x of [-1.6, 1.6]) {
      const r = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.01, this.hallLen),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 0.5, 1.4) })
      );
      r.position.set(x, 0.01, zCenter);
      this.scene.add(r);
    }

    // end wall with exit doorway
    const endZ = lastZ - 16;
    const endWall = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, HALL_H), wallMat);
    endWall.position.set(0, HALL_H / 2, endZ);
    this.scene.add(endWall);
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 4.2),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, 2.7, 3.2) })
    );
    door.position.set(0, 2.1, endZ + 0.02);
    this.scene.add(door);
    this.exitGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture("rgba(210,225,255,0.9)", "rgba(90,120,255,0.3)"),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      })
    );
    this.exitGlow.position.set(0, 2.1, endZ + 0.3);
    this.exitGlow.scale.set(9, 9, 1);
    this.scene.add(this.exitGlow);

    // ---------- lighting ----------
    this.scene.add(new THREE.AmbientLight(0x404070, 0.6));
    this.scene.add(new THREE.HemisphereLight(0x6b7bff, 0x0a0614, 0.5));
    this.spot = new THREE.SpotLight(0xdfe6ff, 0, 18, 0.55, 0.6, 1.2);
    this.scene.add(this.spot, this.spot.target);

    // ---------- exhibits ----------
    const frameGeo = new THREE.BoxGeometry(FRAME_W + 0.36, FRAME_H + 0.36, 0.16);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x15151f, metalness: 0.75, roughness: 0.3 });
    const screenGeo = new THREE.PlaneGeometry(FRAME_W, FRAME_H);
    const coneTex = beamTexture();
    const poolTex = glowTexture("rgba(200,210,255,0.55)", "rgba(120,110,255,0.15)");
    const borderPts = (w: number, h: number) => {
      const a = [[-w, -h], [w, -h], [w, h], [-w, h]];
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < 4; i++) {
        pts.push(new THREE.Vector3(a[i][0], a[i][1], 0), new THREE.Vector3(a[(i + 1) % 4][0], a[(i + 1) % 4][1], 0));
      }
      return pts;
    };

    projects.forEach((proj, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const z = FIRST_Z - i * SPACING;
      const color = CAT_COLOR[proj.cat] ?? CAT_COLOR.platform;
      const group = new THREE.Group();
      group.position.set(side * (HALL_W / 2 - 0.1), FRAME_Y, z);
      group.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;

      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.z = 0.08;
      const screenMat = new THREE.MeshBasicMaterial({ map: placeholderScreen(proj.name, CATEGORIES[proj.cat]), toneMapped: false });
      screenMat.color.setScalar(0.85);
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.z = 0.17;
      this.loader.load(
        `projects/${proj.slug}/frame.jpg`,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          screenMat.map = tex;
          screenMat.needsUpdate = true;
          onTexture();
        },
        undefined,
        () => onTexture() // missing screenshot → keep placeholder art
      );

      const border = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(borderPts(FRAME_W / 2 + 0.2, FRAME_H / 2 + 0.2)),
        new THREE.LineBasicMaterial({ color: color.clone() })
      );
      border.position.z = 0.17;

      const { texture, aspect } = labelTexture(
        [
          { text: `${String(i + 1).padStart(2, "0")} — ${proj.name}`, size: 56, color: "#ffffff", weight: 700 },
          { text: proj.sub, size: 34, color: "#aab4e8", weight: 500, font: BODY_FONT },
        ],
        { width: 1400 }
      );
      const plateW = FRAME_W;
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(plateW, plateW / aspect),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(0.8, 0.8, 0.8) })
      );
      plate.position.set(0, -FRAME_H / 2 - 0.25 - plateW / aspect / 2, 0.05);

      // light fixture, light cone, floor pool
      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.08, 0.3),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 2.1, 2.6) })
      );
      fixture.position.set(0, HALL_H - FRAME_Y - 0.5, 0.9);
      const cone = new THREE.Mesh(
        new THREE.PlaneGeometry(FRAME_W * 1.3, HALL_H - 0.5),
        new THREE.MeshBasicMaterial({
          map: coneTex,
          color: new THREE.Color(0.75, 0.8, 1.2),
          transparent: true,
          opacity: 0.12,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      cone.position.set(0, (HALL_H - 0.5) / 2 - FRAME_Y, 0.75);
      cone.rotation.x = -0.12;
      group.add(frame, screen, border, plate, fixture, cone);
      this.scene.add(group);

      const pool = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 3.4),
        new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(side * (HALL_W / 2 - 1.6), 0.02, z);
      this.scene.add(pool);

      this.exhibits.push({ group, screen, border, cone, pool, fixture, side, z, focus: 0, color });
    });

    // ---------- camera path ----------
    const narrow = ctx.aspect < 0.9;
    const keys: THREE.Vector3[] = [new THREE.Vector3(0, EYE, 12)];
    this.looks.push(new THREE.Vector3(0, EYE, -30));
    this.exhibits.forEach((ex) => {
      const s = ex.side;
      // stand on the opposite half of the hall, slightly ahead of the frame, angled toward it
      keys.push(new THREE.Vector3(narrow ? s * 0.6 : -s * 0.3, EYE, ex.z + (narrow ? 2.6 : 3.4)));
      // aiming slightly further down the hall pushes the frame to its own side of the screen,
      // leaving the other side free for the project details card
      this.looks.push(new THREE.Vector3(s * (HALL_W / 2), FRAME_Y - (narrow ? 0.6 : 0.15), ex.z - (narrow ? 0 : 1.7)));
    });
    keys.push(new THREE.Vector3(0, EYE, lastZ - 6));
    this.looks.push(new THREE.Vector3(0, EYE, endZ));
    this.path = new THREE.CatmullRomCurve3(keys, false, "centripetal", 0.5);
  }

  get stops() {
    return this.looks.length; // entrance + exhibits + exit
  }

  /** Path parameter t in [0, stops-1] for scroll progress p, with reading pauses at each stop. */
  private param(p: number) {
    const segs = this.stops - 1;
    const u = range(p, 0.02, 0.98) * segs;
    const i = Math.min(Math.floor(u), segs - 1);
    const f = u - i;
    return i + smooth(range(f, 0.5, 1));
  }

  /** Scroll progress at which exhibit i is centred and readable. */
  progressFor(i: number) {
    const segs = this.stops - 1;
    return 0.02 + ((i + 1 + 0.25) / segs) * 0.96;
  }

  pick(ndc: THREE.Vector2) {
    this.raycaster.setFromCamera(ndc, this.ctx.camera);
    const hits = this.raycaster.intersectObjects(this.exhibits.map((e) => e.screen), false);
    if (!hits.length) return -1;
    return this.exhibits.findIndex((e) => e.screen === hits[0].object);
  }

  activate() {
    this.started = false;
  }

  update(p: number, dt: number) {
    const t = this.ctx.time;
    const segs = this.stops - 1;
    const tp = this.param(p);
    this.position = tp;
    const nearest = Math.round(tp);
    const settled = Math.abs(tp - nearest) < 0.02;
    this.active = settled && nearest >= 1 && nearest <= this.exhibits.length ? nearest - 1 : -1;

    const pos = this.path.getPoint(Math.min(tp / segs, 1));
    const i0 = Math.floor(tp), i1 = Math.min(i0 + 1, segs);
    const f = tp - i0;
    const look = this.looks[i0].clone().lerp(this.looks[i1], easeInOut(f));

    // damped camera so turns stay smooth even when scrolling fast
    const lambda = this.started ? 5 : 1000;
    this.started = true;
    this.camPos.x = damp(this.camPos.x, pos.x, lambda, dt);
    this.camPos.y = damp(this.camPos.y, pos.y, lambda, dt);
    this.camPos.z = damp(this.camPos.z, pos.z, lambda, dt);
    this.camLook.x = damp(this.camLook.x, look.x, lambda * 0.8, dt);
    this.camLook.y = damp(this.camLook.y, look.y, lambda * 0.8, dt);
    this.camLook.z = damp(this.camLook.z, look.z, lambda * 0.8, dt);
    // zoom: fly straight up to a frame, then return to the corridor path
    this.zoomK = damp(this.zoomK, this.zoom >= 0 ? 1 : 0, 4, dt);
    if (this.zoom >= 0) this.zoomIdx = this.zoom;
    if (this.zoomK > 0.001) {
      const zx = this.exhibits[this.zoomIdx];
      const fx = zx.side * (HALL_W / 2 - 0.1);
      const narrow = this.ctx.aspect < 0.9;
      const zPos = new THREE.Vector3(fx - zx.side * (narrow ? 6.2 : 3.4), FRAME_Y, zx.z);
      const zLook = new THREE.Vector3(fx, FRAME_Y, zx.z);
      const e = easeInOut(this.zoomK);
      this.aim(this.camPos.clone().lerp(zPos, e), this.camLook.clone().lerp(zLook, e), 0.18 * (1 - e));
    } else this.aim(this.camPos, this.camLook, 0.18);

    this.exhibits.forEach((ex, i) => {
      const d = Math.abs(tp - (i + 1));
      const hov = i === this.hovered ? 1 : 0;
      const target = Math.max(0, 1 - d * 1.2, hov * 0.8);
      ex.focus = damp(ex.focus, target, 6, dt);
      const k = ex.focus;
      // hovered frames lean out of the wall and their neon border flares
      const out = damp(ex.group.userData.out ?? 0, hov, 8, dt);
      ex.group.userData.out = out;
      ex.group.position.x = ex.side * (HALL_W / 2 - 0.1 - out * 0.25);
      ex.group.scale.setScalar(1 + out * 0.03);
      (ex.border.material as THREE.LineBasicMaterial).color.copy(ex.color).multiplyScalar(0.35 + k * 1.1 + out * 1.2);
      (ex.cone.material as THREE.MeshBasicMaterial).opacity = 0.06 + k * 0.16;
      (ex.pool.material as THREE.MeshBasicMaterial).opacity = 0.18 + k * 0.4;
      (ex.screen.material as THREE.MeshBasicMaterial).color.setScalar(0.45 + Math.max(k, this.zoom === i ? 1 : 0) * 0.45);
    });

    // spotlight follows the exhibit in focus
    const fi = Math.min(Math.max(Math.round(tp) - 1, 0), this.exhibits.length - 1);
    const ex = this.exhibits[fi];
    this.spot.position.set(ex.side * (HALL_W / 2 - 3.2), HALL_H - 0.4, ex.z + 1.2);
    this.spot.target.position.set(ex.side * (HALL_W / 2), FRAME_Y, ex.z);
    this.spot.intensity = 60 * ex.focus;

    (this.exitGlow.material as THREE.SpriteMaterial).opacity = 0.6 + 0.2 * Math.sin(t * 2);
    this.flash = 1 - easeInOut(range(p, 0, 0.025));
    this.exposure = lerp(1.05, 1.6, range(p, 0.97, 1));
  }

}
