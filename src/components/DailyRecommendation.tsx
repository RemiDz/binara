'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getDailyRecommendation } from '@/lib/daily-recommendation';
import { WAVE_STATES } from './listen/wave-states';
import WaveformSignature from './listen/WaveformSignature';
import type { Preset } from '@/types';

interface DailyRecommendationProps {
  onSelect: (preset: Preset) => void;
}

export default function DailyRecommendation({ onSelect }: DailyRecommendationProps) {
  const [dismissed, setDismissed] = useState(false);
  const rec = useMemo(() => getDailyRecommendation(), []);

  if (!rec || dismissed) return null;

  const { preset, label } = rec;
  const wave = WAVE_STATES[preset.brainwaveState];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="px-4 pb-2"
      >
        <div className="max-w-5xl mx-auto">
          <div
            onClick={() => onSelect(preset)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onSelect(preset); }}
            style={{
              position: 'relative',
              padding: 1,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${wave.color}50, transparent 50%, ${wave.color}30)`,
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'relative',
                borderRadius: 15,
                padding: '16px 20px',
                background: `radial-gradient(ellipse at top left, ${wave.color}0A, rgba(12,14,24,0.96) 70%)`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {/* Dismiss button */}
              <button
                onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.25)',
                  fontSize: 14,
                  padding: 0,
                  outline: 'none',
                }}
                aria-label="Dismiss recommendation"
              >
                {"\u2715"}
              </button>

              {/* Label */}
              <div className="flex items-center gap-1.5 mb-2">
                <span style={{ color: wave.color, fontSize: 12, opacity: 0.8 }}>{"\u2726"}</span>
                <span
                  className="font-[family-name:var(--font-inter)] text-[11px]"
                  style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}
                >
                  {label}
                </span>
              </div>

              {/* Content row */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div
                    className="font-[family-name:var(--font-cormorant)] text-lg font-semibold"
                    style={{ color: 'rgba(240,237,230,0.9)', lineHeight: 1.2 }}
                  >
                    {preset.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase"
                      style={{ color: wave.color, opacity: 0.8, letterSpacing: '0.06em' }}
                    >
                      {wave.label}
                    </span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
                    <span
                      className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                      style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}
                    >
                      {preset.beatFreq} Hz
                    </span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
                    <span
                      className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      {preset.defaultDuration} min
                    </span>
                  </div>
                  <p
                    className="font-[family-name:var(--font-inter)] text-[11px] mt-1.5"
                    style={{ color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}
                  >
                    {preset.description}
                  </p>
                </div>

                {/* Waveform + Start button */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <WaveformSignature
                    wave={preset.brainwaveState}
                    freq={preset.beatFreq}
                    isHovered
                    width={60}
                    height={20}
                  />
                  <span
                    className="font-[family-name:var(--font-inter)] text-[10px] font-medium px-3 py-1 rounded-full"
                    style={{
                      background: `${wave.color}20`,
                      border: `1px solid ${wave.color}40`,
                      color: wave.color,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {"\u25B6 Start"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
