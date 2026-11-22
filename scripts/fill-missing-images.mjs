// Fills gallery + detail images for the three projects that had no artwork.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = path.join(root, "public", "projects");
const manifestPath = path.join(root, "src", "project-images.json");

const SOURCES = {
  "weather-routing": path.join(root, "Weather-Aware Truck Routing Dashboard.png"),
  blade: path.join(root, "Blade_ Turn Your Inbox Into Opportunity.png"),
  "abc-storage": path.join(root, "Affordable Self Storage in Kingston.png"),
};

const JPG = { quality: 82, mozjpeg: true };

const laptopSvg = (w, h) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#2a1a5e"/><stop offset=".55" stop-color="#0d0b24"/><stop offset="1" stop-color="#05050d"/></radialGradient>
    <linearGradient id="base" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3d55"/><stop offset="1" stop-color="#15161f"/></linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8b5cf6" stop-opacity="0"/><stop offset=".5" stop-color="#22d3ee" stop-opacity=".9"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="${w * 0.15}" y="${h * 0.09}" width="${w * 0.7}" height="${h * 0.7}" rx="26" fill="#0b0c12" stroke="#4b4f6b" stroke-width="3"/>
  <path d="M ${w * 0.06} ${h * 0.81} L ${w * 0.94} ${h * 0.81} L ${w * 0.9} ${h * 0.86} L ${w * 0.1} ${h * 0.86} Z" fill="url(#base)"/>
  <rect x="${w * 0.44}" y="${h * 0.81}" width="${w * 0.12}" height="${h * 0.012}" rx="6" fill="#0b0c12"/>
  <rect x="${w * 0.1}" y="${h * 0.9}" width="${w * 0.8}" height="3" fill="url(#glow)"/>
</svg>`;

const phoneSvg = (w, h, pw, ph, xs, y) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e1a3a"/><stop offset=".5" stop-color="#1b1040"/><stop offset="1" stop-color="#05050d"/></linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="${w * 0.5}" cy="${h * 0.5}" r="${h * 0.42}" fill="#8b5cf6" opacity=".12"/>
  ${xs.map((x) => `<rect x="${x - 14}" y="${y - 14}" width="${pw + 28}" height="${ph + 28}" rx="54" fill="#0a0a12" stroke="#5b5f80" stroke-width="3"/>`).join("")}
</svg>`;

const phoneMask = (pw, ph) => Buffer.from(`<svg width="${pw}" height="${ph}"><rect width="${pw}" height="${ph}" rx="40" fill="#fff"/></svg>`);

const box = (W, H, left, top, width, height) => {
  left = Math.max(0, Math.min(Math.round(left), W - 2));
  top = Math.max(0, Math.min(Math.round(top), H - 2));
  width = Math.max(2, Math.min(Math.round(width), W - left));
  height = Math.max(2, Math.min(Math.round(height), H - top));
  return { left, top, width, height };
};

async function variants(slug, main) {
  const dir = path.join(outRoot, slug);
  fs.mkdirSync(dir, { recursive: true });
  const meta = await sharp(main).metadata();
  const W = meta.width;
  const H = meta.height;
  const out = (name) => path.join(dir, name);
  const list = [];

  await sharp(main).resize(1280, 720, { fit: "cover" }).jpeg(JPG).toFile(out("frame.jpg"));
  await sharp(main).resize(1920, 1080, { fit: "cover" }).jpeg(JPG).toFile(out("hero.jpg"));
  await sharp(main).resize(640, 360, { fit: "cover" }).jpeg(JPG).toFile(out("thumb.jpg"));
  list.push({ src: "hero.jpg", caption: "Hero visual", wide: true });

  const LW = 1600, LH = 1000;
  const screen = await sharp(main).resize(Math.round(LW * 0.7 - 24), Math.round(LH * 0.7 - 24), { fit: "cover" }).toBuffer();
  await sharp(Buffer.from(laptopSvg(LW, LH)))
    .composite([{ input: screen, left: Math.round(LW * 0.15 + 12), top: Math.round(LH * 0.09 + 12) }])
    .jpeg(JPG).toFile(out("laptop.jpg"));
  list.push({ src: "laptop.jpg", caption: "Desktop mockup" });

  await sharp(main).extract(box(W, H, 0, 0, W * 0.58, H)).resize(1200, 900, { fit: "cover" }).jpeg(JPG).toFile(out("crop-a.jpg"));
  list.push({ src: "crop-a.jpg", caption: "Detail" });

  const PW = 330, PH = 690, PHW = 1400, PHH = 1000, y = 155;
  const slice = async (fx) => {
    const sw = Math.min(W, Math.round(H * (PW / PH)));
    const left = Math.max(0, Math.min(W - sw, Math.round(W * fx - sw / 2)));
    return sharp(main).extract(box(W, H, left, 0, sw, H)).resize(PW, PH, { fit: "cover" })
      .composite([{ input: phoneMask(PW, PH), blend: "dest-in" }]).png().toBuffer();
  };
  const xs = [PHW * 0.5 - PW - 40, PHW * 0.5 + 40];
  await sharp(Buffer.from(phoneSvg(PHW, PHH, PW, PH, xs, y)))
    .composite([
      { input: await slice(0.3), left: Math.round(xs[0]), top: y },
      { input: await slice(0.72), left: Math.round(xs[1]), top: y },
    ])
    .jpeg(JPG).toFile(out("phone.jpg"));
  list.push({ src: "phone.jpg", caption: "Mobile mockup" });

  await sharp(main).extract(box(W, H, W * 0.42, 0, W * 0.58, H)).resize(1200, 900, { fit: "cover" }).jpeg(JPG).toFile(out("crop-b.jpg"));
  list.push({ src: "crop-b.jpg", caption: "Detail" });

  await sharp(main).extract(box(W, H, W * 0.25, H * 0.2, W * 0.5, H * 0.6)).resize(1600, 900, { fit: "cover" }).sharpen().jpeg(JPG).toFile(out("zoom.jpg"));
  list.push({ src: "zoom.jpg", caption: "Close-up", wide: true });

  await sharp(main).resize(1600, 900, { fit: "cover" }).grayscale().linear(1.15, -10).tint({ r: 150, g: 120, b: 255 }).jpeg(JPG).toFile(out("noir.jpg"));
  list.push({ src: "noir.jpg", caption: "Editorial grade" });

  return list;
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
for (const [slug, file] of Object.entries(SOURCES)) {
  if (!fs.existsSync(file)) throw new Error(`missing source ${file}`);
  const images = await variants(slug, file);
  manifest[slug] = { dir: `projects/${slug}/`, images };
  console.log("ok", slug, images.length);
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
