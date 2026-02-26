'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

function isVibrationAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

interface HapticToggleProps {
  isActive: boolean;
  intensity: number;
  onToggle: () => void;
  onIntensityChange: (value: number) => void;
  color?: string;
}

export default function HapticToggle({
  isActive,
  intensity,
  onToggle,
  onIntensityChange,
  color = '#7986cb',
}: HapticToggleProps) {
  const [expanded, setExpanded] = useState(false);

  // Only render on devices that support vibration (Android)
  if (!isVibrationAvailable()) return null;

  return (
    <div className="space-y-2">
      {/* Toggle row */}
      <div
        className="flex items-center justify-between py-2 px-3 rounded-xl"
        style={{
          background: isActive ? `${color}08` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isActive ? `${color}20` : 'rgba(255,255,255,0.06)'}`,
          transition: 'all 0.3s ease',
        }}
      >
        <button
          className="flex items-center gap-2.5 flex-1"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Vibration icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive ? color : 'rgba(255,255,255,0.35)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.3s ease' }}>
            <rect x="8" y="4" width="8" height="16" rx="2" />
            <path d="M4 8v8" />
            <path d="M20 8v8" />
            <path d="M2 10v4" />
            <path d="M22 10v4" />
          </svg>
          <span
            className="font-[family-name:var(--font-inter)] text-xs"
            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.3s ease' }}
          >
            Haptic Pulse
          </span>
          {isActive && (
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: color }}
            />
          )}
        </button>

        {/* Toggle switch */}
        <button
          onClick={onToggle}
          className="w-10 h-5 rounded-full relative transition-colors"
          style={{
            background: isActive ? `${color}40` : 'rgba(255,255,255,0.1)',
          }}
          aria-label={isActive ? 'Disable haptic pulse' : 'Enable haptic pulse'}
        >
          <div
            className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
            style={{
              background: isActive ? color : 'rgba(255,255,255,0.3)',
              left: isActive ? '22px' : '2px',
            }}
          />
        </button>
      </div>

      {/* Expandable intensity slider */}
      <AnimatePresence>
        {expanded && isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-3"
          >
            <div className="flex items-center gap-2 py-1">
              <span
                className="font-[family-name:var(--font-inter)] text-[11px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Intensity
              </span>
              <input
                type="range"
                className="flex-1 h-[32px]"
                min={0} max={100} step={1}
                value={intensity}
                onChange={(e) => onIntensityChange(Number(e.target.value))}
              />
              <span
                className="font-[family-name:var(--font-jetbrains)] text-[10px] w-8 text-right"
                style={{ color: 'var(--text-muted)' }}
              >
                {intensity}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
