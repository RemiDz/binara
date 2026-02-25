/**
 * Procedural ambient sound synthesis using Web Audio API.
 * Each sound is generated in real-time with randomised parameters
 * so no two 30-second windows sound identical.
 * Zero bandwidth — all client-side synthesis.
 */

// ─── Interface ───

export interface AmbientSynth {
  start(ctx: AudioContext, destination: AudioNode): void;
  stop(): void;
  setVolume(volume: number): void;
  readonly gainNode: GainNode | null;
  readonly isActive: boolean;
}

// ─── Factory ───

export function createAmbientSynth(type: string): AmbientSynth {
  switch (type) {
    case 'rain': return new RainSynth();
    case 'ocean': return new OceanSynth();
    case 'bowls': return new BowlsSynth();
    case 'forest': return new ForestSynth();
    case 'fireplace': return new FireSynth();
    case 'white': return new WhiteNoiseSynth();
    case 'pink': return new PinkNoiseSynth();
    case 'brown': return new BrownNoiseSynth();
    default: return new WhiteNoiseSynth();
  }
}

// ─── Noise Buffer Utilities ───

function createNoiseBuffer(
  ctx: AudioContext,
  type: 'white' | 'pink' | 'brown',
  durationSeconds = 4,
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * durationSeconds;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else {
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
  }

  return buffer;
}

function createNoiseSource(ctx: AudioContext, type: 'white' | 'pink' | 'brown'): AudioBufferSourceNode {
  const buffer = createNoiseBuffer(ctx, type, 4);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

// ─── Base class with common cleanup ───

abstract class BaseSynth implements AmbientSynth {
  protected ctx: AudioContext | null = null;
  protected _gainNode: GainNode | null = null;
  protected _active = false;
  protected timeouts: ReturnType<typeof setTimeout>[] = [];
  protected intervals: ReturnType<typeof setInterval>[] = [];
  protected sources: AudioBufferSourceNode[] = [];
  protected oscillators: OscillatorNode[] = [];
  protected nodes: AudioNode[] = [];

  get gainNode(): GainNode | null { return this._gainNode; }
  get isActive(): boolean { return this._active; }

  setVolume(volume: number): void {
    if (!this._gainNode || !this.ctx) return;
    const v = Math.min(Math.max(volume, 0), 1);
    this._gainNode.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  stop(): void {
    this._active = false;
    for (const t of this.timeouts) clearTimeout(t);
    for (const i of this.intervals) clearInterval(i);
    this.timeouts = [];
    this.intervals = [];

    for (const osc of this.oscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
      osc.disconnect();
    }
    for (const src of this.sources) {
      try { src.stop(); } catch { /* already stopped */ }
      src.disconnect();
    }
    for (const node of this.nodes) {
      node.disconnect();
    }
    if (this._gainNode) {
      this._gainNode.disconnect();
    }

    this.oscillators = [];
    this.sources = [];
    this.nodes = [];
    this._gainNode = null;
    this.ctx = null;
  }

  protected initOutput(ctx: AudioContext, destination: AudioNode): void {
    this.ctx = ctx;
    this._active = true;
    this._gainNode = ctx.createGain();
    this._gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    this._gainNode.connect(destination);
  }

  protected addTimeout(fn: () => void, ms: number): void {
    const id = setTimeout(() => {
      const idx = this.timeouts.indexOf(id);
      if (idx !== -1) this.timeouts.splice(idx, 1);
      fn();
    }, ms);
    this.timeouts.push(id);
  }

  protected addInterval(fn: () => void, ms: number): void {
    this.intervals.push(setInterval(fn, ms));
  }

  protected trackOsc(osc: OscillatorNode): OscillatorNode {
    this.oscillators.push(osc);
    return osc;
  }

  protected trackSource(src: AudioBufferSourceNode): AudioBufferSourceNode {
    this.sources.push(src);
    return src;
  }

  protected trackNode<T extends AudioNode>(node: T): T {
    this.nodes.push(node);
    return node;
  }

  abstract start(ctx: AudioContext, destination: AudioNode): void;
}

// ─── Rain ───

class RainSynth extends BaseSynth {
  start(ctx: AudioContext, destination: AudioNode): void {
    this.initOutput(ctx, destination);
    const now = ctx.currentTime;
    const out = this._gainNode!;

    // Base layer: white noise → bandpass
    const noise = this.trackSource(createNoiseSource(ctx, 'white'));
    const bp = this.trackNode(ctx.createBiquadFilter());
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1200, now);
    bp.Q.setValueAtTime(0.8, now);

    const baseGain = this.trackNode(ctx.createGain());
    baseGain.gain.setValueAtTime(0.3, now);

    noise.connect(bp).connect(baseGain).connect(out);
    noise.start(now);

    // LFO on bandpass frequency for drift
    const lfo = this.trackOsc(ctx.createOscillator());
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.03 + Math.random() * 0.05, now);
    const lfoGain = this.trackNode(ctx.createGain());
    lfoGain.gain.setValueAtTime(400, now);
    lfo.connect(lfoGain).connect(bp.frequency);
    lfo.start(now);

    // Drift LFO rate over time
    this.addInterval(() => {
      if (!this._active || !this.ctx) return;
      lfo.frequency.setTargetAtTime(0.03 + Math.random() * 0.05, this.ctx.currentTime, 5);
    }, (20 + Math.random() * 20) * 1000);

    // Rain drops
    this.scheduleRainDrop();

    // Distant thunder (rare)
    this.scheduleThunder();
  }

  private scheduleRainDrop(): void {
    if (!this._active) return;
    const delay = 50 + Math.random() * 250;

    this.addTimeout(() => {
      if (!this._active || !this.ctx || !this._gainNode) return;

      const bufferSize = 256 + Math.floor(Math.random() * 512);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const filter = this.trackNode(this.ctx.createBiquadFilter());
      filter.type = 'highpass';
      filter.frequency.value = 1500 + Math.random() * 4000;

      const gain = this.trackNode(this.ctx.createGain());
      gain.gain.value = 0.02 + Math.random() * 0.04;

      const panner = this.trackNode(this.ctx.createStereoPanner());
      panner.pan.value = Math.random() * 2 - 1;

      source.connect(filter).connect(gain).connect(panner).connect(this._gainNode!);
      source.start();

      this.scheduleRainDrop();
    }, delay);
  }

  private scheduleThunder(): void {
    if (!this._active) return;
    const delay = (15 + Math.random() * 45) * 1000;

    this.addTimeout(() => {
      if (!this._active || !this.ctx || !this._gainNode) return;

      const source = createNoiseSource(this.ctx, 'brown');
      const lp = this.trackNode(this.ctx.createBiquadFilter());
      lp.type = 'lowpass';
      lp.frequency.value = 100 + Math.random() * 100;

      const gain = this.trackNode(this.ctx.createGain());
      const now = this.ctx.currentTime;
      const vol = 0.05 + Math.random() * 0.04;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.5);
      gain.gain.setTargetAtTime(0, now + 0.8, 0.3);

      source.connect(lp).connect(gain).connect(this._gainNode!);
      source.start(now);
      source.stop(now + 2.5);

      this.scheduleThunder();
    }, delay);
  }
}

