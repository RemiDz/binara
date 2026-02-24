'use client';

import { useState } from 'react';
import PromoCard, { captureCard, downloadImage } from './PromoCard';
import type { CardFormat } from './PromoCard';
import { CARD_CONFIGS } from './PromoCards';
import HooksLibrary from './HooksLibrary';
import CaptionTemplates from './CaptionTemplates';
import ContentCalendar from './ContentCalendar';

export default function PromoPage() {
  const [format, setFormat] = useState<CardFormat>('post');
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handleDownloadAll = async () => {
    if (downloadingAll) return;
    setDownloadingAll(true);
    try {
      for (const config of CARD_CONFIGS) {
        const el = document.querySelector(`[data-card-id="${config.id}"]`) as HTMLElement | null;
        if (!el) continue;
        const blob = await captureCard(el, format);
        downloadImage(blob, `binara-card-${config.id}-${config.name}.png`);
        await new Promise((r) => setTimeout(r, 100));
      }
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div
      className="min-h-dvh"
      style={{ background: '#050810' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 glass px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1
              className="font-[family-name:var(--font-playfair)] text-base tracking-[0.15em] uppercase"
              style={{ color: 'var(--text-primary)' }}
            >
              B I N A R A
            </h1>
            <span
              className="font-[family-name:var(--font-jetbrains)] text-[10px] font-medium px-2 py-0.5 rounded"
              style={{ background: 'rgba(79, 195, 247, 0.1)', color: '#4fc3f7' }}
            >
              CONTENT STUDIO
            </span>
          </div>
          <a
            href="/"
            className="font-[family-name:var(--font-inter)] text-xs px-3 py-1.5 rounded-full transition-all"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
            }}
          >
            {'\u2190'} Back
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-16">
        {/* Quick stats bar */}
        <section
          className="rounded-xl p-5"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <span className="font-[family-name:var(--font-inter)] text-sm" style={{ color: 'var(--text-secondary)' }}>
              Presets: <span style={{ color: '#4fc3f7' }}>24</span>
            </span>
            <span className="font-[family-name:var(--font-inter)] text-sm" style={{ color: 'var(--text-secondary)' }}>
              Modes: <span style={{ color: '#4fc3f7' }}>3</span>
            </span>
            <span className="font-[family-name:var(--font-inter)] text-sm" style={{ color: 'var(--text-secondary)' }}>
              Beat Range: <span style={{ color: '#4fc3f7' }}>0.5{'\u2013'}50 Hz</span>
            </span>
            <span className="font-[family-name:var(--font-inter)] text-sm" style={{ color: 'var(--text-secondary)' }}>
              Brainwave States:{' '}
              <span style={{ color: '#1a237e' }}>Delta</span> {'\u00B7'}{' '}
              <span style={{ color: '#7986cb' }}>Theta</span> {'\u00B7'}{' '}
              <span style={{ color: '#4fc3f7' }}>Alpha</span> {'\u00B7'}{' '}
              <span style={{ color: '#ffab40' }}>Beta</span> {'\u00B7'}{' '}
              <span style={{ color: '#e040fb' }}>Gamma</span>
            </span>
          </div>
        </section>

        {/* Shareable Cards */}
        <section>
          <h2
            className="font-[family-name:var(--font-playfair)] text-lg mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Shareable Cards
          </h2>

          {/* Format selector */}
          <div className="flex gap-2 mb-6">
            {([
              { value: 'post' as const, label: 'Post 1:1' },
              { value: 'story' as const, label: 'Story 9:16' },
            ]).map((f) => (
              <button
                key={f.value}
                onClick={() => setFormat(f.value)}
                className="font-[family-name:var(--font-inter)] text-xs px-4 py-2 rounded-full transition-all"
                style={{
                  background: format === f.value ? 'rgba(79, 195, 247, 0.15)' : 'var(--glass-bg)',
                  border: `1px solid ${format === f.value ? 'rgba(79, 195, 247, 0.3)' : 'var(--glass-border)'}`,
                  color: format === f.value ? '#4fc3f7' : 'var(--text-secondary)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {CARD_CONFIGS.map((config) => (
              <div key={config.id} className="flex flex-col items-center gap-2">
                <span
                  className="font-[family-name:var(--font-inter)] text-xs font-medium mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {config.label}
                </span>
                <PromoCard
                  cardNumber={config.id}
                  totalCards={6}
                  accentColor={config.accent}
                  format={format}
                >
                  <config.Content format={format} />
                </PromoCard>
              </div>
            ))}
          </div>

          {/* Download All */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              className="font-[family-name:var(--font-inter)] text-sm font-medium px-6 py-3 rounded-full transition-all active:scale-[0.97]"
              style={{
                background: 'rgba(79, 195, 247, 0.12)',
                border: '1px solid rgba(79, 195, 247, 0.25)',
                color: '#4fc3f7',
                opacity: downloadingAll ? 0.5 : 1,
              }}
            >
              {downloadingAll ? 'Downloading...' : 'Download All 6 Cards'}
            </button>
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(79,195,247,0.15), transparent)' }} />

        <HooksLibrary />

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(121,134,203,0.15), transparent)' }} />

        <CaptionTemplates />

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,171,64,0.15), transparent)' }} />

        <ContentCalendar />

        <div className="h-12" />
      </main>
    </div>
  );
}
