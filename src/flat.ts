import "./flat.css";
import { ACHIEVEMENTS, CATEGORIES, EXPERIENCE, PROFILE, PROJECTS, SKILLS } from "./data";
import { skillIcon } from "./skill-icons";

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

const CAT_SHORT: Record<string, string> = {
  platform: "SaaS",
  mobile: "Mobile",
  shopify: "Shopify",
  wordpress: "WordPress",
};

function builtPoints(role: string) {
  const parts = role.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean);
  return parts.length ? parts : [role];
}

const BUILT: Record<string, string[]> = {
  joinedbio: [
    "Built the user-facing web portals and API gateway with React, Next.js, TypeScript, and Node.js (NestJS), backed by PostgreSQL and Redis.",
    "Built a C# and .NET microservice that normalized partner health records and synced them through REST APIs.",
    "Used Claude Code, Cursor, Codex, and GitHub Copilot to shorten an estimated one-year roadmap to six months.",
    "Paired strict eligibility rules with LLM reasoning agents that read medical records and match participants to studies, cutting manual review time by 70%.",
    "Designed PostgreSQL schemas, cached hot reads in Redis, and packaged the Node.js and .NET services in Docker for Google Cloud and Kubernetes.",
  ],
  "carwash-app": [
    "Developed web and mobile features for customer and business management.",
    "Implemented registration, single-wash purchases, and recurring monthly memberships.",
    "Built promotions, referrals, and customer engagement through SMS and email.",
    "Built an administrative dashboard for customers, memberships, payments, and car wash operations.",
  ],
  "tdj-golf": [
    "Built Angular and TypeScript dashboards for private golf groups, stat tracking, and Early Access onboarding.",
    "Engineered Java and Spring Boot APIs for group rules, live scoring, notifications, and free versus premium access.",
    "Designed MySQL schemas for golfer profiles, group rosters, round histories, and fantasy standings.",
    "Synced live Pro Tour leaderboards, tournament odds, and daily golf news into the Angular client.",
  ],
  burndy: [
    "Built React Native screens so field electricians can search connectors, view specifications, and open installation guides.",
    "Engineered C# and .NET APIs for the product catalog, compatibility rules, inspection guides, and sales-rep lookup.",
    "Modeled SQL tables for specifications, documentation, and regional distributor directories.",
    "Added on-device storage and background sync so specs stay available without a cell signal.",
  ],
  "best-ride": [
    "Built React Native screens to compare live fares across Uber, DiDi, Ola, and local taxis.",
    "Engineered aggregation services that query provider pricing APIs together and normalize estimates, ETAs, and vehicle tiers.",
    "Added address autocomplete, GPS origin detection, and deep links into the chosen booking flow.",
    "Implemented in-app subscriptions, renewals, and referral codes on iOS and Android.",
  ],
  pattern: [
    "Built branded iOS and Android apps for browsing deals, placing orders, and redeeming loyalty rewards.",
    "Built a merchant app so restaurant and grocery staff can receive, track, and fulfill orders.",
    "Engineered the Python and Django server and admin portal for menus, offers, and more than 100,000 orders.",
    "Built the loyalty and discount module and connected it to the restaurants' existing systems.",
  ],
  freightmate: [
    "Refactored SQL Server queries and indexing, cutting fleet-map load times by about 70% and data-retrieval I/O by 95%.",
    "Built live tracking across satellite GPS, ELD telematics, and driver apps, with SMS alerts on geofence entry and exit.",
    "Developed a C# and .NET scheduling API for about 12,000 automated loads a year, plus AI extraction for rate confirmations.",
    "Rebuilt the React design system, shipped a reporting suite for about one million rows, and set up AWS, Terraform, and GitHub Actions releases.",
  ],
  "elastic-path": [
    "Built headless storefront components in Next.js, React, and TypeScript on the commerce APIs.",
    "Connected REST and GraphQL for multi-catalog merchandising, price books, bundles, and cart and checkout.",
    "Synced orders, inventory, and customer accounts with ERP, CRM, and payment systems.",
    "Cleared integration bottlenecks so production milestones landed on schedule.",
  ],
  "lex-mundi": [
    "Built native iOS and Android directory apps and launched them on the App Store and Google Play.",
    "Added search and filtering by jurisdiction, country, practice area, and member firm.",
    "Replaced the annual printed directories with a directory that can be updated immediately.",
    "Designed the mobile data model and sync so firm listings, contacts, and regional hubs stay current.",
  ],
  cloudeoc: [
    "Built the emergency response application with React, TypeScript, Node.js, and Express.js on AWS.",
    "Sent automated emails with secure response links so county fire chiefs can offer personnel and equipment.",
    "Built coordinator screens to review tenders and accept part of a deployment, accept all of it, or decline it.",
    "Kept the public-safety systems current with mapping support and later feature work.",
  ],
  goodtwice: [
    "Built native iOS and Android shopping apps with product sliders, cart reminders, and mobile browsing.",
    "Re-architected Magento, the database, and AWS so pages that took about 20 seconds loaded in under 2.",
    "Added store-credit accounts and a banner manager for scheduled and animated promotions.",
    "Stabilized checkout and uptime through the relaunch, which was followed by a reported threefold rise in online sales.",
  ],
  "weather-routing": [
    "Architected an end-to-end logistics platform that pairs truck route planning with weather-based risk assessment.",
    "Built Django REST Framework APIs for routing, vehicle load, and weather conditions.",
    "Built React, TypeScript, and Leaflet dashboards for route comparison and weather overlays.",
    "Connected OpenStreetMap routing with Open-Meteo forecasts for wind, rain, and snow along a route.",
    "Owned the architecture, implementation, Docker packaging, and Railway deployment.",
  ],
};