// ─── Ocean ───

class OceanSynth extends BaseSynth {
  start(ctx: AudioContext, destination: AudioNode): void {
    this.initOutput(ctx, destination);
    const now = ctx.currentTime;
    const out = this._gainNode!;

    // Surge layer: brown noise → lowpass, volume modulated by slow LFO
    const surgeNoise = this.trackSource(createNoiseSource(ctx, 'brown'));
    const surgeLp = this.trackNode(ctx.createBiquadFilter());
    surgeLp.type = 'lowpass';
    surgeLp.frequency.setValueAtTime(400, now);
    const surgeGain = this.trackNode(ctx.createGain());
    surgeGain.gain.setValueAtTime(0.35, now);

    const surgeLfo = this.trackOsc(ctx.createOscillator());
    surgeLfo.type = 'sine';
    surgeLfo.frequency.setValueAtTime(0.05 + Math.random() * 0.03, now);
    const surgeLfoGain = this.trackNode(ctx.createGain());
    surgeLfoGain.gain.setValueAtTime(0.2, now);
    surgeLfo.connect(surgeLfoGain).connect(surgeGain.gain);
    surgeLfo.start(now);

    surgeNoise.connect(surgeLp).connect(surgeGain).connect(out);
    surgeNoise.start(now);

    // Drift surge LFO rate
    this.addInterval(() => {
      if (!this._active || !this.ctx) return;
      surgeLfo.frequency.setTargetAtTime(0.05 + Math.random() * 0.03, this.ctx.currentTime, 8);
    }, (30 + Math.random() * 30) * 1000);

    // Wash layer: white noise → bandpass, faster LFO
    const washNoise = this.trackSource(createNoiseSource(ctx, 'white'));
    const washBp = this.trackNode(ctx.createBiquadFilter());
    washBp.type = 'bandpass';
    washBp.frequency.setValueAtTime(600, now);
    washBp.Q.setValueAtTime(0.5, now);
    const washGain = this.trackNode(ctx.createGain());
    washGain.gain.setValueAtTime(0.12, now);

    const washLfo = this.trackOsc(ctx.createOscillator());
    washLfo.type = 'sine';
    washLfo.frequency.setValueAtTime(0.1 + Math.random() * 0.05, now);
    const washLfoGain = this.trackNode(ctx.createGain());
    washLfoGain.gain.setValueAtTime(0.08, now);
    washLfo.connect(washLfoGain).connect(washGain.gain);
    washLfo.start(now);

    washNoise.connect(washBp).connect(washGain).connect(out);
    washNoise.start(now);

    // Foam layer: white noise → highpass, fast LFO
    const foamNoise = this.trackSource(createNoiseSource(ctx, 'white'));
    const foamHp = this.trackNode(ctx.createBiquadFilter());
    foamHp.type = 'highpass';
    foamHp.frequency.setValueAtTime(3000, now);
    const foamGain = this.trackNode(ctx.createGain());
    foamGain.gain.setValueAtTime(0.05, now);

    const foamLfo = this.trackOsc(ctx.createOscillator());
    foamLfo.type = 'sine';
    foamLfo.frequency.setValueAtTime(0.25 + Math.random() * 0.1, now);
    const foamLfoGain = this.trackNode(ctx.createGain());
    foamLfoGain.gain.setValueAtTime(0.02, now);
    foamLfo.connect(foamLfoGain).connect(foamGain.gain);
    foamLfo.start(now);

    foamNoise.connect(foamHp).connect(foamGain).connect(out);
    foamNoise.start(now);

    // Random wave crashes
    this.scheduleWaveCrash();
  }

