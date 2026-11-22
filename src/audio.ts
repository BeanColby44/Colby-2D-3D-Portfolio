/**
 * Procedural sound: an adaptive action soundtrack + UI sound effects, all synthesised with Web Audio.
 * Nothing plays until the first user gesture (browser autoplay policy). The on/off choice is remembered.
 */

const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// D minor epic progression: Dm – Bb – F – C
const CHORDS = [
  { root: 50, tri: [0, 3, 7] },
  { root: 46, tri: [0, 4, 7] },
  { root: 53, tri: [0, 4, 7] },
  { root: 48, tri: [0, 4, 7] },
];
const BPM = 118;
const STEP = 60 / BPM / 4;

type Layer = "pad" | "bass" | "kick" | "hat" | "arp" | "snare" | "lead" | "braam";

export class SoundEngine {
  ctx: AudioContext | null = null;
  enabled: boolean;
  private master!: GainNode;
  private music!: GainNode;
  private musicFilter!: BiquadFilterNode;
  private sfx!: GainNode;
  private reverb!: ConvolverNode;
  private reverbSend!: GainNode;
  private delay!: DelayNode;
  private delaySend!: GainNode;
  private layers = {} as Record<Layer, GainNode>;
  private noise!: AudioBuffer;
  private intensity = 0.2;
  private nextTime = 0;
  private step = 0;
  private riserOsc: OscillatorNode | null = null;
  private riserGain: GainNode | null = null;
  private riserFilter: BiquadFilterNode | null = null;
  private lastHover = 0;
  private listeners: ((on: boolean) => void)[] = [];
  /** sidechain: pad / bass / arp / lead duck under every kick */
  private duck!: GainNode;
  private room = 0;

