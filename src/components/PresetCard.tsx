'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import FrequencyRing from './listen/FrequencyRing';
import WaveformSignature from './listen/WaveformSignature';
import { WAVE_STATES } from './listen/wave-states';
import type { Preset } from '@/types';

interface PresetCardProps {
  preset: Preset;
  index: number;
  onSelect: (preset: Preset) => void;
  previewingId: string | null;
  previewProgress: number;
  onPreviewToggle: (preset: Preset) => void;
  onStopPreview: () => void;
}

export default function PresetCard({
  preset,
  index,
  onSelect,
  previewingId,
  previewProgress,
  onPreviewToggle,
  onStopPreview,
}: PresetCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const waveState = WAVE_STATES[preset.brainwaveState];
  const isPreviewing = previewingId === preset.id;

  const handlePlayClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    trackEvent('Preset Preview', { preset: preset.name, action: isPreviewing ? 'stop' : 'start' });
    onPreviewToggle(preset);
  };

  const handleCardClick = () => {
    onStopPreview();
    trackEvent('Preset Play', { preset: preset.name, category: preset.category });
    onSelect(preset);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => { setIsHovered(false); setIsPressed(false); }}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      style={{
        position: 'relative',
        padding: '1px',
        borderRadius: 16,
        background: isPreviewing
          ? `linear-gradient(135deg, ${waveState.color}50, transparent 50%, ${waveState.color}30)`
          : isHovered
            ? `linear-gradient(135deg, ${waveState.color}40, transparent 50%, ${waveState.color}20)`
            : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isPressed ? 'scale(0.97)' : isHovered ? 'translateY(-2px)' : 'none',
        cursor: 'pointer',
        animation: `cardReveal 0.5s ease ${index * 0.06}s both`,
      }}
    >
      {/* Card inner */}
      <div style={{
        position: 'relative',
        borderRadius: 15,
        padding: '16px 16px 14px',
        background: isPreviewing
          ? `radial-gradient(ellipse at top left, ${waveState.color}0C, rgba(12,14,24,0.97) 70%)`
          : isHovered
            ? `radial-gradient(ellipse at top left, ${waveState.color}08, rgba(12,14,24,0.97) 70%)`
            : 'rgba(12,14,24,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        overflow: 'hidden',
        minHeight: 140,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>

        {/* Top row: ring + name + freq */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <FrequencyRing wave={preset.brainwaveState} freq={preset.beatFreq} isHovered={isHovered || isPreviewing} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-cormorant), Georgia, serif',
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: (isHovered || isPreviewing) ? '#F0EDE6' : 'rgba(240,237,230,0.85)',
              lineHeight: 1.2,
              transition: 'color 0.3s ease',
            }}>
              {preset.name}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 4,
            }}>
              <span style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: 10.5,
                fontWeight: 500,
                color: waveState.color,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                opacity: (isHovered || isPreviewing) ? 1 : 0.7,
                transition: 'opacity 0.3s ease',
              }}>
                {waveState.label}
              </span>
              <span style={{
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: 10.5,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.04em',
              }}>
                {preset.beatFreq} Hz
              </span>
            </div>
          </div>
        </div>

        {/* Waveform signature */}
        <div style={{
          margin: '10px 0 6px',
          display: 'flex',
          justifyContent: 'center',
          opacity: (isHovered || isPreviewing) ? 1 : 0.5,
          transition: 'opacity 0.4s ease',
        }}>
          <WaveformSignature
            wave={preset.brainwaveState}
            freq={preset.beatFreq}
            isHovered={isHovered || isPreviewing}
            width={140}
            height={28}
          />
        </div>

        {/* Description */}
        <p style={{
          fontFamily: 'var(--font-inter), -apple-system, sans-serif',
          fontSize: 11.5,
          lineHeight: 1.45,
          color: (isHovered || isPreviewing) ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)',
          margin: 0,
          letterSpacing: '0.01em',
          transition: 'color 0.3s ease',
        }}>
          {preset.description}
        </p>

        {/* Bottom: duration + play/pause button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
        }}>
          <span style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 10,
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.08em',
          }}>
            {preset.defaultDuration} min
          </span>

          {/* Play / Pause button */}
          <button
            onClick={handlePlayClick}
            onTouchEnd={(e) => {
              e.stopPropagation();
            }}
            aria-label={isPreviewing ? 'Stop preview' : 'Preview beat'}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: `1.5px solid ${isPreviewing ? waveState.color : isHovered ? waveState.color : 'rgba(255,255,255,0.08)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              background: isPreviewing
                ? `${waveState.color}25`
                : isHovered
                  ? `${waveState.color}15`
                  : 'transparent',
              cursor: 'pointer',
              padding: 0,
              outline: 'none',
              animation: isPreviewing ? 'previewPulse 2s ease-in-out infinite' : 'none',
            }}
          >
            {isPreviewing ? (
              // Pause icon (two bars)
              <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
                <rect x="0.5" y="0.5" width="2.5" height="9" rx="0.5" fill={waveState.color} />
                <rect x="5" y="0.5" width="2.5" height="9" rx="0.5" fill={waveState.color} />
              </svg>
            ) : (
              // Play icon (triangle)
              <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
                <path
                  d="M1 1L7 5L1 9V1Z"
                  fill={(isHovered) ? waveState.color : 'rgba(255,255,255,0.15)'}
                  style={{ transition: 'fill 0.3s ease' }}
                />
              </svg>
            )}
          </button>
        </div>

        {/* Preview progress bar */}
        {isPreviewing && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'rgba(255,255,255,0.04)',
          }}>
            <div style={{
              height: '100%',
              width: `${previewProgress * 100}%`,
              background: `linear-gradient(90deg, ${waveState.color}80, ${waveState.color})`,
              borderRadius: '0 1px 1px 0',
              transition: 'width 0.1s linear',
            }} />
          </div>
        )}

        {/* Ambient corner glow on hover or preview */}
        {(isHovered || isPreviewing) && (
          <div style={{
            position: 'absolute',
            top: -30,
            left: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${waveState.color}${isPreviewing ? '18' : '12'}, transparent 70%)`,
            pointerEvents: 'none',
          }} />
        )}
      </div>
    </div>
  );
}
