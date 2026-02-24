'use client';

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  color?: string;
  label?: string;
}

export default function VolumeSlider({ value, onChange, color = '#4fc3f7', label }: VolumeSliderProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        </svg>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-5"
          style={{
            '--color-pulse-cyan': color,
          } as React.CSSProperties}
          aria-label={label || 'Volume'}
        />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      </div>
    </div>
  );
}
