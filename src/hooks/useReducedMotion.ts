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

  // Check app settings periodically (settings can change without re-mount)
  useEffect(() => {
    setSettingsReduced(getSettings().reducedMotion);

    const interval = setInterval(() => {
      setSettingsReduced(getSettings().reducedMotion);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return prefersReduced || settingsReduced;
}
