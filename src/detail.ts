import manifest from "./project-images.json";
import { CATEGORIES, type Project } from "./data";
import { splitText } from "./text";
import { enhanceText } from "./interactions";
import { sound } from "./audio";

type Img = { src: string; caption: string; wide?: boolean; tall?: boolean };
const MAN = manifest as Record<string, { dir: string; images: Img[] }>;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function imagesFor(slug: string) {
  const m = MAN[slug];
  if (!m) return [] as (Img & { url: string })[];
  return m.images.map((im) => ({ ...im, url: m.dir + im.src }));
}

/**
 * Full-screen project detail page, opened from the gallery with a long press.
 * Deep-linkable via #/project/<slug>; Esc or Back closes it.
 */
export class DetailPage {
  readonly el: HTMLElement;
  private scroller: HTMLElement;
  private body: HTMLElement;
  private lightbox: HTMLElement;
  private lbImg: HTMLImageElement;
  private lbCap: HTMLElement;
  private lbIndex = 0;
  private io: IntersectionObserver;
  current = -1;
  onChange: (open: boolean, index: number) => void = () => {};

  constructor(private projects: Project[]) {
    const el = document.createElement("div");
    el.id = "detail";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `
      <div class="dt-bar">
        <button class="dt-back btn btn-ghost btn-sm" type="button" data-cursor="Back">← Back to gallery</button>
        <span class="dt-count"></span>
        <div class="dt-arrows">
          <button class="icon-btn dt-prev" type="button" aria-label="Previous project">←</button>
          <button class="icon-btn dt-next-btn" type="button" aria-label="Next project">→</button>
        </div>
      </div>
      <div class="dt-scroll"><div class="dt-body"></div></div>
      <div class="dt-lightbox" aria-hidden="true">
        <button class="icon-btn lb-close" type="button" aria-label="Close image">✕</button>
        <button class="icon-btn lb-prev" type="button" aria-label="Previous image">←</button>
        <figure><img alt="" /><figcaption></figcaption></figure>
        <button class="icon-btn lb-next" type="button" aria-label="Next image">→</button>
      </div>`;
    document.body.appendChild(el);
    this.el = el;
    this.scroller = el.querySelector(".dt-scroll")!;
    this.body = el.querySelector(".dt-body")!;
    this.lightbox = el.querySelector(".dt-lightbox")!;
    this.lbImg = this.lightbox.querySelector("img")!;
    this.lbCap = this.lightbox.querySelector("figcaption")!;

    this.io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { root: this.scroller, threshold: 0.12 }
    );

