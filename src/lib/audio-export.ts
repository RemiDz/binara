// ─── Offline audio rendering + WAV export ───
// Rebuilds the audio graph in an OfflineAudioContext for clean renders

import type { AdvancedSessionConfig, MixConfig, BeatLayer, LFOConfig, IsochronicConfig } from '@/types';
import { getBrainwaveState } from './brainwave-states';
import { getCarrierTone } from './carrier-tones';
import { VOLUME_HARD_CAP } from './constants';

// Ambient types that can be synthesised offline (no sample files needed)
const SYNTH_AMBIENT_TYPES = new Set(['white', 'pink', 'brown', 'bowls']);

interface OfflineBeatLayerState {
  oscL: OscillatorNode;
  oscR: OscillatorNode;
  panL: StereoPannerNode;
  panR: StereoPannerNode;
  layerGain: GainNode;
}

export interface ExportConfig {
  format: 'wav';
  duration: number; // seconds
  sampleRate: number;
  type: 'advanced' | 'mix';
  advancedConfig?: AdvancedSessionConfig;
  mixConfig?: MixConfig;
  volume: number; // 0-100
}

export async function exportSession(
  config: ExportConfig,
  onProgress: (progress: number) => void,
): Promise<Blob> {
  const { sampleRate } = config;
  const MAX_EXPORT_SECONDS = 1800; // 30 min cap to prevent OOM
  const duration = Math.min(config.duration, MAX_EXPORT_SECONDS);
  const totalSamples = sampleRate * duration;
  const channelCount = 2;

  const offlineCtx = new OfflineAudioContext(channelCount, totalSamples, sampleRate);

  // Build audio graph
  if (config.type === 'advanced' && config.advancedConfig) {
    buildAdvancedGraph(offlineCtx, config.advancedConfig, config.volume, duration);
  } else if (config.type === 'mix' && config.mixConfig) {
    buildMixGraph(offlineCtx, config.mixConfig, config.volume, duration);
  } else {
    throw new Error('Invalid export config: missing advancedConfig or mixConfig');
  }

  // Progress timer (estimated)
  const startTime = Date.now();
  const progressInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    // Rough estimate: offline rendering is ~5-20x faster than realtime
    const estimatedTotal = duration / 10;
    const progress = Math.min(0.95, elapsed / estimatedTotal);
    onProgress(progress);
  }, 200);

  try {
    const audioBuffer = await offlineCtx.startRendering();
    clearInterval(progressInterval);
    onProgress(0.98);

    const wavBlob = encodeWAV(audioBuffer);
    onProgress(1);
    return wavBlob;
  } catch (e) {
    clearInterval(progressInterval);
    throw new Error(`Export rendering failed: ${e instanceof Error ? e.message : 'unknown error'}`);
  }
}

// ─── Advanced export graph ───

