'use client';

import { PRESETS } from '@/lib/presets';
import type { CardFormat } from './PromoCard';

function getDailyIndex(max: number): number {
  const today = new Date();
  const dateHash = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return dateHash % max;
}

const BRAINWAVE_DATA = [
  { name: 'Delta', range: '0.5\u20134 Hz', use: 'Deep Sleep', color: '#1a237e', barWidth: 8 },
  { name: 'Theta', range: '4\u20138 Hz', use: 'Meditation', color: '#7986cb', barWidth: 16 },
  { name: 'Alpha', range: '8\u201313 Hz', use: 'Calm Focus', color: '#4fc3f7', barWidth: 26 },
  { name: 'Beta', range: '13\u201330 Hz', use: 'Active Thinking', color: '#ffab40', barWidth: 56 },
  { name: 'Gamma', range: '30\u201350 Hz', use: 'Peak Performance', color: '#e040fb', barWidth: 100 },
];

// ─── Card 1: Feature Overview ───
export function Card1Content({ format }: { format: CardFormat }) {
  const isStory = format === 'story';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isStory ? 60 : 40 }}>
      <div>
        <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)', marginBottom: 16, letterSpacing: '0.2em' }}>
          BINARA
        </div>
        <div style={{ fontSize: isStory ? 52 : 46, fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.2 }}>
          Binaural Beats
        </div>
        <div style={{ fontSize: isStory ? 52 : 46, fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.2 }}>
          Engineered for Your Brain
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {[
          '24 Presets',
          '3 Creation Modes',
          'Phone Sensor Control',
          'Export to WAV',
          '$7.99 One-Time Pro',
        ].map((feature) => (
          <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 18, color: '#4fc3f7' }}>{'\u2726'}</span>
            <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.7)', fontWeight: 300 }}>{feature}</span>
          </div>
        ))}
      </div>

      {isStory && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          {BRAINWAVE_DATA.map((bw) => (
            <div
              key={bw.name}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: `1px solid ${bw.color}40`,
                background: `${bw.color}10`,
                fontSize: 16,
                color: bw.color,
              }}
            >
              {bw.name} {bw.range}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Card 2: Brainwave Guide ───
export function Card2Content({ format }: { format: CardFormat }) {
  const isStory = format === 'story';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isStory ? 50 : 30 }}>
      <div style={{ fontSize: isStory ? 42 : 36, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>
        YOUR BRAIN ON BINARA
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 32 : 22 }}>
        {BRAINWAVE_DATA.map((bw) => (
          <div key={bw.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: bw.color, flexShrink: 0 }} />
              <span style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
                {bw.name}
              </span>
              <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>
                ({bw.range})
              </span>
            </div>
            <div style={{ marginLeft: 26 }}>
              <div style={{ height: 4, borderRadius: 2, background: `${bw.color}30`, width: '100%', position: 'relative' as const }}>
                <div style={{ height: 4, borderRadius: 2, background: bw.color, width: `${bw.barWidth}%` }} />
              </div>
              <span style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', marginTop: 4, display: 'block' }}>
                {bw.use}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isStory && (
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)', textAlign: 'center' as const, marginTop: 20 }}>
          Which state do you need right now?
        </div>
      )}
    </div>
  );
}

