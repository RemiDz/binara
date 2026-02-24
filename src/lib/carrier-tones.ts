export interface CarrierTone {
  id: string;
  label: string;
  frequency: number;
  description: string;
  proOnly: boolean;
}

export const CARRIER_TONES: CarrierTone[] = [
  { id: 'earth', label: 'Earth Tone', frequency: 136.1, description: 'OM frequency, grounding', proOnly: false },
  { id: 'warm', label: 'Warm Bass', frequency: 180, description: 'Rich, warm foundation', proOnly: false },
  { id: 'verdi', label: 'Verdi Tuning', frequency: 216, description: 'Natural resonance, 432 Hz harmonic', proOnly: false },
  { id: 'concert', label: 'Concert Base', frequency: 220, description: 'A3, standard tuning reference', proOnly: false },
  { id: 'heart', label: 'Heart Centre', frequency: 256, description: 'C4, clear and balanced', proOnly: false },
  { id: 'solfeggio', label: 'Solfeggio Love', frequency: 264, description: 'Based on 528 Hz harmonic', proOnly: false },
  { id: 'crystal', label: 'Crystal Clear', frequency: 320, description: 'Bright, clear, present', proOnly: false },
  { id: 'custom', label: 'Custom', frequency: 0, description: 'User-defined frequency', proOnly: true },
];

export function getCarrierTone(id: string): CarrierTone | undefined {
  return CARRIER_TONES.find((t) => t.id === id);
}