function buildAdvancedGraph(
  ctx: OfflineAudioContext,
  config: AdvancedSessionConfig,
  volume: number,
  duration: number,
): void {
  const now = 0;
  const masterVol = (volume / 100) * VOLUME_HARD_CAP;

  // Compressor
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-6, now);
  compressor.knee.setValueAtTime(30, now);
  compressor.ratio.setValueAtTime(12, now);
  compressor.attack.setValueAtTime(0.003, now);
  compressor.release.setValueAtTime(0.25, now);

  // Master gain
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(masterVol, now);

  // Stereo: insert masterPan between compressor and masterGain if needed
  let masterPan: StereoPannerNode | null = null;
  if (config.stereo.enabled && (config.stereo.pan !== 0 || config.stereo.rotation)) {
    masterPan = ctx.createStereoPanner();
    masterPan.pan.setValueAtTime(config.stereo.pan / 100, now);
    compressor.connect(masterPan);
    masterPan.connect(masterGain);
  } else {
    compressor.connect(masterGain);
  }

  masterGain.connect(ctx.destination);

  // Beat sum gain
  const beatSumGain = ctx.createGain();
  beatSumGain.gain.setValueAtTime(1, now);

  // Filter (optional)
  let filterNode: BiquadFilterNode | null = null;
  if (config.filter.enabled) {
    filterNode = ctx.createBiquadFilter();
    filterNode.type = config.filter.type;
    filterNode.frequency.setValueAtTime(config.filter.frequency, now);
    const q = 0.1 + (config.filter.resonance / 100) * 19.9;
    filterNode.Q.setValueAtTime(q, now);

    beatSumGain.connect(filterNode);
    filterNode.connect(compressor);
  } else {
    beatSumGain.connect(compressor);
  }

  // Stereo width: apply crossfeed reduction
  const stereoWidth = config.stereo.enabled ? config.stereo.width : 100;
  const effectiveWidth = config.stereo.enabled && config.stereo.crossfeed > 0
    ? stereoWidth * (1 - config.stereo.crossfeed / 100)
    : stereoWidth;

  // Create beat layers
  const fadeIn = 2;
  const fadeOut = 2;

  const layerStates: OfflineBeatLayerState[] = [];
  for (const layer of config.layers) {
    const state = createOfflineBeatLayer(ctx, layer, beatSumGain, duration, fadeIn, fadeOut, effectiveWidth);
    layerStates.push(state);
  }

  // LFO modulation
  if (config.lfo.enabled) {
    addOfflineLFO(ctx, config.lfo, masterGain, layerStates, filterNode, masterPan, duration);
  }

  // Isochronic tone
  if (config.isochronic.enabled) {
    scheduleIsochronicPulses(ctx, config.isochronic, compressor, duration);
  }

  // Stereo rotation
  if (config.stereo.enabled && config.stereo.rotation && masterPan) {
    addOfflineStereoRotation(ctx, masterPan, config.stereo.rotationSpeed, duration);
  }

  // Ambient layers (synthesised types only — sample-based sounds are excluded)
  if (config.ambientLayers.length > 0) {
    addOfflineAmbientLayers(ctx, config.ambientLayers, ctx.destination, duration, masterVol);
  }

  // Schedule timeline frequency changes
  const layerOscillators = layerStates.map((s) => s.oscR);
  scheduleAdvancedTimeline(config, layerOscillators);
}

function createOfflineBeatLayer(
  ctx: OfflineAudioContext,
  layer: BeatLayer,
  destination: GainNode,
  duration: number,
  fadeIn: number,
  fadeOut: number,
  stereoWidth = 100,
): OfflineBeatLayerState {
  const now = 0;
  const vol = layer.volume / 100;
  const width = stereoWidth / 100;
  const safeFadeIn = Math.min(fadeIn, duration / 2);
  const safeFadeOut = Math.min(fadeOut, duration / 2);

  const oscL = ctx.createOscillator();
  oscL.type = layer.waveform;
  oscL.frequency.setValueAtTime(layer.carrierFreq, now);

  const gainL = ctx.createGain();
  gainL.gain.setValueAtTime(0, now);
  gainL.gain.linearRampToValueAtTime(0.5, now + safeFadeIn);
  gainL.gain.setValueAtTime(0.5, now + duration - safeFadeOut);
  gainL.gain.linearRampToValueAtTime(0, now + duration);

  const panL = ctx.createStereoPanner();
  panL.pan.setValueAtTime(-width, now);

  const oscR = ctx.createOscillator();
  oscR.type = layer.waveform;
  oscR.frequency.setValueAtTime(layer.carrierFreq + layer.beatFreq, now);

  const gainR = ctx.createGain();
  gainR.gain.setValueAtTime(0, now);
  gainR.gain.linearRampToValueAtTime(0.5, now + safeFadeIn);
  gainR.gain.setValueAtTime(0.5, now + duration - safeFadeOut);
  gainR.gain.linearRampToValueAtTime(0, now + duration);

  const panR = ctx.createStereoPanner();
  panR.pan.setValueAtTime(width, now);

  const layerGain = ctx.createGain();
  layerGain.gain.setValueAtTime(vol, now);

  oscL.connect(gainL);
  gainL.connect(panL);
  panL.connect(layerGain);

  oscR.connect(gainR);
  gainR.connect(panR);
  panR.connect(layerGain);

  layerGain.connect(destination);

  oscL.start(now);
  oscR.start(now);
  oscL.stop(now + duration);
  oscR.stop(now + duration);

  return { oscL, oscR, panL, panR, layerGain };
}

