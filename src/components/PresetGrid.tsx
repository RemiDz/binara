'use client';

import { useAppState, useAppDispatch } from '@/context/AppContext';
import { getPresetsByCategory } from '@/lib/presets';
import PresetCard from './PresetCard';
import type { Preset } from '@/types';

export default function PresetGrid() {
  const { selectedCategory } = useAppState();
  const dispatch = useAppDispatch();
  const presets = getPresetsByCategory(selectedCategory);

  const handleSelect = (preset: Preset) => {
    dispatch({ type: 'SET_ACTIVE_PRESET', payload: preset });
    dispatch({ type: 'SET_SESSION_DURATION', payload: preset.defaultDuration });
    dispatch({ type: 'SET_SHOW_PLAYER', payload: true });
  };

  return (
    <div className="px-4 pb-28">
      <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {presets.map((preset, i) => (
          <PresetCard key={preset.id} preset={preset} index={i} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
