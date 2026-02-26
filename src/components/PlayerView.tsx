'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import type { Preset } from '@/types';
import BackgroundVisualiser from './BackgroundVisualiser';
import SessionTimer from './SessionTimer';
import VolumeSlider from './VolumeSlider';
import SensorToggle from './SensorToggle';
import AutoMotionToggle from './AutoMotionToggle';
import HapticToggle from './HapticToggle';
import BreathingOverlay, { BreathingToggle } from './BreathingOverlay';
import { getDefaultPatternId } from '@/lib/breathing-patterns';
import AmbientSelector from './AmbientSelector';
import SleepTimer from './SleepTimer';
import PhaseIndicator from './PhaseIndicator';
import DurationSelector from './DurationSelector';
import InfoSection from './InfoSection';
import ShareButton from './ShareButton';

interface PlayerViewProps {
  preset: Preset;
  isPlaying: boolean;
  isPaused: boolean;
  elapsedTime: number;
  sessionDuration: number;
  volume: number;
  ambientLayers: { id: string; volume: number }[];
  onBack: () => void;
  onPlay: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onVolumeChange: (vol: number) => void;
  onDurationChange: (d: number) => void;
  onToggleAmbient: (id: string) => void;
  onUpdateLayerVolume: (id: string, volume: number) => void;
  onRemoveLayer: (id: string) => void;
  onClearAmbient: () => void;
  sleepTimer: number | null;
  onSleepTimerChange: (value: number | null) => void;
  sleepTimerRemaining: number | null;
  listenPhase: 'easeIn' | 'deep' | 'easeOut';
  listenBeatFreq: number;
  listenTotalProgress: number;
  sensorActive?: boolean;
  onSensorToggle?: () => void;
  autoMotionActive?: boolean;
  autoMotionIntensity?: number;
  onAutoMotionToggle?: () => void;
  onAutoMotionIntensityChange?: (value: number) => void;
  hapticActive?: boolean;
  hapticIntensity?: number;
  onHapticToggle?: () => void;
  onHapticIntensityChange?: (value: number) => void;
  isFavourited: boolean;
  onToggleFavourite: (presetId: string) => void;
}