  private scheduleWaveCrash(): void {
    if (!this._active) return;
    const delay = (20 + Math.random() * 70) * 1000;

    this.addTimeout(() => {
      if (!this._active || !this.ctx || !this._gainNode) return;

      const duration = 2 + Math.random() * 3;
      const now = this.ctx.currentTime;

      const source = createNoiseSource(this.ctx, 'white');
      const filter = this.trackNode(this.ctx.createBiquadFilter());
      filter.type = 'lowpass';
      filter.frequency.value = 1000 + Math.random() * 2000;

      const gain = this.trackNode(this.ctx.createGain());
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.05, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      const panner = this.trackNode(this.ctx.createStereoPanner());
      panner.pan.value = Math.random() * 1.4 - 0.7;

      source.connect(filter).connect(gain).connect(panner).connect(this._gainNode!);
      source.start(now);
      source.stop(now + duration + 0.1);

      this.scheduleWaveCrash();
    }, delay);
  }
}

// ─── Singing Bowls (original buffer-loop — warm, authentic, steady) ───

class BowlsSynth extends BaseSynth {
  private static readonly BUFFER_DURATION = 4; // seconds — loops seamlessly
  private static readonly FREQUENCIES = [396, 528, 639];
  private static readonly AMPLITUDES = [0.15, 0.12, 0.08];

  start(ctx: AudioContext, destination: AudioNode): void {
    this.initOutput(ctx, destination);

    const buffer = this.createBowlBuffer(ctx);

    const source = this.trackSource(ctx.createBufferSource());
    source.buffer = buffer;
    source.loop = true;
    source.connect(this._gainNode!);
    source.start(ctx.currentTime);
  }

  private createBowlBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * BowlsSynth.BUFFER_DURATION;
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / ctx.sampleRate;
        let sample = 0;
        for (let f = 0; f < BowlsSynth.FREQUENCIES.length; f++) {
          // Slight detuning per channel for stereo width
          const freq = BowlsSynth.FREQUENCIES[f] + (ch === 0 ? -0.5 : 0.5) * (f + 1);
          const amp = BowlsSynth.AMPLITUDES[f];
          // Gentle amplitude envelope
          const env = 0.6 + 0.4 * Math.sin(t * Math.PI * 2 / (BowlsSynth.BUFFER_DURATION * (f + 1)));
          sample += Math.sin(t * freq * Math.PI * 2) * amp * env;
        }
        data[i] = sample;
      }
    }

    return buffer;
  }
}

