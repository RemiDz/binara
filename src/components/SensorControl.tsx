'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProContext } from '@/context/ProContext';
import { useSensors } from '@/hooks/useSensors';
import { SensorEngine } from '@/lib/sensor-engine';
import { trackEvent } from '@/lib/analytics';

interface SensorControlProps {
  onFrequencyChange?: (freq: number) => void;
  onStereoWidthChange?: (width: number) => void;
  color?: string;
}

const UPGRADE_DESCRIPTION =
  'Unlock Motion Sensors with Binara PRO. Your phone\u2019s gyroscope creates a deeper experience \u2014 tilt to shift the spatial balance, stay still and the sound rewards you with harmonic overtones.';

export default function SensorControl({
  onFrequencyChange,
  onStereoWidthChange,
  color = '#7986cb',
}: SensorControlProps) {
  const { isPro } = useProContext();
  const sensors = useSensors();
  const [expanded, setExpanded] = useState(false);
  const [sensorEnabled, setSensorEnabled] = useState(false);

  // Hide on desktop
  if (!SensorEngine.available) return null;

  const handleToggleSensor = async () => {
    if (!isPro) return; // Free users can't toggle
    if (!sensorEnabled) {
      if (!sensors.permissionGranted) {
        const granted = await sensors.requestPermission();
        if (!granted) return;
      }
      sensors.start();
      setSensorEnabled(true);
      trackEvent('Sensor Enabled');
      // Notify AutoMotionControl to disable
      window.dispatchEvent(new CustomEvent('binara:sensor-activated'));
    } else {
      sensors.stop();
      setSensorEnabled(false);
    }
  };

  // Push tilt→frequency and tilt→stereo updates when sensors are active
  useEffect(() => {
    if (!sensors.active) return;

    const freq = sensors.getTiltFrequency();
    onFrequencyChange?.(freq);

    if (onStereoWidthChange) {
      const width = sensors.getTiltStereoWidth();
      onStereoWidthChange(width * 100);
    }
  }, [sensors.state.pitch, sensors.state.roll, sensors.active, onFrequencyChange, onStereoWidthChange, sensors]);

  // Mutual exclusivity: disable sensors when auto motion activates
  useEffect(() => {
    const handler = () => {
      if (sensorEnabled) {
        sensors.stop();
        setSensorEnabled(false);
      }
    };
    window.addEventListener('binara:auto-motion-activated', handler);
    return () => window.removeEventListener('binara:auto-motion-activated', handler);
  }, [sensorEnabled, sensors]);

  return (
    <div className="space-y-2">
      {/* Toggle header */}
      <button
        onClick={() => isPro ? setExpanded(!expanded) : undefined}
        className="w-full flex items-center justify-between py-2"
        style={{
          opacity: isPro ? 1 : 0.4,
          cursor: isPro ? 'pointer' : 'default',
        }}
      >
        <div className="flex items-center gap-2">
          {/* Lock icon for free users, phone icon for PRO */}
          {!isPro ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
              <line x1="12" y1="18" x2="12" y2="18.01" />
            </svg>
          )}
          <span
            className="font-[family-name:var(--font-inter)] text-xs font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Phone Sensors
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isPro && sensors.active && (
            <span
              className="font-[family-name:var(--font-jetbrains)] text-[9px] px-1.5 py-0.5 rounded-md"
              style={{
                background: `${color}15`,
                border: `1px solid ${color}25`,
                color,
              }}
            >
              LIVE
            </span>
          )}
          {isPro && (
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round"
              style={{
                color: 'var(--text-muted)',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
      </button>

      {/* Inline upgrade description for free users — always visible */}
      {!isPro && (
        <div className="px-1 space-y-2">
          <p
            className="font-[family-name:var(--font-inter)] text-xs leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {UPGRADE_DESCRIPTION}
          </p>
          <a
            href="#upgrade"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('binara:open-pro-upgrade'));
            }}
            className="font-[family-name:var(--font-inter)] text-xs font-medium inline-block"
            style={{ color: '#F7B731', opacity: 0.6, textDecoration: 'none' }}
          >
            Upgrade to PRO
          </a>
        </div>
      )}

      {/* PRO user: expandable sensor controls */}
      {isPro && (
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-4"
            >
              {/* Sensor on/off toggle */}
              <div className="flex items-center justify-between">
                <span
                  className="font-[family-name:var(--font-inter)] text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {sensorEnabled ? 'Sensor active' : 'Enable sensor control'}
                </span>
                <button
                  onClick={handleToggleSensor}
                  className="w-10 h-5 rounded-full relative transition-colors"
                  style={{
                    background: sensorEnabled ? `${color}40` : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
                    style={{
                      background: sensorEnabled ? color : 'rgba(255,255,255,0.3)',
                      left: sensorEnabled ? '22px' : '2px',
                    }}
                  />
                </button>
              </div>

              {sensors.active && (
                <>
                  {/* 3D Phone orientation preview */}
                  <div className="flex justify-center py-2" style={{ perspective: '400px' }}>
                    <div
                      style={{
                        width: 60,
                        height: 100,
                        borderRadius: 12,
                        border: `1.5px solid ${color}30`,
                        background: `${color}06`,
                        position: 'relative',
                        transformStyle: 'preserve-3d',
                        transform: `rotateX(${-sensors.state.pitch * 0.5}deg) rotateY(${sensors.state.roll * 0.5}deg)`,
                        transition: 'transform 0.1s ease-out',
                      }}
                    >
                      {/* Screen area */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 5,
                          right: 5,
                          bottom: 18,
                          borderRadius: 4,
                          border: `1px solid ${color}15`,
                          background: `${color}08`,
                        }}
                      />
                      {/* Home bar */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 6,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 20,
                          height: 2,
                          borderRadius: 1,
                          background: `${color}30`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Tilt → Frequency */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className="font-[family-name:var(--font-inter)] text-[11px]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Tilt {"\u2192"} Frequency
                      </span>
                      <span
                        className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                        style={{ color }}
                      >
                        {sensors.getTiltFrequency().toFixed(1)} Hz
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-jetbrains)] text-[9px] w-8" style={{ color: 'var(--text-muted)' }}>Min</span>
                        <input
                          type="range"
                          className="flex-1 h-[32px]"
                          min={0.5} max={20} step={0.5}
                          value={sensors.config.tiltFreqMin}
                          onChange={(e) => sensors.updateConfig({ tiltFreqMin: Number(e.target.value) })}
                        />
                        <span className="font-[family-name:var(--font-jetbrains)] text-[9px] w-10 text-right" style={{ color: 'var(--text-muted)' }}>{sensors.config.tiltFreqMin} Hz</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-jetbrains)] text-[9px] w-8" style={{ color: 'var(--text-muted)' }}>Max</span>
                        <input
                          type="range"
                          className="flex-1 h-[32px]"
                          min={5} max={50} step={1}
                          value={sensors.config.tiltFreqMax}
                          onChange={(e) => sensors.updateConfig({ tiltFreqMax: Number(e.target.value) })}
                        />
                        <span className="font-[family-name:var(--font-jetbrains)] text-[9px] w-10 text-right" style={{ color: 'var(--text-muted)' }}>{sensors.config.tiltFreqMax} Hz</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-jetbrains)] text-[9px] w-8" style={{ color: 'var(--text-muted)' }}>Sens</span>
                        <input
                          type="range"
                          className="flex-1 h-[32px]"
                          min={1} max={10} step={1}
                          value={sensors.config.tiltSensitivity}
                          onChange={(e) => sensors.updateConfig({ tiltSensitivity: Number(e.target.value) })}
                        />
                        <span className="font-[family-name:var(--font-jetbrains)] text-[9px] w-10 text-right" style={{ color: 'var(--text-muted)' }}>{sensors.config.tiltSensitivity}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tilt → Stereo Width */}
                  {onStereoWidthChange && (
                    <div className="flex items-center justify-between">
                      <span
                        className="font-[family-name:var(--font-inter)] text-[11px]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Tilt {"\u2192"} Stereo Width
                      </span>
                      <span
                        className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                        style={{ color }}
                      >
                        {Math.round(sensors.getTiltStereoWidth() * 100)}%
                      </span>
                    </div>
                  )}

                  {/* Motion section */}
                  <div className="space-y-1.5">
                    <span
                      className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Motion
                    </span>
                    <div className="flex items-center justify-between">
                      <span
                        className="font-[family-name:var(--font-inter)] text-[11px]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Stillness
                      </span>
                      <span
                        className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                        style={{ color: sensors.state.isStill ? '#4caf50' : 'var(--text-muted)' }}
                      >
                        {sensors.state.isStill ? 'Still' : 'Moving'}
                      </span>
                    </div>
                    {sensors.state.breathRate > 0 && (
                      <div className="flex items-center justify-between">
                        <span
                          className="font-[family-name:var(--font-inter)] text-[11px]"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Breath Rate
                        </span>
                        <span
                          className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                          style={{ color }}
                        >
                          {sensors.state.breathRate} BPM
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Face-down status */}
                  <div className="flex items-center justify-between">
                    <span
                      className="font-[family-name:var(--font-inter)] text-[11px]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Phone Position
                    </span>
                    <span
                      className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                      style={{ color: sensors.state.isFaceDown ? color : 'var(--text-muted)' }}
                    >
                      {sensors.state.isFaceDown ? 'Face-down' : 'Face-up'}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
