import type { EasingType } from '@/types/advanced';

export function applyEasing(type: EasingType, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));

  switch (type) {
    case 'linear':
      return clamped;
    case 'easeIn':
      return clamped * clamped;
    case 'easeOut':
      return 1 - (1 - clamped) * (1 - clamped);
    case 'easeInOut':
      return clamped < 0.5
        ? 4 * clamped * clamped * clamped
        : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
    case 'step':
      return clamped >= 1 ? 1 : 0;
    default:
      return clamped;
  }
}