// ─── Forest ───
// Architecture: wind/foliage background + FM-modulated bird phrases with
// individual notes (attack-sustain-release), vibrato, silence gaps, multiple birds.

class ForestSynth extends BaseSynth {
  private birdCount = 3;

  start(ctx: AudioContext, destination: AudioNode): void {
    this.initOutput(ctx, destination);
    const now = ctx.currentTime;
    const out = this._gainNode!;

    // Base ambience: brown noise → lowpass (barely audible forest floor)
    const baseNoise = this.trackSource(createNoiseSource(ctx, 'brown'));
    const baseLp = this.trackNode(ctx.createBiquadFilter());
    baseLp.type = 'lowpass';
    baseLp.frequency.setValueAtTime(600, now);
    baseLp.Q.setValueAtTime(0.5, now);

    const baseGain = this.trackNode(ctx.createGain());
    baseGain.gain.setValueAtTime(0.12, now);

    baseNoise.connect(baseLp).connect(baseGain).connect(out);
    baseNoise.start(now);

    // Wind layer: pink noise → bandpass with slow LFO
    const windNoise = this.trackSource(createNoiseSource(ctx, 'pink'));
    const windBp = this.trackNode(ctx.createBiquadFilter());
    windBp.type = 'bandpass';
    windBp.frequency.setValueAtTime(400, now);
    windBp.Q.setValueAtTime(0.5, now);

    const windGain = this.trackNode(ctx.createGain());
    windGain.gain.setValueAtTime(0.15, now);

    // Wind LFO modulates both filter frequency and volume
    const windLfo = this.trackOsc(ctx.createOscillator());
    windLfo.type = 'sine';
    windLfo.frequency.setValueAtTime(0.02 + Math.random() * 0.03, now);

    const windFreqDepth = this.trackNode(ctx.createGain());
    windFreqDepth.gain.setValueAtTime(500, now);
    windLfo.connect(windFreqDepth).connect(windBp.frequency);

    const windVolDepth = this.trackNode(ctx.createGain());
    windVolDepth.gain.setValueAtTime(0.06, now);
    windLfo.connect(windVolDepth).connect(windGain.gain);
    windLfo.start(now);

    windNoise.connect(windBp).connect(windGain).connect(out);
    windNoise.start(now);

    // Drift wind LFO rate
    this.addInterval(() => {
      if (!this._active || !this.ctx) return;
      windLfo.frequency.setTargetAtTime(0.02 + Math.random() * 0.03, this.ctx.currentTime, 5);
    }, (25 + Math.random() * 20) * 1000);

    // Start multiple bird "species" with staggered timing
    for (let i = 0; i < this.birdCount; i++) {
      const initialDelay = (1 + Math.random() * 4) * 1000;
      this.addTimeout(() => this.scheduleBirdPhrase(i), initialDelay);
    }

    // Foliage rustles
    this.scheduleRustle();
  }

