'use client';

import { useState, useCallback } from 'react';
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
import type { AdvancedSessionConfig, BeatLayer, FilterConfig, LFOConfig, IsochronicConfig, StereoConfig, AdvancedTimelinePhase, SavedAdvancedSession } from '@/types';
import { createDefaultAdvancedConfig, createDefaultBeatLayer } from '@/types';
import { loadAdvancedSessions, saveAdvancedSession, deleteAdvancedSession } from '@/lib/session-storage';

interface AdvancedBuilderProps {
  onStartSession: (config: AdvancedSessionConfig) => void;
  onPreviewTone: (frequency: number) => Promise<void>;
  onLimitReached: (message: string) => void;
}

export default function AdvancedBuilder({ onStartSession, onPreviewTone, onLimitReached }: AdvancedBuilderProps) {
  const [config, setConfig] = useState<AdvancedSessionConfig>(createDefaultAdvancedConfig);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [sessions, setSessions] = useState<SavedAdvancedSession[]>(() => loadAdvancedSessions());
  const { isPro } = useProContext();

  const updateLayers = useCallback((id: string, updates: Partial<BeatLayer>) => {
    setConfig((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  }, []);

  const addLayer = useCallback(() => {
    setConfig((prev) => {
      if (prev.layers.length >= (isPro ? 4 : 1)) {
        onLimitReached('Free plan supports 1 beat layer. Upgrade to Pro for up to 4 layers!');
        return prev;
      }
      return { ...prev, layers: [...prev.layers, createDefaultBeatLayer(prev.layers.length)] };
    });
  }, [isPro, onLimitReached]);

  const removeLayer = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      layers: prev.layers.filter((l) => l.id !== id),
    }));
  }, []);

  const updateFilter = useCallback((filter: FilterConfig) => {
    setConfig((prev) => ({ ...prev, filter }));
  }, []);

  const updateLFO = useCallback((lfo: LFOConfig) => {
    setConfig((prev) => ({ ...prev, lfo }));
  }, []);

  const updateIsochronic = useCallback((isochronic: IsochronicConfig) => {
    setConfig((prev) => ({ ...prev, isochronic }));
  }, []);

  const updateStereo = useCallback((stereo: StereoConfig) => {
    setConfig((prev) => ({ ...prev, stereo }));
  }, []);

  const updateTimeline = useCallback((timeline: AdvancedTimelinePhase[]) => {
    setConfig((prev) => ({ ...prev, timeline }));
  }, []);

  const handleAmbientToggle = useCallback((id: string) => {
    setConfig((prev) => {
      const exists = prev.ambientLayers.find((l) => l.id === id);
      if (exists) {
        return { ...prev, ambientLayers: prev.ambientLayers.filter((l) => l.id !== id) };
      }
      return { ...prev, ambientLayers: [...prev.ambientLayers, { id, volume: 50 }] };
    });
  }, []);

  const handleAmbientVolumeChange = useCallback((id: string, volume: number) => {
    setConfig((prev) => ({
      ...prev,
      ambientLayers: prev.ambientLayers.map((l) => (l.id === id ? { ...l, volume } : l)),
    }));
  }, []);

  const handleStart = useCallback(() => {
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
  }, [config, saveName, onLimitReached]);

  const handleDelete = useCallback((id: string) => {
    deleteAdvancedSession(id);
    setSessions(loadAdvancedSessions());
  }, []);

  const handleLoad = useCallback((session: SavedAdvancedSession) => {
    setConfig(session.config);
  }, []);

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
          {"▶ Start Session"}
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
