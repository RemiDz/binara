import type { AudioEngineConfig, AmbientLayerConfig, BeatLayer, FilterConfig, LFOConfig, IsochronicConfig, AdvancedSessionConfig } from '@/types';
import { VOLUME_HARD_CAP } from './constants';
import { createAmbientSynth, type AmbientSynth } from './ambient-synth';

// ─── Types ───

interface BeatLayerAudioState {
  oscL: OscillatorNode;
  oscR: OscillatorNode;
  gainL: GainNode;
  gainR: GainNode;
  panL: StereoPannerNode;
  panR: StereoPannerNode;
  layerGain: GainNode;
}

// ─── Audio Engine ───

export class AudioEngine {
  // Core audio graph (created once in init, never destroyed until destroy())
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // Dedicated ambient output — bypasses beat effects chain entirely
  private ambientMasterGain: GainNode | null = null;

  // Listen mode (simple binaural)
  private carrierLeft: OscillatorNode | null = null;
  private carrierRight: OscillatorNode | null = null;
  private gainLeft: GainNode | null = null;
  private gainRight: GainNode | null = null;
  private panLeft: StereoPannerNode | null = null;
  private panRight: StereoPannerNode | null = null;

  // Advanced mode (multi-layer binaural)
  private _advancedMode = false;
  private beatLayers: Map<string, BeatLayerAudioState> = new Map();
  private beatSumGain: GainNode | null = null;

  // Ambient layers
  private ambientLayers: Map<string, AmbientSynth> = new Map();
  private _legacyAmbientId: string | null = null;

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

  // Overtone layer (sensor stillness reward)
  private overtoneLeft: OscillatorNode | null = null;
  private overtoneRight: OscillatorNode | null = null;
  private overtoneGain: GainNode | null = null;

  // Preview mode flag
  private _isPreviewMode = false;

  // Playback state
  private _isPlaying = false;
  private _isPaused = false;
  private startTime = 0;
  private pauseOffset = 0;
  private wallStartTime = 0;
  private wallPauseOffset = 0;
  private stopTimeout: ReturnType<typeof setTimeout> | null = null;

  // Background audio support
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  private silentAudio: HTMLAudioElement | null = null;
  private _visibilityHandlerSetup = false;

  // Media session callbacks
  private _mediaSessionCallbacks: {
    onPause?: () => void;
    onResume?: () => void;
    onStop?: () => void;
  } = {};

  // ═══════════════════════════════════════════════
  // INITIALISATION
  // ═══════════════════════════════════════════════

  async init(): Promise<void> {
    if (this.ctx) return;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Build master output chain: compressor → masterGain → destination
    // Use direct .value assignment — no scheduling, no timing dependency
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -6;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.15;

    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Ambient output: separate gain → destination (bypasses effects chain)
    this.ambientMasterGain = this.ctx.createGain();
    this.ambientMasterGain.gain.value = 0.15;
    this.ambientMasterGain.connect(this.ctx.destination);

    this.setupVisibilityHandler();
  }

  get isInitialized(): boolean {
    return this.ctx !== null;
  }

  /** Ensure AudioContext exists and is running. */
  private async ensureRunning(): Promise<void> {
    if (!this.ctx || !this.compressor) {
      await this.init();
    }
    if (this.ctx!.state !== 'running') {
      await this.ctx!.resume();
    }
  }

  /**
   * Ensure compressor → masterGain → destination is connected.
   * Handles the case where masterPan was inserted or removed.
   */
  private reconnectMasterChain(): void {
    if (!this.compressor || !this.masterGain || !this.ctx) return;

    // Disconnect compressor from whatever it's currently connected to
    try { this.compressor.disconnect(); } catch { /* nothing connected */ }

    if (this.masterPan) {
      this.compressor.connect(this.masterPan);
      try { this.masterPan.disconnect(); } catch { /* nothing connected */ }
      this.masterPan.connect(this.masterGain);
    } else {
      this.compressor.connect(this.masterGain);
    }

    try { this.masterGain.disconnect(); } catch { /* nothing connected */ }
    this.masterGain.connect(this.ctx.destination);
  }

