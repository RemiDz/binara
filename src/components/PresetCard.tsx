'use client';

import { motion } from 'motion/react';
import { trackEvent } from '@/lib/analytics';
import type { Preset } from '@/types';

interface PresetCardProps {
  preset: Preset;
  index: number;
  onSelect: (preset: Preset) => void;
}

export default function PresetCard({ preset, index, onSelect }: PresetCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={() => { trackEvent('Preset Play', { preset: preset.name, category: preset.category }); onSelect(preset); }}
      className="w-full text-left p-3.5 rounded-xl transition-all active:scale-[0.98] group"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderLeft: `2px solid ${preset.color}`,
        boxShadow: 'var(--glass-shadow)',
      }}
    >
      <div className="flex flex-col gap-2 min-h-[110px]">
        <span className="text-base">{preset.icon}</span>

        <div>
          <p
            className="font-[family-name:var(--font-inter)] font-medium text-sm leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {preset.name}
          </p>
          <p
            className="font-[family-name:var(--font-jetbrains)] text-[10px] mt-0.5"
            style={{ color: preset.color }}
          >
            {preset.brainwaveLabel}
          </p>
        </div>

        <p
          className="font-[family-name:var(--font-inter)] text-[11px] leading-snug flex-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {preset.description}
        </p>

        <p
          className="font-[family-name:var(--font-jetbrains)] text-[10px] self-end"
          style={{ color: 'var(--text-muted)' }}
        >
          {preset.defaultDuration} min
        </p>
      </div>
    </motion.button>
  );
}
