'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { AudioEngine } from '@/lib/audio-engine';
import type { AudioEngineConfig, BeatLayer, FilterConfig, LFOConfig, IsochronicConfig, AdvancedSessionConfig } from '@/types';
import { VOLUME_HARD_CAP } from '@/lib/constants';

export interface UseAudioEngineReturn {
  isPlaying: boolean;
  isPaused: boolean;
  isInitialized: boolean;
  currentTime: number;
  play: (config: AudioEngineConfig) => Promise<void>;
  stop: () => void;
  stopWithLongFade: () => void;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  setVolume: (volume: number) => void;
  setFrequency: (left: number, right: number) => void;
  // Legacy single-ambient (Easy mode)
  addAmbient: (id: string, volume: number) => Promise<void>;
  removeAmbient: () => void;
  setAmbientVolume: (volume: number) => void;
  // Multi-ambient (Mix mode)
  addAmbientLayer: (id: string, volume: number) => void;
  removeAmbientLayer: (id: string) => void;
  setAmbientLayerVolume: (id: string, volume: number) => void;
  stopAllAmbientLayers: () => void;
  // Preview & misc
  previewTone: (frequency: number) => Promise<void>;
  init: () => Promise<void>;
  playCompletionChime: () => Promise<void>;
  getElapsedTime: () => number;
  getEngine: () => AudioEngine;
  // Background audio
  resumeFromBackground: () => Promise<void>;
  setupMediaSession: (title: string, category: string, callbacks: {
    onPause?: () => void;
    onResume?: () => void;
    onStop?: () => void;
  }, artwork?: MediaImage[]) => void;
  // Preview mode (live audio in builder)
  startPreview: (config: AdvancedSessionConfig) => Promise<void>;
  stopPreview: () => void;
  isPreviewMode: boolean;
  // Advanced mode
  playAdvanced: (layers: BeatLayer[]) => Promise<void>;
  stopAdvanced: () => void;
  setBeatLayerFrequency: (id: string, carrier: number, beat: number) => void;
  setBeatLayerVolume: (id: string, volume: number) => void;
  setBeatLayerWaveform: (id: string, waveform: OscillatorType) => void;
  addBeatLayer: (layer: BeatLayer) => void;
  removeBeatLayer: (id: string) => void;
  enableFilter: (config: FilterConfig) => void;
  updateFilter: (config: FilterConfig) => void;
  disableFilter: () => void;
  enableLFO: (config: LFOConfig) => void;
  updateLFO: (config: LFOConfig) => void;
  disableLFO: () => void;
  enableIsochronic: (config: IsochronicConfig) => void;
  updateIsochronic: (config: IsochronicConfig) => void;
  disableIsochronic: () => void;
  setStereoWidth: (width: number) => void;
  setStereoOffset: (pan: number) => void;
  setCrossfeed: (amount: number) => void;
  enableSpatialRotation: (speed: number) => void;
  disableSpatialRotation: () => void;
}

