import * as THREE from "three";
import { Ctx, Stage, easeInOut, easeOut, lerp, range, seeded } from "../engine/stage";
import { glowTexture, labelTexture, BODY_FONT } from "../engine/textures";
import { createStars } from "./particles";
import { DragSpin } from "../engine/pokes";

const LAYERS = [
  { title: "CLIENT", stack: "Angular · React · Next.js · Vue.js · TypeScript", color: new THREE.Color(0.25, 1.6, 2.2) },
  { title: "MOBILE", stack: "React Native · .NET MAUI · Kotlin · iOS · Android", color: new THREE.Color(1.3, 0.55, 2.4) },
  { title: "API & SERVICES", stack: "Go · Python · C# / .NET · Java · Node.js · REST · Microservices", color: new THREE.Color(2.2, 0.45, 1.8) },
  { title: "DATA", stack: "PostgreSQL · SQL Server · MySQL · MongoDB · Redis", color: new THREE.Color(0.4, 0.8, 2.5) },
  { title: "CLOUD & DEVOPS", stack: "AWS · Google Cloud · Azure · Docker · Kubernetes · Terraform", color: new THREE.Color(0.25, 1.6, 2.2) },
];

const W = 7.2, D = 4.4, T = 0.1;

interface Layer {
  group: THREE.Group;
  slab: THREE.Mesh;
  edges: THREE.LineSegments;
  label: THREE.Mesh;
  chips: THREE.InstancedMesh;
  color: THREE.Color;
}

/** Scene 3: transparent platforms separating into an exploded architecture diagram. */
export class LayersStage extends Stage {
  private layers: Layer[] = [];
  private stack = new THREE.Group();
  private ring: THREE.Mesh;
  private ring2: THREE.Mesh;
  private disc: THREE.Mesh;
  private packets: THREE.Points;
  private packetSeeds: Float32Array;

  constructor(ctx: Ctx) {
    super(ctx);
    this.bloom = 0.8;
    this.scene.fog = new THREE.FogExp2(0x03030c, 0.03);
    this.scene.add(new THREE.AmbientLight(0x6070ff, 0.35));
    const key = new THREE.DirectionalLight(0xb8a8ff, 1.2);
    key.position.set(5, 10, 6);
    this.scene.add(key);
    this.scene.add(this.stack);

    const slabGeo = new THREE.BoxGeometry(W, T, D);
    const edgeGeo = new THREE.EdgesGeometry(slabGeo);
    const chipGeo = new THREE.BoxGeometry(0.42, 0.06, 0.28);
    const rnd = seeded(5);

    LAYERS.forEach((L, i) => {
      const group = new THREE.Group();
      const slab = new THREE.Mesh(
        slabGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0x0c1030,
          emissive: L.color.clone().multiplyScalar(0.04),
          metalness: 0.2,
          roughness: 0.18,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      const edges = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: L.color, transparent: true }));
      group.add(slab, edges);

      // inner grid on the platform surface
      const grid = new THREE.GridHelper(W * 0.92, 18, L.color.clone().multiplyScalar(0.25), L.color.clone().multiplyScalar(0.12));
      grid.scale.z = D / W;
      grid.position.y = T / 2 + 0.003;
      (grid.material as THREE.Material).transparent = true;
      (grid.material as THREE.Material).opacity = 0.5;
      group.add(grid);

      const { texture, aspect } = labelTexture(
        [
          { text: L.title, size: 64, color: "#ffffff", weight: 700, spacing: 6 },
          { text: L.stack, size: 34, color: "#b9c6ff", weight: 500, font: BODY_FONT },
        ],
        { width: 1400 }
      );
      const lw = W * 0.86;
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(lw, lw / aspect),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
      );
      label.rotation.x = -Math.PI / 2;
      label.position.set(0, T / 2 + 0.01, D / 2 - (lw / aspect) / 2 - 0.25);
      group.add(label);

      // glowing "component" chips
      const chips = new THREE.InstancedMesh(
        chipGeo,
        new THREE.MeshBasicMaterial({ color: L.color.clone().multiplyScalar(0.8), transparent: true }),
        10
      );
      const m = new THREE.Matrix4();
      for (let c = 0; c < 10; c++) {
        m.makeTranslation((c % 5) * 0.9 - 1.8 + (rnd() - 0.5) * 0.2, T / 2 + 0.03, -D / 2 + 0.6 + Math.floor(c / 5) * 0.55);
        chips.setMatrixAt(c, m);
      }
      group.add(chips);

