'use client';

import { QUICK_PRESETS } from '@/lib/session-timeline';
import Slider from '@/components/ui/Slider';

interface TimelineBuilderProps {
  easeIn: number;
  deep: number;
  easeOut: number;
  stateColor: string;
  onEaseInChange: (v: number) => void;
  onDeepChange: (v: number) => void;
  onEaseOutChange: (v: number) => void;
  onQuickPreset: (easeIn: number, deep: number, easeOut: number) => void;
}

export default function TimelineBuilder({
  easeIn,
  deep,
  easeOut,
  stateColor,
  onEaseInChange,
  onDeepChange,
  onEaseOutChange,
  onQuickPreset,
}: TimelineBuilderProps) {
  const total = easeIn + deep + easeOut;
  const easeInPct = (easeIn / total) * 100;
  const deepPct = (deep / total) * 100;
  const easeOutPct = (easeOut / total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3
            className="font-[family-name:var(--font-inter)] font-medium text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            {"4. Session Timeline"}
          </h3>
          <p className="font-[family-name:var(--font-inter)] text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Set phase durations
          </p>
        </div>
        <span
          className="font-[family-name:var(--font-jetbrains)] text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          Total: {total} min
        </span>
      </div>

      {/* Visual timeline bar */}
      <div className="h-10 rounded-lg overflow-hidden flex" style={{ background: 'var(--glass-bg)' }}>
        <div
          className="flex items-center justify-center text-[10px] font-[family-name:var(--font-jetbrains)] transition-all"
          style={{
            width: `${easeInPct}%`,
            background: `linear-gradient(90deg, #4fc3f7 0%, ${stateColor} 100%)`,
            color: 'rgba(0,0,0,0.7)',
            minWidth: '40px',
          }}
        >
          {easeIn}m
        </div>
        <div
          className="flex items-center justify-center text-[10px] font-[family-name:var(--font-jetbrains)] transition-all"
          style={{
            width: `${deepPct}%`,
            background: stateColor,
            color: 'rgba(0,0,0,0.7)',
            minWidth: '40px',
          }}
        >
          {deep}m
        </div>
        <div
          className="flex items-center justify-center text-[10px] font-[family-name:var(--font-jetbrains)] transition-all"
          style={{
            width: `${easeOutPct}%`,
            background: `linear-gradient(90deg, ${stateColor} 0%, #4fc3f7 100%)`,
            color: 'rgba(0,0,0,0.7)',
            minWidth: '40px',
          }}
        >
          {easeOut}m
        </div>
      </div>

      <div className="flex justify-between text-[10px] font-[family-name:var(--font-inter)]" style={{ color: 'var(--text-muted)' }}>
        <span>Ease In</span>
        <span>Deep Session</span>
        <span>Ease Out</span>
      </div>

      {/* Duration sliders */}
      <div className="space-y-3 pt-1">
        <SliderRow label="Ease In" value={easeIn} min={1} max={10} onChange={onEaseInChange} />
        <SliderRow label="Deep Session" value={deep} min={3} max={120} onChange={onDeepChange} />
        <SliderRow label="Ease Out" value={easeOut} min={1} max={10} onChange={onEaseOutChange} />
      </div>

      {/* Quick presets */}
      <div className="flex gap-2 flex-wrap pt-1">
        <span className="font-[family-name:var(--font-jetbrains)] text-[10px] self-center" style={{ color: 'var(--text-muted)' }}>
          Quick:
        </span>
        {QUICK_PRESETS.map((qp) => (
          <button
            key={qp.total}
            onClick={() => onQuickPreset(qp.easeIn, qp.deep, qp.easeOut)}
            className="px-2.5 py-1 rounded-full text-[11px] font-[family-name:var(--font-jetbrains)] transition-all"
            style={{
              background: total === qp.total ? 'rgba(79,195,247,0.12)' : 'var(--glass-bg)',
              border: `1px solid ${total === qp.total ? 'rgba(79,195,247,0.25)' : 'var(--glass-border)'}`,
              color: total === qp.total ? '#4fc3f7' : 'var(--text-secondary)',
            }}
          >
            {qp.total} min
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <Slider
      label={label}
      value={value}
      min={min}
      max={max}
      step={1}
      suffix="min"
      color="#4fc3f7"
      onChange={onChange}
    />
  );
}
