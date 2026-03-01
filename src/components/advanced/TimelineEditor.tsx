'use client';

import Panel from './Panel';
import Slider from '../ui/Slider';
import type { AdvancedTimelinePhase, EasingType } from '@/types';

const EASINGS: { id: EasingType; label: string }[] = [
  { id: 'linear', label: 'Linear' },
  { id: 'easeIn', label: 'Ease In' },
  { id: 'easeOut', label: 'Ease Out' },
  { id: 'easeInOut', label: 'Smooth' },
];

interface TimelineEditorProps {
  phases: AdvancedTimelinePhase[];
  isPro: boolean;
  onChange: (phases: AdvancedTimelinePhase[]) => void;
}

export default function TimelineEditor({ phases, isPro, onChange }: TimelineEditorProps) {
  const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0);
  const canAddPhase = isPro && phases.length < 6;

  const updatePhase = (index: number, updates: Partial<AdvancedTimelinePhase>) => {
    const newPhases = phases.map((p, i) => (i === index ? { ...p, ...updates } : p));
    onChange(newPhases);
  };

  const addPhase = () => {
    const newPhase: AdvancedTimelinePhase = {
      id: `phase-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: `Phase ${phases.length + 1}`,
      duration: 10,
      beatFreq: 10,
      easing: 'linear',
    };
    onChange([...phases, newPhase]);
  };

  const removePhase = (index: number) => {
    if (phases.length <= 1) return;
    onChange(phases.filter((_, i) => i !== index));
  };

  return (
    <Panel title="Timeline" subtitle={`${totalDuration} min total`} defaultExpanded>
      <div className="space-y-4">
        {/* Visual timeline bar */}
        <div className="flex h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {phases.map((phase, i) => {
            const widthPct = totalDuration > 0 ? (phase.duration / totalDuration) * 100 : 100 / phases.length;
            return (
              <div
                key={phase.id}
                className="h-full"
                style={{
                  width: `${widthPct}%`,
                  background: `hsl(${220 + i * 40}, 60%, 65%)`,
                  opacity: 0.6,
                  borderRight: i < phases.length - 1 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                }}
              />
            );
          })}
        </div>

        {phases.map((phase, i) => (
          <div
            key={phase.id}
            className="space-y-2.5 p-3 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex items-center justify-between">
              {isPro ? (
                <input
                  type="text"
                  value={phase.name}
                  onChange={(e) => updatePhase(i, { name: e.target.value })}
                  className="bg-transparent font-[family-name:var(--font-inter)] text-xs font-medium border-none outline-none"
                  style={{ color: 'var(--text-primary)' }}
                  maxLength={20}
                />
              ) : (
                <span
                  className="font-[family-name:var(--font-inter)] text-xs font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {phase.name}
                </span>
              )}
              {phases.length > 1 && isPro && (
                <button
                  onClick={() => removePhase(i)}
                  className="w-5 h-5 flex items-center justify-center rounded-full"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Remove phase"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            <Slider
              label="Duration"
              value={phase.duration}
              min={1}
              max={60}
              step={1}
              suffix="min"
              color="#7986cb"
              onChange={(v) => updatePhase(i, { duration: v })}
            />

            <Slider
              label="Beat Frequency"
              value={phase.beatFreq}
              min={0.5}
              max={50}
              step={0.5}
              suffix="Hz"
              color="#4fc3f7"
              onChange={(v) => updatePhase(i, { beatFreq: v })}
            />

            {/* Easing selector */}
            <div>
              <span className="font-[family-name:var(--font-inter)] text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                Easing
              </span>
              <div className="flex gap-1.5">
                {EASINGS.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => updatePhase(i, { easing: e.id })}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-[family-name:var(--font-jetbrains)] font-medium transition-all"
                    style={{
                      background: phase.easing === e.id ? 'rgba(121, 134, 203, 0.15)' : 'transparent',
                      border: `1px solid ${phase.easing === e.id ? 'rgba(121, 134, 203, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                      color: phase.easing === e.id ? '#7986cb' : 'var(--text-muted)',
                    }}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {canAddPhase && (
          <button
            onClick={addPhase}
            className="w-full py-2 rounded-xl text-xs font-[family-name:var(--font-inter)] font-medium transition-all"
            style={{
              background: 'rgba(121, 134, 203, 0.08)',
              border: '1px dashed rgba(121, 134, 203, 0.25)',
              color: '#7986cb',
            }}
          >
            + Add Phase
          </button>
        )}

        {!isPro && phases.length >= 1 && (
          <p className="text-center font-[family-name:var(--font-jetbrains)] text-[9px]" style={{ color: 'var(--text-muted)' }}>
            Pro unlocks multi-phase timelines
          </p>
        )}

        {/* Total duration */}
        <div className="text-center">
          <span className="font-[family-name:var(--font-jetbrains)] text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Total: {totalDuration} min
          </span>
        </div>
      </div>
    </Panel>
  );
}
