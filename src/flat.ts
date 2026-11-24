import "./flat.css";
import { ACHIEVEMENTS, CATEGORIES, EXPERIENCE, PROFILE, PROJECTS, SKILLS, STRENGTHS } from "./data";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const cube = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 20.5 7.2v9.6L12 21.5 3.5 16.8V7.2L12 2.5Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 12.2 20.5 7.2M12 12.2 3.5 7.2M12 12.2V21.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
const glyph = (d: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON = {
  work: glyph("M4 20V8l8-4 8 4v12M9 20v-6h6v6"),
  cal: glyph("M7 3.5v3M17 3.5v3M4 10h16M6 6h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"),
  pin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="10" r="2.1" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
  cap: glyph("M3 10 12 5l9 5-9 5-9-5zM7 12.2V16c0 1.2 2.2 2.8 5 2.8s5-1.6 5-2.8v-3.8"),
};

const enterBtn = (label: string, extra = "") =>
  `<button type="button" class="flat-3d ${extra}" data-enter-3d>${cube}<span>${label}</span></button>`;

const root = document.getElementById("flat");
if (root) {
  document.body.classList.add("show-flat");
  const [lead, ...rest] = PROFILE.summary;

  root.innerHTML = `
    <canvas class="flat-stars" aria-hidden="true"></canvas>
    <header class="flat-bar">
      <a class="flat-brand" href="#flat-home">Colby<span>.</span>Bean</a>
      <nav class="flat-nav" aria-label="Portfolio">
        <a href="#flat-home">Home</a>
        <a href="#flat-about">About</a>
        <a href="#flat-projects">Project</a>
        <a href="#flat-skills">Skills</a>
        <a href="#flat-experience">Experience</a>
        <a href="#flat-contact">Contact</a>
      </nav>
      ${enterBtn("3D")}
    </header>

    <main>
      <section id="flat-home" class="flat-hero">
        <div class="flat-intro">
          <p class="flat-hello">Hey there, I'm</p>
          <h1>${esc(PROFILE.displayName)}</h1>
          <p class="flat-role">${esc(PROFILE.title)}</p>
          <p class="flat-lead">${esc(PROFILE.tagline)}</p>
          <div class="flat-actions">
            <a class="flat-primary" href="#flat-projects">View Projects</a>
            <a class="flat-dark" href="${esc(PROFILE.resume)}" download>Resume</a>
          </div>
        </div>
        <figure class="flat-stage">
          <div class="flat-shift">
            <img src="flat/workspace.jpg" alt="Developer workspace with frontend, backend, database, cloud, and AI tools" />
          </div>
        </figure>
      </section>

      <section id="flat-about" class="flat-block">
        <div class="flat-head flat-reveal">
          <p class="flat-kicker">About</p>
          <h2>About Me</h2>
        </div>
        <div class="flat-about">
          <article class="flat-story flat-reveal">
            <p class="flat-pull">${esc(lead)}</p>
            ${rest.map((p) => `<p>${esc(p)}</p>`).join("")}
          </article>
          <aside class="flat-identity flat-reveal">
            <article>
              <p class="flat-kicker">Based in</p>
              <b>${esc(PROFILE.location)}</b>
              <span>Open to full-time and contract</span>
            </article>
            <ul class="flat-stats">
              <li><b>7+</b><span>Years building software</span></li>
              <li><b>${EXPERIENCE.length}</b><span>Companies</span></li>
              <li><b>${PROJECTS.length}</b><span>Shipped projects</span></li>
            </ul>
          </aside>
        </div>
        <div class="flat-focus">
          ${STRENGTHS.map((s) => `
            <article class="flat-reveal">
              <h3>${esc(s.title)}</h3>
              <p>${esc(s.text)}</p>
            </article>`).join("")}
        </div>
        <div class="flat-impact">
          ${ACHIEVEMENTS.slice(0, 3).map((a) => `
            <article class="flat-reveal">
              <b>${esc(a.title.replace(/.*?(\d+%).*/, "$1"))}</b>
              <h3>${esc(a.title)}</h3>
              <p>${esc(a.text)}</p>
            </article>`).join("")}
        </div>
      </section>

      <section id="flat-projects" class="flat-block">
        <div class="flat-head flat-reveal">
          <p class="flat-kicker">Project</p>
          <h2>Selected projects</h2>
        </div>
        <div class="flat-grid">
          ${PROJECTS.map((p, i) => `
            <button type="button" class="flat-card flat-reveal" data-project="${i}">
              <img src="projects/${esc(p.slug)}/thumb.jpg" alt="" />
              <div>
                <p class="flat-kicker">${String(i + 1).padStart(2, "0")} · ${esc(CATEGORIES[p.cat])}</p>
                <h3>${esc(p.name)}</h3>
                <p>${esc(p.sub)}</p>
              </div>
            </button>`).join("")}
        </div>
      </section>

      <section id="flat-skills" class="flat-block">
        <div class="flat-head flat-reveal">
          <p class="flat-kicker">Skills</p>
          <h2>What I work with</h2>
        </div>
        <div class="flat-skills">
          ${SKILLS.map((g) => `
            <article class="flat-reveal" style="--c:${g.color}">
              <h3>${esc(g.name)}</h3>
              <ul>${g.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
            </article>`).join("")}
        </div>
      </section>

      <section id="flat-experience" class="flat-block">
        <div class="flat-head flat-center flat-reveal">
          <p class="flat-kicker">Experience</p>
          <h2>My Experience</h2>
          <p>Professional experience and education</p>
        </div>
        <h3 class="flat-work-label flat-reveal">Work Experience</h3>
        <ol class="flat-timeline">
          ${EXPERIENCE.map((job) => `
            <li>
              <article class="flat-job flat-reveal">
                <h3>${esc(job.title)}</h3>
                <p class="flat-job-co">${ICON.work}<span>${esc(job.company)}</span></p>
                <p class="flat-job-meta">
                  <span>${ICON.cal}${esc(job.start)} – ${esc(job.end)}</span>
                  <span>${ICON.pin}${esc(job.type)}</span>
                </p>
                <p>${esc(job.summary)}</p>
                <ul>${job.points.map((point) => `<li>${esc(point)}</li>`).join("")}</ul>
                <div class="flat-tags">${job.stack.map((s) => `<span>${esc(s)}</span>`).join("")}</div>
              </article>
            </li>`).join("")}
        </ol>
        <div class="flat-edu">
          <p class="flat-edu-label flat-reveal">${ICON.cap}<span>Education</span></p>
          <div class="flat-edu-grid">
            <div class="flat-campus flat-reveal" data-campus>
              <div class="flat-campus-frame" tabindex="0" aria-label="University of Florida campus photos">
                <img data-campus-img alt="" />
                <button type="button" class="flat-campus-nav prev" data-campus-prev aria-label="Previous photo">‹</button>
                <button type="button" class="flat-campus-nav next" data-campus-next aria-label="Next photo">›</button>
                <div class="flat-campus-dots" data-campus-dots></div>
                <span class="flat-campus-count" data-campus-count>1/8</span>
              </div>
              <p class="flat-campus-cap" data-campus-cap></p>
            </div>
            <article class="flat-degree flat-reveal">
              <div>
                <h3>${esc(PROFILE.education.degree)}</h3>
                <p class="flat-school">${esc(PROFILE.education.school)}</p>
                <p class="flat-degree-meta">
                  <span>${ICON.cal}${esc(PROFILE.education.years)}</span>
                  <span>${ICON.pin}Gainesville, FL</span>
                </p>
              </div>
              <img class="flat-mark" src="flat/University/University%20of%20Florida%20Seal%20Line%20Art.png" alt="University of Florida seal" />
            </article>
          </div>
        </div>
      </section>

      <section id="flat-contact" class="flat-block flat-contact flat-reveal">
        <div>
          <p class="flat-kicker">Contact</p>
          <h2>Let's talk</h2>
          <p>${esc(PROFILE.email)}</p>
          <div class="flat-actions">
            <a class="flat-ghost" href="mailto:${esc(PROFILE.email)}">Email</a>
            <a class="flat-ghost" href="${esc(PROFILE.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
            <a class="flat-ghost" href="${esc(PROFILE.github)}" target="_blank" rel="noopener">GitHub</a>
            <a class="flat-ghost" href="${esc(PROFILE.resume)}" download>Resume</a>
          </div>
        </div>
        ${enterBtn("Open the 3D portfolio", "flat-3d-lg")}
      </section>
    </main>
    <dialog class="flat-modal" id="flat-modal">
      <button type="button" class="flat-modal-x" data-close-modal aria-label="Close">×</button>
      <img class="flat-modal-img" alt="" />
      <div class="flat-modal-body">
        <p class="flat-kicker" data-modal="kicker"></p>
        <h2 data-modal="title"></h2>
        <p class="flat-modal-sub" data-modal="sub"></p>
        <h3>Summary</h3>
        <p data-modal="summary"></p>
        <h3>What I did</h3>
        <p data-modal="role"></p>
        <h3>Skills used</h3>
        <ul class="flat-modal-skills" data-modal="skills"></ul>
        <a class="flat-live" data-modal="live" target="_blank" rel="noopener">Live Site</a>
      </div>
    </dialog>
  `;

  const show3d = () => {
    document.body.classList.remove("show-flat");
    root.setAttribute("aria-hidden", "true");
  };
  const show2d = () => {
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("show-flat");
  };

  const warp = document.createElement("div");
  warp.id = "warp";
  warp.setAttribute("aria-hidden", "true");
  warp.innerHTML = `<canvas></canvas><p class="warp-label"><span data-warp-kicker>Entering</span><b data-warp-title>3D</b></p>`;
  document.body.appendChild(warp);
  const warpCanvas = warp.querySelector("canvas")!;
  const warpCtx = warpCanvas.getContext("2d")!;
  const stars = Array.from({ length: 160 }, () => ({
    a: Math.random() * 2 - 1,
    b: Math.random() * 2 - 1,
    z: Math.random(),
    violet: Math.random() > 0.72,
  }));
  let warpFrame = 0;
  let warping = false;

  const paintWarp = (t: number) => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = warpCanvas.width;
    const h = warpCanvas.height;
    const ctx = warpCtx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const vw = w / dpr;
    const vh = h / dpr;
    ctx.clearRect(0, 0, vw, vh);
    const master = t < 0.1 ? t / 0.1 : t > 0.84 ? Math.max(0, (1 - t) / 0.16) : 1;
    const cover = master * (t < 0.3 ? t / 0.3 : t > 0.68 ? Math.max(0, (1 - t) / 0.32) : 1);
    const cx = vw * 0.5;
    const cy = vh * 0.46;
    const sky = ctx.createRadialGradient(cx, cy, 0, cx, cy, vw * 0.72);
    sky.addColorStop(0, `rgba(28, 22, 72, ${0.2 * cover})`);
    sky.addColorStop(0.42, `rgba(6, 8, 22, ${0.72 * cover})`);
    sky.addColorStop(1, `rgba(3, 3, 12, ${0.94 * cover})`);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, vw, vh);

    const drawHalf = (up: boolean) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, up ? 0 : cy, vw, up ? cy : vh - cy);
      ctx.clip();
      const dir = up ? -1 : 1;
      const shift = (t * 1.65) % 1;
      for (let i = 0; i < 18; i++) {
        const z = (i + shift) / 18;
        const eased = z * z * (3 - 2 * z);
        const y = cy + dir * Math.pow(eased, 1.35) * vh * 0.62;
        const half = vw * (0.015 + eased * 1.25);
        ctx.strokeStyle = `rgba(${up ? "150, 140, 255" : "120, 220, 255"}, ${(0.05 + eased * 0.4) * master})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - half, y);
        ctx.lineTo(cx + half, y);
        ctx.stroke();
      }
      for (let i = -16; i <= 16; i++) {
        ctx.strokeStyle = `rgba(150, 170, 255, ${0.16 * master})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + i * vw * 0.085, up ? -20 : vh + 20);
        ctx.stroke();
      }
      ctx.restore();
    };
    drawHalf(false);
    drawHalf(true);

    for (const s of stars) {
      const z = ((s.z - t * 1.15) % 1 + 1) % 1;
      const depth = 0.06 + z;
      const next = depth + 0.07;
      const x = cx + (s.a / depth) * vw * 0.46;
      const y = cy + (s.b / depth) * vh * 0.46;
      const px = cx + (s.a / next) * vw * 0.46;
      const py = cy + (s.b / next) * vh * 0.46;
      if (x < -80 || x > vw + 80 || y < -80 || y > vh + 80) continue;
      const alpha = Math.min(0.95, (1 - z) * 0.95);
      ctx.strokeStyle = s.violet ? `rgba(196, 181, 253, ${alpha * master})` : `rgba(186, 240, 255, ${alpha * master})`;
      ctx.lineWidth = (1 - z) * 2.4 + 0.4;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    const pass = t < 0.46 ? t / 0.46 : (t - 0.46) / 0.54;
    const eased = t < 0.46 ? pass * pass * (3 - 2 * pass) : 1 - (1 - pass) ** 3;
    const scale = t < 0.46 ? 1.5 - eased * 1.28 : 0.18 + eased * 2.45;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.6);
    ctx.scale(scale, scale * 0.72);
    ctx.globalAlpha = master;
    ctx.strokeStyle = "rgba(196, 181, 253, 0.95)";
    ctx.lineWidth = 2.4 / Math.max(scale, 0.2);
    ctx.shadowColor = "rgba(34, 211, 238, 0.85)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.ellipse(0, 0, vw * 0.22, vh * 0.22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(103, 232, 249, 0.8)";
    ctx.beginPath();
    ctx.ellipse(0, 0, vw * 0.16, vh * 0.16, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const flash = Math.sin(Math.min(1, Math.max(0, (t - 0.4) / 0.26)) * Math.PI);
    if (flash > 0) {
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, vw * 0.32);
      glow.addColorStop(0, `rgba(230, 250, 255, ${flash * 0.55 * master})`);
      glow.addColorStop(1, "rgba(230, 250, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, vw, vh);
    }
  };

  const travel = (to: "2d" | "3d") => {
    document.querySelector<HTMLDialogElement>("#flat-modal")?.close();
    document.querySelector<HTMLDialogElement>("#projectsDialog")?.close();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || warping) {
      if (!warping) (to === "3d" ? show3d : show2d)();
      return;
    }
    warping = true;
    const title = warp.querySelector("[data-warp-title]");
    if (title) title.textContent = to === "3d" ? "3D" : "2D";
    const dpr = Math.min(2, devicePixelRatio || 1);
    warpCanvas.width = Math.round(innerWidth * dpr);
    warpCanvas.height = Math.round(innerHeight * dpr);
    document.body.classList.add("warping", to === "3d" ? "warp-from-2d" : "warp-from-3d");
    warp.classList.remove("is-on");
    void warp.offsetWidth;
    warp.classList.add("is-on");
    const started = performance.now();
    const dur = 1560;
    let swapped = false;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / dur);
      paintWarp(t);
      if (!swapped && now - started >= 540) {
        swapped = true;
        document.body.classList.remove("warp-from-2d", "warp-from-3d");
        (to === "3d" ? show3d : show2d)();
        document.body.classList.add(to === "3d" ? "warp-to-3d" : "warp-to-2d");
      }
      if (t < 1) warpFrame = requestAnimationFrame(tick);
      else {
        warp.classList.remove("is-on");
        document.body.classList.remove("warping", "warp-from-2d", "warp-from-3d", "warp-to-2d", "warp-to-3d");
        warping = false;
      }
    };
    cancelAnimationFrame(warpFrame);
    warpFrame = requestAnimationFrame(tick);
  };

  root.querySelectorAll("[data-enter-3d]").forEach((btn) => btn.addEventListener("click", () => travel("3d")));
  document.querySelectorAll("[data-enter-2d]").forEach((btn) => btn.addEventListener("click", () => travel("2d")));

  const modal = root.querySelector<HTMLDialogElement>("#flat-modal");
  const modalSet = (key: string, value: string) => {
    const node = modal?.querySelector(`[data-modal="${key}"]`);
    if (node) node.textContent = value;
  };
  const openProject = (index: number) => {
    const project = PROJECTS[index];
    if (!modal || !project) return;
    const img = modal.querySelector<HTMLImageElement>(".flat-modal-img");
    if (img) img.src = `projects/${project.slug}/thumb.jpg`;
    modalSet("kicker", CATEGORIES[project.cat]);
    modalSet("title", project.name);
    modalSet("sub", project.sub);
    modalSet("summary", project.summary);
    modalSet("role", project.role);
    const live = modal.querySelector<HTMLAnchorElement>("[data-modal='live']");
    if (live) live.href = project.url;
    const skills = modal.querySelector("[data-modal='skills']");
    if (skills) {
      skills.innerHTML = project.tags.map((tag) => `<li>${skillIcon(tag)}<span>${esc(tag)}</span></li>`).join("");
    }
    if (!modal.open) modal.showModal();
  };
  root.querySelectorAll<HTMLButtonElement>("[data-project]").forEach((btn) => {
    btn.addEventListener("click", () => openProject(Number(btn.dataset.project)));
  });
  modal?.querySelector("[data-close-modal]")?.addEventListener("click", () => modal.close());
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });

  const sky = root.querySelector<HTMLCanvasElement>(".flat-stars");
  if (sky) paintStars(sky);

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shift = root.querySelector<HTMLElement>(".flat-shift");
  const reveals = [...root.querySelectorAll<HTMLElement>(".flat-reveal")];
  if (!reduced) {
    root.classList.add("is-open");
    for (const el of reveals) {
      const group = el.parentElement?.querySelectorAll(":scope > .flat-reveal");
      const index = group ? [...group].indexOf(el) : 0;
      el.style.transitionDelay = `${Math.min(Math.max(index, 0), 6) * 80}ms`;
    }
  }
  const showReached = () => {
    if (reduced) return;
    const limit = root.getBoundingClientRect().bottom - 36;
    for (const el of reveals) {
      if (el.classList.contains("is-in")) continue;
      if (el.getBoundingClientRect().top < limit) {
        el.classList.add("is-in");
        el.addEventListener("transitionend", () => { el.style.transitionDelay = ""; }, { once: true });
      }
    }
  };

  const links = [...root.querySelectorAll<HTMLAnchorElement>(".flat-nav a")];
  const watch = links.flatMap((a) => {
    const el = root.querySelector<HTMLElement>(a.getAttribute("href") ?? "");
    return el ? [{ a, el }] : [];
  });
  const mark = () => {
    const line = root.scrollTop + 140;
    let current = watch[0];
    for (const item of watch) if (item.el.offsetTop <= line) current = item;
    for (const link of links) link.classList.toggle("is-on", link === current?.a);
    if (shift && !reduced) shift.style.transform = `translateY(${Math.min(root.scrollTop, 420) * 0.1}px)`;
    showReached();
  };
  root.addEventListener("scroll", mark, { passive: true });
  mark();
}

