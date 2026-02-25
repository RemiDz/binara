'use client';

import { SensorEngine } from '@/lib/sensor-engine';

interface SensorToggleProps {
  isActive: boolean;
  onToggle: () => void;
  color?: string;
}

export default function SensorToggle({
  isActive,
  onToggle,
  color = '#7986cb',
}: SensorToggleProps) {
  // Hide on desktop or if sensors unavailable
  if (!SensorEngine.available) return null;

  return (
    <div
      className="flex items-center justify-between py-2 px-3 rounded-xl"
      style={{
        background: isActive ? `${color}08` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isActive ? `${color}20` : 'rgba(255,255,255,0.06)'}`,
        transition: 'all 0.3s ease',
      }}
    >
      <div className="flex items-center gap-2.5">
        {/* Phone icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive ? color : 'rgba(255,255,255,0.35)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.3s ease' }}>
          <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
          <line x1="12" y1="18" x2="12" y2="18.01" />
        </svg>
        <span
          className="font-[family-name:var(--font-inter)] text-xs"
          style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.3s ease' }}
        >
          Motion Sensors
        </span>
        {isActive && (
          <span
            className="font-[family-name:var(--font-jetbrains)] text-[9px] px-1.5 py-0.5 rounded-md"
            style={{
              background: `${color}15`,
              border: `1px solid ${color}25`,
              color,
            }}
          >
            LIVE
          </span>
        )}
      </div>

      {/* Toggle switch */}
      <button
        onClick={onToggle}
        className="w-10 h-5 rounded-full relative transition-colors"
        style={{
          background: isActive ? `${color}40` : 'rgba(255,255,255,0.1)',
        }}
        aria-label={isActive ? 'Disable motion sensors' : 'Enable motion sensors'}
      >
        <div
          className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
          style={{
            background: isActive ? color : 'rgba(255,255,255,0.3)',
            left: isActive ? '22px' : '2px',
          }}
        />
      </button>
    </div>
  );
}
