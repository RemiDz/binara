export interface BrainwaveStateOption {
  id: string;
  label: string;
  band: string;
  beatFreq: number;
  color: string;
  description: string;
  proOnly?: boolean;
}

export const BRAINWAVE_STATES: BrainwaveStateOption[] = [
  { id: 'deep-sleep', label: 'Deep Sleep', band: 'Delta', beatFreq: 2, color: '#1a237e', description: 'Dreamless sleep, deep restoration' },
  { id: 'dream', label: 'Dream State', band: 'Theta', beatFreq: 5.5, color: '#5c6bc0', description: 'REM sleep, vivid dreams, deep meditation' },
  { id: 'calm-focus', label: 'Calm Focus', band: 'Low Alpha', beatFreq: 9, color: '#4fc3f7', description: 'Relaxed awareness, light meditation' },
  { id: 'flow', label: 'Flow State', band: 'High Alpha', beatFreq: 11, color: '#26c6da', description: 'Creative flow, effortless focus' },
  { id: 'active-focus', label: 'Active Focus', band: 'Low Beta', beatFreq: 15, color: '#ffab40', description: 'Concentration, problem solving, study' },
  { id: 'performance', label: 'High Performance', band: 'High Beta', beatFreq: 25, color: '#ff7043', description: 'Intense focus, peak mental performance' },
  { id: 'insight', label: 'Insight', band: 'Gamma', beatFreq: 40, color: '#e040fb', description: 'Heightened perception, information processing' },
  { id: 'custom', label: 'Custom', band: 'Custom', beatFreq: 0, color: '#a0a0a0', description: 'User-defined beat frequency', proOnly: true },
];

export function getBrainwaveState(id: string): BrainwaveStateOption | undefined {
  return BRAINWAVE_STATES.find((s) => s.id === id);
}

/** Get brainwave band color from beat frequency (Hz) */
export function getBrainwaveColor(freq: number): string {
  if (freq <= 4) return '#1a237e';
  if (freq <= 8) return '#7986cb';
  if (freq <= 12) return '#4fc3f7';
  if (freq <= 30) return '#ffab40';
  return '#e040fb';
}

/** Get brainwave band label from beat frequency (Hz) */
export function getBrainwaveLabel(freq: number): string {
  if (freq <= 4) return 'Delta';
  if (freq <= 8) return 'Theta';
  if (freq <= 12) return 'Alpha';
  if (freq <= 30) return 'Beta';
  return 'Gamma';
}