  /**
   * Schedule a bird phrase: 2–6 individual FM-modulated notes
   * in quick succession, then silence for 2–8 seconds.
   */
  private scheduleBirdPhrase(birdIndex: number): void {
    if (!this._active || !this.ctx || !this._gainNode) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Each "bird species" has a unique base pitch range and vibrato character
    const speciesOffset = birdIndex * 800;
    const basePitch = 2000 + speciesOffset + Math.random() * 2000;
    const noteCount = 2 + Math.floor(Math.random() * 5); // 2–6 notes
    const noteGap = 0.05 + Math.random() * 0.1; // 50–150ms between notes
    const pitchDirection = Math.random() > 0.5 ? 1 : -1;
    const pitchStep = 100 + Math.random() * 300;
    const vibratoRate = 15 + Math.random() * 25; // 15–40Hz FM vibrato
    const vibratoDepth = 50 + Math.random() * 150; // ±50–200Hz

    // Stereo position (each bird stays in a consistent-ish position)
    const pan = (birdIndex / this.birdCount) * 1.6 - 0.8 + (Math.random() * 0.3 - 0.15);

    let phraseEnd = now;

    for (let n = 0; n < noteCount; n++) {
      const noteStart = now + n * (noteGap + 0.03 + Math.random() * 0.07);
      const notePitch = basePitch + n * pitchDirection * pitchStep * (0.5 + Math.random() * 0.5);
      const noteDur = 0.03 + Math.random() * 0.07; // 30–100ms per note
      const noteEnd = noteStart + noteDur;

      // Carrier oscillator
      const osc = this.trackOsc(ctx.createOscillator());
      osc.type = 'sine';
      osc.frequency.setValueAtTime(notePitch, noteStart);

      // FM vibrato: fast LFO → osc.frequency
      const vibLfo = this.trackOsc(ctx.createOscillator());
      vibLfo.type = 'sine';
      vibLfo.frequency.setValueAtTime(vibratoRate, noteStart);
      const vibGain = this.trackNode(ctx.createGain());
      vibGain.gain.setValueAtTime(vibratoDepth, noteStart);
      vibLfo.connect(vibGain).connect(osc.frequency);

      // Amplitude envelope: quick attack → sustain → quick release
      const envGain = this.trackNode(ctx.createGain());
      const attackEnd = noteStart + Math.min(0.01, noteDur * 0.2);
      const releaseStart = noteEnd - Math.min(0.02, noteDur * 0.3);
      const vol = 0.04 + Math.random() * 0.04;

      envGain.gain.setValueAtTime(0, noteStart);
      envGain.gain.linearRampToValueAtTime(vol, attackEnd);
      envGain.gain.setValueAtTime(vol, releaseStart);
      envGain.gain.linearRampToValueAtTime(0, noteEnd);

      // Panner
      const panner = this.trackNode(ctx.createStereoPanner());
      panner.pan.value = Math.max(-1, Math.min(1, pan));

      osc.connect(envGain).connect(panner).connect(this._gainNode!);
      osc.start(noteStart);
      osc.stop(noteEnd + 0.01);
      vibLfo.start(noteStart);
      vibLfo.stop(noteEnd + 0.01);

      phraseEnd = noteEnd;
    }

    // Silence gap before next phrase: 2–8 seconds
    const silenceGap = (2 + Math.random() * 6) * 1000;
    const delayFromNow = (phraseEnd - now) * 1000 + silenceGap;

    this.addTimeout(() => this.scheduleBirdPhrase(birdIndex), delayFromNow);
  }

  private scheduleRustle(): void {
    if (!this._active) return;
    const delay = (8 + Math.random() * 17) * 1000;

    this.addTimeout(() => {
      if (!this._active || !this.ctx || !this._gainNode) return;
      const now = this.ctx.currentTime;
      const duration = 0.3 + Math.random() * 0.5;

      const source = createNoiseSource(this.ctx, 'brown');
      const bp = this.trackNode(this.ctx.createBiquadFilter());
      bp.type = 'bandpass';
      bp.frequency.value = 200 + Math.random() * 400;
      bp.Q.value = 0.5;

      const gain = this.trackNode(this.ctx.createGain());
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.04, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const panner = this.trackNode(this.ctx.createStereoPanner());
      panner.pan.value = Math.random() * 1.6 - 0.8;

      source.connect(bp).connect(gain).connect(panner).connect(this._gainNode!);
      source.start(now);
      source.stop(now + duration + 0.1);

      this.scheduleRustle();
    }, delay);
  }
}

// ─── Fire ───
// Architecture: brown noise base rumble + bandpass crackle bursts + sharp pops
// Overall lowpass at 4kHz removes harshness. Slow breathing LFO on base.

