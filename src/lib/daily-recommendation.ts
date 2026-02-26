import { getPresetById } from './presets';
import type { Preset } from '@/types';

interface TimeSlot {
  label: string;
  presetIds: string[];
}

const TIME_SLOTS: { start: number; end: number; slot: TimeSlot }[] = [
  { start: 6, end: 10, slot: { label: 'Good morning \u2014 ease into focus', presetIds: ['study-flow', 'mindfulness', 'morning-boost'] } },
  { start: 10, end: 14, slot: { label: 'Peak hours \u2014 deep work mode', presetIds: ['deep-focus', 'problem-solving', 'adhd-focus'] } },
  { start: 14, end: 18, slot: { label: 'Afternoon \u2014 creative recharge', presetIds: ['creative-spark', 'mindfulness', 'afternoon-revival'] } },
  { start: 18, end: 22, slot: { label: 'Evening \u2014 wind down', presetIds: ['body-scan', 'stress-relief', 'wind-down'] } },
  { start: 22, end: 30, slot: { label: 'Night \u2014 drift into sleep', presetIds: ['fall-asleep', 'deep-sleep', 'insomnia-relief'] } },
];

export interface DailyRecommendation {
  preset: Preset;
  label: string;
}

export function getDailyRecommendation(): DailyRecommendation | null {
  const now = new Date();
  const hour = now.getHours();
  // Treat 0-5 as 24-29 for the night slot (22-30)
  const adjustedHour = hour < 6 ? hour + 24 : hour;

  const matched = TIME_SLOTS.find((s) => adjustedHour >= s.start && adjustedHour < s.end);
  if (!matched) return null;

  // Deterministic pick based on date
  const dateKey = now.toISOString().split('T')[0];
  const hash = dateKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const candidates = matched.slot.presetIds;
  const id = candidates[hash % candidates.length];
  const preset = getPresetById(id);

  if (!preset) return null;

  return { preset, label: matched.slot.label };
}
