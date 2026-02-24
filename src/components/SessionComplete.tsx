'use client';

import { motion } from 'motion/react';
import type { Preset } from '@/types';

interface SessionCompleteProps {
  preset: Preset;
  duration: number;
  onPlayAgain: () => void;
  onChooseAnother: () => void;
}

export default function SessionComplete({ preset, duration, onPlayAgain, onChooseAnother }: SessionCompleteProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 min-h-dvh flex items-center justify-center px-4"
    >
      <div className="text-center space-y-6 max-w-sm">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-4xl"
        >
          {"✨"}
        </motion.div>

        <div className="space-y-2">
          <h2
            className="font-[family-name:var(--font-playfair)] text-2xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Session Complete
          </h2>
          <p
            className="font-[family-name:var(--font-jetbrains)] text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {preset.name} {"·"} {duration} min
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
            style={{
              background: `${preset.color}20`,
              border: `1px solid ${preset.color}40`,
              color: preset.color,
            }}
          >
            Play Again
          </button>
          <button
            onClick={onChooseAnother}
            className="w-full py-2.5 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
            }}
          >
            Choose Another
          </button>
        </div>
      </div>
    </motion.div>
  );
}
