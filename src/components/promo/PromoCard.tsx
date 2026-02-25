'use client';

import { useRef, useState } from 'react';
import html2canvas from 'html2canvas-pro';

export type CardFormat = 'post' | 'story';

export interface PromoCardProps {
  cardNumber: number;
  totalCards: number;
  accentColor: string;
  format: CardFormat;
  children: React.ReactNode;
}

function getDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const DIMENSIONS: Record<CardFormat, { width: number; height: number }> = {
  post: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
};

export async function captureCard(element: HTMLElement, format: CardFormat): Promise<Blob> {
  const { width, height } = DIMENSIONS[format];
  const canvas = await html2canvas(element, {
    width,
    height,
    scale: 2,
    backgroundColor: '#050810',
    useCORS: true,
    logging: false,
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
  });
}

export function downloadImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate star field dots
function generateStars(count: number): { x: number; y: number; size: number; opacity: number }[] {
  const stars: { x: number; y: number; size: number; opacity: number }[] = [];
  // Use deterministic seeding so stars don't change on re-render
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand() * 100,
      y: rand() * 100,
      size: rand() * 1.5 + 0.5,
      opacity: rand() * 0.4 + 0.1,
    });
  }
  return stars;
}

const STARS = generateStars(20);

export default function PromoCard({ cardNumber, totalCards, accentColor, format, children }: PromoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const { width, height } = DIMENSIONS[format];

  const handleSave = async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const blob = await captureCard(cardRef.current, format);
      downloadImage(blob, `binara-card-${cardNumber}-${format}.png`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Card preview (scaled down for display) */}
      <div
        style={{
          width: format === 'post' ? 320 : 240,
          height: format === 'post' ? 320 : 426,
          overflow: 'hidden',
          borderRadius: 12,
          border: '1px solid var(--glass-border)',
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `scale(${format === 'post' ? 320 / 1080 : 240 / 1080})`,
            transformOrigin: 'top left',
            width: 1080,
            height,
          }}
        >
          <div
            ref={cardRef}
            data-card-id={cardNumber}
            style={{
              width,
              height,
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(180deg, #050810 0%, #0a1628 100%)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {/* Star field */}
            {STARS.map((star, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: star.size * 2,
                  height: star.size * 2,
                  borderRadius: '50%',
                  background: 'white',
                  opacity: star.opacity,
                }}
              />
            ))}

            {/* Accent stripe at top */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: accentColor,
              }}
            />

            {/* Radial glow */}
            <div
              style={{
                position: 'absolute',
                top: '30%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80%',
                height: '60%',
                borderRadius: '50%',
                background: `radial-gradient(ellipse, ${accentColor}0d 0%, transparent 70%)`,
              }}
            />

            {/* Card content */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: format === 'story' ? '80px 60px 60px' : '60px 60px 50px',
              }}
            >
              {children}
            </div>

            {/* Footer */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: format === 'story' ? '0 60px 50px' : '0 60px 40px',
                zIndex: 2,
              }}
            >
              {/* Gradient divider */}
              <div
                style={{
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
                  marginBottom: 20,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 300,
                    letterSpacing: '0.15em',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  binara.app
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      fontSize: 16,
                      color: 'rgba(255,255,255,0.25)',
                    }}
                  >
                    {getDateString()}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.25)',
                    }}
                  >
                    {cardNumber}/{totalCards}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="font-[family-name:var(--font-inter)] text-xs font-medium px-4 py-2 rounded-full transition-all active:scale-[0.97]"
        style={{
          background: 'rgba(79, 195, 247, 0.08)',
          border: '1px solid rgba(79, 195, 247, 0.2)',
          color: '#4fc3f7',
          opacity: saving ? 0.5 : 1,
        }}
      >
        {saving ? 'Saving...' : 'Save PNG'}
      </button>
    </div>
  );
}
