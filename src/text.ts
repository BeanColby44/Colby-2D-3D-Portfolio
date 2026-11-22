import { sound } from "./audio";

/**
 * Kinetic typography
 *  - splitText(): wraps every letter of `.fx` headings in spans (words stay unbroken)
 *  - hover: letters near the cursor lift, push away, tilt and glow (springy return)
 *  - press: letters burst outward and snap back with a flash of light
 *  - scramble: labels decode through random glyphs on hover / reveal
 */

const GLYPHS = "!<>-_\\/[]{}=+*^?#01ΛΣΔ⚡";

export function splitText(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(".fx").forEach((el) => {
    if (el.dataset.split) return;
    el.dataset.split = "1";
    el.setAttribute("aria-label", el.textContent!.replace(/\s+/g, " ").trim());
    let ci = 0;
    const walk = (node: Node) => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          const parts = child.textContent!.split(/(\s+)/);
          for (const part of parts) {
            if (!part) continue;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
              continue;
            }
            const w = document.createElement("span");
            w.className = "w";
            w.setAttribute("aria-hidden", "true");
            for (const ch of part) {
              const c = document.createElement("span");
              c.className = "ch";
              c.textContent = ch;
              c.style.setProperty("--ci", String(ci++));
              w.appendChild(c);
            }
            frag.appendChild(w);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      }
    };
    walk(el);
    el.style.setProperty("--n", String(ci));
    // colour each letter along a violet → blue → cyan ramp
    el.querySelectorAll<HTMLElement>(".ch").forEach((c, i) => c.style.setProperty("--t", (ci > 1 ? i / (ci - 1) : 0).toFixed(3)));
  });
}

/** Decode effect: random glyphs settle into the real text from left to right. */
export function scramble(el: HTMLElement, duration = 600) {
  const any = el as any;
  // while a decode is running the element shows noise, so reuse the saved text
  const final = any._scr ? el.dataset.text ?? "" : el.textContent ?? "";
  el.dataset.text = final;
  if (any._scr) cancelAnimationFrame(any._scr);
  const start = performance.now();
  const step = (now: number) => {
    const k = Math.min(1, (now - start) / duration);
    if (k >= 1) any._scr = 0;
    const settled = Math.floor(final.length * k);
    let out = "";
    for (let i = 0; i < final.length; i++) {
      const ch = final[i];
      out += i < settled || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (k < 1) any._scr = requestAnimationFrame(step);
  };
  any._scr = requestAnimationFrame(step);
}

const SCRAMBLE = ".kicker, .hero-title, .lk-kicker, .stack-k, .edu-k, .outro-tag";

export function initText(reduced: boolean) {
  splitText();
  const fine = matchMedia("(pointer: fine)").matches;

  // scramble labels whenever they are revealed or hovered
  if (!reduced) {
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !seen.has(e.target)) {
          seen.add(e.target);
          setTimeout(() => scramble(e.target as HTMLElement, 900), 150);
        }
      }
    });
    document.querySelectorAll(SCRAMBLE).forEach((el) => io.observe(el));
    document.addEventListener("pointerover", (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(SCRAMBLE);
      const from = (e.relatedTarget as HTMLElement | null)?.closest?.(SCRAMBLE);
      if (el && el !== from) scramble(el, 450);
    });
    // replay the decode each time a reveal block turns on
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        const t = m.target as HTMLElement;
        if (m.attributeName === "class" && t.classList.contains("on") && !(m.oldValue ?? "").includes(" on")) {
          t.querySelectorAll<HTMLElement>(SCRAMBLE).forEach((k) => scramble(k, 800));
          if (t.matches(SCRAMBLE)) scramble(t, 800);
        }
      }
    });
    document.querySelectorAll(".rv").forEach((el) => mo.observe(el, { attributes: true, attributeOldValue: true, attributeFilter: ["class"] }));
  }

  if (reduced) return;

  // ---- letters react to the cursor ----
  let active: HTMLElement | null = null;
  let chars: { el: HTMLElement; x: number; y: number; size: number }[] = [];
  let mx = 0, my = 0;
  let raf = 0;

  const measure = (host: HTMLElement) => {
    const size = parseFloat(getComputedStyle(host).fontSize) || 32;
    chars = Array.from(host.querySelectorAll<HTMLElement>(".ch")).map((el) => {
      const r = el.getBoundingClientRect();
      return { el, x: r.left + r.width / 2, y: r.top + r.height / 2, size };
    });
  };
  const release = () => {
    chars.forEach((c) => {
      c.el.style.translate = "";
      c.el.style.rotate = "";
      c.el.style.scale = "";
      c.el.style.removeProperty("--g");
    });
    chars = [];
    active?.classList.remove("fx-hot");
    active = null;
  };
  const tick = () => {
    raf = 0;
    if (!active) return;
    for (const c of chars) {
      const dx = c.x - mx, dy = c.y - my;
      const d = Math.hypot(dx, dy);
      const R = c.size * 1.6;
      const f = Math.max(0, 1 - d / R);
      const e = f * f * (3 - 2 * f);
      if (e <= 0.001) {
        c.el.style.translate = "";
        c.el.style.rotate = "";
        c.el.style.scale = "";
        c.el.style.setProperty("--g", "0");
        continue;
      }
      const nx = d > 0 ? dx / d : 0;
      const push = e * c.size * 0.22;
      c.el.style.translate = `${(nx * push).toFixed(1)}px ${(-e * c.size * 0.32 + (dy / (d || 1)) * push * 0.4).toFixed(1)}px`;
      c.el.style.rotate = `${(nx * e * 14).toFixed(1)}deg`;
      c.el.style.scale = (1 + e * 0.28).toFixed(3);
      c.el.style.setProperty("--g", e.toFixed(2));
    }
  };

  if (fine) {
    document.addEventListener("pointermove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      const host = (e.target as HTMLElement).closest<HTMLElement>(".fx");
      if (host !== active) {
        release();
        if (host) {
          active = host;
          host.classList.add("fx-hot");
          measure(host);
          sound.hover();
        }
      }
      if (active && !raf) raf = requestAnimationFrame(tick);
    });
    addEventListener("scroll", () => active && release(), { passive: true });
  }

  // ---- press: letters burst + light ----
  document.addEventListener("pointerdown", (e) => {
    const host = (e.target as HTMLElement).closest<HTMLElement>(".fx");
    if (!host) return;
    burst(host, e.clientX, e.clientY);
  });
}

