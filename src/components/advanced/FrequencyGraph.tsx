'use client';

import type { AdvancedTimelinePhase } from '@/types';
import { applyEasing } from '@/lib/easing';
import { getBrainwaveColor } from '@/lib/brainwave-states';

interface FrequencyGraphProps {
  phases: AdvancedTimelinePhase[];
  defaultBeatFreq: number;
}

export default function FrequencyGraph({ phases, defaultBeatFreq }: FrequencyGraphProps) {
  if (phases.length === 0) return null;

  const width = 320;
  const height = 120;
  const padding = { top: 15, right: 10, bottom: 20, left: 35 };
  const graphW = width - padding.left - padding.right;
  const graphH = height - padding.top - padding.bottom;

  const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0);
  if (totalDuration === 0) return null;

  // Find frequency range
  const allFreqs = phases.map((p) => p.beatFreq);
  allFreqs.push(defaultBeatFreq);
  const maxFreq = Math.max(...allFreqs, 15);
  const minFreq = 0;

  const freqToY = (f: number) => padding.top + graphH - ((f - minFreq) / (maxFreq - minFreq)) * graphH;
  const timeToX = (t: number) => padding.left + (t / totalDuration) * graphW;

  // Build path points
  const points: string[] = [];
  let accumulated = 0;
  let prevFreq = defaultBeatFreq;

  for (const phase of phases) {
    const startTime = accumulated;
    const steps = 20;

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const eased = applyEasing(phase.easing, t);
      const freq = prevFreq + (phase.beatFreq - prevFreq) * eased;
      const time = startTime + phase.duration * t;
      points.push(`${timeToX(time)},${freqToY(freq)}`);
    }

    prevFreq = phase.beatFreq;
    accumulated += phase.duration;
  }

  const pathD = `M ${points.join(' L ')}`;

  // Phase boundaries
  const boundaries: number[] = [];
  accumulated = 0;
  for (let i = 0; i < phases.length - 1; i++) {
    accumulated += phases[i].duration;
    boundaries.push(timeToX(accumulated));
  }

  // Y-axis labels
  const yLabels = [0, Math.round(maxFreq / 2), Math.round(maxFreq)];

  return (
    <div className="w-full flex justify-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[320px]" style={{ height: '120px' }}>
        {/* Grid lines */}
        {yLabels.map((freq) => (
          <g key={freq}>
            <line
              x1={padding.left}
              y1={freqToY(freq)}
              x2={width - padding.right}
              y2={freqToY(freq)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />
            <text
              x={padding.left - 4}
              y={freqToY(freq) + 3}
              textAnchor="end"
              fill="rgba(255,255,255,0.3)"
              fontSize="8"
              fontFamily="var(--font-jetbrains)"
            >
              {freq}
            </text>
          </g>
        ))}

        {/* Phase boundaries */}
        {boundaries.map((x, i) => (
          <line
            key={i}
            x1={x}
            y1={padding.top}
            x2={x}
            y2={height - padding.bottom}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.5"
            strokeDasharray="3,3"
          />
        ))}

        {/* Frequency path */}
        <path
          d={pathD}
          fill="none"
          stroke="#7986cb"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />

        {/* Phase target dots */}
        {(() => {
          let acc = 0;
          return phases.map((phase) => {
            acc += phase.duration;
            const x = timeToX(acc);
            const y = freqToY(phase.beatFreq);
            return (
              <circle
                key={phase.id}
                cx={x}
                cy={y}
                r="3"
                fill={getBrainwaveColor(phase.beatFreq)}
                opacity="0.8"
              />
            );
          });
        })()}

        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 3}
          textAnchor="middle"
          fill="rgba(255,255,255,0.25)"
          fontSize="8"
          fontFamily="var(--font-jetbrains)"
        >
          {totalDuration} min
        </text>

        {/* Y-axis label */}
        <text
          x={4}
          y={padding.top - 4}
          textAnchor="start"
          fill="rgba(255,255,255,0.25)"
          fontSize="7"
          fontFamily="var(--font-jetbrains)"
        >
          Hz
        </text>
      </svg>
    </div>
  );
}
