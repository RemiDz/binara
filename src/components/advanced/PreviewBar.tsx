'use client';

import { useRef } from 'react';
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
        className="w-full mt-3 py-3 rounded-xl text-xs font-[family-name:var(--font-inter)] font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
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
      className="w-full mt-3 py-2.5 px-3 rounded-xl flex items-center gap-3"
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

      {/* Volume slider (custom div-based for bulletproof thumb centring) */}
      <PreviewVolumeSlider
        value={isMuted ? 0 : volume}
        onChange={onVolumeChange}
      />

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

function PreviewVolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleInteraction = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(Math.round(ratio * 100));
  };

  return (
    <div
      ref={trackRef}
      style={{
        position: 'relative',
        height: 32,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        flex: 1,
        minWidth: 0,
        touchAction: 'none',
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        handleInteraction(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0) handleInteraction(e.clientX);
      }}
    >
      {/* Track background */}
      <div style={{
        width: '100%',
        height: 4,
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        position: 'relative',
      }}>
        {/* Filled portion */}
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: '#7986cb',
          borderRadius: 2,
        }} />
        {/* Thumb — transform: translate(-50%, -50%) guarantees perfect centring */}
        <div style={{
          position: 'absolute',
          left: `${value}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: '#7986cb',
          boxShadow: '0 0 6px rgba(121, 134, 203, 0.4)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
