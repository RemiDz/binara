'use client';

import { useState } from 'react';
import type { Preset } from '@/types';
import { BRAINWAVE_DESCRIPTIONS } from '@/lib/constants';
import { AnimatePresence, motion } from 'motion/react';

interface InfoSectionProps {
  preset: Preset;
}

export default function InfoSection({ preset }: InfoSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const leftFreq = preset.carrierFreq;
  const rightFreq = preset.carrierFreq + preset.beatFreq;

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full py-2 text-left"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span className="text-sm">{isOpen ? '\u25BC' : '\u25B6'}</span>
        <span className="font-[family-name:var(--font-inter)] text-xs">
          How Binaural Beats Work
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="pb-4 space-y-3 font-[family-name:var(--font-inter)] text-xs leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              <p>
                Binaural beats are created when each ear receives a tone at a slightly
                different frequency. Your brain perceives the difference as a gentle
                pulsing beat.
              </p>
              <p>
                This preset plays{' '}
                <span className="font-[family-name:var(--font-jetbrains)]" style={{ color: preset.color }}>
                  {leftFreq} Hz
                </span>{' '}
                in your left ear and{' '}
                <span className="font-[family-name:var(--font-jetbrains)]" style={{ color: preset.color }}>
                  {rightFreq} Hz
                </span>{' '}
                in your right ear. The{' '}
                <span className="font-[family-name:var(--font-jetbrains)]" style={{ color: preset.color }}>
                  {preset.beatFreq} Hz
                </span>{' '}
                difference produces a{' '}
                <span style={{ color: preset.color }}>{preset.brainwaveState.charAt(0).toUpperCase() + preset.brainwaveState.slice(1)}</span>{' '}
                brainwave pattern, associated with {BRAINWAVE_DESCRIPTIONS[preset.brainwaveState].toLowerCase()}.
              </p>
              <p style={{ color: 'var(--text-muted)' }}>
                {"🎧 Headphones are required for binaural beats to work."}
              </p>
              <div className="space-y-1 pt-1">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Brainwave States:
                </p>
                <p>{"• "}<span style={{ color: '#1a237e' }}>{"Delta (0.5–4 Hz)"}</span>{" — Deep sleep, restoration"}</p>
                <p>{"• "}<span style={{ color: '#7986cb' }}>{"Theta (4–8 Hz)"}</span>{" — Meditation, creativity, dreams"}</p>
                <p>{"• "}<span style={{ color: '#4fc3f7' }}>{"Alpha (8–12 Hz)"}</span>{" — Relaxation, calm focus"}</p>
                <p>{"• "}<span style={{ color: '#ffab40' }}>{"Beta (12–30 Hz)"}</span>{" — Concentration, active thinking"}</p>
                <p>{"• "}<span style={{ color: '#e040fb' }}>{"Gamma (30–50 Hz)"}</span>{" — Peak awareness, information processing"}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
