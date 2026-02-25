'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProContext } from '@/context/ProContext';
import OscillatorPanel from './OscillatorPanel';
import FilterPanel from './FilterPanel';
import StereoPanel from './StereoPanel';
import LFOPanel from './LFOPanel';
import IsochronicPanel from './IsochronicPanel';
import AdvancedAmbientPanel from './AdvancedAmbientPanel';
import TimelineEditor from './TimelineEditor';
import FrequencyGraph from './FrequencyGraph';
import AdvancedSummary from './AdvancedSummary';
import PreviewBar from './PreviewBar';
import type { AdvancedSessionConfig, BeatLayer, FilterConfig, LFOConfig, IsochronicConfig, StereoConfig, AdvancedTimelinePhase, SavedAdvancedSession } from '@/types';
import { createDefaultAdvancedConfig, createDefaultBeatLayer } from '@/types';
import { loadAdvancedSessions, saveAdvancedSession, deleteAdvancedSession } from '@/lib/session-storage';
import type { UseAudioEngineReturn } from '@/hooks/useAudioEngine';

interface AdvancedBuilderProps {
  onStartSession: (config: AdvancedSessionConfig) => void;
  onStartPreview: (config: AdvancedSessionConfig) => Promise<void>;
  onStopPreview: () => void;
  onPreviewTone: (frequency: number) => Promise<void>;
  onLimitReached: (message: string) => void;
  audio: UseAudioEngineReturn;
}