const CAMPUS = [
  { src: "flat/University/2.jpg", name: "Campus" },
  { src: "flat/University/3.jpg", name: "Century Tower" },
  { src: "flat/University/4.jpg", name: "Lecture hall" },
  { src: "flat/University/5.jpg", name: "Campus" },
  { src: "flat/University/6.jpg", name: "Campus" },
  { src: "flat/University/7.jpg", name: "Ben Hill Griffin Stadium" },
  { src: "flat/University/8.jpg", name: "Commencement" },
  { src: "flat/University/1.jpg", name: "University of Florida", contain: true },
];

const photoWindow = document.createElement("dialog");
photoWindow.className = "photo-window";
photoWindow.innerHTML = `<button type="button" class="photo-window-x" aria-label="Close">×</button><img alt="" /><p></p>`;
document.body.appendChild(photoWindow);
const photoImg = photoWindow.querySelector("img")!;
const photoCap = photoWindow.querySelector("p")!;
photoWindow.querySelector("button")!.addEventListener("click", () => photoWindow.close());
photoWindow.addEventListener("click", (event) => {
  if (event.target === photoWindow) photoWindow.close();
});
function openPhoto(src: string, alt: string, caption: string) {
  photoImg.src = src;
  photoImg.alt = alt;
  photoCap.textContent = caption;
  if (!photoWindow.open) photoWindow.showModal();
}

