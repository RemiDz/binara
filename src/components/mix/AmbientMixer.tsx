'use client';

import { AMBIENT_OPTIONS } from '@/lib/constants';
import { useProContext } from '@/context/ProContext';
import VolumeSlider from '../VolumeSlider';
import { AnimatePresence, motion } from 'motion/react';

const MAX_FREE_LAYERS = 2;

interface AmbientLayer {
  id: string;
  volume: number;
}

interface AmbientMixerProps {
  layers: AmbientLayer[];
  onToggle: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onLimitReached: () => void;
}

export default function AmbientMixer({ layers, onToggle, onVolumeChange, onLimitReached }: AmbientMixerProps) {
  const { isPro } = useProContext();
  const activeIds = new Set(layers.map((l) => l.id));
  const maxLayers = isPro ? Infinity : MAX_FREE_LAYERS;

  const handleToggle = (id: string) => {
    if (activeIds.has(id)) {
      onToggle(id);
    } else if (layers.length >= maxLayers) {
      onLimitReached();
    } else {
      onToggle(id);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3
            className="font-[family-name:var(--font-inter)] font-medium text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            {"3. Ambient Layers"}
          </h3>
          <p className="font-[family-name:var(--font-inter)] text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Add background sounds (optional)
          </p>
        </div>
        {!isPro && (
          <span
            className="font-[family-name:var(--font-jetbrains)] text-[10px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {layers.length}/{MAX_FREE_LAYERS}
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {AMBIENT_OPTIONS.map((opt) => {
          const isActive = activeIds.has(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => handleToggle(opt.id)}
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

      <AnimatePresence>
        {layers.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-3"
          >
            <p
              className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-wider pt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Active Layers
            </p>
            {layers.map((layer) => {
              const opt = AMBIENT_OPTIONS.find((o) => o.id === layer.id);
              return (
                <div key={layer.id} className="flex items-center gap-2">
                  <span className="text-sm flex-shrink-0 w-6">{opt?.icon}</span>
                  <span
                    className="font-[family-name:var(--font-inter)] text-xs flex-shrink-0 w-12"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {opt?.label}
                  </span>
                  <div className="flex-1">
                    <VolumeSlider
                      value={layer.volume}
                      onChange={(v) => onVolumeChange(layer.id, v)}
                    />
                  </div>
                  <span
                    className="font-[family-name:var(--font-jetbrains)] text-[10px] flex-shrink-0 w-8 text-right"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {layer.volume}%
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
