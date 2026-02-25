'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAutoMotion } from '@/hooks/useAutoMotion';
import { trackEvent } from '@/lib/analytics';

interface AutoMotionControlProps {
  onFrequencyChange?: (freq: number) => void;
  onStereoWidthChange?: (width: number) => void;
  color?: string;
}

export default function AutoMotionControl({
  onFrequencyChange,
  onStereoWidthChange,
  color = '#7986cb',
}: AutoMotionControlProps) {
  const autoMotion = useAutoMotion();
  const [expanded, setExpanded] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const handleToggle = () => {
    if (!enabled) {
      autoMotion.start();
      setEnabled(true);
      trackEvent('Auto Motion Enabled');
      // Notify SensorControl to disable
      window.dispatchEvent(new CustomEvent('binara:auto-motion-activated'));
    } else {
      autoMotion.stop();
      setEnabled(false);
    }
  };

  // Listen for sensor activation — disable auto motion
  useEffect(() => {
    const handler = () => {
      if (enabled) {
        autoMotion.stop();
        setEnabled(false);
      }
    };
    window.addEventListener('binara:sensor-activated', handler);
    return () => window.removeEventListener('binara:sensor-activated', handler);
  }, [enabled, autoMotion]);

  // Push tilt values to callbacks when active
  useEffect(() => {
    if (!autoMotion.active) return;

    const freq = autoMotion.getTiltFrequency();
    onFrequencyChange?.(freq);

    if (onStereoWidthChange) {
      const width = autoMotion.getTiltStereoWidth();
      onStereoWidthChange(width * 100);
    }
  }, [autoMotion.state.pitch, autoMotion.state.roll, autoMotion.active, onFrequencyChange, onStereoWidthChange, autoMotion]);

  return (
    <div className="space-y-2">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-2"
      >
        <div className="flex items-center gap-2">
          {/* Sine wave icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
          </svg>
          <span
            className="font-[family-name:var(--font-inter)] text-xs font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Auto Motion
          </span>
        </div>
        <div className="flex items-center gap-2">
          {autoMotion.active && (
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="font-[family-name:var(--font-jetbrains)] text-[9px] px-1.5 py-0.5 rounded-md"
              style={{
                background: `${color}15`,
                border: `1px solid ${color}25`,
                color,
              }}
            >
              AUTO
            </motion.span>
          )}
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round"
            style={{
              color: 'var(--text-muted)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Expandable controls */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-4"
          >
            {/* On/off toggle */}
            <div className="flex items-center justify-between">
              <span
                className="font-[family-name:var(--font-inter)] text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                {enabled ? 'Auto motion active' : 'Enable auto motion'}
              </span>
              <button
                onClick={handleToggle}
                className="w-10 h-5 rounded-full relative transition-colors"
                style={{
                  background: enabled ? `${color}40` : 'rgba(255,255,255,0.1)',
                }}
              >
                <div
                  className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
                  style={{
                    background: enabled ? color : 'rgba(255,255,255,0.3)',
                    left: enabled ? '22px' : '2px',
                  }}
                />
              </button>
            </div>

            {autoMotion.active && (
              <>
                {/* Intensity slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-[family-name:var(--font-inter)] text-[11px]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Intensity
                    </span>
                    <span
                      className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {autoMotion.intensity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    className="w-full h-[32px]"
                    min={0} max={100} step={1}
                    value={autoMotion.intensity}
                    onChange={(e) => autoMotion.setIntensity(Number(e.target.value))}
                  />
                </div>

                {/* Simulated beat frequency readout */}
                <div className="flex items-center justify-between">
                  <span
                    className="font-[family-name:var(--font-inter)] text-[11px]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Simulated Beat Freq
                  </span>
                  <span
                    className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                    style={{ color }}
                  >
                    {autoMotion.getTiltFrequency().toFixed(1)} Hz
                  </span>
                </div>

                {/* Stereo width readout (only when callback provided) */}
                {onStereoWidthChange && (
                  <div className="flex items-center justify-between">
                    <span
                      className="font-[family-name:var(--font-inter)] text-[11px]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Stereo Width
                    </span>
                    <span
                      className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                      style={{ color }}
                    >
                      {Math.round(autoMotion.getTiltStereoWidth() * 100)}%
                    </span>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
