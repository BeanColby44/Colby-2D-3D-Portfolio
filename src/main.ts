import "./flat";
import "./style.css";
import "./fx.css";
import * as THREE from "three";
import { gsap } from "gsap";
import { sound } from "./audio";
import { enhanceText, initHover } from "./interactions";
import { Cursor } from "./cursor";
import { initText, splitText, spark } from "./text";
import "./text.css";
import "./sections.css";
import { Comet, bezier } from "./scenes/comet";
import { PROFILE, PROJECTS, SKILLS, ACHIEVEMENTS, EXPERIENCE, PROBLEMS, REACH, EXPLORING, CATEGORIES } from "./data";
import { buildStory, countUp, jobPanel, projectCard, skillPanel, solvePanel } from "./ui";
import { SolveStage } from "./scenes/solve";
import { ImpactStage } from "./scenes/impact";
import { ExploreStage } from "./scenes/explore";
import { DetailPage } from "./detail";
import { Renderer } from "./engine/renderer";
import { Ctx, Stage, clamp01, damp, smooth, viewSize } from "./engine/stage";
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutQ = (t: number) => 1 - (1 - t) * (1 - t);
const easeInOutQ = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
import { IntroStage, OutroStage } from "./scenes/intro";
import { SymbolsStage } from "./scenes/symbols";
import { LayersStage } from "./scenes/layers";
import { TimelineStage } from "./scenes/timeline";
import { TowersStage } from "./scenes/towers";
import { PortalStage } from "./scenes/portal";
import { GalleryStage } from "./scenes/gallery";
import { WireframeStage } from "./scenes/wireframe";
import { HorizonStage } from "./scenes/horizon";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

/* ------------------------------------------------------------------ */
/* Setup                                                               */
/* ------------------------------------------------------------------ */
history.scrollRestoration = "manual";
window.scrollTo(0, 0);
buildStory($("story"));

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
const quality: "high" | "low" = coarse || window.innerWidth < 760 || (navigator.hardwareConcurrency ?? 8) <= 4 ? "low" : "high";

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

wireNav();
wireDialog();
const cursor = new Cursor();
initHover(reduced);
initText(reduced);
wireSound();

function wireSound() {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-sound]")];
  const sync = (on: boolean) => {
    for (const btn of buttons) {
      btn.setAttribute("aria-pressed", String(on));
      btn.setAttribute("aria-label", on ? "Mute sound" : "Unmute sound");
    }
  };
  sync(sound.enabled);
  sound.onChange(sync);
  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      sound.unlock();
      sound.toggle();
    });
  }
  // browsers only allow audio after a gesture
  const wake = () => sound.unlock();
  window.addEventListener("pointerdown", wake);
  window.addEventListener("keydown", wake);
}

if (!hasWebGL()) {
  document.body.classList.add("static", "ready");
  document.body.classList.remove("locked", "is-locked");
} else {
  start().catch((err) => {
    console.error(err);
    document.body.classList.add("static", "ready");
    document.body.classList.remove("locked", "is-locked");
  });
}

/* ------------------------------------------------------------------ */
/* Navigation + dialog wiring (works in both 3D and static modes)      */
/* ------------------------------------------------------------------ */
let jumpTo: (id: string, progress?: number) => void = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};
let goToProject: (i: number) => void = () => {};

function wireNav() {
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>("[data-jump]");
    if (!a) return;
    e.preventDefault();
    closeMenu();
    jumpTo(a.dataset.jump!);
  });
  const btn = $("menuBtn");
  btn.addEventListener("click", () => {
    const open = $("navList").classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
}
function closeMenu() {
  $("navList").classList.remove("open");
  $("menuBtn").setAttribute("aria-expanded", "false");
}
function wireDialog() {
  const dlg = $<HTMLDialogElement>("projectsDialog");
  $("pdClose").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-project]");
    if (b) {
      dlg.close();
      goToProject(Number(b.dataset.project));
    }
  });
}

