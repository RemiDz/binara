'use client';

import { BRAINWAVE_STATES, type BrainwaveStateOption } from '@/lib/brainwave-states';

interface StateSelectorProps {
  selectedId: string;
  onChange: (state: BrainwaveStateOption) => void;
}

export default function StateSelector({ selectedId, onChange }: StateSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3
          className="font-[family-name:var(--font-inter)] font-medium text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          {"1. Choose Your State"}
        </h3>
        <p className="font-[family-name:var(--font-inter)] text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Select a brainwave target
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {BRAINWAVE_STATES.map((s) => {
          const isActive = selectedId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onChange(s)}
              className="p-3 rounded-xl text-left transition-all active:scale-[0.98]"
              style={{
                background: isActive ? `${s.color}12` : 'var(--glass-bg)',
                border: `1px solid ${isActive ? `${s.color}50` : 'var(--glass-border)'}`,
                boxShadow: isActive ? `0 0 15px ${s.color}15` : 'none',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span
                  className="font-[family-name:var(--font-inter)] font-medium text-[13px]"
                  style={{ color: isActive ? s.color : 'var(--text-primary)' }}
                >
                  {s.label}
                </span>
              </div>
              <p
                className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                style={{ color: 'var(--text-muted)' }}
              >
                {s.band} {"·"} {s.beatFreq} Hz
              </p>
              <p
                className="font-[family-name:var(--font-inter)] text-[11px] mt-1 leading-snug"
                style={{ color: 'var(--text-secondary)' }}
              >
                {s.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