function mountCampus(block: HTMLElement) {
  const frame = block.querySelector<HTMLElement>(".flat-campus-frame");
  const img = block?.querySelector<HTMLImageElement>("[data-campus-img]");
  const cap = block?.querySelector("[data-campus-cap]");
  const count = block?.querySelector("[data-campus-count]");
  const dots = block?.querySelector("[data-campus-dots]");
  if (!block || !frame || !img || !cap || !count || !dots) return;
  let index = 0;
  const show = (next: number) => {
    index = (next + CAMPUS.length) % CAMPUS.length;
    const shot = CAMPUS[index];
    img.style.opacity = "0";
    img.style.objectFit = shot.contain ? "contain" : "cover";
    img.style.background = shot.contain ? "#fff" : "transparent";
    img.onload = () => { img.style.opacity = "1"; };
    img.src = shot.src;
    img.alt = shot.name === "University of Florida" ? shot.name : `${shot.name}, University of Florida`;
    cap.textContent = shot.name === "University of Florida" ? shot.name : `University of Florida · ${shot.name}`;
    count.textContent = `${index + 1}/${CAMPUS.length}`;
    dots.querySelectorAll("button").forEach((dot, i) => dot.classList.toggle("is-on", i === index));
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timer = 0;
  const play = () => {
    window.clearInterval(timer);
    if (reduced) return;
    const onFlat = !!block.closest("#flat");
    timer = window.setInterval(() => {
      const flatOpen = document.body.classList.contains("show-flat");
      if (onFlat ? flatOpen : !flatOpen) show(index + 1);
    }, 2000);
  };
  const userShow = (next: number) => {
    show(next);
    play();
  };
  dots.innerHTML = CAMPUS.map((_, i) => `<button type="button" aria-label="Photo ${i + 1}"></button>`).join("");
  dots.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest("button");
    if (!button) return;
    userShow([...dots.children].indexOf(button));
  });
  block.querySelector("[data-campus-prev]")?.addEventListener("click", () => userShow(index - 1));
  block.querySelector("[data-campus-next]")?.addEventListener("click", () => userShow(index + 1));
  frame.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") { event.preventDefault(); userShow(index + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); userShow(index - 1); }
    if (event.key === "Enter") { event.preventDefault(); openPhoto(img.src, img.alt, cap.textContent ?? ""); }
  });
  let startX = 0;
  let dragging = false;
  frame.addEventListener("pointerdown", (event) => {
    if ((event.target as HTMLElement).closest("button")) return;
    dragging = true;
    startX = event.clientX;
    frame.classList.add("is-pressed");
    frame.setPointerCapture(event.pointerId);
  });
  const release = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    frame.classList.remove("is-pressed");
    const delta = event.clientX - startX;
    if (delta > 48) userShow(index - 1);
    else if (delta < -48) userShow(index + 1);
    else if (!(event.target as HTMLElement).closest("button")) openPhoto(img.src, img.alt, cap.textContent ?? "");
  };
  frame.addEventListener("pointerup", release);
  frame.addEventListener("pointercancel", () => {
    dragging = false;
    frame.classList.remove("is-pressed");
  });
  show(0);
  play();
}

