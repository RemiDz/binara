'use client';

import { AMBIENT_OPTIONS } from '@/lib/constants';
import { useProContext } from '@/context/ProContext';
import { AnimatePresence, motion } from 'motion/react';

const MAX_FREE_LAYERS = 2;

interface AmbientLayer {
  id: string;
  volume: number;
}

interface AmbientSelectorProps {
  ambientLayers: AmbientLayer[];
  onToggleAmbient: (id: string) => void;
  onUpdateLayerVolume: (id: string, volume: number) => void;
  onRemoveLayer: (id: string) => void;
  onClearAmbient: () => void;
}

function getAmbientOption(id: string) {
  return AMBIENT_OPTIONS.find((o) => o.id === id);
}

export default function AmbientSelector({
  ambientLayers,
  onToggleAmbient,
  onUpdateLayerVolume,
  onRemoveLayer,
  onClearAmbient,
}: AmbientSelectorProps) {
  const { isPro } = useProContext();
  const activeIds = new Set(ambientLayers.map((l) => l.id));
  const isNoneActive = ambientLayers.length === 0;
  const atFreeLimit = !isPro && ambientLayers.length >= MAX_FREE_LAYERS;

  return (
    <div className="flex flex-col gap-3">
      <label
        className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        Ambient Layer
      </label>

      {/* Ambient toggle buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onClearAmbient}
          className="px-3 py-1.5 rounded-full text-xs font-[family-name:var(--font-inter)] font-medium transition-all"
          style={{
            background: isNoneActive ? 'rgba(255,255,255,0.08)' : 'var(--glass-bg)',
            border: `1px solid ${isNoneActive ? 'rgba(255,255,255,0.15)' : 'var(--glass-border)'}`,
            color: isNoneActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          Off
        </button>
        {AMBIENT_OPTIONS.map((opt) => {
          const isActive = activeIds.has(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => onToggleAmbient(opt.id)}
              className="px-3 py-1.5 rounded-full text-xs font-[family-name:var(--font-inter)] font-medium transition-all"
              style={{
                background: isActive ? 'rgba(79, 195, 247, 0.12)' : 'var(--glass-bg)',
                border: `1px solid ${isActive ? 'rgba(79, 195, 247, 0.25)' : 'var(--glass-border)'}`,
                color: isActive ? '#4fc3f7' : 'var(--text-secondary)',
              }}
            >
              {opt.icon} {opt.label}
            </button>
          );
        })}
      </div>

      {/* Free tier limit message */}
      {atFreeLimit && (
        <p
          className="font-[family-name:var(--font-inter)] text-[11px]"
          style={{ color: 'var(--text-muted)' }}
        >
          Pro unlocks unlimited ambient layers
        </p>
      )}

      {/* Per-layer volume controls */}
      <AnimatePresence>
        {ambientLayers.map((layer) => {
          const opt = getAmbientOption(layer.id);
          if (!opt) return null;
          return (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className="flex items-center gap-2 py-2 px-3 rounded-xl"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <span className="text-sm flex-shrink-0">{opt.icon}</span>
                <span
                  className="font-[family-name:var(--font-inter)] text-xs flex-shrink-0 w-12"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {opt.label}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={layer.volume}
                  onChange={(e) => onUpdateLayerVolume(layer.id, Number(e.target.value))}
                  className="flex-1 h-5"
                  style={{ '--color-pulse-cyan': '#4fc3f7' } as React.CSSProperties}
                  aria-label={`${opt.label} volume`}
                />
                <span
                  className="font-[family-name:var(--font-jetbrains)] text-[10px] w-8 text-right flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {layer.volume}%
                </span>
                <button
                  onClick={() => onRemoveLayer(layer.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-full text-xs transition-colors flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={`Remove ${opt.label}`}
                >
                  {"×"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
