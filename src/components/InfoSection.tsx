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
  const isInterval = preset.category === 'intervals';
  const leftFreq = preset.carrierFreq;
  const rightFreq = isInterval && preset.rightFreq !== undefined ? preset.rightFreq : preset.carrierFreq + preset.beatFreq;
  const accentColor = preset.color === '#FFFFFF' ? 'rgba(255,255,255,0.8)' : preset.color;

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full py-2 text-left"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span className="text-sm">{isOpen ? '\u25BC' : '\u25B6'}</span>
        <span className="font-[family-name:var(--font-inter)] text-xs">
          {isInterval ? 'How Musical Intervals Work' : 'How Binaural Beats Work'}
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
              {isInterval ? (
                <>
                  <p>
                    Musical interval presets use <strong>harmonic frequency ratios</strong> between
                    your left and right ears, rather than targeting specific brainwave states.
                    The therapeutic value comes from the natural consonance between the two tones.
                  </p>
                  <p>
                    This preset plays{' '}
                    <span className="font-[family-name:var(--font-jetbrains)]" style={{ color: accentColor }}>
                      {leftFreq} Hz
                    </span>{' '}
                    in your left ear and{' '}
                    <span className="font-[family-name:var(--font-jetbrains)]" style={{ color: accentColor }}>
                      {rightFreq} Hz
                    </span>{' '}
                    in your right ear {'\u2014'} a{' '}
                    <span style={{ color: accentColor }}>
                      {preset.intervalName} ({preset.intervalRatio})
                    </span>{' '}
                    ratio. Your brain perceives a rich, harmonious interaction between the two frequencies.
                  </p>
                  <p style={{ color: 'var(--text-muted)' }}>
                    {"\u{1F3A7} Headphones are required for the full stereo experience."}
                  </p>
                </>
              ) : (
                <>
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
                    {"\u{1F3A7} Headphones are required for binaural beats to work."}
                  </p>
                  <div className="space-y-1 pt-1">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Brainwave States:
                    </p>
                    <p>{"\u2022 "}<span style={{ color: '#1a237e' }}>{"Delta (0.5\u20134 Hz)"}</span>{" \u2014 Deep sleep, restoration"}</p>
                    <p>{"\u2022 "}<span style={{ color: '#7986cb' }}>{"Theta (4\u20138 Hz)"}</span>{" \u2014 Meditation, creativity, dreams"}</p>
                    <p>{"\u2022 "}<span style={{ color: '#4fc3f7' }}>{"Alpha (8\u201312 Hz)"}</span>{" \u2014 Relaxation, calm focus"}</p>
                    <p>{"\u2022 "}<span style={{ color: '#ffab40' }}>{"Beta (12\u201330 Hz)"}</span>{" \u2014 Concentration, active thinking"}</p>
                    <p>{"\u2022 "}<span style={{ color: '#e040fb' }}>{"Gamma (30\u201350 Hz)"}</span>{" \u2014 Peak awareness, information processing"}</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
