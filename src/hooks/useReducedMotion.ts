'use client';

import { useState, useEffect } from 'react';
import { getSettings } from '@/lib/settings';

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [settingsReduced, setSettingsReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Sync app settings on storage changes and window focus
  useEffect(() => {
    const sync = () => setSettingsReduced(getSettings().reducedMotion);
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  return prefersReduced || settingsReduced;
}
