'use client';

import { useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { getPresetsByCategory } from '@/lib/presets';
import { usePreview } from '@/hooks/usePreview';
import PresetCard from './PresetCard';
import PreviewBar, { MINI_PLAYER_HEIGHT, PREVIEW_BAR_HEIGHT } from './PreviewBar';
import type { Preset } from '@/types';

interface PresetGridProps {
  miniPlayerVisible?: boolean;
}

export default function PresetGrid({ miniPlayerVisible = false }: PresetGridProps) {
  const { selectedCategory } = useAppState();
  const dispatch = useAppDispatch();
  const presets = getPresetsByCategory(selectedCategory);
  const { previewingId, previewingPreset, progress, startPreview, stopPreview } = usePreview();

  const handleSelect = (preset: Preset) => {
    dispatch({ type: 'SET_ACTIVE_PRESET', payload: preset });
    dispatch({ type: 'SET_SESSION_DURATION', payload: preset.defaultDuration });
    dispatch({ type: 'SET_SHOW_PLAYER', payload: true });
  };

  const handlePreviewToggle = useCallback((preset: Preset) => {
    if (previewingId === preset.id) {
      stopPreview();
    } else {
      startPreview(preset);
    }
  }, [previewingId, startPreview, stopPreview]);

  const isPreviewing = previewingId !== null;

  // Calculate bottom padding: base 16px + bars that are visible
  const basePad = 16;
  const miniPad = miniPlayerVisible ? MINI_PLAYER_HEIGHT : 0;
  const previewPad = isPreviewing ? PREVIEW_BAR_HEIGHT : 0;
  const gridPaddingBottom = basePad + miniPad + previewPad;

  // PreviewBar stacks above MiniPlayer when both visible
  const previewBottomOffset = miniPlayerVisible ? MINI_PLAYER_HEIGHT : 0;

  return (
    <>
      <div className="px-4" style={{ paddingBottom: gridPaddingBottom }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {presets.map((preset, i) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              index={i}
              onSelect={handleSelect}
              previewingId={previewingId}
              previewProgress={progress}
              onPreviewToggle={handlePreviewToggle}
              onStopPreview={stopPreview}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {previewingPreset && (
          <PreviewBar
            preset={previewingPreset}
            progress={progress}
            onStop={stopPreview}
            bottomOffset={previewBottomOffset}
          />
        )}
      </AnimatePresence>
    </>
  );
}
