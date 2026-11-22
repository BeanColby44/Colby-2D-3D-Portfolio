import { sound } from "./audio";

/* ================================================================== */
/* Hover effects: magnetic buttons, rolling text, 3D tilt + spotlight, */
/* sliding nav indicator, hover / click sounds.                        */
/* ================================================================== */

const MAGNETIC = ".btn, .icon-btn, .snd-btn, .brand, .gal-nav button";
const ROLL = ".btn, .nav ul a, .pc-link";
const TILT = ".panel, .metric, .contact-links a, .edu, .stack-word, .dt-fig, .strengths li";

/** Wrap a button's text so it can roll up on hover. Idempotent. */
export function enhanceText(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(ROLL).forEach((el) => {
    if (el.dataset.rolled) return;
    el.dataset.rolled = "1";
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent!.trim()) {
        const text = node.textContent!.trim();
        const span = document.createElement("span");
        span.className = "roll";
        span.dataset.text = text;
        span.innerHTML = `<span>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>`;
        node.replaceWith(span);
      }
    }
  });
}

export function initHover(reduced: boolean) {
  enhanceText();
  const fine = matchMedia("(pointer: fine)").matches;

  // hover + click sounds
  document.addEventListener("pointerover", (e) => {
    const el = (e.target as HTMLElement).closest("a, button, summary, [role=tab]");
    const from = (e.relatedTarget as HTMLElement | null)?.closest?.("a, button, summary, [role=tab]");
    if (el && el !== from) sound.hover();
  });
  document.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a, button, summary")) sound.click();
  });

  if (!fine || reduced) return;

  // magnetic pull
  let mag: HTMLElement | null = null;
  document.addEventListener("pointermove", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(MAGNETIC);
    if (mag && mag !== el) {
      mag.style.translate = "";
      mag.classList.remove("magnet");
      mag = null;
    }
    if (el) {
      mag = el;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.classList.add("magnet");
      el.style.translate = `${dx * 0.28}px ${dy * 0.38}px`;
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }
  });

  // 3D tilt + spotlight
  let tilt: HTMLElement | null = null;
  const reset = (el: HTMLElement) => {
    el.style.rotate = "";
    el.classList.remove("tilting");
  };
  document.addEventListener("pointermove", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(TILT);
    if (tilt && tilt !== el) reset(tilt);
    tilt = el;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    const maxDeg = el.classList.contains("panel") ? 4 : 9;
    const mag = Math.min(1, Math.hypot(px, py) * 2) * maxDeg;
    el.classList.add("tilting");
    el.style.rotate = `${-py} ${px} 0 ${mag.toFixed(2)}deg`;
    el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
  });

  // sliding nav indicator
  const list = document.getElementById("navList")!;
  const pill = document.createElement("li");
  pill.className = "nav-pill";
  pill.setAttribute("aria-hidden", "true");
  list.prepend(pill);
  const move = (a: HTMLElement | null) => {
    if (!a) {
      pill.style.opacity = "0";
      return;
    }
    pill.style.opacity = "1";
    pill.style.width = `${a.offsetWidth}px`;
    pill.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  list.addEventListener("pointerover", (e) => move((e.target as HTMLElement).closest("a")));
  list.addEventListener("pointerleave", () => move(list.querySelector<HTMLElement>("a.active")));
}
