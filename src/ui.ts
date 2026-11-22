import { ACHIEVEMENTS, CATEGORIES, EXPERIENCE, METRICS, PROFILE, PROJECTS, SKILLS, type Project, STRENGTHS, WORKFLOW, PROBLEMS, EXPLORING } from "./data";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const ICON = {
  arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  ext: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>',
  down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  mail: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  in: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 2H3.6A1.6 1.6 0 0 0 2 3.6v16.8A1.6 1.6 0 0 0 3.6 22h16.8a1.6 1.6 0 0 0 1.6-1.6V3.6A1.6 1.6 0 0 0 20.4 2zM8 19H5V9h3zM6.5 7.7a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4zM19 19h-3v-4.9c0-1.2 0-2.7-1.6-2.7S12.5 12.7 12.5 14V19h-3V9h2.9v1.4c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.7z"/></svg>',
  gh: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.3 4.6 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/></svg>',
};

const chips = (items: string[]) => `<div class="chips">${items.map((i) => `<span class="chip">${esc(i)}</span>`).join("")}</div>`;

export function projectCard(p: Project, i: number, total: number) {
  return `
    <p class="pc-hold"><span class="pc-hold-ico" aria-hidden="true"></span><span><b>Press and hold</b> the picture to open the full project</span></p>
    <div class="pc-top">
      <span class="pc-index">${String(i + 1).padStart(2, "0")} <i>/ ${total}</i></span>
      <span class="badge">${esc(CATEGORIES[p.cat])}</span>
      ${p.featured ? '<span class="star">★ Featured</span>' : ""}
    </div>
    <h3 class="fx">${esc(p.name)}</h3>
    <p class="pc-sub">${esc(p.sub)}</p>
    <p class="pc-sum">${esc(p.summary)}</p>
    <details><summary>My role</summary><p>${esc(p.role)}</p></details>
    ${chips(p.tags)}
    <a class="pc-link" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.linkLabel)} ${ICON.ext}</a>`;
}

export function jobPanel(i: number) {
  const j = EXPERIENCE[i];
  return `
    <div class="job-head">
      <h3 class="fx">${esc(j.title)}</h3>
      <p class="job-co">${esc(j.company)} <span>· ${esc(j.type)}</span></p>
      <p class="job-sum">${esc(j.summary)}</p>
    </div>
    <ul class="job-points">${j.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    <div class="jg">
      ${j.groups
        .map(
          (g, gi) => `
        <div class="jg-row" style="--c:${g.color}">
          <span class="jg-k">${esc(g.group)}</span>
          <div class="jg-items">${g.items.map((s, k) => `<span class="stack-word" style="--i:${gi * 2 + k * 0.6}">${esc(s)}</span>`).join("")}</div>
        </div>`
        )
        .join("")}
    </div>`;
}

export function skillPanel(i: number) {
  const g = SKILLS[i];
  return `
    <div class="sk-head" style="--c:${g.color}">
      <span class="sk-dot"></span>
      <h3 class="fx">${esc(g.name)}</h3>
      <span class="sk-count">${g.items.length} skills</span>
    </div>
    ${chips(g.items)}`;
}

export const CHAPTERS = [
  { n: "01", id: "hero", label: "Intro" },
  { n: "02", id: "stack", label: "Tech stack" },
  { n: "03", id: "snapshot", label: "Snapshot" },
  { n: "04", id: "journey", label: "Career" },
  { n: "05", id: "achievements", label: "Achievements" },
  { n: "06", id: "portal", label: "Projects" },
  { n: "07", id: "build", label: "How I build" },
  { n: "08", id: "solve", label: "Problem solving" },
  { n: "09", id: "impact", label: "Impact" },
  { n: "10", id: "exploring", label: "Exploring" },
  { n: "11", id: "contact", label: "Contact" },
  { n: "12", id: "outro", label: "Fin" },
];

