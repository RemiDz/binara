'use client';

import { useAppState, useAppDispatch } from '@/context/AppContext';
import { trackEvent } from '@/lib/analytics';
import type { AppMode } from '@/types';

const MODES: { id: AppMode; label: string; icon: string; color: string }[] = [
  { id: 'listen', label: 'Listen', icon: '🎵', color: '#4fc3f7' },
  { id: 'mix', label: 'Mix', icon: '🎛️', color: '#ffab40' },
  { id: 'create', label: 'Create', icon: '⚡', color: '#7986cb' },
];

export default function ModeSwitcher() {
  const { mode } = useAppState();
  const dispatch = useAppDispatch();

  const handleModeSelect = (modeId: AppMode) => {
    trackEvent('Mode Switch', { from: mode, to: modeId });
    dispatch({ type: 'SET_MODE', payload: modeId });
  };

  return (
    <div className="sticky top-[52px] z-30 px-4 py-2 glass">
      <div className="max-w-5xl mx-auto flex gap-2">
        {MODES.map((m) => {
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleModeSelect(m.id)}
              className="relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all"
              style={{
                background: isActive ? `${m.color}20` : 'var(--glass-bg)',
                border: `1px solid ${isActive ? `${m.color}40` : 'var(--glass-border)'}`,
                color: isActive ? m.color : 'var(--text-muted)',
              }}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
