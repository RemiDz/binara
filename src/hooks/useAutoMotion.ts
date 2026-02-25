'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { AutoMotionEngine, type AutoMotionState } from '@/lib/auto-motion-engine';

export interface UseAutoMotionReturn {
  active: boolean;
  state: AutoMotionState;
  intensity: number;
  start: () => void;
  stop: () => void;
  setIntensity: (value: number) => void;
  getTiltFrequency: () => number;
  getTiltStereoWidth: () => number;
}

export function useAutoMotion(): UseAutoMotionReturn {
  const engineRef = useRef<AutoMotionEngine | null>(null);
  const [motionState, setMotionState] = useState<AutoMotionState>(() => ({
    pitch: 0,
    roll: 0,
    active: false,
    intensity: 50,
  }));

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new AutoMotionEngine();
    }
    return engineRef.current;
  }, []);

  useEffect(() => {
    const engine = getEngine();
    setMotionState(engine.getState());

    const unsub = engine.subscribe((state) => {
      setMotionState(state);
    });

    return () => {
      unsub();
      engine.destroy();
      engineRef.current = null;
    };
  }, [getEngine]);

  const start = useCallback(() => {
    getEngine().start();
  }, [getEngine]);

  const stop = useCallback(() => {
    getEngine().stop();
  }, [getEngine]);

  const setIntensity = useCallback((value: number) => {
    getEngine().setIntensity(value);
  }, [getEngine]);

  const getTiltFrequency = useCallback(() => {
    return getEngine().getTiltFrequency();
  }, [getEngine]);

  const getTiltStereoWidth = useCallback(() => {
    return getEngine().getTiltStereoWidth();
  }, [getEngine]);

  return {
    active: motionState.active,
    state: motionState,
    intensity: motionState.intensity,
    start,
    stop,
    setIntensity,
    getTiltFrequency,
    getTiltStereoWidth,
  };
}
