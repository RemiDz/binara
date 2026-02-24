'use client';

import { useMemo } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

interface NeuralLine {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  duration: number;
  delay: number;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function Background() {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: seededRandom(i * 13 + 7) * 100,
      y: seededRandom(i * 17 + 3) * 100,
      size: seededRandom(i * 23 + 11) * 2 + 1,
      color: i % 3 === 0 ? '#7986cb' : '#4fc3f7',
      duration: seededRandom(i * 31 + 5) * 15 + 20,
      delay: seededRandom(i * 37 + 19) * -20,
      driftX: (seededRandom(i * 41 + 2) - 0.5) * 30,
      driftY: (seededRandom(i * 43 + 9) - 0.5) * 20,
    }));
  }, []);

  const neuralLines = useMemo<NeuralLine[]>(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x1: seededRandom(i * 53 + 1) * 100,
      y1: seededRandom(i * 59 + 7) * 100,
      x2: seededRandom(i * 61 + 13) * 100,
      y2: seededRandom(i * 67 + 17) * 100,
      duration: seededRandom(i * 71 + 23) * 10 + 15,
      delay: seededRandom(i * 73 + 29) * -10,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #050810 0%, #0a1628 50%, #050810 100%)',
        }}
      />

      {/* Neural pathway lines */}
      <svg className="absolute inset-0 w-full h-full">
        {neuralLines.map((line) => (
          <line
            key={line.id}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke="#4fc3f7"
            strokeWidth="0.5"
            opacity="0.04"
            className="animate-neural-pulse"
            style={{
              animationDuration: `${line.duration}s`,
              animationDelay: `${line.delay}s`,
            }}
          />
        ))}
      </svg>

      {/* Bioluminescent particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-particle-drift"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: 0.15,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}40`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            ['--drift-x' as string]: `${p.driftX}px`,
            ['--drift-y' as string]: `${p.driftY}px`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes particle-drift {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.1;
          }
          25% {
            opacity: 0.25;
          }
          50% {
            transform: translate(var(--drift-x, 15px), var(--drift-y, -10px));
            opacity: 0.15;
          }
          75% {
            opacity: 0.2;
          }
        }
        @keyframes neural-pulse {
          0%, 100% {
            opacity: 0.02;
          }
          50% {
            opacity: 0.06;
          }
        }
        .animate-particle-drift {
          animation: particle-drift var(--duration, 20s) ease-in-out infinite;
        }
        .animate-neural-pulse {
          animation: neural-pulse var(--duration, 15s) ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-particle-drift,
          .animate-neural-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
