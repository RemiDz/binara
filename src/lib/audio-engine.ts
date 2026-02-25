import type { AudioEngineConfig, AmbientLayerConfig, BeatLayer, FilterConfig, LFOConfig, IsochronicConfig, AdvancedSessionConfig } from '@/types';
import { VOLUME_HARD_CAP } from './constants';
import { createAmbientSynth, type AmbientSynth } from './ambient-synth';

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

  // Multi-ambient support (procedural synth instances)
  private ambientLayers: Map<string, AmbientSynth> = new Map();

  // Legacy single-ambient (Phase 1 compat)
  private _legacyAmbientId: string | null = null;

  private _isPlaying = false;
  private _isPaused = false;
  private startTime = 0;
  private pauseOffset = 0;
  private stopTimeout: ReturnType<typeof setTimeout> | null = null;

  // Wall-clock timing (survives AudioContext suspension)
  private wallStartTime = 0;
  private wallPauseOffset = 0;

  // Background audio support
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  private silentAudio: HTMLAudioElement | null = null;
  private _visibilityHandlerSetup = false;

  // Media session callbacks (set by consumer)
  private _mediaSessionCallbacks: {
    onPause?: () => void;
    onResume?: () => void;
    onStop?: () => void;
  } = {};

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

  // Preview mode (live audio in builder)
  private _isPreviewMode = false;

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

    this.setupVisibilityHandler();
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

    // Start keepalive and silent audio BEFORE creating oscillators
    // This activates the browser audio session first
    this.startKeepAlive();
    this.startSilentAudioElement();

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
    this.wallStartTime = Date.now();
    this.wallPauseOffset = 0;
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
    for (const [, synth] of this.ambientLayers) {
      const gain = synth.gainNode;
      if (gain) {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.setTargetAtTime(0, now, tau);
      }
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

    const synth = createAmbientSynth(id);
    synth.start(this.ctx, this.compressor);
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
    for (const [, synth] of this.ambientLayers) {
      synth.stop();
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
    if (!this._isPlaying) return this.wallPauseOffset / 1000;
    if (this._isPaused) return this.wallPauseOffset / 1000;
    return (Date.now() - this.wallStartTime + this.wallPauseOffset) / 1000;
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

  get isPreviewMode(): boolean {
    return this._isPreviewMode;
  }

  // ─── Preview mode (live audio in builder) ───

  async startPreview(config: AdvancedSessionConfig): Promise<void> {
    // Ensure audio engine is initialised
    if (!this.ctx || !this.compressor) {
      await this.init();
    }

    // Cancel any pending stop timeout from a previous stopPreview/stopAdvanced
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }

    // Stop any existing playback cleanly BEFORE resuming context
    if (this._isPlaying) {
      if (this._advancedMode) {
        this.stopAdvancedImmediate();
      } else {
        this.stopImmediate();
      }
    }

    // Clear paused flag — crucial if a previous session called pause()
    this._isPaused = false;

    // Force AudioContext to running state
    if (this.ctx!.state !== 'running') {
      try {
        await this.ctx!.resume();
      } catch (e) {
        console.warn('Failed to resume AudioContext:', e);
      }
      // Give the context a moment to actually start processing
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Double-check context is running
    if (this.ctx!.state !== 'running') {
      try {
        await this.ctx!.resume();
      } catch { /* ignore */ }
    }

    // Re-verify masterGain is connected (safety net)
    if (this.masterGain && this.compressor) {
      try {
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx!.destination);
      } catch {
        // Already connected — this is fine
      }
    }

    // Set up beat layers
    await this.playAdvanced(config.layers);

    // Enable subsystems from config
    if (config.filter.enabled) {
      this.enableFilter(config.filter);
    }
    if (config.stereo.enabled) {
      this.setStereoWidth(config.stereo.width);
      this.setStereoOffset(config.stereo.pan);
      if (config.stereo.crossfeed > 0) {
        this.setCrossfeed(config.stereo.crossfeed);
      }
      if (config.stereo.rotation) {
        this.enableSpatialRotation(config.stereo.rotationSpeed);
      }
    }
    if (config.lfo.enabled) {
      this.enableLFO(config.lfo);
    }
    if (config.isochronic.enabled) {
      this.enableIsochronic(config.isochronic);
    }

    this._isPreviewMode = true;

    // Diagnostic — remove after confirming fix
    console.log('[Binara Audio Debug]', {
      ctxState: this.ctx?.state,
      ctxTime: this.ctx?.currentTime,
      isPlaying: this._isPlaying,
      advancedMode: this._advancedMode,
      previewMode: this._isPreviewMode,
      beatLayerCount: this.beatLayers.size,
      beatSumGainConnected: !!this.beatSumGain,
      compressorConnected: !!this.compressor,
      masterGainValue: this.masterGain?.gain.value,
      masterGainConnected: !!this.masterGain,
    });
  }

  stopPreview(): void {
    this._isPreviewMode = false;
    if (this._advancedMode) {
      this.stopAdvanced();
    }
  }

  transitionFromPreview(): void {
    // Audio continues uninterrupted — just clear the preview flag
    this._isPreviewMode = false;
  }

  async playAdvanced(layers: BeatLayer[]): Promise<void> {
    if (!this.ctx || !this.compressor) {
      await this.init();
    }

    // Ensure context is running (may have been suspended)
    if (this.ctx!.state !== 'running') {
      try {
        await this.ctx!.resume();
      } catch { /* ignore */ }
    }

    if (this._isPlaying) {
      this.stopImmediate();
    }

    const ctx = this.ctx!;

    // Create sum gain for all beat layers
    this.beatSumGain = ctx.createGain();
    this.beatSumGain.gain.value = 1;
    this.beatSumGain.connect(this.compressor!);

    // Create each beat layer
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

    this.startKeepAlive();
    this.startSilentAudioElement();
  }

  private createBeatLayerNodes(layer: BeatLayer): void {
    const ctx = this.ctx!;
    const vol = layer.volume / 100;
    const width = this._stereoWidth / 100;

    const oscL = ctx.createOscillator();
    oscL.type = layer.waveform;
    oscL.frequency.setValueAtTime(layer.carrierFreq, ctx.currentTime);

    const gainL = ctx.createGain();
    // Start at a small non-zero value and ramp up using setTargetAtTime
    // (more reliable than linearRampToValueAtTime across browsers)
    gainL.gain.value = 0.001;
    gainL.gain.setTargetAtTime(0.5, ctx.currentTime, 0.5);

    const panL = ctx.createStereoPanner();
    panL.pan.setValueAtTime(-width, ctx.currentTime);

    const oscR = ctx.createOscillator();
    oscR.type = layer.waveform;
    oscR.frequency.setValueAtTime(layer.carrierFreq + layer.beatFreq, ctx.currentTime);

    const gainR = ctx.createGain();
    gainR.gain.value = 0.001;
    gainR.gain.setTargetAtTime(0.5, ctx.currentTime, 0.5);

    const panR = ctx.createStereoPanner();
    panR.pan.setValueAtTime(width, ctx.currentTime);

    const layerGain = ctx.createGain();
    layerGain.gain.value = vol;

    // Wire: osc → gain → pan → layerGain → beatSumGain
    oscL.connect(gainL);
    gainL.connect(panL);
    panL.connect(layerGain);

    oscR.connect(gainR);
    gainR.connect(panR);
    panR.connect(layerGain);

    layerGain.connect(this.beatSumGain!);

    oscL.start();
    oscR.start();

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

  // ─── Background audio support ───

  private setupVisibilityHandler(): void {
    if (this._visibilityHandlerSetup) return;
    this._visibilityHandlerSetup = true;

    const handleResume = () => {
      if (this._isPlaying && !this._isPaused) {
        this.resumeFromBackground();
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleResume();
    });
    window.addEventListener('focus', handleResume);
  }

  async resumeFromBackground(): Promise<void> {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended' || (this.ctx.state as string) === 'interrupted') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('Failed to resume AudioContext:', e);
      }
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
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private startSilentAudioElement(): void {
    if (this.silentAudio) return;

    const silentWav = this.createSilentWav();
    const blob = new Blob([silentWav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    this.silentAudio = new Audio(url);
    this.silentAudio.loop = true;
    this.silentAudio.volume = 0.01;
    // iOS attributes to keep audio session alive
    this.silentAudio.setAttribute('playsinline', '');
    this.silentAudio.setAttribute('webkit-playsinline', '');
    this.silentAudio.play().catch(() => {
      // Autoplay may be blocked — will start on next user gesture
    });
  }

  private createSilentWav(): ArrayBuffer {
    const sampleRate = 8000;
    const numSamples = sampleRate; // 1 second
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Silent samples — already zero-initialised by ArrayBuffer
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

  setupMediaSession(title: string, category: string, callbacks: {
    onPause?: () => void;
    onResume?: () => void;
    onStop?: () => void;
  }, artwork?: MediaImage[]): void {
    this._mediaSessionCallbacks = callbacks;
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'Binaural Session',
      artist: 'Binara',
      album: category || 'Binaural Beats',
      artwork: artwork || [],
    });

    navigator.mediaSession.setActionHandler('play', () => {
      callbacks.onResume?.();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      callbacks.onPause?.();
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      callbacks.onStop?.();
    });
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

  destroy(): void {
    if (this._advancedMode) {
      this.stopAdvancedImmediate();
    } else {
      this.stopImmediate();
    }
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