class FireSynth extends BaseSynth {
  start(ctx: AudioContext, destination: AudioNode): void {
    this.initOutput(ctx, destination);
    const now = ctx.currentTime;
    const out = this._gainNode!;

    // Master shaping: overall lowpass to remove harshness
    const masterLp = this.trackNode(ctx.createBiquadFilter());
    masterLp.type = 'lowpass';
    masterLp.frequency.setValueAtTime(4000, now);
    masterLp.Q.setValueAtTime(0.7, now);
    masterLp.connect(out);

    // 1. Base layer — brown noise → lowpass ~400Hz (low rumble/roar)
    const baseNoise = this.trackSource(createNoiseSource(ctx, 'brown'));
    const baseLp = this.trackNode(ctx.createBiquadFilter());
    baseLp.type = 'lowpass';
    baseLp.frequency.setValueAtTime(400, now);
    baseLp.Q.setValueAtTime(0.7, now);

    const baseGain = this.trackNode(ctx.createGain());
    baseGain.gain.setValueAtTime(0.25, now);

    // Breathing LFO on base layer (fire intensity rises and falls)
    const breathLfo = this.trackOsc(ctx.createOscillator());
    breathLfo.type = 'sine';
    breathLfo.frequency.setValueAtTime(0.08, now);
    const breathDepth = this.trackNode(ctx.createGain());
    breathDepth.gain.setValueAtTime(0.08, now);
    breathLfo.connect(breathDepth).connect(baseGain.gain);
    breathLfo.start(now);

    baseNoise.connect(baseLp).connect(baseGain).connect(masterLp);
    baseNoise.start(now);

    // Drift breathing rate over time
    this.addInterval(() => {
      if (!this._active || !this.ctx) return;
      breathLfo.frequency.setTargetAtTime(0.05 + Math.random() * 0.15, this.ctx.currentTime, 3);
    }, (10 + Math.random() * 15) * 1000);

    // 2. Crackle layer — random short noise bursts through bandpass
    this.scheduleCrackle(masterLp);

    // 3. Pop layer — sharp snaps (less frequent)
    this.schedulePop(masterLp);
  }

