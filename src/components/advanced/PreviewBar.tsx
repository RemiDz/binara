'use client';

import { motion } from 'motion/react';

interface PreviewBarProps {
  isActive: boolean;
  isMuted: boolean;
  volume: number;
  onEnable: () => void;
  onDisable: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
}

export default function PreviewBar({
  isActive,
  isMuted,
  volume,
  onEnable,
  onDisable,
  onToggleMute,
  onVolumeChange,
}: PreviewBarProps) {
  if (!isActive) {
    return (
      <button
        onClick={onEnable}
        className="w-full py-3 rounded-xl text-xs font-[family-name:var(--font-inter)] font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        style={{
          background: 'rgba(121, 134, 203, 0.08)',
          border: '1px dashed rgba(121, 134, 203, 0.25)',
          color: '#7986cb',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
        Tap to enable live preview
      </button>
    );
  }

  return (
    <div
      className="w-full py-2.5 px-3 rounded-xl flex items-center gap-3"
      style={{
        background: 'rgba(121, 134, 203, 0.08)',
        border: '1px solid rgba(121, 134, 203, 0.2)',
      }}
    >
      {/* Pulsing dot + label */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: '#7986cb' }}
        />
        <span
          className="font-[family-name:var(--font-jetbrains)] text-[10px]"
          style={{ color: '#7986cb' }}
        >
          Live
        </span>
      </div>

      {/* Volume slider */}
      <div className="flex-1 min-w-0">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full h-1 appearance-none rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#7986cb]"
          style={{
            background: `linear-gradient(to right, #7986cb ${isMuted ? 0 : volume}%, rgba(255,255,255,0.1) ${isMuted ? 0 : volume}%)`,
          }}
        />
      </div>

      {/* Mute button */}
      <button
        onClick={onToggleMute}
        className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 transition-colors"
        style={{
          background: isMuted ? 'rgba(255,255,255,0.06)' : 'rgba(121, 134, 203, 0.15)',
          color: isMuted ? 'var(--text-muted)' : '#7986cb',
        }}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>

      {/* Stop preview button */}
      <button
        onClick={onDisable}
        className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 transition-colors"
        style={{
          background: 'rgba(255,255,255,0.06)',
          color: 'var(--text-muted)',
        }}
        aria-label="Stop preview"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
