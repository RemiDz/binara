'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { SensorEngine, type SensorState, type SensorConfig } from '@/lib/sensor-engine';

export interface UseSensorsReturn {
  available: boolean;
  permissionGranted: boolean;
  active: boolean;
  state: SensorState;
  config: SensorConfig;
  requestPermission: () => Promise<boolean>;
  start: (config?: Partial<SensorConfig>) => void;
  stop: () => void;
  updateConfig: (config: Partial<SensorConfig>) => void;
  getTiltFrequency: () => number;
  getTiltStereoWidth: () => number;
}

export function useSensors(): UseSensorsReturn {
  const engineRef = useRef<SensorEngine | null>(null);
  const [sensorState, setSensorState] = useState<SensorState>(() => ({
    pitch: 0,
    roll: 0,
    acceleration: { x: 0, y: 0, z: 0 },
    motionMagnitude: 0,
    isStill: true,
    breathRate: 0,
    isFaceDown: false,
    available: false,
    permissionGranted: false,
    active: false,
  }));

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new SensorEngine();
    }
    return engineRef.current;
  }, []);

  // Subscribe to sensor state changes
  useEffect(() => {
    const engine = getEngine();
    setSensorState(engine.getState());

    const unsub = engine.subscribe((state) => {
      setSensorState(state);
    });

    return () => {
      unsub();
      engine.stop();
    };
  }, [getEngine]);

  const requestPermission = useCallback(async () => {
    return getEngine().requestPermission();
  }, [getEngine]);

  const start = useCallback((config?: Partial<SensorConfig>) => {
    getEngine().start(config);
  }, [getEngine]);

  const stop = useCallback(() => {
    getEngine().stop();
  }, [getEngine]);

  const updateConfig = useCallback((config: Partial<SensorConfig>) => {
    getEngine().updateConfig(config);
  }, [getEngine]);

  const getTiltFrequency = useCallback(() => {
    return getEngine().getTiltFrequency();
  }, [getEngine]);

  const getTiltStereoWidth = useCallback(() => {
    return getEngine().getTiltStereoWidth();
  }, [getEngine]);

  return {
    available: sensorState.available,
    permissionGranted: sensorState.permissionGranted,
    active: sensorState.active,
    state: sensorState,
    config: getEngine().getConfig(),
    requestPermission,
    start,
    stop,
    updateConfig,
    getTiltFrequency,
    getTiltStereoWidth,
  };
}