  private scheduleCrackle(masterDest: AudioNode): void {
    if (!this._active) return;
    const delay = 50 + Math.random() * 250; // 50–300ms — frequent

    this.addTimeout(() => {
      if (!this._active || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Short noise burst (5–30ms worth of samples)
      const durationMs = 5 + Math.random() * 25;
      const bufferSize = Math.floor(this.ctx.sampleRate * durationMs / 1000);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Exponential decay envelope for click character
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      // Bandpass 800–3000Hz
      const bp = this.trackNode(this.ctx.createBiquadFilter());
      bp.type = 'bandpass';
      bp.frequency.value = 800 + Math.random() * 2200;
      bp.Q.value = 0.8 + Math.random() * 1.5;

      // Randomised amplitude per burst
      const gain = this.trackNode(this.ctx.createGain());
      gain.gain.setValueAtTime(0.1 + Math.random() * 0.4, now);

      const panner = this.trackNode(this.ctx.createStereoPanner());
      panner.pan.value = Math.random() * 0.8 - 0.4;

      source.connect(bp).connect(gain).connect(panner).connect(masterDest);
      source.start(now);

      this.scheduleCrackle(masterDest);
    }, delay);
  }

  private schedulePop(masterDest: AudioNode): void {
    if (!this._active) return;
    const delay = (1.5 + Math.random() * 6) * 1000;

    this.addTimeout(() => {
      if (!this._active || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Very short snap (2–5ms)
      const bufferSize = Math.floor(this.ctx.sampleRate * (2 + Math.random() * 3) / 1000);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      // Highpass to keep only the sharp snap character
      const hp = this.trackNode(this.ctx.createBiquadFilter());
      hp.type = 'highpass';
      hp.frequency.value = 2000 + Math.random() * 2000;

      const gain = this.trackNode(this.ctx.createGain());
      gain.gain.setValueAtTime(0.15 + Math.random() * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      const panner = this.trackNode(this.ctx.createStereoPanner());
      panner.pan.value = Math.random() * 0.6 - 0.3;

      source.connect(hp).connect(gain).connect(panner).connect(masterDest);
      source.start(now);

      this.schedulePop(masterDest);
    }, delay);
  }
}

// ─── White Noise (with spectral drift) ───

class WhiteNoiseSynth extends BaseSynth {
  start(ctx: AudioContext, destination: AudioNode): void {
    this.initOutput(ctx, destination);
    const now = ctx.currentTime;
    const out = this._gainNode!;

    const noise = this.trackSource(createNoiseSource(ctx, 'white'));
    const baseGain = this.trackNode(ctx.createGain());
    baseGain.gain.setValueAtTime(0.5, now);

    // Peaking filter that wanders
    const peak = this.trackNode(ctx.createBiquadFilter());
    peak.type = 'peaking';
    peak.frequency.setValueAtTime(1000, now);
    peak.Q.setValueAtTime(0.3, now);
    peak.gain.setValueAtTime(3, now);

    const lfo = this.trackOsc(ctx.createOscillator());
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.01 + Math.random() * 0.02, now);
    const lfoGain = this.trackNode(ctx.createGain());
    lfoGain.gain.setValueAtTime(2000, now);
    lfo.connect(lfoGain).connect(peak.frequency);
    lfo.start(now);

    noise.connect(peak).connect(baseGain).connect(out);
    noise.start(now);

    // Drift LFO rate
    this.addInterval(() => {
      if (!this._active || !this.ctx) return;
      lfo.frequency.setTargetAtTime(0.01 + Math.random() * 0.02, this.ctx.currentTime, 10);
    }, (40 + Math.random() * 40) * 1000);
  }
}

// ─── Pink Noise (with spectral drift, lower centre) ───

class PinkNoiseSynth extends BaseSynth {
  start(ctx: AudioContext, destination: AudioNode): void {
    this.initOutput(ctx, destination);
    const now = ctx.currentTime;
    const out = this._gainNode!;

    const noise = this.trackSource(createNoiseSource(ctx, 'pink'));
    const baseGain = this.trackNode(ctx.createGain());
    baseGain.gain.setValueAtTime(0.55, now);

    // Peaking filter that wanders (lower range than white)
    const peak = this.trackNode(ctx.createBiquadFilter());
    peak.type = 'peaking';
    peak.frequency.setValueAtTime(600, now);
    peak.Q.setValueAtTime(0.3, now);
    peak.gain.setValueAtTime(3, now);

    const lfo = this.trackOsc(ctx.createOscillator());
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.01 + Math.random() * 0.02, now);
    const lfoGain = this.trackNode(ctx.createGain());
    lfoGain.gain.setValueAtTime(800, now);
    lfo.connect(lfoGain).connect(peak.frequency);
    lfo.start(now);

    noise.connect(peak).connect(baseGain).connect(out);
    noise.start(now);

    // Drift LFO rate
    this.addInterval(() => {
      if (!this._active || !this.ctx) return;
      lfo.frequency.setTargetAtTime(0.01 + Math.random() * 0.02, this.ctx.currentTime, 10);
    }, (40 + Math.random() * 40) * 1000);
  }
}

// ─── Brown Noise (with breathing + spectral brightening) ───

class BrownNoiseSynth extends BaseSynth {
  start(ctx: AudioContext, destination: AudioNode): void {
    this.initOutput(ctx, destination);
    const now = ctx.currentTime;
    const out = this._gainNode!;

    const noise = this.trackSource(createNoiseSource(ctx, 'brown'));
    const baseGain = this.trackNode(ctx.createGain());
    baseGain.gain.setValueAtTime(0.5, now);

    // Lowpass filter for occasional brightening
    const lp = this.trackNode(ctx.createBiquadFilter());
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(400, now);
    lp.Q.setValueAtTime(0.3, now);

    // Volume breathing LFO
    const breathLfo = this.trackOsc(ctx.createOscillator());
    breathLfo.type = 'sine';
    breathLfo.frequency.setValueAtTime(0.02 + Math.random() * 0.02, now);
    const breathGain = this.trackNode(ctx.createGain());
    breathGain.gain.setValueAtTime(0.05, now); // ±10% depth
    breathLfo.connect(breathGain).connect(baseGain.gain);
    breathLfo.start(now);

    noise.connect(lp).connect(baseGain).connect(out);
    noise.start(now);

    // Occasional spectral brightening
    this.scheduleBrightening(lp);
  }

  private scheduleBrightening(lp: BiquadFilterNode): void {
    if (!this._active) return;
    const delay = (30 + Math.random() * 60) * 1000;

    this.addTimeout(() => {
      if (!this._active || !this.ctx) return;
      const now = this.ctx.currentTime;
      const rampUp = 1.5 + Math.random() * 1.5;
      const holdTime = 1;
      const rampDown = 1.5 + Math.random() * 1.5;

      lp.frequency.setValueAtTime(400, now);
      lp.frequency.linearRampToValueAtTime(600 + Math.random() * 200, now + rampUp);
      lp.frequency.setValueAtTime(600 + Math.random() * 200, now + rampUp + holdTime);
      lp.frequency.linearRampToValueAtTime(400, now + rampUp + holdTime + rampDown);

      this.scheduleBrightening(lp);
    }, delay);
  }
}
