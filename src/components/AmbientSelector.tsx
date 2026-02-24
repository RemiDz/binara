'use client';

import { AMBIENT_OPTIONS } from '@/lib/constants';
import VolumeSlider from './VolumeSlider';
import { AnimatePresence, motion } from 'motion/react';

interface AmbientSelectorProps {
  activeAmbient: string | null;
  ambientVolume: number;
  onAmbientChange: (id: string | null) => void;
  onAmbientVolumeChange: (vol: number) => void;
}

export default function AmbientSelector({
  activeAmbient,
  ambientVolume,
  onAmbientChange,
  onAmbientVolumeChange,
}: AmbientSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <label
        className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        Ambient Layer
      </label>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onAmbientChange(null)}
          className="px-3 py-1.5 rounded-full text-xs font-[family-name:var(--font-inter)] font-medium transition-all"
          style={{
            background: activeAmbient === null ? 'rgba(255,255,255,0.08)' : 'var(--glass-bg)',
            border: `1px solid ${activeAmbient === null ? 'rgba(255,255,255,0.15)' : 'var(--glass-border)'}`,
            color: activeAmbient === null ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          Off
        </button>
        {AMBIENT_OPTIONS.map((opt) => {
          const isActive = activeAmbient === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onAmbientChange(isActive ? null : opt.id)}
              className="px-3 py-1.5 rounded-full text-xs font-[family-name:var(--font-inter)] font-medium transition-all"
              style={{
                background: isActive ? 'rgba(79, 195, 247, 0.12)' : 'var(--glass-bg)',
                border: `1px solid ${isActive ? 'rgba(79, 195, 247, 0.25)' : 'var(--glass-border)'}`,
                color: isActive ? '#4fc3f7' : 'var(--text-secondary)',
              }}
            >
              {opt.icon} {opt.label}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {activeAmbient && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <VolumeSlider
              value={ambientVolume}
              onChange={onAmbientVolumeChange}
              label="Ambient Volume"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
