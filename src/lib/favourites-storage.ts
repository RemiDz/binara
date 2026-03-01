import type { MixConfig, AdvancedSessionConfig } from '@/types';

export interface FavouriteItem {
  id: string;
  type: 'listen' | 'mix' | 'create';
  name: string;
  timestamp: number;
  presetId?: string;
  config?: MixConfig | AdvancedSessionConfig;
}

const STORAGE_KEY = 'binara_favourites';
const MAX_FREE = 5;

export function loadFavourites(): FavouriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveFavourites(items: FavouriteItem[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* QuotaExceededError */ }
}

export function isFavourite(id: string): boolean {
  return loadFavourites().some((f) => f.id === id);
}

export function isPresetFavourited(presetId: string): boolean {
  return loadFavourites().some((f) => f.type === 'listen' && f.presetId === presetId);
}

export function toggleListenFavourite(
  presetId: string,
  presetName: string,
  isPro: boolean,
): { success: boolean; favourited: boolean; error?: string } {
  const items = loadFavourites();
  const idx = items.findIndex((f) => f.type === 'listen' && f.presetId === presetId);

  if (idx >= 0) {
    items.splice(idx, 1);
    saveFavourites(items);
    return { success: true, favourited: false };
  }

  if (!isPro && items.length >= MAX_FREE) {
    return { success: false, favourited: false, error: 'Upgrade to PRO for unlimited favourites' };
  }

  items.push({
    id: presetId,
    type: 'listen',
    name: presetName,
    timestamp: Date.now(),
    presetId,
  });
  saveFavourites(items);
  return { success: true, favourited: true };
}

export function saveMixFavourite(
  name: string,
  config: MixConfig,
  isPro: boolean,
): { success: boolean; error?: string } {
  const items = loadFavourites();
  if (!isPro && items.length >= MAX_FREE) {
    return { success: false, error: 'Upgrade to PRO for unlimited favourites' };
  }

  items.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: 'mix',
    name,
    timestamp: Date.now(),
    config,
  });
  saveFavourites(items);
  return { success: true };
}

export function saveCreateFavourite(
  name: string,
  config: AdvancedSessionConfig,
  isPro: boolean,
): { success: boolean; error?: string } {
  const items = loadFavourites();
  if (!isPro && items.length >= MAX_FREE) {
    return { success: false, error: 'Upgrade to PRO for unlimited favourites' };
  }

  items.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: 'create',
    name,
    timestamp: Date.now(),
    config,
  });
  saveFavourites(items);
  return { success: true };
}

export function removeFavourite(id: string): void {
  const items = loadFavourites().filter((f) => f.id !== id);
  saveFavourites(items);
}

export function getFavouritePresetIds(): string[] {
  return loadFavourites()
    .filter((f) => f.type === 'listen' && f.presetId)
    .map((f) => f.presetId!);
}
