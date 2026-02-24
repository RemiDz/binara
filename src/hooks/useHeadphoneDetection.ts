'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseHeadphoneDetectionReturn {
  headphonesConnected: boolean | null;
  dismissed: boolean;
  dismiss: () => void;
}

export function useHeadphoneDetection(): UseHeadphoneDetectionReturn {
  const [headphonesConnected, setHeadphonesConnected] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const checkDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setHeadphonesConnected(null);
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');
      // If we find more than one audio output, or one with a label suggesting headphones,
      // consider headphones connected. If only one generic output, likely speakers only.
      if (audioOutputs.length === 0) {
        setHeadphonesConnected(null);
        return;
      }
      const hasHeadphones = audioOutputs.some(
        (d) =>
          d.label.toLowerCase().includes('headphone') ||
          d.label.toLowerCase().includes('earphone') ||
          d.label.toLowerCase().includes('airpod') ||
          d.label.toLowerCase().includes('buds') ||
          d.label.toLowerCase().includes('bluetooth')
      ) || audioOutputs.length > 1;
      setHeadphonesConnected(hasHeadphones);
    } catch {
      setHeadphonesConnected(null);
    }
  }, []);

  useEffect(() => {
    checkDevices();

    const handler = () => checkDevices();
    navigator.mediaDevices?.addEventListener('devicechange', handler);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handler);
    };
  }, [checkDevices]);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('binara_headphone_dismissed');
    if (wasDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem('binara_headphone_dismissed', 'true');
  }, []);

  return { headphonesConnected, dismissed, dismiss };
}
