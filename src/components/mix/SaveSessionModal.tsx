'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface SaveSessionModalProps {
  defaultName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export default function SaveSessionModal({ defaultName, onSave, onCancel }: SaveSessionModalProps) {
  const [name, setName] = useState(defaultName);
  const stableCancel = useCallback(() => onCancel(), [onCancel]);
  const trapRef = useFocusTrap(true, stableCancel);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(5, 8, 16, 0.8)' }}
    >
      <motion.div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-session-title"
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm p-4 rounded-xl space-y-4"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <h3
          id="save-session-title"
          className="font-[family-name:var(--font-inter)] font-medium text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          Save Session
        </h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          className="w-full px-3 py-2 rounded-lg text-sm font-[family-name:var(--font-inter)] outline-none"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
          }}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-full text-xs font-[family-name:var(--font-inter)] font-medium"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(name.trim() || defaultName)}
            className="flex-1 py-2 rounded-full text-xs font-[family-name:var(--font-inter)] font-medium"
            style={{
              background: 'rgba(79, 195, 247, 0.15)',
              border: '1px solid rgba(79, 195, 247, 0.3)',
              color: '#4fc3f7',
            }}
          >
            {"Save ✓"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