function scheduleAdvancedTimeline(
  config: AdvancedSessionConfig,
  layerOscillators: OscillatorNode[],
): void {
  if (config.timeline.length <= 1) return;

  const defaultBeatFreqs = config.layers.map((l) => l.beatFreq);

  let timeOffset = 0;
  for (let i = 0; i < config.timeline.length; i++) {
    const phase = config.timeline[i];
    const phaseDuration = phase.duration * 60;

    const prevPhase = config.timeline[i - 1];
    const startBeatFreqs = prevPhase
      ? config.layers.map(() => prevPhase.beatFreq)
      : defaultBeatFreqs;

    for (let j = 0; j < config.layers.length; j++) {
      const osc = layerOscillators[j];
      if (!osc) continue;
      const carrier = config.layers[j].carrierFreq;
      osc.frequency.setValueAtTime(carrier + startBeatFreqs[j], timeOffset);
      osc.frequency.linearRampToValueAtTime(carrier + phase.beatFreq, timeOffset + phaseDuration);
    }

    timeOffset += phaseDuration;
  }
}

// ─── LFO for offline rendering ───

function addOfflineLFO(
  ctx: OfflineAudioContext,
  config: LFOConfig,
  masterGain: GainNode,
  layers: OfflineBeatLayerState[],
  filterNode: BiquadFilterNode | null,
  masterPan: StereoPannerNode | null,
  duration: number,
): void {
  const depth = config.depth / 100;
  let target: AudioParam | null = null;
  let gainAmount = 0;

  switch (config.target) {
    case 'volume':
      target = masterGain.gain;
      // Match realtime: depth * 0.15 (half of VOLUME_HARD_CAP)
      gainAmount = depth * VOLUME_HARD_CAP * 0.5;
      break;
    case 'pitch':
      if (layers.length > 0) {
        target = layers[0].oscL.frequency;
        gainAmount = depth * layers[0].oscL.frequency.value * 0.05;
      }
      break;
    case 'filter':
      if (filterNode) {
        target = filterNode.frequency;
        gainAmount = depth * filterNode.frequency.value * 0.5;
      }
      break;
    case 'pan':
      if (masterPan) {
        target = masterPan.pan;
        gainAmount = depth;
      }
      break;
  }

  if (!target) return;

  const lfoOsc = ctx.createOscillator();
  lfoOsc.type = config.shape;
  lfoOsc.frequency.setValueAtTime(config.rate, 0);

  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(gainAmount, 0);

  lfoOsc.connect(lfoGain);
  lfoGain.connect(target);
  lfoOsc.start(0);
  lfoOsc.stop(duration);
}

// ─── Isochronic tone for offline rendering ───

function scheduleIsochronicPulses(
  ctx: OfflineAudioContext,
  config: IsochronicConfig,
  compressor: DynamicsCompressorNode,
  duration: number,
): void {
  const isoOsc = ctx.createOscillator();
  isoOsc.type = 'sine';
  isoOsc.frequency.setValueAtTime(config.toneFreq, 0);

  const isoGain = ctx.createGain();
  isoGain.gain.setValueAtTime(0, 0);

  isoOsc.connect(isoGain);
  isoGain.connect(compressor);
  isoOsc.start(0);
  isoOsc.stop(duration);

  // Pre-schedule all pulses for the entire duration
  const pulsePeriod = 1 / config.pulseRate;
  const pulseOn = pulsePeriod * 0.5;
  const vol = (config.volume / 100) * 0.4;

  let t = 0;
  while (t < duration) {
    switch (config.shape) {
      case 'sharp':
        isoGain.gain.setValueAtTime(vol, t);
        isoGain.gain.setValueAtTime(0, t + pulseOn);
        break;
      case 'soft':
        isoGain.gain.setValueAtTime(0, t);
        isoGain.gain.linearRampToValueAtTime(vol, t + pulseOn * 0.5);
        isoGain.gain.linearRampToValueAtTime(0, t + pulseOn);
        break;
      case 'ramp':
        isoGain.gain.setValueAtTime(0, t);
        isoGain.gain.linearRampToValueAtTime(vol, t + pulseOn * 0.9);
        isoGain.gain.setValueAtTime(0, t + pulseOn);
        break;
    }
    t += pulsePeriod;
  }
}

