'use client';

import Panel from './Panel';
import AmbientMixer from '../mix/AmbientMixer';

interface AdvancedAmbientPanelProps {
  layers: { id: string; volume: number }[];
  onToggle: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onLimitReached: () => void;
}

export default function AdvancedAmbientPanel({ layers, onToggle, onVolumeChange, onLimitReached }: AdvancedAmbientPanelProps) {
  return (
    <Panel title="Ambient" subtitle={layers.length > 0 ? `${layers.length} active` : 'None'}>
      <AmbientMixer
        layers={layers}
        onToggle={onToggle}
        onVolumeChange={onVolumeChange}
        onLimitReached={onLimitReached}
      />
    </Panel>
  );
}
