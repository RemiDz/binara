'use client';

import type { AdvancedSessionConfig } from '@/types';

function getBrainwaveLabel(freq: number): string {
  if (freq <= 4) return 'Delta';
  if (freq <= 8) return 'Theta';
  if (freq <= 12) return 'Alpha';
  if (freq <= 30) return 'Beta';
  return 'Gamma';
}

interface AdvancedSummaryProps {
  config: AdvancedSessionConfig;
}

export default function AdvancedSummary({ config }: AdvancedSummaryProps) {
  const totalDuration = config.timeline.reduce((sum, p) => sum + p.duration, 0);

  return (
    <div
      className="rounded-2xl p-4 space-y-2"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <h3
        className="font-[family-name:var(--font-inter)] text-xs font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        Session Summary
      </h3>

      <div className="space-y-1">
        {/* Layers */}
        <SummaryLine
          label="Layers"
          value={config.layers.map((l, i) => `L${i + 1}: ${l.beatFreq}Hz ${getBrainwaveLabel(l.beatFreq)}`).join(', ')}
        />

        {/* Filter */}
        {config.filter.enabled && (
          <SummaryLine
            label="Filter"
            value={`${config.filter.type} @ ${config.filter.frequency >= 1000 ? `${(config.filter.frequency / 1000).toFixed(1)}k` : config.filter.frequency} Hz`}
          />
        )}

        {/* LFO */}
        {config.lfo.enabled && (
          <SummaryLine
            label="LFO"
            value={`${config.lfo.target} ${config.lfo.rate} Hz ${config.lfo.depth}%`}
          />
        )}

        {/* Isochronic */}
        {config.isochronic.enabled && (
          <SummaryLine
            label="Isochronic"
            value={`${config.isochronic.pulseRate} Hz ${config.isochronic.shape}`}
          />
        )}

        {/* Stereo */}
        {config.stereo.enabled && (
          <SummaryLine
            label="Stereo"
            value={`W:${config.stereo.width}% P:${config.stereo.pan}`}
          />
        )}

        {/* Ambient */}
        {config.ambientLayers.length > 0 && (
          <SummaryLine
            label="Ambient"
            value={config.ambientLayers.map((l) => l.id).join(', ')}
          />
        )}

        {/* Timeline */}
        <SummaryLine
          label="Timeline"
          value={`${config.timeline.length} phase${config.timeline.length !== 1 ? 's' : ''} · ${totalDuration} min`}
        />
      </div>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span
        className="font-[family-name:var(--font-jetbrains)] text-[10px] flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
      <span
        className="font-[family-name:var(--font-jetbrains)] text-[10px] text-right"
        style={{ color: '#7986cb' }}
      >
        {value}
      </span>
    </div>
  );
}
