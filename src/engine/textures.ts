import * as THREE from "three";

export const HEAD_FONT = '"Space Grotesk", "Segoe UI", system-ui, sans-serif';
export const DISPLAY_FONT = '"Syne", "Space Grotesk", "Segoe UI", system-ui, sans-serif';
export const BODY_FONT = '"Inter", "Segoe UI", system-ui, sans-serif';

/** Soft radial glow sprite. */
export function glowTexture(inner = "rgba(255,255,255,1)", mid = "rgba(160,120,255,0.35)", size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.25, mid);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Glass tile with a glowing symbol, used for floating technology symbols. */
export function symbolTexture(symbol: string, color: string, size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = size * 0.18;
  const pad = size * 0.08;
  g.beginPath();
  g.roundRect(pad, pad, size - pad * 2, size - pad * 2, r);
  g.fillStyle = "rgba(20,16,40,0.55)";
  g.fill();
  g.lineWidth = size * 0.022;
  g.strokeStyle = color;
  g.shadowColor = color;
  g.shadowBlur = size * 0.08;
  g.stroke();
  g.shadowBlur = size * 0.06;
  g.fillStyle = "#ffffff";
  const fs = symbol.length > 3 ? size * 0.2 : symbol.length > 2 ? size * 0.26 : size * 0.34;
  g.font = `700 ${fs}px ${HEAD_FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(symbol, size / 2, size / 2 + size * 0.01);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Text label texture (transparent background). Returns texture + aspect ratio. */
export function labelTexture(
  lines: { text: string; size: number; color: string; weight?: number; font?: string; spacing?: number }[],
  opts: { width?: number; align?: CanvasTextAlign; padding?: number } = {}
) {
  const width = opts.width ?? 1024;
  const pad = opts.padding ?? 24;
  const lineGap = 1.25;
  const height = Math.ceil(lines.reduce((h, l) => h + l.size * lineGap, 0) + pad * 2);
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const g = c.getContext("2d")!;
  g.textBaseline = "top";
  g.textAlign = opts.align ?? "left";
  const x = g.textAlign === "center" ? width / 2 : g.textAlign === "right" ? width - pad : pad;
  let y = pad;
  for (const l of lines) {
    g.font = `${l.weight ?? 600} ${l.size}px ${l.font ?? HEAD_FONT}`;
    if ("letterSpacing" in g && l.spacing) (g as any).letterSpacing = `${l.spacing}px`;
    g.fillStyle = l.color;
    g.shadowColor = l.color;
    g.shadowBlur = 12;
    g.fillText(l.text, x, y);
    if ("letterSpacing" in g) (g as any).letterSpacing = "0px";
    y += l.size * lineGap;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { texture: t, aspect: width / height };
}

/** Placeholder art used if a project screenshot is missing. */
export function placeholderScreen(title: string, sub: string) {
  const c = document.createElement("canvas");
  c.width = 1280;
  c.height = 800;
  const g = c.getContext("2d")!;
  const grd = g.createLinearGradient(0, 0, 1280, 800);
  grd.addColorStop(0, "#1b1035");
  grd.addColorStop(1, "#06243a");
  g.fillStyle = grd;
  g.fillRect(0, 0, 1280, 800);
  g.strokeStyle = "rgba(140,120,255,0.25)";
  for (let i = 0; i < 1280; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 800); g.stroke(); }
  for (let j = 0; j < 800; j += 64) { g.beginPath(); g.moveTo(0, j); g.lineTo(1280, j); g.stroke(); }
  g.fillStyle = "#fff";
  g.font = `700 96px ${HEAD_FONT}`;
  g.textAlign = "center";
  g.fillText(title, 640, 380);
  g.fillStyle = "#9fb4ff";
  g.font = `500 40px ${BODY_FONT}`;
  g.fillText(sub, 640, 460);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Vertical gradient used for light shafts / beams. */
export function beamTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, "rgba(255,255,255,0.9)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.25)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 256);
  const h = g.getImageData(0, 0, 64, 256);
  // soften horizontally
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 64; x++) {
      const k = Math.sin((x / 63) * Math.PI);
      h.data[(y * 64 + x) * 4 + 3] *= k * k;
    }
  g.putImageData(h, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
