import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/** Final cinematic pass: fade-to-black, white portal flash, vignette, film grain, chromatic fringe. */
const FinalShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uFade: { value: 0 },
    uFlash: { value: 0 },
    uTime: { value: 0 },
    uGrain: { value: 0.05 },
    uVignette: { value: 0.9 },
    uAberration: { value: 0.0015 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uFade, uFlash, uTime, uGrain, uVignette, uAberration;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      vec2 off = d * uAberration * (0.5 + r2 * 4.0);
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      float vig = smoothstep(0.85, 0.15, r2 * uVignette * 2.2);
      col *= mix(0.55, 1.0, vig);
      col += (hash(vUv * 1000.0 + uTime) - 0.5) * uGrain;
      col *= (1.0 - uFade);
      vec3 flashCol = vec3(0.86, 0.92, 1.0);
      col = mix(col, flashCol, uFlash);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export class Renderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly composer: EffectComposer;
  readonly renderPass: RenderPass;
  readonly bloom: UnrealBloomPass;
  readonly final: ShaderPass;
  private dprCap: number;

  constructor(canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera, quality: "high" | "low") {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality === "high",
      powerPreference: "high-performance",
      alpha: false,
    });
    this.dprCap = quality === "high" ? 1.75 : 1.25;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.dprCap));
    this.renderer.setClearColor(0x03030a, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);

    const rt = new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType,
      samples: quality === "high" ? 4 : 0,
    });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, this.dprCap));
    this.composer.setSize(w, h);

    this.renderPass = new RenderPass(new THREE.Scene(), camera);
    this.composer.addPass(this.renderPass);

    // Safety net: a single NaN/Inf pixel would otherwise be smeared across the whole frame by bloom.
    this.composer.addPass(
      new ShaderPass({
        uniforms: { tDiffuse: { value: null } },
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: /* glsl */ `
          uniform sampler2D tDiffuse; varying vec2 vUv;
          void main() {
            vec4 c = texture2D(tDiffuse, vUv);
            if (any(isnan(c)) || any(isinf(c))) c = vec4(0.0, 0.0, 0.0, 1.0);
            gl_FragColor = clamp(c, 0.0, 64.0);
          }`,
      })
    );

    const bloomScale = quality === "high" ? 1 : 0.5;
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w * bloomScale, h * bloomScale), 0.8, 0.45, 0.3);
    this.composer.addPass(this.bloom);

    this.composer.addPass(new OutputPass());

    this.final = new ShaderPass(FinalShader);
    this.composer.addPass(this.final);
  }

  resize(w: number, h: number) {
    const dpr = Math.min(window.devicePixelRatio, this.dprCap);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
  }

  render(scene: THREE.Scene, dt: number) {
    this.renderPass.scene = scene;
    this.composer.render(dt);
  }
}
