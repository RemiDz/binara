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
import AdvancedSummary from './AdvancedSummary';
import PreviewBar from './PreviewBar';
import SensorControl from '../SensorControl';
import ExportModal from '../ExportModal';
import ShareButton from '../ShareButton';
import BackgroundVisualiser from '../BackgroundVisualiser';
import type { AdvancedSessionConfig, BeatLayer, FilterConfig, LFOConfig, IsochronicConfig, StereoConfig, SavedAdvancedSession } from '@/types';
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
  const [showExport, setShowExport] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [sessions, setSessions] = useState<SavedAdvancedSession[]>(() => loadAdvancedSessions());
  const { isPro } = useProContext();

  // ─── Preview state ───
  const [preview, setPreview] = useState({ isActive: false, isMuted: false, volume: 50 });
  const previewActiveRef = useRef(false);
  const configRef = useRef(config);
  configRef.current = config;

  // Cleanup preview on unmount
  useEffect(() => {
    return () => {
      if (previewActiveRef.current) {
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

  // ─── Sensor callbacks (live during preview) ───

  const handleSensorFrequencyChange = useCallback((freq: number) => {
    if (!previewActiveRef.current) return;
    for (const layer of configRef.current.layers) {
      audio.setBeatLayerFrequency(layer.id, layer.carrierFreq, freq);
    }
  }, [audio]);

  const handleSensorStereoWidthChange = useCallback((width: number) => {
    if (!previewActiveRef.current) return;
    audio.setStereoWidth(width);
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

  // Timeline stays in config for export/preset compatibility but isn't editable in live mode

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

  // ─── Save / Load / Delete ───

  const handleSave = useCallback(() => {
    const name = saveName.trim() || 'Untitled Preset';
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
      onLimitReached(result.error ?? 'Could not save preset');
    }
  }, [config, saveName, isPro, onLimitReached]);

  const handleDelete = useCallback((id: string) => {
    deleteAdvancedSession(id);
    setSessions(loadAdvancedSessions());
  }, []);

  const handleLoad = useCallback((session: SavedAdvancedSession) => {
    // Stop preview when loading a new preset
    if (previewActiveRef.current) {
      previewActiveRef.current = false;
      onStopPreview();
      setPreview({ isActive: false, isMuted: false, volume: 50 });
    }
    setConfig(session.config);
  }, [onStopPreview]);

  // suppress unused var warnings
  void onPreviewTone;
  void onStartSession;

  const primaryBeatFreq = config.layers[0]?.beatFreq ?? 10;

  return (
    <div className="relative">
      {/* Background visualiser — subtle, behind everything when playing */}
      {preview.isActive && !preview.isMuted && (
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.15 }}>
          <BackgroundVisualiser
            beatFrequency={primaryBeatFreq}
            isPlaying={true}
            color={getBrainwaveColor(primaryBeatFreq)}
          />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 px-4 pb-8 space-y-4"
      >
        {/* ═══ Play Control Bar ═══ */}
        {isPro ? (
          <PreviewBar
            isActive={preview.isActive}
            isMuted={preview.isMuted}
            volume={preview.volume}
            onEnable={handleEnablePreview}
            onDisable={handleDisablePreview}
            onToggleMute={handlePreviewMute}
            onVolumeChange={handlePreviewVolumeChange}
          />
        ) : (
          <div
            className="w-full mt-3 py-3 px-4 rounded-2xl flex items-center gap-3"
            style={{
              background: 'rgba(255, 171, 64, 0.06)',
              border: '1px dashed rgba(255, 171, 64, 0.2)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffab40" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span
              className="font-[family-name:var(--font-inter)] text-xs"
              style={{ color: '#ffab40' }}
            >
              Live audio requires Pro — upgrade to hear your changes in real-time
            </span>
          </div>
        )}

        {/* ═══ Live Status Bar (when playing) ═══ */}
        <AnimatePresence>
          {preview.isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap justify-center gap-1.5">
                {config.layers.map((layer, i) => (
                  <div
                    key={layer.id}
                    className="px-2 py-0.5 rounded-md"
                    style={{
                      background: `${getBrainwaveColor(layer.beatFreq)}12`,
                      border: `1px solid ${getBrainwaveColor(layer.beatFreq)}25`,
                    }}
                  >
                    <span
                      className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                      style={{ color: getBrainwaveColor(layer.beatFreq) }}
                    >
                      L{i + 1}: {layer.beatFreq.toFixed(1)} Hz {getBrainwaveLabel(layer.beatFreq)}
                    </span>
                  </div>
                ))}
                {config.filter.enabled && (
                  <div className="px-2 py-0.5 rounded-md" style={{ background: 'rgba(79, 195, 247, 0.08)', border: '1px solid rgba(79, 195, 247, 0.15)' }}>
                    <span className="font-[family-name:var(--font-jetbrains)] text-[10px]" style={{ color: '#4fc3f7' }}>
                      {config.filter.type}
                    </span>
                  </div>
                )}
                {config.lfo.enabled && (
                  <div className="px-2 py-0.5 rounded-md" style={{ background: 'rgba(224, 64, 251, 0.08)', border: '1px solid rgba(224, 64, 251, 0.15)' }}>
                    <span className="font-[family-name:var(--font-jetbrains)] text-[10px]" style={{ color: '#e040fb' }}>
                      LFO
                    </span>
                  </div>
                )}
                {config.isochronic.enabled && (
                  <div className="px-2 py-0.5 rounded-md" style={{ background: 'rgba(255, 112, 67, 0.08)', border: '1px solid rgba(255, 112, 67, 0.15)' }}>
                    <span className="font-[family-name:var(--font-jetbrains)] text-[10px]" style={{ color: '#ff7043' }}>
                      Iso
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Saved Presets ═══ */}
        {sessions.length > 0 && (
          <div className="space-y-2">
            <h3
              className="font-[family-name:var(--font-inter)] text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Saved Presets
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
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

        {/* ═══ Sound Design Panels ═══ */}
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

        {/* ═══ Phone Sensor Control (Pro, shows when preview active) ═══ */}
        {preview.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <SensorControl
              onFrequencyChange={handleSensorFrequencyChange}
              onStereoWidthChange={handleSensorStereoWidthChange}
              color="#7986cb"
            />
          </motion.div>
        )}

        <AdvancedSummary config={config} />

        {/* ═══ Action Buttons ═══ */}
        <div className="flex flex-col gap-3 items-center pt-2">
          {/* Save Preset — Primary action */}
          <button
            onClick={() => setShowSaveModal(true)}
            className="w-full max-w-xs py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
            style={{
              background: 'rgba(121, 134, 203, 0.2)',
              border: '1px solid rgba(121, 134, 203, 0.4)',
              color: '#7986cb',
            }}
          >
            {"💾 Save Preset"}
          </button>

          {/* Export + Share row */}
          <div className="flex gap-2 w-full max-w-xs">
            {isPro && (
              <button
                onClick={() => setShowExport(true)}
                className="flex-1 py-2.5 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export WAV
              </button>
            )}
            <div className={isPro ? 'flex-1 flex justify-center' : 'w-full flex justify-center'}>
              <ShareButton
                session={{ type: 'advanced', config }}
                sessionName="Custom Sound"
              />
            </div>
          </div>
        </div>

        {/* ═══ Save Modal ═══ */}
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
                  Save Preset
                </h3>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Preset name..."
                  className="w-full px-3 py-2 rounded-xl text-sm font-[family-name:var(--font-inter)] bg-transparent outline-none"
                  style={{
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                  }}
                  autoFocus
                  maxLength={30}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                  }}
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

        {/* Export Modal */}
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          sessionType="advanced"
          advancedConfig={config}
          sessionName="Custom Sound"
          volume={preview.volume}
        />
      </motion.div>
    </div>
  );
}
