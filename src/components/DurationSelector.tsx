'use client';

import { DURATION_OPTIONS } from '@/lib/constants';

interface DurationSelectorProps {
  value: number;
  onChange: (duration: number) => void;
}

export default function DurationSelector({ value, onChange }: DurationSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        Session Duration
      </label>
      <div className="flex gap-2 flex-wrap">
        {DURATION_OPTIONS.map((d) => {
          const isActive = value === d;
          return (
            <button
              key={d}
              aria-pressed={isActive}
              onClick={() => onChange(d)}
              className="px-3 py-1.5 rounded-full text-xs font-[family-name:var(--font-jetbrains)] font-medium transition-all min-h-[44px] min-w-[44px]"
              style={{
                background: isActive ? 'rgba(79, 195, 247, 0.15)' : 'var(--glass-bg)',
                border: `1px solid ${isActive ? 'rgba(79, 195, 247, 0.3)' : 'var(--glass-border)'}`,
                color: isActive ? '#4fc3f7' : 'var(--text-secondary)',
              }}
            >
              {d} min
            </button>
          );
        })}
      </div>
    </div>
  );
}