const CODE: { text: string; cls?: string }[] = [
  { text: "# rank roads by weather and load", cls: "c-cmt" },
  { text: "\n" },
  { text: "def", cls: "c-kw" },
  { text: " " },
  { text: "plan_route", cls: "c-fn" },
  { text: "(origin, destination, load):" },
  { text: "\n    routes = " },
  { text: "fetch", cls: "c-fn" },
  { text: "(origin, destination)" },
  { text: "\n    weather = " },
  { text: "forecast", cls: "c-fn" },
  { text: "(routes)" },
  { text: "\n    ranked = " },
  { text: "score", cls: "c-fn" },
  { text: "(routes, weather, load)" },
  { text: "\n    " },
  { text: "return", cls: "c-kw" },
  { text: " ranked[" },
  { text: "0", cls: "c-num" },
  { text: "]" },
];

const typeCode = (el: HTMLElement, motion: boolean) => {
  const total = CODE.reduce((sum, token) => sum + token.text.length, 0);
  const charAt = (index: number) => {
    let left = index;
    for (const token of CODE) {
      if (left < token.text.length) return token.text[left] ?? "";
      left -= token.text.length;
    }
    return "";
  };
  const paint = (count: number, caret?: HTMLElement) => {
    el.replaceChildren();
    let left = count;
    for (const token of CODE) {
      if (left <= 0) break;
      const slice = token.text.slice(0, left);
      left -= slice.length;
      if (!slice) continue;
      if (token.cls) {
        const span = document.createElement("span");
        span.className = token.cls;
        span.textContent = slice;
        el.append(span);
      } else el.append(slice);
    }
    if (caret) el.append(caret);
  };
  if (!motion) {
    paint(total);
    return;
  }
  const caret = document.createElement("span");
  caret.className = "code-caret";
  caret.setAttribute("aria-hidden", "true");
  let shown = 0;
  const step = () => {
    if (!el.isConnected) return;
    if (shown >= total) {
      window.setTimeout(() => {
        if (!el.isConnected) return;
        shown = 0;
        paint(0, caret);
        window.setTimeout(step, 360);
      }, 1800);
      return;
    }
    shown += 1;
    paint(shown, caret);
    const ch = charAt(shown - 1);
    const delay = ch === "\n" ? 240 : 42 + Math.random() * 48;
    window.setTimeout(step, delay);
  };
  paint(0, caret);
  window.setTimeout(step, 480);
};

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
      <button type="button" class="flat-mute" data-sound aria-pressed="true" aria-label="Mute sound">
        <span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
        <svg class="flat-mute-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h3.2L12 18V6L7.2 10H4z" fill="currentColor"/><path d="M16 9.2 20.2 13.4M20.2 9.2 16 13.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      </button>
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
            <a class="flat-dark" href="${esc(PROFILE.resume)}" target="_blank" rel="noopener">Resume</a>
          </div>
        </div>
        <figure class="flat-code">
          <div class="code-tilt">
            <div class="code-window">
              <header>
                <span class="code-dot r"></span>
                <span class="code-dot y"></span>
                <span class="code-dot g"></span>
                <span class="code-file">services/plan.py</span>
              </header>
              <pre><code data-code></code></pre>
            </div>
            <aside class="code-status" aria-hidden="true">
              <p>deploy / api</p>
              <ul>
                <li><i></i>api <em>ready</em> <span>0.4s</span></li>
                <li><i></i>routes <em>scored</em> <span>0.2s</span></li>
                <li><i></i>weather <em>live</em> <span>0.3s</span></li>
              </ul>
            </aside>
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
            </ul>
          </aside>
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
          <h2>Featured projects</h2>
        </div>
        <div class="flat-grid">
          ${PROJECTS.map((p, i) => {
            const points = BUILT[p.slug] ?? builtPoints(p.role);
            const lead = points.slice(0, 2);
            const rest = points.slice(2);
            const shown = p.tags.slice(0, 4);
            const extraTags = p.tags.slice(4);
            const bullets = (items: string[]) => items.map((point) => `<li><span>${esc(point)}</span></li>`).join("");
            const chips = (items: string[]) => items.map((tag) => `<span>${skillIcon(tag)}${esc(tag)}</span>`).join("");
            return `
            <article class="flat-card" data-project="${i}">
              <button type="button" class="flat-card-shot" aria-expanded="false" aria-label="Show more about ${esc(p.name)}">
                <img src="projects/${esc(p.slug)}/thumb.jpg" alt="" />
              </button>
              <div class="flat-card-body">
                <div class="flat-card-top">
                  <h3>${esc(p.name)}</h3>
                  <span class="flat-card-cat">${esc(CAT_SHORT[p.cat] ?? CATEGORIES[p.cat])}</span>
                </div>
                <p class="flat-card-sum">${esc(p.summary)}</p>
                <ul class="flat-card-built">${bullets(lead)}</ul>
                ${rest.length ? `<div class="flat-card-more"><div><ul class="flat-card-built">${bullets(rest)}</ul></div></div>` : ""}
                <p class="flat-card-skill">Skill</p>
                <div class="flat-card-skills">
                  ${chips(shown)}
                  ${extraTags.length ? `<span class="is-more">+${extraTags.length}</span>` : ""}
                </div>
                ${extraTags.length ? `<div class="flat-card-more"><div><div class="flat-card-skills">${chips(extraTags)}</div></div></div>` : ""}
                <div class="flat-card-foot">
                  <button type="button" data-more>
                    <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span class="more">Show more</span>
                    <span class="less">Show less</span>
                  </button>
                  <a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.linkLabel)}</a>
                </div>
              </div>
            </article>`;
          }).join("")}
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
              <ul>${g.items.map((item) => `<li>${skillIcon(item)}${esc(item)}</li>`).join("")}</ul>
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
              <article class="flat-post flat-reveal">
                <p class="flat-role-when">${ICON.cal}<span>${esc(job.start)} – ${esc(job.end)}</span></p>
                <h3>${esc(job.title)}</h3>
                <p class="flat-role-co">${ICON.work}<span>${esc(job.company)}</span></p>
                <p class="flat-role-place">${ICON.pin}<span>${esc(job.place)}</span></p>
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
          <button type="button" class="flat-mail" data-copy-email aria-label="Copy email address">
            <span>${esc(PROFILE.email)}</span>
            <svg class="flat-copy" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
            <span class="flat-copied">Copied</span>
          </button>
          <div class="flat-actions">
            <a class="flat-icon" href="${esc(PROFILE.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.4 2H3.6A1.6 1.6 0 0 0 2 3.6v16.8A1.6 1.6 0 0 0 3.6 22h16.8a1.6 1.6 0 0 0 1.6-1.6V3.6A1.6 1.6 0 0 0 20.4 2zM8 19H5V9h3zM6.5 7.7a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4zM19 19h-3v-4.9c0-1.2 0-2.7-1.6-2.7S12.5 12.7 12.5 14V19h-3V9h2.9v1.4c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.7z"/></svg>
            </a>
            <a class="flat-icon" href="${esc(PROFILE.github)}" target="_blank" rel="noopener" aria-label="GitHub">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.3 4.6 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/></svg>
            </a>
            <a class="flat-icon" href="${esc(PROFILE.resume)}" target="_blank" rel="noopener" aria-label="Resume">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M14 3.5V9h5.5M8 13h8M8 17h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </a>
          </div>
        </div>
        ${enterBtn("Open the 3D portfolio", "flat-3d-lg")}
      </section>
    </main>
    <dialog class="flat-modal" id="flat-modal">
      <button type="button" class="flat-modal-x" data-close-modal aria-label="Close">×</button>
      <div class="flat-modal-layout">
        <img class="flat-modal-img" alt="" />
        <div class="flat-modal-body">
          <div class="flat-card-top">
            <h2 data-modal="title"></h2>
            <span class="flat-card-cat" data-modal="kicker"></span>
          </div>
          <p class="flat-modal-sub" data-modal="sub"></p>
          <h3>Summary</h3>
          <p data-modal="summary"></p>
          <h3>What I built</h3>
          <ul class="flat-modal-built" data-modal="built"></ul>
          <h3>Skills</h3>
          <div class="flat-card-skills" data-modal="skills"></div>
          <a class="flat-live" data-modal="live" target="_blank" rel="noopener">Visit Site</a>
        </div>
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

  const copyEmail = root.querySelector<HTMLButtonElement>("[data-copy-email]");
  let copiedTimer = 0;
  copyEmail?.addEventListener("click", async () => {
    const email = PROFILE.email;
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const area = document.createElement("textarea");
      area.value = email;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    if (!copyEmail) return;
    copyEmail.classList.add("is-copied");
    copyEmail.setAttribute("aria-label", "Email copied");
    window.clearTimeout(copiedTimer);
    copiedTimer = window.setTimeout(() => {
      copyEmail.classList.remove("is-copied");
      copyEmail.setAttribute("aria-label", "Copy email address");
    }, 1600);
  });

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
    root.querySelectorAll<HTMLElement>(".flat-card.is-open").forEach((card) => {
      card.classList.remove("is-open");
      card.querySelector(".flat-card-shot")?.setAttribute("aria-expanded", "false");
    });
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

  const grid = root.querySelector<HTMLElement>(".flat-grid");
  const columnCount = () => (matchMedia("(max-width: 760px)").matches ? 1 : matchMedia("(max-width: 980px)").matches ? 2 : 3);
  let packed = 0;
  // Closed cards in one visual row share a bottom edge. An open card grows
  // past that height, so only the cards under it in the same column move.
  const alignRows = () => {
    if (!grid) return;
    const cols = [...grid.querySelectorAll<HTMLElement>(".flat-col")];
    if (!cols.length) return;
    const cards = [...grid.querySelectorAll<HTMLElement>(".flat-card")];
    const mores = [...grid.querySelectorAll<HTMLElement>(".flat-card-more")];
    cards.forEach((card) => { card.style.minHeight = ""; });
    mores.forEach((panel) => {
      panel.style.transition = "none";
      panel.style.gridTemplateRows = "0fr";
    });
    const depth = Math.max(...cols.map((col) => col.children.length));
    const closed: number[][] = [];
    for (let row = 0; row < depth; row++) {
      closed[row] = cols.map((col) => {
        const card = col.children[row] as HTMLElement | undefined;
        return card ? card.getBoundingClientRect().height : 0;
      });
    }
    for (let row = 0; row < depth; row++) {
      const height = Math.ceil(Math.max(...closed[row]));
      cols.forEach((col, i) => {
        const card = col.children[row] as HTMLElement | undefined;
        if (card) card.style.minHeight = `${height}px`;
      });
    }
    mores.forEach((panel) => {
      panel.style.transition = "";
      panel.style.gridTemplateRows = "";
    });
  };
  const packColumns = () => {
    if (!grid) return;
    const count = columnCount();
    if (count !== packed || !grid.querySelector(".flat-col")) {
      packed = count;
      const cards = [...grid.querySelectorAll<HTMLElement>(".flat-card")];
      cards.forEach((card) => grid.append(card));
      grid.querySelectorAll(".flat-col").forEach((col) => col.remove());
      const cols = Array.from({ length: count }, () => {
        const col = document.createElement("div");
        col.className = "flat-col";
        grid.append(col);
        return col;
      });
      cards.forEach((card, i) => cols[i % count].append(card));
    }
    alignRows();
  };
  packColumns();
  window.addEventListener("resize", packColumns);
  document.fonts?.ready.then(alignRows);

  const toggleCard = (card: HTMLElement) => {
    const open = card.classList.toggle("is-open");
    card.querySelector(".flat-card-shot")?.setAttribute("aria-expanded", open ? "true" : "false");
  };
  root.querySelectorAll<HTMLElement>(".flat-card").forEach((card) => {
    card.querySelector(".flat-card-shot")?.addEventListener("click", () => toggleCard(card));
    card.querySelector("[data-more]")?.addEventListener("click", () => toggleCard(card));
  });

  const sky = root.querySelector<HTMLCanvasElement>(".flat-stars");
  if (sky) paintStars(sky);

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const codeEl = root.querySelector<HTMLElement>("[data-code]");
  if (codeEl) typeCode(codeEl, !reduced);
  const shift = root.querySelector<HTMLElement>(".flat-code");
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