/* ------------------------------------------------------------------ */
/* 3D experience                                                       */
/* ------------------------------------------------------------------ */
async function start() {
  // Fonts must be ready before the name is sampled into particles.
  await Promise.race([
    Promise.all([document.fonts.load('800 100px "Syne"'), document.fonts.load('700 100px "Space Grotesk"'), document.fonts.load('600 40px "Inter"')]),
    new Promise((r) => setTimeout(r, 2500)),
  ]);

  const canvas = $<HTMLCanvasElement>("gl");
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400);
  const gl = new Renderer(canvas, camera, quality);
  const ctx: Ctx = {
    camera,
    renderer: gl.renderer,
    width: window.innerWidth,
    height: window.innerHeight,
    aspect: window.innerWidth / window.innerHeight,
    quality,
    reduced,
    pointer: new THREE.Vector2(),
    time: 0,
  };

  const texLoader = new THREE.TextureLoader();

  const intro = new IntroStage(ctx, PROFILE.name);
  const symbols = new SymbolsStage(ctx);
  const layers = new LayersStage(ctx);
  const timeline = new TimelineStage(ctx, EXPERIENCE.length);
  const towers = new TowersStage(ctx, SKILLS);
  const portal = new PortalStage(ctx);
  const gallery = new GalleryStage(ctx, PROJECTS, texLoader, () => {});
  const wire = new WireframeStage(ctx, ACHIEVEMENTS.length);
  const horizon = new HorizonStage(ctx);
  const outro = new OutroStage(ctx, PROFILE.name);
  const solve = new SolveStage(ctx, PROBLEMS.length);
  const impact = new ImpactStage(ctx, REACH);
  const explore = new ExploreStage(ctx, EXPLORING);
  const detail = new DetailPage(PROJECTS);

  type Fade = "black" | "none";
  interface Sec {
    id: string;
    el: HTMLElement;
    stage: Stage;
    fadeIn: Fade;
    fadeOut: Fade;
    label: string;
    top: number;
    h: number;
    start: number;
    end: number;
  }
  const defs: [string, Stage, Fade, Fade][] = [
    ["hero", intro, "none", "black"], // 01
    ["stack", towers, "black", "black"], // 02
    ["snapshot", symbols, "black", "black"], // 03
    ["journey", timeline, "black", "black"], // 04
    ["achievements", wire, "black", "black"], // 05
    ["portal", portal, "black", "none"], // 06 — exits through a white flash
    ["projects", gallery, "none", "black"], // 06
    ["build", layers, "black", "black"], // 07
    ["solve", solve, "black", "black"], // 08
    ["impact", impact, "black", "black"], // 09
    ["exploring", explore, "black", "black"], // 10
    ["contact", horizon, "black", "black"], // 11
    ["outro", outro, "black", "none"], // 12
  ];
  const secs: Sec[] = defs.map(([id, stage, fadeIn, fadeOut]) => {
    const el = $(id);
    return { id, el, stage, fadeIn, fadeOut, label: el.dataset.label ?? id, top: 0, h: 0, start: 0, end: 0 };
  });

  let vh = window.innerHeight;
  function layout() {
    vh = window.innerHeight;
    for (const s of secs) s.el.style.height = `${(Number(s.el.dataset.len) / 100) * vh}px`;
    secs.forEach((s, i) => {
      s.top = s.el.offsetTop;
      s.h = s.el.offsetHeight;
      // 3D range: boundaries sit in the middle of the 1vh hand-over between sticky panels
      s.start = i === 0 ? 0 : s.top - vh * 0.5;
      s.end = i === secs.length - 1 ? s.top + s.h - vh : s.top + s.h - vh * 0.5;
    });
  }
  layout();

  const scrollFor = (i: number, p: number) => secs[i].start + clamp01(p) * (secs[i].end - secs[i].start);
  const indexOf = (id: string) => secs.findIndex((s) => s.id === id);

  /* ---------- precompile shaders so the first scroll doesn't hitch ---------- */
  for (const s of secs) gl.renderer.compile(s.stage.scene, camera);

  /** app flow: locked ⇄ open. The old percentage loader was the same galaxy as the lock screen. */
  let mode: "locked" | "open" = "locked";
  let firstEntry = true;
  /** global transition overlay values (white flash / fade to black) */
  const trans = { flash: 0, fade: 0 };

  window.addEventListener("pointerup", () => setLockHold(false));
  window.addEventListener("pointercancel", () => setLockHold(false));
  const SCROLL_KEYS = ["Space", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
  window.addEventListener("keydown", (e) => {
    const holdKey = e.code === "Space" || e.code === "Enter";
    if (document.body.classList.contains("show-flat") || document.body.classList.contains("warping")) return;
    if (mode !== "locked") return;
    if (SCROLL_KEYS.includes(e.code) || holdKey) e.preventDefault();
    if (holdKey && !e.repeat) setLockHold(true);
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space" || e.code === "Enter") setLockHold(false);
  });

  /* ---------- lock screen: the single galaxy + hold ring ---------- */
  const lockGalaxy = new IntroStage(ctx, PROFILE.name);
  gl.renderer.compile(lockGalaxy.scene, camera);
  const lockEl = $("lock");
  const lkProg = $("lkProg");
  const lkNum = $("lkNum");
  const LK_ARC = 2 * Math.PI * 92;
  let lockShown = false;
  let lockHolding = false;
  let lockHold = 0;
  let unlocking = false;
  let lastActivity = performance.now();
  const IDLE_MS = 60_000;

  function setLockHold(v: boolean) {
    if (mode !== "locked" || unlocking) v = false;
    lockHolding = v;
    lockEl.classList.toggle("holding", v);
  }
  lockEl.addEventListener("pointerdown", () => setLockHold(true));
  lockEl.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
  lockEl.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

  function showLock(first: boolean) {
    mode = "locked";
    lockShown = true;
    unlocking = false;
    lockHold = 0;
    Object.assign(lockGalaxy.state, { spin: 0.18, hold: 0, disperse: 0, form: 0, view: 0, core: 1, progress: 0, collapse: 0 });
    $("lkHint").textContent = first ? "Press & hold to enter" : "Press & hold to unlock";
    lockEl.classList.remove("opening", "done");
    lockEl.classList.add("show");
    document.body.classList.add("is-locked");
    lockEl.setAttribute("aria-hidden", "false");
    const dlg = $<HTMLDialogElement>("projectsDialog");
    if (dlg.open) dlg.close();
    closeMenu();
    sound.setMuffled(true);
  }

  /** Idle for a minute: fade out and lock again. */
  function lockNow() {
    if (mode !== "open") return;
    mode = "locked";
    sound.lockFx();
    gsap.to(trans, {
      fade: 1,
      duration: 0.5,
      ease: "power2.in",
      onComplete: () => {
        showLock(false);
        gsap.to(trans, { fade: 0, duration: 0.9, ease: "power2.out" });
      },
    });
  }

  /** Unlock: the rig implodes into the galaxy core, white flash, back to the site. */
  function unlock() {
    unlocking = true;
    setLockHold(false);
    sound.riser(0);
    sound.unlockFx();
    sound.setMuffled(false);
    cursor.setHold(null);
    lockEl.classList.add("done");
    gsap
      .timeline()
      .to(lockGalaxy.state, { collapse: 1, duration: 0.7, ease: "back.in(2.2)" }, 0)
      .to(lockGalaxy.state, { spin: 2.5, duration: 0.7, ease: "power2.in" }, 0)
      .to(trans, { flash: 1, duration: 0.35, ease: "power2.in" }, 0.55)
      .add(() => {
        lockShown = false;
        mode = "open";
        lockEl.classList.remove("show", "opening", "holding");
        document.body.classList.remove("is-locked");
        lockEl.setAttribute("aria-hidden", "true");
        lastActivity = performance.now();
        if (firstEntry) {
          firstEntry = false;
          beginIgnite();
        }
      }, 0.9)
      .to(trans, { flash: 0, duration: 1.1, ease: "power2.out" }, 0.95);
  }

  function updateLock(dt: number) {
    if (!unlocking) lockHold = clamp01(lockHold + (lockHolding ? dt / 1.1 : -dt * 1.8));
    lockGalaxy.state.hold = lockHold;
    if (!unlocking) lockGalaxy.state.progress = lockHold;
    lkProg.style.strokeDashoffset = String(LK_ARC * (1 - lockHold));
    lkNum.textContent = String(Math.round(lockHold * 100)).padStart(3, "0");
    lockEl.style.setProperty("--hold", lockHold.toFixed(3));
    sound.riser(lockHolding ? 0.25 + lockHold * 0.75 : 0);
    if (!unlocking) cursor.setHold("Hold", lockHold);
    if (lockHold >= 1 && !unlocking) unlock();
  }

  showLock(true);

  /* ---------- cinematic name reveal: a comet carves the name ---------- */
  const heroComet = new Comet(1.15);
  const flyComet = new Comet(0.9, new THREE.Color(2.6, 2.4, 3.2), new THREE.Color(1.6, 0.4, 2.4));
  const pxScale = () => (ctx.height / (2 * Math.tan(THREE.MathUtils.degToRad(50) / 2))) * gl.renderer.getPixelRatio();
  heroComet.setPixelScale(pxScale());
  flyComet.setPixelScale(pxScale());
  const igniteEl = $("ignite");
  let igniteReady = false;
  let carving = false;
  let igniteTimer = 0;

  /** After the first unlock: galaxy bursts into dust, letterbox bars slide in, wait for a click. */
  function beginIgnite() {
    const k = reduced ? 0.35 : 1;
    intro.state.hold = 0;
    intro.state.collapse = 1;
    intro.field.material.uniforms.uCarveMode.value = 1;
    intro.field.material.uniforms.uCarve.value = -1000;
    document.body.classList.add("cinema");
    sound.whoosh(1.3, true);
    gsap
      .timeline()
      .to(intro.state, { spin: 0.05, duration: 1.6 * k, ease: "power2.out" }, 0)
      .to(intro.state, { disperse: 1, duration: 1.8 * k, ease: "power2.inOut" }, 0.1 * k)
      .to(intro.state, { view: 1, duration: 2.6 * k, ease: "power2.inOut" }, 0.3 * k)
      .add(() => {
        igniteReady = true;
        igniteEl.classList.add("on");
        cursor.setScene("Ignite");
        // don't leave anyone stranded: ignite on its own after a few seconds
        igniteTimer = window.setTimeout(ignite, 6500);
      }, 2.4 * k);
  }

  function ignite() {
    if (!igniteReady) return;
    igniteReady = false;
    clearTimeout(igniteTimer);
    igniteEl.classList.remove("on");
    cursor.setScene(null);
    carving = true;
    const b = intro.field.bounds;
    const cy = (b.min.y + b.max.y) / 2, hgt = b.max.y - b.min.y;
    const start = new THREE.Vector3(b.min.x - 16, cy + 7, -22);
    const entry = new THREE.Vector3(b.min.x - 0.6, cy, 0.5);
    const ctrl = new THREE.Vector3(b.min.x - 9, cy - 4, -2);
    const exitCtrl = new THREE.Vector3(b.max.x + 4, cy + 1.5, 3);
    const exit = new THREE.Vector3(b.max.x + 14, cy + 6, 9);
    const P = new THREE.Vector3();
    const dur = reduced ? 1.6 : 3.4;
    heroComet.launch(intro.scene, (u) => {
      if (u < 0.28) return bezier(start, ctrl, entry, easeOutQ(u / 0.28), P);
      if (u < 0.86) {
        const k = (u - 0.28) / 0.58;
        // weave through the letters while sweeping left → right
        return P.set(lerpN(b.min.x - 0.6, b.max.x + 0.6, k), cy + Math.sin(k * Math.PI * 7) * hgt * 0.32, 0.5 + Math.sin(k * Math.PI * 3) * 0.4);
      }
      return bezier(new THREE.Vector3(b.max.x + 0.6, cy, 0.5), exitCtrl, exit, (u - 0.86) / 0.14, P);
    }, dur);
    heroComet.onDone = finishCarve;
    sound.comet(dur);
    bloomKick = 0.8;
  }

  function finishCarve() {
    carving = false;
    const u = intro.field.material.uniforms;
    u.uCarve.value = 1000;
    intro.state.form = 1;
    sound.transition(1.2);
    sound.impact(0.9);
    bloomKick = 1.8;
    gsap.fromTo(trans, { flash: 0.35 }, { flash: 0, duration: 0.9, ease: "power2.out" });
    setTimeout(() => {
      u.uCarveMode.value = 0;
      document.body.classList.remove("cinema");
      document.body.classList.add("ready");
      document.body.classList.remove("locked");
      layout();
      if (detail.openFromUrl() >= 0) sound.whoosh(0.8, true);
    }, reduced ? 200 : 1100);
  }

  /** Feed the comet's x position into the particle shader while it carves. */
  function updateCarve() {
    if (!carving || heroComet.u < 0) return;
    const b = intro.field.bounds;
    const u = heroComet.u;
    const x = u < 0.28 ? b.min.x - 2 : u < 0.86 ? heroComet.position.x : b.max.x + 3;
    intro.field.material.uniforms.uCarve.value = x;
  }

  /** A comet streaks across the screen on every chapter change. */
  const flyA = new THREE.Vector3(), flyB = new THREE.Vector3(), flyC = new THREE.Vector3(), flyP = new THREE.Vector3();
  function flyby(scene: THREE.Scene, forward: boolean) {
    if (reduced) return;
    const d = 9;
    const { w, h } = viewSize(camera, d);
    const s = forward ? 1 : -1;
    flyA.set(-s * w * 0.75, h * (0.25 + Math.random() * 0.3), -d - 4);
    flyB.set(s * w * 0.75, -h * (0.1 + Math.random() * 0.3), -d + 2);
    flyC.set(0, h * (0.5 + Math.random() * 0.3), -d - 6);
    flyComet.launch(scene, (u) => camera.localToWorld(bezier(flyA, flyC, flyB, easeInOutQ(u), flyP)), 1.25);
  }

  // click / Enter / Space ignites the comet
  window.addEventListener("pointerdown", () => igniteReady && ignite());
  window.addEventListener("keydown", (e) => {
    if (igniteReady && (e.code === "Enter" || e.code === "Space")) {
      e.preventDefault();
      ignite();
    }
  });

  ["pointermove", "pointerdown", "wheel", "keydown", "touchstart", "scroll"].forEach((ev) =>
    window.addEventListener(ev, () => (lastActivity = performance.now()), { passive: true })
  );

  /* ---------- pointer ---------- */
  const pointerTarget = new THREE.Vector2();
  let overName = false;
  let lastP = 0;
  let bloomKick = 0;
  const ndc = new THREE.Vector2();
  /* ---- pointer: hover labels, gallery hover card, drag-to-rotate, press, long-press ---- */
  const hoverCard = $("hoverCard");
  const pressRing = $("pressRing");
  const prProg = $("prProg");
  const PR_ARC = 2 * Math.PI * 34;
  const HOLD_MS = 950;
  let cardShown = -1;
  let drag: { x: number; y: number; moved: number; t: number; rotating: boolean } | null = null;
  let hold: { i: number; t0: number; x: number; y: number } | null = null;
  const setNdc = (x: number, y: number) => ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);

  function showHoverCard(i: number, x: number, y: number) {
    if (i < 0) {
      if (cardShown >= 0) hoverCard.classList.remove("on");
      cardShown = -1;
      return;
    }
    if (i !== cardShown) {
      const p = PROJECTS[i];
      hoverCard.innerHTML = `
        <div class="hc-top"><span class="hc-n">${String(i + 1).padStart(2, "0")}</span><span class="badge">${CATEGORIES[p.cat]}</span></div>
        <b>${p.name}</b><small>${p.sub}</small>
        <p>${p.summary.split(". ")[0]}.</p>
        <div class="hc-hint"><span>Hold</span> the picture to open details</div>`;
      hoverCard.classList.add("on");
      cardShown = i;
    }
    const w = 300, h = hoverCard.offsetHeight || 180;
    const left = x + 28 + w > innerWidth ? x - w - 24 : x + 28;
    const top = Math.min(innerHeight - h - 12, Math.max(12, y - h / 2));
    hoverCard.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }

  window.addEventListener("pointermove", (e) => {
    pointerTarget.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    ndc.copy(pointerTarget);
    if (document.body.classList.contains("show-flat")) {
      if (cardShown >= 0) showHoverCard(-1, 0, 0);
      cursor.setScene(null);
      return;
    }
    const overCanvas = e.target === canvas && !lockShown && mode === "open" && !detail.isOpen;

    // dragging rotates the scene's main object
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      const now = performance.now();
      drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.moved > 6 && current.rotor && !hold) {
        if (!drag.rotating) {
          drag.rotating = true;
          current.rotor.start();
          document.documentElement.classList.add("dragging");
        }
        current.rotor.move(dx, dy, (now - drag.t) / 1000);
      }
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.t = now;
    }
    if (hold && Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 14) cancelHold();

    const th = overCanvas && current === towers ? towers.pick(ndc) : -1;
    const gh = overCanvas && current === gallery ? gallery.pick(ndc) : -1;
    if (th !== towers.hovered && th >= 0) sound.hover();
    if (gh !== gallery.hovered && gh >= 0) sound.hover();
    towers.hovered = th;
    gallery.hovered = gh;
    showHoverCard(gh >= 0 && gallery.zoom !== gh ? gh : -1, e.clientX, e.clientY);

    // particle name (intro + outro) reacts to the cursor once it is fully formed
    const introOn = overCanvas && current === intro && intro.state.form > 0.97 && lastP < 0.14;
    const outroOn = overCanvas && current === outro && lastP > 0.55;
    const nameHit = intro.field.pointer(ndc, introOn) || outro.field.pointer(ndc, outroOn);
    if (nameHit && !overName) sound.hover();
    overName = nameHit;

    let label: string | null = null;
    if (nameHit) label = "Press";
    else if (th >= 0) label = "Select";
    else if (gh >= 0) label = gallery.zoom === gh ? "Back" : "Zoom";
    else if (overCanvas && !drag?.rotating) label = current.hoverLabel(ndc);
    if (drag?.rotating) label = "Drag";
    cursor.setScene(label);
    canvas.style.cursor = label && !cursor.enabled ? "pointer" : "";
  });

  function cancelHold() {
    if (hold) sound.riser(0);
    hold = null;
    pressRing.classList.remove("on", "visible");
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (mode !== "open" || detail.isOpen || e.button !== 0) return;
    setNdc(e.clientX, e.clientY);
    // the name: shockwave through the particles + light burst + electric zap
    if (overName) {
      const field = current === outro ? outro.field : intro.field;
      field.shock();
      sound.zap(1.3);
      sound.impact(0.55);
      cursor.zap(e.clientX, e.clientY, true);
      spark(e.clientX, e.clientY, 1.8);
      bloomKick = 1.6;
      gsap.fromTo(trans, { flash: 0.28 }, { flash: 0, duration: 0.7, ease: "power2.out" });
      return;
    }
    // gallery frame: short press = zoom, long press = open the project page
    if (current === gallery) {
      const i = gallery.pick(ndc);
      if (i >= 0) {
        hold = { i, t0: performance.now(), x: e.clientX, y: e.clientY };
        pressRing.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        prProg.style.strokeDashoffset = String(PR_ARC);
        pressRing.classList.add("on");
        return;
      }
    }
    drag = { x: e.clientX, y: e.clientY, moved: 0, t: performance.now(), rotating: false };
  });

  window.addEventListener("pointerup", (e) => {
    if (hold) {
      const i = hold.i;
      const quick = performance.now() - hold.t0 < 350;
      cancelHold();
      if (quick) {
        gallery.zoom = gallery.zoom === i ? -1 : i;
        sound.whoosh(0.9, gallery.zoom >= 0);
        if (gallery.zoom >= 0) sound.poke(1.4);
        showHoverCard(-1, 0, 0);
      }
    }
    if (!drag) return;
    const d = drag;
    drag = null;
    document.documentElement.classList.remove("dragging");
    if (d.rotating) {
      current.rotor?.end();
      return;
    }
    if (mode !== "open" || detail.isOpen) return;
    setNdc(e.clientX, e.clientY);
    // a click (not a drag): towers select their category, everything else reacts physically
    if (current === towers) {
      const i = towers.pick(ndc);
      if (i >= 0) scrollToP(indexOf("stack"), towers.progressFor(i));
    }
    if (current.press(ndc)) {
      sound.poke(0.8 + Math.random() * 0.6);
      cursor.zap(e.clientX, e.clientY);
      bloomKick = Math.max(bloomKick, 0.6);
    }
  });

  function updateHold() {
    if (!hold) return;
    const k = Math.min(1, (performance.now() - hold.t0) / HOLD_MS);
    // the ring only appears once it is clearly a long press
    pressRing.classList.toggle("visible", k > 0.18);
    prProg.style.strokeDashoffset = String(PR_ARC * (1 - k));
    sound.riser(k > 0.18 ? k : 0);
    if (k >= 1) {
      const { i, x, y } = hold;
      cancelHold();
      sound.riser(0);
      sound.transition(0.8);
      gallery.zoom = -1;
      showHoverCard(-1, 0, 0);
      detail.open(i, x, y);
    }
  }

  // scrolling or Esc leaves a zoomed frame
  let seamDir = 1;
  let seamHold = 0;
  let seamUser = false;
  let seenSection = -1;
  let armedSection = -1;
  let armedDir = 1;
  const noteSeam = (dir: number) => {
    if (dir) seamDir = dir > 0 ? 1 : -1;
    seamHold = performance.now() + 320;
    seamUser = true;
  };
  window.addEventListener("wheel", (e) => {
    gallery.zoom = -1;
    noteSeam(e.deltaY);
  }, { passive: true });
  window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowDown" || e.code === "PageDown" || e.code === "Space") noteSeam(1);
    if (e.code === "ArrowUp" || e.code === "PageUp") noteSeam(-1);
  });
  let touchY = 0;
  window.addEventListener("touchstart", (e) => { touchY = e.touches[0]?.clientY ?? touchY; }, { passive: true });
  window.addEventListener("touchmove", (e) => {
    const y = e.touches[0]?.clientY ?? touchY;
    noteSeam(touchY - y);
    touchY = y;
  }, { passive: true });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && gallery.zoom >= 0 && !detail.isOpen) gallery.zoom = -1;
  });
  detail.onChange = (open) => {
    cursor.setScene(null);
    if (!open) last = performance.now();
  };

  /* ---------- scrolling helpers ---------- */
  let sy = 0; // smoothed scroll
  function scrollToP(i: number, p: number) {
    window.scrollTo({ top: scrollFor(i, p), behavior: "smooth" });
    seamHold = performance.now() + 1000;
    armedSection = -1;
    seenSection = i;
  }
  // Long jumps cut through black instead of flying through every scene.
  jumpTo = (id: string, progress?: number) => {
    const i = indexOf(id);
    if (i < 0) return;
    const p = progress ?? (id === "hero" ? 0 : id === "projects" ? gallery.progressFor(0) - 0.02 : 0.3);
    const target = scrollFor(i, p);
    armedSection = i;
    armedDir = target >= window.scrollY ? 1 : -1;
    seenSection = i;
    seamHold = performance.now() + 1200;
    if (Math.abs(target - window.scrollY) < vh * 2.5) {
      window.scrollTo({ top: target, behavior: "smooth" });
      return;
    }
    const veil = $("veil");
    veil.classList.add("on");
    setTimeout(() => {
      window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
      sy = target;
      requestAnimationFrame(() => veil.classList.remove("on"));
    }, 360);
  };
  goToProject = (i: number) => {
    const t = scrollFor(indexOf("projects"), gallery.progressFor(i));
    if (Math.abs(t - window.scrollY) > vh * 6) jumpTo("projects", gallery.progressFor(i));
    else {
      window.scrollTo({ top: t, behavior: "smooth" });
      const projects = indexOf("projects");
      armedSection = projects;
      armedDir = t >= window.scrollY ? 1 : -1;
      seenSection = projects;
      seamHold = performance.now() + 1200;
    }
  };

  /* ---------- DOM controllers ---------- */
  const reveals = secs.map((s) =>
    Array.from(s.el.querySelectorAll<HTMLElement>(".rv")).map((el) => {
      const [a, b] = (el.dataset.show ?? "0,1").split(",").map(Number);
      return { el, a, b, on: false };
    })
  );

  const expEl = document.querySelector<HTMLElement>(".exp")!;
  const expDate = $("expDate");
  const expPanel = $("expPanel");
  const expSteps = Array.from($("expSteps").children) as HTMLElement[];
  const metricsEl = $("metrics");
  let jobShown = -1;
  let metricsCounted = false;

  const skUi = $("skillsUi");
  const skPanel = $("skPanel");
  const skTabs = Array.from($("skTabs").children) as HTMLButtonElement[];
  let skShown = -1;
  skTabs.forEach((b, i) => b.addEventListener("click", () => scrollToP(indexOf("stack"), towers.progressFor(i))));

  const wfItems = Array.from($("wfList").children) as HTMLElement[];
  let wfShown = -1;
  const solveCard = $("solveCard");
  const solveDots = Array.from($("solveDots").children) as HTMLElement[];
  let solveShown = -1;
  solveDots.forEach((b, i) => b.addEventListener("click", () => scrollToP(indexOf("solve"), solve.progressFor(i))));
  const exItems = Array.from($("exList").children) as HTMLElement[];
  let exShown = -1;
  exItems.forEach((li, i) => li.addEventListener("click", () => scrollToP(indexOf("exploring"), explore.progressFor(i))));
  const chapterBtns = Array.from(document.querySelectorAll<HTMLElement>("#chapters button"));
  $("galOpen").addEventListener("click", (e) => detail.open(lastProject, (e as MouseEvent).clientX, (e as MouseEvent).clientY));

  const galIntro = $("galIntro");
  const card = $("projectCard");
  const galNav = $("galNav");
  const galCount = $("galCount");
  let projShown = -1;
  let lastProject = 0;
  $("galPrev").addEventListener("click", () => goToProject(Math.max(0, lastProject - 1)));
  $("galNext").addEventListener("click", () => goToProject(Math.min(PROJECTS.length - 1, lastProject + 1)));
  $("galAll").addEventListener("click", () => $<HTMLDialogElement>("projectsDialog").showModal());

  const achItems = Array.from($("achList").children) as HTMLElement[];
  let achShown = -1;

  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("#navList a"));
  const navFor: Record<string, string> = {
    stack: "stack", snapshot: "journey", journey: "journey", achievements: "journey",
    portal: "projects", projects: "projects", build: "build", solve: "build", impact: "build", exploring: "build",
    contact: "contact", outro: "contact",
  };
  const hudNum = $("hudNum"), hudLabel = $("hudLabel"), hudFill = $("hudFill");
  let hudIdx = -1;

  function updateDom(idx: number, p: number) {
    const s = secs[idx];
    // generic reveals use the "sticky" progress (0..1 while the panel is pinned)
    secs.forEach((sec, i) => {
      const pd = sec.h > vh ? clamp01((sy - sec.top) / (sec.h - vh)) : 0;
      const near = Math.abs(i - idx) <= 1;
      for (const r of reveals[i]) {
        const on = near && pd >= r.a && pd <= r.b && (i === idx || (pd > 0 && pd < 1));
        if (on !== r.on) {
          r.on = on;
          r.el.classList.toggle("on", on);
        }
      }
    });

    // experience
    const expActive = s.id === "journey";
    const jp = timeline.jobPosition(p);
    const job = Math.round(jp);
    const showJob = expActive && p > 0.05 && p < 0.58 && Math.abs(jp - job) < 0.16;
    const eduEl = $("careerEdu");
    eduEl.classList.toggle("on", expActive && p > 0.64 && p < 0.98);
    eduEl.setAttribute("aria-hidden", eduEl.classList.contains("on") ? "false" : "true");
    expEl.classList.toggle("on", showJob);
    if (showJob && job !== jobShown) {
      const first = jobShown < 0;
      jobShown = job;
      const apply = () => {
        const j = EXPERIENCE[job];
        expDate.querySelector(".d-start")!.textContent = j.start;
        expDate.querySelector(".d-end")!.textContent = j.end;
        expPanel.innerHTML = jobPanel(job);
        splitText(expPanel);
        expSteps.forEach((el, i) => el.classList.toggle("on", i === job));
        expEl.classList.remove("swap");
      };
      if (first) apply();
      else {
        expEl.classList.add("swap");
        setTimeout(apply, 260);
      }
    }
    if (!expActive) jobShown = -1;

    // impact counters
    const showMetrics = s.id === "impact" && p > 0.14;
    if (showMetrics && !metricsCounted) {
      metricsCounted = true;
      metricsEl.querySelectorAll<HTMLElement>("b[data-to]").forEach((b) => countUp(b, reduced));
    }
    if (s.id !== "impact") metricsCounted = false;

    // how I build: walk the workflow steps
    if (s.id === "build") {
      const i = Math.min(wfItems.length - 1, Math.max(-1, Math.floor(((p - 0.12) / 0.82) * wfItems.length)));
      if (i !== wfShown) {
        wfShown = i;
        wfItems.forEach((li, k) => {
          li.classList.toggle("on", k === i);
          li.classList.toggle("done", k < i);
        });
        if (i >= 0) sound.tick(1 + i * 0.08);
      }
    }

    // how I solve problems
    if (s.id === "solve") {
      const i = solve.index;
      if (i !== solveShown) {
        const first = solveShown < 0;
        solveShown = i;
        solveDots.forEach((d, k) => d.classList.toggle("on", k === i));
        const apply = () => {
          solveCard.innerHTML = solvePanel(i);
          solveCard.classList.remove("swap");
        };
        if (first) apply();
        else {
          solveCard.classList.add("swap");
          setTimeout(apply, 220);
        }
      }
      solveCard.style.setProperty("--solved", solve.solved.toFixed(3));
    } else solveShown = -1;

    // currently exploring
    if (s.id === "exploring") {
      const i = p > 0.14 ? explore.active : -1;
      if (i !== exShown) {
        exShown = i;
        exItems.forEach((li, k) => li.classList.toggle("on", k === i));
      }
    }

    // gallery room sound
    sound.setRoom(s.id === "projects" ? 1 : 0);

    // skills
    const skActive = s.id === "stack" && p > 0.27 && p < 0.985;
    skUi.classList.toggle("on", skActive);
    if (s.id === "stack" && towers.active !== skShown && p > 0.26) {
      const i = towers.active;
      skShown = i;
      skTabs.forEach((b, k) => b.setAttribute("aria-selected", String(k === i)));
      skPanel.classList.add("swap");
      setTimeout(() => {
        skPanel.innerHTML = skillPanel(i);
        splitText(skPanel);
        skPanel.classList.remove("swap");
      }, 180);
    }

    // gallery
    const galActive = s.id === "projects";
    galIntro.classList.toggle("on", galActive && gallery.position < 0.45 && p > 0.005);
    const a = galActive ? gallery.active : -1;
    card.classList.toggle("on", a >= 0 && gallery.zoom < 0);
    galNav.classList.toggle("on", galActive && gallery.zoom < 0 && gallery.position > 0.6 && gallery.position < PROJECTS.length + 0.5);
    if (a >= 0 && a !== projShown) {
      if (projShown >= 0 || lastProject !== a) sound.whoosh(0.55, true);
      projShown = a;
      lastProject = a;
      card.innerHTML = projectCard(PROJECTS[a], a, PROJECTS.length);
      enhanceText(card);
      splitText(card);
      card.classList.toggle("side-left", gallery.exhibits[a].side === 1);
      galCount.textContent = `${String(a + 1).padStart(2, "0")} / ${PROJECTS.length}`;
    }
    if (galActive && a < 0) {
      const near = Math.min(PROJECTS.length - 1, Math.max(0, Math.round(gallery.position) - 1));
      lastProject = near;
      projShown = -1;
    }

    // achievements
    if (s.id === "achievements") {
      const i = p > 0.18 ? wire.indexFor(p) : -1;
      if (i !== achShown) {
        achShown = i;
        achItems.forEach((li, k) => li.classList.toggle("on", k === i));
      }
    }

    // nav + HUD
    if (idx !== hudIdx) {
      hudIdx = idx;
      const ch = s.el.dataset.ch ?? String(idx + 1).padStart(2, "0");
      hudNum.textContent = ch;
      hudLabel.textContent = s.label;
      const key = navFor[s.id];
      navLinks.forEach((l) => l.classList.toggle("active", l.dataset.jump === key));
      chapterBtns.forEach((b) => b.classList.toggle("active", b.dataset.ch === ch));
    }
    hudFill.style.width = `${(p * 100).toFixed(1)}%`;
  }

  /* ---------- resize ---------- */
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const w = window.innerWidth, h = window.innerHeight;
      // ignore mobile URL-bar height jitter
      if (w === ctx.width && Math.abs(h - ctx.height) < 120) return;
      const ratio = window.scrollY / Math.max(1, document.documentElement.scrollHeight - vh);
      ctx.width = w;
      ctx.height = h;
      ctx.aspect = w / h;
      camera.aspect = ctx.aspect;
      camera.updateProjectionMatrix();
      gl.resize(w, h);
      secs.forEach((s) => s.stage.resize());
      lockGalaxy.resize();
      heroComet.setPixelScale(pxScale());
      flyComet.setPixelScale(pxScale());
      layout();
      window.scrollTo(0, ratio * (document.documentElement.scrollHeight - vh));
      sy = window.scrollY;
    }, 150);
  });

  /* ---------- main loop ---------- */
  let current: Stage = intro;
  let lastIdx = 0;
  let scrollVel = 0;
  let portalHit = false;
  const MOOD: Record<string, number> = {
    hero: 0.5, stack: 0.68, snapshot: 0.5, journey: 0.62, achievements: 0.8, portal: 0.95, projects: 0.78,
    build: 0.62, solve: 0.85, impact: 0.72, exploring: 0.66, contact: 0.4, outro: 0.32,
  };
  let last = performance.now();
  let bloomStrength = intro.bloom;
  let exposure = 1;

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.time += dt;
    ctx.pointer.x = damp(ctx.pointer.x, pointerTarget.x, 3, dt);
    ctx.pointer.y = damp(ctx.pointer.y, pointerTarget.y, 3, dt);

    if (lockShown && !document.body.classList.contains("show-flat") && !document.body.classList.contains("warping")) updateLock(dt);
    if (mode === "open" && now - lastActivity > IDLE_MS && !detail.isOpen) lockNow();
    updateHold();

    // the project page covers everything: pause the 3D world, keep the music going softly
    if (detail.isOpen) {
      sound.setIntensity(0.45);
      sound.setRoom(0.3);
      requestAnimationFrame(frame);
      return;
    }

    // The 2D page covers the WebGL view. Drawing the scene underneath only makes the pointer feel heavy.
    if (document.body.classList.contains("show-flat") && !document.body.classList.contains("warping")) {
      requestAnimationFrame(frame);
      return;
    }

    // After the user enters a section, play through it and stop before the next one.
    {
      const y = window.scrollY;
      let at = 0;
      for (let i = 0; i < secs.length; i++) if (y >= secs[i].start) at = i;
      if (seenSection < 0) seenSection = at;
      else if (seamUser && now <= seamHold && at !== seenSection) {
        armedSection = at;
        armedDir = seamDir;
        seenSection = at;
      }
      if (now > seamHold) seamUser = false;
      const touring =
        armedSection === at &&
        mode === "open" && !lockShown && !reduced && !detail.isOpen &&
        document.body.classList.contains("ready") &&
        !document.body.classList.contains("show-flat") &&
        !document.body.classList.contains("warping") &&
        now > seamHold && scrollVel < vh * 1.2;
      if (touring) {
        const sec = secs[at];
        const span = Math.max(1, sec.end - sec.start);
        const lead = Math.min(vh * 0.42, span * 0.16);
        const dest = armedDir > 0 ? (at < secs.length - 1 ? sec.end - lead : sec.end) : sec.start + lead;
        const left = dest - y;
        if (armedDir > 0 && left > 1) window.scrollTo(0, y + Math.min(left, vh * 0.34 * dt));
        else if (armedDir < 0 && left < -1) window.scrollTo(0, y + Math.max(left, -vh * 0.34 * dt));
        else armedSection = -1;
      }
    }

    // smoothed scroll drives everything
    const target = window.scrollY;
    const prevSy = sy;
    sy = reduced ? target : damp(sy, target, 7, dt);
    if (Math.abs(sy - target) < 0.5) sy = target;
    scrollVel = damp(scrollVel, Math.abs(sy - prevSy) / Math.max(dt, 1e-3), 3, dt);

    let idx = 0;
    for (let i = 0; i < secs.length; i++) if (sy >= secs[i].start) idx = i;
    const s = secs[idx];
    const p = clamp01((sy - s.start) / (s.end - s.start));
    lastP = p;

    if (s.stage !== current) {
      current = s.stage;
      current.activate();
      gallery.zoom = -1;
      showHoverCard(-1, 0, 0);
      // cinematic hit on every chapter change (the portal → gallery hand-off has its own impact)
      if (mode === "open" && !(current === gallery && lastIdx === indexOf("portal"))) {
        sound.transition(idx > lastIdx ? 1 : 0.7);
        flyby(current.scene, idx > lastIdx);
      }
    }
    lastIdx = idx;

    // the lock screen replaces whatever scene is behind it
    const view: Stage = lockShown ? lockGalaxy : current;
    camera.fov = 50;
    view.update(lockShown ? 0 : p, dt);
    camera.updateProjectionMatrix();

    // transitions
    const fadeZone = vh * 0.5;
    let fade = 0;
    let flash = 0;
    if (!lockShown) {
      if (s.fadeIn === "black") fade = Math.max(fade, 1 - smooth(clamp01((sy - s.start) / fadeZone)));
      if (s.fadeOut === "black") fade = Math.max(fade, 1 - smooth(clamp01((s.end - sy) / fadeZone)));
      if (current === portal) flash = portal.flash;
      if (current === gallery) flash = gallery.flash;
    }
    if (current === portal && portal.flash > 0.6 && !portalHit && mode === "open") {
      portalHit = true;
      sound.transition(1.4);
      sound.impact(1.2);
    }
    if (portal.flash < 0.2) portalHit = false;

    // adaptive soundtrack: scene mood + how fast you're moving
    const base = lockShown ? 0.12 : (MOOD[s.id] ?? 0.4);
    sound.setIntensity(base + Math.min(0.35, scrollVel / (vh * 3)));

    const u = gl.final.uniforms;
    u.uFade.value = Math.max(fade, trans.fade);
    u.uFlash.value = Math.max(reduced ? 0 : flash, trans.flash * (reduced ? 0.4 : 1));
    u.uTime.value = ctx.time;
    bloomStrength = damp(bloomStrength, view.bloom, 4, dt);
    bloomKick = damp(bloomKick, 0, 3.5, dt);
    gl.bloom.strength = bloomStrength + bloomKick;
    gl.bloom.threshold = view.bloomThreshold;
    exposure = damp(exposure, view.exposure, 4, dt);
    gl.renderer.toneMappingExposure = exposure;

    updateCarve();
    heroComet.update(dt);
    flyComet.update(dt);
    view.applyFx(dt);
    gl.render(view.scene, dt);
    view.restoreFx();
    if (mode === "open" && !lockShown) updateDom(idx, p);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // expose for automated visual checks
  (window as any).__portfolio = {
    secs,
    scrollFor,
    finish: () => {},
    unlock: () => {
      if (mode === "locked" && !unlocking && lockShown) {
        lockHold = 1;
        unlock();
      }
    },
    lock: () => lockNow(),
    state: () => ({ loaderDone: true, mode, lockShown }),
    gl,
    symbols,
    frameScreen: (i: number) => {
      const v = gallery.exhibits[i].group.getWorldPosition(new THREE.Vector3()).project(camera);
      return { x: ((v.x + 1) / 2) * innerWidth, y: ((1 - v.y) / 2) * innerHeight };
    },
    debug: () => ({
      cam: camera.position.toArray(),
      fov: camera.fov,
      fade: gl.final.uniforms.uFade.value,
      flash: gl.final.uniforms.uFlash.value,
      bloom: gl.bloom.strength,
      exposure: gl.renderer.toneMappingExposure,
      idx: secs.findIndex((s) => s.stage === current),
    }),
  };
}
