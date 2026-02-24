'use client';

interface SessionTimerProps {
  elapsedTime: number;
  sessionDuration: number;
  color: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function SessionTimer({ elapsedTime, sessionDuration, color }: SessionTimerProps) {
  const totalSeconds = sessionDuration * 60;
  const progress = Math.min(elapsedTime / totalSeconds, 1);

  const size = 120;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
            opacity={0.8}
          />
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-[family-name:var(--font-jetbrains)] text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatTime(elapsedTime)}
          </span>
          <span
            className="font-[family-name:var(--font-jetbrains)] text-[10px]"
            style={{ color: 'var(--text-muted)' }}
          >
            / {formatTime(totalSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