queueMicrotask(() => document.querySelectorAll<HTMLElement>("[data-campus]").forEach(mountCampus));

function skillIcon(name: string) {
  const n = name.toLowerCase();
  const draw = (d: string) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  if (/react|vue|angular|alpine/.test(n)) return draw("M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3zM12 12 4.5 7.2M12 12l7.5-4.8M12 12v9");
  if (/html|css|tailwind|responsive|liquid/.test(n)) return draw("M4 4h16v16H4zM8 9h8M8 13h5");
  if (/shopify|wordpress|elementor/.test(n)) return draw("M6 8h12l-1 12H7L6 8zM9 8V6a3 3 0 0 1 6 0v2");
  if (/sql|mysql|postgres|mongo|redis|database/.test(n)) return draw("M5 7c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5");
  if (/aws|docker|google|azure|cloud|kubernetes|terraform|railway|cloudflare/.test(n)) return draw("M7 17h10a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.5 1.6A3.4 3.4 0 0 0 7 17z");
  if (/ios|android|mobile|kotlin/.test(n)) return draw("M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 18h2");
  if (/gmail|oauth|klaviyo|attentive|clarity/.test(n)) return draw("M4 7h16v10H4zM4 7l8 6 8-6");
  return draw("M8 8 4 12l4 4M16 8l4 4-4 4M13 5l-2 14");
}

