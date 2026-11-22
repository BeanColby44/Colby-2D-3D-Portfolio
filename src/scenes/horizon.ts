import * as THREE from "three";
import { Ctx, Stage, easeInOut, lerp, range } from "../engine/stage";
import { createStars } from "./particles";

const planetVertex = /* glsl */ `
  varying vec3 vN; varying vec3 vV; varying vec3 vP;
  void main() {
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    vP = position;
    gl_Position = projectionMatrix * mv;
  }
`;
const planetFragment = /* glsl */ `
  uniform float uTime, uOn;
  varying vec3 vN; varying vec3 vV; varying vec3 vP;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(17.1, 113.7, 51.3))) * 43758.5); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float n = mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                  mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    return n;
  }
  void main() {
    float fres = pow(clamp(1.0 - dot(vN, vV), 0.0, 1.0), 3.0);
    float n = noise(vP * 0.12 + vec3(uTime * 0.01, 0.0, 0.0)) * 0.6 + noise(vP * 0.5) * 0.4;
    vec3 surface = mix(vec3(0.01, 0.015, 0.04), vec3(0.03, 0.05, 0.12), n);
    vec3 rim = vec3(0.25, 0.8, 1.8) * fres * 1.4 + vec3(0.5, 0.35, 1.6) * pow(fres, 6.0) * 1.2;
    gl_FragColor = vec4((surface + rim) * uOn, 1.0);
  }
`;
const atmoFragment = /* glsl */ `
  uniform float uOn;
  varying vec3 vN; varying vec3 vV;
  void main() {
    float f = pow(max(0.72 - dot(vN, vV), 0.0), 4.0);
    vec3 col = mix(vec3(0.2, 0.7, 1.6), vec3(0.55, 0.4, 1.6), f * 0.4);
    gl_FragColor = vec4(col * f * 0.8 * uOn, f * uOn);
  }
`;

/** Scene 9: deep starfield above a luminous curved planetary horizon. */
export class HorizonStage extends Stage {
  private planet: THREE.Mesh;
  private atmo: THREE.Mesh;
  private stars: THREE.Points;
  private far: THREE.Points;

  constructor(ctx: Ctx) {
    super(ctx);
    this.bloom = 0.7;
    const R = 46;
    const center = new THREE.Vector3(0, -R - 5.5, -30);
    this.planet = new THREE.Mesh(
      new THREE.SphereGeometry(R, 160, 96),
      new THREE.ShaderMaterial({
        vertexShader: planetVertex,
        fragmentShader: planetFragment,
        uniforms: { uTime: { value: 0 }, uOn: { value: 0 } },
      })
    );
    this.planet.position.copy(center);
    this.atmo = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.035, 160, 96),
      new THREE.ShaderMaterial({
        vertexShader: planetVertex,
        fragmentShader: atmoFragment,
        uniforms: { uOn: { value: 0 } },
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.atmo.position.copy(center);
    this.scene.add(this.planet, this.atmo);

    this.stars = createStars(ctx.quality === "high" ? 5000 : 2200, 160, 41, 1.6);
    this.far = createStars(ctx.quality === "high" ? 600 : 300, 40, 43, 2.4);
    this.far.position.z = -20;
    this.scene.add(this.stars, this.far);
  }

  update(p: number) {
    const t = this.ctx.time;
    const on = easeInOut(range(p, 0.02, 0.3));
    (this.planet.material as THREE.ShaderMaterial).uniforms.uOn.value = on;
    (this.planet.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    (this.atmo.material as THREE.ShaderMaterial).uniforms.uOn.value = on;
    this.planet.rotation.y = t * 0.004;
    this.stars.rotation.y = t * 0.002;
    this.far.rotation.y = -t * 0.006;

    // slow, restrained push-in
    const k = easeInOut(p);
    this.aim(new THREE.Vector3(0, lerp(3.2, 1.4, k), lerp(24, 15, k)), new THREE.Vector3(0, lerp(2.5, 1.2, k), -40), 0.3);
  }
}
