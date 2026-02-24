'use client';

import { useState } from 'react';

interface Hook {
  text: string;
  category: string;
}

const ALL_HOOKS: Hook[] = [
  // Focus
  { text: 'Your phone already plays music. But does it tune your brain?', category: 'Focus' },
  { text: 'Alpha waves aren\u2019t just science. They\u2019re your shortcut to flow state.', category: 'Focus' },
  { text: '10 Hz. That\u2019s the frequency between distracted and dialled in.', category: 'Focus' },
  { text: 'Focus isn\u2019t about trying harder. It\u2019s about finding the right frequency.', category: 'Focus' },
  // Sleep
  { text: '2 Hz Delta waves. The sound of dreamless sleep.', category: 'Sleep' },
  { text: 'Can\u2019t sleep? Your brain might be stuck in Beta.', category: 'Sleep' },
  { text: 'The deepest sleep happens below 4 Hz. Here\u2019s how to get there.', category: 'Sleep' },
  { text: 'Put headphones on. Close your eyes. Let Delta take over.', category: 'Sleep' },
  // Meditation
  { text: 'Monks spend decades training their brainwaves. You have Binara.', category: 'Meditation' },
  { text: 'Theta is where meditation gets interesting. 4\u20138 Hz.', category: 'Meditation' },
  { text: 'Your brain already knows how to meditate. It just needs a nudge.', category: 'Meditation' },
  { text: 'Stop trying to clear your mind. Let the frequency do it.', category: 'Meditation' },
  // Relaxation
  { text: 'Alpha waves are your brain\u2019s natural chill mode.', category: 'Relaxation' },
  { text: 'Stressed? There\u2019s a frequency for that. Several, actually.', category: 'Relaxation' },
  { text: 'Your nervous system has a reset button. It\u2019s called 10 Hz.', category: 'Relaxation' },
  // Energy
  { text: 'Beta waves: your brain\u2019s built-in espresso.', category: 'Energy' },
  { text: 'Need energy without caffeine? Try 20 Hz.', category: 'Energy' },
  { text: 'High Beta. High performance. No crash.', category: 'Energy' },
  // Therapy
  { text: 'Sound therapists have used binaural beats for decades. Now it\u2019s in your pocket.', category: 'Therapy' },
  { text: 'Binaural beats aren\u2019t new age. They\u2019re neuroscience.', category: 'Therapy' },
];

const CATEGORIES = ['All', 'Focus', 'Sleep', 'Meditation', 'Relaxation', 'Energy', 'Therapy'];

export default function HooksLibrary() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const filtered = activeCategory === 'All'
    ? ALL_HOOKS
    : ALL_HOOKS.filter((h) => h.category === activeCategory);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
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
        Hooks Library
      </h2>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="font-[family-name:var(--font-inter)] text-xs px-3 py-1.5 rounded-full transition-all"
            style={{
              background: activeCategory === cat ? 'rgba(79, 195, 247, 0.15)' : 'var(--glass-bg)',
              border: `1px solid ${activeCategory === cat ? 'rgba(79, 195, 247, 0.3)' : 'var(--glass-border)'}`,
              color: activeCategory === cat ? '#4fc3f7' : 'var(--text-secondary)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Hooks list */}
      <div className="space-y-2">
        {filtered.map((hook, i) => (
          <div
            key={hook.text}
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <p
              className="font-[family-name:var(--font-inter)] text-sm flex-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              &ldquo;{hook.text}&rdquo;
            </p>
            <button
              onClick={() => handleCopy(hook.text, i)}
              className="shrink-0 text-xs font-[family-name:var(--font-jetbrains)] px-2.5 py-1 rounded-md transition-all"
              style={{
                background: copiedIndex === i ? 'rgba(102, 187, 106, 0.15)' : 'rgba(79, 195, 247, 0.08)',
                color: copiedIndex === i ? '#66bb6a' : '#4fc3f7',
              }}
            >
              {copiedIndex === i ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export { ALL_HOOKS };
