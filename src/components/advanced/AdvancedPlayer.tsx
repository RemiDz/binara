'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import type { AdvancedSessionConfig } from '@/types';
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

function getBrainwaveColor(freq: number): string {
  if (freq <= 4) return '#1a237e';
  if (freq <= 8) return '#7986cb';
  if (freq <= 12) return '#4fc3f7';
  if (freq <= 30) return '#ffab40';
  return '#e040fb';
}

function getBrainwaveLabel(freq: number): string {
  if (freq <= 4) return 'Delta';
  if (freq <= 8) return 'Theta';
  if (freq <= 12) return 'Alpha';
  if (freq <= 30) return 'Beta';
  return 'Gamma';
}

interface AdvancedPlayerProps {
  config: AdvancedSessionConfig;
  isPlaying: boolean;
  isPaused: boolean;
  elapsedTime: number;
  sessionDuration: number;
  volume: number;
  phaseIndex: number;
  phaseName: string;
  phaseProgress: number;
  beatFreqs: number[];
  onBack: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onVolumeChange: (vol: number) => void;
  onSensorFrequencyChange?: (freq: number) => void;
  onSensorStereoWidthChange?: (width: number) => void;
}

export default function AdvancedPlayer({
  config,
  isPlaying,
  isPaused,
  elapsedTime,
  sessionDuration,
  volume,
  phaseIndex,
  phaseName,
  phaseProgress,
  beatFreqs,
  onBack,
  onPause,
  onResume,
  onStop,
  onVolumeChange,
  onSensorFrequencyChange,
  onSensorStereoWidthChange,
}: AdvancedPlayerProps) {
  const sensors = useSensors();
  const { isPro } = useProContext();
  const [showExport, setShowExport] = useState(false);
  const primaryBeatFreq = beatFreqs[0] ?? config.layers[0]?.beatFreq ?? 10;
  const primaryColor = getBrainwaveColor(primaryBeatFreq);

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
        beatFrequency={primaryBeatFreq}
        isPlaying={isPlaying && !isPaused}
        color={primaryColor}
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
              session={{ type: 'advanced', config }}
              sessionName="Advanced Session"
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
              Advanced Session
            </h2>
            <p
              className="font-[family-name:var(--font-jetbrains)] text-[11px]"
              style={{ color: '#7986cb' }}
            >
              {config.layers.length} layer{config.layers.length !== 1 ? 's' : ''}
              {config.filter.enabled ? ' · Filter' : ''}
              {config.lfo.enabled ? ' · LFO' : ''}
              {config.isochronic.enabled ? ' · Iso' : ''}
            </p>
          </div>

          {/* Per-layer readouts */}
          <div className="flex flex-wrap justify-center gap-2">
            {config.layers.map((layer, i) => {
              const freq = beatFreqs[i] ?? layer.beatFreq;
              return (
                <div
                  key={layer.id}
                  className="px-2.5 py-1 rounded-lg"
                  style={{
                    background: `${getBrainwaveColor(freq)}15`,
                    border: `1px solid ${getBrainwaveColor(freq)}30`,
                  }}
                >
                  <span
                    className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                    style={{ color: getBrainwaveColor(freq) }}
                  >
                    L{i + 1}: {freq.toFixed(1)} Hz {getBrainwaveLabel(freq)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Active effects badges */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {config.filter.enabled && (
              <Badge label={`Filter: ${config.filter.type}`} color="#4fc3f7" />
            )}
            {config.lfo.enabled && (
              <Badge label={`LFO: ${config.lfo.target}`} color="#e040fb" />
            )}
            {config.isochronic.enabled && (
              <Badge label={`Iso: ${config.isochronic.pulseRate}Hz`} color="#ff7043" />
            )}
          </div>

          {/* Phase indicator */}
          {config.timeline.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="font-[family-name:var(--font-inter)] text-xs font-medium"
                  style={{ color: '#7986cb' }}
                >
                  {phaseName}
                </span>
                <span
                  className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {Math.round(phaseProgress * 100)}%
                </span>
              </div>

              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 linear"
                  style={{
                    width: `${phaseProgress * 100}%`,
                    background: '#7986cb',
                    opacity: 0.7,
                  }}
                />
              </div>

              <div className="flex items-center justify-center gap-2">
                {config.timeline.map((phase, i) => (
                  <div key={phase.id} className="flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: phaseIndex === i ? '#7986cb' : i < phaseIndex ? 'rgba(121, 134, 203, 0.4)' : 'rgba(255,255,255,0.15)',
                        boxShadow: phaseIndex === i ? '0 0 6px rgba(121, 134, 203, 0.6)' : 'none',
                      }}
                    />
                    <span
                      className="font-[family-name:var(--font-jetbrains)] text-[9px]"
                      style={{ color: phaseIndex === i ? '#7986cb' : 'var(--text-muted)' }}
                    >
                      {phase.name}
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
            color="#7986cb"
          />

          {/* Volume */}
          <VolumeSlider
            value={volume}
            onChange={onVolumeChange}
            color="#7986cb"
            label="Volume"
          />

          {/* Sensor control */}
          <SensorControl
            onFrequencyChange={onSensorFrequencyChange}
            onStereoWidthChange={onSensorStereoWidthChange}
            color="#7986cb"
          />

          {/* Auto Motion control */}
          <AutoMotionControl
            onFrequencyChange={onSensorFrequencyChange}
            onStereoWidthChange={onSensorStereoWidthChange}
            color="#7986cb"
          />

          {/* Controls */}
          <div className="flex flex-col gap-2 items-center">
            {isPlaying && !isPaused && (
              <>
                <button
                  onClick={onPause}
                  className="w-full max-w-xs py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                  style={{
                    background: 'rgba(121, 134, 203, 0.2)',
                    border: '1px solid rgba(121, 134, 203, 0.4)',
                    color: '#7986cb',
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
                    background: 'rgba(121, 134, 203, 0.2)',
                    border: '1px solid rgba(121, 134, 203, 0.4)',
                    color: '#7986cb',
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
        sessionType="advanced"
        advancedConfig={config}
        sessionName="Advanced Session"
        volume={volume}
      />
    </motion.div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-md font-[family-name:var(--font-jetbrains)] text-[9px]"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}25`,
        color,
      }}
    >
      {label}
    </span>
  );
}