// ─── Stereo rotation for offline rendering ───

function addOfflineStereoRotation(
  ctx: OfflineAudioContext,
  masterPan: StereoPannerNode,
  speed: number,
  duration: number,
): void {
  const rotLfo = ctx.createOscillator();
  rotLfo.type = 'sine';
  rotLfo.frequency.setValueAtTime(speed, 0);

  const rotGain = ctx.createGain();
  rotGain.gain.setValueAtTime(0.8, 0);

  rotLfo.connect(rotGain);
  rotGain.connect(masterPan.pan);
  rotLfo.start(0);
  rotLfo.stop(duration);
}

// ─── Ambient layers for offline rendering ───
// Only synthesised types (white, pink, brown, bowls) are supported.
// Sample-based ambient sounds (rain, ocean, forest, etc.) require OGG files
// that cannot be loaded in an OfflineAudioContext render.

function addOfflineAmbientLayers(
  ctx: OfflineAudioContext,
  layers: { id: string; volume: number }[],
  destination: AudioNode,
  duration: number,
  masterVol: number,
): void {
  // Ambient master gain mirrors the beat master volume (matches realtime)
  const ambientMaster = ctx.createGain();
  ambientMaster.gain.setValueAtTime(masterVol, 0);
  ambientMaster.connect(destination);

  for (const layer of layers) {
    if (!SYNTH_AMBIENT_TYPES.has(layer.id)) continue;

    const vol = layer.volume / 100;
    // Match realtime internal base gain: noise synths use 0.5/0.55, bowls = 1
    const baseScale = layer.id === 'pink' ? 0.55 : layer.id === 'bowls' ? 1 : 0.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(vol * baseScale, 1); // 1s fade-in
    gain.connect(ambientMaster);

    const buffer = layer.id === 'bowls'
      ? createOfflineBowlBuffer(ctx, 4)
      : createOfflineNoiseBuffer(ctx, layer.id as 'white' | 'pink' | 'brown', 4);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    source.start(0);
    source.stop(duration);
  }
}

// ─── Noise buffer generation (matches ambient-synth.ts algorithms) ───

function createOfflineNoiseBuffer(
  ctx: OfflineAudioContext,
  type: 'white' | 'pink' | 'brown',
  durationSeconds: number,
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
    // Voss-McCartney algorithm
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
    // Brown noise (integrator)
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

function createOfflineBowlBuffer(
  ctx: OfflineAudioContext,
  durationSeconds: number,
): AudioBuffer {
  const FREQUENCIES = [396, 528, 639];
  const AMPLITUDES = [0.15, 0.12, 0.08];
  const length = ctx.sampleRate * durationSeconds;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / ctx.sampleRate;
      let sample = 0;
      for (let f = 0; f < FREQUENCIES.length; f++) {
        const freq = FREQUENCIES[f] + (ch === 0 ? -0.5 : 0.5) * (f + 1);
        const amp = AMPLITUDES[f];
        const env = 0.6 + 0.4 * Math.sin(t * Math.PI * 2 / (durationSeconds * (f + 1)));
        sample += Math.sin(t * freq * Math.PI * 2) * amp * env;
      }
      data[i] = sample;
    }
  }

  return buffer;
}

// ─── Mix export graph ───

