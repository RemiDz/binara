'use client';

import { useAppState, useAppDispatch } from '@/context/AppContext';
import { useProContext } from '@/context/ProContext';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import Background from './Background';
import Header from './Header';
import ModeSwitcher from './ModeSwitcher';
import CategoryFilter from './CategoryFilter';
import PresetGrid from './PresetGrid';
import PlayerView from './PlayerView';
import MiniPlayer from './MiniPlayer';
import SessionComplete from './SessionComplete';
import Onboarding from './Onboarding';
import Toast from './Toast';
import HeadphoneBanner from './HeadphoneBanner';
import InstallBanner from './InstallBanner';
import MixBuilder from './mix/MixBuilder';
import MixPlayer from './mix/MixPlayer';
import AdvancedBuilder from './advanced/AdvancedBuilder';
import AdvancedPlayer from './advanced/AdvancedPlayer';
import SensorUpsell from './SensorUpsell';
import ProUpgrade from './ProUpgrade';
import { SensorEngine } from '@/lib/sensor-engine';
import { getBrainwaveState } from '@/lib/brainwave-states';
import { getCarrierTone } from '@/lib/carrier-tones';
import { buildTimeline, TimelineRunner } from '@/lib/session-timeline';
import { AdvancedTimelineRunner } from '@/lib/advanced-timeline';
import { getSharedSessionFromURL } from '@/lib/sharing';
import { getMediaArtwork } from '@/lib/media-artwork';
import { trackEvent } from '@/lib/analytics';
import type { MixConfig, AdvancedSessionConfig } from '@/types';

