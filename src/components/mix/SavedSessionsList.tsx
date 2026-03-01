'use client';

import { getBrainwaveState } from '@/lib/brainwave-states';
import { getCarrierTone } from '@/lib/carrier-tones';
import { AMBIENT_OPTIONS } from '@/lib/constants';
import { useProContext } from '@/context/ProContext';
import type { SavedSession } from '@/lib/session-storage';
import { MAX_FREE_SESSIONS } from '@/lib/session-storage';

interface SavedSessionsListProps {
  sessions: SavedSession[];
  onPlay: (session: SavedSession) => void;
  onDelete: (id: string) => void;
  onLoad: (session: SavedSession) => void;
}

export default function SavedSessionsList({ sessions, onPlay, onDelete, onLoad }: SavedSessionsListProps) {
  const { isPro } = useProContext();
  if (sessions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3
          className="font-[family-name:var(--font-inter)] font-medium text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          My Sessions
        </h3>
        {!isPro && (
          <span
            className="font-[family-name:var(--font-jetbrains)] text-[10px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {sessions.length}/{MAX_FREE_SESSIONS}
          </span>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {sessions.map((s) => {
          const bwState = getBrainwaveState(s.stateId);
          const carrier = getCarrierTone(s.carrierId);
          const total = s.timeline.easeIn + s.timeline.deep + s.timeline.easeOut;

          return (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => onLoad(s)}
              onKeyDown={(e) => { if (e.key === 'Enter') onLoad(s); }}
              className="flex-shrink-0 w-52 p-3 rounded-xl text-left transition-all active:scale-[0.98]"
              style={{
                background: 'var(--glass-bg)',
                border: `1px solid ${bwState?.color ?? 'var(--glass-border)'}30`,
                cursor: 'pointer',
              }}
            >
              <p
                className="font-[family-name:var(--font-inter)] font-medium text-xs truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {s.name}
              </p>
              <p className="font-[family-name:var(--font-inter)] text-[11px] mt-1" style={{ color: bwState?.color ?? 'var(--text-secondary)' }}>
                {"● "}{bwState?.label} {"·"} {s.customBeatFreq ?? bwState?.beatFreq} Hz
              </p>
              <p className="font-[family-name:var(--font-inter)] text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {"🎵 "}{carrier?.label} {"·"} {s.customCarrierFreq ?? carrier?.frequency} Hz
              </p>
              {s.ambientLayers.length > 0 && (
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {s.ambientLayers.map((l) => AMBIENT_OPTIONS.find((o) => o.id === l.id)?.icon).join(' ')}
                </p>
              )}
              <p className="font-[family-name:var(--font-jetbrains)] text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {total} min
              </p>
              <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); onPlay(s); }}
                  className="flex-1 py-1 rounded-full text-[10px] font-[family-name:var(--font-inter)]"
                  style={{
                    background: 'rgba(79, 195, 247, 0.12)',
                    border: '1px solid rgba(79, 195, 247, 0.2)',
                    color: '#4fc3f7',
                  }}
                >
                  {"▶ Play"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                  className="py-1 px-2 rounded-full text-[10px]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {"🗑"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
