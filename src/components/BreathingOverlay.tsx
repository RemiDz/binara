'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BREATHING_PATTERNS, getBreathState, getDefaultPatternId } from '@/lib/breathing-patterns';
import type { BreathState } from '@/lib/breathing-patterns';

interface BreathingOverlayProps {
  color: string;
  category: string;
  isActive: boolean;
}

export default function BreathingOverlay({ color, category, isActive }: BreathingOverlayProps) {
  const [patternId, setPatternId] = useState(() => getDefaultPatternId(category));
  const [breathState, setBreathState] = useState<BreathState>({
    phase: 'inhale',
    progress: 0,
    scale: 0,
    label: 'Breathe in',
  });
  const startTimeRef = useRef(0);
  const rafRef = useRef(0);

  // Reset default pattern when category changes
  useEffect(() => {
    setPatternId(getDefaultPatternId(category));
  }, [category]);

  // Animation loop
  useEffect(() => {
    if (!isActive) return;

    startTimeRef.current = performance.now();

    const pattern = BREATHING_PATTERNS.find(p => p.id === patternId) ?? BREATHING_PATTERNS[0];

    const loop = () => {
      const elapsedMs = performance.now() - startTimeRef.current;
      const elapsedSecs = elapsedMs / 1000;
      const state = getBreathState(pattern, elapsedSecs);
      setBreathState(state);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, patternId]);

  if (!isActive) return null;

  // Circle scale: range from 30% to 80% of container
  const circleScale = 0.3 + breathState.scale * 0.5;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* Breathing circle */}
      <div
        style={{
          width: `${circleScale * 100}%`,
          maxWidth: 320,
          aspectRatio: '1',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}08 0%, ${color}03 60%, transparent 100%)`,
          border: `1px solid ${color}${breathState.phase === 'hold1' || breathState.phase === 'hold2' ? '40' : '30'}`,
          boxShadow: breathState.phase === 'hold1' || breathState.phase === 'hold2'
            ? `0 0 ${20 + Math.sin(breathState.progress * Math.PI * 4) * 8}px ${color}15`
            : 'none',
          transition: 'width 0.1s ease-out, border-color 0.3s ease, box-shadow 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Breath label */}
        <AnimatePresence mode="wait">
          <motion.span
            key={breathState.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="font-[family-name:var(--font-inter)] text-sm"
            style={{ color, userSelect: 'none' }}
          >
            {breathState.label}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Breathing Toggle Control ───

interface BreathingToggleProps {
  isActive: boolean;
  onToggle: () => void;
  patternId: string;
  onPatternChange: (id: string) => void;
  color?: string;
}

export function BreathingToggle({
  isActive,
  onToggle,
  patternId,
  onPatternChange,
  color = '#7986cb',
}: BreathingToggleProps) {
  const [expanded, setExpanded] = useState(false);

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
          {/* Breathing icon — lungs */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive ? color : 'rgba(255,255,255,0.35)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.3s ease' }}>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4" strokeDasharray="2 2" />
          </svg>
          <span
            className="font-[family-name:var(--font-inter)] text-xs"
            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.3s ease' }}
          >
            Guided Breathing
          </span>
          {isActive && (
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
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
          aria-label={isActive ? 'Disable guided breathing' : 'Enable guided breathing'}
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

      {/* Expandable pattern selector */}
      <AnimatePresence>
        {expanded && isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-3"
          >
            <div className="flex items-center gap-2 py-1 flex-wrap">
              <span
                className="font-[family-name:var(--font-inter)] text-[11px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Pattern
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {BREATHING_PATTERNS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onPatternChange(p.id)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-[family-name:var(--font-inter)] transition-all"
                    style={{
                      background: patternId === p.id ? `${color}20` : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${patternId === p.id ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
                      color: patternId === p.id ? color : 'var(--text-muted)',
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
