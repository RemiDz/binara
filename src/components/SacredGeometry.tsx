'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProContext } from '@/context/ProContext';
import {
  renderFrame,
  resetParticles,
  getPulseRange,
  getVisColour,
} from '@/lib/sacred-geometry';
import type { GeometryType, RenderState } from '@/lib/sacred-geometry';

export type { GeometryType };

interface SacredGeometryProps {
  isActive: boolean;
  geometryType: GeometryType;
  beatFreq: number;
  /** radians rotation from motion sensors / auto motion */
  sensorRotation?: number;
  /** whether any ambient layer is playing (doubles particle rate) */
  ambientActive?: boolean;
}

export default function SacredGeometry({
  isActive,
  geometryType,
  beatFreq,
  sensorRotation = 0,
  ambientActive = false,
}: SacredGeometryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const hiddenRef = useRef(false);

  // Store latest props in refs for the render loop
  const propsRef = useRef({ geometryType, beatFreq, sensorRotation, ambientActive });
  propsRef.current = { geometryType, beatFreq, sensorRotation, ambientActive };

  useEffect(() => {
    if (!isActive) {
      resetParticles();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const updateSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    updateSize();

    startTimeRef.current = performance.now() / 1000;
    hiddenRef.current = false;

    // Adaptive performance: track frame times
    let slowFrameCount = 0;
    let reducedParticles = false;

    // 30fps render loop using setTimeout
    const FPS = 30;
    const FRAME_INTERVAL = 1000 / FPS;

    const renderLoop = () => {
      if (hiddenRef.current) {
        loopRef.current = null;
        return;
      }

      const frameStart = performance.now();
      const time = frameStart / 1000 - startTimeRef.current;
      const props = propsRef.current;

      // Beat-synced scale pulsing
      const { min, max } = getPulseRange(props.beatFreq);
      const pulseT = Math.sin(time * props.beatFreq * Math.PI * 2);
      const scale = min + (max - min) * (pulseT * 0.5 + 0.5);

      // Glow intensity pulsing (offset from scale by PI/3)
      const glowPulse = Math.sin(time * props.beatFreq * Math.PI * 2 + Math.PI / 3);
      const glowIntensity = 0.5 + 0.5 * (glowPulse * 0.5 + 0.5); // 0.5 to 1.0

      // Slow continuous rotation: 1 full revolution per 60 seconds
      const baseRotation = (time / 60) * Math.PI * 2;
      const rotation = baseRotation + props.sensorRotation;

      const state: RenderState = {
        geometryType: props.geometryType,
        beatFreq: props.beatFreq,
        time,
        scale,
        glowIntensity,
        rotation,
        ambientActive: props.ambientActive,
      };

      renderFrame(ctx, state);

      // Performance monitoring
      const frameDuration = performance.now() - frameStart;
      if (frameDuration > 40) {
        slowFrameCount++;
        if (slowFrameCount > 5 && !reducedParticles) {
          reducedParticles = true;
          // Reduce particle system (handled internally by render)
        }
      } else {
        slowFrameCount = Math.max(0, slowFrameCount - 1);
      }

      loopRef.current = setTimeout(renderLoop, FRAME_INTERVAL);
    };

    loopRef.current = setTimeout(renderLoop, 0);

    // Resize handler
    const handleResize = () => updateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      if (loopRef.current !== null) {
        clearTimeout(loopRef.current);
        loopRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive]);

  // Stop rendering when page is hidden (battery saving)
  useEffect(() => {
    if (!isActive) return;

    const handleVisibility = () => {
      if (document.hidden) {
        hiddenRef.current = true;
        if (loopRef.current !== null) {
          clearTimeout(loopRef.current);
          loopRef.current = null;
        }
      } else {
        hiddenRef.current = false;
        // Restart loop if it was stopped
        if (loopRef.current === null && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            startTimeRef.current = performance.now() / 1000;
            const FPS = 30;
            const renderLoop = () => {
              if (hiddenRef.current) {
                loopRef.current = null;
                return;
              }
              const time = performance.now() / 1000 - startTimeRef.current;
              const props = propsRef.current;
              const { min, max } = getPulseRange(props.beatFreq);
              const pulseT = Math.sin(time * props.beatFreq * Math.PI * 2);
              const scale = min + (max - min) * (pulseT * 0.5 + 0.5);
              const glowPulse = Math.sin(time * props.beatFreq * Math.PI * 2 + Math.PI / 3);
              const glowIntensity = 0.5 + 0.5 * (glowPulse * 0.5 + 0.5);
              const baseRotation = (time / 60) * Math.PI * 2;
              const rotation = baseRotation + props.sensorRotation;
              renderFrame(ctx, {
                geometryType: props.geometryType,
                beatFreq: props.beatFreq,
                time, scale, glowIntensity, rotation,
                ambientActive: props.ambientActive,
              });
              loopRef.current = setTimeout(renderLoop, 1000 / FPS);
            };
            loopRef.current = setTimeout(renderLoop, 0);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      className="pointer-events-none"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: '#050508',
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}

// ─── Geometry Toggle + Pill Selector ───

interface GeometryToggleProps {
  isActive: boolean;
  onToggle: () => void;
  geometryType: GeometryType;
  onGeometryChange: (type: GeometryType) => void;
  color?: string;
}

const GEOMETRY_OPTIONS: { type: GeometryType; label: string; pro: boolean }[] = [
  { type: 'circles', label: 'Circles', pro: false },
  { type: 'flower', label: 'Flower', pro: true },
  { type: 'metatron', label: 'Metatron', pro: true },
];

export function GeometryToggle({
  isActive,
  onToggle,
  geometryType,
  onGeometryChange,
  color = '#7986cb',
}: GeometryToggleProps) {
  const { isPro } = useProContext();

  const handleGeometrySelect = (type: GeometryType, requiresPro: boolean) => {
    if (requiresPro && !isPro) {
      window.dispatchEvent(new CustomEvent('binara:open-pro-upgrade'));
      return;
    }
    onGeometryChange(type);
  };

  return (
    <div className="space-y-2">
      {/* Toggle row */}
      <div
        className="flex items-center justify-between py-2 px-3 rounded-xl"
        style={{
          background: isActive ? `${color}08` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isActive ? `${color}20` : 'rgba(255,255,255,0.06)'}`,
          transition: 'all 0.3s ease',
        }}
      >
        <div className="flex items-center gap-2.5 flex-1">
          {/* Geometry icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive ? color : 'rgba(255,255,255,0.35)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.3s ease' }}>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          <span
            className="font-[family-name:var(--font-inter)] text-xs"
            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.3s ease' }}
          >
            Visualisation
          </span>
          {isActive && (
            <motion.span
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: color }}
            />
          )}
        </div>

        {/* Toggle switch */}
        <button
          onClick={onToggle}
          className="w-10 h-5 rounded-full relative transition-colors"
          style={{
            background: isActive ? `${color}40` : 'rgba(255,255,255,0.1)',
          }}
          aria-label={isActive ? 'Disable visualisation' : 'Enable visualisation'}
        >
          <div
            className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
            style={{
              background: isActive ? color : 'rgba(255,255,255,0.3)',
              left: isActive ? '22px' : '2px',
            }}
          />
        </button>
      </div>

      {/* Pill geometry selector — always visible when active */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-3"
          >
            <div className="flex items-center gap-2 py-1">
              {GEOMETRY_OPTIONS.map((opt) => {
                const locked = opt.pro && !isPro;
                const selected = geometryType === opt.type && !locked;
                return (
                  <button
                    key={opt.type}
                    onClick={() => handleGeometrySelect(opt.type, opt.pro)}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-[family-name:var(--font-inter)] font-medium transition-all flex items-center justify-center gap-1"
                    style={{
                      background: selected ? `${color}20` : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${selected ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
                      color: locked ? 'var(--text-muted)' : selected ? color : 'var(--text-secondary)',
                      opacity: locked ? 0.5 : 1,
                    }}
                  >
                    {locked && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
