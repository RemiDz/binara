'use client';

import { useEffect, useRef } from 'react';
import { WAVE_STATES } from './wave-states';
import type { BrainwaveState } from '@/types';

interface WaveformSignatureProps {
  wave: BrainwaveState;
  freq: number;
  isHovered: boolean;
  width?: number;
  height?: number;
}

export default function WaveformSignature({ wave, freq, isHovered, width = 140, height = 28 }: WaveformSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const phaseRef = useRef(0);
  const hoveredRef = useRef(isHovered);
  const visibleRef = useRef(true);

  hoveredRef.current = isHovered;

  const waveState = WAVE_STATES[wave];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      if (!visibleRef.current) return;

      ctx.clearRect(0, 0, width, height);
      phaseRef.current += hoveredRef.current ? 0.06 : 0.015;

      const mid = height / 2;
      const amp = hoveredRef.current ? height * 0.38 : height * 0.25;
      const cycles = Math.max(2, Math.min(freq / 3, 8));

      // Glow layer
      ctx.beginPath();
      ctx.strokeStyle = waveState.glow;
      ctx.lineWidth = hoveredRef.current ? 6 : 3;
      ctx.filter = `blur(${hoveredRef.current ? 4 : 2}px)`;
      for (let x = 0; x <= width; x++) {
        const t = x / width;
        const y = mid + Math.sin(t * Math.PI * 2 * cycles + phaseRef.current) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.filter = 'none';

      // Main line
      ctx.beginPath();
      ctx.strokeStyle = waveState.color;
      ctx.lineWidth = hoveredRef.current ? 2 : 1.5;
      ctx.lineCap = 'round';
      for (let x = 0; x <= width; x++) {
        const t = x / width;
        const y = mid + Math.sin(t * Math.PI * 2 * cycles + phaseRef.current) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };

    // Use IntersectionObserver to pause animation when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          animRef.current = requestAnimationFrame(draw);
        } else {
          cancelAnimationFrame(animRef.current);
        }
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      observer.disconnect();
    };
  }, [wave, freq, width, height, waveState]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        opacity: isHovered ? 1 : 0.6,
        transition: 'opacity 0.4s ease',
      }}
    />
  );
}
