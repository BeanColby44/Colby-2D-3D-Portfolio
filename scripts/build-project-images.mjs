// Builds every image the site needs from the numbered project images in the parent folder.
//   ../<n>-<title>.png  →  public/projects/<slug>/{frame,hero,thumb,laptop,phone,crop-a,crop-b,zoom,noir,live,extra-*}.jpg
// and writes src/project-images.json (the manifest the site reads).
// Usage: npm run images
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.resolve(root, "..");
const outRoot = path.join(root, "public", "projects");

// image number → project slug (Workstream has no artwork; it uses its live-site capture)
const NUMBER_TO_SLUG = {
  1: "angel-extensions", 2: "joinedbio", 3: "goddessance", 4: "ernest-leoty", 5: "princess-dental",
  6: "alivia-danny", 7: "mockit", 8: "obscura", 9: "simi-haze", 10: "freightmate",
  11: "soulario", 13: "burndy", 14: "goddessance",
};
const ALL_SLUGS = [...new Set(Object.values(NUMBER_TO_SLUG)), "workstream", "carwash-app"];

const files = fs.readdirSync(srcDir).filter((f) => /^\d+-.+\.(png|jpe?g|webp)$/i.test(f));
const bySlug = {};
for (const f of files.sort((a, b) => parseInt(a) - parseInt(b))) {
  const slug = NUMBER_TO_SLUG[parseInt(f)];
  if (!slug) continue;
  (bySlug[slug] ??= []).push(path.join(srcDir, f));
}

const JPG = { quality: 82, mozjpeg: true };
const manifest = {};

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

async function variants(slug, sources) {
  const dir = path.join(outRoot, slug);
  fs.mkdirSync(dir, { recursive: true });
  const main = sources[0];
  const meta = await sharp(main).metadata();
  const W = meta.width, H = meta.height;
  const out = (name) => path.join(dir, name);
  const list = [];

  await sharp(main).resize(1280, 720, { fit: "cover" }).jpeg(JPG).toFile(out("frame.jpg"));
  await sharp(main).resize(1920, 1080, { fit: "cover" }).jpeg(JPG).toFile(out("hero.jpg"));
  await sharp(main).resize(640, 360, { fit: "cover" }).jpeg(JPG).toFile(out("thumb.jpg"));
  list.push({ src: "hero.jpg", caption: "Hero visual", wide: true });

  // desktop mockup
  const LW = 1600, LH = 1000;
  const screen = await sharp(main).resize(Math.round(LW * 0.7 - 24), Math.round(LH * 0.7 - 24), { fit: "cover" }).toBuffer();
  await sharp(Buffer.from(laptopSvg(LW, LH)))
    .composite([{ input: screen, left: Math.round(LW * 0.15 + 12), top: Math.round(LH * 0.09 + 12) }])
    .jpeg(JPG).toFile(out("laptop.jpg"));
  list.push({ src: "laptop.jpg", caption: "Desktop mockup" });

  // detail crops (left / right halves, slightly zoomed)
  await sharp(main).extract({ left: 0, top: 0, width: Math.round(W * 0.58), height: H }).resize(1200, 900, { fit: "cover" }).jpeg(JPG).toFile(out("crop-a.jpg"));
  list.push({ src: "crop-a.jpg", caption: "Detail" });

  // phone mockups: two portrait slices of the artwork
  const PW = 330, PH = 690, PHW = 1400, PHH = 1000, y = 155;
  const slice = async (fx) => {
    const sw = Math.round(H * (PW / PH));
    const left = Math.max(0, Math.min(W - sw, Math.round(W * fx - sw / 2)));
    return sharp(main).extract({ left, top: 0, width: sw, height: H }).resize(PW, PH, { fit: "cover" })
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

  await sharp(main).extract({ left: Math.round(W * 0.42), top: 0, width: Math.round(W * 0.58), height: H }).resize(1200, 900, { fit: "cover" }).jpeg(JPG).toFile(out("crop-b.jpg"));
  list.push({ src: "crop-b.jpg", caption: "Detail" });

  await sharp(main).extract({ left: Math.round(W * 0.25), top: Math.round(H * 0.2), width: Math.round(W * 0.5), height: Math.round(H * 0.6) }).resize(1600, 900, { fit: "cover" }).sharpen().jpeg(JPG).toFile(out("zoom.jpg"));
  list.push({ src: "zoom.jpg", caption: "Close-up", wide: true });

  // editorial duotone grade
  await sharp(main).resize(1600, 900, { fit: "cover" }).grayscale().linear(1.15, -10).tint({ r: 150, g: 120, b: 255 }).jpeg(JPG).toFile(out("noir.jpg"));
  list.push({ src: "noir.jpg", caption: "Editorial grade" });

  // live-site capture (from the earlier screenshot run), when available
  const live = path.join(outRoot, `${slug}.jpg`);
  if (fs.existsSync(live)) {
    await sharp(live).jpeg(JPG).toFile(out("live.jpg"));
    list.push({ src: "live.jpg", caption: "Live site capture" });
  }
  // any additional numbered images for the same project
  for (let i = 1; i < sources.length; i++) {
    const name = `extra-${i}.jpg`;
    await sharp(sources[i]).resize(1400, 1400, { fit: "inside" }).jpeg(JPG).toFile(out(name));
    list.push({ src: name, caption: "Campaign visual", tall: true });
  }
  return list;
}

for (const slug of ALL_SLUGS) {
  let sources = bySlug[slug];
  if (!sources?.length) {
    const live = path.join(outRoot, `${slug}.jpg`);
    if (!fs.existsSync(live)) continue;
    sources = [live];
  }
  const list = await variants(slug, sources);
  manifest[slug] = { dir: `projects/${slug}/`, images: list };
  console.log("ok", slug, list.length, "images");
}
fs.writeFileSync(path.join(root, "src", "project-images.json"), JSON.stringify(manifest, null, 2));
