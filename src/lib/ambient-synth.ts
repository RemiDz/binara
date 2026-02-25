/**
 * Ambient sound layer system.
 * Nature sounds use sample-based playback (OGG files in /public/audio/ambient/).
 * Tonal/noise layers (bowls, white, pink, brown) remain synthesised.
 */

// ─── Interface ───

export interface AmbientSynth {
  start(ctx: AudioContext, destination: AudioNode): void;
  stop(): void;
  setVolume(volume: number): void;
  readonly gainNode: GainNode | null;
  readonly isActive: boolean;
}

// ─── Sample file registry ───

const SAMPLE_FILES: Record<string, string> = {
  rain: 'thunder-rain.ogg',
  ocean: 'ocean-waves.ogg',
  forest: 'forest-birds.ogg',
  fireplace: 'fire-crackling.ogg',
  'forest-singing': 'forest-singing.ogg',
  'morning-birds': 'morning-birds.ogg',
  'wild-birds': 'wild-birds.ogg',
  wind: 'wind-birds.ogg',
  stream: 'stream-flowing.ogg',
  night: 'night-crickets.ogg',
};

// ─── Decoded buffer cache (shared across all SampleSynth instances) ───

const bufferCache = new Map<string, AudioBuffer>();

async function loadAmbientBuffer(ctx: AudioContext, file: string): Promise<AudioBuffer> {
  if (bufferCache.has(file)) return bufferCache.get(file)!;
  const response = await fetch(`/audio/ambient/${file}`);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  bufferCache.set(file, audioBuffer);
  return audioBuffer;
}

// ─── Factory ───

export function createAmbientSynth(type: string): AmbientSynth {
  // Sample-based nature sounds
  const file = SAMPLE_FILES[type];
  if (file) return new SampleSynth(file);

  // Synthesised layers
  switch (type) {
    case 'bowls': return new BowlsSynth();
    case 'white': return new WhiteNoiseSynth();
    case 'pink': return new PinkNoiseSynth();
    case 'brown': return new BrownNoiseSynth();
    default: return new WhiteNoiseSynth();
  }
}

// ─── Sample-based ambient player ───

class SampleSynth implements AmbientSynth {
  private file: string;
  private ctx: AudioContext | null = null;
  private _gainNode: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private _active = false;
  private _targetVolume = 0.5;

  constructor(file: string) {
    this.file = file;
  }

  get gainNode(): GainNode | null { return this._gainNode; }
  get isActive(): boolean { return this._active; }

  start(ctx: AudioContext, destination: AudioNode): void {
    this.ctx = ctx;
    this._active = true;

    // Create gain node immediately so fadeOutAllAmbient works even during load
    this._gainNode = ctx.createGain();
    this._gainNode.gain.setValueAtTime(0, ctx.currentTime);
    this._gainNode.connect(destination);

    // Async load + play (fire-and-forget)
    this.loadAndPlay(ctx);
  }

  private async loadAndPlay(ctx: AudioContext): Promise<void> {
    try {
      const buffer = await loadAmbientBuffer(ctx, this.file);
      if (!this._active || !this._gainNode) return; // stopped during load

      this.source = ctx.createBufferSource();
      this.source.buffer = buffer;
      this.source.loop = true;
      this.source.connect(this._gainNode);
      this.source.start();

      // Fade in over 1 second
      const now = ctx.currentTime;
      this._gainNode.gain.setValueAtTime(0, now);
      this._gainNode.gain.linearRampToValueAtTime(this._targetVolume, now + 1.0);
    } catch (err) {
      console.error(`Failed to load ambient: ${this.file}`, err);
    }
  }

