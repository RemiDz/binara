'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import StateSelector from './StateSelector';
import CarrierSelector from './CarrierSelector';
import AmbientMixer from './AmbientMixer';
import TimelineBuilder from './TimelineBuilder';
import SessionSummary from './SessionSummary';
import SaveSessionModal from './SaveSessionModal';
import SavedSessionsList from './SavedSessionsList';
import { getBrainwaveState, type BrainwaveStateOption } from '@/lib/brainwave-states';
import { getCarrierTone, type CarrierTone } from '@/lib/carrier-tones';
import { loadSessions, saveSession, deleteSession, generateSessionName, type SavedSession } from '@/lib/session-storage';
import type { MixConfig } from '@/types';

interface MixBuilderProps {
  onStartSession: (config: MixConfig) => void;
  onPreviewTone: (frequency: number) => Promise<void>;
  onLimitReached: (message: string) => void;
}

export default function MixBuilder({ onStartSession, onPreviewTone, onLimitReached }: MixBuilderProps) {
  // Step 1: Brainwave state
  const [stateId, setStateId] = useState('calm-focus');
  // Step 2: Carrier tone
  const [carrierId, setCarrierId] = useState('earth');
  // Custom frequencies (PRO)
  const [customCarrierFreq, setCustomCarrierFreq] = useState(200);
  const [customBeatFreq, setCustomBeatFreq] = useState(10);
  // Step 3: Ambient layers
  const [ambientLayers, setAmbientLayers] = useState<{ id: string; volume: number }[]>([]);
  // Step 4: Timeline
  const [easeIn, setEaseIn] = useState(3);
  const [deep, setDeep] = useState(15);
  const [easeOut, setEaseOut] = useState(2);

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  // Saved sessions
  const [sessions, setSessions] = useState<SavedSession[]>(() => loadSessions());

  const bwState = getBrainwaveState(stateId);
  const stateColor = bwState?.color ?? '#4fc3f7';

  const handleAmbientToggle = useCallback((id: string) => {
    setAmbientLayers((prev) => {
      const exists = prev.find((l) => l.id === id);
      if (exists) return prev.filter((l) => l.id !== id);
      return [...prev, { id, volume: 50 }];
    });
  }, []);

  const handleAmbientVolumeChange = useCallback((id: string, volume: number) => {
    setAmbientLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, volume } : l))
    );
  }, []);

  const handleQuickPreset = useCallback((ei: number, d: number, eo: number) => {
    setEaseIn(ei);
    setDeep(d);
    setEaseOut(eo);
  }, []);

  const buildConfig = useCallback((): MixConfig => ({
    stateId,
    carrierId,
    ...(carrierId === 'custom' ? { customCarrierFreq } : {}),
    ...(stateId === 'custom' ? { customBeatFreq } : {}),
    ambientLayers,
    timeline: { easeIn, deep, easeOut },
  }), [stateId, carrierId, customCarrierFreq, customBeatFreq, ambientLayers, easeIn, deep, easeOut]);

  const handleStartSession = useCallback(() => {
    onStartSession(buildConfig());
  }, [onStartSession, buildConfig]);

  const handleSave = useCallback((name: string) => {
    const session: SavedSession = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      createdAt: new Date().toISOString(),
      stateId,
      carrierId,
      ...(carrierId === 'custom' ? { customCarrierFreq } : {}),
      ...(stateId === 'custom' ? { customBeatFreq } : {}),
      ambientLayers,
      timeline: { easeIn, deep, easeOut },
    };
    const result = saveSession(session);
    if (result.success) {
      setSessions(loadSessions());
      setShowSaveModal(false);
    } else {
      onLimitReached(result.error ?? 'Could not save session');
    }
  }, [stateId, carrierId, customCarrierFreq, customBeatFreq, ambientLayers, easeIn, deep, easeOut, onLimitReached]);

  const handleDelete = useCallback((id: string) => {
    deleteSession(id);
    setSessions(loadSessions());
  }, []);

  const handleLoadSession = useCallback((s: SavedSession) => {
    setStateId(s.stateId);
    setCarrierId(s.carrierId);
    if (s.customCarrierFreq !== undefined) setCustomCarrierFreq(s.customCarrierFreq);
    if (s.customBeatFreq !== undefined) setCustomBeatFreq(s.customBeatFreq);
    setAmbientLayers(s.ambientLayers);
    setEaseIn(s.timeline.easeIn);
    setDeep(s.timeline.deep);
    setEaseOut(s.timeline.easeOut);
  }, []);

  const handlePlaySession = useCallback((s: SavedSession) => {
    const config: MixConfig = {
      stateId: s.stateId,
      carrierId: s.carrierId,
      ...(s.customCarrierFreq !== undefined ? { customCarrierFreq: s.customCarrierFreq } : {}),
      ...(s.customBeatFreq !== undefined ? { customBeatFreq: s.customBeatFreq } : {}),
      ambientLayers: s.ambientLayers,
      timeline: s.timeline,
    };
    onStartSession(config);
  }, [onStartSession]);

  const handleStateChange = useCallback((state: BrainwaveStateOption) => {
    setStateId(state.id);
  }, []);

  const handleCarrierChange = useCallback((tone: CarrierTone) => {
    setCarrierId(tone.id);
  }, []);

  const defaultSaveName = generateSessionName(bwState?.label ?? 'Custom');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-4 pb-8 space-y-6"
    >
      {/* Saved sessions */}
      {sessions.length > 0 && (
        <SavedSessionsList
          sessions={sessions}
          onPlay={handlePlaySession}
          onDelete={handleDelete}
          onLoad={handleLoadSession}
        />
      )}

      {/* Step 1: Brainwave State */}
      <StateSelector
        selectedId={stateId}
        customBeatFreq={customBeatFreq}
        onChange={handleStateChange}
        onCustomBeatFreqChange={setCustomBeatFreq}
      />

      {/* Step 2: Carrier Tone */}
      <CarrierSelector
        selectedId={carrierId}
        customFreq={customCarrierFreq}
        onChange={handleCarrierChange}
        onCustomFreqChange={setCustomCarrierFreq}
        onPreview={onPreviewTone}
      />

      {/* Step 3: Ambient Layers */}
      <AmbientMixer
        layers={ambientLayers}
        onToggle={handleAmbientToggle}
        onVolumeChange={handleAmbientVolumeChange}
        onLimitReached={() => onLimitReached('Free plan supports 2 ambient layers. Upgrade to Pro for unlimited layers!')}
      />

      {/* Step 4: Timeline */}
      <TimelineBuilder
        easeIn={easeIn}
        deep={deep}
        easeOut={easeOut}
        stateColor={stateColor}
        onEaseInChange={setEaseIn}
        onDeepChange={setDeep}
        onEaseOutChange={setEaseOut}
        onQuickPreset={handleQuickPreset}
      />

      {/* Session summary */}
      <SessionSummary
        stateId={stateId}
        carrierId={carrierId}
        ambientLayers={ambientLayers}
        easeIn={easeIn}
        deep={deep}
        easeOut={easeOut}
      />

      {/* Action buttons */}
      <div className="flex flex-col gap-3 items-center pt-2">
        <button
          onClick={handleStartSession}
          className="w-full max-w-xs py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
          style={{
            background: `${stateColor}25`,
            border: `1px solid ${stateColor}50`,
            color: stateColor,
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
          <SaveSessionModal
            defaultName={defaultSaveName}
            onSave={handleSave}
            onCancel={() => setShowSaveModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
