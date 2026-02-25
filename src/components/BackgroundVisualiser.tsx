'use client';

import { useRef, useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface BackgroundVisualiserProps {
  beatFrequency: number;
  isPlaying: boolean;
  color?: string;
}

export default function BackgroundVisualiser({
  beatFrequency,
  isPlaying,
  color = '#4fc3f7',
}: BackgroundVisualiserProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const reducedMotion = useReducedMotion();
  const [pageVisible, setPageVisible] = useState(true);

  // Track page visibility for battery savings
  useEffect(() => {
    const handler = () => setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Don't animate when page is hidden (battery saving)
    if (!pageVisible) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.scale(dpr, dpr);
    }

    resize();
    window.addEventListener('resize', resize);

    let lastFrame = 0;
    const frameDuration = 1000 / 30; // 30fps cap

    function draw(time: number) {
      if (time - lastFrame < frameDuration) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrame = time;

      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      ctx!.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.max(w, h) * 0.8;

      if (reducedMotion || !isPlaying) {
        // Static subtle radial gradient
        const gradient = ctx!.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 0.3);
        gradient.addColorStop(0, `${color}08`);
        gradient.addColorStop(1, `${color}00`);
        ctx!.fillStyle = gradient;
        ctx!.fillRect(0, 0, w, h);
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const timeSec = time / 1000;

      // Concentric ripples expanding outward
      const ringCount = 5;
      const cycleDuration = 1 / beatFrequency;
      const phase = (timeSec % cycleDuration) / cycleDuration;

      for (let i = 0; i < ringCount; i++) {
        const ringPhase = (phase + i / ringCount) % 1;
        const radius = ringPhase * maxRadius;
        const opacity = (1 - ringPhase) * 0.07;

        ctx!.beginPath();
        ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx!.strokeStyle = `${color}`;
        ctx!.globalAlpha = opacity;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      }

      // Central glow — subtle radial gradient that pulses
      const pulseIntensity = 0.03 + Math.sin(timeSec * beatFrequency * Math.PI * 2) * 0.02;
      const gradient = ctx!.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 0.3);
      gradient.addColorStop(0, `${color}`);
      gradient.addColorStop(1, `${color}00`);
      ctx!.globalAlpha = pulseIntensity;
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, w, h);
      ctx!.globalAlpha = 1;

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [beatFrequency, isPlaying, color, reducedMotion, pageVisible]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
}
