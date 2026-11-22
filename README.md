# Colby Bean — 3D Portfolio

Scroll-driven, cinematic 3D portfolio built with **Vite + TypeScript + Three.js (WebGL)**, custom **GLSL shaders**, **bloom post-processing** and **GSAP**.

## Run

```bash
npm install
npm run dev        # local dev server with hot reload
npm run build      # production build → dist/
npm run preview    # serve the production build at http://localhost:4173
```

## Edit content

All text lives in `src/data.ts` (profile, experience, skills, projects, achievements).
Project screenshots: `public/projects/<slug>.jpg` (1280×800). Missing images show a placeholder.
Re-capture screenshots from the live sites: `npm run screens` (or `npm run screens -- soulario`).

**Project artwork:** put numbered images in the parent folder (`../1-Name.png` … `../14-Name.png`) and run `npm run images`.
It maps each number to a project (see `NUMBER_TO_SLUG` in `scripts/build-project-images.mjs`), builds the gallery frame,
the detail-page hero and generated variants (desktop / phone mockups, detail crops, close-up, duotone) into `public/projects/<slug>/`,
and writes `src/project-images.json`. Extra images with the same number-to-project mapping become extra gallery images.

## Chapters (`src/scenes/`)

| # | Chapter | Scene |
|---|---------|-------|
| 01 | Hero — loader galaxy → particle name | `intro.ts`, `particles.ts` |
| 02 | Main tech stack — technology towers | `towers.ts` |
| 03 | Experience snapshot — energy core + symbols | `symbols.ts` |
| 04 | Career journey — light rail | `timeline.ts` |
| 05 | Key achievements — wireframe assembly | `wireframe.ts` |
| 06 | Featured projects — portal + gallery hall (+ detail pages) | `portal.ts`, `gallery.ts`, `../detail.ts` |
| 07 | How I build — exploded architecture layers | `layers.ts` |
| 08 | How I solve problems — knot that untangles | `solve.ts` |
| 09 | Engineering impact — globe | `impact.ts` |
| 10 | Currently exploring — neural network | `explore.ts` |
| 11 | Contact — planetary horizon | `horizon.ts` |
| 12 | Outro — particle name | `intro.ts` |

Section text lives in `src/data.ts` (`STRENGTHS`, `WORKFLOW`, `PROBLEMS`, `REACH`, `EXPLORING`, …).
`src/main.ts` maps scroll position to each scene's progress, handles the loader, fades and navigation.

## Deploy (Netlify)

`netlify.toml` is included: build command `npm run build`, publish directory `dist`.

## Visual check

With `npm run preview` running: `node scripts/verify.mjs <outDir>` screenshots every scene
(add `http://localhost:4173/ 390 844` for a phone-size run).
