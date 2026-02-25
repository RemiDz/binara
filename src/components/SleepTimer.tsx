'use client';

const TIMER_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Off' },
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '60m' },
  { value: 90, label: '90m' },
];

interface SleepTimerProps {
  value: number | null;
  onChange: (value: number | null) => void;
  remainingSeconds: number | null;
  color: string;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SleepTimer({
  value,
  onChange,
  remainingSeconds,
  color,
}: SleepTimerProps) {
  const isFading = remainingSeconds !== null && remainingSeconds <= 180 && remainingSeconds > 0;

  return (
    <div className="space-y-2">
      <p
        className="text-[11px] font-[family-name:var(--font-inter)] font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        Sleep Timer
      </p>

      {/* Timer pills */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {TIMER_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.label}
              onClick={() => onChange(opt.value)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-[family-name:var(--font-jetbrains)] transition-all active:scale-[0.96]"
              style={{
                background: selected ? `${color}25` : 'var(--glass-bg)',
                border: `1px solid ${selected ? `${color}60` : 'var(--glass-border)'}`,
                color: selected ? color : 'var(--text-muted)',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Countdown */}
      {value !== null && remainingSeconds !== null && remainingSeconds > 0 && (
        <p
          className="text-[10px] font-[family-name:var(--font-jetbrains)] text-center"
          style={{
            color: 'var(--text-muted)',
            opacity: 0.6,
            animation: isFading ? 'sleepTimerPulse 2s ease-in-out infinite' : undefined,
          }}
        >
          {"Sleep timer: "}{formatCountdown(remainingSeconds)}{" remaining"}
        </p>
      )}

      <style>{`
        @keyframes sleepTimerPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
