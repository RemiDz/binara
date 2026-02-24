'use client';

import { useState } from 'react';
import { PRESETS } from '@/lib/presets';
import { ALL_HOOKS } from './HooksLibrary';

function getDailyIndex(max: number): number {
  const today = new Date();
  const dateHash = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return dateHash % max;
}

const CATEGORY_VERBS: Record<string, string> = {
  focus: 'improve my focus',
  sleep: 'sleep better',
  meditation: 'deepen my meditation',
  relaxation: 'wind down',
  energy: 'boost my energy',
  therapy: 'support my practice',
};

const PLATFORMS = ['Instagram', 'TikTok', 'Twitter/X', 'WhatsApp'] as const;

function generateCaption(platform: typeof PLATFORMS[number]): string {
  const preset = PRESETS[getDailyIndex(PRESETS.length)];
  const hook = ALL_HOOKS[getDailyIndex(ALL_HOOKS.length)];
  const state = preset.brainwaveState.charAt(0).toUpperCase() + preset.brainwaveState.slice(1);
  const category = preset.category.charAt(0).toUpperCase() + preset.category.slice(1);
  const categoryVerb = CATEGORY_VERBS[preset.category] ?? 'improve my wellbeing';

  switch (platform) {
    case 'Instagram':
      return `${hook.text}

Today's preset: ${preset.name} (${category})
${state} \u00B7 ${preset.beatFreq} Hz

Binara gives you 24 engineered binaural beats presets \u2014 plus a full synthesis playground to create your own.

\u2726 3 modes: Listen, Mix, Create
\u2726 Phone sensor control (tilt to change frequency)
\u2726 Export sessions to WAV
\u2726 Free to start. Pro unlocks everything for $7.99.

Headphones required.
binara.app

#binauralbeats #brainwaves #binaural #soundhealing #frequencyhealing #meditation #focus #deepwork #thetawaves #alphawaves #deltawaves #braintraining #neuroscience #soundtherapy #wellnesstech #binara`;

    case 'TikTok':
      return `${hook.text}

${preset.name} \u2014 ${preset.beatFreq} Hz ${state} beats

Free at binara.app

#binauralbeats #brainwaves #frequency #soundhealing #meditation #focusmusic #sleepsounds #wellness #fyp`;

    case 'Twitter/X':
      return `${hook.text}

Today: ${preset.name} (${preset.beatFreq} Hz ${state})

24 presets. 3 creation modes. Phone sensors that let you control frequency by tilting.

Free \u2192 binara.app

#binauralbeats #brainwaves`;

    case 'WhatsApp':
      return `Check this out \u2014 I've been using binaural beats to ${categoryVerb}.

Today's session: ${preset.name} (${preset.beatFreq} Hz ${state} waves)

It's free: binara.app`;
  }
}

export default function CaptionTemplates() {
  const [activePlatform, setActivePlatform] = useState<typeof PLATFORMS[number]>('Instagram');
  const [copied, setCopied] = useState(false);

  const caption = generateCaption(activePlatform);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
    }
  };

  return (
    <section>
      <h2
        className="font-[family-name:var(--font-playfair)] text-lg mb-4"
        style={{ color: 'var(--text-primary)' }}
      >
        Caption Templates
      </h2>

      {/* Platform selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {PLATFORMS.map((platform) => (
          <button
            key={platform}
            onClick={() => setActivePlatform(platform)}
            className="font-[family-name:var(--font-inter)] text-xs px-3 py-1.5 rounded-full transition-all"
            style={{
              background: activePlatform === platform ? 'rgba(121, 134, 203, 0.15)' : 'var(--glass-bg)',
              border: `1px solid ${activePlatform === platform ? 'rgba(121, 134, 203, 0.3)' : 'var(--glass-border)'}`,
              color: activePlatform === platform ? '#7986cb' : 'var(--text-secondary)',
            }}
          >
            {platform}
          </button>
        ))}
      </div>

      {/* Caption output */}
      <div
        className="rounded-xl p-5 mb-4"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
        }}
      >
        <pre
          className="font-[family-name:var(--font-inter)] text-sm whitespace-pre-wrap"
          style={{ color: 'var(--text-secondary)' }}
        >
          {caption}
        </pre>
      </div>

      <button
        onClick={handleCopy}
        className="font-[family-name:var(--font-inter)] text-sm font-medium px-5 py-2.5 rounded-full transition-all active:scale-[0.97]"
        style={{
          background: copied ? 'rgba(102, 187, 106, 0.15)' : 'rgba(121, 134, 203, 0.12)',
          border: `1px solid ${copied ? 'rgba(102, 187, 106, 0.3)' : 'rgba(121, 134, 203, 0.25)'}`,
          color: copied ? '#66bb6a' : '#7986cb',
        }}
      >
        {copied ? 'Copied!' : 'Copy Caption'}
      </button>
    </section>
  );
}