  // ═══════════════════════════════════════════════
  // LISTEN MODE (simple binaural — Easy/Listen tabs)
  // ═══════════════════════════════════════════════

  async play(config: AudioEngineConfig): Promise<void> {
    await this.ensureRunning();

    if (this._isPlaying) this.stopImmediate();

    const ctx = this.ctx!;

    this.carrierLeft = ctx.createOscillator();
    this.carrierLeft.type = config.waveform;
    this.carrierLeft.frequency.value = config.carrierFreqLeft;

    this.gainLeft = ctx.createGain();
    this.gainLeft.gain.value = 0;

    this.panLeft = ctx.createStereoPanner();
    this.panLeft.pan.value = -1;

    this.carrierLeft.connect(this.gainLeft);
    this.gainLeft.connect(this.panLeft);
    this.panLeft.connect(this.compressor!);

    this.carrierRight = ctx.createOscillator();
    this.carrierRight.type = config.waveform;
    this.carrierRight.frequency.value = config.carrierFreqRight;

    this.gainRight = ctx.createGain();
    this.gainRight.gain.value = 0;

    this.panRight = ctx.createStereoPanner();
    this.panRight.pan.value = 1;

    this.carrierRight.connect(this.gainRight);
    this.gainRight.connect(this.panRight);
    this.panRight.connect(this.compressor!);

    // Fade in using setTargetAtTime (timing-resilient)
    const now = ctx.currentTime;
    const tau = config.fadeInDuration / 5;
    this.gainLeft.gain.setTargetAtTime(0.5, now, tau);
    this.gainRight.gain.setTargetAtTime(0.5, now, tau);

    this.carrierLeft.start();
    this.carrierRight.start();

    this._isPlaying = true;
    this._isPaused = false;
    this.startTime = now;
    this.pauseOffset = 0;
    this.wallStartTime = Date.now();
    this.wallPauseOffset = 0;

    this.startKeepAlive();
    this.startSilentAudioElement();
  }

