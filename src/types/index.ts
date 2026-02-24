import type { AdvancedSessionConfig as _AdvancedSessionConfig } from './advanced';
export type { AdvancedWaveform, EasingType, LFOTarget, FilterType, IsochronicShape, BeatLayer, StereoConfig, LFOConfig, IsochronicConfig, FilterConfig, AdvancedTimelinePhase, AdvancedSessionConfig, SavedAdvancedSession } from './advanced';
export { createDefaultBeatLayer, createDefaultAdvancedConfig } from './advanced';

type AdvancedSessionConfig = _AdvancedSessionConfig;

export type BrainwaveState = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export type PresetCategory = 'focus' | 'sleep' | 'meditation' | 'relaxation' | 'energy' | 'therapy';

export type AppMode = 'listen' | 'mix' | 'create';

export interface Preset {
  id: string;
  name: string;
  category: PresetCategory;
  icon: string;
  description: string;
  carrierFreq: number;
  beatFreq: number;
  brainwaveState: BrainwaveState;
  brainwaveLabel: string;
  defaultDuration: number;
  fadeIn: number;
  fadeOut: number;
  color: string;
}

export interface Category {
  id: PresetCategory;
  label: string;
  icon: string;
  description: string;
}

export interface AudioEngineConfig {
  carrierFreqLeft: number;
  carrierFreqRight: number;
  masterVolume: number;
  waveform: OscillatorType;
  fadeInDuration: number;
  fadeOutDuration: number;
}

export interface AmbientLayerConfig {
  id: string;
  volume: number;
  loop: boolean;
}

export interface AmbientOption {
  id: string;
  label: string;
  icon: string;
}

export type PlayerState = 'idle' | 'pre-play' | 'playing' | 'paused' | 'complete';

export interface MixConfig {
  stateId: string;
  carrierId: string;
  ambientLayers: { id: string; volume: number }[];
  timeline: { easeIn: number; deep: number; easeOut: number };
}

export interface AppState {
  mode: AppMode;
  activePreset: Preset | null;
  isPlaying: boolean;
  isPaused: boolean;
  sessionDuration: number;
  elapsedTime: number;
  volume: number;
  ambientLayers: { id: string; volume: number }[];
  showPlayer: boolean;
  showMiniPlayer: boolean;
  onboardingComplete: boolean;
  selectedCategory: PresetCategory | 'all';
  sessionComplete: boolean;
  toastMessage: string | null;
  // Mix mode state
  mixConfig: MixConfig | null;
  showMixPlayer: boolean;
  mixPhase: 'easeIn' | 'deep' | 'easeOut' | null;
  mixPhaseProgress: number;
  mixBeatFreq: number;
  // Advanced mode state
  advancedConfig: AdvancedSessionConfig | null;
  showAdvancedPlayer: boolean;
  advancedPhaseIndex: number;
  advancedPhaseName: string;
  advancedPhaseProgress: number;
  advancedBeatFreqs: number[];
}

export type AppAction =
  | { type: 'SET_MODE'; payload: AppMode }
  | { type: 'SET_ACTIVE_PRESET'; payload: Preset | null }
  | { type: 'SET_IS_PLAYING'; payload: boolean }
  | { type: 'SET_IS_PAUSED'; payload: boolean }
  | { type: 'SET_SESSION_DURATION'; payload: number }
  | { type: 'SET_ELAPSED_TIME'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_AMBIENT_LAYERS'; payload: { id: string; volume: number }[] }
  | { type: 'SET_SHOW_PLAYER'; payload: boolean }
  | { type: 'SET_SHOW_MINI_PLAYER'; payload: boolean }
  | { type: 'SET_ONBOARDING_COMPLETE'; payload: boolean }
  | { type: 'SET_SELECTED_CATEGORY'; payload: PresetCategory | 'all' }
  | { type: 'SET_SESSION_COMPLETE'; payload: boolean }
  | { type: 'SET_TOAST'; payload: string | null }
  | { type: 'START_SESSION'; payload: { preset: Preset; duration: number } }
  | { type: 'STOP_SESSION' }
  | { type: 'COMPLETE_SESSION' }
  // Mix mode actions
  | { type: 'SET_MIX_CONFIG'; payload: MixConfig | null }
  | { type: 'SET_SHOW_MIX_PLAYER'; payload: boolean }
  | { type: 'SET_MIX_PHASE'; payload: 'easeIn' | 'deep' | 'easeOut' | null }
  | { type: 'SET_MIX_PHASE_PROGRESS'; payload: number }
  | { type: 'SET_MIX_BEAT_FREQ'; payload: number }
  | { type: 'START_MIX_SESSION'; payload: MixConfig }
  | { type: 'STOP_MIX_SESSION' }
  | { type: 'COMPLETE_MIX_SESSION' }
  // Advanced mode actions
  | { type: 'SET_ADVANCED_CONFIG'; payload: AdvancedSessionConfig | null }
  | { type: 'SET_SHOW_ADVANCED_PLAYER'; payload: boolean }
  | { type: 'START_ADVANCED_SESSION'; payload: AdvancedSessionConfig }
  | { type: 'STOP_ADVANCED_SESSION' }
  | { type: 'COMPLETE_ADVANCED_SESSION' }
  | { type: 'SET_ADVANCED_PHASE'; payload: { index: number; name: string; progress: number; beatFreqs: number[] } };
