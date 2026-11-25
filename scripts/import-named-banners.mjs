// One-off: turn the named project banners into the site's image set.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = path.join(root, "public", "projects");
const JPG = { quality: 82, mozjpeg: true };

const NAMED = [
  ["TD Golf_ Your Personal Golf Playground.png", "tdj-golf"],
  ["BestRides_ Safer, Smarter Travel.png", "best-ride"],
  ["Pattern_ Loyalty & Rewards App.png", "pattern"],
  ["LexMundi 2027 Global Seminar.png", "lex-mundi"],
  ["CloudEOC Emergency Response Showcase.png", "cloudeoc"],
  ["Carwash App Growth Dashboard Banner.png", "carwash-app"],
  ["Weather-Aware Truck Routing Dashboard.png", "weather-routing"],
  ["Elastic Path Composable Commerce Banner.png", "elastic-path"],
  ["Goodwill Career Services Banner.png", "goodtwice"],
];

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

  await sharp(main).extract({ left: 0, top: 0, width: Math.round(W * 0.58), height: H }).resize(1200, 900, { fit: "cover" }).jpeg(JPG).toFile(out("crop-a.jpg"));
  list.push({ src: "crop-a.jpg", caption: "Detail" });

  const PW = 330, PH = 690, PHW = 1400, PHH = 1000, y = 155;
  const slice = async (fx) => {
    const sw = Math.max(1, Math.round(H * (PW / PH)));
    const left = Math.max(0, Math.min(Math.max(0, W - sw), Math.round(W * fx - sw / 2)));
    const width = Math.min(sw, W - left);
    return sharp(main).extract({ left, top: 0, width, height: H }).resize(PW, PH, { fit: "cover" })
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

  await sharp(main).extract({ left: Math.round(W * 0.42), top: 0, width: Math.max(1, Math.round(W * 0.58)), height: H }).resize(1200, 900, { fit: "cover" }).jpeg(JPG).toFile(out("crop-b.jpg"));
  list.push({ src: "crop-b.jpg", caption: "Detail" });

  const zw = Math.max(1, Math.round(W * 0.5));
  const zh = Math.max(1, Math.round(H * 0.6));
  const zx = Math.max(0, Math.min(W - zw, Math.round(W * 0.25)));
  const zy = Math.max(0, Math.min(H - zh, Math.round(H * 0.2)));
  await sharp(main).extract({ left: zx, top: zy, width: zw, height: zh }).resize(1600, 900, { fit: "cover" }).sharpen().jpeg(JPG).toFile(out("zoom.jpg"));
  list.push({ src: "zoom.jpg", caption: "Close-up", wide: true });

  await sharp(main).resize(1600, 900, { fit: "cover" }).grayscale().linear(1.15, -10).tint({ r: 150, g: 120, b: 255 }).jpeg(JPG).toFile(out("noir.jpg"));
  list.push({ src: "noir.jpg", caption: "Editorial grade" });
  return list;
}

const manifestPath = path.join(root, "src", "project-images.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const only = new Set(process.argv.slice(2));
for (const [file, slug] of NAMED) {
  if (only.size && !only.has(slug)) continue;
  const src = path.join(root, file);
  const list = await variants(slug, src);
  manifest[slug] = { dir: `projects/${slug}/`, images: list };
  console.log("ok", slug, list.length);
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
