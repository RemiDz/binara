export interface BreathingPattern {
  id: string;
  name: string;
  inhale: number;    // seconds
  hold1: number;     // hold after inhale (0 = no hold)
  exhale: number;    // seconds
  hold2: number;     // hold after exhale (0 = no hold)
}

export const BREATHING_PATTERNS: BreathingPattern[] = [
  { id: 'relaxed',  name: 'Relaxed',      inhale: 4, hold1: 0, exhale: 6, hold2: 0 },
  { id: 'box',      name: 'Box Breathing', inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  { id: 'sleep478', name: '4-7-8 Sleep',   inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
  { id: 'energise', name: 'Energise',      inhale: 3, hold1: 0, exhale: 3, hold2: 0 },
  { id: 'deep',     name: 'Deep Calm',     inhale: 5, hold1: 2, exhale: 7, hold2: 2 },
];

export type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export interface BreathState {
  phase: BreathPhase;
  /** 0–1 progress within the current phase */
  progress: number;
  /** 0–1 circle scale (0=small, 1=large) */
  scale: number;
  label: string;
}

/** Sinusoidal easing for natural breathing feel */
function breathEase(t: number): number {
  return (1 - Math.cos(t * Math.PI)) / 2;
}

/**
 * Given a pattern and elapsed time (in seconds), returns the current breath state.
 * Elapsed can be any positive number — it loops through the cycle.
 */
export function getBreathState(pattern: BreathingPattern, elapsedSecs: number): BreathState {
  const cycle = pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2;
  const t = elapsedSecs % cycle;

  // Inhale phase
  if (t < pattern.inhale) {
    const progress = t / pattern.inhale;
    return {
      phase: 'inhale',
      progress,
      scale: breathEase(progress),
      label: 'Breathe in',
    };
  }

  // Hold after inhale
  const afterInhale = pattern.inhale;
  if (t < afterInhale + pattern.hold1) {
    const progress = (t - afterInhale) / pattern.hold1;
    return {
      phase: 'hold1',
      progress,
      scale: 1, // fully expanded
      label: 'Hold',
    };
  }

  // Exhale phase
  const afterHold1 = afterInhale + pattern.hold1;
  if (t < afterHold1 + pattern.exhale) {
    const progress = (t - afterHold1) / pattern.exhale;
    return {
      phase: 'exhale',
      progress,
      scale: 1 - breathEase(progress),
      label: 'Breathe out',
    };
  }

  // Hold after exhale
  const afterExhale = afterHold1 + pattern.exhale;
  const progress = (t - afterExhale) / pattern.hold2;
  return {
    phase: 'hold2',
    progress,
    scale: 0, // fully contracted
    label: 'Hold',
  };
}

/** Get default breathing pattern based on preset category */
export function getDefaultPatternId(category: string): string {
  switch (category) {
    case 'sleep': return 'sleep478';
    case 'focus':
    case 'energy': return 'box';
    default: return 'relaxed';
  }
}