function buildMixGraph(
  ctx: OfflineAudioContext,
  config: MixConfig,
  volume: number,
  duration: number,
): void {
  const now = 0;
  const masterVol = (volume / 100) * VOLUME_HARD_CAP;

  const bwState = getBrainwaveState(config.stateId);
  const carrier = getCarrierTone(config.carrierId);
  const carrierFreq = config.customCarrierFreq ?? carrier?.frequency ?? 200;
  const targetBeat = config.customBeatFreq ?? bwState?.beatFreq ?? 10;

  // Compressor
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-6, now);
  compressor.knee.setValueAtTime(30, now);
  compressor.ratio.setValueAtTime(12, now);
  compressor.attack.setValueAtTime(0.003, now);
  compressor.release.setValueAtTime(0.25, now);

  // Master gain
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(masterVol, now);

  compressor.connect(masterGain);
  masterGain.connect(ctx.destination);

  const fadeIn = 3;
  const fadeOut = 3;
  const safeFadeIn = Math.min(fadeIn, duration / 2);
  const safeFadeOut = Math.min(fadeOut, duration / 2);

  // Left carrier
  const oscL = ctx.createOscillator();
  oscL.type = 'sine';
  oscL.frequency.setValueAtTime(carrierFreq, now);

  const gainL = ctx.createGain();
  gainL.gain.setValueAtTime(0, now);
  gainL.gain.linearRampToValueAtTime(0.5, now + safeFadeIn);
  gainL.gain.setValueAtTime(0.5, now + duration - safeFadeOut);
  gainL.gain.linearRampToValueAtTime(0, now + duration);

  const panL = ctx.createStereoPanner();
  panL.pan.setValueAtTime(-1, now);

  // Right carrier (carrier + beat)
  const oscR = ctx.createOscillator();
  oscR.type = 'sine';

  const gainR = ctx.createGain();
  gainR.gain.setValueAtTime(0, now);
  gainR.gain.linearRampToValueAtTime(0.5, now + safeFadeIn);
  gainR.gain.setValueAtTime(0.5, now + duration - safeFadeOut);
  gainR.gain.linearRampToValueAtTime(0, now + duration);

  const panR = ctx.createStereoPanner();
  panR.pan.setValueAtTime(1, now);

  // Schedule mix timeline (ease-in → deep → ease-out)
  const easeInSec = config.timeline.easeIn * 60;
  const deepSec = config.timeline.deep * 60;
  const easeOutSec = config.timeline.easeOut * 60;

  const startBeat = 10; // Alpha 10 Hz start

  // Ease in: ramp from alpha (10Hz) to target
  oscR.frequency.setValueAtTime(carrierFreq + startBeat, now);
  oscR.frequency.linearRampToValueAtTime(carrierFreq + targetBeat, now + easeInSec);

  // Deep: hold target
  oscR.frequency.setValueAtTime(carrierFreq + targetBeat, now + easeInSec);

  // Ease out: ramp back to alpha
  oscR.frequency.setValueAtTime(carrierFreq + targetBeat, now + easeInSec + deepSec);
  oscR.frequency.linearRampToValueAtTime(carrierFreq + startBeat, now + easeInSec + deepSec + easeOutSec);

  oscL.connect(gainL);
  gainL.connect(panL);
  panL.connect(compressor);

  oscR.connect(gainR);
  gainR.connect(panR);
  panR.connect(compressor);

  oscL.start(now);
  oscR.start(now);
  oscL.stop(now + duration);
  oscR.stop(now + duration);

  // Ambient layers (synthesised types only)
  if (config.ambientLayers.length > 0) {
    addOfflineAmbientLayers(ctx, config.ambientLayers, ctx.destination, duration, masterVol);
  }
}

// ─── WAV encoding ───

function encodeWAV(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const bytesPerSample = 2; // Int16
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = length * blockAlign;
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleaved PCM data
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(audioBuffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}

export function estimateFileSize(durationSeconds: number, sampleRate = 44100): number {
  // stereo * 2 bytes per sample * sample rate * duration
  return (2 * 2 * sampleRate * durationSeconds) / (1024 * 1024); // MB
}
