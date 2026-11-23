// Captures a screenshot of each live project for the 3D gallery frames.
// Usage: npm run screens            (all)
//        npm run screens -- soulario (only matching slugs)
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "projects");
fs.mkdirSync(outDir, { recursive: true });

const BROWSERS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
];
const executablePath = process.env.CHROME_PATH || BROWSERS.find((p) => fs.existsSync(p));
if (!executablePath) throw new Error("No Chrome/Edge found. Set CHROME_PATH.");

const SITES = [
  ["freightmate", "https://www.freightmateapp.com/"],
  ["joinedbio", "https://joined.bio/"],
  ["workstream", "https://www.workstream.us/"],
  ["carwash-app", "https://carwashapp.com/"],
  ["princess-dental", "https://www.princessdentalstaffing.com/"],
  ["burndy", "https://apps.apple.com/us/app/burndy-connect/id1294811019"],
  ["angel-extensions", "https://angelextensions.com.au/"],
  ["soulario", "https://soulario.com/"],
  ["goddessance", "https://goddessance.ch/"],
  ["simi-haze", "https://simihazebeauty.com/"],
  ["ernest-leoty", "https://www.ernestleoty.com/en"],
  ["alivia-danny", "https://aliviadanny.com/"],
  ["mockit", "https://mock-it.co/"],
  ["obscura", "https://obscurainvestigations.com/"],
];

const only = process.argv.slice(2);
const list = only.length ? SITES.filter(([s]) => only.some((o) => s.includes(o))) : SITES;

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--hide-scrollbars", "--mute-audio"],
});

for (const [slug, url] of list) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"
  );
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, Number(process.env.WAIT || 3500)));
    await page.keyboard.press("Escape").catch(() => {});
    // Hide common cookie banners / popups so the hero is visible.
    await page.addStyleTag({
      content: `[id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],
        [class*="popup" i][class*="newsletter" i],[aria-modal="true"],.needsclick.kl-private-reset-css-Xuajs1{display:none!important}`,
    }).catch(() => {});
    await new Promise((r) => setTimeout(r, 600));
    const png = await page.screenshot({ type: "png" });
    await sharp(png).resize(1280, 800, { fit: "cover", position: "top" }).jpeg({ quality: 80, mozjpeg: true })
      .toFile(path.join(outDir, `${slug}.jpg`));
    console.log("ok  ", slug);
  } catch (e) {
    console.log("FAIL", slug, e.message);
  }
  await page.close();
}
await browser.close();

