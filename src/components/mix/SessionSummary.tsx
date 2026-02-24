'use client';

import { getBrainwaveState } from '@/lib/brainwave-states';
import { getCarrierTone } from '@/lib/carrier-tones';
import { AMBIENT_OPTIONS } from '@/lib/constants';

interface SessionSummaryProps {
  stateId: string;
  carrierId: string;
  ambientLayers: { id: string; volume: number }[];
  easeIn: number;
  deep: number;
  easeOut: number;
}

export default function SessionSummary({ stateId, carrierId, ambientLayers, easeIn, deep, easeOut }: SessionSummaryProps) {
  const bwState = getBrainwaveState(stateId);
  const carrier = getCarrierTone(carrierId);
  const total = easeIn + deep + easeOut;

  if (!bwState || !carrier) return null;

  const leftFreq = carrier.frequency;
  const rightFreq = carrier.frequency + bwState.beatFreq;

  return (
    <div
      className="p-3 rounded-xl space-y-2"
      style={{
        background: 'var(--glass-bg)',
        border: `1px solid ${bwState.color}30`,
      }}
    >
      <p className="font-[family-name:var(--font-inter)] font-medium text-xs" style={{ color: 'var(--text-primary)' }}>
        Your Session
      </p>
      <div className="space-y-1 font-[family-name:var(--font-inter)] text-xs" style={{ color: 'var(--text-secondary)' }}>
        <p>
          <span style={{ color: bwState.color }}>{"● "}</span>
          {bwState.label} {"·"} {bwState.band} {"·"} {bwState.beatFreq} Hz
        </p>
        <p>
          {"🎵 "}{carrier.label} {"·"} {carrier.frequency} Hz
        </p>
        {ambientLayers.length > 0 && (
          <p>
            {ambientLayers.map((l, i) => {
              const opt = AMBIENT_OPTIONS.find((o) => o.id === l.id);
              return (
                <span key={l.id}>
                  {i > 0 ? ' + ' : ''}
                  {opt?.icon} {opt?.label} ({l.volume}%)
                </span>
              );
            })}
          </p>
        )}
        <p>{"⏱ "}{total} min ({easeIn} + {deep} + {easeOut})</p>
      </div>
      <div className="pt-1 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex gap-4 font-[family-name:var(--font-jetbrains)] text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>L: {leftFreq} Hz</span>
          <span>R: {rightFreq.toFixed(1)} Hz</span>
          <span>Beat: {bwState.beatFreq} Hz</span>
        </div>
      </div>
    </div>
  );
}
