export type AdvancedWaveform = 'sine' | 'triangle' | 'sawtooth' | 'square';

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'step';

export type LFOTarget = 'volume' | 'pitch' | 'filter' | 'pan';

export type FilterType = 'lowpass' | 'highpass' | 'bandpass';

export type IsochronicShape = 'sharp' | 'soft' | 'ramp';

export interface BeatLayer {
  id: string;
  carrierFreq: number;
  beatFreq: number;
  waveform: AdvancedWaveform;
  volume: number; // 0–100
}

export interface StereoConfig {
  enabled: boolean;
  width: number;        // 0–100 (%)
  pan: number;          // -100 to +100
  crossfeed: number;    // 0–50 (%)
  rotation: boolean;
  rotationSpeed: number; // Hz
}

export interface LFOConfig {
  enabled: boolean;
  target: LFOTarget;
  rate: number;     // Hz (0.01–10)
  depth: number;    // 0–100 (%)
  shape: AdvancedWaveform;
}

export interface IsochronicConfig {
  enabled: boolean;
  pulseRate: number;    // Hz (0.5–50)
  toneFreq: number;     // Hz (200–2000)
  shape: IsochronicShape;
  volume: number;        // 0–100
}

export interface FilterConfig {
  enabled: boolean;
  type: FilterType;
  frequency: number;  // Hz (20–20000)
  resonance: number;  // 0–100 (mapped to Q 0.1–20)
}

export interface AdvancedTimelinePhase {
  id: string;
  name: string;
  duration: number;    // minutes
  beatFreq: number;    // Hz — target beat frequency for this phase
  easing: EasingType;
}

export interface AdvancedSessionConfig {
  layers: BeatLayer[];
  filter: FilterConfig;
  lfo: LFOConfig;
  isochronic: IsochronicConfig;
  stereo: StereoConfig;
  ambientLayers: { id: string; volume: number }[];
  timeline: AdvancedTimelinePhase[];
}

export interface SavedAdvancedSession {
  id: string;
  name: string;
  createdAt: string;
  config: AdvancedSessionConfig;
}

export function createDefaultBeatLayer(index = 0): BeatLayer {
  return {
    id: `layer-${Date.now().toString(36)}-${index}`,
    carrierFreq: 200,
    beatFreq: 10,
    waveform: 'sine',
    volume: 80,
  };
}

export function createDefaultAdvancedConfig(): AdvancedSessionConfig {
  return {
    layers: [createDefaultBeatLayer(0)],
    filter: {
      enabled: false,
      type: 'lowpass',
      frequency: 2000,
      resonance: 25,
    },
    lfo: {
      enabled: false,
      target: 'volume',
      rate: 0.5,
      depth: 50,
      shape: 'sine',
    },
    isochronic: {
      enabled: false,
      pulseRate: 10,
      toneFreq: 400,
      shape: 'sharp',
      volume: 60,
    },
    stereo: {
      enabled: false,
      width: 100,
      pan: 0,
      crossfeed: 0,
      rotation: false,
      rotationSpeed: 0.1,
    },
    ambientLayers: [],
    timeline: [
      {
        id: 'phase-default',
        name: 'Main',
        duration: 20,
        beatFreq: 10,
        easing: 'linear',
      },
    ],
  };
}