export function buildStory(root: HTMLElement) {
  const year = new Date().getFullYear();
  const techCount = SKILLS.reduce((n, g) => n + g.items.length, 0);
  root.innerHTML = `
  <section class="scene" id="hero" data-len="220" data-ch="01" data-label="Intro">
    <div class="sticky">
      <div class="hero-copy">
        <h1 class="sr-only">${esc(PROFILE.displayName)} — ${esc(PROFILE.title)}</h1>
        <p class="hero-title rv" data-show="0,0.22">${esc(PROFILE.title)}</p>
        <p class="hero-tag rv" data-show="0,0.22" style="--d:.12s">${esc(PROFILE.tagline)}</p>
        <div class="hero-ctas rv" data-show="0,0.22" style="--d:.24s">
          <a class="btn btn-primary" href="#projects" data-jump="projects">View my work ${ICON.arrow}</a>
          <a class="btn btn-ghost" href="${PROFILE.resume}" download>${ICON.down} Download résumé</a>
        </div>
        <img class="hero-mark rv" data-show="0,0.22" style="--d:.36s" src="flat/University/University%20of%20Florida%20Seal%20Line%20Art.png" alt="University of Florida" />
      </div>
      <div class="scroll-hint rv" data-show="0,0.12" style="--d:.5s"><span></span>Scroll to explore</div>
    </div>
  </section>

  <section class="scene" id="stack" data-len="640" data-ch="02" data-label="Tech stack">
    <div class="sticky">
      <div class="panel left rv" data-show="0.04,0.26">
        <p class="kicker">02 — Main tech stack</p>
        <h2 class="fx">Main tech <em>stack</em></h2>
        <p>${SKILLS.length} disciplines, ${techCount} technologies and practices. Scroll, or press a tower, to explore each group. Drag to spin the platform.</p>
      </div>
      <div class="skills-ui" id="skillsUi">
        <div class="sk-tabs" id="skTabs" role="tablist" aria-label="Skill groups">
          ${SKILLS.map((g, i) => `<button role="tab" data-i="${i}" style="--c:${g.color}" aria-selected="false">${esc(g.short)}</button>`).join("")}
        </div>
        <div class="panel sk-panel" id="skPanel" aria-live="polite"></div>
      </div>
    </div>
    <div class="full sr-only">
      <h2>Main tech stack</h2>
      ${SKILLS.map((g) => `<h3>${esc(g.name)}</h3><ul>${g.items.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`).join("")}
    </div>
  </section>

  <section class="scene" id="snapshot" data-len="420" data-ch="03" data-label="Snapshot">
    <div class="sticky">
      <div class="panel left rv" data-show="0.08,0.52">
        <p class="kicker">03 — Experience snapshot</p>
        <h2 class="fx">7+ years of <em>shipping.</em></h2>
        <p class="lead">${esc(PROFILE.summary[0])}</p>
        <ul class="facts">
          <li><b>7+</b><span>Years experience</span></li>
          <li><b>${EXPERIENCE.length}</b><span>Companies</span></li>
          <li><b>${PROJECTS.length}</b><span>Shipped projects</span></li>
        </ul>
        <p class="meta-line">${esc(PROFILE.location)} · Remote</p>
      </div>
      <div class="panel left rv" data-show="0.55,0.95">
        <p class="kicker">03 — Strengths</p>
        <h2 class="fx">What I <em>bring</em></h2>
        <ol class="strengths">
          ${STRENGTHS.map((s, i) => `<li style="--d:${i * 70}ms"><b>${esc(s.title)}</b><span>${esc(s.text)}</span></li>`).join("")}
        </ol>
      </div>
    </div>
  </section>

  <section class="scene" id="journey" data-len="860" data-ch="04" data-label="Career">
    <div class="sticky">
      <div class="exp-intro rv" data-show="0,0.08">
        <p class="kicker">04 — Career journey</p>
        <h2 class="fx">Career <em>journey</em></h2>
      </div>
      <div class="exp" aria-hidden="true">
        <div class="exp-date" id="expDate"><span class="d-start"></span><span class="d-sep"></span><span class="d-end"></span></div>
        <div class="exp-steps" id="expSteps">${EXPERIENCE.map((_, i) => `<span data-i="${i}"></span>`).join("")}</div>
        <div class="panel exp-panel" id="expPanel"></div>
      </div>
      <div class="career-edu" id="careerEdu" aria-hidden="true">
        <p class="kicker">Education</p>
        <div class="flat-edu-grid">
          <div class="flat-campus" data-campus>
            <div class="flat-campus-frame" tabindex="0" aria-label="University of Florida campus photos">
              <img data-campus-img alt="" />
              <button type="button" class="flat-campus-nav prev" data-campus-prev aria-label="Previous photo">‹</button>
              <button type="button" class="flat-campus-nav next" data-campus-next aria-label="Next photo">›</button>
              <div class="flat-campus-dots" data-campus-dots></div>
              <span class="flat-campus-count" data-campus-count>1/8</span>
            </div>
            <p class="flat-campus-cap" data-campus-cap></p>
          </div>
          <article class="flat-degree">
            <div>
              <h3>${esc(PROFILE.education.degree)}</h3>
              <p class="flat-school">${esc(PROFILE.education.school)}</p>
              <p class="flat-degree-meta">
                <span>${esc(PROFILE.education.years)}</span>
                <span>Gainesville, FL</span>
              </p>
            </div>
            <img class="flat-mark" src="flat/University/University%20of%20Florida%20Seal%20Line%20Art.png" alt="University of Florida seal" />
          </article>
        </div>
      </div>
    </div>
    <div class="full sr-only">
      <h2>Career journey</h2>
      ${EXPERIENCE.map((j) => `<article><h3>${esc(j.title)}, ${esc(j.company)}</h3><p>${j.start} – ${j.end} · ${esc(j.type)}</p><p>${esc(j.summary)}</p><ul>${j.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></article>`).join("")}
      <article><h3>${esc(PROFILE.education.degree)}</h3><p>${esc(PROFILE.education.school)} · ${esc(PROFILE.education.years)} · Gainesville, FL</p></article>
    </div>
  </section>

  <section class="scene" id="achievements" data-len="480" data-ch="05" data-label="Achievements">
    <div class="sticky">
      <div class="panel left rv" data-show="0.04,0.95">
        <p class="kicker">05 — Key achievements</p>
        <h2 class="fx">Impact, <em>assembled.</em></h2>
        <ol class="ach-list" id="achList">
          ${ACHIEVEMENTS.map((a, i) => `<li data-i="${i}"><b>${esc(a.title)}</b><p>${esc(a.text)}</p></li>`).join("")}
        </ol>
      </div>
    </div>
  </section>

  <section class="scene" id="portal" data-len="240" data-ch="06" data-label="Projects">
    <div class="sticky">
      <div class="portal-copy rv" data-show="0.12,0.6">
        <p class="kicker">06 — Featured projects</p>
        <h2 class="fx">Step inside the <em>gallery</em></h2>
      </div>
    </div>
  </section>

  <section class="scene" id="projects" data-len="${(PROJECTS.length + 2) * 95}" data-ch="06" data-label="Projects">
    <div class="sticky">
      <div class="gal-intro" id="galIntro">
        <p class="kicker">06 — Featured projects</p>
        <h2 class="fx">Featured <em>work</em></h2>
        <p>${PROJECTS.length} live platforms, mobile apps and storefronts.<br />When a project is in front, press and hold its picture to open the details.</p>
      </div>
      <article class="panel project-card" id="projectCard" aria-live="polite"></article>
      <div class="gal-nav" id="galNav">
        <button class="icon-btn" id="galPrev" aria-label="Previous project">←</button>
        <span id="galCount">01 / ${PROJECTS.length}</span>
        <button class="icon-btn" id="galNext" aria-label="Next project">→</button>
        <button class="btn btn-ghost btn-sm" id="galOpen">Open project</button>
        <button class="btn btn-ghost btn-sm" id="galAll">All projects</button>
      </div>
    </div>
    <div class="full sr-only">
      <h2>Featured projects</h2>
      ${PROJECTS.map((p, i) => `<article>${projectCard(p, i, PROJECTS.length)}</article>`).join("")}
    </div>
  </section>

  <section class="scene" id="build" data-len="520" data-ch="07" data-label="How I build">
    <div class="sticky">
      <div class="panel left rv" data-show="0.05,0.95">
        <p class="kicker">07 — How I build</p>
        <h2 class="fx">From idea to <em>launch.</em></h2>
        <ol class="flow" id="wfList">
          ${WORKFLOW.map((w, i) => `<li data-i="${i}"><span class="flow-n">${String(i + 1).padStart(2, "0")}</span><b>${esc(w.step)}</b><p>${esc(w.text)}</p></li>`).join("")}
        </ol>
      </div>
    </div>
  </section>

  <section class="scene" id="solve" data-len="560" data-ch="08" data-label="Problem solving">
    <div class="sticky">
      <div class="panel left rv" data-show="0.05,0.96">
        <p class="kicker">08 — How I solve problems</p>
        <h2 class="fx">Chaos in, <em>clarity</em> out.</h2>
        <div class="solve-card" id="solveCard" aria-live="polite"></div>
        <div class="solve-dots" id="solveDots">${PROBLEMS.map((_, i) => `<button type="button" data-i="${i}" aria-label="Problem ${i + 1}"></button>`).join("")}</div>
      </div>
    </div>
    <div class="full sr-only">
      <h2>How I solve problems</h2>
      ${PROBLEMS.map((p) => `<article><h3>${esc(p.problem)}</h3><p>${esc(p.solution)}</p><p>${p.stack.map(esc).join(", ")}</p></article>`).join("")}
    </div>
  </section>

  <section class="scene" id="impact" data-len="400" data-ch="09" data-label="Impact">
    <div class="sticky">
      <div class="panel left rv" data-show="0.08,0.95">
        <p class="kicker">09 — Engineering impact</p>
        <h2 class="fx">Built in Florida, <em>used worldwide.</em></h2>
        <div class="metrics-grid" id="metrics">
          ${METRICS.map((m) => `<div class="metric"><b data-to="${m.value}" data-suffix="${m.suffix}">0${m.suffix}</b><span>${esc(m.label)}</span></div>`).join("")}
        </div>
        <p class="meta-line">Drag the globe · press a marker</p>
      </div>
    </div>
  </section>

  <section class="scene" id="exploring" data-len="460" data-ch="10" data-label="Exploring">
    <div class="sticky">
      <div class="panel left rv" data-show="0.05,0.95">
        <p class="kicker">10 — Currently exploring</p>
        <h2 class="fx">What I'm <em>exploring</em> next</h2>
        <ol class="explore-list" id="exList">
          ${EXPLORING.map((x, i) => `<li data-i="${i}"><b>${esc(x.title)}</b><p>${esc(x.text)}</p></li>`).join("")}
        </ol>
      </div>
    </div>
  </section>

  <section class="scene" id="contact" data-len="320" data-ch="11" data-label="Contact">
    <div class="sticky">
      <div class="contact">
        <p class="kicker rv" data-show="0.16,1">11 — Let's connect</p>
        <h2 class="contact-title fx rv" data-show="0.18,1" style="--d:.08s">Let's build something <em>together.</em></h2>
        <p class="contact-lead rv" data-show="0.22,1" style="--d:.16s">Open to full-time and contract roles across full stack, backend, mobile, and cloud engineering.</p>
        <div class="contact-links rv" data-show="0.28,1" style="--d:.24s">
          <a href="mailto:${PROFILE.email}">${ICON.mail}<span>${esc(PROFILE.email)}</span></a>
          <a href="${PROFILE.linkedin}" target="_blank" rel="noopener">${ICON.in}<span>LinkedIn</span></a>
          <a href="${PROFILE.github}" target="_blank" rel="noopener">${ICON.gh}<span>GitHub</span></a>
          <a href="${PROFILE.resume}" download>${ICON.down}<span>Résumé (PDF)</span></a>
        </div>
        <div class="edu rv" data-show="0.36,1" style="--d:.32s">
          <span class="edu-k">Education</span>
          <b>${esc(PROFILE.education.degree)}</b>
          <span>${esc(PROFILE.education.school)} · ${PROFILE.education.years}</span>
        </div>
      </div>
    </div>
  </section>

  <section class="scene" id="outro" data-len="240" data-ch="12" data-label="Fin">
    <div class="sticky">
      <div class="outro-copy rv" data-show="0.62,1">
        <p class="outro-tag">${esc(PROFILE.title)} · ${esc(PROFILE.location)}</p>
        <div class="outro-row">
          <a class="btn btn-ghost btn-sm" href="mailto:${PROFILE.email}">Get in touch</a>
          <button class="btn btn-ghost btn-sm" data-jump="hero" type="button">Back to start ↑</button>
        </div>
        <p class="copyright">© ${year} ${esc(PROFILE.displayName)}</p>
      </div>
    </div>
  </section>`;

  // chapter rail (right edge)
  const rail = document.createElement("nav");
  rail.className = "chapters";
  rail.id = "chapters";
  rail.setAttribute("aria-label", "Chapters");
  rail.innerHTML = CHAPTERS.map(
    (c) => `<button type="button" data-jump="${c.id}" data-ch="${c.n}" aria-label="${c.n} ${esc(c.label)}"><span class="ch-label">${c.n} · ${esc(c.label)}</span><i></i></button>`
  ).join("");
  document.body.appendChild(rail);

  // all-projects dialog list
  const list = document.getElementById("pdList")!;
  list.innerHTML = PROJECTS.map(
    (p, i) => `<li><button data-project="${i}"><span class="pd-i">${String(i + 1).padStart(2, "0")}</span><span class="pd-n">${esc(p.name)}<small>${esc(p.sub)}</small></span><span class="badge">${esc(CATEGORIES[p.cat])}</span></button></li>`
  ).join("");
}

/** Solve-section card. */
export function solvePanel(i: number) {
  const p = PROBLEMS[i];
  return `
    <div class="sv-row sv-problem"><span class="sv-k">Problem</span><b>${esc(p.problem)}</b></div>
    <div class="sv-arrow" aria-hidden="true">↓</div>
    <div class="sv-row sv-solution"><span class="sv-k">Solution</span><p>${esc(p.solution)}</p></div>
    <div class="chips">${p.stack.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>`;
}

/** Animated count-up for metric numbers. */
export function countUp(el: HTMLElement, reduced: boolean) {
  const to = Number(el.dataset.to);
  const suffix = el.dataset.suffix ?? "";
  if (reduced) {
    el.textContent = `${to}${suffix}`;
    return;
  }
  const start = performance.now();
  const dur = 1400;
  const step = (now: number) => {
    const k = Math.min(1, (now - start) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = `${Math.round(to * e)}${suffix}`;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

