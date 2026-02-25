import type { BrainwaveState } from '@/types';

export interface WaveStateConfig {
  color: string;
  glow: string;
  label: string;
  range: string;
  symbol: string;
}

export const WAVE_STATES: Record<BrainwaveState, WaveStateConfig> = {
  delta: { color: '#6B5CE7', glow: 'rgba(107,92,231,0.3)', label: 'Delta', range: '0.5–4 Hz', symbol: 'δ' },
  theta: { color: '#8B6CE7', glow: 'rgba(139,108,231,0.3)', label: 'Theta', range: '4–8 Hz', symbol: 'θ' },
  alpha: { color: '#4ECDC4', glow: 'rgba(78,205,196,0.3)', label: 'Alpha', range: '8–14 Hz', symbol: 'α' },
  beta:  { color: '#F7B731', glow: 'rgba(247,183,49,0.3)', label: 'Beta', range: '14–30 Hz', symbol: 'β' },
  gamma: { color: '#FC5C65', glow: 'rgba(252,92,101,0.3)', label: 'Gamma', range: '30–100 Hz', symbol: 'γ' },
};