export default function AdvancedBuilder({
  onStartSession,
  onStartPreview,
  onStopPreview,
  onPreviewTone,
  onLimitReached,
  audio,
}: AdvancedBuilderProps) {
  const [config, setConfig] = useState<AdvancedSessionConfig>(createDefaultAdvancedConfig);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [sessions, setSessions] = useState<SavedAdvancedSession[]>(() => loadAdvancedSessions());
  const { isPro } = useProContext();

  // ─── Preview state ───
  const [preview, setPreview] = useState({ isActive: false, isMuted: false, volume: 50 });
  const previewActiveRef = useRef(false);
  const transitioningRef = useRef(false);
  const configRef = useRef(config);
  configRef.current = config;

  // Cleanup preview on unmount (but not during session transition)
  useEffect(() => {
    return () => {
      if (previewActiveRef.current && !transitioningRef.current) {
        onStopPreview();
      }
    };
  }, [onStopPreview]);

  // ─── Preview handlers ───

  const handleEnablePreview = useCallback(async () => {
    await onStartPreview(config);
    audio.setVolume(50);
    previewActiveRef.current = true;
    setPreview({ isActive: true, isMuted: false, volume: 50 });
    // Start ambient layers that are in the current config
    for (const layer of config.ambientLayers) {
      audio.addAmbientLayer(layer.id, layer.volume);
    }
  }, [config, onStartPreview, audio]);

  const handleDisablePreview = useCallback(() => {
    previewActiveRef.current = false;
    onStopPreview();
    setPreview({ isActive: false, isMuted: false, volume: 50 });
  }, [onStopPreview]);

  const handlePreviewMute = useCallback(() => {
    setPreview((prev) => {
      const newMuted = !prev.isMuted;
      audio.setVolume(newMuted ? 0 : prev.volume);
      return { ...prev, isMuted: newMuted };
    });
  }, [audio]);

  const handlePreviewVolumeChange = useCallback((vol: number) => {
    audio.setVolume(vol);
    setPreview((prev) => ({ ...prev, volume: vol, isMuted: false }));
  }, [audio]);

  // ─── Config update callbacks (with live preview audio) ───

  const updateLayers = useCallback((id: string, updates: Partial<BeatLayer>) => {
    if (previewActiveRef.current) {
      const layer = configRef.current.layers.find((l) => l.id === id);
      if (layer) {
        const updated = { ...layer, ...updates };
        if ('beatFreq' in updates || 'carrierFreq' in updates) {
          audio.setBeatLayerFrequency(id, updated.carrierFreq, updated.beatFreq);
        }
        if ('waveform' in updates) {
          audio.setBeatLayerWaveform(id, updated.waveform);
        }
        if ('volume' in updates) {
          audio.setBeatLayerVolume(id, updated.volume);
        }
      }
    }
    setConfig((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  }, [audio]);

  const addLayer = useCallback(() => {
    setConfig((prev) => {
      if (prev.layers.length >= (isPro ? 4 : 1)) {
        onLimitReached('Free plan supports 1 beat layer. Upgrade to Pro for up to 4 layers!');
        return prev;
      }
      const newLayer = createDefaultBeatLayer(prev.layers.length);
      if (previewActiveRef.current) {
        audio.addBeatLayer(newLayer);
      }
      return { ...prev, layers: [...prev.layers, newLayer] };
    });
  }, [isPro, onLimitReached, audio]);

  const removeLayer = useCallback((id: string) => {
    if (previewActiveRef.current) {
      audio.removeBeatLayer(id);
    }
    setConfig((prev) => ({
      ...prev,
      layers: prev.layers.filter((l) => l.id !== id),
    }));
  }, [audio]);

  const updateFilter = useCallback((filter: FilterConfig) => {
    if (previewActiveRef.current) {
      const prev = configRef.current.filter;
      if (filter.enabled && !prev.enabled) {
        audio.enableFilter(filter);
      } else if (!filter.enabled && prev.enabled) {
        audio.disableFilter();
      } else if (filter.enabled) {
        audio.updateFilter(filter);
      }
    }
    setConfig((prev) => ({ ...prev, filter }));
  }, [audio]);

  const updateLFO = useCallback((lfo: LFOConfig) => {
    if (previewActiveRef.current) {
      const prev = configRef.current.lfo;
      if (lfo.enabled && !prev.enabled) {
        audio.enableLFO(lfo);
      } else if (!lfo.enabled && prev.enabled) {
        audio.disableLFO();
      } else if (lfo.enabled) {
        // LFO target changes require reconnection
        if (lfo.target !== prev.target) {
          audio.disableLFO();
          audio.enableLFO(lfo);
        } else {
          audio.updateLFO(lfo);
        }
      }
    }
    setConfig((prev) => ({ ...prev, lfo }));
  }, [audio]);

  const updateIsochronic = useCallback((isochronic: IsochronicConfig) => {
    if (previewActiveRef.current) {
      const prev = configRef.current.isochronic;
      if (isochronic.enabled && !prev.enabled) {
        audio.enableIsochronic(isochronic);
      } else if (!isochronic.enabled && prev.enabled) {
        audio.disableIsochronic();
      } else if (isochronic.enabled) {
        audio.updateIsochronic(isochronic);
      }
    }
    setConfig((prev) => ({ ...prev, isochronic }));
  }, [audio]);

  const updateStereo = useCallback((stereo: StereoConfig) => {
    if (previewActiveRef.current) {
      const prev = configRef.current.stereo;
      if (stereo.enabled) {
        audio.setStereoWidth(stereo.width);
        audio.setStereoOffset(stereo.pan);
        if (stereo.crossfeed > 0) {
          audio.setCrossfeed(stereo.crossfeed);
        }
        if (stereo.rotation && !prev.rotation) {
          audio.enableSpatialRotation(stereo.rotationSpeed);
        } else if (!stereo.rotation && prev.rotation) {
          audio.disableSpatialRotation();
        } else if (stereo.rotation) {
          audio.enableSpatialRotation(stereo.rotationSpeed);
        }
      } else if (!stereo.enabled && prev.enabled) {
        audio.setStereoWidth(100);
        audio.setStereoOffset(0);
        audio.disableSpatialRotation();
      }
    }
    setConfig((prev) => ({ ...prev, stereo }));
  }, [audio]);

  const updateTimeline = useCallback((timeline: AdvancedTimelinePhase[]) => {
    setConfig((prev) => ({ ...prev, timeline }));
  }, []);

  const handleAmbientToggle = useCallback((id: string) => {
    const exists = configRef.current.ambientLayers.find((l) => l.id === id);
    if (exists) {
      if (previewActiveRef.current) {
        audio.removeAmbientLayer(id);
      }
    } else {
      if (previewActiveRef.current) {
        audio.addAmbientLayer(id, 50);
      }
    }
    setConfig((prev) => {
      const layerExists = prev.ambientLayers.find((l) => l.id === id);
      if (layerExists) {
        return { ...prev, ambientLayers: prev.ambientLayers.filter((l) => l.id !== id) };
      }
      return { ...prev, ambientLayers: [...prev.ambientLayers, { id, volume: 50 }] };
    });
  }, [audio]);

  const handleAmbientVolumeChange = useCallback((id: string, volume: number) => {
    if (previewActiveRef.current) {
      audio.setAmbientLayerVolume(id, volume);
    }
    setConfig((prev) => ({
      ...prev,
      ambientLayers: prev.ambientLayers.map((l) => (l.id === id ? { ...l, volume } : l)),
    }));
  }, [audio]);

  // ─── Session handlers ───

  const handleStart = useCallback(() => {
    transitioningRef.current = true;
    onStartSession(config);
  }, [onStartSession, config]);

  const handleSave = useCallback(() => {
    const name = saveName.trim() || 'Untitled Session';
    const session: SavedAdvancedSession = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      createdAt: new Date().toISOString(),
      config,
    };
    const result = saveAdvancedSession(session, isPro);
    if (result.success) {
      setSessions(loadAdvancedSessions());
      setShowSaveModal(false);
      setSaveName('');
    } else {
      onLimitReached(result.error ?? 'Could not save session');
    }
  }, [config, saveName, isPro, onLimitReached]);

  const handleDelete = useCallback((id: string) => {
    deleteAdvancedSession(id);
    setSessions(loadAdvancedSessions());
  }, []);

  const handleLoad = useCallback((session: SavedAdvancedSession) => {
    // Stop preview when loading a new session
    if (previewActiveRef.current) {
      previewActiveRef.current = false;
      onStopPreview();
      setPreview({ isActive: false, isMuted: false, volume: 50 });
    }
    setConfig(session.config);
  }, [onStopPreview]);

  const handlePlay = useCallback((session: SavedAdvancedSession) => {
    onStartSession(session.config);
  }, [onStartSession]);

  // suppress unused var warning
  void onPreviewTone;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-4 pb-8 space-y-4"
    >
      {/* Live preview bar (Pro only) */}
      {isPro && (
        <PreviewBar
          isActive={preview.isActive}
          isMuted={preview.isMuted}
          volume={preview.volume}
          onEnable={handleEnablePreview}
          onDisable={handleDisablePreview}
          onToggleMute={handlePreviewMute}
          onVolumeChange={handlePreviewVolumeChange}
        />
      )}

      {/* Saved sessions */}
      {sessions.length > 0 && (
        <div className="space-y-2">
          <h3
            className="font-[family-name:var(--font-inter)] text-xs font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            Saved Sessions
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <span
                  className="font-[family-name:var(--font-inter)] text-xs font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {s.name}
                </span>
                <button
                  onClick={() => handleLoad(s)}
                  className="text-[10px] font-[family-name:var(--font-jetbrains)]"
                  style={{ color: '#7986cb' }}
                >
                  Load
                </button>
                <button
                  onClick={() => handlePlay(s)}
                  className="text-[10px] font-[family-name:var(--font-jetbrains)]"
                  style={{ color: '#4fc3f7' }}
                >
                  {"▶"}
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-[10px] font-[family-name:var(--font-jetbrains)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {"✕"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panels */}
      <OscillatorPanel
        layers={config.layers}
        isPro={isPro}
        onUpdateLayer={updateLayers}
        onAddLayer={addLayer}
        onRemoveLayer={removeLayer}
      />

      <FilterPanel config={config.filter} onChange={updateFilter} />

      <StereoPanel config={config.stereo} isPro={isPro} onChange={updateStereo} />

      <LFOPanel config={config.lfo} isPro={isPro} onChange={updateLFO} />

      <IsochronicPanel config={config.isochronic} isPro={isPro} onChange={updateIsochronic} />

      <AdvancedAmbientPanel
        layers={config.ambientLayers}
        onToggle={handleAmbientToggle}
        onVolumeChange={handleAmbientVolumeChange}
        onLimitReached={() => onLimitReached('Free plan supports 2 ambient layers. Upgrade to Pro for unlimited layers!')}
      />

      <TimelineEditor phases={config.timeline} isPro={isPro} onChange={updateTimeline} />

      <FrequencyGraph phases={config.timeline} defaultBeatFreq={config.layers[0]?.beatFreq ?? 10} />

      <AdvancedSummary config={config} />

      {/* Action buttons */}
      <div className="flex flex-col gap-3 items-center pt-2">
        <button
          onClick={handleStart}
          className="w-full max-w-xs py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
          style={{
            background: 'rgba(121, 134, 203, 0.2)',
            border: '1px solid rgba(121, 134, 203, 0.4)',
            color: '#7986cb',
          }}
        >
          {preview.isActive ? "▶ Start Timed Session" : "▶ Start Session"}
        </button>
        <button
          onClick={() => setShowSaveModal(true)}
          className="w-full max-w-xs py-2.5 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)',
          }}
        >
          {"💾 Save Session"}
        </button>
      </div>

      {/* Save modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <h3
                className="font-[family-name:var(--font-playfair)] text-lg"
                style={{ color: 'var(--text-primary)' }}
              >
                Save Session
              </h3>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Session name..."
                className="w-full px-3 py-2 rounded-xl text-sm font-[family-name:var(--font-inter)] bg-transparent outline-none"
                style={{
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                }}
                autoFocus
                maxLength={30}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-2 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium"
                  style={{
                    background: 'rgba(121, 134, 203, 0.2)',
                    border: '1px solid rgba(121, 134, 203, 0.4)',
                    color: '#7986cb',
                  }}
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