export function useAudioEngine(): UseAudioEngineReturn {
  const engineRef = useRef<AudioEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
    }
    return engineRef.current;
  }, []);

  const init = useCallback(async () => {
    const engine = getEngine();
    await engine.init();
    setIsInitialized(true);
  }, [getEngine]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const engine = engineRef.current;
      if (engine) {
        setCurrentTime(engine.getElapsedTime());
      }
    }, 1000);
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const play = useCallback(async (config: AudioEngineConfig) => {
    const engine = getEngine();
    if (!engine.isInitialized) await engine.init();
    await engine.play(config);
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentTime(0);
    startPolling();
  }, [getEngine, startPolling]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    stopPolling();
    setTimeout(() => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentTime(0);
    }, 1600);
  }, [stopPolling]);

  const stopWithLongFade = useCallback(() => {
    engineRef.current?.stopWithLongFade();
    stopPolling();
    setTimeout(() => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentTime(0);
    }, 3200);
  }, [stopPolling]);

  const pause = useCallback(async () => {
    await engineRef.current?.pause();
    stopPolling();
    setIsPaused(true);
  }, [stopPolling]);

  const resume = useCallback(async () => {
    await engineRef.current?.resume();
    startPolling();
    setIsPaused(false);
  }, [startPolling]);

  const setVolume = useCallback((volume: number) => {
    const engineVol = (volume / 100) * VOLUME_HARD_CAP;
    engineRef.current?.setMasterVolume(engineVol);
  }, []);

  const setFrequency = useCallback((left: number, right: number) => {
    engineRef.current?.setCarrierFrequency(left, right);
  }, []);

  // Legacy single-ambient
  const addAmbient = useCallback(async (id: string, volume: number) => {
    const vol = volume / 100;
    await engineRef.current?.startAmbientLayer({ id, volume: vol, loop: true });
  }, []);

  const removeAmbient = useCallback(() => {
    engineRef.current?.stopAmbientLayer();
  }, []);

  const setAmbientVolume = useCallback((volume: number) => {
    const vol = volume / 100;
    engineRef.current?.setAmbientVolume(vol);
  }, []);

  // Multi-ambient
  const addAmbientLayer = useCallback((id: string, volume: number) => {
    const vol = volume / 100;
    engineRef.current?.startAmbientLayerById(id, vol);
  }, []);

  const removeAmbientLayer = useCallback((id: string) => {
    engineRef.current?.stopAmbientLayerById(id);
  }, []);

  const setAmbientLayerVolume = useCallback((id: string, volume: number) => {
    const vol = volume / 100;
    engineRef.current?.setAmbientLayerVolume(id, vol);
  }, []);

  const stopAllAmbientLayers = useCallback(() => {
    engineRef.current?.stopAllAmbientLayers();
  }, []);

  // Preview
  const previewTone = useCallback(async (frequency: number) => {
    const engine = getEngine();
    if (!engine.isInitialized) await engine.init();
    await engine.previewTone(frequency);
  }, [getEngine]);

  const playCompletionChime = useCallback(async () => {
    await engineRef.current?.playCompletionChime();
  }, []);

  const getElapsedTime = useCallback(() => {
    return engineRef.current?.getElapsedTime() ?? 0;
  }, []);

  // ─── Advanced mode wrappers ───

  const playAdvanced = useCallback(async (layers: BeatLayer[]) => {
    const engine = getEngine();
    if (!engine.isInitialized) await engine.init();
    await engine.playAdvanced(layers);
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentTime(0);
    startPolling();
  }, [getEngine, startPolling]);

  const stopAdvanced = useCallback(() => {
    engineRef.current?.stopAdvanced();
    stopPolling();
    setTimeout(() => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentTime(0);
    }, 2000);
  }, [stopPolling]);

  // ─── Preview mode wrappers ───

  const startPreview = useCallback(async (config: AdvancedSessionConfig) => {
    const engine = getEngine();
    if (!engine.isInitialized) await engine.init();
    await engine.startPreview(config);
    setIsPlaying(true);
    setIsPaused(false);
    setIsInitialized(true);
  }, [getEngine]);

  const stopPreview = useCallback(() => {
    engineRef.current?.stopPreview();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const isPreviewMode = engineRef.current?.isPreviewMode ?? false;

  const setBeatLayerFrequency = useCallback((id: string, carrier: number, beat: number) => {
    engineRef.current?.setBeatLayerFrequency(id, carrier, beat);
  }, []);

  const setBeatLayerVolume = useCallback((id: string, volume: number) => {
    engineRef.current?.setBeatLayerVolume(id, volume);
  }, []);

  const setBeatLayerWaveform = useCallback((id: string, waveform: OscillatorType) => {
    engineRef.current?.setBeatLayerWaveform(id, waveform);
  }, []);

  const addBeatLayer = useCallback((layer: BeatLayer) => {
    engineRef.current?.addBeatLayer(layer);
  }, []);

  const removeBeatLayer = useCallback((id: string) => {
    engineRef.current?.removeBeatLayer(id);
  }, []);

  const enableFilter = useCallback((config: FilterConfig) => {
    engineRef.current?.enableFilter(config);
  }, []);

  const updateFilter = useCallback((config: FilterConfig) => {
    engineRef.current?.updateFilter(config);
  }, []);

  const disableFilter = useCallback(() => {
    engineRef.current?.disableFilter();
  }, []);

  const enableLFO = useCallback((config: LFOConfig) => {
    engineRef.current?.enableLFO(config);
  }, []);

  const updateLFO = useCallback((config: LFOConfig) => {
    engineRef.current?.updateLFO(config);
  }, []);

  const disableLFO = useCallback(() => {
    engineRef.current?.disableLFO();
  }, []);

  const enableIsochronic = useCallback((config: IsochronicConfig) => {
    engineRef.current?.enableIsochronic(config);
  }, []);

  const updateIsochronic = useCallback((config: IsochronicConfig) => {
    engineRef.current?.updateIsochronic(config);
  }, []);

  const disableIsochronic = useCallback(() => {
    engineRef.current?.disableIsochronic();
  }, []);

  const setStereoWidth = useCallback((width: number) => {
    engineRef.current?.setStereoWidth(width);
  }, []);

  const setStereoOffset = useCallback((pan: number) => {
    engineRef.current?.setStereoOffset(pan);
  }, []);

  const setCrossfeed = useCallback((amount: number) => {
    engineRef.current?.setCrossfeed(amount);
  }, []);

  const enableSpatialRotation = useCallback((speed: number) => {
    engineRef.current?.enableSpatialRotation(speed);
  }, []);

  const disableSpatialRotation = useCallback(() => {
    engineRef.current?.disableSpatialRotation();
  }, []);

  const resumeFromBackground = useCallback(async () => {
    await engineRef.current?.resumeFromBackground();
  }, []);

  const setupMediaSession = useCallback((title: string, category: string, callbacks: {
    onPause?: () => void;
    onResume?: () => void;
    onStop?: () => void;
  }, artwork?: MediaImage[]) => {
    engineRef.current?.setupMediaSession(title, category, callbacks, artwork);
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [stopPolling]);

  return {
    isPlaying,
    isPaused,
    isInitialized,
    currentTime,
    play,
    stop,
    stopWithLongFade,
    pause,
    resume,
    setVolume,
    setFrequency,
    addAmbient,
    removeAmbient,
    setAmbientVolume,
    addAmbientLayer,
    removeAmbientLayer,
    setAmbientLayerVolume,
    stopAllAmbientLayers,
    previewTone,
    init,
    playCompletionChime,
    getElapsedTime,
    getEngine,
    resumeFromBackground,
    setupMediaSession,
    // Preview mode
    startPreview,
    stopPreview,
    isPreviewMode,
    // Advanced mode
    playAdvanced,
    stopAdvanced,
    setBeatLayerFrequency,
    setBeatLayerVolume,
    setBeatLayerWaveform,
    addBeatLayer,
    removeBeatLayer,
    enableFilter,
    updateFilter,
    disableFilter,
    enableLFO,
    updateLFO,
    disableLFO,
    enableIsochronic,
    updateIsochronic,
    disableIsochronic,
    setStereoWidth,
    setStereoOffset,
    setCrossfeed,
    enableSpatialRotation,
    disableSpatialRotation,
  };
}
