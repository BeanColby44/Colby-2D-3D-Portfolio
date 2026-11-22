import * as THREE from "three";
import { DragSpin, Pokes } from "./pokes";

/** The 2D star canvas, flattened over the dark sky and reused behind every 3D scene. */
let flatSky: THREE.CanvasTexture | null = null;
let flatPlate: HTMLCanvasElement | null = null;
let flatPlateCtx: CanvasRenderingContext2D | null = null;
function flatSkyMap() {
  if (flatSky) return flatSky;
  const canvas = document.querySelector<HTMLCanvasElement>(".flat-stars");
  if (!canvas) return null;
  flatPlate = document.createElement("canvas");
  flatPlateCtx = flatPlate.getContext("2d");
  flatSky = new THREE.CanvasTexture(flatPlate);
  flatSky.colorSpace = THREE.SRGBColorSpace;
  flatSky.magFilter = THREE.LinearFilter;
  flatSky.minFilter = THREE.LinearFilter;
  flatSky.generateMipmaps = false;
  return flatSky;
}
function refreshFlatSky() {
  const src = document.querySelector<HTMLCanvasElement>(".flat-stars");
  if (!flatSky || !flatPlate || !flatPlateCtx || !src || src.width === 0) return;
  if (flatPlate.width !== src.width || flatPlate.height !== src.height) {
    flatPlate.width = src.width;
    flatPlate.height = src.height;
  }
  flatPlateCtx.setTransform(1, 0, 0, 1, 0, 0);
  flatPlateCtx.fillStyle = "#03030a";
  flatPlateCtx.fillRect(0, 0, flatPlate.width, flatPlate.height);
  flatPlateCtx.drawImage(src, 0, 0);
  flatSky.needsUpdate = true;
}

export interface Ctx {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
  aspect: number;
  /** "high" for desktop GPUs, "low" for phones / weak devices */
  quality: "high" | "low";
  reduced: boolean;
  /** smoothed pointer, -1..1 */
  pointer: THREE.Vector2;
  time: number;
}

/** A self-contained 3D scene driven by a 0..1 progress value. */
export abstract class Stage {
  readonly scene = new THREE.Scene();
  /** pressable objects (bounce / spin / shock ring) */
  readonly pokes = new Pokes(this.scene);
  /** optional drag-to-rotate group */
  rotor: DragSpin | null = null;

  /** Press at a screen point; true when an object reacted. */
  press(ndc: THREE.Vector2): boolean {
    return this.pokes.press(ndc, this.ctx.camera);
  }
  /** Cursor label for a screen point. */
  hoverLabel(ndc: THREE.Vector2): string | null {
    return this.pokes.pick(ndc, this.ctx.camera) ? "Press" : null;
  }
  /** Before/after render hooks for the interaction transforms. */
  applyFx(dt: number) {
    refreshFlatSky();
    this.rotor?.apply(dt);
    this.pokes.apply(dt);
  }
  restoreFx() {
    this.pokes.restore();
    this.rotor?.restore();
  }
  /** Desired bloom strength while this stage is on screen. */
  bloom = 1.0;
  /** Luminance threshold for bloom (raise it where images must stay crisp). */
  bloomThreshold = 0.3;
  /** Desired exposure (tone-mapping) */
  exposure = 1.0;

  constructor(protected ctx: Ctx) {
    const sky = flatSkyMap();
    if (sky) this.scene.background = sky;
  }

  /** p = scroll progress through this stage's section (0..1). */
  abstract update(p: number, dt: number): void;
  resize(): void {}
  /** Called when the stage becomes the visible one. */
  activate(): void {}

  /** Place the camera with gentle pointer parallax. */
  protected aim(pos: THREE.Vector3, target: THREE.Vector3, parallax = 0.35) {
    const c = this.ctx.camera;
    const k = this.ctx.reduced ? 0 : parallax;
    c.position.set(pos.x + this.ctx.pointer.x * k, pos.y + this.ctx.pointer.y * k * 0.6, pos.z);
    c.lookAt(target);
  }
}

/* ---------- math helpers ---------- */
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** maps v from [a,b] to [0,1], clamped */
export const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** World-space size of the view frustum at a given distance from the camera. */
export function viewSize(camera: THREE.PerspectiveCamera, distance: number) {
  const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance;
  return { w: h * camera.aspect, h };
}