function paintStars(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const stars = Array.from({ length: 240 }, () => {
    const depth = Math.random();
    return {
      x: Math.random(),
      y: Math.random(),
      depth,
      r: 0.35 + depth * 1.5,
      a: 0.22 + depth * 0.58,
      tw: Math.random() * Math.PI * 2,
      tint: Math.random() < 0.2 ? "167, 220, 255" : Math.random() < 0.16 ? "196, 181, 253" : "255, 255, 255",
    };
  });
  const lights = [
    { x: 0.14, y: 0.16, r: 360, vx: 0.02, vy: 0.009, color: "99, 102, 241", a: 0.2, sprite: glowSprite("99, 102, 241", 0.2) },
    { x: 0.84, y: 0.1, r: 300, vx: -0.016, vy: 0.011, color: "34, 211, 238", a: 0.14, sprite: glowSprite("34, 211, 238", 0.14) },
    { x: 0.58, y: 0.78, r: 440, vx: 0.012, vy: -0.014, color: "139, 92, 246", a: 0.13, sprite: glowSprite("139, 92, 246", 0.13) },
    { x: 0.28, y: 0.52, r: 240, vx: -0.018, vy: 0.007, color: "103, 232, 249", a: 0.1, sprite: glowSprite("103, 232, 249", 0.1) },
  ];
  const streaks = [0, 1].map((i) => ({
    x: Math.random() * 0.7,
    y: Math.random() * 0.45,
    life: 0,
    wait: 1.4 + i * 2.2 + Math.random() * 2,
    len: 0.07 + Math.random() * 0.06,
    speed: 0.55 + Math.random() * 0.4,
  }));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fit = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  fit();
  addEventListener("resize", fit);

  const paint = (t: number, moving: boolean, dt: number) => {
    const w = innerWidth;
    const h = innerHeight;
    ctx.clearRect(0, 0, w, h);

    for (const light of lights) {
      if (moving) {
        light.x += light.vx * dt;
        light.y += light.vy * dt;
        if (light.x < -0.2 || light.x > 1.2) light.vx *= -1;
        if (light.y < -0.2 || light.y > 1.2) light.vy *= -1;
      }
      const gx = light.x * w;
      const gy = light.y * h;
      ctx.drawImage(light.sprite, gx - light.r, gy - light.r, light.r * 2, light.r * 2);
    }

    if (moving) {
      ctx.lineCap = "round";
      for (const streak of streaks) {
        if (streak.life <= 0) {
          streak.wait -= dt;
          if (streak.wait > 0) continue;
          streak.life = 1;
          streak.x = Math.random() * 0.72;
          streak.y = Math.random() * 0.5;
        }
        streak.life -= dt * streak.speed;
        const travel = 1 - Math.max(0, streak.life);
        const headX = (streak.x + travel * 0.4) * w;
        const headY = (streak.y + travel * 0.26) * h;
        const tailX = headX - streak.len * w;
        const tailY = headY - streak.len * h * 0.55;
        const fade = Math.sin(Math.min(1, Math.max(0, streak.life)) * Math.PI);
        const trail = ctx.createLinearGradient(tailX, tailY, headX, headY);
        trail.addColorStop(0, "rgba(186, 230, 253, 0)");
        trail.addColorStop(1, `rgba(236, 248, 255, ${0.9 * fade})`);
        ctx.strokeStyle = trail;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();
        if (streak.life <= 0) streak.wait = 6 + Math.random() * 8;
      }
    }

    for (const star of stars) {
      if (moving) {
        const speed = 0.015 + star.depth * 0.034;
        star.y -= speed * dt;
        star.x += (0.005 + star.depth * 0.014) * dt;
        if (star.y < -0.04) {
          star.y = 1.04;
          star.x = Math.random();
        }
        if (star.x > 1.04) star.x = -0.04;
      }
      const alpha = moving ? star.a * (0.38 + 0.62 * (0.5 + 0.5 * Math.sin(t * 0.0016 + star.tw))) : star.a;
      const x = star.x * w;
      const y = star.y * h;
      if (star.depth > 0.82) {
        ctx.fillStyle = `rgba(${star.tint}, ${alpha * 0.28})`;
        ctx.beginPath();
        ctx.arc(x, y, star.r * 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(${star.tint}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  if (reduced) {
    paint(0, false, 0);
    return;
  }

  let last = performance.now();
  let backlog = 0;
  const draw = (t: number) => {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    if (!document.hidden) {
      const live = document.body.classList.contains("show-flat") || document.body.classList.contains("warping");
      if (live) {
        backlog = 0;
        paint(t, true, dt);
      } else {
        // Hidden behind the 3D view: the sky texture only samples this about 20 times a second.
        backlog += dt;
        if (backlog >= 0.05) {
          paint(t, true, backlog);
          backlog = 0;
        }
      }
    }
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}

function glowSprite(color: string, alpha: number) {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${color}, ${alpha})`);
  grad.addColorStop(1, `rgba(${color}, 0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}
