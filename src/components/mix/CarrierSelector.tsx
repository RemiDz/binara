'use client';

import { CARRIER_TONES, type CarrierTone } from '@/lib/carrier-tones';

interface CarrierSelectorProps {
  selectedId: string;
  onChange: (tone: CarrierTone) => void;
  onPreview: (frequency: number) => void;
  onProTap: () => void;
}

export default function CarrierSelector({ selectedId, onChange, onPreview, onProTap }: CarrierSelectorProps) {
  const handleTap = (tone: CarrierTone) => {
    if (tone.proOnly) {
      onProTap();
      return;
    }
    onChange(tone);
    onPreview(tone.frequency);
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
          const isActive = selectedId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTap(t)}
              className="p-3 rounded-xl text-left transition-all active:scale-[0.98] relative"
              style={{
                background: isActive ? 'rgba(79, 195, 247, 0.08)' : 'var(--glass-bg)',
                border: `1px solid ${isActive ? 'rgba(79, 195, 247, 0.3)' : 'var(--glass-border)'}`,
                boxShadow: isActive ? '0 0 15px rgba(79, 195, 247, 0.1)' : 'none',
                opacity: t.proOnly ? 0.5 : 1,
              }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="font-[family-name:var(--font-inter)] font-medium text-[13px]"
                  style={{ color: isActive ? '#4fc3f7' : 'var(--text-primary)' }}
                >
                  {t.label}
                </span>
                {t.proOnly && (
                  <span className="text-[9px] font-[family-name:var(--font-jetbrains)] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,171,64,0.15)', color: '#ffab40' }}>
                    {"🔒 Pro"}
                  </span>
                )}
              </div>
              {!t.proOnly && (
                <p
                  className="font-[family-name:var(--font-jetbrains)] text-[10px] mt-0.5"
                  style={{ color: '#4fc3f7' }}
                >
                  {t.frequency} Hz
                </p>
              )}
              <p
                className="font-[family-name:var(--font-inter)] text-[11px] mt-1 leading-snug"
                style={{ color: 'var(--text-muted)' }}
              >
                {t.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
