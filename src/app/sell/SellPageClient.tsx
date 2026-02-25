'use client';

import { useState, useCallback, useEffect } from 'react';

// ─── Section IDs & labels ───

const SECTIONS = [
  { id: 'overview', label: 'Overview & USPs' },
  { id: 'audience', label: 'Target Audiences' },
  { id: 'competitors', label: 'Competitor Comparison' },
  { id: 'features', label: 'PRO vs Free' },
  { id: 'scripts', label: 'Sales Scripts' },
  { id: 'faq', label: 'FAQ & Objections' },
  { id: 'pricing', label: 'Pricing & Conversion' },
  { id: 'brand', label: 'Brand Voice' },
] as const;

// ─── Copy button ───

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-[family-name:var(--font-inter)] font-medium transition-all shrink-0"
      style={{
        background: copied ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 255, 255, 0.06)',
        border: `1px solid ${copied ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
        color: copied ? '#66bb6a' : 'rgba(255, 255, 255, 0.5)',
      }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          Copy
        </>
      )}
    </button>
  );
}

// ─── Copyable script block ───

function ScriptBlock({ label, text }: { label: string; text: string }) {
  return (
    <div
      className="rounded-lg p-4 mt-3"
      style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span
          className="font-[family-name:var(--font-inter)] font-medium text-xs"
          style={{ color: 'rgba(255, 171, 64, 0.8)' }}
        >
          {label}
        </span>
        <CopyButton text={text} />
      </div>
      <p
        className="font-[family-name:var(--font-inter)] text-sm leading-relaxed whitespace-pre-line"
        style={{ color: 'rgba(255, 255, 255, 0.75)' }}
      >
        {text}
      </p>
    </div>
  );
}

// ─── One-liner row ───

function OneLiner({ text }: { text: string }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-lg px-4 py-3"
      style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
    >
      <p
        className="font-[family-name:var(--font-inter)] text-sm leading-relaxed"
        style={{ color: 'rgba(255, 255, 255, 0.75)' }}
      >
        {text}
      </p>
      <CopyButton text={text} />
    </div>
  );
}

// ─── Accordion section ───

function AccordionSection({
  id,
  number,
  title,
  defaultOpen,
  children,
}: {
  id: string;
  number: number;
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className="scroll-mt-20">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 py-4 text-left group"
        style={{ borderBottom: open ? 'none' : '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <span
          className="font-[family-name:var(--font-jetbrains)] text-xs w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255, 171, 64, 0.12)', color: '#ffab40' }}
        >
          {number}
        </span>
        <h2
          className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-medium flex-1"
          style={{ color: 'rgba(255, 255, 255, 0.9)' }}
        >
          {title}
        </h2>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div
          className="pb-6"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
        >
          {children}
        </div>
      )}
    </section>
  );
}

// ─── Feature comparison table ───

function FeatureTable() {
  const rows = [
    ['Listen tab — all presets', true, true],
    ['Card preview (15s audition)', true, true],
    ['Ambient layers (10 nature sounds)', true, true],
    ['Synthesised layers (bowls, white/pink/brown)', true, true],
    ['Mix mode — preset states & tones', true, true],
    ['Create mode — basic builder', true, true],
    ['Mix mode — Custom brainwave state', false, true],
    ['Mix mode — Custom carrier tone', false, true],
    ['Phone Motion Sensors', false, true],
    ['Stillness detection + overtone reward', false, true],
    ['Breathing-sync audio modulation', false, true],
  ] as const;

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm" style={{ minWidth: 400 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <th className="text-left py-2 pr-4 font-[family-name:var(--font-inter)] font-medium" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Feature</th>
            <th className="text-center py-2 px-3 font-[family-name:var(--font-inter)] font-medium" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Free</th>
            <th className="text-center py-2 px-3 font-[family-name:var(--font-inter)] font-medium" style={{ color: '#ffab40' }}>PRO</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([feature, free, pro], i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <td className="py-2.5 pr-4 font-[family-name:var(--font-inter)]" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{feature}</td>
              <td className="text-center py-2.5 px-3">{free ? <span style={{ color: '#66bb6a' }}>{'\u2713'}</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>{'\u2014'}</span>}</td>
              <td className="text-center py-2.5 px-3">{pro ? <span style={{ color: '#66bb6a' }}>{'\u2713'}</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>{'\u2014'}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ───

export default function SellPageClient() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      // Update active section based on scroll position
      const sectionEls = SECTIONS.map((s) => ({
        id: s.id,
        el: document.getElementById(s.id),
      }));
      for (let i = sectionEls.length - 1; i >= 0; i--) {
        const el = sectionEls[i].el;
        if (el && el.getBoundingClientRect().top <= 100) {
          setActiveSection(sectionEls[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="min-h-dvh"
      style={{ background: '#080A12', color: 'rgba(255, 255, 255, 0.85)' }}
    >
      {/* ─── Sticky nav (desktop: sidebar, mobile: top bar) ─── */}
      <nav
        className="hidden lg:fixed lg:flex lg:flex-col lg:gap-1 lg:top-24 lg:left-6 lg:w-48 z-40"
      >
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="font-[family-name:var(--font-inter)] text-xs px-3 py-1.5 rounded-md transition-all"
            style={{
              color: activeSection === s.id ? '#ffab40' : 'rgba(255, 255, 255, 0.35)',
              background: activeSection === s.id ? 'rgba(255, 171, 64, 0.08)' : 'transparent',
            }}
          >
            {s.label}
          </a>
        ))}
      </nav>

      {/* Mobile top nav */}
      <div
        className="lg:hidden sticky top-0 z-40 overflow-x-auto flex gap-1 px-4 py-2 no-scrollbar"
        style={{ background: 'rgba(8, 10, 18, 0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="font-[family-name:var(--font-inter)] text-[11px] px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-all"
            style={{
              color: activeSection === s.id ? '#ffab40' : 'rgba(255, 255, 255, 0.4)',
              background: activeSection === s.id ? 'rgba(255, 171, 64, 0.1)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${activeSection === s.id ? 'rgba(255, 171, 64, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
            }}
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* ─── Content ─── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:ml-60 lg:mr-auto py-12 sm:py-16">
        {/* Header */}
        <header className="mb-12">
          <p
            className="font-[family-name:var(--font-jetbrains)] text-[10px] tracking-[0.2em] uppercase mb-4"
            style={{ color: 'rgba(255, 171, 64, 0.6)' }}
          >
            Internal Document
          </p>
          <h1
            className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl md:text-5xl font-medium leading-tight"
            style={{ color: 'rgba(255, 255, 255, 0.95)' }}
          >
            Binara — Sales Playbook
          </h1>
          <p
            className="font-[family-name:var(--font-inter)] text-sm mt-3"
            style={{ color: 'rgba(255, 255, 255, 0.35)' }}
          >
            Not for public distribution. For promoters, affiliates, and collaborators.
          </p>
        </header>

        {/* ─── Section 1: Overview & USPs ─── */}
        <AccordionSection id="overview" number={1} title="App Overview & Unique Selling Points" defaultOpen={true}>
          <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-medium mb-3" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            What Binara Is
          </h3>
          <p className="font-[family-name:var(--font-inter)] text-sm leading-relaxed mb-6" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
            Binara is a browser-based binaural beats and sound therapy app that runs entirely in your phone{"'"}s browser — no download, no account, no setup. Users put on headphones, choose a preset or build their own session, and the app generates real-time audio designed to guide brainwave activity toward specific states: deep focus, sleep, meditation, creativity, or relaxation. It works on any device with a modern browser.
          </p>

          <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-medium mb-4" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            The 5 Core Selling Points
          </h3>
          <div className="space-y-4">
            {[
              {
                title: 'Zero friction, instant access',
                text: 'No app store download. No account creation. No email required. Just visit binara.app on any phone or computer, put on headphones, and press play. This is the lowest-barrier entry point of any binaural beats tool on the market.',
              },
              {
                title: 'Three modes for every level of user',
                text: 'Listen (curated presets for beginners), Mix (choose your brainwave state + carrier tone for intermediate users), Create (full custom builder with effects for advanced users and practitioners). No other free tool offers all three in one place.',
              },
              {
                title: 'Real audio recordings for ambient layers',
                text: 'While competitors use synthesised white noise loops, Binara uses real field recordings: crackling fire, forest birdsong, flowing streams, ocean waves, night crickets, thunderstorms. These are high-quality OGG samples, not generated noise.',
              },
              {
                title: 'Phone Motion Sensors (PRO)',
                text: "Binara is the only binaural beats app that uses your phone's gyroscope and accelerometer to modulate the audio experience. Tilt your phone to shift the spatial balance. Stay perfectly still and the sound rewards you with harmonic overtones. This is genuinely unique — no competitor offers anything like it.",
              },
              {
                title: 'Built by a sound healing practitioner, not a tech company',
                text: "Binara isn't a Silicon Valley product optimised for engagement metrics. It's built by a qualified sound healer who uses these frequencies in real sessions with real people. The preset selections, frequency choices, and session structures come from practitioner experience, not A/B testing.",
              },
            ].map((p, i) => (
              <div key={i} className="flex gap-3">
                <span
                  className="font-[family-name:var(--font-jetbrains)] text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(79, 195, 247, 0.1)', color: '#4fc3f7' }}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-[family-name:var(--font-inter)] font-medium text-sm" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    {p.title}
                  </p>
                  <p className="font-[family-name:var(--font-inter)] text-sm leading-relaxed mt-1" style={{ color: 'rgba(255, 255, 255, 0.55)' }}>
                    {p.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* ─── Section 2: Target Audiences ─── */}
        <AccordionSection id="audience" number={2} title="Target Audience Profiles" defaultOpen={true}>
          <p className="font-[family-name:var(--font-inter)] text-xs mb-5" style={{ color: 'rgba(255, 171, 64, 0.7)' }}>
            Primary audiences (who buys PRO)
          </p>
          <div className="space-y-6">
            {[
              {
                name: 'The Productivity Seeker',
                demo: '25\u201340, tech-savvy',
                uses: 'Binaural beats for focus and deep work',
                current: 'Brain.fm, Endel, or YouTube binaural beats videos',
                pain: 'Subscription fatigue (paying $10\u201315/month for Brain.fm or Endel)',
                trigger: "Discovers Binara's free tier does 80% of what they're paying for elsewhere",
                converts: 'Custom frequencies, motion sensors, advanced Create mode',
                hangout: 'Reddit (r/productivity, r/binaural, r/ADHD), Twitter/X, ProductHunt, Hacker News',
              },
              {
                name: 'The Wellness Explorer',
                demo: '20\u201345, holistic-curious',
                uses: 'Meditation, sound healing, frequency work',
                current: 'Singing bowls, sound baths, or meditation apps like Calm/Headspace',
                pain: 'Wants to explore binaural beats but finds existing tools confusing or too clinical',
                trigger: "Binara's Listen tab presets with clear descriptions make it approachable",
                converts: "Deeper sessions, motion sensors, the \"stillness rewards you\" feature",
                hangout: 'Instagram, TikTok, wellness Facebook groups, yoga studio communities',
              },
              {
                name: 'The Sound Healing Practitioner',
                demo: '30\u201355, professional',
                uses: 'Frequency-based tools in their practice',
                current: 'Various frequency generators and professional tools',
                pain: 'Existing apps are either too basic or too expensive for client recommendations',
                trigger: 'Mix and Create modes give them the precision they need',
                converts: 'Custom carrier frequencies, custom brainwave targets',
                hangout: 'Sound healing training groups, practitioner networks, wellness expos',
              },
              {
                name: 'The Sleep Struggler',
                demo: 'Any age',
                uses: 'Trying to fall asleep or stay asleep',
                current: 'White noise machines, sleep playlists, melatonin',
                pain: 'Nothing works consistently',
                trigger: "Binara's delta-wave sleep presets with ambient layers (rain, night crickets)",
                converts: 'Motion sensor stillness detection, longer sessions',
                hangout: 'Reddit (r/insomnia, r/sleep), sleep-related TikTok, health forums',
              },
            ].map((p, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-[family-name:var(--font-cormorant)] text-base font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    {p.name}
                  </h4>
                  <span className="font-[family-name:var(--font-jetbrains)] text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(79, 195, 247, 0.1)', color: '#4fc3f7' }}>
                    {p.demo}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {[
                    ['Uses', p.uses],
                    ['Currently', p.current],
                    ['Pain point', p.pain],
                    ['Trigger', p.trigger],
                    ['Converts for', p.converts],
                    ['Hangs out', p.hangout],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2 text-sm font-[family-name:var(--font-inter)]">
                      <span className="shrink-0 w-20 text-right" style={{ color: 'rgba(255, 255, 255, 0.35)' }}>{label}</span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* ─── Section 3: Competitor Comparison ─── */}
        <AccordionSection id="competitors" number={3} title="Competitor Comparison" defaultOpen={true}>
          <div className="space-y-6">
            {[
              {
                title: 'Binara vs Brain.fm ($10\u201315/month)',
                points: [
                  'Brain.fm uses AI-generated music with neural entrainment \u2014 polished but expensive',
                  'Binara offers real binaural beats generation (not pre-recorded tracks) for free',
                  'Brain.fm requires subscription for everything \u2014 Binara\u2019s free tier is genuinely usable',
                  'Brain.fm is a native app \u2014 Binara runs in the browser with zero installation',
                  'Brain.fm has no custom frequency builder \u2014 Binara\u2019s Create mode is fully open',
                ],
                angle: 'Why pay $120/year for focus music when Binara does binaural beats for free?',
              },
              {
                title: 'Binara vs Endel ($60\u2013100/year)',
                points: [
                  'Endel adapts to time of day, weather, heart rate \u2014 impressive but requires wearables',
                  "Endel's sounds are AI-generated ambient textures \u2014 not binaural beats",
                  'Binara generates actual binaural beats targeting specific brainwave frequencies',
                  'Endel has no user control over frequencies \u2014 Binara gives full control in Mix and Create',
                  'Endel requires account and app download \u2014 Binara is instant browser access',
                ],
                angle: 'Endel is beautiful background noise. Binara is targeted brainwave training.',
              },
              {
                title: 'Binara vs Free YouTube Binaural Beats',
                points: [
                  'YouTube videos are pre-recorded, fixed frequency, no customisation',
                  'YouTube has ads (unless Premium), interruptions, no looping control',
                  'YouTube drains battery with screen on \u2014 Binara runs with screen locked',
                  'Binara generates frequencies in real-time \u2014 always precise, never compressed audio artefacts',
                  'Binara lets you layer ambient sounds, adjust effects, and build custom sessions',
                ],
                angle: 'YouTube binaural beats are like listening to a photo of music. Binara generates the real thing live.',
              },
              {
                title: 'Binara vs Binaural Beats Factory / other free apps',
                points: [
                  'Most free apps are basic single-frequency generators',
                  'No ambient layers, no mixing, no effects',
                  'No motion sensor integration',
                  "Binara's free tier already exceeds most paid competitors' feature sets",
                ],
                angle: 'The most feature-rich free binaural beats tool available anywhere.',
              },
            ].map((comp, i) => (
              <div key={i}>
                <h4 className="font-[family-name:var(--font-cormorant)] text-base font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  {comp.title}
                </h4>
                <ul className="space-y-1.5 mb-3">
                  {comp.points.map((p, j) => (
                    <li key={j} className="flex gap-2 font-[family-name:var(--font-inter)] text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.25)' }} />
                      {p}
                    </li>
                  ))}
                </ul>
                <div
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{ background: 'rgba(255, 171, 64, 0.06)', border: '1px solid rgba(255, 171, 64, 0.15)' }}
                >
                  <span className="font-[family-name:var(--font-inter)] text-xs font-medium" style={{ color: 'rgba(255, 171, 64, 0.5)' }}>
                    Key angle:
                  </span>
                  <span className="font-[family-name:var(--font-inter)] text-sm font-medium" style={{ color: '#ffab40' }}>
                    {comp.angle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* ─── Section 4: PRO vs Free ─── */}
        <AccordionSection id="features" number={4} title="PRO vs Free Feature Breakdown" defaultOpen={true}>
          <FeatureTable />
          <div className="mt-5 rounded-lg p-4" style={{ background: 'rgba(79, 195, 247, 0.04)', border: '1px solid rgba(79, 195, 247, 0.1)' }}>
            <p className="font-[family-name:var(--font-inter)] text-xs font-medium mb-1" style={{ color: '#4fc3f7' }}>
              How to frame this for sales
            </p>
            <p className="font-[family-name:var(--font-inter)] text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              The free tier is genuinely generous — it{"'"}s not a crippled trial. This matters because users trust the product before being asked to pay. The PRO upgrade is for people who want to go deeper: custom frequencies for practitioners, and motion-reactive audio for a unique physical experience.
            </p>
          </div>
        </AccordionSection>

        {/* ─── Section 5: Sales Scripts ─── */}
        <AccordionSection id="scripts" number={5} title="Ready-to-Use Sales Scripts & Talking Points" defaultOpen={true}>
          <ScriptBlock
            label="Short pitch (10 seconds — for DMs, comments, quick intros)"
            text="Binara is a free binaural beats app that runs in your browser — no download, no account. Just headphones and press play. It's the fastest way to try binaural beats for focus, sleep, or meditation."
          />

          <ScriptBlock
            label="Medium pitch (30 seconds — for social media captions, short videos)"
            text={`Most binaural beats apps charge you $10/month before you hear a single tone. Binara is free, runs in your browser, and generates real binaural beats in real-time — not pre-recorded tracks. Choose from curated presets for focus, sleep, or meditation, or build your own custom session. Layer in real nature sounds like crackling fire or ocean waves. Upgrade to PRO to unlock motion sensors that make the sound respond to your body. Try it now: binara.app`}
          />

          <ScriptBlock
            label="Long pitch (60 seconds — for YouTube descriptions, blog posts, detailed reviews)"
            text={`I've been exploring binaural beats for focus/sleep/meditation and Binara is the first tool that made me stop paying for Brain.fm. It's completely browser-based — you visit binara.app, put on headphones, and you're in a session within seconds. No app to download, no account to create.

What surprised me is how much is free. The Listen tab has presets for every brainwave state — delta for deep sleep, theta for meditation, alpha for relaxation, beta for focus, gamma for peak performance. You can preview any preset before committing. The Mix mode lets you choose your brainwave target and carrier tone separately. Create mode is a full custom builder where you can layer effects and ambient sounds.

Speaking of ambient sounds — these aren't the usual synthesised white noise. Binara uses real field recordings: crackling fire, forest birdsong, flowing streams, thunderstorms. The quality difference is immediately noticeable.

The PRO upgrade unlocks something I haven't seen anywhere else: phone motion sensors. Your phone's gyroscope modulates the audio — tilt to shift the stereo field, stay perfectly still and the sound rewards you with harmonic overtones. It genuinely makes meditation sessions feel different.

Try it free at binara.app — you'll be surprised how much is available without paying a penny.`}
          />

          <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-medium mt-8 mb-3" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            One-liner hooks (for social media)
          </h3>
          <div className="space-y-2">
            <OneLiner text="Stop paying $10/month for binaural beats. binara.app is free." />
            <OneLiner text="Your phone's gyroscope can make binaural beats respond to your body. Only on Binara." />
            <OneLiner text="The binaural beats app that doesn't need downloading. Just headphones." />
            <OneLiner text="Brain.fm costs $120/year. Binara is free and runs in your browser." />
            <OneLiner text="Real crackling fire. Real birdsong. Real ocean waves. Not synthesised. binara.app" />
            <OneLiner text="Build your own binaural beat from scratch. For free. binara.app" />
          </div>
        </AccordionSection>

        {/* ─── Section 6: FAQ / Objections ─── */}
        <AccordionSection id="faq" number={6} title="FAQ / Objection Handling" defaultOpen={true}>
          <div className="space-y-5">
            {[
              {
                q: 'I already use Brain.fm / Endel, why would I switch?',
                a: "You don't have to switch \u2014 try Binara alongside what you use. But consider this: Brain.fm charges $10\u201315/month for AI-generated focus music. Binara generates actual binaural beats for free, with more customisation options. Many people discover they don't need the subscription after trying Binara.",
              },
              {
                q: 'Is it actually free or is it one of those \u201cfree\u201d apps that locks everything?',
                a: "The free tier includes all Listen presets, all ambient layers, Mix mode with preset options, and Create mode. PRO unlocks custom frequencies and motion sensors. The free version is a complete, usable tool \u2014 not a teaser.",
              },
              {
                q: 'Do binaural beats actually work?',
                a: "Research supports that binaural beats can influence brainwave activity, particularly for relaxation and focus. A 2024 meta-analysis confirmed effects on anxiety reduction and attention. Binara doesn't make medical claims \u2014 it's a tool for brainwave entrainment that many users find genuinely helpful for focus, sleep, and meditation.",
              },
              {
                q: "Why browser-based? Isn't a native app better?",
                a: "Browser-based means zero friction \u2014 no storage space, no app store approval delays, no platform restrictions. It works on any phone, tablet, or computer. Updates are instant. And because it uses the Web Audio API, the audio quality is identical to a native app.",
              },
              {
                q: 'I tried binaural beats on YouTube and felt nothing.',
                a: "YouTube binaural beats are pre-recorded, compressed MP3s often uploaded at poor quality. Compression can distort the precise frequency differences that create the binaural effect. Binara generates frequencies in real-time using your device's audio engine \u2014 the signal is mathematically precise, not degraded by compression.",
              },
              {
                q: 'What makes PRO worth it?',
                a: "Two words: motion sensors. No other binaural beats tool uses your phone's gyroscope to create interactive audio. The stillness detection feature \u2014 where the sound becomes richer the more still you are \u2014 transforms meditation practice. Plus custom frequencies for practitioners who need specific Hz values.",
              },
              {
                q: 'Is it safe? Can binaural beats cause harm?',
                a: "Binaural beats are generally considered safe for most people. They're just audio tones at different frequencies in each ear. However, people with epilepsy or seizure disorders should consult a doctor first. Binara includes this guidance in the app.",
              },
            ].map((item, i) => (
              <div key={i}>
                <p className="font-[family-name:var(--font-inter)] font-medium text-sm mb-1.5" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  &ldquo;{item.q}&rdquo;
                </p>
                <p className="font-[family-name:var(--font-inter)] text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.55)' }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* ─── Section 7: Pricing & Conversion ─── */}
        <AccordionSection id="pricing" number={7} title="Pricing Strategy & Conversion Tips" defaultOpen={true}>
          <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-medium mb-3" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            Current pricing
          </h3>
          <div className="space-y-1.5 mb-6 font-[family-name:var(--font-inter)] text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            <p><strong style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Free tier:</strong> Full Listen presets, ambient layers, Mix (preset), Create (basic)</p>
            <p><strong style={{ color: '#ffab40' }}>PRO:</strong> One-time purchase or subscription (adjust based on current pricing)</p>
          </div>

          <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-medium mb-3" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            Conversion psychology that works
          </h3>
          <div className="space-y-3 mb-6">
            {[
              { title: 'Let them use it first', text: 'Never push PRO before someone has experienced the free version. The product sells itself when people hear the quality.' },
              { title: 'Motion sensors are the hook', text: 'The "your phone responds to your body" angle is the most shareable, most curiosity-driving feature. Lead with this in promotional content.' },
              { title: 'Stillness detection is the emotional angle', text: '"The sound rewards your stillness" resonates deeply with meditation practitioners. This is Binara\'s most poetic feature.' },
              { title: 'Price comparison always wins', text: '"Brain.fm: $120/year. Binara PRO: [price]. Binara Free: $0." Let the numbers speak.' },
              { title: 'Target the frustration', text: 'Many people are tired of subscription fatigue for simple audio tools. Position Binara as the escape from monthly charges.' },
            ].map((tip, i) => (
              <div key={i} className="flex gap-3">
                <span
                  className="font-[family-name:var(--font-jetbrains)] text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(255, 171, 64, 0.1)', color: '#ffab40' }}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-[family-name:var(--font-inter)] font-medium text-sm" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{tip.title}</p>
                  <p className="font-[family-name:var(--font-inter)] text-sm leading-relaxed mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{tip.text}</p>
                </div>
              </div>
            ))}
          </div>

          <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-medium mb-3" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            Best conversion moments
          </h3>
          <ul className="space-y-2">
            {[
              'After their first session (they\'re impressed, now show what PRO adds)',
              'When they try Mix mode and hit the locked Custom option (curiosity peaks)',
              'When they see the Phone Sensors toggle greyed out with the description (desire builds over time)',
            ].map((m, i) => (
              <li key={i} className="flex gap-2 font-[family-name:var(--font-inter)] text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full" style={{ background: '#ffab40' }} />
                {m}
              </li>
            ))}
          </ul>
        </AccordionSection>

        {/* ─── Section 8: Brand Voice ─── */}
        <AccordionSection id="brand" number={8} title="Brand Voice Guidelines" defaultOpen={true}>
          <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            Tone
          </h3>
          <p className="font-[family-name:var(--font-inter)] text-sm leading-relaxed mb-6" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Calm, confident, knowledgeable — like a practitioner explaining something to a curious client. Never aggressive, never salesy, never hype-driven.
          </p>

          <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-medium mb-3" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            Language rules
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {[
              ['\u2713', 'brainwave entrainment', '\u2717', 'brain hacking'],
              ['\u2713', 'session', '\u2717', 'track / playlist'],
              ['\u2713', 'practitioner', '\u2717', 'user (for sound healers)'],
              ['\u2713', 'explore / experience', '\u2717', 'consume / use'],
              ['\u2713', 'guided toward focus', '\u2717', 'forced into focus'],
            ].map(([ok, good, no, bad], i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg px-3 py-2 font-[family-name:var(--font-inter)] text-sm"
                style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
              >
                <span style={{ color: '#66bb6a' }}>{ok}</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{good}</span>
                <span className="mx-1" style={{ color: 'rgba(255, 255, 255, 0.15)' }}>/</span>
                <span style={{ color: '#ef5350' }}>{no}</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>{bad}</span>
              </div>
            ))}
          </div>

          <div
            className="rounded-lg p-4 mb-6"
            style={{ background: 'rgba(239, 83, 80, 0.04)', border: '1px solid rgba(239, 83, 80, 0.12)' }}
          >
            <p className="font-[family-name:var(--font-inter)] text-xs font-medium mb-1" style={{ color: '#ef5350' }}>
              Never use
            </p>
            <p className="font-[family-name:var(--font-inter)] text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              &ldquo;hack your brain&rdquo;, &ldquo;supercharge&rdquo;, &ldquo;10x your productivity&rdquo;, &ldquo;life-changing&rdquo;, excessive exclamation marks, ALL CAPS, urgency language (&ldquo;ACT NOW&rdquo;, &ldquo;LIMITED TIME&rdquo;)
            </p>
          </div>

          <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            The Binara personality
          </h3>
          <p className="font-[family-name:var(--font-inter)] text-sm leading-relaxed italic mb-6" style={{ color: 'rgba(255, 255, 255, 0.55)' }}>
            Binara is the quiet expert in the room. It doesn{"'"}t shout, it doesn{"'"}t oversell. It lets the sound do the talking. When someone asks &ldquo;does this work?&rdquo;, Binara says &ldquo;put on headphones and try it — the free version has everything you need to find out.&rdquo;
          </p>

          <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-medium mb-3" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            Visual identity
          </h3>
          <div className="space-y-1.5 font-[family-name:var(--font-inter)] text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            <p>Dark, cosmic, minimal — deep space backgrounds, warm gold accents</p>
            <p>Typography: serif for headings (Cormorant Garamond), clean sans-serif for body (Inter)</p>
            <p>Icons: line art, minimal, no cartoon emojis</p>
            <p>Photography: if used, dark moody environments — candle-lit rooms, night skies, studio headphones</p>
          </div>
          <div
            className="rounded-lg p-3 mt-3"
            style={{ background: 'rgba(239, 83, 80, 0.04)', border: '1px solid rgba(239, 83, 80, 0.12)' }}
          >
            <p className="font-[family-name:var(--font-inter)] text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Never use: stock photos of people smiling at phones, bright gradient backgrounds, neon colours
            </p>
          </div>
        </AccordionSection>

        {/* ─── Footer ─── */}
        <footer className="mt-16 pt-6 text-center" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <p className="font-[family-name:var(--font-inter)] text-xs" style={{ color: 'rgba(255, 255, 255, 0.25)' }}>
            Last updated: February 2026 &middot; Binara by Harmonic Waves
          </p>
        </footer>
      </div>

      {/* ─── Back to top ─── */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-10 h-10 rounded-full flex items-center justify-center z-50 transition-all"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
          }}
          aria-label="Back to top"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      {/* Hide scrollbar on mobile nav */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media print {
          nav, .no-scrollbar, button[aria-label="Back to top"] { display: none !important; }
          div[style*="080A12"] { background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  );
}