export default function App() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { activate } = useProContext();
  const audio = useAudioEngine();
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timelineRunnerRef = useRef<TimelineRunner | null>(null);
  const advancedTimelineRunnerRef = useRef<AdvancedTimelineRunner | null>(null);

  // Sensor modulation state (Listen mode)
  const [sensorUpsellOpen, setSensorUpsellOpen] = useState(false);
  const [proUpgradeOpen, setProUpgradeOpen] = useState(false);
  const [listenSensorActive, setListenSensorActive] = useState(false);
  const sensorEngineRef = useRef<SensorEngine | null>(null);
  const sensorRafRef = useRef<number>(0);
  const overtoneActiveRef = useRef(false);
  const stillStartRef = useRef<number>(0);

  // Check onboarding status on mount
  useEffect(() => {
    const done = localStorage.getItem('binara_onboarding_complete');
    if (done === 'true') {
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
    }
  }, [dispatch]);

  // URL-based licence activation (?licence_key=XXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('licence_key');
    if (key) {
      activate(key).then((result) => {
        if (result.success) {
          trackEvent('Pro Activated', { source: 'url' });
          dispatch({ type: 'SET_TOAST', payload: 'Pro activated! All features unlocked.' });
        } else {
          dispatch({ type: 'SET_TOAST', payload: result.error ?? 'Licence activation failed' });
        }
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      });
    }
  }, [activate, dispatch]);

  // Shared session loading (#s=... in URL hash)
  useEffect(() => {
    const shared = getSharedSessionFromURL();
    if (!shared) return;

    // Clean URL hash
    window.history.replaceState({}, '', window.location.pathname + window.location.search);

    if (shared.type === 'mix') {
      dispatch({ type: 'SET_MODE', payload: 'mix' });
      handleStartMixSession(shared.config);
      dispatch({ type: 'SET_TOAST', payload: 'Shared session loaded!' });
    } else if (shared.type === 'advanced') {
      dispatch({ type: 'SET_MODE', payload: 'create' });
      handleStartAdvancedSession(shared.config);
      dispatch({ type: 'SET_TOAST', payload: 'Shared session loaded!' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Session timer: track elapsed time via polling (Listen mode)
  useEffect(() => {
    if (state.isPlaying && !state.isPaused && !state.showMixPlayer) {
      sessionTimerRef.current = setInterval(() => {
        const elapsed = audio.getElapsedTime();
        dispatch({ type: 'SET_ELAPSED_TIME', payload: elapsed });

        // Check session completion
        const durationSecs = state.sessionDuration * 60;
        if (elapsed >= durationSecs) {
          handleSessionComplete();
        }
      }, 1000);
    } else if (!state.showMixPlayer) {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    }
    return () => {
      if (sessionTimerRef.current && !state.showMixPlayer) {
        clearInterval(sessionTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isPlaying, state.isPaused, state.sessionDuration, state.showMixPlayer]);

  // Mix mode timer: track elapsed time + run timeline
  useEffect(() => {
    if (state.isPlaying && !state.isPaused && state.showMixPlayer) {
      sessionTimerRef.current = setInterval(() => {
        const elapsed = audio.getElapsedTime();
        dispatch({ type: 'SET_ELAPSED_TIME', payload: elapsed });

        // Run timeline tick
        const runner = timelineRunnerRef.current;
        if (runner) {
          const result = runner.tick(elapsed);
          dispatch({ type: 'SET_MIX_PHASE', payload: result.currentPhase });
          dispatch({ type: 'SET_MIX_PHASE_PROGRESS', payload: result.phaseProgress });
          dispatch({ type: 'SET_MIX_BEAT_FREQ', payload: result.currentBeatFreq });

          if (result.isComplete) {
            handleMixSessionComplete();
          }
        }
      }, 1000);
    } else if (state.showMixPlayer) {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    }
    return () => {
      if (sessionTimerRef.current && state.showMixPlayer) {
        clearInterval(sessionTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isPlaying, state.isPaused, state.showMixPlayer]);

  // ─── Listen mode sensor modulation ───

  const stopListenSensors = useCallback(() => {
    // Cancel rAF loop
    if (sensorRafRef.current) {
      cancelAnimationFrame(sensorRafRef.current);
      sensorRafRef.current = 0;
    }

    // Stop sensor engine
    sensorEngineRef.current?.stop();

    // Reset audio modulations
    audio.setChannelBalance(0);
    if (state.activePreset) {
      const base = state.activePreset.carrierFreq;
      audio.setFrequency(base, base + state.activePreset.beatFreq);
    }
    if (overtoneActiveRef.current) {
      audio.removeOvertoneLayer();
      overtoneActiveRef.current = false;
    }
    stillStartRef.current = 0;
    setListenSensorActive(false);
  }, [audio, state.activePreset]);

  const handleListenSensorToggle = useCallback(async () => {
    if (listenSensorActive) {
      stopListenSensors();
      return;
    }

    // Create/reuse sensor engine
    if (!sensorEngineRef.current) {
      sensorEngineRef.current = new SensorEngine();
    }
    const engine = sensorEngineRef.current;

    const granted = await engine.requestPermission();
    if (!granted) return;

    engine.start();
    setListenSensorActive(true);
    stillStartRef.current = 0;
    overtoneActiveRef.current = false;

    // Modulation loop via rAF
    const loop = () => {
      const s = engine.getState();
      if (!s.active) return;

      const preset = state.activePreset;
      if (!preset) return;

      // 1. Stereo balance from roll (left/right tilt)
      const balance = Math.max(-1, Math.min(1, s.roll / 45));
      audio.setChannelBalance(balance);

      // 2. Carrier freq shift from pitch (forward/back tilt)
      const freqShift = (Math.max(-30, Math.min(30, s.pitch)) / 30) * 5;
      const base = preset.carrierFreq;
      audio.setFrequency(base + freqShift, base + preset.beatFreq + freqShift);

      // 3. Stillness → overtone layer
      if (s.isStill) {
        if (stillStartRef.current === 0) stillStartRef.current = Date.now();
        const stillDuration = (Date.now() - stillStartRef.current) / 1000;
        if (stillDuration > 10 && !overtoneActiveRef.current) {
          audio.addOvertoneLayer();
          overtoneActiveRef.current = true;
        }
      } else {
        stillStartRef.current = 0;
        if (overtoneActiveRef.current) {
          audio.removeOvertoneLayer();
          overtoneActiveRef.current = false;
        }
      }

      sensorRafRef.current = requestAnimationFrame(loop);
    };

    sensorRafRef.current = requestAnimationFrame(loop);
  }, [audio, state.activePreset, listenSensorActive, stopListenSensors]);

  // ─── Listen mode handlers ───

  const handleSessionComplete = useCallback(async () => {
    trackEvent('Session Complete', { mode: 'easy', duration: state.sessionDuration, preset: state.activePreset?.name ?? '' });
    const count = parseInt(localStorage.getItem('binara_sessions_count') || '0');
    localStorage.setItem('binara_sessions_count', String(count + 1));
    stopListenSensors();
    audio.stopWithLongFade();
    audio.stopAllAmbientLayers();
    await audio.playCompletionChime();
    dispatch({ type: 'COMPLETE_SESSION' });
  }, [audio, dispatch, state.sessionDuration, state.activePreset, stopListenSensors]);

  const handlePlay = useCallback(async () => {
    if (!state.activePreset) return;
    const preset = state.activePreset;
    trackEvent('Session Start', { mode: 'easy' });
    await audio.play({
      carrierFreqLeft: preset.carrierFreq,
      carrierFreqRight: preset.carrierFreq + preset.beatFreq,
      masterVolume: state.volume / 100 * 0.3,
      waveform: 'sine',
      fadeInDuration: preset.fadeIn,
      fadeOutDuration: preset.fadeOut,
    });
    audio.setVolume(state.volume);
    dispatch({ type: 'SET_IS_PLAYING', payload: true });
    dispatch({ type: 'SET_IS_PAUSED', payload: false });
    dispatch({ type: 'SET_ELAPSED_TIME', payload: 0 });
    dispatch({ type: 'SET_SESSION_COMPLETE', payload: false });
  }, [state.activePreset, state.volume, audio, dispatch]);

  const handleStop = useCallback(() => {
    trackEvent('Session Abandon', { mode: 'easy', elapsed: state.elapsedTime, total: state.sessionDuration * 60 });
    stopListenSensors();
    audio.stop();
    audio.stopAllAmbientLayers();
    setTimeout(() => {
      dispatch({ type: 'STOP_SESSION' });
    }, 1600);
  }, [audio, dispatch, stopListenSensors]);

  const handlePause = useCallback(async () => {
    await audio.pause();
    dispatch({ type: 'SET_IS_PAUSED', payload: true });
  }, [audio, dispatch]);

  const handleResume = useCallback(async () => {
    await audio.resume();
    dispatch({ type: 'SET_IS_PAUSED', payload: false });
  }, [audio, dispatch]);

  const handleVolumeChange = useCallback((vol: number) => {
    dispatch({ type: 'SET_VOLUME', payload: vol });
    audio.setVolume(vol);
  }, [audio, dispatch]);

  const handleToggleAmbient = useCallback((id: string) => {
    const exists = state.ambientLayers.find((l) => l.id === id);
    if (exists) {
      // Remove layer
      audio.removeAmbientLayer(id);
      const updated = state.ambientLayers.filter((l) => l.id !== id);
      dispatch({ type: 'SET_AMBIENT_LAYERS', payload: updated });
    } else {
      // Add layer
      const volume = 50;
      audio.addAmbientLayer(id, volume);
      const updated = [...state.ambientLayers, { id, volume }];
      dispatch({ type: 'SET_AMBIENT_LAYERS', payload: updated });
    }
  }, [audio, state.ambientLayers, dispatch]);

  const handleUpdateLayerVolume = useCallback((id: string, volume: number) => {
    audio.setAmbientLayerVolume(id, volume);
    const updated = state.ambientLayers.map((l) => l.id === id ? { ...l, volume } : l);
    dispatch({ type: 'SET_AMBIENT_LAYERS', payload: updated });
  }, [audio, state.ambientLayers, dispatch]);

  const handleRemoveLayer = useCallback((id: string) => {
    audio.removeAmbientLayer(id);
    const updated = state.ambientLayers.filter((l) => l.id !== id);
    dispatch({ type: 'SET_AMBIENT_LAYERS', payload: updated });
  }, [audio, state.ambientLayers, dispatch]);

  const handleClearAmbient = useCallback(() => {
    audio.stopAllAmbientLayers();
    dispatch({ type: 'SET_AMBIENT_LAYERS', payload: [] });
  }, [audio, dispatch]);

  const handleBackFromPlayer = useCallback(() => {
    dispatch({ type: 'SET_SHOW_PLAYER', payload: false });
    if (state.isPlaying) {
      dispatch({ type: 'SET_SHOW_MINI_PLAYER', payload: true });
    }
  }, [dispatch, state.isPlaying]);

  const handleMiniPlayerTap = useCallback(() => {
    if (state.advancedConfig && state.isPlaying) {
      // Advanced mode — return to advanced player
      dispatch({ type: 'SET_SHOW_ADVANCED_PLAYER', payload: true });
      dispatch({ type: 'SET_SHOW_MINI_PLAYER', payload: false });
    } else if (state.showMixPlayer || state.mixConfig) {
      // Mix mode — return to mix player
      dispatch({ type: 'SET_SHOW_MIX_PLAYER', payload: true });
      dispatch({ type: 'SET_SHOW_MINI_PLAYER', payload: false });
    } else {
      dispatch({ type: 'SET_SHOW_PLAYER', payload: true });
      dispatch({ type: 'SET_SHOW_MINI_PLAYER', payload: false });
    }
  }, [dispatch, state.showMixPlayer, state.mixConfig, state.advancedConfig, state.isPlaying]);

  const handlePlayAgain = useCallback(async () => {
    dispatch({ type: 'SET_SESSION_COMPLETE', payload: false });
    dispatch({ type: 'SET_ELAPSED_TIME', payload: 0 });
    await handlePlay();
  }, [dispatch, handlePlay]);

  const handleChooseAnother = useCallback(() => {
    dispatch({ type: 'STOP_SESSION' });
  }, [dispatch]);

  const handleInitAudio = useCallback(async () => {
    await audio.init();
  }, [audio]);

  // ─── Mix mode handlers ───

  const handleStartMixSession = useCallback(async (config: MixConfig) => {
    const bwState = getBrainwaveState(config.stateId);
    const carrier = getCarrierTone(config.carrierId);
    if (!bwState || !carrier) return;
    trackEvent('Session Start', { mode: 'mix' });

    // Build timeline
    const timeline = buildTimeline(
      bwState.beatFreq,
      carrier.frequency,
      config.timeline.easeIn,
      config.timeline.deep,
      config.timeline.easeOut,
    );

    // Start audio engine with initial freq (10 Hz alpha for ease-in start)
    const startBeatFreq = timeline.phases[0].startBeatFreq;
    await audio.play({
      carrierFreqLeft: carrier.frequency,
      carrierFreqRight: carrier.frequency + startBeatFreq,
      masterVolume: state.volume / 100 * 0.3,
      waveform: 'sine',
      fadeInDuration: 3,
      fadeOutDuration: 3,
    });
    audio.setVolume(state.volume);

    // Start ambient layers
    for (const layer of config.ambientLayers) {
      audio.addAmbientLayer(layer.id, layer.volume);
    }

    // Create timeline runner
    const engine = audio.getEngine();
    timelineRunnerRef.current = new TimelineRunner(timeline, engine);

    dispatch({ type: 'START_MIX_SESSION', payload: config });
  }, [audio, state.volume, dispatch]);

  const handleMixSessionComplete = useCallback(async () => {
    const totalMin = state.mixConfig ? state.mixConfig.timeline.easeIn + state.mixConfig.timeline.deep + state.mixConfig.timeline.easeOut : 0;
    trackEvent('Session Complete', { mode: 'mix', duration: totalMin });
    audio.stopWithLongFade();
    await audio.playCompletionChime();
    timelineRunnerRef.current = null;
    dispatch({ type: 'COMPLETE_MIX_SESSION' });
  }, [audio, dispatch, state.mixConfig]);

  const handleStopMixSession = useCallback(() => {
    trackEvent('Session Abandon', { mode: 'mix', elapsed: state.elapsedTime, total: state.sessionDuration * 60 });
    audio.stop();
    audio.stopAllAmbientLayers();
    timelineRunnerRef.current = null;
    setTimeout(() => {
      dispatch({ type: 'STOP_MIX_SESSION' });
    }, 1600);
  }, [audio, dispatch]);

  const handleBackFromMixPlayer = useCallback(() => {
    dispatch({ type: 'SET_SHOW_MIX_PLAYER', payload: false });
    if (state.isPlaying) {
      dispatch({ type: 'SET_SHOW_MINI_PLAYER', payload: true });
    }
  }, [dispatch, state.isPlaying]);

  const handleMixPlayAgain = useCallback(async () => {
    if (state.mixConfig) {
      dispatch({ type: 'SET_SESSION_COMPLETE', payload: false });
      await handleStartMixSession(state.mixConfig);
    }
  }, [dispatch, state.mixConfig, handleStartMixSession]);

  const handleMixChooseAnother = useCallback(() => {
    dispatch({ type: 'STOP_MIX_SESSION' });
  }, [dispatch]);

  const handleMixLimitReached = useCallback((message: string) => {
    dispatch({ type: 'SET_TOAST', payload: message });
  }, [dispatch]);

  const handlePreviewTone = useCallback(async (frequency: number) => {
    await audio.previewTone(frequency);
  }, [audio]);

  // ─── Advanced mode handlers ───

  const previewActiveRef = useRef(false);

  const handleStartPreview = useCallback(async (config: AdvancedSessionConfig) => {
    await audio.startPreview(config);
    previewActiveRef.current = true;
  }, [audio]);

  const handleStopPreview = useCallback(() => {
    previewActiveRef.current = false;
    audio.stopPreview();
  }, [audio]);

  const handleStartAdvancedSession = useCallback(async (config: AdvancedSessionConfig) => {
    trackEvent('Session Start', { mode: 'advanced' });

    const engine = audio.getEngine();

    if (previewActiveRef.current) {
      // Seamless transition from preview — audio continues uninterrupted
      previewActiveRef.current = false;
      engine.transitionFromPreview();
    } else {
      // Full audio startup (no preview was active)
      await audio.playAdvanced(config.layers);
      audio.setVolume(state.volume);

      // Enable filter if configured
      if (config.filter.enabled) {
        audio.enableFilter(config.filter);
      }

      // Enable stereo if configured
      if (config.stereo.enabled) {
        audio.setStereoWidth(config.stereo.width);
        audio.setStereoOffset(config.stereo.pan);
        if (config.stereo.crossfeed > 0) {
          audio.setCrossfeed(config.stereo.crossfeed);
        }
        if (config.stereo.rotation) {
          audio.enableSpatialRotation(config.stereo.rotationSpeed);
        }
      }

      // Enable LFO if configured
      if (config.lfo.enabled) {
        audio.enableLFO(config.lfo);
      }

      // Enable isochronic if configured
      if (config.isochronic.enabled) {
        audio.enableIsochronic(config.isochronic);
      }

      // Start ambient layers
      for (const layer of config.ambientLayers) {
        audio.addAmbientLayer(layer.id, layer.volume);
      }
    }

    // Create timeline runner
    advancedTimelineRunnerRef.current = new AdvancedTimelineRunner(config, engine);

    dispatch({ type: 'START_ADVANCED_SESSION', payload: config });
  }, [audio, state.volume, dispatch]);

  const handleAdvancedSessionComplete = useCallback(async () => {
    const totalMin = state.advancedConfig ? state.advancedConfig.timeline.reduce((sum, p) => sum + p.duration, 0) : 0;
    trackEvent('Session Complete', { mode: 'advanced', duration: totalMin });
    audio.stopAdvanced();
    audio.stopAllAmbientLayers();
    await audio.playCompletionChime();
    advancedTimelineRunnerRef.current = null;
    dispatch({ type: 'COMPLETE_ADVANCED_SESSION' });
  }, [audio, dispatch, state.advancedConfig]);

  const handleStopAdvancedSession = useCallback(() => {
    trackEvent('Session Abandon', { mode: 'advanced', elapsed: state.elapsedTime, total: state.sessionDuration * 60 });
    audio.stopAdvanced();
    audio.stopAllAmbientLayers();
    advancedTimelineRunnerRef.current = null;
    setTimeout(() => {
      dispatch({ type: 'STOP_ADVANCED_SESSION' });
    }, 2000);
  }, [audio, dispatch]);

  const handleBackFromAdvancedPlayer = useCallback(() => {
    dispatch({ type: 'SET_SHOW_ADVANCED_PLAYER', payload: false });
    if (state.isPlaying) {
      dispatch({ type: 'SET_SHOW_MINI_PLAYER', payload: true });
    }
  }, [dispatch, state.isPlaying]);

  const handleAdvancedPlayAgain = useCallback(async () => {
    if (state.advancedConfig) {
      dispatch({ type: 'SET_SESSION_COMPLETE', payload: false });
      await handleStartAdvancedSession(state.advancedConfig);
    }
  }, [dispatch, state.advancedConfig, handleStartAdvancedSession]);

  const handleAdvancedChooseAnother = useCallback(() => {
    dispatch({ type: 'STOP_ADVANCED_SESSION' });
  }, [dispatch]);

  const handleAdvancedLimitReached = useCallback((message: string) => {
    dispatch({ type: 'SET_TOAST', payload: message });
  }, [dispatch]);

  // ─── Sensor → Audio callbacks (Mix/Advanced) ───

  const handleMixSensorFrequencyChange = useCallback((freq: number) => {
    if (!state.mixConfig) return;
    const carrier = getCarrierTone(state.mixConfig.carrierId);
    if (!carrier) return;
    audio.setFrequency(carrier.frequency, carrier.frequency + freq);
  }, [audio, state.mixConfig]);

  const handleAdvancedSensorFrequencyChange = useCallback((freq: number) => {
    if (!state.advancedConfig) return;
    // Update all beat layers with the sensor-driven beat frequency
    for (const layer of state.advancedConfig.layers) {
      audio.setBeatLayerFrequency(layer.id, layer.carrierFreq, freq);
    }
  }, [audio, state.advancedConfig]);

  const handleAdvancedSensorStereoWidthChange = useCallback((width: number) => {
    audio.setStereoWidth(width);
  }, [audio]);

  // Advanced mode timer
  useEffect(() => {
    if (state.isPlaying && !state.isPaused && state.showAdvancedPlayer) {
      sessionTimerRef.current = setInterval(() => {
        const elapsed = audio.getElapsedTime();
        dispatch({ type: 'SET_ELAPSED_TIME', payload: elapsed });

        const runner = advancedTimelineRunnerRef.current;
        if (runner) {
          const result = runner.tick(elapsed);
          dispatch({
            type: 'SET_ADVANCED_PHASE',
            payload: {
              index: result.currentPhaseIndex,
              name: result.currentPhaseName,
              progress: result.phaseProgress,
              beatFreqs: result.currentBeatFreqs,
            },
          });

          // Update beat layer frequencies from timeline
          if (state.advancedConfig) {
            for (let i = 0; i < state.advancedConfig.layers.length; i++) {
              const layer = state.advancedConfig.layers[i];
              const newBeatFreq = result.currentBeatFreqs[i];
              if (newBeatFreq !== undefined) {
                audio.setBeatLayerFrequency(layer.id, layer.carrierFreq, newBeatFreq);
              }
            }
          }

          if (result.isComplete) {
            handleAdvancedSessionComplete();
          }
        }
      }, 1000);
    } else if (state.showAdvancedPlayer) {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    }
    return () => {
      if (sessionTimerRef.current && state.showAdvancedPlayer) {
        clearInterval(sessionTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isPlaying, state.isPaused, state.showAdvancedPlayer]);

  // ─── Background audio recovery ───

  // Resume audio + check session completion when page regains visibility
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return;
      if (!state.isPlaying || state.isPaused) return;

      // Resume AudioContext if browser suspended it
      audio.resumeFromBackground();

      // Check if any session completed while in background
      const elapsed = audio.getElapsedTime();
      const durationSecs = state.sessionDuration * 60;

      if (elapsed >= durationSecs) {
        if (state.showAdvancedPlayer) {
          handleAdvancedSessionComplete();
        } else if (state.showMixPlayer) {
          handleMixSessionComplete();
        } else if (state.showPlayer) {
          handleSessionComplete();
        }
        return;
      }

      // Update displayed time immediately (catches up from background)
      dispatch({ type: 'SET_ELAPSED_TIME', payload: elapsed });
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isPlaying, state.isPaused, state.sessionDuration, state.showPlayer, state.showMixPlayer, state.showAdvancedPlayer]);

  // Set up Media Session API when any session starts
  useEffect(() => {
    if (!state.isPlaying) return;

    let title = 'Binaural Session';
    let category = 'Binaural Beats';

    if (state.activePreset && state.showPlayer) {
      title = state.activePreset.name;
      category = state.activePreset.category;
    } else if (state.mixConfig && state.showMixPlayer) {
      title = 'Custom Mix';
      category = 'Mix Mode';
    } else if (state.advancedConfig && state.showAdvancedPlayer) {
      title = 'Advanced Session';
      category = 'Create Mode';
    }

    const artwork = getMediaArtwork();

    audio.setupMediaSession(title, category, {
      onPause: () => {
        audio.pause().then(() => dispatch({ type: 'SET_IS_PAUSED', payload: true }));
      },
      onResume: () => {
        audio.resume().then(() => dispatch({ type: 'SET_IS_PAUSED', payload: false }));
      },
      onStop: () => {
        if (state.showAdvancedPlayer) {
          handleStopAdvancedSession();
        } else if (state.showMixPlayer) {
          handleStopMixSession();
        } else {
          handleStop();
        }
      },
    }, artwork);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isPlaying]);

  // ─── Render ───

  // Show onboarding if not complete
  if (!state.onboardingComplete) {
    return (
      <>
        <Background />
        <Onboarding onComplete={handleInitAudio} />
      </>
    );
  }

  // Advanced session complete overlay
  if (state.sessionComplete && state.advancedConfig) {
    const totalMin = state.advancedConfig.timeline.reduce((sum, p) => sum + p.duration, 0);
    return (
      <>
        <Background />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 min-h-dvh flex items-center justify-center px-4"
        >
          <div className="text-center space-y-6 max-w-sm">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-4xl"
            >
              {"✨"}
            </motion.div>
            <div className="space-y-2">
              <h2
                className="font-[family-name:var(--font-playfair)] text-2xl"
                style={{ color: 'var(--text-primary)' }}
              >
                Session Complete
              </h2>
              <p
                className="font-[family-name:var(--font-jetbrains)] text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                Advanced Session {"·"} {totalMin} min
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={handleAdvancedPlayAgain}
                className="w-full py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                style={{
                  background: 'rgba(121, 134, 203, 0.2)',
                  border: '1px solid rgba(121, 134, 203, 0.4)',
                  color: '#7986cb',
                }}
              >
                Play Again
              </button>
              <button
                onClick={handleAdvancedChooseAnother}
                className="w-full py-2.5 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Back to Create
              </button>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // Mix session complete overlay
  if (state.sessionComplete && state.mixConfig) {
    const bwState = getBrainwaveState(state.mixConfig.stateId);
    const totalMin = state.mixConfig.timeline.easeIn + state.mixConfig.timeline.deep + state.mixConfig.timeline.easeOut;
    return (
      <>
        <Background />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 min-h-dvh flex items-center justify-center px-4"
        >
          <div className="text-center space-y-6 max-w-sm">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-4xl"
            >
              {"✨"}
            </motion.div>
            <div className="space-y-2">
              <h2
                className="font-[family-name:var(--font-playfair)] text-2xl"
                style={{ color: 'var(--text-primary)' }}
              >
                Session Complete
              </h2>
              <p
                className="font-[family-name:var(--font-jetbrains)] text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                {bwState?.label ?? 'Custom Mix'} {"·"} {totalMin} min
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={handleMixPlayAgain}
                className="w-full py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                style={{
                  background: `${bwState?.color ?? '#4fc3f7'}20`,
                  border: `1px solid ${bwState?.color ?? '#4fc3f7'}40`,
                  color: bwState?.color ?? '#4fc3f7',
                }}
              >
                Play Again
              </button>
              <button
                onClick={handleMixChooseAnother}
                className="w-full py-2.5 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Back to Mix
              </button>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // Listen session complete overlay
  if (state.sessionComplete && state.activePreset) {
    return (
      <>
        <Background />
        <SessionComplete
          preset={state.activePreset}
          duration={state.sessionDuration}
          onPlayAgain={handlePlayAgain}
          onChooseAnother={handleChooseAnother}
        />
      </>
    );
  }

  // Advanced player view
  if (state.showAdvancedPlayer && state.advancedConfig) {
    return (
      <>
        <Background />
        <AdvancedPlayer
          config={state.advancedConfig}
          isPlaying={state.isPlaying}
          isPaused={state.isPaused}
          elapsedTime={state.elapsedTime}
          sessionDuration={state.sessionDuration}
          volume={state.volume}
          phaseIndex={state.advancedPhaseIndex}
          phaseName={state.advancedPhaseName}
          phaseProgress={state.advancedPhaseProgress}
          beatFreqs={state.advancedBeatFreqs}
          onBack={handleBackFromAdvancedPlayer}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStopAdvancedSession}
          onVolumeChange={handleVolumeChange}
          onSensorFrequencyChange={handleAdvancedSensorFrequencyChange}
          onSensorStereoWidthChange={handleAdvancedSensorStereoWidthChange}
        />
      </>
    );
  }

  // Mix player view
  if (state.showMixPlayer && state.mixConfig) {
    return (
      <>
        <Background />
        <MixPlayer
          config={state.mixConfig}
          isPlaying={state.isPlaying}
          isPaused={state.isPaused}
          elapsedTime={state.elapsedTime}
          sessionDuration={state.sessionDuration}
          volume={state.volume}
          mixPhase={state.mixPhase}
          mixPhaseProgress={state.mixPhaseProgress}
          mixBeatFreq={state.mixBeatFreq}
          onBack={handleBackFromMixPlayer}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStopMixSession}
          onVolumeChange={handleVolumeChange}
          onSensorFrequencyChange={handleMixSensorFrequencyChange}
        />
      </>
    );
  }

  // Listen player view
  if (state.showPlayer && state.activePreset) {
    return (
      <>
        <Background />
        <PlayerView
          preset={state.activePreset}
          isPlaying={state.isPlaying}
          isPaused={state.isPaused}
          elapsedTime={state.elapsedTime}
          sessionDuration={state.sessionDuration}
          volume={state.volume}
          ambientLayers={state.ambientLayers}
          onBack={handleBackFromPlayer}
          onPlay={handlePlay}
          onStop={handleStop}
          onPause={handlePause}
          onResume={handleResume}
          onVolumeChange={handleVolumeChange}
          onDurationChange={(d) => dispatch({ type: 'SET_SESSION_DURATION', payload: d })}
          onToggleAmbient={handleToggleAmbient}
          onUpdateLayerVolume={handleUpdateLayerVolume}
          onRemoveLayer={handleRemoveLayer}
          onClearAmbient={handleClearAmbient}
          sensorActive={listenSensorActive}
          onSensorToggle={handleListenSensorToggle}
        />
      </>
    );
  }

  // Main grid view
  return (
    <>
      <Background />
      <div className="relative z-10 min-h-dvh">
        <Header />
        <ModeSwitcher />

        {state.mode === 'listen' && (
          <>
            <CategoryFilter />
            <HeadphoneBanner />
            <PresetGrid onSensorBadgeTap={() => setSensorUpsellOpen(true)} />
          </>
        )}

        {state.mode === 'mix' && (
          <>
            <HeadphoneBanner />
            <MixBuilder
              onStartSession={handleStartMixSession}
              onPreviewTone={handlePreviewTone}
              onLimitReached={handleMixLimitReached}
            />
          </>
        )}

        {state.mode === 'create' && (
          <>
            <HeadphoneBanner />
            <AdvancedBuilder
              onStartSession={handleStartAdvancedSession}
              onStartPreview={handleStartPreview}
              onStopPreview={handleStopPreview}
              onPreviewTone={handlePreviewTone}
              onLimitReached={handleAdvancedLimitReached}
              audio={audio}
            />
          </>
        )}

        {state.showMiniPlayer && (state.activePreset || state.mixConfig || state.advancedConfig) && (
          <MiniPlayer
            preset={state.activePreset}
            mixConfig={state.mixConfig}
            advancedConfig={state.advancedConfig}
            isPlaying={state.isPlaying}
            isPaused={state.isPaused}
            elapsedTime={state.elapsedTime}
            sessionDuration={state.sessionDuration}
            mixPhase={state.mixPhase}
            advancedPhaseName={state.advancedPhaseName}
            onTap={handleMiniPlayerTap}
            onPause={handlePause}
            onResume={handleResume}
            onStop={state.advancedConfig ? handleStopAdvancedSession : state.mixConfig ? handleStopMixSession : handleStop}
          />
        )}
        <Toast />
        <InstallBanner />
        <SensorUpsell
          isOpen={sensorUpsellOpen}
          onClose={() => setSensorUpsellOpen(false)}
          onUpgrade={() => {
            setSensorUpsellOpen(false);
            setProUpgradeOpen(true);
          }}
        />
        <ProUpgrade
          isOpen={proUpgradeOpen}
          onClose={() => setProUpgradeOpen(false)}
        />
      </div>
    </>
  );
}
