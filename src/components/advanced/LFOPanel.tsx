'use client';

import Panel from './Panel';
import ProGate from '../ProGate';
import Slider from '../ui/Slider';
import type { LFOConfig, LFOTarget, AdvancedWaveform } from '@/types';

const TARGETS: { id: LFOTarget; label: string }[] = [
  { id: 'volume', label: 'Volume' },
  { id: 'pitch', label: 'Pitch' },
  { id: 'filter', label: 'Filter' },
  { id: 'pan', label: 'Pan' },
];

const SHAPES: { id: AdvancedWaveform; label: string }[] = [
  { id: 'sine', label: 'Sin' },
  { id: 'triangle', label: 'Tri' },
  { id: 'square', label: 'Sq' },
  { id: 'sawtooth', label: 'Saw' },
];

interface LFOPanelProps {
  config: LFOConfig;
  isPro: boolean;
  onChange: (config: LFOConfig) => void;
}

export default function LFOPanel({ config, isPro, onChange }: LFOPanelProps) {
  const content = (
    <div className="space-y-3">
      <button
        onClick={() => onChange({ ...config, enabled: !config.enabled })}
        className="flex items-center gap-2 text-xs font-[family-name:var(--font-inter)] font-medium"
        style={{ color: config.enabled ? '#e040fb' : 'var(--text-muted)' }}
      >
        <div
          className="w-8 h-4 rounded-full relative transition-colors"
          style={{
            background: config.enabled ? 'rgba(224, 64, 251, 0.3)' : 'rgba(255,255,255,0.1)',
          }}
        >
          <div
            className="w-3 h-3 rounded-full absolute top-0.5 transition-all"
            style={{
              background: config.enabled ? '#e040fb' : 'var(--text-muted)',
              left: config.enabled ? '18px' : '2px',
            }}
          />
        </div>
        {config.enabled ? 'Enabled' : 'Disabled'}
      </button>

      {config.enabled && (
        <>
          {/* Target pills */}
          <div>
            <span className="font-[family-name:var(--font-inter)] text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              Target
            </span>
            <div className="flex gap-1.5">
              {TARGETS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onChange({ ...config, target: t.id })}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-[family-name:var(--font-jetbrains)] font-medium transition-all"
                  style={{
                    background: config.target === t.id ? 'rgba(224, 64, 251, 0.15)' : 'transparent',
                    border: `1px solid ${config.target === t.id ? 'rgba(224, 64, 251, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                    color: config.target === t.id ? '#e040fb' : 'var(--text-muted)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Slider
            label="Rate"
            value={config.rate}
            min={0.01}
            max={10}
            step={0.01}
            suffix="Hz"
            color="#e040fb"
            onChange={(v) => onChange({ ...config, rate: v })}
          />

          <Slider
            label="Depth"
            value={config.depth}
            min={0}
            max={100}
            step={1}
            suffix="%"
            color="#e040fb"
            onChange={(v) => onChange({ ...config, depth: v })}
          />

          {/* Shape pills */}
          <div>
            <span className="font-[family-name:var(--font-inter)] text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              Shape
            </span>
            <div className="flex gap-1.5">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChange({ ...config, shape: s.id })}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-[family-name:var(--font-jetbrains)] font-medium transition-all"
                  style={{
                    background: config.shape === s.id ? 'rgba(224, 64, 251, 0.15)' : 'transparent',
                    border: `1px solid ${config.shape === s.id ? 'rgba(224, 64, 251, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                    color: config.shape === s.id ? '#e040fb' : 'var(--text-muted)',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Panel title="LFO Modulation" isPro>
      <ProGate feature="LFO Modulation" isPro={isPro}>
        {content}
      </ProGate>
    </Panel>
  );
}
