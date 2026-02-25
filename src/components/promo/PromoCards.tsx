'use client';

import { PRESETS } from '@/lib/presets';
import type { CardFormat } from './PromoCard';

function getDailyIndex(max: number): number {
  const today = new Date();
  const dateHash = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return dateHash % max;
}

const BRAINWAVE_DATA = [
  { name: 'Delta', range: '0.5\u20134 Hz', use: 'Deep Sleep', color: '#1a237e', barWidth: 20 },
  { name: 'Theta', range: '4\u20138 Hz', use: 'Meditation & Dreams', color: '#7986cb', barWidth: 35 },
  { name: 'Alpha', range: '8\u201313 Hz', use: 'Calm Focus & Flow', color: '#4fc3f7', barWidth: 50 },
  { name: 'Beta', range: '13\u201330 Hz', use: 'Active Thinking', color: '#ffab40', barWidth: 75 },
  { name: 'Gamma', range: '30\u201350 Hz', use: 'Peak Performance', color: '#e040fb', barWidth: 100 },
];

// ─── Card 1: Feature Overview ───
export function Card1Content({ format }: { format: CardFormat }) {
  const isStory = format === 'story';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isStory ? 48 : 32 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 32 }}>{'\uD83C\uDFA7'}</span>
          <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.3em', fontWeight: 300 }}>
            BINARA
          </span>
        </div>
        <div style={{ fontSize: isStory ? 50 : 44, fontWeight: 600, color: 'rgba(255,255,255,0.95)', lineHeight: 1.15 }}>
          Binaural Beats
        </div>
        <div style={{ fontSize: isStory ? 50 : 44, fontWeight: 600, color: 'rgba(255,255,255,0.95)', lineHeight: 1.15 }}>
          Engineered for
        </div>
        <div style={{ fontSize: isStory ? 50 : 44, fontWeight: 600, color: '#4fc3f7', lineHeight: 1.15 }}>
          Your Brain
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, #4fc3f740, transparent)', width: '60%' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 20 : 16 }}>
        {[
          '24 Presets',
          '3 Creation Modes',
          'Phone Sensor Control',
          'Export to WAV',
          'Free to Start',
        ].map((feature) => (
          <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 20, color: '#4fc3f7' }}>{'\u2726'}</span>
            <span style={{ fontSize: isStory ? 26 : 24, color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>{feature}</span>
          </div>
        ))}
      </div>

      {isStory && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          {BRAINWAVE_DATA.map((bw) => (
            <div
              key={bw.name}
              style={{
                padding: '8px 18px',
                borderRadius: 20,
                border: `1px solid ${bw.color}40`,
                background: `${bw.color}10`,
                fontSize: 17,
                color: bw.color,
                fontWeight: 400,
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isStory ? 44 : 28 }}>
      <div>
        <div style={{ fontSize: isStory ? 40 : 34, fontWeight: 600, color: 'rgba(255,255,255,0.95)', lineHeight: 1.15 }}>
          YOUR BRAIN ON
        </div>
        <div style={{ fontSize: isStory ? 40 : 34, fontWeight: 600, color: '#4fc3f7', lineHeight: 1.15 }}>
          BINAURAL BEATS
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 28 : 20 }}>
        {BRAINWAVE_DATA.map((bw) => (
          <div key={bw.name}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: bw.color, flexShrink: 0 }} />
                <span style={{ fontSize: isStory ? 24 : 22, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                  {bw.name}
                </span>
              </div>
              <span style={{ fontSize: isStory ? 20 : 18, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                {bw.range}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: `${bw.color}20`, width: '100%' }}>
              <div style={{ height: 6, borderRadius: 3, background: bw.color, width: `${bw.barWidth}%` }} />
            </div>
            <span style={{ fontSize: isStory ? 18 : 17, color: 'rgba(255,255,255,0.5)', marginTop: 4, display: 'block' }}>
              {bw.use}
            </span>
          </div>
        ))}
      </div>

      {isStory && (
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)', textAlign: 'center' as const, marginTop: 10 }}>
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
  const bwState = preset.brainwaveState.charAt(0).toUpperCase() + preset.brainwaveState.slice(1);
  const category = preset.category.charAt(0).toUpperCase() + preset.category.slice(1);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isStory ? 44 : 28 }}>
      <div style={{ fontSize: 22, color: '#ffab40', letterSpacing: '0.25em', fontWeight: 600 }}>
        PRESET OF THE DAY
      </div>

      <div>
        <div style={{ fontSize: isStory ? 48 : 42, fontWeight: 600, color: 'rgba(255,255,255,0.95)', lineHeight: 1.15 }}>
          &ldquo;{preset.name}&rdquo;
        </div>
        <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
          {category}
        </div>
      </div>

      {/* Info grid */}
      <div
        style={{
          borderRadius: 16,
          border: '1px solid rgba(255, 171, 64, 0.2)',
          background: 'rgba(255, 171, 64, 0.04)',
          padding: isStory ? '28px 28px' : '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: isStory ? 18 : 14,
        }}
      >
        {[
          { label: 'Brainwave', value: bwState },
          { label: 'Beat', value: `${preset.beatFreq} Hz` },
          { label: 'Carrier', value: `${preset.carrierFreq} Hz` },
          { label: 'Duration', value: `${preset.defaultDuration} min` },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: isStory ? 22 : 20, color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>{item.label}</span>
            <span style={{ fontSize: isStory ? 22 : 20, color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontFamily: 'monospace' }}>{item.value}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: isStory ? 24 : 22, color: '#ffab40', fontWeight: 500 }}>
        {'\u25B6'} Try it free at binara.app
      </div>

      {/* Mini wave illustration */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width="500" height="50" viewBox="0 0 500 50" style={{ opacity: 0.25, width: '100%' }}>
          <path
            d="M0,25 Q62.5,5 125,25 Q187.5,45 250,25 Q312.5,5 375,25 Q437.5,45 500,25"
            stroke="#ffab40"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isStory ? 40 : 26 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 32, color: '#ffab40' }}>{'\u26A1'}</span>
          <span style={{ fontSize: isStory ? 44 : 38, fontWeight: 700, color: '#ffab40', letterSpacing: '0.08em' }}>
            BINARA PRO
          </span>
        </div>
        <div style={{ fontSize: isStory ? 26 : 24, color: 'rgba(255,255,255,0.5)', marginTop: 10, fontWeight: 300 }}>
          Unlock the full playground
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 20 : 14 }}>
        {features.map((feature) => (
          <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 18, color: '#ffab40' }}>{'\u2726'}</span>
            <span style={{ fontSize: isStory ? 24 : 22, color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>{feature}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 6,
          padding: isStory ? '24px 28px' : '20px 24px',
          borderRadius: 16,
          border: '1px solid rgba(255, 171, 64, 0.25)',
          background: 'rgba(255, 171, 64, 0.06)',
          textAlign: 'center' as const,
        }}
      >
        <div style={{ fontSize: isStory ? 40 : 34, fontWeight: 700, color: '#ffab40' }}>
          $7.99
        </div>
        <div style={{ fontSize: isStory ? 22 : 20, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: 300 }}>
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' as const, gap: isStory ? 48 : 32 }}>
      <div>
        <div style={{ fontSize: isStory ? 54 : 46, fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1.15 }}>
          Stop scrolling.
        </div>
        <div style={{ fontSize: isStory ? 54 : 46, fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1.15 }}>
          Start syncing
        </div>
        <div style={{ fontSize: isStory ? 54 : 46, fontWeight: 700, color: '#4fc3f7', lineHeight: 1.15 }}>
          your brainwaves.
        </div>
      </div>

      {/* Double frequency wave */}
      <svg width="600" height="70" viewBox="0 0 600 70" style={{ opacity: 0.5, width: '100%' }}>
        <path
          d="M0,28 Q75,5 150,28 Q225,51 300,28 Q375,5 450,28 Q525,51 600,28"
          stroke="#4fc3f7"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M0,42 Q75,19 150,42 Q225,65 300,42 Q375,19 450,42 Q525,65 600,42"
          stroke="#7986cb"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 14 : 10 }}>
        <div style={{ fontSize: isStory ? 26 : 24, color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
          24 presets {'\u00B7'} 3 modes
        </div>
        <div style={{ fontSize: isStory ? 26 : 24, color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
          Phone sensor control
        </div>
      </div>

      <div style={{ fontSize: isStory ? 22 : 20, color: 'rgba(255,255,255,0.4)' }}>
        Free to start {'\u00B7'} No account needed
      </div>

      <div
        style={{
          padding: '14px 40px',
          borderRadius: 30,
          border: '1px solid rgba(79, 195, 247, 0.3)',
          background: 'rgba(79, 195, 247, 0.08)',
          fontSize: isStory ? 28 : 26,
          color: '#4fc3f7',
          fontWeight: 500,
          letterSpacing: '0.1em',
        }}
      >
        binara.app
      </div>
    </div>
  );
}

// ─── Card 6: Phone Sensor Feature ───
export function Card6Content({ format }: { format: CardFormat }) {
  const isStory = format === 'story';

  const actions = [
    { action: 'Tilt Forward', result: 'Increase frequency' },
    { action: 'Tilt Back', result: 'Decrease frequency' },
    { action: 'Place Face-Down', result: 'Deep session mode' },
    { action: 'Breathe With Phone', result: 'Sound follows breath' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isStory ? 40 : 24 }}>
      <div>
        <div style={{ fontSize: 28, marginBottom: 12 }}>{'\uD83D\uDCF1'}</div>
        <div style={{ fontSize: isStory ? 40 : 34, fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1.15 }}>
          YOUR PHONE
        </div>
        <div style={{ fontSize: isStory ? 40 : 34, fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1.15 }}>
          BECOMES THE
        </div>
        <div style={{ fontSize: isStory ? 40 : 34, fontWeight: 700, color: '#7986cb', lineHeight: 1.15 }}>
          CONTROLLER
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 16 : 12 }}>
        {actions.map((item) => (
          <div
            key={item.action}
            style={{
              padding: isStory ? '18px 22px' : '14px 20px',
              borderRadius: 14,
              border: '1px solid rgba(121, 134, 203, 0.2)',
              background: 'rgba(121, 134, 203, 0.05)',
            }}
          >
            <div style={{ fontSize: isStory ? 22 : 20, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              {item.action}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: isStory ? 18 : 16, color: '#7986cb' }}>{'\u2192'}</span>
              <span style={{ fontSize: isStory ? 18 : 16, color: '#7986cb', fontWeight: 400 }}>
                {item.result}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: isStory ? 22 : 20, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
        Only in Binara Pro
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
