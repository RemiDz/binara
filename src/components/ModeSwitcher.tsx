'use client';

import { useAppState, useAppDispatch } from '@/context/AppContext';
import { trackEvent } from '@/lib/analytics';
import type { AppMode } from '@/types';

const MODES: { id: AppMode; label: string; icon: string }[] = [
  { id: 'listen', label: 'Listen', icon: '\u266B' },
  { id: 'mix', label: 'Mix', icon: '\u229E' },
  { id: 'create', label: 'Create', icon: '\u26A1' },
];

export default function ModeSwitcher() {
  const { mode } = useAppState();
  const dispatch = useAppDispatch();

  const handleModeSelect = (modeId: AppMode) => {
    trackEvent('Mode Switch', { from: mode, to: modeId });
    dispatch({ type: 'SET_MODE', payload: modeId });
  };

  return (
    <div className="sticky top-[52px] z-30 px-4 py-2">
      <div
        className="max-w-5xl mx-auto flex gap-0.5"
        style={{
          padding: 3,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {MODES.map((m) => {
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleModeSelect(m.id)}
              className="relative flex-1 flex items-center justify-center gap-1.5 font-[family-name:var(--font-inter)]"
              style={{
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#F0EDE6' : 'rgba(255,255,255,0.35)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(247,183,49,0.15), rgba(247,183,49,0.05))'
                  : 'transparent',
                border: isActive
                  ? '1px solid rgba(247,183,49,0.2)'
                  : '1px solid transparent',
                borderRadius: 10,
                padding: '9px 0',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              <span style={{ fontSize: 14 }}>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
