'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { Preset } from '@/types';

const PREVIEW_DURATION = 15; // seconds
const PREVIEW_GAIN = 0.3;
const FADE_IN = 0.5; // seconds
const FADE_OUT = 0.3; // seconds
const BASE_CARRIER = 200; // Hz

interface PreviewSource {
  leftOsc: OscillatorNode;
  rightOsc: OscillatorNode;
  leftGain: GainNode;
  rightGain: GainNode;
  merger: ChannelMergerNode;
  masterGain: GainNode;
}

export function usePreview() {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<PreviewSource | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);

  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewingPreset, setPreviewingPreset] = useState<Preset | null>(null);
  const [progress, setProgress] = useState(0);

  // Ensure AudioContext exists
  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const stopPreview = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }

    const src = sourceRef.current;
    if (src && ctxRef.current) {
      const now = ctxRef.current.currentTime;
      src.masterGain.gain.cancelScheduledValues(now);
      src.masterGain.gain.setValueAtTime(src.masterGain.gain.value, now);
      src.masterGain.gain.linearRampToValueAtTime(0, now + FADE_OUT);

      const cleanup = () => {
        try { src.leftOsc.stop(); } catch { /* */ }
        try { src.rightOsc.stop(); } catch { /* */ }
        src.leftOsc.disconnect();
        src.rightOsc.disconnect();
        src.leftGain.disconnect();
        src.rightGain.disconnect();
        src.merger.disconnect();
        src.masterGain.disconnect();
      };
      setTimeout(cleanup, FADE_OUT * 1000 + 50);
    }

    sourceRef.current = null;
    setPreviewingId(null);
    setPreviewingPreset(null);
    setProgress(0);
  }, []);

  const startPreview = useCallback((preset: Preset) => {
    // Stop any existing preview first
    stopPreview();

    const ctx = getCtx();
    const now = ctx.currentTime;

    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    const merger = ctx.createChannelMerger(2);
    const masterGain = ctx.createGain();

    leftOsc.type = 'sine';
    rightOsc.type = 'sine';
    leftOsc.frequency.setValueAtTime(preset.carrierFreq, now);
    rightOsc.frequency.setValueAtTime(preset.carrierFreq + preset.beatFreq, now);

    leftOsc.connect(leftGain);
    rightOsc.connect(rightGain);
    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);
    merger.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Fade in
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(PREVIEW_GAIN, now + FADE_IN);

    leftOsc.start(now);
    rightOsc.start(now);

    sourceRef.current = { leftOsc, rightOsc, leftGain, rightGain, merger, masterGain };
    setPreviewingId(preset.id);
    setPreviewingPreset(preset);
    startTimeRef.current = performance.now();

    // Progress animation loop
    const tick = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const p = Math.min(elapsed / PREVIEW_DURATION, 1);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    // Auto-stop after duration
    timeoutRef.current = setTimeout(() => {
      stopPreview();
    }, PREVIEW_DURATION * 1000);
  }, [getCtx, stopPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreview();
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close();
      }
    };
  }, [stopPreview]);

  return { previewingId, previewingPreset, progress, startPreview, stopPreview };
}