  setVolume(volume: number): void {
    const v = Math.min(Math.max(volume, 0), 1);
    this._targetVolume = v;
    if (!this._gainNode || !this.ctx) return;
    this._gainNode.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  stop(): void {
    this._active = false;
    if (this._gainNode && this.ctx) {
      const now = this.ctx.currentTime;
      this._gainNode.gain.setValueAtTime(this._gainNode.gain.value, now);
      this._gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
      if (this.source) {
        try { this.source.stop(now + 0.5); } catch { /* already stopped */ }
      }
    } else {
      if (this.source) {
        try { this.source.stop(); } catch { /* already stopped */ }
        this.source.disconnect();
      }
    }
    // Clean up references after fade
    setTimeout(() => {
      this.source?.disconnect();
      this._gainNode?.disconnect();
      this.source = null;
      this._gainNode = null;
      this.ctx = null;
    }, 600);
  }
}

// ─── Noise Buffer Utilities (for synth layers) ───

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

// ─── Base class for synth layers ───

abstract class BaseSynth implements AmbientSynth {
  protected ctx: AudioContext | null = null;
  protected _gainNode: GainNode | null = null;
  protected _active = false;
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
    for (const i of this.intervals) clearInterval(i);
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

// ─── Singing Bowls ───

class BowlsSynth extends BaseSynth {
  private static readonly BUFFER_DURATION = 4;
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
          const freq = BowlsSynth.FREQUENCIES[f] + (ch === 0 ? -0.5 : 0.5) * (f + 1);
          const amp = BowlsSynth.AMPLITUDES[f];
          const env = 0.6 + 0.4 * Math.sin(t * Math.PI * 2 / (BowlsSynth.BUFFER_DURATION * (f + 1)));
          sample += Math.sin(t * freq * Math.PI * 2) * amp * env;
        }
        data[i] = sample;
      }
    }

    return buffer;
  }
}

// ─── White Noise ───

class WhiteNoiseSynth extends BaseSynth {
  start(ctx: AudioContext, destination: AudioNode): void {
    this.initOutput(ctx, destination);
    const now = ctx.currentTime;
    const out = this._gainNode!;

    const noise = this.trackSource(createNoiseSource(ctx, 'white'));
    const baseGain = this.trackNode(ctx.createGain());
    baseGain.gain.setValueAtTime(0.5, now);

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

    this.addInterval(() => {
      if (!this._active || !this.ctx) return;
      lfo.frequency.setTargetAtTime(0.01 + Math.random() * 0.02, this.ctx.currentTime, 10);
    }, (40 + Math.random() * 40) * 1000);
  }
}

// ─── Pink Noise ───

class PinkNoiseSynth extends BaseSynth {
  start(ctx: AudioContext, destination: AudioNode): void {
    this.initOutput(ctx, destination);
    const now = ctx.currentTime;
    const out = this._gainNode!;

    const noise = this.trackSource(createNoiseSource(ctx, 'pink'));
    const baseGain = this.trackNode(ctx.createGain());
    baseGain.gain.setValueAtTime(0.55, now);

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

    this.addInterval(() => {
      if (!this._active || !this.ctx) return;
      lfo.frequency.setTargetAtTime(0.01 + Math.random() * 0.02, this.ctx.currentTime, 10);
    }, (40 + Math.random() * 40) * 1000);
  }
}

// ─── Brown Noise ───

class BrownNoiseSynth extends BaseSynth {
  start(ctx: AudioContext, destination: AudioNode): void {
    this.initOutput(ctx, destination);
    const now = ctx.currentTime;
    const out = this._gainNode!;

    const noise = this.trackSource(createNoiseSource(ctx, 'brown'));
    const baseGain = this.trackNode(ctx.createGain());
    baseGain.gain.setValueAtTime(0.5, now);

    const lp = this.trackNode(ctx.createBiquadFilter());
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(400, now);
    lp.Q.setValueAtTime(0.3, now);

    const breathLfo = this.trackOsc(ctx.createOscillator());
    breathLfo.type = 'sine';
    breathLfo.frequency.setValueAtTime(0.02 + Math.random() * 0.02, now);
    const breathGain = this.trackNode(ctx.createGain());
    breathGain.gain.setValueAtTime(0.05, now);
    breathLfo.connect(breathGain).connect(baseGain.gain);
    breathLfo.start(now);

    noise.connect(lp).connect(baseGain).connect(out);
    noise.start(now);

    this.scheduleBrightening(lp);
  }

  private scheduleBrightening(lp: BiquadFilterNode): void {
    if (!this._active) return;
    const delay = (30 + Math.random() * 60) * 1000;

    const id = setTimeout(() => {
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
    // Track timeout for cleanup via interval array (reuse for simplicity)
    this.intervals.push(id as unknown as ReturnType<typeof setInterval>);
  }
}
