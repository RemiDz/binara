'use client';

import Panel from './Panel';
import Slider from '../ui/Slider';
import type { BeatLayer, AdvancedWaveform } from '@/types';
import { getBrainwaveColor, getBrainwaveLabel } from '@/lib/brainwave-states';

const WAVEFORMS: { id: AdvancedWaveform; label: string }[] = [
  { id: 'sine', label: 'Sin' },
  { id: 'triangle', label: 'Tri' },
  { id: 'sawtooth', label: 'Saw' },
  { id: 'square', label: 'Sq' },
];

interface OscillatorPanelProps {
  layers: BeatLayer[];
  isPro: boolean;
  onUpdateLayer: (id: string, updates: Partial<BeatLayer>) => void;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
}

const MAX_FREE_LAYERS = 1;
const MAX_PRO_LAYERS = 4;

export default function OscillatorPanel({ layers, isPro, onUpdateLayer, onAddLayer, onRemoveLayer }: OscillatorPanelProps) {
  const maxLayers = isPro ? MAX_PRO_LAYERS : MAX_FREE_LAYERS;
  const canAdd = layers.length < maxLayers;

  return (
    <Panel title="Oscillators" subtitle={`${layers.length} layer${layers.length !== 1 ? 's' : ''}`} defaultExpanded>
      <div className="space-y-4">
        {layers.map((layer, idx) => (
          <div
            key={layer.id}
            className="space-y-3 p-3 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Layer {idx + 1}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-[family-name:var(--font-jetbrains)]"
                  style={{
                    background: `${getBrainwaveColor(layer.beatFreq)}20`,
                    color: getBrainwaveColor(layer.beatFreq),
                  }}
                >
                  {getBrainwaveLabel(layer.beatFreq)} {layer.beatFreq.toFixed(1)} Hz
                </span>
              </div>
              {layers.length > 1 && (
                <button
                  onClick={() => onRemoveLayer(layer.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-full transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Remove layer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            <Slider
              label="Beat Frequency"
              value={layer.beatFreq}
              min={0.5}
              max={100}
              step={0.5}
              suffix="Hz"
              color={getBrainwaveColor(layer.beatFreq)}
              onChange={(v) => onUpdateLayer(layer.id, { beatFreq: v })}
            />

            <Slider
              label="Carrier Frequency"
              value={layer.carrierFreq}
              min={20}
              max={1500}
              step={1}
              suffix="Hz"
              logarithmic
              color="#7986cb"
              onChange={(v) => onUpdateLayer(layer.id, { carrierFreq: v })}
            />

            {/* Waveform pills */}
            <div className="flex gap-1.5">
              {WAVEFORMS.map((wf) => (
                <button
                  key={wf.id}
                  onClick={() => onUpdateLayer(layer.id, { waveform: wf.id })}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-[family-name:var(--font-jetbrains)] font-medium transition-all"
                  style={{
                    background: layer.waveform === wf.id ? 'rgba(121, 134, 203, 0.15)' : 'transparent',
                    border: `1px solid ${layer.waveform === wf.id ? 'rgba(121, 134, 203, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                    color: layer.waveform === wf.id ? '#7986cb' : 'var(--text-muted)',
                  }}
                >
                  {wf.label}
                </button>
              ))}
            </div>

            <Slider
              label="Volume"
              value={layer.volume}
              min={0}
              max={100}
              step={1}
              suffix="%"
              color="#7986cb"
              onChange={(v) => onUpdateLayer(layer.id, { volume: v })}
            />
          </div>
        ))}

        {canAdd && (
          <button
            onClick={onAddLayer}
            className="w-full py-2 rounded-xl text-xs font-[family-name:var(--font-inter)] font-medium transition-all"
            style={{
              background: 'rgba(121, 134, 203, 0.08)',
              border: '1px dashed rgba(121, 134, 203, 0.25)',
              color: '#7986cb',
            }}
          >
            + Add Layer {!isPro && `(Pro: up to ${MAX_PRO_LAYERS})`}
          </button>
        )}
      </div>
    </Panel>
  );
}
