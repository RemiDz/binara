'use client';

import { useRef, useState } from 'react';
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
      <div className="flex gap-2 mt-3">
        <button
          onClick={onEnable}
          className="flex-1 py-4 rounded-2xl text-sm font-[family-name:var(--font-inter)] font-medium flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, rgba(121, 134, 203, 0.12) 0%, rgba(79, 195, 247, 0.08) 100%)',
            border: '1px dashed rgba(121, 134, 203, 0.3)',
            color: '#7986cb',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>Tap to start playing</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-full mt-3 py-3 px-4 rounded-2xl flex items-center gap-3"
      style={{
        background: 'linear-gradient(135deg, rgba(121, 134, 203, 0.15) 0%, rgba(79, 195, 247, 0.08) 100%)',
        border: '1px solid rgba(121, 134, 203, 0.25)',
      }}
    >
      {/* Pulsing indicator + label */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-2 h-2 rounded-full"
          style={{ background: isMuted ? 'var(--text-muted)' : '#7986cb' }}
        />
        <span
          className="font-[family-name:var(--font-inter)] text-xs font-medium"
          style={{ color: isMuted ? 'var(--text-muted)' : '#7986cb' }}
        >
          {isMuted ? 'Muted' : 'Playing'}
        </span>
      </div>

      {/* Volume slider */}
      <PreviewVolumeSlider
        value={isMuted ? 0 : volume}
        onChange={onVolumeChange}
      />

      {/* Volume percentage */}
      <span
        className="font-[family-name:var(--font-jetbrains)] text-[10px] w-7 text-right flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        {isMuted ? '0' : volume}
      </span>

      {/* Mute button */}
      <button
        onClick={onToggleMute}
        className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-95"
        style={{
          background: isMuted ? 'rgba(255,255,255,0.06)' : 'rgba(121, 134, 203, 0.2)',
          color: isMuted ? 'var(--text-muted)' : '#7986cb',
        }}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>

      {/* Stop button */}
      <button
        onClick={onDisable}
        className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-95"
        style={{
          background: 'rgba(255,255,255,0.06)',
          color: 'var(--text-muted)',
        }}
        aria-label="Stop"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
      </button>
    </div>
  );
}

function PreviewVolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

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
        height: 36,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        flex: 1,
        minWidth: 0,
        touchAction: 'none',
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        handleInteraction(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0) handleInteraction(e.clientX);
      }}
      onPointerUp={() => setDragging(false)}
    >
      {/* Track background */}
      <div style={{
        width: '100%',
        height: 4,
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 2,
        position: 'relative',
        overflow: 'visible',
      }}>
        {/* Filled portion */}
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: 'linear-gradient(90deg, rgba(121, 134, 203, 0.6), #7986cb)',
          borderRadius: 2,
        }} />
        {/* Thumb */}
        <div style={{
          position: 'absolute',
          left: `${value}%`,
          top: '50%',
          transform: `translate(-50%, -50%) scale(${dragging ? 1.2 : 1})`,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#7986cb',
          boxShadow: dragging
            ? '0 0 12px rgba(121, 134, 203, 0.6)'
            : '0 0 6px rgba(121, 134, 203, 0.3)',
          pointerEvents: 'none',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }} />
      </div>
    </div>
  );
}