      this.stack.add(group);
      this.layers.push({ group, slab, edges, label, chips, color: L.color });
    });

    // glowing base ring
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(5.2, 0.035, 12, 200),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1.5, 2.6), transparent: true })
    );
    this.ring.rotation.x = Math.PI / 2;
    this.ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(5.9, 0.012, 8, 200),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 0.5, 2.4), transparent: true })
    );
    this.ring2.rotation.x = Math.PI / 2;
    this.disc = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshBasicMaterial({
        map: glowTexture("rgba(90,200,255,0.3)", "rgba(110,80,255,0.1)"),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.disc.rotation.x = -Math.PI / 2;
    this.scene.add(this.ring, this.ring2, this.disc);

    // data packets travelling between layers
    const n = 160;
    this.packetSeeds = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      this.packetSeeds[i * 3] = (rnd() - 0.5) * W * 0.8;
      this.packetSeeds[i * 3 + 1] = (rnd() - 0.5) * D * 0.7;
      this.packetSeeds[i * 3 + 2] = rnd();
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.packets = new THREE.Points(
      pg,
      new THREE.PointsMaterial({
        size: 0.09,
        color: new THREE.Color(0.6, 1.4, 2.4),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.packets.frustumCulled = false;
    this.scene.add(this.packets);
    this.scene.add(createStars(1200, 120, 14, 1.2));
    this.layers.forEach((L) => this.pokes.add(L.group, { hit: [L.slab], spin: 0.3, bounce: 0.8 }));
    this.rotor = new DragSpin(this.stack, 0.45);
  }

  update(p: number) {
    const t = this.ctx.time;
    const n = this.layers.length;
    const explode = easeInOut(range(p, 0.14, 0.45));
    const rearrange = easeInOut(range(p, 0.6, 0.85));
    const gap = lerp(0.16, 1.55, explode);
    const baseY = -((n - 1) * gap) / 2 + 0.6;

    this.layers.forEach((L, i) => {
      // first platform appears, then the rest stack in
      const appear = easeOut(range(p, 0.02 + i * 0.035, 0.12 + i * 0.035));
      const fan = (i - (n - 1) / 2) * 0.16 * rearrange;
      L.group.position.set(
        Math.sin(i * 1.7) * 0.5 * rearrange,
        baseY + i * gap + (1 - appear) * -1.2 + Math.sin(t * 0.8 + i) * 0.05 * explode,
        Math.cos(i * 1.3) * 0.4 * rearrange
      );
      L.group.rotation.y = fan;
      L.group.scale.setScalar(0.85 + appear * 0.15);
      (L.slab.material as THREE.MeshPhysicalMaterial).opacity = 0.32 * appear;
      const pulse = 0.75 + 0.25 * Math.sin(t * 2 + i * 1.3);
      const em = L.edges.material as THREE.LineBasicMaterial;
      em.opacity = appear;
      em.color.copy(L.color).multiplyScalar(pulse);
      (L.label.material as THREE.MeshBasicMaterial).opacity = appear * range(p, 0.2, 0.32);
      (L.chips.material as THREE.MeshBasicMaterial).opacity = appear * 0.8 * (0.6 + 0.4 * Math.sin(t * 3 + i));
    });

    const ringOn = easeOut(range(p, 0.32, 0.48));
    const lowest = baseY - 0.7;
    this.ring.position.y = this.ring2.position.y = lowest;
    this.disc.position.y = lowest - 0.01;
    (this.ring.material as THREE.MeshBasicMaterial).opacity = ringOn;
    (this.ring2.material as THREE.MeshBasicMaterial).opacity = ringOn * 0.7;
    (this.disc.material as THREE.MeshBasicMaterial).opacity = ringOn * 0.9;
    this.ring.scale.setScalar(0.6 + ringOn * 0.4);
    this.ring2.rotation.z = t * 0.1;

    // packets rise from the bottom layer to the top
    const flow = range(p, 0.45, 0.55);
    const pos = this.packets.geometry.getAttribute("position") as THREE.BufferAttribute;
    const top = baseY + (n - 1) * gap;
    for (let i = 0; i < pos.count; i++) {
      const s = this.packetSeeds;
      const f = (s[i * 3 + 2] + t * 0.12) % 1;
      pos.setXYZ(i, s[i * 3], lerp(baseY, top, f), s[i * 3 + 1]);
    }
    pos.needsUpdate = true;
    (this.packets.material as THREE.PointsMaterial).opacity = flow;

    this.stack.rotation.y = lerp(-0.5, 0.35, easeInOut(p));

    // Angled camera, slowly orbiting and rising over the structure.
    const a = lerp(0.65, 0.95, easeInOut(p));
    const dist = lerp(15, 13, easeInOut(range(p, 0, 0.5)));
    const h = lerp(5.5, 7.5, easeInOut(p));
    const shift = this.ctx.aspect > 1 ? 2.6 : 0;
    this.aim(
      new THREE.Vector3(Math.sin(a) * dist, h, Math.cos(a) * dist),
      // aim left of the structure so it sits on the right, clear of the text panel
      new THREE.Vector3(-Math.cos(a) * shift, 0.2, Math.sin(a) * shift),
      0.5
    );
  }
}
