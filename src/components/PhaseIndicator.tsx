'use client';

interface PhaseIndicatorProps {
  phase: 'easeIn' | 'deep' | 'easeOut';
  totalProgress: number;
  currentBeatFreq: number;
  color: string;
}

const PHASES = [
  { key: 'easeIn', label: 'Ease In' },
  { key: 'deep', label: 'Deep' },
  { key: 'easeOut', label: 'Ease Out' },
] as const;

export default function PhaseIndicator({
  phase,
  totalProgress,
  currentBeatFreq,
  color,
}: PhaseIndicatorProps) {
  return (
    <div className="space-y-2">
      {/* Phase dots, labels, and current frequency */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          {PHASES.map((p) => {
            const isActive = p.key === phase;
            return (
              <div key={p.key} className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    background: isActive ? color : 'transparent',
                    border: `1.5px solid ${isActive ? color : 'var(--text-muted)'}`,
                    opacity: isActive ? 1 : 0.35,
                    boxShadow: isActive ? `0 0 6px ${color}40` : undefined,
                  }}
                />
                <span
                  className="text-[9px] font-[family-name:var(--font-jetbrains)]"
                  style={{
                    color: isActive ? color : 'var(--text-muted)',
                    opacity: isActive ? 0.9 : 0.35,
                  }}
                >
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>
        <span
          className="text-[10px] font-[family-name:var(--font-jetbrains)] tabular-nums"
          style={{ color, opacity: 0.7 }}
        >
          {currentBeatFreq.toFixed(1)} Hz
        </span>
      </div>

      {/* Progress bar with phase boundary notches */}
      <div
        className="relative h-[2px] rounded-full overflow-hidden"
        style={{ background: 'var(--glass-border)' }}
      >
        {/* 12% and 88% notches */}
        <div
          className="absolute top-0 bottom-0 w-[1px]"
          style={{ left: '12%', background: 'var(--text-muted)', opacity: 0.25, zIndex: 1 }}
        />
        <div
          className="absolute top-0 bottom-0 w-[1px]"
          style={{ left: '88%', background: 'var(--text-muted)', opacity: 0.25, zIndex: 1 }}
        />
        {/* Fill */}
        <div
          className="absolute top-0 left-0 bottom-0 rounded-full transition-[width] duration-1000 ease-linear"
          style={{
            width: `${Math.min(totalProgress * 100, 100)}%`,
            background: color,
            boxShadow: `0 0 4px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}
