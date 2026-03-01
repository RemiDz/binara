import type { AudioEngine } from './audio-engine';

export interface TimelinePhase {
  name: 'easeIn' | 'deep' | 'easeOut';
  duration: number; // seconds
  startBeatFreq: number;
  endBeatFreq: number;
}

export interface SessionTimeline {
  phases: TimelinePhase[];
  totalDuration: number; // seconds
  carrierFreq: number;
}

export interface TickResult {
  currentPhase: 'easeIn' | 'deep' | 'easeOut';
  phaseProgress: number; // 0–1 within current phase
  totalProgress: number; // 0–1 overall
  elapsedSeconds: number;
  currentBeatFreq: number;
  isComplete: boolean;
}

const ALPHA_FREQ = 10; // Hz — starting/ending frequency for ease phases

export function buildTimeline(
  targetBeatFreq: number,
  carrierFreq: number,
  easeInMin: number,
  deepMin: number,
  easeOutMin: number,
): SessionTimeline {
  const phases: TimelinePhase[] = [
    {
      name: 'easeIn',
      duration: easeInMin * 60,
      startBeatFreq: ALPHA_FREQ,
      endBeatFreq: targetBeatFreq,
    },
    {
      name: 'deep',
      duration: deepMin * 60,
      startBeatFreq: targetBeatFreq,
      endBeatFreq: targetBeatFreq,
    },
    {
      name: 'easeOut',
      duration: easeOutMin * 60,
      startBeatFreq: targetBeatFreq,
      endBeatFreq: ALPHA_FREQ,
    },
  ];

  return {
    phases,
    totalDuration: phases.reduce((sum, p) => sum + p.duration, 0),
    carrierFreq,
  };
}

export class TimelineRunner {
  private timeline: SessionTimeline;
  private engine: AudioEngine;
  private lastBeatFreq = -1;

  constructor(timeline: SessionTimeline, engine: AudioEngine) {
    this.timeline = timeline;
    this.engine = engine;
  }

  tick(elapsedSeconds: number): TickResult {
    const { phases, totalDuration, carrierFreq } = this.timeline;

    if (elapsedSeconds >= totalDuration) {
      return {
        currentPhase: 'easeOut',
        phaseProgress: 1,
        totalProgress: 1,
        elapsedSeconds: totalDuration,
        currentBeatFreq: phases[2].endBeatFreq,
        isComplete: true,
      };
    }

    let accumulated = 0;
    for (const phase of phases) {
      if (elapsedSeconds < accumulated + phase.duration) {
        const phaseElapsed = elapsedSeconds - accumulated;
        const phaseProgress = phase.duration === 0 ? 1 : phaseElapsed / phase.duration;

        // Linear interpolation
        const currentBeatFreq =
          phase.startBeatFreq + (phase.endBeatFreq - phase.startBeatFreq) * phaseProgress;

        // Update engine frequency (only if changed meaningfully)
        if (Math.abs(currentBeatFreq - this.lastBeatFreq) > 0.01) {
          this.engine.setCarrierFrequency(carrierFreq, carrierFreq + currentBeatFreq);
          this.lastBeatFreq = currentBeatFreq;
        }

        return {
          currentPhase: phase.name,
          phaseProgress,
          totalProgress: elapsedSeconds / totalDuration,
          elapsedSeconds,
          currentBeatFreq,
          isComplete: false,
        };
      }
      accumulated += phase.duration;
    }

    // Fallback (shouldn't reach here)
    return {
      currentPhase: 'easeOut',
      phaseProgress: 1,
      totalProgress: 1,
      elapsedSeconds: totalDuration,
      currentBeatFreq: ALPHA_FREQ,
      isComplete: true,
    };
  }
}

export const QUICK_PRESETS: { total: number; easeIn: number; deep: number; easeOut: number }[] = [
  { total: 10, easeIn: 2, deep: 7, easeOut: 1 },
  { total: 20, easeIn: 3, deep: 15, easeOut: 2 },
  { total: 30, easeIn: 3, deep: 24, easeOut: 3 },
  { total: 45, easeIn: 5, deep: 36, easeOut: 4 },
  { total: 60, easeIn: 5, deep: 50, easeOut: 5 },
];
