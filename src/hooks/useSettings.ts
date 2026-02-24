'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '@/lib/settings';
import type { AppSettings } from '@/lib/settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);

  // Sync from localStorage on mount
  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
