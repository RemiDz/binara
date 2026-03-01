// ─── Offline audio rendering + WAV export ───
// Rebuilds the audio graph in an OfflineAudioContext for clean renders

import type { AdvancedSessionConfig, MixConfig, BeatLayer } from '@/types';
import { getBrainwaveState } from './brainwave-states';
import { getCarrierTone } from './carrier-tones';
import { VOLUME_HARD_CAP } from './constants';

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

  compressor.connect(masterGain);
  masterGain.connect(ctx.destination);

  // Beat sum gain
  const beatSumGain = ctx.createGain();
  beatSumGain.gain.setValueAtTime(1, now);

  // Filter (optional)
  if (config.filter.enabled) {
    const filter = ctx.createBiquadFilter();
    filter.type = config.filter.type;
    filter.frequency.setValueAtTime(config.filter.frequency, now);
    const q = 0.1 + (config.filter.resonance / 100) * 19.9;
    filter.Q.setValueAtTime(q, now);

    beatSumGain.connect(filter);
    filter.connect(compressor);
  } else {
    beatSumGain.connect(compressor);
  }

  // Create beat layers
  const fadeIn = 2;
  const fadeOut = 2;

  const layerOscillators: OscillatorNode[] = [];
  for (const layer of config.layers) {
    const { oscR } = createOfflineBeatLayer(ctx, layer, beatSumGain, duration, fadeIn, fadeOut);
    layerOscillators.push(oscR);
  }

  // Schedule timeline frequency changes
  scheduleAdvancedTimeline(config, layerOscillators);
}

function createOfflineBeatLayer(
  ctx: OfflineAudioContext,
  layer: BeatLayer,
  destination: GainNode,
  duration: number,
  fadeIn: number,
  fadeOut: number,
): { oscR: OscillatorNode } {
  const now = 0;
  const vol = layer.volume / 100;
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
  panL.pan.setValueAtTime(-1, now);

  const oscR = ctx.createOscillator();
  oscR.type = layer.waveform;
  oscR.frequency.setValueAtTime(layer.carrierFreq + layer.beatFreq, now);

  const gainR = ctx.createGain();
  gainR.gain.setValueAtTime(0, now);
  gainR.gain.linearRampToValueAtTime(0.5, now + safeFadeIn);
  gainR.gain.setValueAtTime(0.5, now + duration - safeFadeOut);
  gainR.gain.linearRampToValueAtTime(0, now + duration);

  const panR = ctx.createStereoPanner();
  panR.pan.setValueAtTime(1, now);

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

  return { oscR };
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
}

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