export default function PlayerView({
  preset,
  isPlaying,
  isPaused,
  elapsedTime,
  sessionDuration,
  volume,
  ambientLayers,
  onBack,
  onPlay,
  onStop,
  onPause,
  onResume,
  onVolumeChange,
  onDurationChange,
  onToggleAmbient,
  onUpdateLayerVolume,
  onRemoveLayer,
  onClearAmbient,
  sleepTimer,
  onSleepTimerChange,
  sleepTimerRemaining,
  listenPhase,
  listenBeatFreq,
  listenTotalProgress,
  sensorActive,
  onSensorToggle,
  autoMotionActive,
  autoMotionIntensity,
  onAutoMotionToggle,
  onAutoMotionIntensityChange,
  hapticActive,
  hapticIntensity,
  onHapticToggle,
  onHapticIntensityChange,
  isFavourited,
  onToggleFavourite,
}: PlayerViewProps) {
  const playerState = !isPlaying && !isPaused ? 'pre-play' : isPlaying && !isPaused ? 'playing' : 'paused';
  const [heartScale, setHeartScale] = useState(1);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPatternId, setBreathingPatternId] = useState(() => getDefaultPatternId(preset.category));
  const handleHeart = useCallback(() => {
    setHeartScale(1.3);
    setTimeout(() => setHeartScale(1), 200);
    onToggleFavourite(preset.id);
  }, [preset.id, onToggleFavourite]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 min-h-dvh flex flex-col overflow-hidden"
    >
      {/* Background visualiser */}
      <BackgroundVisualiser
        beatFrequency={preset.beatFreq}
        isPlaying={isPlaying && !isPaused}
        color={preset.color}
      />

      {/* Breathing overlay — behind content */}
      <BreathingOverlay
        color={preset.color}
        category={preset.category}
        isActive={breathingActive && (isPlaying || isPaused)}
      />

      {/* Content layer */}
      <div className="relative z-[1] flex flex-col min-h-dvh">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ paddingTop: 'calc(var(--safe-area-top) + 12px)' }}>
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full glass-hover transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <ShareButton
            session={{ type: 'listen', presetId: preset.id }}
            sessionName={preset.name}
          />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
          {/* Session info */}
          <div className="text-center space-y-0.5">
            <div className="flex items-center justify-center gap-2">
              <h2
                className="font-[family-name:var(--font-playfair)] text-xl"
                style={{ color: 'var(--text-primary)' }}
              >
                {preset.name}
              </h2>
              <button
                onClick={handleHeart}
                aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  outline: 'none',
                  transform: `scale(${heartScale})`,
                  transition: 'transform 0.2s ease',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    fill={isFavourited ? '#ff6b8a' : 'none'}
                    stroke={isFavourited ? '#ff6b8a' : 'rgba(255,255,255,0.3)'}
                  />
                </svg>
              </button>
            </div>
            <p
              className="font-[family-name:var(--font-jetbrains)] text-[11px]"
              style={{ color: preset.color }}
            >
              {preset.brainwaveLabel} {"·"} {preset.beatFreq} Hz
            </p>
          </div>

          {/* Timer (when playing) */}
          {isPlaying && (
            <SessionTimer
              elapsedTime={elapsedTime}
              sessionDuration={sessionDuration}
              color={preset.color}
            />
          )}

          {/* Phase indicator (when playing) */}
          {isPlaying && (
            <PhaseIndicator
              phase={listenPhase}
              totalProgress={listenTotalProgress}
              currentBeatFreq={listenBeatFreq}
              color={preset.color}
            />
          )}

          {/* Duration selector (pre-play only) */}
          {playerState === 'pre-play' && (
            <DurationSelector value={sessionDuration} onChange={onDurationChange} />
          )}

          {/* Volume with headphone reminder */}
          {(isPlaying || isPaused) && (
            <div className="relative">
              <VolumeSlider
                value={volume}
                onChange={onVolumeChange}
                color={preset.color}
                label="Volume"
              />
              {/* Subtle headphone icon */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute top-0 right-0"
                style={{ color: 'var(--text-muted)', opacity: 0.3 }}
              >
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>
          )}

          {/* Sleep timer */}
          {(isPlaying || isPaused) && (
            <SleepTimer
              value={sleepTimer}
              onChange={onSleepTimerChange}
              remainingSeconds={sleepTimerRemaining}
              color={preset.color}
            />
          )}

          {/* Sensor toggle (PRO only, mobile only) */}
          {(isPlaying || isPaused) && onSensorToggle && (
            <SensorToggle
              isActive={sensorActive ?? false}
              onToggle={onSensorToggle}
              color={preset.color}
            />
          )}

          {/* Auto Motion toggle (all users, all platforms) */}
          {(isPlaying || isPaused) && onAutoMotionToggle && (
            <AutoMotionToggle
              isActive={autoMotionActive ?? false}
              intensity={autoMotionIntensity ?? 50}
              onToggle={onAutoMotionToggle}
              onIntensityChange={onAutoMotionIntensityChange ?? (() => {})}
              color={preset.color}
            />
          )}

          {/* Haptic Pulse toggle (Android only) */}
          {(isPlaying || isPaused) && onHapticToggle && (
            <HapticToggle
              isActive={hapticActive ?? false}
              intensity={hapticIntensity ?? 50}
              onToggle={onHapticToggle}
              onIntensityChange={onHapticIntensityChange ?? (() => {})}
              color={preset.color}
            />
          )}

          {/* Guided Breathing toggle */}
          {(isPlaying || isPaused) && (
            <BreathingToggle
              isActive={breathingActive}
              onToggle={() => setBreathingActive(!breathingActive)}
              patternId={breathingPatternId}
              onPatternChange={setBreathingPatternId}
              color={preset.color}
            />
          )}

          {/* Ambient */}
          {(isPlaying || isPaused) && (
            <AmbientSelector
              ambientLayers={ambientLayers}
              onToggleAmbient={onToggleAmbient}
              onUpdateLayerVolume={onUpdateLayerVolume}
              onRemoveLayer={onRemoveLayer}
              onClearAmbient={onClearAmbient}
            />
          )}

          {/* Controls */}
          <div className="flex flex-col gap-2 items-center">
            {playerState === 'pre-play' && (
              <button
                onClick={onPlay}
                className="w-full max-w-xs py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                style={{
                  background: `${preset.color}25`,
                  border: `1px solid ${preset.color}50`,
                  color: preset.color,
                }}
              >
                {"▶ Start Session"}
              </button>
            )}

            {playerState === 'playing' && (
              <>
                <button
                  onClick={onPause}
                  className="w-full max-w-xs py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                  style={{
                    background: `${preset.color}20`,
                    border: `1px solid ${preset.color}40`,
                    color: preset.color,
                  }}
                >
                  {"⏸ Pause"}
                </button>
                <button
                  onClick={onStop}
                  className="w-full max-w-xs py-2.5 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {"⏹ Stop"}
                </button>
              </>
            )}

            {playerState === 'paused' && (
              <>
                <button
                  onClick={onResume}
                  className="w-full max-w-xs py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                  style={{
                    background: `${preset.color}20`,
                    border: `1px solid ${preset.color}40`,
                    color: preset.color,
                  }}
                >
                  {"▶ Resume"}
                </button>
                <button
                  onClick={onStop}
                  className="w-full max-w-xs py-2.5 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {"⏹ Stop"}
                </button>
              </>
            )}
          </div>

          {/* Info section */}
          <InfoSection preset={preset} />
        </div>
      </div>
    </motion.div>
  );
}
