import type { BrainwaveState } from '@/types';

/** Get the ease-in starting frequency for a given target brainwave state. */
export function getEaseInStartFreq(targetState: BrainwaveState): number {
  switch (targetState) {
    case 'delta': return 8;   // Alpha 8 Hz
    case 'theta': return 10;  // Alpha 10 Hz
    case 'alpha': return 14;  // Low Beta 14 Hz
    case 'beta':  return 10;  // Alpha 10 Hz
    case 'gamma': return 20;  // Beta 20 Hz
    case 'harmony': return 0; // No ramping for musical intervals
  }
}

/** Hermite smoothstep interpolation (0→1). */
function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export interface PhaseInfo {
  phase: 'easeIn' | 'deep' | 'easeOut';
  phaseProgress: number;   // 0–1 within current phase
  totalProgress: number;   // 0–1 overall session
  currentBeatFreq: number; // real-time beat frequency in Hz
}

/**
 * Calculate the current phase and beat frequency for a Listen mode session.
 *
 * Phase proportions: 12% ease-in, 76% deep, 12% ease-out.
 * Uses smoothstep interpolation for organic frequency transitions.
 *
 * @param isSleepPreset - If true, ease-out holds the target freq (no ramp back).
 */
export function getSessionPhaseInfo(
  elapsedSeconds: number,
  totalSeconds: number,
  targetFreq: number,
  startFreq: number,
  isSleepPreset: boolean,
): PhaseInfo {
  const easeInEnd = totalSeconds * 0.12;
  const easeOutStart = totalSeconds * 0.88;
  const totalProgress = totalSeconds > 0 ? Math.min(elapsedSeconds / totalSeconds, 1) : 0;

  if (elapsedSeconds < easeInEnd) {
    // Ease In: ramp from startFreq → targetFreq
    const phaseProgress = easeInEnd > 0 ? elapsedSeconds / easeInEnd : 1;
    const smooth = smoothstep(phaseProgress);
    const currentBeatFreq = startFreq + (targetFreq - startFreq) * smooth;
    return { phase: 'easeIn', phaseProgress, totalProgress, currentBeatFreq };
  }

  if (elapsedSeconds < easeOutStart) {
    // Deep Session: hold targetFreq steady
    const deepDuration = easeOutStart - easeInEnd;
    const phaseProgress = deepDuration > 0 ? (elapsedSeconds - easeInEnd) / deepDuration : 1;
    return { phase: 'deep', phaseProgress, totalProgress, currentBeatFreq: targetFreq };
  }

  // Ease Out
  const easeOutDuration = totalSeconds - easeOutStart;
  const phaseProgress = easeOutDuration > 0
    ? Math.min((elapsedSeconds - easeOutStart) / easeOutDuration, 1)
    : 1;

  if (isSleepPreset) {
    // Sleep presets: no frequency change during ease-out (don't wake the user)
    return { phase: 'easeOut', phaseProgress, totalProgress, currentBeatFreq: targetFreq };
  }

  // Non-sleep: ramp from targetFreq → startFreq
  const smooth = smoothstep(phaseProgress);
  const currentBeatFreq = targetFreq + (startFreq - targetFreq) * smooth;
  return { phase: 'easeOut', phaseProgress, totalProgress, currentBeatFreq };
}
