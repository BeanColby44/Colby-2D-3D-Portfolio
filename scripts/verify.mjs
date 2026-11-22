// Visual smoke test: drives the built site in headless Chrome, holds the loader, then
// screenshots every scene at several scroll points and reports console errors.
// Usage: npm run preview (in another terminal) then: node scripts/verify.mjs [outDir] [url] [width] [height]
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const outDir = process.argv[2] || "verify-shots";
const url = process.argv[3] || "http://localhost:4173/";
const W = Number(process.argv[4] || 1440);
const H = Number(process.argv[5] || 900);
fs.mkdirSync(outDir, { recursive: true });

const BROWSERS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];
const executablePath = process.env.CHROME_PATH || BROWSERS.find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1, isMobile: W < 700, hasTouch: W < 700 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`[${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (name) => page.screenshot({ path: path.join(outDir, `${name}.jpg`), type: "jpeg", quality: 72 });

await page.goto(url, { waitUntil: "load", timeout: 60000 });
await wait(1500);
await shot("00-loader");
// hold the mouse to accelerate the counter
await page.mouse.move(W / 2, H / 2);
await page.mouse.down();
await wait(900);
await shot("01-loader-holding");
await wait(1600);
await page.mouse.up();
await wait(700);
await shot("02-galaxy-disperse");
// lock screen → press & hold to enter
await page.waitForFunction(() => window.__portfolio?.state().mode === "locked", { timeout: 30000 });
await wait(1400);
await shot("02b-lock");
await page.mouse.move(W / 2, H * 0.6);
await page.mouse.down();
await wait(700);
await shot("02c-lock-holding");
await wait(900);
await page.mouse.up();
await wait(500);
await shot("02d-unlocking");
// cinematic reveal: wait for "click to ignite", then the comet carves the name
await page.waitForFunction(() => document.getElementById("ignite").classList.contains("on"), { timeout: 30000 });
await wait(500);
await shot("02e-ignite-wait");
await page.mouse.click(W / 2, H / 2);
await wait(700);
await shot("02f-comet-incoming");
await wait(900);
await shot("02g-comet-carving");
await wait(900);
await shot("02h-comet-carving-2");
await page.waitForFunction(() => document.body.classList.contains("ready"), { timeout: 30000 });
await wait(800);
await shot("03-hero-name");
// cursor over the particle name, then press it (shockwave)
await page.mouse.move(W * 0.35, H * 0.44, { steps: 12 });
await wait(900);
await shot("03a-name-hover");
await page.mouse.down();
await wait(160);
await shot("03a-name-press");
await page.mouse.up();
await wait(1500);
// hover state on the primary button
const btn = await page.$(".hero-ctas .btn-primary");
if (btn) {
  const b = await btn.boundingBox();
  await page.mouse.move(b.x + b.width * 0.7, b.y + b.height / 2, { steps: 8 });
  await wait(700);
  await shot("03b-hover-button");
}

const plan = {
  hero: [0.5],
  stack: [0.15, 0.5],
  snapshot: [0.3, 0.75],
  journey: [0.45],
  achievements: [0.5],
  portal: [0.75],
  projects: ["p0", "p9"],
  build: [0.5],
  solve: [0.143, 0.272, 0.358, 0.487, 0.573, 0.702, 0.788, 0.917],
  impact: [0.55],
  exploring: [0.5],
  contact: [0.6],
  outro: [0.9],
};
const go = (id, pt) => page.evaluate((id, pt) => {
  const P = window.__portfolio;
  const i = P.secs.findIndex((s) => s.id === id);
  let p = pt;
  if (typeof pt === "string") p = 0.02 + ((Number(pt.slice(1)) + 1 + 0.25) / 15) * 0.96;
  window.scrollTo({ top: P.scrollFor(i, p), behavior: "instant" });
}, id, pt);
let n = 4;
const S = (name) => shot(`${String(n++).padStart(2, "0")}-${name}`);
for (const [id, points] of Object.entries(plan)) {
  for (const pt of points) {
    await page.mouse.move(W - 30, H - 30);
    await go(id, pt);
    if (id === "stack" && pt === 0.15) { await wait(450); await S("flyby-comet"); }
    await wait(2600);
    await S(`${id}-${pt}`);
    if (id === "snapshot" && pt === 0.3) {
      // press the energy core, then drag to rotate
      await page.mouse.move(W * 0.6, H * 0.5, { steps: 6 });
      await page.mouse.down(); await wait(60); await page.mouse.up();
      await wait(180);
      await S("snapshot-press-core");
      await page.mouse.move(W * 0.55, H * 0.5);
      await page.mouse.down();
      await page.mouse.move(W * 0.85, H * 0.42, { steps: 14 });
      await page.mouse.up();
      await wait(300);
      await S("snapshot-dragged");
    }
    if (id === "projects" && pt === "p0") {
      const f = await page.evaluate(() => window.__portfolio.frameScreen(0));
      await page.mouse.move(f.x, f.y, { steps: 10 });
      await wait(700);
      await S("gallery-hover-card");
      await page.mouse.down(); await wait(80); await page.mouse.up();
      await wait(1800);
      await S("gallery-zoomed");
      await page.mouse.down(); await wait(80); await page.mouse.up();
      await wait(1500);
      const g = await page.evaluate(() => window.__portfolio.frameScreen(0));
      await page.mouse.move(g.x, g.y, { steps: 4 });
      await page.mouse.down();
      await wait(600);
      await S("gallery-long-press");
      await wait(700);
      await page.mouse.up();
      await wait(1400);
      await S("detail-hero");
      await page.evaluate(() => document.querySelector(".dt-scroll").scrollTo({ top: 900, behavior: "instant" }));
      await wait(1500);
      await S("detail-overview");
      await page.evaluate(() => document.querySelector("#dt-gallery").scrollIntoView({ behavior: "instant" }));
      await wait(1600);
      await S("detail-gallery");
      await page.evaluate(() => document.querySelector(".dt-fig").click());
      await wait(900);
      await S("detail-lightbox");
      await page.keyboard.press("Escape"); await wait(300);
      await page.keyboard.press("Escape"); await wait(1200);
      await S("detail-closed");
    }
  }
}
// idle re-lock
await page.evaluate(() => window.__portfolio.lock());
await wait(2200);
await shot("99-relocked");
fs.writeFileSync(path.join(outDir, "console.txt"), errors.join("\n") || "no console errors");
console.log(errors.length ? errors.join("\n") : "no console errors");
await browser.close();
