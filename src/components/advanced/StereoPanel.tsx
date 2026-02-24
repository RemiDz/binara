'use client';

import Panel from './Panel';
import ProGate from '../ProGate';
import Slider from '../ui/Slider';
import type { StereoConfig } from '@/types';

interface StereoPanelProps {
  config: StereoConfig;
  isPro: boolean;
  onChange: (config: StereoConfig) => void;
}

export default function StereoPanel({ config, isPro, onChange }: StereoPanelProps) {
  const content = (
    <div className="space-y-3">
      <button
        onClick={() => onChange({ ...config, enabled: !config.enabled })}
        className="flex items-center gap-2 text-xs font-[family-name:var(--font-inter)] font-medium"
        style={{ color: config.enabled ? '#7986cb' : 'var(--text-muted)' }}
      >
        <div
          className="w-8 h-4 rounded-full relative transition-colors"
          style={{
            background: config.enabled ? 'rgba(121, 134, 203, 0.3)' : 'rgba(255,255,255,0.1)',
          }}
        >
          <div
            className="w-3 h-3 rounded-full absolute top-0.5 transition-all"
            style={{
              background: config.enabled ? '#7986cb' : 'var(--text-muted)',
              left: config.enabled ? '18px' : '2px',
            }}
          />
        </div>
        {config.enabled ? 'Enabled' : 'Disabled'}
      </button>

      {config.enabled && (
        <>
          <Slider
            label="Stereo Width"
            value={config.width}
            min={0}
            max={100}
            step={1}
            suffix="%"
            color="#7986cb"
            onChange={(v) => onChange({ ...config, width: v })}
          />

          <Slider
            label="Pan"
            value={config.pan}
            min={-100}
            max={100}
            step={1}
            color="#7986cb"
            onChange={(v) => onChange({ ...config, pan: v })}
          />

          <Slider
            label="Crossfeed"
            value={config.crossfeed}
            min={0}
            max={50}
            step={1}
            suffix="%"
            color="#7986cb"
            onChange={(v) => onChange({ ...config, crossfeed: v })}
          />

          <div className="flex items-center justify-between">
            <button
              onClick={() => onChange({ ...config, rotation: !config.rotation })}
              className="flex items-center gap-2 text-xs font-[family-name:var(--font-inter)] font-medium"
              style={{ color: config.rotation ? '#7986cb' : 'var(--text-muted)' }}
            >
              <div
                className="w-8 h-4 rounded-full relative transition-colors"
                style={{
                  background: config.rotation ? 'rgba(121, 134, 203, 0.3)' : 'rgba(255,255,255,0.1)',
                }}
              >
                <div
                  className="w-3 h-3 rounded-full absolute top-0.5 transition-all"
                  style={{
                    background: config.rotation ? '#7986cb' : 'var(--text-muted)',
                    left: config.rotation ? '18px' : '2px',
                  }}
                />
              </div>
              Spatial Rotation
            </button>
          </div>

          {config.rotation && (
            <Slider
              label="Rotation Speed"
              value={config.rotationSpeed}
              min={0.01}
              max={2}
              step={0.01}
              suffix="Hz"
              color="#7986cb"
              onChange={(v) => onChange({ ...config, rotationSpeed: v })}
            />
          )}
        </>
      )}
    </div>
  );

  return (
    <Panel title="Stereo Field" isPro>
      <ProGate feature="Stereo Field" isPro={isPro}>
        {content}
      </ProGate>
    </Panel>
  );
}
