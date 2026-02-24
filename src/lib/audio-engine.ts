import type { AudioEngineConfig, AmbientLayerConfig, BeatLayer, FilterConfig, LFOConfig, IsochronicConfig } from '@/types';
import { VOLUME_HARD_CAP } from './constants';
import { generateAmbientBuffer } from './ambient-synth';

interface AmbientLayerState {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

interface BeatLayerAudioState {
  oscL: OscillatorNode;
  oscR: OscillatorNode;
  gainL: GainNode;
  gainR: GainNode;
  panL: StereoPannerNode;
  panR: StereoPannerNode;
  layerGain: GainNode;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private carrierLeft: OscillatorNode | null = null;
  private carrierRight: OscillatorNode | null = null;
  private gainLeft: GainNode | null = null;
  private gainRight: GainNode | null = null;
  private panLeft: StereoPannerNode | null = null;
  private panRight: StereoPannerNode | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // Multi-ambient support
  private ambientLayers: Map<string, AmbientLayerState> = new Map();
  private ambientBufferCache: Map<string, AudioBuffer> = new Map();

  // Legacy single-ambient (Phase 1 compat)
  private _legacyAmbientId: string | null = null;

  private _isPlaying = false;
  private _isPaused = false;
  private startTime = 0;
  private pauseOffset = 0;
  private stopTimeout: ReturnType<typeof setTimeout> | null = null;

  // ─── Advanced mode state ───
  private _advancedMode = false;
  private beatLayers: Map<string, BeatLayerAudioState> = new Map();
  private beatSumGain: GainNode | null = null;

  // Filter subsystem
  private filterNode: BiquadFilterNode | null = null;
  private _filterEnabled = false;

  // LFO subsystem
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  // Isochronic subsystem
  private isoOsc: OscillatorNode | null = null;
  private isoGain: GainNode | null = null;
  private isoPulseTimer: ReturnType<typeof setInterval> | null = null;
  private nextPulseTime = 0;

  // Stereo subsystem
  private masterPan: StereoPannerNode | null = null;
  private rotationLfo: OscillatorNode | null = null;
  private rotationLfoGain: GainNode | null = null;
  private _stereoWidth = 100;

