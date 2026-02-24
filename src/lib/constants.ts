import type { BrainwaveState, Category, AmbientOption } from '@/types';

export const BRAINWAVE_COLORS: Record<BrainwaveState, string> = {
  delta: '#1a237e',
  theta: '#7986cb',
  alpha: '#4fc3f7',
  beta: '#ffab40',
  gamma: '#e040fb',
};

export const BRAINWAVE_LABELS: Record<BrainwaveState, string> = {
  delta: 'Delta (0.5–4 Hz)',
  theta: 'Theta (4–8 Hz)',
  alpha: 'Alpha (8–12 Hz)',
  beta: 'Beta (12–30 Hz)',
  gamma: 'Gamma (30–50 Hz)',
};

export const BRAINWAVE_DESCRIPTIONS: Record<BrainwaveState, string> = {
  delta: 'Deep sleep, restoration',
  theta: 'Meditation, creativity, dreams',
  alpha: 'Relaxation, calm focus',
  beta: 'Concentration, active thinking',
  gamma: 'Peak awareness, information processing',
};

export const CATEGORIES: Category[] = [
  { id: 'focus', label: 'Focus', icon: '\u{1F9E0}', description: 'Sharpen concentration and mental clarity' },
  { id: 'sleep', label: 'Sleep', icon: '\u{1F634}', description: 'Drift into deep, restorative rest' },
  { id: 'meditation', label: 'Meditation', icon: '\u{1F9D8}', description: 'Deepen your practice' },
  { id: 'relaxation', label: 'Relaxation', icon: '\u{1F60C}', description: 'Release tension and unwind' },
  { id: 'energy', label: 'Energy', icon: '\u{26A1}', description: 'Boost alertness and vitality' },
  { id: 'therapy', label: 'Therapy', icon: '\u{1F3AF}', description: 'Targeted frequency support' },
];

export const AMBIENT_OPTIONS: AmbientOption[] = [
  { id: 'rain', label: 'Rain', icon: '\u{1F327}\u{FE0F}' },
  { id: 'ocean', label: 'Ocean', icon: '\u{1F30A}' },
  { id: 'bowls', label: 'Bowls', icon: '\u{1F3B5}' },
  { id: 'forest', label: 'Forest', icon: '\u{1F343}' },
  { id: 'fireplace', label: 'Fire', icon: '\u{1F525}' },
  { id: 'white', label: 'White', icon: '\u{2601}\u{FE0F}' },
  { id: 'pink', label: 'Pink', icon: '\u{1F338}' },
  { id: 'brown', label: 'Brown', icon: '\u{1F7EB}' },
];

export const DURATION_OPTIONS = [5, 10, 15, 20, 30, 60];

export const MODE_COLORS: Record<string, string> = {
  listen: '#4fc3f7',
  mix: '#ffab40',
  create: '#7986cb',
};

export const VOLUME_HARD_CAP = 0.3;
