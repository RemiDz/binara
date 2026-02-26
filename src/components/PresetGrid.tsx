'use client';

import { useCallback, useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { useProContext } from '@/context/ProContext';
import { getPresetsByCategory } from '@/lib/presets';
import { getFavouritePresetIds, toggleListenFavourite, loadFavourites } from '@/lib/favourites-storage';
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
  const { isPro } = useProContext();
  const [favouriteIds, setFavouriteIds] = useState<string[]>(() => getFavouritePresetIds());
  const presets = getPresetsByCategory(selectedCategory, favouriteIds);
  const { previewingId, previewingPreset, progress, startPreview, stopPreview } = usePreview();

  // Refresh favourites from localStorage on mount and when category changes
  useEffect(() => {
    setFavouriteIds(getFavouritePresetIds());
  }, [selectedCategory]);

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

  const handleToggleFavourite = useCallback((presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    const name = preset?.name ?? presetId;
    const result = toggleListenFavourite(presetId, name, isPro);
    if (result.success) {
      setFavouriteIds(getFavouritePresetIds());
    } else if (result.error) {
      dispatch({ type: 'SET_TOAST', payload: result.error });
      window.dispatchEvent(new Event('binara:open-pro-upgrade'));
    }
  }, [presets, isPro, dispatch]);

  const isPreviewing = previewingId !== null;
  const favourites = loadFavourites();
  const hasMixOrCreateFavs = favourites.some((f) => f.type === 'mix' || f.type === 'create');

  // Calculate bottom padding: base 16px + bars that are visible
  const basePad = 16;
  const miniPad = miniPlayerVisible ? MINI_PLAYER_HEIGHT : 0;
  const previewPad = isPreviewing ? PREVIEW_BAR_HEIGHT : 0;
  const gridPaddingBottom = basePad + miniPad + previewPad;

  // PreviewBar stacks above MiniPlayer when both visible
  const previewBottomOffset = miniPlayerVisible ? MINI_PLAYER_HEIGHT : 0;

  // Empty favourites state
  const showEmptyState = selectedCategory === 'favourites' && presets.length === 0 && !hasMixOrCreateFavs;

  return (
    <>
      <div className="px-4" style={{ paddingBottom: gridPaddingBottom }}>
        {showEmptyState ? (
          <div className="max-w-5xl mx-auto text-center py-12">
            <p
              className="font-[family-name:var(--font-inter)] text-sm"
              style={{ color: 'var(--text-muted)', opacity: 0.6 }}
            >
              {"No favourites yet. Tap the \u2665 on any preset to save it here."}
            </p>
          </div>
        ) : (
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
                isFavourited={favouriteIds.includes(preset.id)}
                onToggleFavourite={handleToggleFavourite}
              />
            ))}
          </div>
        )}
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
