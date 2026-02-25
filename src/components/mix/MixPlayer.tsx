'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { getBrainwaveState } from '@/lib/brainwave-states';
import { getCarrierTone } from '@/lib/carrier-tones';
import type { MixConfig } from '@/types';
import { useProContext } from '@/context/ProContext';
import BackgroundVisualiser from '../BackgroundVisualiser';
import SessionTimer from '../SessionTimer';
import VolumeSlider from '../VolumeSlider';
import SensorControl from '../SensorControl';
import AutoMotionControl from '../AutoMotionControl';
import FaceDownOverlay from '../FaceDownOverlay';
import ExportModal from '../ExportModal';
import ShareButton from '../ShareButton';
import { useSensors } from '@/hooks/useSensors';

interface MixPlayerProps {
  config: MixConfig;
  isPlaying: boolean;
  isPaused: boolean;
  elapsedTime: number;
  sessionDuration: number;
  volume: number;
  mixPhase: 'easeIn' | 'deep' | 'easeOut' | null;
  mixPhaseProgress: number;
  mixBeatFreq: number;
  onBack: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onVolumeChange: (vol: number) => void;
  onSensorFrequencyChange?: (freq: number) => void;
}

const PHASE_LABELS: Record<string, string> = {
  easeIn: 'Ease In',
  deep: 'Deep Session',
  easeOut: 'Ease Out',
};

export default function MixPlayer({
  config,
  isPlaying,
  isPaused,
  elapsedTime,
  sessionDuration,
  volume,
  mixPhase,
  mixPhaseProgress,
  mixBeatFreq,
  onBack,
  onPause,
  onResume,
  onStop,
  onVolumeChange,
  onSensorFrequencyChange,
}: MixPlayerProps) {
  const sensors = useSensors();
  const { isPro } = useProContext();
  const [showExport, setShowExport] = useState(false);
  const bwState = getBrainwaveState(config.stateId);
  const carrier = getCarrierTone(config.carrierId);
  const stateColor = bwState?.color ?? '#4fc3f7';
  const displayBeatFreq = mixBeatFreq > 0 ? mixBeatFreq : bwState?.beatFreq ?? 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 min-h-dvh flex flex-col overflow-hidden"
    >
      {/* Background visualiser */}
      <BackgroundVisualiser
        beatFrequency={displayBeatFreq}
        isPlaying={isPlaying && !isPaused}
        color={stateColor}
      />

      {/* Content layer */}
      <div className="relative z-[1] flex flex-col min-h-dvh">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ paddingTop: 'calc(var(--safe-area-top) + 12px)' }}
        >
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full glass-hover transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-1">
            <ShareButton
              session={{ type: 'mix', config }}
              sessionName={bwState?.label ?? 'Mix Session'}
            />
            {isPro && (
              <button
                onClick={() => setShowExport(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full glass-hover transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Export"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
          {/* Session info */}
          <div className="text-center space-y-0.5">
            <h2
              className="font-[family-name:var(--font-playfair)] text-xl"
              style={{ color: 'var(--text-primary)' }}
            >
              {bwState?.label ?? 'Custom Mix'}
            </h2>
            <p
              className="font-[family-name:var(--font-jetbrains)] text-[11px]"
              style={{ color: stateColor }}
            >
              {carrier?.label} {"·"} {carrier?.frequency} Hz {"·"} Beat: {displayBeatFreq.toFixed(1)} Hz
            </p>
          </div>

          {/* Phase indicator */}
          {mixPhase && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="font-[family-name:var(--font-inter)] text-xs font-medium"
                  style={{ color: stateColor }}
                >
                  {PHASE_LABELS[mixPhase]}
                </span>
                <span
                  className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {Math.round(mixPhaseProgress * 100)}%
                </span>
              </div>

              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 linear"
                  style={{
                    width: `${mixPhaseProgress * 100}%`,
                    background: stateColor,
                    opacity: 0.7,
                  }}
                />
              </div>

              <div className="flex items-center justify-center gap-2">
                {(['easeIn', 'deep', 'easeOut'] as const).map((phase) => (
                  <div key={phase} className="flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: mixPhase === phase ? stateColor : 'rgba(255,255,255,0.15)',
                        boxShadow: mixPhase === phase ? `0 0 6px ${stateColor}60` : 'none',
                      }}
                    />
                    <span
                      className="font-[family-name:var(--font-jetbrains)] text-[9px]"
                      style={{ color: mixPhase === phase ? stateColor : 'var(--text-muted)' }}
                    >
                      {PHASE_LABELS[phase]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timer */}
          <SessionTimer
            elapsedTime={elapsedTime}
            sessionDuration={sessionDuration}
            color={stateColor}
          />

          {/* Volume */}
          <VolumeSlider
            value={volume}
            onChange={onVolumeChange}
            color={stateColor}
            label="Volume"
          />

          {/* Sensor control */}
          <SensorControl
            onFrequencyChange={onSensorFrequencyChange}
            color={stateColor}
          />

          {/* Auto Motion control */}
          <AutoMotionControl
            onFrequencyChange={onSensorFrequencyChange}
            color={stateColor}
          />

          {/* Controls */}
          <div className="flex flex-col gap-2 items-center">
            {isPlaying && !isPaused && (
              <>
                <button
                  onClick={onPause}
                  className="w-full max-w-xs py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                  style={{
                    background: `${stateColor}20`,
                    border: `1px solid ${stateColor}40`,
                    color: stateColor,
                  }}
                >
                  {"⏸ Pause"}
                </button>
                <button
                  onClick={onStop}
                  className="w-full max-w-xs py-2.5 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {"⏹ Stop"}
                </button>
              </>
            )}

            {isPaused && (
              <>
                <button
                  onClick={onResume}
                  className="w-full max-w-xs py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                  style={{
                    background: `${stateColor}20`,
                    border: `1px solid ${stateColor}40`,
                    color: stateColor,
                  }}
                >
                  {"▶ Resume"}
                </button>
                <button
                  onClick={onStop}
                  className="w-full max-w-xs py-2.5 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {"⏹ Stop"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <FaceDownOverlay isActive={sensors.active && sensors.state.isFaceDown} />
      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        sessionType="mix"
        mixConfig={config}
        sessionName={bwState?.label ?? 'Mix Session'}
        volume={volume}
      />
    </motion.div>
  );
}
