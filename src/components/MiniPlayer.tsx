'use client';

import { motion } from 'motion/react';
import type { Preset, MixConfig, AdvancedSessionConfig } from '@/types';
import { getBrainwaveState } from '@/lib/brainwave-states';

interface MiniPlayerProps {
  preset: Preset | null;
  mixConfig: MixConfig | null;
  advancedConfig: AdvancedSessionConfig | null;
  isPlaying: boolean;
  isPaused: boolean;
  elapsedTime: number;
  sessionDuration: number;
  mixPhase: 'easeIn' | 'deep' | 'easeOut' | null;
  advancedPhaseName?: string;
  onTap: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const PHASE_SHORT: Record<string, string> = {
  easeIn: 'Ease In',
  deep: 'Deep',
  easeOut: 'Ease Out',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MiniPlayer({
  preset,
  mixConfig,
  advancedConfig,
  isPlaying,
  isPaused,
  elapsedTime,
  sessionDuration,
  mixPhase,
  advancedPhaseName,
  onTap,
  onPause,
  onResume,
  onStop,
}: MiniPlayerProps) {
  const totalSeconds = sessionDuration * 60;
  const progress = Math.min(elapsedTime / totalSeconds, 1);

  // Derive display info from preset, mix config, or advanced config
  const isAdvanced = advancedConfig !== null && !mixConfig && !preset;
  const isMix = mixConfig !== null && preset === null && !isAdvanced;
  const bwState = isMix ? getBrainwaveState(mixConfig!.stateId) : null;
  const displayName = isAdvanced ? 'Advanced Session' : isMix ? (bwState?.label ?? 'Custom Mix') : (preset?.name ?? '');
  const displayColor = isAdvanced ? '#7986cb' : isMix ? (bwState?.color ?? '#ffab40') : (preset?.color ?? '#4fc3f7');

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-40 glass"
      style={{ paddingBottom: 'var(--safe-area-bottom)' }}
    >
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer"
        onClick={onTap}
      >
        {/* Pulsing dot */}
        <div className="relative flex-shrink-0">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: displayColor }}
          />
          {isPlaying && !isPaused && (
            <div
              className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: displayColor, opacity: 0.4 }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className="font-[family-name:var(--font-inter)] text-sm font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {displayName}
          </p>
          {isMix && mixPhase && (
            <p
              className="font-[family-name:var(--font-jetbrains)] text-[10px]"
              style={{ color: displayColor }}
            >
              {PHASE_SHORT[mixPhase]}
            </p>
          )}
          {isAdvanced && advancedPhaseName && (
            <p
              className="font-[family-name:var(--font-jetbrains)] text-[10px]"
              style={{ color: displayColor }}
            >
              {advancedPhaseName}
            </p>
          )}
        </div>

        {/* Time */}
        <span
          className="font-[family-name:var(--font-jetbrains)] text-xs flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          {formatTime(elapsedTime)}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={isPaused ? onResume : onPause}
            className="w-8 h-8 flex items-center justify-center rounded-full glass-hover"
            style={{ color: 'var(--text-primary)' }}
            aria-label={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          <button
            onClick={onStop}
            className="w-8 h-8 flex items-center justify-center rounded-full glass-hover"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Stop"
          >
            {"⏹"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full transition-all duration-1000 linear"
          style={{
            width: `${progress * 100}%`,
            background: displayColor,
            opacity: 0.6,
          }}
        />
      </div>
    </motion.div>
  );
}
