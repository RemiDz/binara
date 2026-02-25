'use client';

import { CARRIER_TONES, type CarrierTone } from '@/lib/carrier-tones';
import { useProContext } from '@/context/ProContext';
import Slider from '@/components/ui/Slider';

interface CarrierSelectorProps {
  selectedId: string;
  customFreq: number;
  onChange: (tone: CarrierTone) => void;
  onCustomFreqChange: (freq: number) => void;
  onPreview: (frequency: number) => void;
}

export default function CarrierSelector({ selectedId, customFreq, onChange, onCustomFreqChange, onPreview }: CarrierSelectorProps) {
  const { isPro } = useProContext();

  const handleTap = (tone: CarrierTone) => {
    if (tone.proOnly && !isPro) return;
    onChange(tone);
    if (!tone.proOnly || isPro) {
      onPreview(tone.id === 'custom' ? customFreq : tone.frequency);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3
          className="font-[family-name:var(--font-inter)] font-medium text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          {"2. Choose Your Tone"}
        </h3>
        <p className="font-[family-name:var(--font-inter)] text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          The base carrier frequency
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CARRIER_TONES.map((t) => {
          const isCustom = t.id === 'custom';
          const isActive = selectedId === t.id;
          const isLocked = isCustom && !isPro;

          return (
            <button
              key={t.id}
              onClick={() => !isLocked && handleTap(t)}
              className="p-3 rounded-xl text-left transition-all active:scale-[0.98] relative"
              style={{
                background: isActive ? 'rgba(79, 195, 247, 0.08)' : 'var(--glass-bg)',
                border: `1px solid ${isActive ? 'rgba(79, 195, 247, 0.3)' : 'var(--glass-border)'}`,
                boxShadow: isActive ? '0 0 15px rgba(79, 195, 247, 0.1)' : 'none',
                opacity: isLocked ? 0.4 : 1,
                cursor: isLocked ? 'default' : 'pointer',
              }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="font-[family-name:var(--font-inter)] font-medium text-[13px]"
                  style={{ color: isActive ? '#4fc3f7' : 'var(--text-primary)' }}
                >
                  {t.label}
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
                  className="font-[family-name:var(--font-jetbrains)] text-[10px] mt-0.5"
                  style={{ color: '#4fc3f7' }}
                >
                  {t.frequency} Hz
                </p>
              )}
              {isCustom && isActive && isPro && (
                <p
                  className="font-[family-name:var(--font-jetbrains)] text-[10px] mt-0.5"
                  style={{ color: '#4fc3f7' }}
                >
                  {customFreq} Hz
                </p>
              )}
              <p
                className="font-[family-name:var(--font-inter)] text-[11px] mt-1 leading-snug"
                style={{ color: 'var(--text-muted)' }}
              >
                {t.description}
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
                    label="Carrier Frequency"
                    value={customFreq}
                    min={20}
                    max={500}
                    step={0.1}
                    suffix="Hz"
                    color="#4fc3f7"
                    onChange={onCustomFreqChange}
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
