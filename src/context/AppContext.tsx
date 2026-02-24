'use client';

import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { AppState, AppAction } from '@/types';

const initialState: AppState = {
  mode: 'listen',
  activePreset: null,
  isPlaying: false,
  isPaused: false,
  sessionDuration: 20,
  elapsedTime: 0,
  volume: 50,
  ambientLayers: [],
  showPlayer: false,
  showMiniPlayer: false,
  onboardingComplete: false,
  selectedCategory: 'all',
  sessionComplete: false,
  toastMessage: null,
  // Mix mode
  mixConfig: null,
  showMixPlayer: false,
  mixPhase: null,
  mixPhaseProgress: 0,
  mixBeatFreq: 0,
  // Advanced mode
  advancedConfig: null,
  showAdvancedPlayer: false,
  advancedPhaseIndex: 0,
  advancedPhaseName: '',
  advancedPhaseProgress: 0,
  advancedBeatFreqs: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'SET_ACTIVE_PRESET':
      return { ...state, activePreset: action.payload };
    case 'SET_IS_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_IS_PAUSED':
      return { ...state, isPaused: action.payload };
    case 'SET_SESSION_DURATION':
      return { ...state, sessionDuration: action.payload };
    case 'SET_ELAPSED_TIME':
      return { ...state, elapsedTime: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'SET_AMBIENT_LAYERS':
      return { ...state, ambientLayers: action.payload };
    case 'SET_SHOW_PLAYER':
      return { ...state, showPlayer: action.payload };
    case 'SET_SHOW_MINI_PLAYER':
      return { ...state, showMiniPlayer: action.payload };
    case 'SET_ONBOARDING_COMPLETE':
      return { ...state, onboardingComplete: action.payload };
    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    case 'SET_SESSION_COMPLETE':
      return { ...state, sessionComplete: action.payload };
    case 'SET_TOAST':
      return { ...state, toastMessage: action.payload };
    case 'START_SESSION':
      return {
        ...state,
        activePreset: action.payload.preset,
        sessionDuration: action.payload.duration,
        isPlaying: true,
        isPaused: false,
        elapsedTime: 0,
        showPlayer: true,
        showMiniPlayer: false,
        sessionComplete: false,
      };
    case 'STOP_SESSION':
      return {
        ...state,
        isPlaying: false,
        isPaused: false,
        elapsedTime: 0,
        showPlayer: false,
        showMiniPlayer: false,
        ambientLayers: [],
        sessionComplete: false,
      };
    case 'COMPLETE_SESSION':
      return {
        ...state,
        isPlaying: false,
        isPaused: false,
        sessionComplete: true,
        showMiniPlayer: false,
      };
    // Mix mode
    case 'SET_MIX_CONFIG':
      return { ...state, mixConfig: action.payload };
    case 'SET_SHOW_MIX_PLAYER':
      return { ...state, showMixPlayer: action.payload };
    case 'SET_MIX_PHASE':
      return { ...state, mixPhase: action.payload };
    case 'SET_MIX_PHASE_PROGRESS':
      return { ...state, mixPhaseProgress: action.payload };
    case 'SET_MIX_BEAT_FREQ':
      return { ...state, mixBeatFreq: action.payload };
    case 'START_MIX_SESSION': {
      const cfg = action.payload;
      const totalMin = cfg.timeline.easeIn + cfg.timeline.deep + cfg.timeline.easeOut;
      return {
        ...state,
        mixConfig: cfg,
        sessionDuration: totalMin,
        isPlaying: true,
        isPaused: false,
        elapsedTime: 0,
        showMixPlayer: true,
        showMiniPlayer: false,
        sessionComplete: false,
        mixPhase: 'easeIn',
        mixPhaseProgress: 0,
      };
    }
    case 'STOP_MIX_SESSION':
      return {
        ...state,
        isPlaying: false,
        isPaused: false,
        elapsedTime: 0,
        showMixPlayer: false,
        showMiniPlayer: false,
        sessionComplete: false,
        mixPhase: null,
        mixPhaseProgress: 0,
      };
    case 'COMPLETE_MIX_SESSION':
      return {
        ...state,
        isPlaying: false,
        isPaused: false,
        sessionComplete: true,
        showMiniPlayer: false,
        mixPhase: null,
      };
    // Advanced mode
    case 'SET_ADVANCED_CONFIG':
      return { ...state, advancedConfig: action.payload };
    case 'SET_SHOW_ADVANCED_PLAYER':
      return { ...state, showAdvancedPlayer: action.payload };
    case 'START_ADVANCED_SESSION': {
      const cfg = action.payload;
      const totalMin = cfg.timeline.reduce((sum, p) => sum + p.duration, 0);
      return {
        ...state,
        advancedConfig: cfg,
        sessionDuration: totalMin,
        isPlaying: true,
        isPaused: false,
        elapsedTime: 0,
        showAdvancedPlayer: true,
        showMiniPlayer: false,
        sessionComplete: false,
        advancedPhaseIndex: 0,
        advancedPhaseName: cfg.timeline[0]?.name ?? '',
        advancedPhaseProgress: 0,
        advancedBeatFreqs: cfg.layers.map((l) => l.beatFreq),
      };
    }
    case 'STOP_ADVANCED_SESSION':
      return {
        ...state,
        isPlaying: false,
        isPaused: false,
        elapsedTime: 0,
        showAdvancedPlayer: false,
        showMiniPlayer: false,
        sessionComplete: false,
        advancedPhaseIndex: 0,
        advancedPhaseName: '',
        advancedPhaseProgress: 0,
        advancedBeatFreqs: [],
      };
    case 'COMPLETE_ADVANCED_SESSION':
      return {
        ...state,
        isPlaying: false,
        isPaused: false,
        sessionComplete: true,
        showMiniPlayer: false,
      };
    case 'SET_ADVANCED_PHASE':
      return {
        ...state,
        advancedPhaseIndex: action.payload.index,
        advancedPhaseName: action.payload.name,
        advancedPhaseProgress: action.payload.progress,
        advancedBeatFreqs: action.payload.beatFreqs,
      };
    default:
      return state;
  }
}

const AppContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<Dispatch<AppAction>>(() => {});

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppContext);
}

export function useAppDispatch() {
  return useContext(AppDispatchContext);
}
