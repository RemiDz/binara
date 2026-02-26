'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProContext } from '@/context/ProContext';
import { renderGeometry, resetParticles } from '@/lib/sacred-geometry';
import type { GeometryType, GeometryState } from '@/lib/sacred-geometry';

interface SacredGeometryProps {
  isActive: boolean;
  geometryType: GeometryType;
  beatFreq: number;
  color: string;
  /** 0–1 breathing scale override (if breathing overlay active) */
  breathingScale?: number | null;
  /** radians rotation from motion sensors */
  rotation?: number;
  /** 0–1 ambient layer volume for particles */
  ambientVolume?: number;
}

export default function SacredGeometry({
  isActive,
  geometryType,
  beatFreq,
  color,
  breathingScale = null,
  rotation = 0,
  ambientVolume = 0,
}: SacredGeometryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);

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
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    updateSize();

    lastTimeRef.current = performance.now();

    // Target ~30fps
    let frameCount = 0;

    const loop = () => {
      frameCount++;
      // Skip every other frame for ~30fps
      if (frameCount % 2 !== 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const now = performance.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Calculate beat-driven scale
      let scale: number;
      if (breathingScale !== null && breathingScale !== undefined) {
        // Breathing takes priority
        scale = 0.95 + breathingScale * 0.1;
      } else {
        // Beat-frequency pulsing
        const t = now / 1000;
        const pulseAmount = beatFreq <= 4 ? 0.05 : beatFreq <= 14 ? 0.02 : 0.01;
        scale = 1 + Math.sin(t * beatFreq * Math.PI * 2) * pulseAmount;
      }

      const state: GeometryState = {
        geometryType,
        scale,
        rotation,
        colour: color,
        glowColour: color,
        glowIntensity: 0.5,
        opacity: 0.2,
        particleIntensity: ambientVolume,
      };

      renderGeometry(ctx, state, dt);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    // Resize handler
    const resizeObserver = new ResizeObserver(updateSize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
  }, [isActive, geometryType, beatFreq, color, breathingScale, rotation, ambientVolume]);

  // Stop rendering when page is hidden
  useEffect(() => {
    if (!isActive) return;

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else {
        // Will restart via the main effect's dependency on isActive
        lastTimeRef.current = performance.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}

// ─── Geometry Toggle + Selector ───

interface GeometryToggleProps {
  isActive: boolean;
  onToggle: () => void;
  geometryType: GeometryType;
  onGeometryChange: (type: GeometryType) => void;
  color?: string;
}

const GEOMETRY_OPTIONS: { type: GeometryType; label: string; pro: boolean }[] = [
  { type: 'circles', label: 'Concentric Circles', pro: false },
  { type: 'flower', label: 'Flower of Life', pro: true },
  { type: 'metatron', label: "Metatron's Cube", pro: true },
];

export function GeometryToggle({
  isActive,
  onToggle,
  geometryType,
  onGeometryChange,
  color = '#7986cb',
}: GeometryToggleProps) {
  const { isPro } = useProContext();
  const [expanded, setExpanded] = useState(false);

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
        <button
          className="flex items-center gap-2.5 flex-1"
          onClick={() => setExpanded(!expanded)}
        >
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
        </button>

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

      {/* Expandable geometry selector */}
      <AnimatePresence>
        {expanded && isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-3"
          >
            <div className="flex items-center gap-2 py-1 flex-wrap">
              <span
                className="font-[family-name:var(--font-inter)] text-[11px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Style
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {GEOMETRY_OPTIONS.map((opt) => {
                  const locked = opt.pro && !isPro;
                  return (
                    <button
                      key={opt.type}
                      onClick={() => handleGeometrySelect(opt.type, opt.pro)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-[family-name:var(--font-inter)] transition-all flex items-center gap-1"
                      style={{
                        background: geometryType === opt.type && !locked ? `${color}20` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${geometryType === opt.type && !locked ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
                        color: locked ? 'var(--text-muted)' : geometryType === opt.type ? color : 'var(--text-muted)',
                        opacity: locked ? 0.5 : 1,
                      }}
                    >
                      {locked && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      )}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