// ─── Card 3: Preset Spotlight ───
export function Card3Content({ format }: { format: CardFormat }) {
  const isStory = format === 'story';
  const preset = PRESETS[getDailyIndex(PRESETS.length)];
  const state = preset.brainwaveState.charAt(0).toUpperCase() + preset.brainwaveState.slice(1);
  const category = preset.category.charAt(0).toUpperCase() + preset.category.slice(1);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isStory ? 50 : 30 }}>
      <div style={{ fontSize: 20, color: '#ffab40', letterSpacing: '0.2em', fontWeight: 500 }}>
        PRESET OF THE DAY
      </div>

      <div>
        <div style={{ fontSize: isStory ? 48 : 42, fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.2 }}>
          &ldquo;{preset.name}&rdquo;
        </div>
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
          {category}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { label: 'Brainwave', value: state },
          { label: 'Beat', value: `${preset.beatFreq} Hz` },
          { label: 'Carrier', value: `${preset.carrierFreq} Hz` },
          { label: 'Duration', value: `${preset.defaultDuration} min` },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.35)', width: 120 }}>{item.label}:</span>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{item.value}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 22, color: '#ffab40', marginTop: 10 }}>
        {'\u25B6'} Try it free
      </div>

      {isStory && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          {/* Mini wave illustration */}
          <svg width="400" height="60" viewBox="0 0 400 60" style={{ opacity: 0.3 }}>
            <path
              d="M0,30 Q50,5 100,30 Q150,55 200,30 Q250,5 300,30 Q350,55 400,30"
              stroke="#ffab40"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Card 4: Pro Features ───
export function Card4Content({ format }: { format: CardFormat }) {
  const isStory = format === 'story';
  const features = [
    'Multi-layer beats (\u00D74)',
    'Stereo field control',
    'LFO modulation',
    'Isochronic tones',
    'Phone sensor control',
    'Timeline editor',
    'Export to WAV',
    'Unlimited saves',
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isStory ? 50 : 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 28, color: '#ffab40' }}>{'\u26A1'}</span>
        <span style={{ fontSize: isStory ? 42 : 36, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>
          BINARA PRO
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 22 : 16 }}>
        {features.map((feature) => (
          <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#ffab40',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.7)', fontWeight: 300 }}>{feature}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: isStory ? 36 : 30, fontWeight: 600, color: '#ffab40' }}>
          $7.99
        </div>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
          One-Time {'\u00B7'} Forever
        </div>
      </div>
    </div>
  );
}

// ─── Card 5: CTA / App Promotion ───
export function Card5Content({ format }: { format: CardFormat }) {
  const isStory = format === 'story';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' as const, gap: isStory ? 60 : 40 }}>
      <div>
        <div style={{ fontSize: isStory ? 56 : 48, fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.2 }}>
          Stop scrolling.
        </div>
        <div style={{ fontSize: isStory ? 56 : 48, fontWeight: 600, color: '#4fc3f7', lineHeight: 1.2 }}>
          Start syncing.
        </div>
      </div>

      {/* Mini frequency wave SVG */}
      <svg width="500" height="60" viewBox="0 0 500 60" style={{ opacity: 0.5 }}>
        <path
          d="M0,30 Q62.5,5 125,30 Q187.5,55 250,30 Q312.5,5 375,30 Q437.5,55 500,30"
          stroke="#4fc3f7"
          strokeWidth="2"
          fill="none"
        />
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)' }}>
          24 presets {'\u00B7'} 3 modes
        </div>
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)' }}>
          Free to start
        </div>
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)' }}>
          No account needed
        </div>
      </div>
    </div>
  );
}

// ─── Card 6: Phone Sensor Feature ───
export function Card6Content({ format }: { format: CardFormat }) {
  const isStory = format === 'story';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isStory ? 50 : 30 }}>
      <div style={{ fontSize: isStory ? 42 : 36, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>
        YOUR PHONE KNOWS
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 36 : 24 }}>
        {[
          { action: 'Tilt', result: 'Frequency', icon: '\u2194' },
          { action: 'Motion', result: 'Breath Sync', icon: '\u223C' },
          { action: 'Face Down', result: 'Deep Mode', icon: '\u2193' },
        ].map((item) => (
          <div key={item.action} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 12,
                background: 'rgba(121, 134, 203, 0.12)',
                border: '1px solid rgba(121, 134, 203, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: '#7986cb',
              }}
            >
              {item.icon}
            </div>
            <div>
              <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                {item.action}
              </span>
              <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.35)', margin: '0 10px' }}>{'\u2192'}</span>
              <span style={{ fontSize: 24, color: '#7986cb', fontWeight: 500 }}>
                {item.result}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: isStory ? 30 : 20 }}>
        <div style={{ fontSize: isStory ? 30 : 26, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
          Your body controls
        </div>
        <div style={{ fontSize: isStory ? 30 : 26, color: '#7986cb', fontWeight: 500, lineHeight: 1.4 }}>
          the sound.
        </div>
      </div>

      <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>
        Only in Binara Pro.
      </div>
    </div>
  );
}

export const CARD_CONFIGS = [
  { id: 1, name: 'feature', label: 'Feature Overview', accent: '#4fc3f7', Content: Card1Content },
  { id: 2, name: 'brainwave', label: 'Brainwave Guide', accent: '#7986cb', Content: Card2Content },
  { id: 3, name: 'preset', label: 'Preset Spotlight', accent: '#ffab40', Content: Card3Content },
  { id: 4, name: 'pro', label: 'Pro Features', accent: '#ffab40', Content: Card4Content },
  { id: 5, name: 'cta', label: 'CTA / Download', accent: '#4fc3f7', Content: Card5Content },
  { id: 6, name: 'sensor', label: 'Sensor Feature', accent: '#7986cb', Content: Card6Content },
] as const;
