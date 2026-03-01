'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { exportSession, downloadBlob, estimateFileSize, type ExportConfig } from '@/lib/audio-export';
import { trackEvent } from '@/lib/analytics';
import type { AdvancedSessionConfig, MixConfig } from '@/types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionType: 'advanced' | 'mix';
  advancedConfig?: AdvancedSessionConfig;
  mixConfig?: MixConfig;
  sessionName: string;
  volume: number;
}

const DURATION_PILLS = [5, 10, 15, 20, 30, 60];

export default function ExportModal({
  isOpen,
  onClose,
  sessionType,
  advancedConfig,
  mixConfig,
  sessionName,
  volume,
}: ExportModalProps) {
  const [durationMin, setDurationMin] = useState(5);
  const [customDuration, setCustomDuration] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const cancelledRef = useRef(false);

  const effectiveDuration = useCustom ? (Number(customDuration) || 5) : durationMin;
  const durationSec = effectiveDuration * 60;
  const fileSizeMB = estimateFileSize(durationSec);

  const handleExport = useCallback(async () => {
    cancelledRef.current = false;
    setRendering(true);
    setProgress(0);
    trackEvent('Export Start', { mode: sessionType, duration: effectiveDuration });

    const config: ExportConfig = {
      format: 'wav',
      duration: durationSec,
      sampleRate: 44100,
      type: sessionType,
      advancedConfig,
      mixConfig,
      volume,
    };

    try {
      const blob = await exportSession(config, (p) => {
        if (!cancelledRef.current) {
          setProgress(p);
        }
      });

      if (cancelledRef.current) return;

      if (blob) {
        const filename = `${sessionName.replace(/[^a-zA-Z0-9]/g, '_')}_${effectiveDuration}min.wav`;
        downloadBlob(blob, filename);
        trackEvent('Export Complete', { mode: sessionType, duration: effectiveDuration, file_size_mb: fileSizeMB });
      }

      onClose();
    } catch {
      // OfflineAudioContext or rendering failed
    } finally {
      setRendering(false);
      setProgress(0);
    }
  }, [durationSec, sessionType, advancedConfig, mixConfig, volume, sessionName, effectiveDuration, onClose]);

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    setRendering(false);
    setProgress(0);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={rendering ? undefined : onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{
              background: 'linear-gradient(180deg, rgba(15, 18, 35, 0.98) 0%, rgba(8, 10, 22, 0.98) 100%)',
              border: '1px solid rgba(121, 134, 203, 0.15)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="font-[family-name:var(--font-playfair)] text-lg"
                style={{ color: 'var(--text-primary)' }}
              >
                Export Session
              </h3>
              {!rendering && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {rendering ? (
              /* Progress state */
              <div className="space-y-4 py-4">
                <div className="text-center space-y-1">
                  <p
                    className="font-[family-name:var(--font-inter)] text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Rendering audio...
                  </p>
                  <p
                    className="font-[family-name:var(--font-jetbrains)] text-xs"
                    style={{ color: '#7986cb' }}
                  >
                    {Math.round(progress * 100)}%
                  </p>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: '#7986cb' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <button
                  onClick={handleCancel}
                  className="w-full py-2.5 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                {/* Format selector */}
                <div className="space-y-1.5">
                  <span
                    className="font-[family-name:var(--font-inter)] text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Format
                  </span>
                  <div className="flex gap-2">
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-[family-name:var(--font-inter)] font-medium"
                      style={{
                        background: 'rgba(121, 134, 203, 0.15)',
                        border: '1px solid rgba(121, 134, 203, 0.3)',
                        color: '#7986cb',
                      }}
                    >
                      WAV
                    </span>
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-[family-name:var(--font-inter)] font-medium opacity-30"
                      style={{
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      MP3
                    </span>
                  </div>
                </div>

                {/* Duration selector */}
                <div className="space-y-1.5">
                  <span
                    className="font-[family-name:var(--font-inter)] text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Duration
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {DURATION_PILLS.map((d) => (
                      <button
                        key={d}
                        onClick={() => { setDurationMin(d); setUseCustom(false); }}
                        className="px-3 py-1.5 rounded-full text-xs font-[family-name:var(--font-inter)] font-medium transition-all"
                        style={{
                          background: !useCustom && durationMin === d ? 'rgba(121, 134, 203, 0.15)' : 'var(--glass-bg)',
                          border: `1px solid ${!useCustom && durationMin === d ? 'rgba(121, 134, 203, 0.3)' : 'var(--glass-border)'}`,
                          color: !useCustom && durationMin === d ? '#7986cb' : 'var(--text-secondary)',
                        }}
                      >
                        {d} min
                      </button>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={customDuration}
                        onChange={(e) => { setCustomDuration(e.target.value); setUseCustom(true); }}
                        placeholder="Custom"
                        className="w-16 px-2 py-1.5 rounded-full text-xs font-[family-name:var(--font-jetbrains)] bg-transparent text-center outline-none"
                        style={{
                          border: `1px solid ${useCustom ? 'rgba(121, 134, 203, 0.3)' : 'var(--glass-border)'}`,
                          color: 'var(--text-primary)',
                        }}
                        min={1}
                        max={120}
                      />
                      <span className="text-[10px] font-[family-name:var(--font-jetbrains)]" style={{ color: 'var(--text-muted)' }}>min</span>
                    </div>
                  </div>
                </div>

                {/* File size estimate */}
                <div className="flex items-center justify-between py-1">
                  <span
                    className="font-[family-name:var(--font-inter)] text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Estimated file size
                  </span>
                  <span
                    className="font-[family-name:var(--font-jetbrains)] text-xs"
                    style={{ color: fileSizeMB > 500 ? '#ff7043' : 'var(--text-secondary)' }}
                  >
                    {fileSizeMB.toFixed(0)} MB
                  </span>
                </div>

                {fileSizeMB > 500 && (
                  <p className="font-[family-name:var(--font-inter)] text-[10px]" style={{ color: '#ff7043' }}>
                    Large file! Export may use significant memory.
                  </p>
                )}

                {/* Export button */}
                <button
                  onClick={handleExport}
                  className="w-full py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                  style={{
                    background: 'rgba(121, 134, 203, 0.2)',
                    border: '1px solid rgba(121, 134, 203, 0.4)',
                    color: '#7986cb',
                  }}
                >
                  {"Export WAV"}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