  constructor() {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("sound");
    } catch {}
    this.enabled = saved !== "off";
  }

  onChange(fn: (on: boolean) => void) {
    this.listeners.push(fn);
  }

  /** Must be called from a user gesture. Safe to call repeatedly. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended" && this.enabled) this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 5;
    comp.knee.value = 8;
    comp.attack.value = 0.005;
    comp.release.value = 0.2;
    this.master = ctx.createGain();
    this.master.gain.value = this.enabled ? 1.05 : 0;
    this.master.connect(comp).connect(ctx.destination);

    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = "lowpass";
    this.musicFilter.frequency.value = 18000;
    this.music = ctx.createGain();
    this.music.gain.value = 0;
    this.music.connect(this.musicFilter).connect(this.master);
    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.9;
    this.sfx.connect(this.master);

    // reverb from generated impulse
    this.reverb = ctx.createConvolver();
    const len = ctx.sampleRate * 2.6;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    this.reverb.buffer = ir;
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.35;
    this.reverbSend.connect(this.reverb).connect(this.master);

    // tempo-synced echo for the arp
    this.delay = ctx.createDelay(1);
    this.delay.delayTime.value = STEP * 3;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const dlp = ctx.createBiquadFilter();
    dlp.frequency.value = 3000;
    this.delay.connect(dlp).connect(fb).connect(this.delay);
    this.delaySend = ctx.createGain();
    this.delaySend.gain.value = 0.3;
    this.delaySend.connect(this.delay);
    this.delay.connect(this.music);

    this.duck = ctx.createGain();
    this.duck.connect(this.music);
    (["pad", "bass", "kick", "hat", "arp", "snare", "lead", "braam"] as Layer[]).forEach((l) => {
      const g = ctx.createGain();
      g.gain.value = 0;
      // melodic layers pump under the kick; drums and the braam hit the bus directly
      g.connect(l === "pad" || l === "bass" || l === "arp" || l === "lead" ? this.duck : this.music);
      this.layers[l] = g;
    });

    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = this.noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    this.nextTime = ctx.currentTime + 0.1;
    window.setInterval(() => this.schedule(), 25);
    this.music.gain.setTargetAtTime(0.9, ctx.currentTime, 1.5);
    this.applyIntensity();

    document.addEventListener("visibilitychange", () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend();
      else if (this.enabled) {
        this.ctx.resume();
        this.nextTime = this.ctx.currentTime + 0.05;
      }
    });
  }

  toggle(force?: boolean) {
    this.enabled = force ?? !this.enabled;
    try {
      localStorage.setItem("sound", this.enabled ? "on" : "off");
    } catch {}
    if (this.ctx) {
      this.master.gain.setTargetAtTime(this.enabled ? 1.05 : 0, this.ctx.currentTime, 0.15);
      if (this.enabled) this.ctx.resume();
    }
    this.listeners.forEach((f) => f(this.enabled));
  }

  /** 0..1 — controls how many soundtrack layers are playing. */
  setIntensity(v: number) {
    const nv = Math.min(1, Math.max(0, v));
    if (Math.abs(nv - this.intensity) < 0.02) return;
    this.intensity = nv;
    this.applyIntensity();
  }

  /** Muffles the music (lock screen). */
  setMuffled(on: boolean) {
    if (!this.ctx) return;
    this.musicFilter.frequency.setTargetAtTime(on ? 520 : 18000, this.ctx.currentTime, on ? 0.25 : 0.6);
  }

  private applyIntensity() {
    if (!this.ctx) return;
    const I = this.intensity;
    const t = this.ctx.currentTime;
    const target: Record<Layer, number> = {
      pad: 0.22,
      bass: smoothstep(0.1, 0.3, I) * 0.46,
      kick: smoothstep(0.3, 0.45, I) * 0.9,
      hat: smoothstep(0.45, 0.6, I) * 0.14,
      arp: smoothstep(0.5, 0.7, I) * 0.13,
      snare: smoothstep(0.66, 0.82, I) * 0.34,
      lead: smoothstep(0.74, 0.9, I) * 0.12,
      braam: smoothstep(0.55, 0.75, I) * 0.5,
    };
    (Object.keys(target) as Layer[]).forEach((k) => this.layers[k].gain.setTargetAtTime(target[k], t, 0.6));
  }

  /* ---------------- soundtrack sequencer ---------------- */
  private schedule() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    if (this.nextTime < ctx.currentTime - 0.2) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + 0.12) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += STEP;
      this.step++;
    }
  }

  private on(l: Layer) {
    return this.layers[l].gain.value > 0.005 || this.layerTarget(l) > 0.005;
  }
  private layerTarget(l: Layer) {
    const I = this.intensity;
    switch (l) {
      case "bass": return smoothstep(0.1, 0.3, I);
      case "kick": return smoothstep(0.3, 0.45, I);
      case "hat": return smoothstep(0.45, 0.6, I);
      case "arp": return smoothstep(0.5, 0.7, I);
      case "snare": return smoothstep(0.66, 0.82, I);
      case "lead": return smoothstep(0.74, 0.9, I);
      case "braam": return smoothstep(0.55, 0.75, I);
      default: return 1;
    }
  }

  private playStep(step: number, t: number) {
    const s = step % 16;
    const bar = Math.floor(step / 16);
    const chord = CHORDS[bar % 4];
    if (s === 0) this.pad(t, chord, STEP * 16);
    if (this.on("braam") && s === 0 && bar % 4 === 0) this.braam(t, chord.root);
    if (this.on("lead")) {
      const LEAD = [0, -1, -1, 2, -1, -1, 4, -1, 3, -1, 2, -1, 1, -1, 2, -1];
      const k = LEAD[s];
      if (k >= 0) this.lead(t, chord.root + 12 + chord.tri[k % 3] + (k >= 3 ? 12 : 0), STEP * 2.5);
    }
    if (this.on("kick") && (s % 4 === 0 || (bar % 4 === 3 && s === 14))) this.kick(t);
    if (this.on("snare") && (s === 4 || s === 12)) this.snare(t);
    if (this.on("hat")) this.hat(t, s % 4 === 2 ? 1 : 0.45);
    if (this.on("bass")) {
      const drive = this.intensity > 0.82;
      if (drive || s % 2 === 0) this.bass(t, chord.root - 12 + (s === 6 || s === 14 ? 12 : 0), STEP * (drive ? 0.9 : 1.6));
    }
    if (this.on("arp")) {
      const tones = [0, 1, 2, 3, 4, 5, 4, 2];
      const k = tones[s % 8];
      const n = chord.root + 12 + chord.tri[k % 3] + (k >= 3 ? 12 : 0);
      this.arp(t, n);
    }
  }

  private env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  private kick(t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    this.env(g, t, 1, 0.003, 0.34);
    o.connect(g).connect(this.layers.kick);
    o.start(t);
    o.stop(t + 0.4);
    // beater click for punch
    this.noiseHit(t, this.layers.kick, "highpass", 3500, 0.7, 0.35, 0.015);
    // sidechain pump
    const k = this.layerTarget("kick");
    this.duck.gain.cancelScheduledValues(t);
    this.duck.gain.setValueAtTime(1 - 0.55 * k, t);
    this.duck.gain.linearRampToValueAtTime(1, t + 0.22);
  }

  private noiseHit(t: number, dest: AudioNode, type: BiquadFilterType, freq: number, q: number, peak: number, decay: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    this.env(g, t, peak, 0.002, decay);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 0.5);
    src.stop(t + decay + 0.05);
    return g;
  }

  private snare(t: number) {
    const g = this.noiseHit(t, this.layers.snare, "bandpass", 1900, 0.7, 0.9, 0.2);
    g.connect(this.reverbSend);
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    this.env(og, t, 0.5, 0.002, 0.1);
    o.connect(og).connect(this.layers.snare);
    o.start(t);
    o.stop(t + 0.15);
  }

  private hat(t: number, accent: number) {
    this.noiseHit(t, this.layers.hat, "highpass", 7500, 0.5, 0.5 * accent, accent > 0.9 ? 0.09 : 0.04);
  }

  private bass(t: number, midi: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = midiHz(midi);
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = midiHz(midi - 12);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 6;
    f.frequency.setValueAtTime(1100, t);
    f.frequency.exponentialRampToValueAtTime(180, t + dur);
    const g = ctx.createGain();
    this.env(g, t, 0.7, 0.005, dur);
    o.connect(f);
    sub.connect(f);
    f.connect(g).connect(this.layers.bass);
    o.start(t);
    sub.start(t);
    o.stop(t + dur + 0.05);
    sub.stop(t + dur + 0.05);
  }

  private arp(t: number, midi: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = midiHz(midi);
    const o2 = ctx.createOscillator();
    o2.type = "square";
    o2.frequency.value = midiHz(midi) * 1.003;
    const f = ctx.createBiquadFilter();
    f.frequency.value = 2600;
    const g = ctx.createGain();
    this.env(g, t, 0.5, 0.003, 0.2);
    const g2 = ctx.createGain();
    g2.gain.value = 0.18;
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(f).connect(this.layers.arp);
    f.connect(this.delaySend);
    o.start(t);
    o2.start(t);
    o.stop(t + 0.3);
    o2.stop(t + 0.3);
  }

  private pad(t: number, chord: { root: number; tri: number[] }, dur: number) {
    const ctx = this.ctx!;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(500, t);
    f.frequency.linearRampToValueAtTime(1400 + this.intensity * 1600, t + dur * 0.5);
    f.frequency.linearRampToValueAtTime(600, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.32, t + 1.0);
    g.gain.setValueAtTime(0.32, t + dur - 0.6);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.8);
    f.connect(g);
    g.connect(this.layers.pad);
    g.connect(this.reverbSend);
    const notes = [chord.root - 12, ...chord.tri.map((i) => chord.root + i)];
    for (const n of notes)
      for (const det of [-8, 8]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = midiHz(n);
        o.detune.value = det;
        const og = ctx.createGain();
        og.gain.value = 0.12;
        o.connect(og).connect(f);
        o.start(t);
        o.stop(t + dur + 1);
      }
  }

  /** Cinematic low brass "braam": stacked detuned saws with an opening filter. */
  private braam(t: number, root: number) {
    const ctx = this.ctx!;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 3;
    f.frequency.setValueAtTime(160, t);
    f.frequency.exponentialRampToValueAtTime(1800, t + 0.5);
    f.frequency.exponentialRampToValueAtTime(220, t + 2.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
    f.connect(g);
    g.connect(this.layers.braam);
    g.connect(this.reverbSend);
    for (const n of [root - 24, root - 17, root - 12])
      for (const det of [-14, 0, 14]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = midiHz(n);
        o.detune.value = det;
        o.connect(f);
        o.start(t);
        o.stop(t + 3);
      }
  }

  /** Lead synth with a little glide and echo. */
  private lead(t: number, midi: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(midiHz(midi) * 0.985, t);
    o.frequency.exponentialRampToValueAtTime(midiHz(midi), t + 0.04);
    const o2 = ctx.createOscillator();
    o2.type = "square";
    o2.frequency.value = midiHz(midi) * 1.005;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 5;
    f.frequency.setValueAtTime(3200, t);
    f.frequency.exponentialRampToValueAtTime(900, t + dur);
    const g = ctx.createGain();
    this.env(g, t, 0.45, 0.01, dur);
    o.connect(f);
    o2.connect(f);
    f.connect(g).connect(this.layers.lead);
    g.connect(this.delaySend);
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 0.1);
    o2.stop(t + dur + 0.1);
  }

  /** Bigger space (more reverb) for the gallery hall. */
  setRoom(k: number) {
    if (!this.ctx || Math.abs(k - this.room) < 0.01) return;
    this.room = k;
    this.reverbSend.gain.setTargetAtTime(0.35 + k * 0.5, this.ctx.currentTime, 0.4);
  }

  /** Scene change: sub boom + noise crash + metallic shimmer + rising whoosh. */
  transition(power = 1) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(70, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 1.4);
    const og = ctx.createGain();
    this.env(og, t, 0.95 * power, 0.008, 1.5);
    o.connect(og).connect(this.sfx);
    o.start(t);
    o.stop(t + 1.6);
    const crash = this.noiseHit(t, this.sfx, "highpass", 4500, 0.4, 0.28 * power, 1.4);
    crash.connect(this.reverbSend);
    [1180, 1570, 2210, 2960].forEach((fr, i) => {
      const s = ctx.createOscillator();
      s.type = "sine";
      s.frequency.value = fr * (1 + (Math.random() - 0.5) * 0.02);
      const sg = ctx.createGain();
      this.env(sg, t + i * 0.012, 0.05 * power, 0.005, 1.6);
      s.connect(sg).connect(this.sfx);
      sg.connect(this.reverbSend);
      s.start(t);
      s.stop(t + 1.8);
    });
    this.whoosh(1.2 * power, true);
  }

  /** Pressing a 3D object: punchy thump + pitched blip. */
  poke(pitch = 1) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(220 * pitch, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.18);
    const g = ctx.createGain();
    this.env(g, t, 0.6, 0.003, 0.25);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + 0.3);
    const b = ctx.createOscillator();
    b.type = "triangle";
    b.frequency.setValueAtTime(900 * pitch, t);
    b.frequency.exponentialRampToValueAtTime(1800 * pitch, t + 0.08);
    const bg = ctx.createGain();
    this.env(bg, t, 0.12, 0.003, 0.18);
    b.connect(bg).connect(this.sfx);
    bg.connect(this.reverbSend);
    b.start(t);
    b.stop(t + 0.22);
  }

  /* ---------------- sound effects ---------------- */
  private ready() {
    return !!this.ctx && this.enabled && this.ctx.state === "running";
  }

  hover() {
    if (!this.ready()) return;
    const now = performance.now();
    if (now - this.lastHover < 45) return;
    this.lastHover = now;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    const base = 1500 + Math.random() * 400;
    o.frequency.setValueAtTime(base, t);
    o.frequency.exponentialRampToValueAtTime(base * 1.6, t + 0.05);
    const g = ctx.createGain();
    this.env(g, t, 0.06, 0.004, 0.07);
    o.connect(g).connect(this.sfx);
    g.connect(this.reverbSend);
    o.start(t);
    o.stop(t + 0.1);
  }

  click() {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    [880, 1320].forEach((fr, i) => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = fr;
      const g = ctx.createGain();
      this.env(g, t + i * 0.045, 0.12, 0.003, 0.12);
      o.connect(g).connect(this.sfx);
      g.connect(this.reverbSend);
      o.start(t + i * 0.045);
      o.stop(t + i * 0.045 + 0.2);
    });
  }

  tick(pitch = 1) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.value = 900 * pitch;
    const f = ctx.createBiquadFilter();
    f.frequency.value = 3000;
    const g = ctx.createGain();
    this.env(g, t, 0.05, 0.002, 0.04);
    o.connect(f).connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + 0.07);
  }

  whoosh(strength = 1, rising = true) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const dur = 0.5 + strength * 0.6;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 1.4;
    f.frequency.setValueAtTime(rising ? 250 : 3500, t);
    f.frequency.exponentialRampToValueAtTime(rising ? 3500 : 250, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4 * strength, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.sfx);
    g.connect(this.reverbSend);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  impact(strength = 1) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 0.9);
    const g = ctx.createGain();
    this.env(g, t, 0.9 * strength, 0.005, 1.2);
    o.connect(g).connect(this.sfx);
    g.connect(this.reverbSend);
    o.start(t);
    o.stop(t + 1.3);
    const n = this.noiseHit(t, this.sfx, "lowpass", 1400, 0.5, 0.5 * strength, 0.6);
    n.connect(this.reverbSend);
  }

  /** Electric crackle: noisy high zap + a short pitched snap. */
  zap(power = 1) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const g = this.noiseHit(t, this.sfx, "highpass", 2500, 0.7, 0.35 * power, 0.12);
    g.connect(this.reverbSend);
    // crackle: a few rapid clicks
    for (let i = 0; i < 4; i++) this.noiseHit(t + 0.02 + Math.random() * 0.1, this.sfx, "bandpass", 3000 + Math.random() * 4000, 3, 0.25 * power, 0.02);
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(1800, t);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.18);
    const og = ctx.createGain();
    this.env(og, t, 0.12 * power, 0.002, 0.2);
    o.connect(og).connect(this.sfx);
    o.start(t);
    o.stop(t + 0.25);
  }

  /** Comet flight: roaring noise sweep + sub rumble + rising tone + electric crackle. */
  comet(dur: number) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 1.1;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.3);
    f.frequency.exponentialRampToValueAtTime(1600, t + dur * 0.85);
    f.frequency.exponentialRampToValueAtTime(5000, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.42, t + dur * 0.28);
    g.gain.setValueAtTime(0.42, t + dur * 0.85);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
    src.connect(f).connect(g).connect(this.sfx);
    g.connect(this.reverbSend);
    src.start(t);
    src.stop(t + dur + 0.6);
    // sub rumble
    const sub = ctx.createOscillator();
    sub.frequency.setValueAtTime(38, t);
    sub.frequency.linearRampToValueAtTime(62, t + dur);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.5, t + dur * 0.3);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.3);
    sub.connect(sg).connect(this.sfx);
    sub.start(t);
    sub.stop(t + dur + 0.4);
    // rising tone
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(440, t + dur);
    const of = ctx.createBiquadFilter();
    of.frequency.setValueAtTime(400, t);
    of.frequency.exponentialRampToValueAtTime(3000, t + dur);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.08, t + dur * 0.5);
    og.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
    o.connect(of).connect(og).connect(this.sfx);
    o.start(t);
    o.stop(t + dur + 0.3);
    // crackle while it carves
    for (let i = 0; i < dur * 22; i++) {
      const at = t + dur * 0.28 + Math.random() * dur * 0.6;
      this.noiseHit(at, this.sfx, "bandpass", 2500 + Math.random() * 5000, 4, 0.18 + Math.random() * 0.15, 0.015 + Math.random() * 0.02);
    }
  }

  /** Bright rising arpeggio + low hit. */
  unlockFx() {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    [62, 69, 74, 81, 86].forEach((m, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = midiHz(m);
      const g = ctx.createGain();
      this.env(g, t + i * 0.055, 0.13, 0.004, 0.6);
      o.connect(g).connect(this.sfx);
      g.connect(this.reverbSend);
      o.start(t + i * 0.055);
      o.stop(t + i * 0.055 + 0.7);
    });
    this.impact(0.7);
  }

  lockFx() {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.7);
    const f = ctx.createBiquadFilter();
    f.frequency.setValueAtTime(2400, t);
    f.frequency.exponentialRampToValueAtTime(300, t + 0.7);
    const g = ctx.createGain();
    this.env(g, t, 0.18, 0.01, 0.8);
    o.connect(f).connect(g).connect(this.sfx);
    g.connect(this.reverbSend);
    o.start(t);
    o.stop(t + 0.9);
  }

  /** Continuous tension riser while holding (level 0..1). */
  riser(level: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    if (!this.riserOsc && level > 0.01 && this.enabled) {
      this.riserOsc = ctx.createOscillator();
      this.riserOsc.type = "sawtooth";
      this.riserFilter = ctx.createBiquadFilter();
      this.riserFilter.type = "lowpass";
      this.riserFilter.Q.value = 8;
      this.riserGain = ctx.createGain();
      this.riserGain.gain.value = 0;
      this.riserOsc.connect(this.riserFilter).connect(this.riserGain).connect(this.sfx);
      this.riserGain.connect(this.reverbSend);
      this.riserOsc.start();
    }
    if (!this.riserOsc) return;
    this.riserOsc.frequency.setTargetAtTime(55 + level * 165, t, 0.05);
    this.riserFilter!.frequency.setTargetAtTime(200 + level * 2600, t, 0.05);
    this.riserGain!.gain.setTargetAtTime(this.enabled ? level * 0.09 : 0, t, 0.06);
    if (level <= 0.01) {
      const o = this.riserOsc;
      this.riserOsc = null;
      setTimeout(() => o.stop(), 400);
    }
  }
}

export const sound = new SoundEngine();