  async init(): Promise<void> {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-6, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  get isInitialized(): boolean {
    return this.ctx !== null;
  }

  async play(config: AudioEngineConfig): Promise<void> {
    if (!this.ctx || !this.compressor) {
      await this.init();
    }
    if (this._isPlaying) {
      this.stopImmediate();
    }

    const ctx = this.ctx!;
    const now = ctx.currentTime;

    this.carrierLeft = ctx.createOscillator();
    this.carrierLeft.type = config.waveform;
    this.carrierLeft.frequency.setValueAtTime(config.carrierFreqLeft, now);

    this.gainLeft = ctx.createGain();
    this.gainLeft.gain.setValueAtTime(0, now);

    this.panLeft = ctx.createStereoPanner();
    this.panLeft.pan.setValueAtTime(-1, now);

    this.carrierLeft.connect(this.gainLeft);
    this.gainLeft.connect(this.panLeft);
    this.panLeft.connect(this.compressor!);

    this.carrierRight = ctx.createOscillator();
    this.carrierRight.type = config.waveform;
    this.carrierRight.frequency.setValueAtTime(config.carrierFreqRight, now);

    this.gainRight = ctx.createGain();
    this.gainRight.gain.setValueAtTime(0, now);

    this.panRight = ctx.createStereoPanner();
    this.panRight.pan.setValueAtTime(1, now);

    this.carrierRight.connect(this.gainRight);
    this.gainRight.connect(this.panRight);
    this.panRight.connect(this.compressor!);

    const targetGain = 0.5;
    const fadeIn = config.fadeInDuration;
    this.gainLeft.gain.linearRampToValueAtTime(targetGain, now + fadeIn);
    this.gainRight.gain.linearRampToValueAtTime(targetGain, now + fadeIn);

    this.carrierLeft.start(now);
    this.carrierRight.start(now);

    this._isPlaying = true;
    this._isPaused = false;
    this.startTime = now;
    this.pauseOffset = 0;
  }

  stop(): void {
    if (!this._isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const fadeOut = 1.5;
    const tau = fadeOut / 5;

    this.fadeOutCarriers(now, tau);
    this.fadeOutAllAmbient(now, tau);

    this.stopTimeout = setTimeout(() => {
      this.stopImmediate();
    }, fadeOut * 1000 + 100);
  }

  stopWithLongFade(): void {
    if (!this._isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const fadeOut = 3;
    const tau = fadeOut / 5;

    this.fadeOutCarriers(now, tau);
    this.fadeOutAllAmbient(now, tau);

    this.stopTimeout = setTimeout(() => {
      this.stopImmediate();
    }, fadeOut * 1000 + 100);
  }

  private fadeOutCarriers(now: number, tau: number): void {
    if (this.gainLeft) {
      this.gainLeft.gain.cancelScheduledValues(now);
      this.gainLeft.gain.setValueAtTime(this.gainLeft.gain.value, now);
      this.gainLeft.gain.setTargetAtTime(0, now, tau);
    }
    if (this.gainRight) {
      this.gainRight.gain.cancelScheduledValues(now);
      this.gainRight.gain.setValueAtTime(this.gainRight.gain.value, now);
      this.gainRight.gain.setTargetAtTime(0, now, tau);
    }
  }

  private fadeOutAllAmbient(now: number, tau: number): void {
    for (const [, layer] of this.ambientLayers) {
      layer.gain.gain.cancelScheduledValues(now);
      layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
      layer.gain.gain.setTargetAtTime(0, now, tau);
    }
  }

  private stopImmediate(): void {
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }
    try { this.carrierLeft?.stop(); } catch { /* already stopped */ }
    try { this.carrierRight?.stop(); } catch { /* already stopped */ }
    this.carrierLeft?.disconnect();
    this.carrierRight?.disconnect();
    this.gainLeft?.disconnect();
    this.gainRight?.disconnect();
    this.panLeft?.disconnect();
    this.panRight?.disconnect();

    this.carrierLeft = null;
    this.carrierRight = null;
    this.gainLeft = null;
    this.gainRight = null;
    this.panLeft = null;
    this.panRight = null;

    this.stopAllAmbientLayersImmediate();

    this._isPlaying = false;
    this._isPaused = false;
    this._legacyAmbientId = null;
    this.pauseOffset = 0;
  }

  async pause(): Promise<void> {
    if (!this.ctx || !this._isPlaying || this._isPaused) return;
    this.pauseOffset = this.ctx.currentTime - this.startTime + this.pauseOffset;
    await this.ctx.suspend();
    this._isPaused = true;
  }

  async resume(): Promise<void> {
    if (!this.ctx || !this._isPaused) return;
    await this.ctx.resume();
    this.startTime = this.ctx.currentTime;
    this._isPaused = false;
  }

  setCarrierFrequency(left: number, right: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.carrierLeft?.frequency.linearRampToValueAtTime(left, now + 0.05);
    this.carrierRight?.frequency.linearRampToValueAtTime(right, now + 0.05);
  }

  rampCarrierFrequency(targetLeft: number, targetRight: number, durationSeconds: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.carrierLeft?.frequency.linearRampToValueAtTime(targetLeft, now + durationSeconds);
    this.carrierRight?.frequency.linearRampToValueAtTime(targetRight, now + durationSeconds);
  }

  setMasterVolume(volume: number): void {
    if (!this.ctx || !this.masterGain) return;
    const safeVolume = Math.min(Math.max(volume, 0), VOLUME_HARD_CAP);
    this.masterGain.gain.setTargetAtTime(safeVolume, this.ctx.currentTime, 0.02);
  }

  setWaveform(waveform: OscillatorType): void {
    if (this.carrierLeft) this.carrierLeft.type = waveform;
    if (this.carrierRight) this.carrierRight.type = waveform;
  }

  // ─── Multi-ambient layer support ───

  startAmbientLayerById(id: string, volume: number): void {
    if (!this.ctx || !this.compressor) return;

    // Stop this layer if already playing
    this.stopAmbientLayerById(id);

    let buffer = this.ambientBufferCache.get(id);
    if (!buffer) {
      buffer = generateAmbientBuffer(this.ctx, id);
      this.ambientBufferCache.set(id, buffer);
    }

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(Math.min(volume, 1), now + 1);
    gain.connect(this.compressor);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    source.start(now);

    this.ambientLayers.set(id, { source, gain });
  }

  stopAmbientLayerById(id: string): void {
    const layer = this.ambientLayers.get(id);
    if (!layer || !this.ctx) return;

    const now = this.ctx.currentTime;
    layer.gain.gain.cancelScheduledValues(now);
    layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
    layer.gain.gain.setTargetAtTime(0, now, 0.2);

    const src = layer.source;
    const g = layer.gain;
    setTimeout(() => {
      try { src.stop(); } catch { /* already stopped */ }
      src.disconnect();
      g.disconnect();
    }, 1200);

    this.ambientLayers.delete(id);
  }

  setAmbientLayerVolume(id: string, volume: number): void {
    const layer = this.ambientLayers.get(id);
    if (!layer || !this.ctx) return;
    const safeVol = Math.min(Math.max(volume, 0), 1);
    layer.gain.gain.setTargetAtTime(safeVol, this.ctx.currentTime, 0.02);
  }

  stopAllAmbientLayers(): void {
    for (const id of [...this.ambientLayers.keys()]) {
      this.stopAmbientLayerById(id);
    }
  }

  private stopAllAmbientLayersImmediate(): void {
    for (const [, layer] of this.ambientLayers) {
      try { layer.source.stop(); } catch { /* already stopped */ }
      layer.source.disconnect();
      layer.gain.disconnect();
    }
    this.ambientLayers.clear();
  }

  getActiveAmbientLayers(): string[] {
    return [...this.ambientLayers.keys()];
  }

  // ─── Legacy single-ambient (Phase 1 Easy mode compat) ───

  async startAmbientLayer(config: AmbientLayerConfig): Promise<void> {
    // Stop previous legacy ambient
    if (this._legacyAmbientId) {
      this.stopAmbientLayerById(this._legacyAmbientId);
    }
    this.startAmbientLayerById(config.id, config.volume);
    this._legacyAmbientId = config.id;
  }

  stopAmbientLayer(): void {
    if (this._legacyAmbientId) {
      this.stopAmbientLayerById(this._legacyAmbientId);
      this._legacyAmbientId = null;
    }
  }

  setAmbientVolume(volume: number): void {
    if (this._legacyAmbientId) {
      this.setAmbientLayerVolume(this._legacyAmbientId, volume);
    }
  }

  get currentAmbientId(): string | null {
    return this._legacyAmbientId;
  }

  // ─── Preview tone (for carrier selection UI) ───

  async previewTone(frequency: number, duration = 500): Promise<void> {
    if (!this.ctx) await this.init();
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const durationSec = duration / 1000;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
    gain.gain.setValueAtTime(0.06, now + durationSec - 0.1);
    gain.gain.linearRampToValueAtTime(0, now + durationSec);

    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.01);
  }

  // ─── Getters ───

  get playing(): boolean {
    return this._isPlaying;
  }

  get paused(): boolean {
    return this._isPaused;
  }

  getElapsedTime(): number {
    if (!this.ctx || !this._isPlaying) return this.pauseOffset;
    if (this._isPaused) return this.pauseOffset;
    return this.ctx.currentTime - this.startTime + this.pauseOffset;
  }

  async playCompletionChime(): Promise<void> {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[i], now);

      const gain = ctx.createGain();
      const startAt = now + i * 0.3;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.08, startAt + 0.05);
      gain.gain.setTargetAtTime(0, startAt + 0.15, 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.5);
    }
  }

  // ─── Advanced mode: Multi-beat-layer system ───

  get advancedMode(): boolean {
    return this._advancedMode;
  }

  async playAdvanced(layers: BeatLayer[]): Promise<void> {
    if (!this.ctx || !this.compressor) {
      await this.init();
    }
    if (this._isPlaying) {
      this.stopImmediate();
    }

    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Create sum gain for all beat layers
    this.beatSumGain = ctx.createGain();
    this.beatSumGain.gain.setValueAtTime(1, now);
    this.beatSumGain.connect(this.compressor!);

    // Create each beat layer
    for (const layer of layers) {
      this.createBeatLayerNodes(layer);
    }

    this._advancedMode = true;
    this._isPlaying = true;
    this._isPaused = false;
    this.startTime = now;
    this.pauseOffset = 0;
  }

  private createBeatLayerNodes(layer: BeatLayer): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const vol = layer.volume / 100;
    const width = this._stereoWidth / 100;

    const oscL = ctx.createOscillator();
    oscL.type = layer.waveform;
    oscL.frequency.setValueAtTime(layer.carrierFreq, now);

    const gainL = ctx.createGain();
    gainL.gain.setValueAtTime(0, now);
    gainL.gain.linearRampToValueAtTime(0.5, now + 2);

    const panL = ctx.createStereoPanner();
    panL.pan.setValueAtTime(-width, now);

    const oscR = ctx.createOscillator();
    oscR.type = layer.waveform;
    oscR.frequency.setValueAtTime(layer.carrierFreq + layer.beatFreq, now);

    const gainR = ctx.createGain();
    gainR.gain.setValueAtTime(0, now);
    gainR.gain.linearRampToValueAtTime(0.5, now + 2);

    const panR = ctx.createStereoPanner();
    panR.pan.setValueAtTime(width, now);

    const layerGain = ctx.createGain();
    layerGain.gain.setValueAtTime(vol, now);

    // Wire: osc → gain → pan → layerGain → beatSumGain
    oscL.connect(gainL);
    gainL.connect(panL);
    panL.connect(layerGain);

    oscR.connect(gainR);
    gainR.connect(panR);
    panR.connect(layerGain);

    layerGain.connect(this.beatSumGain!);

    oscL.start(now);
    oscR.start(now);

    this.beatLayers.set(layer.id, { oscL, oscR, gainL, gainR, panL, panR, layerGain });
  }

  stopAdvanced(): void {
    if (!this._advancedMode || !this.ctx) return;
    const now = this.ctx.currentTime;
    const tau = 0.3;

    // Fade out all beat layers
    for (const [, state] of this.beatLayers) {
      state.gainL.gain.cancelScheduledValues(now);
      state.gainL.gain.setValueAtTime(state.gainL.gain.value, now);
      state.gainL.gain.setTargetAtTime(0, now, tau);
      state.gainR.gain.cancelScheduledValues(now);
      state.gainR.gain.setValueAtTime(state.gainR.gain.value, now);
      state.gainR.gain.setTargetAtTime(0, now, tau);
    }

    this.fadeOutAllAmbient(now, tau);

    this.stopTimeout = setTimeout(() => {
      this.stopAdvancedImmediate();
    }, 1800);
  }

  private stopAdvancedImmediate(): void {
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }

    // Disable all subsystems
    this.disableFilter();
    this.disableLFO();
    this.disableIsochronic();
    this.disableSpatialRotation();

    // Clean up master pan
    if (this.masterPan) {
      this.masterPan.disconnect();
      this.masterPan = null;
    }

    // Clean up beat layers
    for (const [, state] of this.beatLayers) {
      try { state.oscL.stop(); } catch { /* already stopped */ }
      try { state.oscR.stop(); } catch { /* already stopped */ }
      state.oscL.disconnect();
      state.oscR.disconnect();
      state.gainL.disconnect();
      state.gainR.disconnect();
      state.panL.disconnect();
      state.panR.disconnect();
      state.layerGain.disconnect();
    }
    this.beatLayers.clear();

    if (this.beatSumGain) {
      this.beatSumGain.disconnect();
      this.beatSumGain = null;
    }

    this.stopAllAmbientLayersImmediate();

    this._advancedMode = false;
    this._isPlaying = false;
    this._isPaused = false;
    this.pauseOffset = 0;
    this._stereoWidth = 100;
  }

  setBeatLayerFrequency(id: string, carrier: number, beat: number): void {
    const state = this.beatLayers.get(id);
    if (!state || !this.ctx) return;
    const now = this.ctx.currentTime;
    state.oscL.frequency.linearRampToValueAtTime(carrier, now + 0.05);
    state.oscR.frequency.linearRampToValueAtTime(carrier + beat, now + 0.05);
  }

  setBeatLayerVolume(id: string, volume: number): void {
    const state = this.beatLayers.get(id);
    if (!state || !this.ctx) return;
    state.layerGain.gain.setTargetAtTime(volume / 100, this.ctx.currentTime, 0.02);
  }

  setBeatLayerWaveform(id: string, waveform: OscillatorType): void {
    const state = this.beatLayers.get(id);
    if (!state) return;
    state.oscL.type = waveform;
    state.oscR.type = waveform;
  }

  addBeatLayer(layer: BeatLayer): void {
    if (!this._advancedMode || !this.ctx || !this.beatSumGain) return;
    // Remove if already exists
    this.removeBeatLayer(layer.id);
    this.createBeatLayerNodes(layer);
  }

  removeBeatLayer(id: string): void {
    const state = this.beatLayers.get(id);
    if (!state || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Fade out then cleanup
    state.gainL.gain.setTargetAtTime(0, now, 0.1);
    state.gainR.gain.setTargetAtTime(0, now, 0.1);

    setTimeout(() => {
      try { state.oscL.stop(); } catch { /* already stopped */ }
      try { state.oscR.stop(); } catch { /* already stopped */ }
      state.oscL.disconnect();
      state.oscR.disconnect();
      state.gainL.disconnect();
      state.gainR.disconnect();
      state.panL.disconnect();
      state.panR.disconnect();
      state.layerGain.disconnect();
    }, 600);

    this.beatLayers.delete(id);
  }

  // ─── Filter subsystem ───

  enableFilter(config: FilterConfig): void {
    if (!this.ctx || !this.beatSumGain || !this.compressor) return;

    this.disableFilter();

    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.filterNode = ctx.createBiquadFilter();
    this.filterNode.type = config.type;
    this.filterNode.frequency.setValueAtTime(config.frequency, now);
    // Map resonance 0–100 to Q 0.1–20
    const q = 0.1 + (config.resonance / 100) * 19.9;
    this.filterNode.Q.setValueAtTime(q, now);

    // Reconnect: beatSumGain → filter → compressor
    this.beatSumGain.disconnect();
    this.beatSumGain.connect(this.filterNode);
    this.filterNode.connect(this.compressor);
    this._filterEnabled = true;
  }

  updateFilter(config: FilterConfig): void {
    if (!this.filterNode || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.filterNode.type = config.type;
    this.filterNode.frequency.setTargetAtTime(config.frequency, now, 0.02);
    const q = 0.1 + (config.resonance / 100) * 19.9;
    this.filterNode.Q.setTargetAtTime(q, now, 0.02);
  }

  disableFilter(): void {
    if (!this.filterNode || !this.beatSumGain || !this.compressor) return;

    // Reconnect beatSumGain directly to compressor
    this.beatSumGain.disconnect();
    this.filterNode.disconnect();
    this.beatSumGain.connect(this.compressor);

    this.filterNode = null;
    this._filterEnabled = false;
  }

  // ─── LFO subsystem ───

  enableLFO(config: LFOConfig): void {
    if (!this.ctx) return;
    this.disableLFO();

    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.lfoOsc = ctx.createOscillator();
    this.lfoOsc.type = config.shape;
    this.lfoOsc.frequency.setValueAtTime(config.rate, now);

    this.lfoGain = ctx.createGain();
    const depth = config.depth / 100;

    // Connect LFO to target
    let target: AudioParam | null = null;
    let gainAmount = 0;

    switch (config.target) {
      case 'volume':
        if (this.masterGain) {
          target = this.masterGain.gain;
          gainAmount = depth * 0.15; // ±50% of typical master volume (~0.3)
        }
        break;
      case 'pitch':
        // Modulate all beat layer oscillators — use first layer's oscL as representative
        if (this.beatLayers.size > 0) {
          const firstLayer = this.beatLayers.values().next().value!;
          target = firstLayer.oscL.frequency;
          gainAmount = depth * firstLayer.oscL.frequency.value * 0.05; // ±5% of carrier
        }
        break;
      case 'filter':
        if (this.filterNode) {
          target = this.filterNode.frequency;
          gainAmount = depth * this.filterNode.frequency.value * 0.5;
        }
        break;
      case 'pan':
        if (this.masterPan) {
          target = this.masterPan.pan;
          gainAmount = depth;
        }
        break;
    }

    if (!target) {
      // No valid target, don't create LFO
      this.lfoOsc = null;
      this.lfoGain = null;
      return;
    }

    this.lfoGain.gain.setValueAtTime(gainAmount, now);
    this.lfoOsc.connect(this.lfoGain);
    this.lfoGain.connect(target);
    this.lfoOsc.start(now);
  }

  updateLFO(config: LFOConfig): void {
    if (!this.lfoOsc || !this.lfoGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.lfoOsc.frequency.setTargetAtTime(config.rate, now, 0.02);
    this.lfoOsc.type = config.shape;

    // Re-calculate gain depth
    const depth = config.depth / 100;
    let gainAmount = 0;
    switch (config.target) {
      case 'volume':
        gainAmount = depth * 0.15;
        break;
      case 'pitch': {
        const firstLayer = this.beatLayers.values().next().value;
        gainAmount = firstLayer ? depth * firstLayer.oscL.frequency.value * 0.05 : 0;
        break;
      }
      case 'filter':
        gainAmount = this.filterNode ? depth * this.filterNode.frequency.value * 0.5 : 0;
        break;
      case 'pan':
        gainAmount = depth;
        break;
    }
    this.lfoGain.gain.setTargetAtTime(gainAmount, now, 0.02);
  }

  disableLFO(): void {
    if (this.lfoOsc) {
      try { this.lfoOsc.stop(); } catch { /* already stopped */ }
      this.lfoOsc.disconnect();
      this.lfoOsc = null;
    }
    if (this.lfoGain) {
      this.lfoGain.disconnect();
      this.lfoGain = null;
    }
  }

  // ─── Isochronic tone subsystem ───

  enableIsochronic(config: IsochronicConfig): void {
    if (!this.ctx || !this.compressor) return;
    this.disableIsochronic();

    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.isoOsc = ctx.createOscillator();
    this.isoOsc.type = 'sine';
    this.isoOsc.frequency.setValueAtTime(config.toneFreq, now);

    this.isoGain = ctx.createGain();
    this.isoGain.gain.setValueAtTime(0, now);
    // Isochronic bypasses filter, goes directly to compressor
    this.isoOsc.connect(this.isoGain);
    this.isoGain.connect(this.compressor);
    this.isoOsc.start(now);

    this.nextPulseTime = now;
    this.startIsoPulseScheduler(config);
  }

  private startIsoPulseScheduler(config: IsochronicConfig): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const pulsePeriod = 1 / config.pulseRate;
    const pulseOn = pulsePeriod * 0.5; // 50% duty cycle
    const vol = (config.volume / 100) * 0.4;

    // 25ms lookahead scheduler
    this.isoPulseTimer = setInterval(() => {
      if (!this.isoGain || !ctx) return;
      const now = ctx.currentTime;
      const lookahead = now + 0.05;

      while (this.nextPulseTime < lookahead) {
        const t = this.nextPulseTime;

        switch (config.shape) {
          case 'sharp':
            // Square pulse: on then off
            this.isoGain.gain.setValueAtTime(vol, t);
            this.isoGain.gain.setValueAtTime(0, t + pulseOn);
            break;
          case 'soft':
            // Sine ramp up then down
            this.isoGain.gain.setValueAtTime(0, t);
            this.isoGain.gain.linearRampToValueAtTime(vol, t + pulseOn * 0.5);
            this.isoGain.gain.linearRampToValueAtTime(0, t + pulseOn);
            break;
          case 'ramp':
            // Sawtooth: ramp up then drop
            this.isoGain.gain.setValueAtTime(0, t);
            this.isoGain.gain.linearRampToValueAtTime(vol, t + pulseOn * 0.9);
            this.isoGain.gain.setValueAtTime(0, t + pulseOn);
            break;
        }

        this.nextPulseTime += pulsePeriod;
      }
    }, 25);
  }

  updateIsochronic(config: IsochronicConfig): void {
    if (!this.isoOsc || !this.ctx) return;
    this.isoOsc.frequency.setTargetAtTime(config.toneFreq, this.ctx.currentTime, 0.02);

    // Restart pulse scheduler with new config
    if (this.isoPulseTimer) {
      clearInterval(this.isoPulseTimer);
    }
    this.startIsoPulseScheduler(config);
  }

  disableIsochronic(): void {
    if (this.isoPulseTimer) {
      clearInterval(this.isoPulseTimer);
      this.isoPulseTimer = null;
    }
    if (this.isoOsc) {
      try { this.isoOsc.stop(); } catch { /* already stopped */ }
      this.isoOsc.disconnect();
      this.isoOsc = null;
    }
    if (this.isoGain) {
      this.isoGain.disconnect();
      this.isoGain = null;
    }
  }

  // ─── Stereo subsystem ───

  setStereoWidth(width: number): void {
    if (!this.ctx) return;
    this._stereoWidth = width;
    const w = width / 100;
    const now = this.ctx.currentTime;

    for (const [, state] of this.beatLayers) {
      state.panL.pan.setTargetAtTime(-w, now, 0.02);
      state.panR.pan.setTargetAtTime(w, now, 0.02);
    }
  }

  setStereoOffset(pan: number): void {
    if (!this.ctx || !this.compressor || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (!this.masterPan) {
      this.masterPan = this.ctx.createStereoPanner();
      // Insert between compressor and masterGain
      this.compressor.disconnect();
      this.compressor.connect(this.masterPan);
      this.masterPan.connect(this.masterGain);
    }

    this.masterPan.pan.setTargetAtTime(pan / 100, now, 0.02);
  }

  setCrossfeed(amount: number): void {
    // Crossfeed: reduce stereo width toward center
    // amount 0 = no crossfeed (full stereo), 50 = maximum crossfeed (near mono)
    const effectiveWidth = this._stereoWidth * (1 - amount / 100);
    this.setStereoWidth(effectiveWidth);
  }

  enableSpatialRotation(speed: number): void {
    if (!this.ctx || !this.masterPan) return;
    this.disableSpatialRotation();

    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.rotationLfo = ctx.createOscillator();
    this.rotationLfo.type = 'sine';
    this.rotationLfo.frequency.setValueAtTime(speed, now);

    this.rotationLfoGain = ctx.createGain();
    this.rotationLfoGain.gain.setValueAtTime(0.8, now);

    this.rotationLfo.connect(this.rotationLfoGain);
    this.rotationLfoGain.connect(this.masterPan.pan);
    this.rotationLfo.start(now);
  }

  disableSpatialRotation(): void {
    if (this.rotationLfo) {
      try { this.rotationLfo.stop(); } catch { /* already stopped */ }
      this.rotationLfo.disconnect();
      this.rotationLfo = null;
    }
    if (this.rotationLfoGain) {
      this.rotationLfoGain.disconnect();
      this.rotationLfoGain = null;
    }
  }

  destroy(): void {
    if (this._advancedMode) {
      this.stopAdvancedImmediate();
    } else {
      this.stopImmediate();
    }
    this.ambientBufferCache.clear();
    if (this.compressor) {
      this.compressor.disconnect();
      this.compressor = null;
    }
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
