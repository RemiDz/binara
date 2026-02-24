'use client';

import Panel from './Panel';
import Slider from '../ui/Slider';
import type { FilterConfig, FilterType } from '@/types';

const FILTER_TYPES: { id: FilterType; label: string }[] = [
  { id: 'lowpass', label: 'Lowpass' },
  { id: 'highpass', label: 'Highpass' },
  { id: 'bandpass', label: 'Bandpass' },
];

interface FilterPanelProps {
  config: FilterConfig;
  onChange: (config: FilterConfig) => void;
}

export default function FilterPanel({ config, onChange }: FilterPanelProps) {
  return (
    <Panel title="Filter" subtitle={config.enabled ? config.type : 'Off'}>
      <div className="space-y-3">
        {/* Enable toggle */}
        <button
          onClick={() => onChange({ ...config, enabled: !config.enabled })}
          className="flex items-center gap-2 text-xs font-[family-name:var(--font-inter)] font-medium"
          style={{ color: config.enabled ? '#4fc3f7' : 'var(--text-muted)' }}
        >
          <div
            className="w-8 h-4 rounded-full relative transition-colors"
            style={{
              background: config.enabled ? 'rgba(79, 195, 247, 0.3)' : 'rgba(255,255,255,0.1)',
            }}
          >
            <div
              className="w-3 h-3 rounded-full absolute top-0.5 transition-all"
              style={{
                background: config.enabled ? '#4fc3f7' : 'var(--text-muted)',
                left: config.enabled ? '18px' : '2px',
              }}
            />
          </div>
          {config.enabled ? 'Enabled' : 'Disabled'}
        </button>

        {config.enabled && (
          <>
            {/* Type pills */}
            <div className="flex gap-1.5">
              {FILTER_TYPES.map((ft) => (
                <button
                  key={ft.id}
                  onClick={() => onChange({ ...config, type: ft.id })}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-[family-name:var(--font-jetbrains)] font-medium transition-all"
                  style={{
                    background: config.type === ft.id ? 'rgba(79, 195, 247, 0.15)' : 'transparent',
                    border: `1px solid ${config.type === ft.id ? 'rgba(79, 195, 247, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                    color: config.type === ft.id ? '#4fc3f7' : 'var(--text-muted)',
                  }}
                >
                  {ft.label}
                </button>
              ))}
            </div>

            <Slider
              label="Cutoff"
              value={config.frequency}
              min={20}
              max={20000}
              step={1}
              suffix="Hz"
              logarithmic
              color="#4fc3f7"
              onChange={(v) => onChange({ ...config, frequency: v })}
            />

            <Slider
              label="Resonance"
              value={config.resonance}
              min={0}
              max={100}
              step={1}
              suffix="%"
              color="#4fc3f7"
              onChange={(v) => onChange({ ...config, resonance: v })}
            />
          </>
        )}
      </div>
    </Panel>
  );
}