    el.querySelector(".dt-back")!.addEventListener("click", () => this.close());
    el.querySelector(".dt-prev")!.addEventListener("click", () => this.show(this.wrap(this.current - 1), true));
    el.querySelector(".dt-next-btn")!.addEventListener("click", () => this.show(this.wrap(this.current + 1), true));
    this.lightbox.querySelector(".lb-close")!.addEventListener("click", () => this.closeLightbox());
    this.lightbox.querySelector(".lb-prev")!.addEventListener("click", () => this.lightboxStep(-1));
    this.lightbox.querySelector(".lb-next")!.addEventListener("click", () => this.lightboxStep(1));
    this.lightbox.addEventListener("click", (e) => e.target === this.lightbox && this.closeLightbox());
    this.body.addEventListener("click", (e) => {
      const fig = (e.target as HTMLElement).closest<HTMLElement>("[data-img]");
      if (fig) this.openLightbox(Number(fig.dataset.img));
      const nx = (e.target as HTMLElement).closest<HTMLElement>("[data-goto]");
      if (nx) {
        e.preventDefault();
        this.show(Number(nx.dataset.goto), true);
      }
    });
    addEventListener("keydown", (e) => {
      if (this.current < 0) return;
      if (e.key === "Escape") {
        if (this.lightbox.classList.contains("show")) this.closeLightbox();
        else this.close();
      } else if (this.lightbox.classList.contains("show") && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        this.lightboxStep(e.key === "ArrowRight" ? 1 : -1);
      }
    });
    addEventListener("popstate", () => this.syncFromHash());
  }

  get isOpen() {
    return this.current >= 0;
  }

  private wrap(i: number) {
    return (i + this.projects.length) % this.projects.length;
  }

  /** Open with a circular reveal from a screen point. */
  open(i: number, x = innerWidth / 2, y = innerHeight / 2) {
    this.el.style.setProperty("--ox", `${x}px`);
    this.el.style.setProperty("--oy", `${y}px`);
    this.show(i, false);
    history.pushState({ project: this.projects[i].slug }, "", `#/project/${this.projects[i].slug}`);
  }

  private show(i: number, swap: boolean) {
    const wasOpen = this.isOpen;
    this.current = i;
    const render = () => {
      this.render(i);
      this.scroller.scrollTop = 0;
      this.el.classList.remove("swap");
    };
    if (swap && wasOpen) {
      this.el.classList.add("swap");
      sound.whoosh(0.7, true);
      setTimeout(render, 280);
      history.replaceState({ project: this.projects[i].slug }, "", `#/project/${this.projects[i].slug}`);
    } else render();
    if (!wasOpen) {
      document.body.classList.add("detail-open");
      this.el.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => this.el.classList.add("show"));
      sound.whoosh(1.1, true);
      setTimeout(() => (this.el.querySelector(".dt-back") as HTMLElement)?.focus(), 400);
      this.onChange(true, i);
    }
  }

  close(fromHistory = false) {
    if (!this.isOpen) return;
    const i = this.current;
    this.current = -1;
    this.closeLightbox();
    this.el.classList.remove("show");
    this.el.setAttribute("aria-hidden", "true");
    document.body.classList.remove("detail-open");
    sound.whoosh(0.8, false);
    if (!fromHistory && location.hash.startsWith("#/project/")) history.back();
    this.onChange(false, i);
  }

  private syncFromHash() {
    const m = location.hash.match(/^#\/project\/([\w-]+)/);
    const idx = m ? this.projects.findIndex((p) => p.slug === m[1]) : -1;
    if (idx >= 0 && idx !== this.current) this.show(idx, this.isOpen);
    else if (idx < 0 && this.isOpen) this.close(true);
  }

  /** Open from a #/project/<slug> URL on first load. */
  openFromUrl() {
    const m = location.hash.match(/^#\/project\/([\w-]+)/);
    const idx = m ? this.projects.findIndex((p) => p.slug === m[1]) : -1;
    if (idx >= 0) this.show(idx, false);
    return idx;
  }

  private render(i: number) {
    const p = this.projects[i];
    const imgs = imagesFor(p.slug);
    const hero = imgs[0]?.url ?? "";
    const next = this.projects[this.wrap(i + 1)];
    const nextThumb = MAN[next.slug] ? MAN[next.slug].dir + "thumb.jpg" : "";
    (this.el.querySelector(".dt-count") as HTMLElement).textContent = `${String(i + 1).padStart(2, "0")} / ${this.projects.length}`;
    this.el.setAttribute("aria-label", `${p.name} project details`);
    this.body.innerHTML = `
      <header class="dt-hero">
        <div class="dt-hero-img" style="background-image:url('${hero}')"></div>
        <div class="dt-hero-shade"></div>
        <div class="dt-hero-copy">
          <div class="dt-tags"><span class="badge">${esc(CATEGORIES[p.cat])}</span>${p.featured ? '<span class="star">★ Featured</span>' : ""}</div>
          <h1 class="fx">${esc(p.name)}</h1>
          <p class="dt-sub">${esc(p.sub)}</p>
          <div class="dt-ctas">
            <a class="btn btn-primary" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.linkLabel)} ↗</a>
            <a class="btn btn-ghost" href="#dt-gallery" data-scrollto>View gallery ↓</a>
          </div>
        </div>
      </header>
      <section class="dt-section dt-overview">
        <div class="dt-col reveal">
          <p class="kicker">Overview</p>
          <p class="dt-lead">${esc(p.summary)}</p>
        </div>
        <div class="dt-col reveal">
          <p class="kicker">My role</p>
          <p>${esc(p.role)}</p>
        </div>
      </section>
      <section class="dt-section reveal">
        <p class="kicker">Stack</p>
        <div class="dt-stack">${p.tags.map((t, k) => `<span class="stack-word" style="--i:${k}">${esc(t)}</span>`).join("")}</div>
      </section>
      <section class="dt-section" id="dt-gallery">
        <p class="kicker reveal">Gallery</p>
        <div class="dt-grid">
          ${imgs
            .map(
              (im, k) => `
            <figure class="dt-fig reveal${im.wide ? " wide" : ""}${im.tall ? " tall" : ""}" data-img="${k}" data-cursor="View" style="--d:${(k % 3) * 80}ms">
              <img src="${im.url}" alt="${esc(p.name)} — ${esc(im.caption)}" loading="lazy" />
              <figcaption>${esc(im.caption)}</figcaption>
            </figure>`
            )
            .join("")}
        </div>
      </section>
      <a class="dt-nextproj reveal" href="#/project/${next.slug}" data-goto="${this.wrap(i + 1)}" data-cursor="Next">
        <span class="kicker">Next project</span>
        <span class="dt-next-name">${esc(next.name)} →</span>
        ${nextThumb ? `<img src="${nextThumb}" alt="" />` : ""}
      </a>`;
    this.body.querySelector("[data-scrollto]")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.body.querySelector("#dt-gallery")?.scrollIntoView({ behavior: "smooth" });
    });
    splitText(this.body);
    enhanceText(this.body);
    this.body.querySelectorAll(".reveal").forEach((n) => this.io.observe(n));
    // stack words appear with the section
    requestAnimationFrame(() => this.body.querySelector(".dt-stack")?.classList.add("on"));
  }

  private openLightbox(k: number) {
    this.lbIndex = k;
    this.updateLightbox();
    this.lightbox.classList.add("show");
    this.lightbox.setAttribute("aria-hidden", "false");
    sound.click();
  }
  private lightboxStep(d: number) {
    const n = imagesFor(this.projects[this.current].slug).length;
    this.lbIndex = (this.lbIndex + d + n) % n;
    this.updateLightbox();
    sound.tick(1.2);
  }
  private updateLightbox() {
    const im = imagesFor(this.projects[this.current].slug)[this.lbIndex];
    if (!im) return;
    this.lbImg.src = im.url;
    this.lbImg.alt = im.caption;
    this.lbCap.textContent = `${im.caption} · ${this.lbIndex + 1} / ${imagesFor(this.projects[this.current].slug).length}`;
  }
  private closeLightbox() {
    this.lightbox.classList.remove("show");
    this.lightbox.setAttribute("aria-hidden", "true");
  }
}
