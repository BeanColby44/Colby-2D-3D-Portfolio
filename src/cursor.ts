/**
 * Minimal precision cursor
 *  - a small gradient triangle that leans gently into the direction of travel
 *  - over buttons / links a thin glowing outline snaps around the element itself
 *  - over 3D objects a single fine ring appears around the pointer
 *  - labels live in a small separate tag, never on top of the pointer
 *  - click = one clean ripple; hold = a fine circular progress line
 */

const SNAP = "a, button, summary, [role=tab], .chip, .stack-word";

export class Cursor {
  readonly enabled: boolean;
  private root!: HTMLDivElement;
  private ptr!: HTMLDivElement;
  private frame!: HTMLDivElement;
  private ring!: HTMLDivElement;
  private tag!: HTMLSpanElement;
  private x = -200;
  private y = -200;
  private rx = -200;
  private ry = -200;
  private tilt = 0;
  private lastT = 0;
  private target: HTMLElement | null = null;
  private domLabel: string | null = null;
  private sceneLabel: string | null = null;
  private holdLabel: string | null = null;

  constructor() {
    this.enabled = matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!this.enabled) return;
    document.documentElement.classList.add("has-cursor");
    const root = document.createElement("div");
    root.className = "cursor out";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="c-frame"></div>
      <div class="c-ring"><svg viewBox="0 0 100 100"><circle class="c-ring-base" cx="50" cy="50" r="47"/><circle class="c-ring-prog" cx="50" cy="50" r="47" pathLength="100"/></svg></div>
      <div class="c-ptr">
        <svg viewBox="0 0 24 24">
          <defs><linearGradient id="cPtrG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#c4b5fd"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>
          <path d="M3 2.5 L20.5 10.6 L12.4 13 L9.4 21 Z" fill="url(#cPtrG)" stroke="rgba(255,255,255,.9)" stroke-width=".8" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="c-tag"></span>`;
    document.body.appendChild(root);
    this.root = root;
    this.ptr = root.querySelector(".c-ptr")!;
    this.frame = root.querySelector(".c-frame")!;
    this.ring = root.querySelector(".c-ring")!;
    this.tag = root.querySelector(".c-tag")!;

    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      if (root.classList.contains("out")) {
        root.classList.remove("out");
        this.rx = e.clientX;
        this.ry = e.clientY;
      }
      this.x = e.clientX;
      this.y = e.clientY;
    });
    document.addEventListener("pointerleave", () => root.classList.add("out"));
    addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      root.classList.add("down");
      this.ripple(e.clientX, e.clientY);
    });
    addEventListener("pointerup", () => root.classList.remove("down"));
    document.addEventListener("pointerover", (e) => {
      const t = e.target as HTMLElement;
      const snap = t.closest<HTMLElement>(SNAP);
      // only snap onto compact controls; large blocks just get a label
      const r = snap?.getBoundingClientRect();
      this.target = snap && r && r.width < 460 && r.height < 160 ? snap : null;
      const labelled = t.closest<HTMLElement>("[data-cursor], a, .fx");
      this.domLabel = labelled ? labelFor(labelled) : null;
      this.refresh();
    });
    requestAnimationFrame(this.loop);
  }

  /** Click feedback (also used by scene interactions). */
  zap(x: number, y: number, big = false) {
    if (this.enabled) this.ripple(x, y, big);
  }

  private ripple(x: number, y: number, big = false) {
    const r = document.createElement("i");
    r.className = "c-ripple" + (big ? " big" : "");
    r.style.left = `${x}px`;
    r.style.top = `${y}px`;
    this.root.appendChild(r);
    setTimeout(() => r.remove(), 700);
  }

  setScene(label: string | null) {
    if (!this.enabled || label === this.sceneLabel) return;
    this.sceneLabel = label;
    this.refresh();
  }

  setHold(label: string | null, progress = 0) {
    if (!this.enabled) return;
    if (label !== this.holdLabel) {
      this.holdLabel = label;
      this.refresh();
    }
    this.ring.style.setProperty("--p", progress.toFixed(3));
  }

  private refresh() {
    const text = this.holdLabel ?? this.sceneLabel ?? this.domLabel;
    const ringOn = this.holdLabel !== null || (this.sceneLabel !== null && !this.target);
    this.root.classList.toggle("snap", !!this.target && this.holdLabel === null);
    this.root.classList.toggle("ring-on", ringOn);
    this.root.classList.toggle("hold", this.holdLabel !== null);
    this.root.classList.toggle("tagged", !!text);
    if (text) this.tag.textContent = text;
  }

  private loop = (now: number) => {
    const dt = Math.min(0.05, (now - (this.lastT || now)) / 1000);
    this.lastT = now;
    const k = 1 - Math.exp(-dt * 22);
    const vx = this.x - this.rx;
    this.rx += vx * k;
    this.ry += (this.y - this.ry) * k;

    // the pointer leans a few degrees into horizontal motion
    const want = Math.max(-14, Math.min(14, vx * 0.6));
    this.tilt += (want - this.tilt) * (1 - Math.exp(-dt * 10));
    this.ptr.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) rotate(${this.tilt.toFixed(2)}deg)`;
    this.ring.style.transform = `translate3d(${this.rx}px, ${this.ry}px, 0)`;
    this.tag.style.transform = `translate3d(${this.x + 18}px, ${this.y + 20}px, 0)`;

    // snap outline follows the element (buttons move: magnetic hover, scrolling)
    if (this.target && this.root.classList.contains("snap")) {
      if (!this.target.isConnected) {
        this.target = null;
        this.refresh();
      } else {
        const r = this.target.getBoundingClientRect();
        const pad = 5;
        const radius = parseFloat(getComputedStyle(this.target).borderRadius) || 10;
        this.frame.style.transform = `translate3d(${r.left - pad}px, ${r.top - pad}px, 0)`;
        this.frame.style.width = `${r.width + pad * 2}px`;
        this.frame.style.height = `${r.height + pad * 2}px`;
        this.frame.style.borderRadius = `${Math.min(radius + pad, (r.height + pad * 2) / 2)}px`;
      }
    } else {
      // park the outline as a small square on the pointer so it grows from there next time
      this.frame.style.transform = `translate3d(${this.x - 8}px, ${this.y - 8}px, 0)`;
      this.frame.style.width = "16px";
      this.frame.style.height = "16px";
    }
    requestAnimationFrame(this.loop);
  };
}

function labelFor(el: HTMLElement): string | null {
  if (el.dataset.cursor !== undefined) return el.dataset.cursor || null;
  if (el.classList.contains("fx")) return "Press";
  if (el.hasAttribute("download")) return "Save";
  if (el.tagName === "A" && (el as HTMLAnchorElement).target === "_blank") return "Open ↗";
  if (el.tagName === "A" && (el as HTMLAnchorElement).href.startsWith("mailto:")) return "Write";
  return null;
}