  stop(): void {
    if (!this._isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const tau = 0.3;

    this.fadeOutCarriers(now, tau);
    this.fadeOutAllAmbient(now, tau);

    this.stopTimeout = setTimeout(() => this.stopImmediate(), 1600);
  }

  stopWithLongFade(): void {
    if (!this._isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const tau = 0.6;

    this.fadeOutCarriers(now, tau);
    this.fadeOutAllAmbient(now, tau);

    this.stopTimeout = setTimeout(() => this.stopImmediate(), 3200);
  }

  private fadeOutCarriers(now: number, tau: number): void {
    if (this.gainLeft) {
      this.gainLeft.gain.cancelScheduledValues(now);
      this.gainLeft.gain.setTargetAtTime(0, now, tau);
    }
    if (this.gainRight) {
      this.gainRight.gain.cancelScheduledValues(now);
      this.gainRight.gain.setTargetAtTime(0, now, tau);
    }
  }

  private fadeOutAllAmbient(now: number, tau: number): void {
    for (const [, synth] of this.ambientLayers) {
      const gain = synth.gainNode;
      if (gain) {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setTargetAtTime(0, now, tau);
      }
    }
  }

  private stopImmediate(): void {
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }
    try { this.carrierLeft?.stop(); } catch { /* */ }
    try { this.carrierRight?.stop(); } catch { /* */ }
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

    // Clean up overtone nodes
    try { this.overtoneLeft?.stop(); } catch { /* */ }
    try { this.overtoneRight?.stop(); } catch { /* */ }
    this.overtoneLeft?.disconnect();
    this.overtoneRight?.disconnect();
    this.overtoneGain?.disconnect();
    this.overtoneLeft = null;
    this.overtoneRight = null;
    this.overtoneGain = null;

    this.stopAllAmbientLayersImmediate();

    this._isPlaying = false;
    this._isPaused = false;
    this._legacyAmbientId = null;
    this.pauseOffset = 0;
    this.wallPauseOffset = 0;

    this.stopKeepAlive();
    this.stopSilentAudioElement();
    this.clearMediaSession();
  }

  async pause(): Promise<void> {
    if (!this.ctx || !this._isPlaying || this._isPaused) return;
    this.pauseOffset = this.ctx.currentTime - this.startTime + this.pauseOffset;
    this.wallPauseOffset += Date.now() - this.wallStartTime;
    await this.ctx.suspend();
    this._isPaused = true;
  }

  async resume(): Promise<void> {
    if (!this.ctx || !this._isPaused) return;
    await this.ctx.resume();
    this.startTime = this.ctx.currentTime;
    this.wallStartTime = Date.now();
    this._isPaused = false;
  }

  setCarrierFrequency(left: number, right: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.carrierLeft?.frequency.setTargetAtTime(left, now, 0.05);
    this.carrierRight?.frequency.setTargetAtTime(right, now, 0.05);
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
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(safeVolume, now, 0.02);
    if (this.ambientMasterGain) {
      this.ambientMasterGain.gain.setTargetAtTime(safeVolume, now, 0.02);
    }
  }

  setWaveform(waveform: OscillatorType): void {
    if (this.carrierLeft) this.carrierLeft.type = waveform;
    if (this.carrierRight) this.carrierRight.type = waveform;
  }

  // ═══════════════════════════════════════════════
  // SENSOR MODULATION (Listen mode)
  // ═══════════════════════════════════════════════

  /** Shift stereo balance: -1 (full left) to +1 (full right), 0 = center */
  setChannelBalance(balance: number): void {
    if (!this.ctx || !this.gainLeft || !this.gainRight) return;
    const clamped = Math.max(-1, Math.min(1, balance));
    // ±3dB shift: when balance > 0, left gets quieter; when < 0, right gets quieter
    const leftDb = Math.min(0, -clamped * 3);
    const rightDb = Math.min(0, clamped * 3);
    const leftGain = 0.5 * Math.pow(10, leftDb / 20);
    const rightGain = 0.5 * Math.pow(10, rightDb / 20);
    const now = this.ctx.currentTime;
    this.gainLeft.gain.setTargetAtTime(leftGain, now, 0.1);
    this.gainRight.gain.setTargetAtTime(rightGain, now, 0.1);
  }

  /** Add 2nd-harmonic overtone oscillators as a stillness reward */
  addOvertoneLayer(): void {
    if (!this.ctx || !this.compressor || !this.carrierLeft || !this.carrierRight) return;
    if (this.overtoneGain) return; // already active

    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.overtoneGain = ctx.createGain();
    this.overtoneGain.gain.value = 0;

    this.overtoneLeft = ctx.createOscillator();
    this.overtoneLeft.type = 'sine';
    this.overtoneLeft.frequency.value = this.carrierLeft.frequency.value * 2;

    this.overtoneRight = ctx.createOscillator();
    this.overtoneRight.type = 'sine';
    this.overtoneRight.frequency.value = this.carrierRight.frequency.value * 2;

    // Route through the same panner path as carriers
    if (this.panLeft) {
      const overtoneGainL = ctx.createGain();
      overtoneGainL.gain.value = 0.5;
      this.overtoneLeft.connect(overtoneGainL);
      overtoneGainL.connect(this.panLeft);
    }
    if (this.panRight) {
      const overtoneGainR = ctx.createGain();
      overtoneGainR.gain.value = 0.5;
      this.overtoneRight.connect(overtoneGainR);
      overtoneGainR.connect(this.panRight);
    }

    // Also connect through the overtone gain for master volume control
    this.overtoneLeft.connect(this.overtoneGain);
    this.overtoneRight.connect(this.overtoneGain);
    this.overtoneGain.connect(this.compressor);

    this.overtoneLeft.start();
    this.overtoneRight.start();

    // Slow fade-in
    this.overtoneGain.gain.setTargetAtTime(0.08, now, 2.0);
  }

  /** Remove overtone layer with fade-out */
  removeOvertoneLayer(): void {
    if (!this.ctx || !this.overtoneGain) return;
    const now = this.ctx.currentTime;

    this.overtoneGain.gain.cancelScheduledValues(now);
    this.overtoneGain.gain.setTargetAtTime(0, now, 0.5);

    const oL = this.overtoneLeft;
    const oR = this.overtoneRight;
    const oG = this.overtoneGain;

    this.overtoneLeft = null;
    this.overtoneRight = null;
    this.overtoneGain = null;

    setTimeout(() => {
      try { oL?.stop(); } catch { /* */ }
      try { oR?.stop(); } catch { /* */ }
      oL?.disconnect();
      oR?.disconnect();
      oG?.disconnect();
    }, 600);
  }

  // ═══════════════════════════════════════════════
  // AMBIENT LAYERS
  // ═══════════════════════════════════════════════

  startAmbientLayerById(id: string, volume: number): void {
    if (!this.ctx || !this.ambientMasterGain) return;
    this.stopAmbientLayerById(id);
    const synth = createAmbientSynth(id);
    synth.start(this.ctx, this.ambientMasterGain);
    synth.setVolume(Math.min(volume, 1));
    this.ambientLayers.set(id, synth);
  }

  stopAmbientLayerById(id: string): void {
    const synth = this.ambientLayers.get(id);
    if (!synth) return;
    synth.stop();
    this.ambientLayers.delete(id);
  }

  setAmbientLayerVolume(id: string, volume: number): void {
    const synth = this.ambientLayers.get(id);
    if (!synth) return;
    synth.setVolume(Math.min(Math.max(volume, 0), 1));
  }

  stopAllAmbientLayers(): void {
    for (const id of [...this.ambientLayers.keys()]) {
      this.stopAmbientLayerById(id);
    }
  }

  private stopAllAmbientLayersImmediate(): void {
    for (const [, synth] of this.ambientLayers) synth.stop();
    this.ambientLayers.clear();
  }

  getActiveAmbientLayers(): string[] {
    return [...this.ambientLayers.keys()];
  }

  // Legacy single-ambient (Easy mode)
  async startAmbientLayer(config: AmbientLayerConfig): Promise<void> {
    if (this._legacyAmbientId) this.stopAmbientLayerById(this._legacyAmbientId);
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
    if (this._legacyAmbientId) this.setAmbientLayerVolume(this._legacyAmbientId, volume);
  }

  get currentAmbientId(): string | null { return this._legacyAmbientId; }

  // ═══════════════════════════════════════════════
  // PREVIEW TONE
  // ═══════════════════════════════════════════════

  async previewTone(frequency: number, duration = 500): Promise<void> {
    await this.ensureRunning();
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const durationSec = duration / 1000;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.06, now, 0.01);
    gain.gain.setTargetAtTime(0, now + durationSec - 0.1, 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start();
    osc.stop(now + durationSec + 0.01);
  }

  // ═══════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════

  get playing(): boolean { return this._isPlaying; }
  get paused(): boolean { return this._isPaused; }
  get advancedMode(): boolean { return this._advancedMode; }
  get isPreviewMode(): boolean { return this._isPreviewMode; }

  getElapsedTime(): number {
    if (!this._isPlaying || this._isPaused) return this.wallPauseOffset / 1000;
    return (Date.now() - this.wallStartTime + this.wallPauseOffset) / 1000;
  }

  async playCompletionChime(): Promise<void> {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];

    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = notes[i];

      const gain = ctx.createGain();
      const startAt = now + i * 0.3;
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(0.08, startAt, 0.01);
      gain.gain.setTargetAtTime(0, startAt + 0.15, 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.5);
    }
  }

  // ═══════════════════════════════════════════════
  // ADVANCED MODE: PREVIEW & MULTI-LAYER
  // ═══════════════════════════════════════════════

  async startPreview(config: AdvancedSessionConfig): Promise<void> {
    // 1. Context must be running (user gesture)
    await this.ensureRunning();

    // 2. Cancel pending stop
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }

    // 3. Clean up existing playback
    if (this._isPlaying) {
      if (this._advancedMode) {
        this.stopAdvancedImmediate();
      } else {
        this.stopImmediate();
      }
    }

    this._isPaused = false;

    // 4. Ensure master chain is connected
    this.reconnectMasterChain();

    // 5. Build and start beat layers
    this.buildBeatLayers(config.layers);

    // 6. Enable configured subsystems
    if (config.filter.enabled) this.enableFilter(config.filter);
    if (config.stereo.enabled) {
      this.setStereoWidth(config.stereo.width);
      this.setStereoOffset(config.stereo.pan);
      if (config.stereo.crossfeed > 0) this.setCrossfeed(config.stereo.crossfeed);
      if (config.stereo.rotation) this.enableSpatialRotation(config.stereo.rotationSpeed);
    }
    if (config.lfo.enabled) this.enableLFO(config.lfo);
    if (config.isochronic.enabled) this.enableIsochronic(config.isochronic);

    this._isPreviewMode = true;

    // 7. Background audio support
    this.startKeepAlive();
    this.startSilentAudioElement();
  }

  stopPreview(): void {
    this._isPreviewMode = false;
    if (this._advancedMode) this.stopAdvanced();
  }

  transitionFromPreview(): void {
    this._isPreviewMode = false;
  }

  async playAdvanced(layers: BeatLayer[]): Promise<void> {
    await this.ensureRunning();
    if (this._isPlaying) this.stopImmediate();
    this.reconnectMasterChain();
    this.buildBeatLayers(layers);
    this.startKeepAlive();
    this.startSilentAudioElement();
  }

  /**
   * Build the beat layer audio graph and start oscillators.
   *
   * DESIGN: All AudioParam initial values use direct .value assignment
   * (never setValueAtTime). Oscillators start with parameterless .start().
   * This eliminates all timing/scheduling dependencies that caused the
   * silent-on-first-play bug.
   */
  private buildBeatLayers(layers: BeatLayer[]): void {
    const ctx = this.ctx!;

    this.beatSumGain = ctx.createGain();
    this.beatSumGain.gain.value = 1;
    this.beatSumGain.connect(this.compressor!);

    for (const layer of layers) {
      this.createBeatLayerNodes(layer);
    }

    this._advancedMode = true;
    this._isPlaying = true;
    this._isPaused = false;
    this.startTime = ctx.currentTime;
    this.pauseOffset = 0;
    this.wallStartTime = Date.now();
    this.wallPauseOffset = 0;
  }

  /**
   * Create one beat layer: L/R oscillators, gains, panners, and layer gain.
   * All values set via .value (direct assignment) — never setValueAtTime.
   */
  private createBeatLayerNodes(layer: BeatLayer): void {
    const ctx = this.ctx!;
    const vol = layer.volume / 100;
    const width = this._stereoWidth / 100;

    // Left channel
    const oscL = ctx.createOscillator();
    oscL.type = layer.waveform;
    oscL.frequency.value = layer.carrierFreq;

    const gainL = ctx.createGain();
    gainL.gain.value = 0.5;

    const panL = ctx.createStereoPanner();
    panL.pan.value = -width;

    // Right channel (carrier + beat)
    const oscR = ctx.createOscillator();
    oscR.type = layer.waveform;
    oscR.frequency.value = layer.carrierFreq + layer.beatFreq;

    const gainR = ctx.createGain();
    gainR.gain.value = 0.5;

    const panR = ctx.createStereoPanner();
    panR.pan.value = width;

    // Per-layer volume
    const layerGain = ctx.createGain();
    layerGain.gain.value = vol;

    // Connect: osc → gain → pan → layerGain → beatSumGain
    oscL.connect(gainL);
    gainL.connect(panL);
    panL.connect(layerGain);

    oscR.connect(gainR);
    gainR.connect(panR);
    panR.connect(layerGain);

    layerGain.connect(this.beatSumGain!);

    // Start immediately — no time argument
    oscL.start();
    oscR.start();

    this.beatLayers.set(layer.id, { oscL, oscR, gainL, gainR, panL, panR, layerGain });
  }

  stopAdvanced(): void {
    if (!this._advancedMode || !this.ctx) return;
    const now = this.ctx.currentTime;
    const tau = 0.3;

    for (const [, state] of this.beatLayers) {
      state.gainL.gain.cancelScheduledValues(now);
      state.gainL.gain.setTargetAtTime(0, now, tau);
      state.gainR.gain.cancelScheduledValues(now);
      state.gainR.gain.setTargetAtTime(0, now, tau);
    }

    this.fadeOutAllAmbient(now, tau);
    this.stopTimeout = setTimeout(() => this.stopAdvancedImmediate(), 1800);
  }

  private stopAdvancedImmediate(): void {
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }

    this.disableFilter();
    this.disableLFO();
    this.disableIsochronic();
    this.disableSpatialRotation();

    if (this.masterPan) {
      this.masterPan.disconnect();
      this.masterPan = null;
    }

    for (const [, state] of this.beatLayers) {
      try { state.oscL.stop(); } catch { /* */ }
      try { state.oscR.stop(); } catch { /* */ }
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

    // Reconnect master chain so it's ready for next play
    this.reconnectMasterChain();

    this._advancedMode = false;
    this._isPreviewMode = false;
    this._isPlaying = false;
    this._isPaused = false;
    this.pauseOffset = 0;
    this.wallPauseOffset = 0;
    this._stereoWidth = 100;

    this.stopKeepAlive();
    this.stopSilentAudioElement();
    this.clearMediaSession();
  }

  // Beat layer live controls

  setBeatLayerFrequency(id: string, carrier: number, beat: number): void {
    const state = this.beatLayers.get(id);
    if (!state || !this.ctx) return;
    const now = this.ctx.currentTime;
    state.oscL.frequency.setTargetAtTime(carrier, now, 0.05);
    state.oscR.frequency.setTargetAtTime(carrier + beat, now, 0.05);
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
    this.removeBeatLayer(layer.id);
    this.createBeatLayerNodes(layer);
  }

  removeBeatLayer(id: string): void {
    const state = this.beatLayers.get(id);
    if (!state || !this.ctx) return;
    const now = this.ctx.currentTime;

    state.gainL.gain.setTargetAtTime(0, now, 0.1);
    state.gainR.gain.setTargetAtTime(0, now, 0.1);

    setTimeout(() => {
      try { state.oscL.stop(); } catch { /* */ }
      try { state.oscR.stop(); } catch { /* */ }
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

  // ═══════════════════════════════════════════════
  // FILTER
  // ═══════════════════════════════════════════════

  enableFilter(config: FilterConfig): void {
    if (!this.ctx || !this.beatSumGain || !this.compressor) return;
    this.disableFilter();

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = config.type;
    this.filterNode.frequency.value = config.frequency;
    this.filterNode.Q.value = 0.1 + (config.resonance / 100) * 19.9;

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
    this.filterNode.Q.setTargetAtTime(0.1 + (config.resonance / 100) * 19.9, now, 0.02);
  }

  disableFilter(): void {
    if (!this.filterNode || !this.beatSumGain || !this.compressor) return;
    this.beatSumGain.disconnect();
    this.filterNode.disconnect();
    this.beatSumGain.connect(this.compressor);
    this.filterNode = null;
    this._filterEnabled = false;
  }

  // ═══════════════════════════════════════════════
  // LFO
  // ═══════════════════════════════════════════════

  enableLFO(config: LFOConfig): void {
    if (!this.ctx) return;
    this.disableLFO();

    this.lfoOsc = this.ctx.createOscillator();
    this.lfoOsc.type = config.shape;
    this.lfoOsc.frequency.value = config.rate;

    this.lfoGain = this.ctx.createGain();
    const depth = config.depth / 100;

    let target: AudioParam | null = null;
    let gainAmount = 0;

    switch (config.target) {
      case 'volume':
        if (this.masterGain) { target = this.masterGain.gain; gainAmount = depth * 0.15; }
        break;
      case 'pitch': {
        const first = this.beatLayers.values().next().value;
        if (first) { target = first.oscL.frequency; gainAmount = depth * first.oscL.frequency.value * 0.05; }
        break;
      }
      case 'filter':
        if (this.filterNode) { target = this.filterNode.frequency; gainAmount = depth * this.filterNode.frequency.value * 0.5; }
        break;
      case 'pan':
        if (this.masterPan) { target = this.masterPan.pan; gainAmount = depth; }
        break;
    }

    if (!target) { this.lfoOsc = null; this.lfoGain = null; return; }

    this.lfoGain.gain.value = gainAmount;
    this.lfoOsc.connect(this.lfoGain);
    this.lfoGain.connect(target);
    this.lfoOsc.start();
  }

  updateLFO(config: LFOConfig): void {
    if (!this.lfoOsc || !this.lfoGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.lfoOsc.frequency.setTargetAtTime(config.rate, now, 0.02);
    this.lfoOsc.type = config.shape;

    const depth = config.depth / 100;
    let g = 0;
    switch (config.target) {
      case 'volume': g = depth * 0.15; break;
      case 'pitch': { const f = this.beatLayers.values().next().value; g = f ? depth * f.oscL.frequency.value * 0.05 : 0; break; }
      case 'filter': g = this.filterNode ? depth * this.filterNode.frequency.value * 0.5 : 0; break;
      case 'pan': g = depth; break;
    }
    this.lfoGain.gain.setTargetAtTime(g, now, 0.02);
  }

  disableLFO(): void {
    if (this.lfoOsc) { try { this.lfoOsc.stop(); } catch { /* */ } this.lfoOsc.disconnect(); this.lfoOsc = null; }
    if (this.lfoGain) { this.lfoGain.disconnect(); this.lfoGain = null; }
  }

  // ═══════════════════════════════════════════════
  // ISOCHRONIC
  // ═══════════════════════════════════════════════

  enableIsochronic(config: IsochronicConfig): void {
    if (!this.ctx || !this.compressor) return;
    this.disableIsochronic();

    this.isoOsc = this.ctx.createOscillator();
    this.isoOsc.type = 'sine';
    this.isoOsc.frequency.value = config.toneFreq;

    this.isoGain = this.ctx.createGain();
    this.isoGain.gain.value = 0;
    this.isoOsc.connect(this.isoGain);
    this.isoGain.connect(this.compressor);
    this.isoOsc.start();

    this.nextPulseTime = this.ctx.currentTime;
    this.startIsoPulseScheduler(config);
  }

  private startIsoPulseScheduler(config: IsochronicConfig): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const pulsePeriod = 1 / config.pulseRate;
    const pulseOn = pulsePeriod * 0.5;
    const vol = (config.volume / 100) * 0.4;

    this.isoPulseTimer = setInterval(() => {
      if (!this.isoGain || !ctx) return;
      const now = ctx.currentTime;
      const lookahead = now + 0.05;

      while (this.nextPulseTime < lookahead) {
        const t = this.nextPulseTime;
        switch (config.shape) {
          case 'sharp':
            this.isoGain.gain.setValueAtTime(vol, t);
            this.isoGain.gain.setValueAtTime(0, t + pulseOn);
            break;
          case 'soft':
            this.isoGain.gain.setValueAtTime(0, t);
            this.isoGain.gain.linearRampToValueAtTime(vol, t + pulseOn * 0.5);
            this.isoGain.gain.linearRampToValueAtTime(0, t + pulseOn);
            break;
          case 'ramp':
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
    if (this.isoPulseTimer) clearInterval(this.isoPulseTimer);
    this.startIsoPulseScheduler(config);
  }

  disableIsochronic(): void {
    if (this.isoPulseTimer) { clearInterval(this.isoPulseTimer); this.isoPulseTimer = null; }
    if (this.isoOsc) { try { this.isoOsc.stop(); } catch { /* */ } this.isoOsc.disconnect(); this.isoOsc = null; }
    if (this.isoGain) { this.isoGain.disconnect(); this.isoGain = null; }
  }

  // ═══════════════════════════════════════════════
  // STEREO
  // ═══════════════════════════════════════════════

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

    if (!this.masterPan) {
      this.masterPan = this.ctx.createStereoPanner();
      this.compressor.disconnect();
      this.compressor.connect(this.masterPan);
      this.masterPan.connect(this.masterGain);
    }

    this.masterPan.pan.setTargetAtTime(pan / 100, this.ctx.currentTime, 0.02);
  }

  setCrossfeed(amount: number): void {
    this.setStereoWidth(this._stereoWidth * (1 - amount / 100));
  }

  enableSpatialRotation(speed: number): void {
    if (!this.ctx || !this.masterPan) return;
    this.disableSpatialRotation();

    this.rotationLfo = this.ctx.createOscillator();
    this.rotationLfo.type = 'sine';
    this.rotationLfo.frequency.value = speed;

    this.rotationLfoGain = this.ctx.createGain();
    this.rotationLfoGain.gain.value = 0.8;

    this.rotationLfo.connect(this.rotationLfoGain);
    this.rotationLfoGain.connect(this.masterPan.pan);
    this.rotationLfo.start();
  }

  disableSpatialRotation(): void {
    if (this.rotationLfo) { try { this.rotationLfo.stop(); } catch { /* */ } this.rotationLfo.disconnect(); this.rotationLfo = null; }
    if (this.rotationLfoGain) { this.rotationLfoGain.disconnect(); this.rotationLfoGain = null; }
  }

  // ═══════════════════════════════════════════════
  // BACKGROUND AUDIO
  // ═══════════════════════════════════════════════

  private setupVisibilityHandler(): void {
    if (this._visibilityHandlerSetup) return;
    this._visibilityHandlerSetup = true;

    const handleResume = () => {
      if (this._isPlaying && !this._isPaused) this.resumeFromBackground();
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleResume();
    });
    window.addEventListener('focus', handleResume);
  }

  async resumeFromBackground(): Promise<void> {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended' || (this.ctx.state as string) === 'interrupted') {
      try { await this.ctx.resume(); } catch (e) { console.warn('Failed to resume AudioContext:', e); }
    }
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.keepAliveInterval = setInterval(() => {
      if (this.ctx && this.ctx.state === 'running') {
        const buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start();
      }
    }, 10000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) { clearInterval(this.keepAliveInterval); this.keepAliveInterval = null; }
  }

  private startSilentAudioElement(): void {
    if (this.silentAudio) return;
    const silentWav = this.createSilentWav();
    const blob = new Blob([silentWav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    this.silentAudio = new Audio(url);
    this.silentAudio.loop = true;
    this.silentAudio.volume = 0.01;
    this.silentAudio.setAttribute('playsinline', '');
    this.silentAudio.setAttribute('webkit-playsinline', '');
    this.silentAudio.play().catch(() => {});
  }

  private createSilentWav(): ArrayBuffer {
    const sampleRate = 8000;
    const numSamples = sampleRate;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); view.setUint32(4, 36 + numSamples * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true); ws(36, 'data');
    view.setUint32(40, numSamples * 2, true);
    return buffer;
  }

  private stopSilentAudioElement(): void {
    if (this.silentAudio) {
      this.silentAudio.pause();
      const src = this.silentAudio.src;
      this.silentAudio.src = '';
      this.silentAudio = null;
      URL.revokeObjectURL(src);
    }
  }

  // ═══════════════════════════════════════════════
  // MEDIA SESSION
  // ═══════════════════════════════════════════════

  setupMediaSession(title: string, category: string, callbacks: {
    onPause?: () => void; onResume?: () => void; onStop?: () => void;
  }, artwork?: MediaImage[]): void {
    this._mediaSessionCallbacks = callbacks;
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'Binaural Session', artist: 'Binara', album: category || 'Binaural Beats', artwork: artwork || [],
    });
    navigator.mediaSession.setActionHandler('play', () => callbacks.onResume?.());
    navigator.mediaSession.setActionHandler('pause', () => callbacks.onPause?.());
    navigator.mediaSession.setActionHandler('stop', () => callbacks.onStop?.());
  }

  private clearMediaSession(): void {
    this._mediaSessionCallbacks = {};
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('stop', null);
    }
  }

  // ═══════════════════════════════════════════════
  // DESTROY
  // ═══════════════════════════════════════════════

  destroy(): void {
    if (this._advancedMode) { this.stopAdvancedImmediate(); } else { this.stopImmediate(); }
    if (this.compressor) { this.compressor.disconnect(); this.compressor = null; }
    if (this.masterGain) { this.masterGain.disconnect(); this.masterGain = null; }
    if (this.ambientMasterGain) { this.ambientMasterGain.disconnect(); this.ambientMasterGain = null; }
    if (this.ctx) { this.ctx.close().catch(() => {}); this.ctx = null; }
  }
}
