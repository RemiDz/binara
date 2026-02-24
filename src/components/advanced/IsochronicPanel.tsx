'use client';

import Panel from './Panel';
import ProGate from '../ProGate';
import Slider from '../ui/Slider';
import type { IsochronicConfig, IsochronicShape } from '@/types';

const SHAPES: { id: IsochronicShape; label: string; desc: string }[] = [
  { id: 'sharp', label: 'Sharp', desc: 'Square pulse' },
  { id: 'soft', label: 'Soft', desc: 'Sine ramp' },
  { id: 'ramp', label: 'Ramp', desc: 'Sawtooth' },
];

interface IsochronicPanelProps {
  config: IsochronicConfig;
  isPro: boolean;
  onChange: (config: IsochronicConfig) => void;
}

export default function IsochronicPanel({ config, isPro, onChange }: IsochronicPanelProps) {
  const content = (
    <div className="space-y-3">
      <button
        onClick={() => onChange({ ...config, enabled: !config.enabled })}
        className="flex items-center gap-2 text-xs font-[family-name:var(--font-inter)] font-medium"
        style={{ color: config.enabled ? '#ff7043' : 'var(--text-muted)' }}
      >
        <div
          className="w-8 h-4 rounded-full relative transition-colors"
          style={{
            background: config.enabled ? 'rgba(255, 112, 67, 0.3)' : 'rgba(255,255,255,0.1)',
          }}
        >
          <div
            className="w-3 h-3 rounded-full absolute top-0.5 transition-all"
            style={{
              background: config.enabled ? '#ff7043' : 'var(--text-muted)',
              left: config.enabled ? '18px' : '2px',
            }}
          />
        </div>
        {config.enabled ? 'Enabled' : 'Disabled'}
      </button>

      {config.enabled && (
        <>
          <Slider
            label="Pulse Rate"
            value={config.pulseRate}
            min={0.5}
            max={50}
            step={0.5}
            suffix="Hz"
            color="#ff7043"
            onChange={(v) => onChange({ ...config, pulseRate: v })}
          />

          <Slider
            label="Tone Pitch"
            value={config.toneFreq}
            min={200}
            max={2000}
            step={10}
            suffix="Hz"
            logarithmic
            color="#ff7043"
            onChange={(v) => onChange({ ...config, toneFreq: v })}
          />

          {/* Shape pills */}
          <div>
            <span className="font-[family-name:var(--font-inter)] text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              Pulse Shape
            </span>
            <div className="flex gap-1.5">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChange({ ...config, shape: s.id })}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-[family-name:var(--font-jetbrains)] font-medium transition-all"
                  style={{
                    background: config.shape === s.id ? 'rgba(255, 112, 67, 0.15)' : 'transparent',
                    border: `1px solid ${config.shape === s.id ? 'rgba(255, 112, 67, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                    color: config.shape === s.id ? '#ff7043' : 'var(--text-muted)',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <Slider
            label="Volume"
            value={config.volume}
            min={0}
            max={100}
            step={1}
            suffix="%"
            color="#ff7043"
            onChange={(v) => onChange({ ...config, volume: v })}
          />
        </>
      )}
    </div>
  );

  return (
    <Panel title="Isochronic Tones" isPro>
      <ProGate feature="Isochronic Tones" isPro={isPro}>
        {content}
      </ProGate>
    </Panel>
  );
}
