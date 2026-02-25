'use client';

import { useProContext } from '@/context/ProContext';
import { SensorEngine } from '@/lib/sensor-engine';

interface SensorToggleProps {
  isActive: boolean;
  onToggle: () => void;
  color?: string;
}

const UPGRADE_DESCRIPTION =
  'Unlock Motion Sensors with Binara PRO. Your phone\u2019s gyroscope creates a deeper experience \u2014 tilt to shift the spatial balance, stay still and the sound rewards you with harmonic overtones.';

export default function SensorToggle({
  isActive,
  onToggle,
  color = '#7986cb',
}: SensorToggleProps) {
  const { isPro } = useProContext();

  // Hide on desktop or if sensors unavailable
  if (!SensorEngine.available) return null;

  return (
    <div className="space-y-2">
      {/* Toggle row */}
      <div
        className="flex items-center justify-between py-2 px-3 rounded-xl"
        style={{
          background: isPro && isActive ? `${color}08` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isPro && isActive ? `${color}20` : 'rgba(255,255,255,0.06)'}`,
          opacity: isPro ? 1 : 0.4,
          transition: 'all 0.3s ease',
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* Lock icon for free users */}
          {!isPro && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
          {/* Phone icon for PRO users */}
          {isPro && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive ? color : 'rgba(255,255,255,0.35)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.3s ease' }}>
              <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
              <line x1="12" y1="18" x2="12" y2="18.01" />
            </svg>
          )}
          <span
            className="font-[family-name:var(--font-inter)] text-xs"
            style={{ color: isPro && isActive ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.3s ease' }}
          >
            Phone Sensors
          </span>
          {isPro && isActive && (
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
          onClick={isPro ? onToggle : undefined}
          className="w-10 h-5 rounded-full relative transition-colors"
          style={{
            background: isPro && isActive ? `${color}40` : 'rgba(255,255,255,0.1)',
            cursor: isPro ? 'pointer' : 'default',
          }}
          aria-label={isActive ? 'Disable motion sensors' : 'Enable motion sensors'}
          aria-disabled={!isPro}
        >
          <div
            className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
            style={{
              background: isPro && isActive ? color : 'rgba(255,255,255,0.3)',
              left: isPro && isActive ? '22px' : '2px',
            }}
          />
        </button>
      </div>

      {/* Inline upgrade description for free users */}
      {!isPro && (
        <div className="px-3 space-y-2">
          <p
            className="font-[family-name:var(--font-inter)] text-xs leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {UPGRADE_DESCRIPTION}
          </p>
          <a
            href="#upgrade"
            onClick={(e) => {
              e.preventDefault();
              // Dispatch a custom event that App.tsx can listen for
              window.dispatchEvent(new CustomEvent('binara:open-pro-upgrade'));
            }}
            className="font-[family-name:var(--font-inter)] text-xs font-medium inline-block"
            style={{ color: '#F7B731', opacity: 0.6, textDecoration: 'none' }}
          >
            Upgrade to PRO
          </a>
        </div>
      )}
    </div>
  );
}
