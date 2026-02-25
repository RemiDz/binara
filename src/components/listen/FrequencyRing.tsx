'use client';

import { WAVE_STATES } from './wave-states';
import type { BrainwaveState } from '@/types';

interface FrequencyRingProps {
  wave: BrainwaveState;
  freq: number;
  size?: number;
  isHovered: boolean;
}

export default function FrequencyRing({ wave, freq, size = 44, isHovered }: FrequencyRingProps) {
  const waveState = WAVE_STATES[wave];
  const normalised = Math.min(freq / 50, 1);
  const dashLength = 2 + normalised * 6;
  const gapLength = 2 + (1 - normalised) * 4;
  const rotation = isHovered ? 360 : 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{
        transition: 'transform 2s linear',
        transform: `rotate(${rotation}deg)`,
      }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 4) / 2}
          fill="none"
          stroke={waveState.color}
          strokeWidth={isHovered ? 2 : 1.5}
          strokeDasharray={`${dashLength} ${gapLength}`}
          opacity={isHovered ? 0.9 : 0.4}
          style={{ transition: 'all 0.4s ease' }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill={isHovered ? waveState.glow : 'transparent'}
          style={{ transition: 'fill 0.4s ease' }}
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-cormorant), Georgia, serif',
          fontSize: size * 0.42,
          fontWeight: 300,
          fontStyle: 'italic',
          color: waveState.color,
          opacity: isHovered ? 1 : 0.7,
          transition: 'all 0.4s ease',
        }}
      >
        {waveState.symbol}
      </span>
    </div>
  );
}