export function burst(host: HTMLElement, x: number, y: number) {
  sound.zap();
  const letters = Array.from(host.querySelectorAll<HTMLElement>(".ch"));
  letters.forEach((c, i) => {
    const r = c.getBoundingClientRect();
    const dx = r.left + r.width / 2 - x, dy = r.top + r.height / 2 - y;
    const d = Math.hypot(dx, dy) || 1;
    const power = Math.max(0.25, 1 - d / 600);
    const tx = (dx / d) * 60 * power + (Math.random() - 0.5) * 30;
    const ty = (dy / d) * 50 * power - 30 * power + (Math.random() - 0.5) * 24;
    const rot = (Math.random() - 0.5) * 90 * power;
    c.animate(
      [
        { transform: "none", filter: "brightness(1)" },
        { transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${1 + power * 0.6})`, filter: "brightness(3)", offset: 0.22 },
        { transform: "translate(0, -4px) scale(.96)", filter: "brightness(1.4)", offset: 0.7 },
        { transform: "none", filter: "brightness(1)" },
      ],
      { duration: 900 + power * 300, easing: "cubic-bezier(.2,.8,.2,1)", delay: (d / 600) * 120 + i * 4 }
    );
  });
  host.animate(
    [{ textShadow: "0 0 0 transparent" }, { textShadow: "0 0 40px rgba(180,220,255,.9)" }, { textShadow: "0 0 0 transparent" }],
    { duration: 700 }
  );
  spark(x, y);
}

/** Light burst: shock ring + radiating lightning sparks at a point. */
export function spark(x: number, y: number, scale = 1) {
  const el = document.createElement("div");
  el.className = "spark";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.setProperty("--s", String(scale));
  let rays = "";
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 360 + Math.random() * 20;
    rays += `<i style="--a:${a}deg;--l:${40 + Math.random() * 50}px;--dl:${Math.random() * 60}ms"></i>`;
  }
  el.innerHTML = `<b></b><b></b>${rays}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
