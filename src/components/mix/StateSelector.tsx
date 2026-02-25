'use client';

import { BRAINWAVE_STATES, type BrainwaveStateOption } from '@/lib/brainwave-states';
import { useProContext } from '@/context/ProContext';
import Slider from '@/components/ui/Slider';

function getBrainwaveBandLabel(freq: number): string {
  if (freq < 4) return 'Delta (deep sleep)';
  if (freq < 8) return 'Theta (meditation)';
  if (freq < 14) return 'Alpha (relaxation)';
  if (freq < 30) return 'Beta (focus)';
  return 'Gamma (peak cognition)';
}

interface StateSelectorProps {
  selectedId: string;
  customBeatFreq: number;
  onChange: (state: BrainwaveStateOption) => void;
  onCustomBeatFreqChange: (freq: number) => void;
}

export default function StateSelector({ selectedId, customBeatFreq, onChange, onCustomBeatFreqChange }: StateSelectorProps) {
  const { isPro } = useProContext();

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
          const isCustom = s.id === 'custom';
          const isActive = selectedId === s.id;
          const isLocked = isCustom && !isPro;

          return (
            <button
              key={s.id}
              onClick={() => !isLocked && onChange(s)}
              className="p-3 rounded-xl text-left transition-all active:scale-[0.98]"
              style={{
                background: isActive ? `${s.color}12` : 'var(--glass-bg)',
                border: `1px solid ${isActive ? `${s.color}50` : 'var(--glass-border)'}`,
                boxShadow: isActive ? `0 0 15px ${s.color}15` : 'none',
                opacity: isLocked ? 0.4 : 1,
                cursor: isLocked ? 'default' : 'pointer',
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
                {isCustom && isLocked && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffab40" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
                {isCustom && isPro && (
                  <span className="text-[9px] font-[family-name:var(--font-jetbrains)] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,171,64,0.15)', color: '#ffab40' }}>
                    PRO
                  </span>
                )}
              </div>
              {!isCustom && (
                <p
                  className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {s.band} {"·"} {s.beatFreq} Hz
                </p>
              )}
              {isCustom && isActive && isPro && (
                <p
                  className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {getBrainwaveBandLabel(customBeatFreq)} {"·"} {customBeatFreq} Hz
                </p>
              )}
              <p
                className="font-[family-name:var(--font-inter)] text-[11px] mt-1 leading-snug"
                style={{ color: 'var(--text-secondary)' }}
              >
                {s.description}
              </p>
              {isCustom && isLocked && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('binara:open-pro-upgrade'));
                  }}
                  className="font-[family-name:var(--font-inter)] text-[10px] mt-1.5 underline"
                  style={{ color: '#ffab40' }}
                >
                  Upgrade to PRO
                </button>
              )}
              {isCustom && isActive && isPro && (
                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                  <Slider
                    label="Beat Frequency"
                    value={customBeatFreq}
                    min={0.5}
                    max={100}
                    step={0.1}
                    suffix="Hz"
                    color={s.color}
                    onChange={onCustomBeatFreqChange}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
