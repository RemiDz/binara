'use client';

import { motion } from 'motion/react';
import type { Preset } from '@/types';
import BeatVisualiser from './BeatVisualiser';
import SessionTimer from './SessionTimer';
import VolumeSlider from './VolumeSlider';
import AmbientSelector from './AmbientSelector';
import DurationSelector from './DurationSelector';
import InfoSection from './InfoSection';

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
}: PlayerViewProps) {
  const playerState = !isPlaying && !isPaused ? 'pre-play' : isPlaying && !isPaused ? 'playing' : 'paused';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 min-h-dvh flex flex-col"
    >
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
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-6">
        {/* Visualiser */}
        <BeatVisualiser
          beatFrequency={preset.beatFreq}
          color={preset.color}
          isPlaying={isPlaying}
        />

        {/* Preset info */}
        <div className="text-center space-y-1">
          <h2
            className="font-[family-name:var(--font-playfair)] text-2xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {preset.name}
          </h2>
          <p
            className="font-[family-name:var(--font-jetbrains)] text-xs"
            style={{ color: preset.color }}
          >
            {preset.brainwaveLabel}
          </p>
          <p
            className="font-[family-name:var(--font-inter)] text-sm pt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {preset.description}
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

        {/* Duration selector (pre-play only) */}
        {playerState === 'pre-play' && (
          <DurationSelector value={sessionDuration} onChange={onDurationChange} />
        )}

        {/* Volume */}
        {(isPlaying || isPaused) && (
          <VolumeSlider
            value={volume}
            onChange={onVolumeChange}
            color={preset.color}
            label="Volume"
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
        <div className="flex flex-col gap-3 items-center">
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
    </motion.div>
  );
}
