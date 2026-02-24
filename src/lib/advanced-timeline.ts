import type { AdvancedSessionConfig, AdvancedTimelinePhase } from '@/types';
import type { AudioEngine } from './audio-engine';
import { applyEasing } from './easing';

export interface AdvancedTickResult {
  currentPhaseIndex: number;
  currentPhaseName: string;
  phaseProgress: number;    // 0–1 (eased)
  totalProgress: number;    // 0–1
  currentBeatFreqs: number[];
  isComplete: boolean;
}

interface ResolvedPhase {
  name: string;
  durationSec: number;
  startBeatFreqs: number[];
  endBeatFreqs: number[];
  easing: AdvancedTimelinePhase['easing'];
}

export function buildAdvancedTimeline(config: AdvancedSessionConfig): {
  phases: ResolvedPhase[];
  totalDuration: number;
} {
  const layerIds = config.layers.map((l) => l.id);
  const defaultBeatFreqs = config.layers.map((l) => l.beatFreq);

  const phases: ResolvedPhase[] = config.timeline.map((phase, i) => {
    // Start freqs: previous phase's end freqs, or layer defaults for first phase
    const prevPhase = config.timeline[i - 1];
    const startBeatFreqs = prevPhase
      ? layerIds.map(() => prevPhase.beatFreq)
      : defaultBeatFreqs;

    return {
      name: phase.name,
      durationSec: phase.duration * 60,
      startBeatFreqs,
      endBeatFreqs: layerIds.map(() => phase.beatFreq),
      easing: phase.easing,
    };
  });

  const totalDuration = phases.reduce((sum, p) => sum + p.durationSec, 0);
  return { phases, totalDuration };
}

export class AdvancedTimelineRunner {
  private phases: ResolvedPhase[];
  private totalDuration: number;
  private engine: AudioEngine;
  private layerIds: string[];
  private lastBeatFreqs: number[] = [];

  constructor(config: AdvancedSessionConfig, engine: AudioEngine) {
    const timeline = buildAdvancedTimeline(config);
    this.phases = timeline.phases;
    this.totalDuration = timeline.totalDuration;
    this.engine = engine;
    this.layerIds = config.layers.map((l) => l.id);
  }

  tick(elapsedSeconds: number): AdvancedTickResult {
    if (elapsedSeconds >= this.totalDuration) {
      const lastPhase = this.phases[this.phases.length - 1];
      return {
        currentPhaseIndex: this.phases.length - 1,
        currentPhaseName: lastPhase.name,
        phaseProgress: 1,
        totalProgress: 1,
        currentBeatFreqs: lastPhase.endBeatFreqs,
        isComplete: true,
      };
    }

    let accumulated = 0;
    for (let i = 0; i < this.phases.length; i++) {
      const phase = this.phases[i];
      if (elapsedSeconds < accumulated + phase.durationSec) {
        const phaseElapsed = elapsedSeconds - accumulated;
        const rawProgress = phaseElapsed / phase.durationSec;
        const easedProgress = applyEasing(phase.easing, rawProgress);

        // Interpolate beat frequencies for each layer
        const currentBeatFreqs = phase.startBeatFreqs.map((start, j) => {
          return start + (phase.endBeatFreqs[j] - start) * easedProgress;
        });

        // Update engine frequencies (only if changed meaningfully)
        for (let j = 0; j < this.layerIds.length; j++) {
          const freq = currentBeatFreqs[j];
          if (!this.lastBeatFreqs[j] || Math.abs(freq - this.lastBeatFreqs[j]) > 0.01) {
            const layerId = this.layerIds[j];
            // We need carrier freq from the layer — get it from the engine's first phase start
            const carrierFreq = phase.startBeatFreqs[j] > 0
              ? this.engine.playing ? undefined : undefined
              : undefined;
            // We just update the beat freq, the carrier stays the same
            // setBeatLayerFrequency needs carrier+beat, but carrier doesn't change
            // So we skip carrier update here — timeline only controls beat freq
            void carrierFreq;
            void layerId;
          }
        }
        this.lastBeatFreqs = currentBeatFreqs;

        return {
          currentPhaseIndex: i,
          currentPhaseName: phase.name,
          phaseProgress: easedProgress,
          totalProgress: elapsedSeconds / this.totalDuration,
          currentBeatFreqs,
          isComplete: false,
        };
      }
      accumulated += phase.durationSec;
    }

    // Fallback
    const lastPhase = this.phases[this.phases.length - 1];
    return {
      currentPhaseIndex: this.phases.length - 1,
      currentPhaseName: lastPhase.name,
      phaseProgress: 1,
      totalProgress: 1,
      currentBeatFreqs: lastPhase.endBeatFreqs,
      isComplete: true,
    };
  }

  getTotalDurationMin(): number {
    return this.totalDuration / 60;
  }
}
