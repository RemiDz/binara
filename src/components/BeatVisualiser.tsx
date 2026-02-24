'use client';

import { useRef, useEffect } from 'react';

interface BeatVisualiserProps {
  beatFrequency: number;
  color: string;
  isPlaying: boolean;
}

const RINGS = [
  { baseRadius: 40, maxExpand: 15, phase: 0 },
  { baseRadius: 65, maxExpand: 12, phase: 0.3 },
  { baseRadius: 90, maxExpand: 10, phase: 0.6 },
  { baseRadius: 115, maxExpand: 8, phase: 0.9 },
];

export default function BeatVisualiser({ beatFrequency, color, isPlaying }: BeatVisualiserProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 280;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;

    let lastFrame = 0;
    const frameDuration = 1000 / 30; // 30fps throttle

    function draw(time: number) {
      if (time - lastFrame < frameDuration) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrame = time;

      ctx!.clearRect(0, 0, size, size);

      // Background glow
      const gradient = ctx!.createRadialGradient(cx, cy, 0, cx, cy, 130);
      gradient.addColorStop(0, `${color}15`);
      gradient.addColorStop(1, 'transparent');
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, size, size);

      const beatCycle = reducedMotion.current
        ? 0
        : (time / 1000) * beatFrequency * Math.PI * 2;

      // Draw rings
      for (const ring of RINGS) {
        const expand = isPlaying && !reducedMotion.current
          ? Math.sin(beatCycle + ring.phase) * ring.maxExpand
          : 0;
        const radius = ring.baseRadius + expand;
        const opacity = isPlaying
          ? 0.15 + (reducedMotion.current ? 0 : Math.sin(beatCycle + ring.phase) * 0.1)
          : 0.08;

        ctx!.beginPath();
        ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx!.strokeStyle = color;
        ctx!.globalAlpha = opacity;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      }

      // Centre dot
      const dotPulse = isPlaying && !reducedMotion.current
        ? 4 + Math.sin(beatCycle) * 2
        : 4;
      ctx!.beginPath();
      ctx!.arc(cx, cy, dotPulse, 0, Math.PI * 2);
      ctx!.fillStyle = color;
      ctx!.globalAlpha = isPlaying ? 0.6 : 0.3;
      ctx!.fill();
      ctx!.globalAlpha = 1;

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [beatFrequency, color, isPlaying]);

  return (
    <div className="flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-[280px] h-[280px]"
        aria-label={`Beat visualiser pulsing at ${beatFrequency} Hz`}
      />
    </div>
  );
}
