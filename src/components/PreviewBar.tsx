'use client';

import { motion } from 'motion/react';
import { WAVE_STATES } from './listen/wave-states';
import type { Preset } from '@/types';

// Height of the MiniPlayer bar (content + progress + padding, excluding safe area)
export const MINI_PLAYER_HEIGHT = 58;
// Height of the PreviewBar (progress line + content + padding, excluding safe area)
export const PREVIEW_BAR_HEIGHT = 54;

interface PreviewBarProps {
  preset: Preset;
  progress: number;
  onStop: () => void;
  /** Pixel offset from the bottom — used to stack above MiniPlayer */
  bottomOffset?: number;
}

export default function PreviewBar({ preset, progress, onStop, bottomOffset = 0 }: PreviewBarProps) {
  const waveState = WAVE_STATES[preset.brainwaveState];
  const color = waveState.color;
  const remaining = Math.ceil(15 * (1 - progress));

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 right-0 z-41"
      style={{
        bottom: bottomOffset,
        paddingBottom: bottomOffset === 0 ? 'var(--safe-area-bottom)' : 0,
      }}
    >
      {/* Progress bar on top edge */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.04)' }}>
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            transition: 'width 0.15s linear',
          }}
        />
      </div>

      {/* Bar content */}
      <div
        style={{
          background: 'rgba(8, 10, 22, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="px-4 py-2.5 flex items-center gap-3">
          {/* Pulsing dot */}
          <div className="relative flex-shrink-0">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <div
              className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: color, opacity: 0.4 }}
            />
          </div>

          {/* Preset info */}
          <div className="flex-1 min-w-0">
            <p
              className="font-[family-name:var(--font-inter)] text-xs font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {preset.name}
            </p>
            <p
              className="font-[family-name:var(--font-jetbrains)] text-[10px]"
              style={{ color, opacity: 0.8 }}
            >
              {waveState.label} {"·"} {preset.beatFreq} Hz
            </p>
          </div>

          {/* Countdown */}
          <span
            className="font-[family-name:var(--font-jetbrains)] text-[10px] flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            {remaining}s
          </span>

          {/* Stop button */}
          <button
            onClick={onStop}
            className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 transition-colors"
            style={{
              background: `${color}15`,
              border: `1px solid ${color}25`,
            }}
            aria-label="Stop preview"
          >
            <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
              <rect x="0.5" y="0.5" width="2.5" height="9" rx="0.5" fill={color} />
              <rect x="5" y="0.5" width="2.5" height="9" rx="0.5" fill={color} />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
