# Binara — Phase 5: Polish & Launch

## Overview

This is the final phase before Binara goes live. It covers five areas: a hidden promo content studio for social media, a settings page, Plausible analytics, PWA polish, and SEO. After this phase, Binara is ready to ship.

**Prerequisites:** Phases 1–4 must be complete and building cleanly. `TESTING_MODE = true` (Pro unlocked).

---

## 1. Promo Content Studio (`/promo`)

A hidden page at `binara.app/promo` — your personal social media content factory. Not linked anywhere in the app UI. Same proven pattern as Earth Pulse (`shumann.app/promo`) and Tide Resonance (`tidara.app/promo`).

### 1.1 Route Setup

### File: `src/app/promo/page.tsx`

- Client component (`'use client'`)
- Not listed in navigation, sitemap, or robots.txt
- Uses the app's existing dark theme and design tokens
- Optimised for desktop (this is a creator tool used on your laptop)
- Responsive but desktop-first

### 1.2 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  BINARA · CONTENT STUDIO                              [← Back] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ── Quick Stats Bar ──                                          │
│  Presets: 24 | Modes: 3 | Beat Range: 0.5–50 Hz |              │
│  Brainwave States: Delta · Theta · Alpha · Beta · Gamma        │
│                                                                 │
│  ════════════════════════════════════════════════════════════    │
│                                                                 │
│  ── Shareable Cards ──                                          │
│                                                                 │
│  Format: [Post 1:1] [Story 9:16] [TikTok 9:16]                │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Card 1   │ │ Card 2   │ │ Card 3   │ │ Card 4   │          │
│  │ Feature  │ │ Brainwave│ │ Preset   │ │ Pro      │          │
│  │ Overview │ │ Guide    │ │ Spotlight│ │ Features │          │
│  │          │ │          │ │          │ │          │          │
│  │ [⬇ Save] │ │ [⬇ Save] │ │ [⬇ Save] │ │ [⬇ Save] │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  ┌──────────┐ ┌──────────┐                                     │
│  │ Card 5   │ │ Card 6   │                                     │
│  │ CTA /    │ │ Sensor   │                                     │
│  │ Download │ │ Feature  │                                     │
│  │          │ │          │                                     │
│  │ [⬇ Save] │ │ [⬇ Save] │                                     │
│  └──────────┘ └──────────┘                                     │
│                                                                 │
│  [⬇ Download All 6 Cards]                                      │
│                                                                 │
│  ════════════════════════════════════════════════════════════    │
│                                                                 │
│  ── Hooks Library ──                                            │
│                                                                 │
│  Category: [All] [Focus] [Sleep] [Meditation] [Relaxation]     │
│            [Energy] [Therapy]                                   │
│                                                                 │
│  "Your phone already plays music. But does it..."    [📋 Copy] │
│  "Stop scrolling. Start syncing your brainwaves."    [📋 Copy] │
│  "Delta. Theta. Alpha. Beta. Gamma. Which..."        [📋 Copy] │
│  ... (20 hooks total)                                           │
│                                                                 │
│  ════════════════════════════════════════════════════════════    │
│                                                                 │
│  ── Caption Templates ──                                        │
│                                                                 │
│  Platform: [Instagram] [TikTok] [Twitter/X] [WhatsApp]         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Generated caption text with {dynamic} variables...     │    │
│  │  ...                                                    │    │
│  │  #binauralbeats #brainwaves #binaural #soundhealing     │    │
│  └─────────────────────────────────────────────────────────┘    │
│  [📋 Copy Caption]                                              │
│                                                                 │
│  ════════════════════════════════════════════════════════════    │
│                                                                 │
│  ── Content Calendar Hints ──                                   │
│                                                                 │
│  💡 Best times to post:                                        │
│  Instagram: 9-11am, 7-9pm | TikTok: 7-9am, 12-3pm, 7-11pm   │
│                                                                 │
│  📅 Content ideas for this week:                               │
│  - "Monday Focus: Use Alpha waves to start your week right"    │
│  - "Midweek Reset: Theta meditation to recharge"               │
│  - "Friday Wind-Down: Delta session for deep rest"             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Shareable Cards (6 cards)

All cards rendered with `html2canvas-pro` for pixel-perfect capture. All styling must be **inline styles** (html2canvas requirement — Tailwind classes won't capture correctly).

**Card Shell (shared structure):**
- Background: deep ocean gradient (#050810 → #0a1628) with subtle star field (40–60 small dots)
- Accent stripe at top (2px, colour varies by card)
- Radial glow effect (card-specific accent colour at 5% opacity)
- Card number: "1/6", "2/6" etc. in bottom-right
- Footer: gradient divider, "binara.app" branding, today's date, page dots

**Dimensions:**
- Post (1:1): 1080 × 1080px
- Story (9:16): 1080 × 1920px
- TikTok (9:16): 1080 × 1920px (same dimensions, different content emphasis)

**Card 1 — Feature Overview:**
```
┌────────────────────────────┐
│  🎧 BINARA                 │
│                            │
│  Binaural Beats            │
│  Engineered for Your Brain │
│                            │
│  ✦ 24 Presets              │
│  ✦ 3 Creation Modes       │
│  ✦ Phone Sensor Control    │
│  ✦ Export to WAV           │
│  ✦ $7.99 One-Time Pro      │
│                            │
│  binara.app                │
└────────────────────────────┘
```
- Accent: cyan (#4fc3f7)
- Story mode adds: brainwave state icons (Delta through Gamma with Hz ranges)

**Card 2 — Brainwave Guide:**
```
┌────────────────────────────┐
│  YOUR BRAIN ON BINARA      │
│                            │
│  ●───── Delta (0.5–4 Hz)  │
│         Deep Sleep         │
│  ●───── Theta (4–8 Hz)    │
│         Meditation         │
│  ●───── Alpha (8–13 Hz)   │
│         Calm Focus         │
│  ●───── Beta (13–30 Hz)   │
│         Active Thinking    │
│  ●───── Gamma (30–50 Hz)  │
│         Peak Performance   │
│                            │
│  binara.app                │
└────────────────────────────┘
```
- Accent: violet (#7986cb)
- Each state gets a coloured dot and horizontal bar showing its Hz range
- Story mode adds: "Which state do you need right now?" CTA

**Card 3 — Preset Spotlight:**
```
┌────────────────────────────┐
│  PRESET OF THE DAY         │
│                            │
│  "{Preset Name}"           │
│  {Category}                │
│                            │
│  Brainwave: {State}        │
│  Beat: {X} Hz              │
│  Carrier: {Y} Hz           │
│  Duration: {Z} min         │
│                            │
│  ▶ Try it free             │
│  binara.app                │
└────────────────────────────┘
```
- Accent: amber (#ffab40)
- **Dynamic:** Uses today's date to pseudo-randomly select a preset from the 24 available (date hash → preset index). This means different content each day.
- Story mode adds: visual frequency wave illustration

**Card 4 — Pro Features:**
```
┌────────────────────────────┐
│  ⚡ BINARA PRO             │
│                            │
│  Multi-layer beats (×4)   │
│  Stereo field control      │
│  LFO modulation            │
│  Isochronic tones          │
│  Phone sensor control      │
│  Timeline editor           │
│  Export to WAV              │
│  Unlimited saves           │
│                            │
│  $7.99 · One-Time · Forever│
│  binara.app                │
└────────────────────────────┘
```
- Accent: amber (#ffab40)
- Emphasise "One-Time" and "Forever" — no subscription

**Card 5 — CTA / App Promotion:**
```
┌────────────────────────────┐
│                            │
│  Stop scrolling.           │
│  Start syncing.            │
│                            │
│  ～～～～～～～～～～       │  ← Mini frequency wave SVG
│                            │
│  24 presets · 3 modes      │
│  Free to start             │
│  No account needed         │
│                            │
│  binara.app                │
└────────────────────────────┘
```
- Accent: cyan (#4fc3f7)
- Clean, minimal, punchy — designed as a standalone ad

**Card 6 — Phone Sensor Feature:**
```
┌────────────────────────────┐
│  📱 YOUR PHONE KNOWS       │
│                            │
│  Tilt → Frequency          │
│  Motion → Breath Sync      │
│  Face Down → Deep Mode     │
│                            │
│  Your body controls        │
│  the sound.                │
│                            │
│  Only in Binara Pro.       │
│  binara.app                │
└────────────────────────────┘
```
- Accent: violet (#7986cb)
- This is the most shareable card — the phone sensor angle is unique

### 1.4 Card Rendering

Use `html2canvas-pro` (not `html2canvas` — the pro version handles modern CSS better):

```bash
npm install html2canvas-pro
```

```typescript
import html2canvas from 'html2canvas-pro';

async function captureCard(element: HTMLElement, width: number, height: number): Promise<Blob> {
  const canvas = await html2canvas(element, {
    width,
    height,
    scale: 2,  // 2x for crisp output
    backgroundColor: '#050810',
    useCORS: true,
    logging: false,
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
  });
}
```

**Download function:**

```typescript
function downloadImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

**Download All:** Capture all 6 cards sequentially with a small delay between each (100ms) to avoid memory spikes. Name them `binara-card-1-feature.png`, `binara-card-2-brainwave.png`, etc.

### 1.5 Hooks Library (20 hooks)

Organised by category. Each hook is a short, punchy social media opening line.

**Focus (4 hooks):**
1. "Your phone already plays music. But does it tune your brain?"
2. "Alpha waves aren't just science. They're your shortcut to flow state."
3. "10 Hz. That's the frequency between distracted and dialled in."
4. "Focus isn't about trying harder. It's about finding the right frequency."

**Sleep (4 hooks):**
1. "2 Hz Delta waves. The sound of dreamless sleep."
2. "Can't sleep? Your brain might be stuck in Beta."
3. "The deepest sleep happens below 4 Hz. Here's how to get there."
4. "Put headphones on. Close your eyes. Let Delta take over."

**Meditation (4 hooks):**
1. "Monks spend decades training their brainwaves. You have Binara."
2. "Theta is where meditation gets interesting. 4–8 Hz."
3. "Your brain already knows how to meditate. It just needs a nudge."
4. "Stop trying to clear your mind. Let the frequency do it."

**Relaxation (3 hooks):**
1. "Alpha waves are your brain's natural chill mode."
2. "Stressed? There's a frequency for that. Several, actually."
3. "Your nervous system has a reset button. It's called 10 Hz."

**Energy (3 hooks):**
1. "Beta waves: your brain's built-in espresso."
2. "Need energy without caffeine? Try 20 Hz."
3. "High Beta. High performance. No crash."

**Therapy (2 hooks):**
1. "Sound therapists have used binaural beats for decades. Now it's in your pocket."
2. "Binaural beats aren't new age. They're neuroscience."

Each hook has a [📋 Copy] button that copies to clipboard with visual feedback (brief "Copied!" state).

### 1.6 Caption Templates

4 platform-specific templates with dynamic variables:

**Variables available:**
- `{preset}` — today's spotlight preset name
- `{category}` — preset category
- `{state}` — brainwave state
- `{freq}` — beat frequency
- `{date}` — today's formatted date
- `{day}` — day of week

**Instagram:**
```
{hook}

Today's preset: {preset} ({category})
🧠 {state} · {freq} Hz

Binara gives you 24 engineered binaural beats presets — plus a full synthesis playground to create your own.

✦ 3 modes: Listen, Mix, Create
✦ Phone sensor control (tilt to change frequency)
✦ Export sessions to WAV
✦ Free to start. Pro unlocks everything for $7.99.

🎧 Headphones required.
👉 binara.app

#binauralbeats #brainwaves #binaural #soundhealing #frequencyhealing #meditation #focus #deepwork #thetawaves #alphawaves #deltawaves #braintraining #neuroscience #soundtherapy #wellnesstech #binara
```

**TikTok:**
```
{hook}

{preset} — {freq} Hz {state} beats 🧠

Free at binara.app 🎧

#binauralbeats #brainwaves #frequency #soundhealing #meditation #focusmusic #sleepsounds #wellness #fyp
```

**Twitter/X:**
```
{hook}

Today: {preset} ({freq} Hz {state})

24 presets. 3 creation modes. Phone sensors that let you control frequency by tilting.

Free → binara.app

#binauralbeats #brainwaves
```

**WhatsApp:**
```
🎧 Check this out — I've been using binaural beats to {category_verb}.

Today's session: {preset} ({freq} Hz {state} waves)

It's free: binara.app
```

Where `{category_verb}` maps: Focus → "improve my focus", Sleep → "sleep better", Meditation → "deepen my meditation", Relaxation → "wind down", Energy → "boost my energy", Therapy → "support my practice".

Each template has a [📋 Copy Caption] button.

### 1.7 Daily Uniqueness

The preset spotlight and hook selection should vary daily:

```typescript
function getDailyIndex(max: number): number {
  const today = new Date();
  const dateHash = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return dateHash % max;
}

// Usage:
const spotlightPreset = ALL_PRESETS[getDailyIndex(ALL_PRESETS.length)];
const todayHook = ALL_HOOKS[getDailyIndex(ALL_HOOKS.length)];
```

### 1.8 Content Calendar Hints

Static section at the bottom:

```
💡 Best times to post:
   Instagram: 9–11am, 7–9pm (your timezone)
   TikTok: 7–9am, 12–3pm, 7–11pm
   Twitter/X: 8–10am, 12–1pm

📅 Weekly content rhythm:
   Monday    → Focus preset + "start your week" angle
   Tuesday   → Brainwave education (Card 2)
   Wednesday → Midweek meditation reset
   Thursday  → Pro feature highlight (Card 4 or 6)
   Friday    → Relaxation / wind-down preset
   Saturday  → Therapy / practitioner angle
   Sunday    → Sleep preset + "recharge" angle
```

---

## 2. Settings Page

### File: `src/components/Settings.tsx`

A bottom sheet (matching the existing app's glassmorphism style) accessible from the gear icon in the header.

### 2.1 Settings Layout

```
┌──────────────────────────────────┐
│  Settings                   [×]  │
├──────────────────────────────────┤
│                                  │
│  ── Audio ──                     │
│                                  │
│  Default volume:  ────●── 60%    │
│  Completion chime: [On]          │
│  Headphone reminder: [On]        │
│                                  │
│  ── Display ──                   │
│                                  │
│  Reduced motion: [Off]           │  ← Respects prefers-reduced-motion
│  Background particles: [On]      │
│                                  │
│  ── Data ──                      │
│                                  │
│  Saved sessions: 5               │
│  [Clear All Saved Sessions]      │  ← Confirmation dialog first
│  [Reset Onboarding]              │  ← Show onboarding again
│                                  │
│  ── Pro ──                       │
│                                  │
│  Status: Active (PRO)            │  ← or "Free" with Upgrade button
│  Licence key: ●●●●●●●●XXXX      │  ← Masked, last 4 visible
│  [Deactivate Pro]                │  ← Confirmation first
│  [Manage Licence]                │  ← Opens LemonSqueezy customer portal
│                                  │
│  ── About ──                     │
│                                  │
│  Binara v1.0                     │
│  Part of the Harmonic Waves      │
│  ecosystem                       │
│                                  │
│  Crafted by Remigijus            │
│  Dzingelevičius · 2026           │
│                                  │
│  [harmonicwaves.app →]           │
│                                  │
└──────────────────────────────────┘
```

### 2.2 Settings State

```typescript
interface AppSettings {
  defaultVolume: number;          // 0–100, default 60
  completionChime: boolean;       // default true
  headphoneReminder: boolean;     // default true
  reducedMotion: boolean;         // default: match system pref
  backgroundParticles: boolean;   // default true
}
```

Persist to localStorage under `binara_settings`. Load on app init and apply immediately.

### 2.3 Reduced Motion

When enabled (or when system `prefers-reduced-motion: reduce` is active):
- Disable background particle animations
- Disable beat visualiser canvas animation (show static rings instead)
- Disable Framer Motion spring animations (use instant transitions)
- Disable all `requestAnimationFrame` loops

```typescript
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Also check app settings override
  const settings = useSettings();
  return reduced || settings.reducedMotion;
}
```

### 2.4 Integration

- Gear icon in the Header opens Settings as a bottom sheet (AnimatePresence slide-up)
- Settings is available from all three modes
- Changes apply immediately (no "Save" button needed)

---

## 3. Plausible Analytics

### 3.1 Script Setup

Add Plausible's lightweight script to the app. You'll need to:
1. Create a site at https://plausible.io for `binara.app`
2. Get the script tag

### File: `src/app/layout.tsx`

Add to `<head>`:

```tsx
<Script
  defer
  data-domain="binara.app"
  src="https://plausible.io/js/script.js"
  strategy="afterInteractive"
/>
```

### 3.2 Custom Events

Track meaningful user actions, not just page views. Use Plausible's custom events:

```typescript
// Utility function
function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  if (typeof window !== 'undefined' && (window as any).plausible) {
    (window as any).plausible(name, { props });
  }
}
```

**Events to track:**

| Event | When | Props |
|-------|------|-------|
| `Session Start` | User taps Play on any mode | `mode: 'easy' \| 'mix' \| 'advanced'` |
| `Session Complete` | Session timer reaches end | `mode, duration, preset?` |
| `Session Abandon` | User stops before completion | `mode, elapsed, total` |
| `Mode Switch` | User switches between Listen/Mix/Create | `from, to` |
| `Preset Play` | User plays an Easy mode preset | `preset, category` |
| `Mix Save` | User saves a Mix session | `ambient_count, duration` |
| `Advanced Save` | User saves an Advanced session | `layer_count` |
| `Export Start` | User initiates WAV export | `mode, duration` |
| `Export Complete` | Export finishes and downloads | `mode, duration, file_size_mb` |
| `Share` | User taps Share button | `mode` |
| `Pro Upgrade Click` | User taps Upgrade button | `source: 'header' \| 'progate' \| 'settings'` |
| `Pro Activated` | Licence key successfully activated | `source: 'url' \| 'manual'` |
| `Sensor Enabled` | User enables phone sensors | — |
| `Onboarding Complete` | User finishes onboarding flow | — |
| `Ambient Select` | User picks an ambient sound | `sound` |

### 3.3 Placement

Add `trackEvent()` calls at the appropriate points in existing components:

- `App.tsx` / player components: session lifecycle events
- `PresetCard.tsx`: preset play
- `ModeSwitcher.tsx`: mode switch
- `ProUpgrade.tsx`: upgrade clicks
- `ExportModal.tsx`: export events
- `ShareButton.tsx`: share events
- `SensorControl.tsx`: sensor enable
- `Onboarding.tsx`: onboarding complete

Don't over-track. These events give you the core funnel: Visit → Mode → Session Start → Session Complete → Pro Conversion.

---

## 4. PWA Polish

### 4.1 Manifest

Update `src/app/manifest.ts` (should already exist from Phase 1):

```typescript
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Binara — Binaural Beats',
    short_name: 'Binara',
    description: 'Binaural beats engineered for your brain. 24 presets, 3 creation modes, phone sensor control.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050810',
    theme_color: '#050810',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    categories: ['health', 'music', 'lifestyle'],
  };
}
```

### 4.2 App Icons

Create the following icons in `public/`:
- `icon-192.png` — 192×192, app icon on transparent background
- `icon-512.png` — 512×512, same
- `icon-192-maskable.png` — 192×192, icon with safe zone padding (centred in inner 80%)
- `icon-512-maskable.png` — 512×512, same
- `favicon.ico` — 32×32
- `apple-touch-icon.png` — 180×180

**Icon design:** The "B" from BINARA in Playfair Display, white on the app's deep ocean background (#050810), with a subtle cyan glow ring.

For Phase 5, use a simple placeholder icon generated with canvas or an SVG. The final polished icon can be designed later.

### 4.3 Apple-Specific Meta Tags

In `layout.tsx` `<head>`:

```tsx
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Binara" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

### 4.4 Service Worker

The service worker from Phase 1 should already handle:
- Cache-first for static assets (JS, CSS, fonts, images)
- Network-first for navigation (HTML pages)
- Offline fallback page

**Verify and enhance if needed:**
- Pre-cache the 8 ambient sound generators (they're computed, not loaded — should work offline)
- Cache the app shell (index page + all JS bundles)
- Show a subtle offline indicator in the header when `navigator.onLine === false`

### 4.5 Install Prompt

Add a subtle "Add to Home Screen" prompt for mobile users who visit more than once:

```typescript
// Track install prompt event
let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show install banner after user's second session
  const sessionCount = parseInt(localStorage.getItem('binara_sessions') || '0');
  if (sessionCount >= 2) {
    showInstallBanner();
  }
});
```

**Install banner:** A dismissable bottom bar:
```
┌──────────────────────────────────────────────────┐
│  📱 Add Binara to your home screen  [Install] [×]│
└──────────────────────────────────────────────────┘
```

Shown once. Dismissed permanently if user taps [×]. Hidden if app is already installed (display-mode: standalone).

---

## 5. SEO & Open Graph

### 5.1 Meta Tags

In `src/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: 'Binara — Binaural Beats Engineered for Your Brain',
  description: 'Create and listen to binaural beats with 24 presets, a modular mixer, and a full synthesis playground. Phone sensor control, WAV export, and more. Free to start.',
  keywords: 'binaural beats, brainwave entrainment, focus, sleep, meditation, theta waves, alpha waves, delta waves, sound therapy, frequency healing',
  authors: [{ name: 'Remigijus Dzingelevičius' }],
  creator: 'Remigijus Dzingelevičius',
  metadataBase: new URL('https://binara.app'),
  openGraph: {
    title: 'Binara — Binaural Beats Engineered for Your Brain',
    description: 'Create and listen to binaural beats with 24 presets, a modular mixer, and a full synthesis playground.',
    url: 'https://binara.app',
    siteName: 'Binara',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Binara — Binaural Beats',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Binara — Binaural Beats Engineered for Your Brain',
    description: 'Create and listen to binaural beats with 24 presets, a modular mixer, and a full synthesis playground.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### 5.2 Open Graph Image

Create `public/og-image.png` (1200 × 630):

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│         B I N A R A                                        │
│                                                            │
│         Binaural Beats Engineered                         │
│         for Your Brain                                    │
│                                                            │
│         ～～～～～～～～～～～～～                          │  ← Frequency wave
│                                                            │
│         24 Presets · 3 Modes · Free                        │
│                                                            │
│         binara.app                                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

Deep ocean background, Playfair Display heading, cyan accent. Generate this programmatically with canvas at build time, or create it as a static PNG.

### 5.3 Structured Data

Add JSON-LD in `layout.tsx`:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Binara',
      description: 'Binaural beats engineered for your brain. 24 presets, 3 creation modes, phone sensor control.',
      url: 'https://binara.app',
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free to use with optional Pro upgrade',
      },
      author: {
        '@type': 'Person',
        name: 'Remigijus Dzingelevičius',
      },
    }),
  }}
/>
```

### 5.4 Sitemap

### File: `src/app/sitemap.ts`

```typescript
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://binara.app',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
```

Note: `/promo` is intentionally excluded.

### 5.5 Robots

### File: `src/app/robots.ts`

```typescript
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/promo',
    },
    sitemap: 'https://binara.app/sitemap.xml',
  };
}
```

---

## 6. Minor Polish Items

### 6.1 Loading State

When the app first loads, show a brief splash:

```
┌──────────────────────────────────┐
│                                  │
│                                  │
│         B I N A R A              │
│                                  │
│         ·  ·  ·                  │  ← 3 pulsing dots
│                                  │
│                                  │
└──────────────────────────────────┘
```

Show for 500ms minimum (avoids flash), hide when main components mount. Use the same deep ocean background.

### 6.2 Error Boundary

Wrap the app in a React error boundary that catches rendering crashes and shows:

```
┌──────────────────────────────────┐
│                                  │
│  Something went wrong            │
│                                  │
│  The audio engine encountered    │
│  an issue. This sometimes        │
│  happens with browser audio      │
│  permissions.                    │
│                                  │
│  [Reload App]                    │
│                                  │
└──────────────────────────────────┘
```

### 6.3 Viewport Fix

Ensure the app respects safe areas on notched devices:

```css
body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
           env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

And in `layout.tsx`:
```tsx
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

### 6.4 Favicon Generation

Generate a simple placeholder favicon programmatically:

```typescript
// In a build script or as a static SVG:
// Deep blue circle with "B" in Playfair Display, subtle cyan glow
```

Or create a minimal SVG favicon:

```xml
<!-- public/favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#050810"/>
  <text x="16" y="23" font-family="serif" font-size="20" font-weight="500" fill="#4fc3f7" text-anchor="middle">B</text>
</svg>
```

---

## 7. File Structure (new files)

```
src/
├── app/
│   ├── promo/
│   │   └── page.tsx                # Hidden promo content studio
│   ├── sitemap.ts                  # SEO sitemap
│   └── robots.ts                   # SEO robots
├── components/
│   ├── Settings.tsx                # Settings bottom sheet
│   ├── InstallBanner.tsx           # PWA install prompt
│   ├── LoadingSplash.tsx           # App loading state
│   ├── ErrorBoundary.tsx           # Crash recovery
│   └── promo/
│       ├── PromoPage.tsx           # Main promo page layout
│       ├── PromoCard.tsx           # Card shell + rendering
│       ├── PromoCards.tsx          # 6 card definitions
│       ├── HooksLibrary.tsx        # 20 social hooks
│       ├── CaptionTemplates.tsx    # 4 platform templates
│       └── ContentCalendar.tsx     # Posting tips
├── lib/
│   ├── analytics.ts               # Plausible trackEvent utility
│   └── settings.ts                # Settings state management
└── hooks/
    ├── useSettings.ts             # Settings hook
    └── useReducedMotion.ts        # Accessibility hook
public/
├── icon-192.png
├── icon-512.png
├── icon-192-maskable.png
├── icon-512-maskable.png
├── apple-touch-icon.png
├── favicon.svg
├── favicon.ico
└── og-image.png
```

---

## 8. Testing Checklist

### Promo Page
- [ ] `/promo` loads without errors
- [ ] Not linked from main app navigation
- [ ] All 6 cards render correctly in Post format
- [ ] All 6 cards render correctly in Story format
- [ ] Individual card download produces clean PNG
- [ ] "Download All" downloads all 6 cards sequentially
- [ ] Downloaded images are crisp (1080px at 2x scale)
- [ ] No html2canvas rendering artefacts (text clipping, missing gradients)
- [ ] Preset Spotlight changes daily (different preset each day)
- [ ] All 20 hooks display with Copy buttons
- [ ] Copy buttons work and show feedback
- [ ] All 4 caption templates generate with correct dynamic data
- [ ] Caption Copy buttons work
- [ ] Content calendar section displays

### Settings
- [ ] Gear icon opens settings bottom sheet
- [ ] Volume slider changes default volume
- [ ] Completion chime toggle works
- [ ] Headphone reminder toggle works
- [ ] Reduced motion toggle disables all animations
- [ ] Background particles toggle works
- [ ] Clear All Saved Sessions shows confirmation, then clears
- [ ] Reset Onboarding brings back onboarding on next visit
- [ ] Pro section shows correct status
- [ ] Deactivate Pro shows confirmation, then clears licence
- [ ] Settings persist after page reload
- [ ] All changes apply immediately (no save button)

### Plausible
- [ ] Plausible script loads on production build
- [ ] Page views tracked
- [ ] Session Start event fires with correct mode
- [ ] Session Complete event fires
- [ ] Mode Switch event fires
- [ ] Pro Upgrade Click event fires
- [ ] Events don't fire in development (only on binara.app domain)

### PWA
- [ ] Manifest loads correctly (check DevTools → Application)
- [ ] Icons display at all sizes
- [ ] App is installable on Chrome Android
- [ ] App is installable on Safari iOS (Add to Home Screen)
- [ ] Installed app opens in standalone mode (no browser chrome)
- [ ] App works offline (cached shell loads, audio plays)
- [ ] Install banner appears after 2+ sessions
- [ ] Install banner dismisses permanently

### SEO
- [ ] OG image renders on social media preview tools (opengraph.xyz)
- [ ] Twitter card preview looks correct
- [ ] Structured data validates (schema.org validator)
- [ ] Sitemap accessible at /sitemap.xml
- [ ] Robots.txt blocks /promo
- [ ] Page title and description correct

### Polish
- [ ] Loading splash shows briefly on first load
- [ ] Error boundary catches and displays errors gracefully
- [ ] Safe area insets work on notched devices (iPhone)
- [ ] No layout shifts during load

---

## 9. What NOT to Build in Phase 5

- ❌ Landing page (separate marketing site — do later if needed)
- ❌ Community preset gallery
- ❌ MP3 export
- ❌ User accounts / authentication
- ❌ AI recommendations
- ❌ Apple Watch integration
- ❌ Push notifications (browser only, complex on PWA)

---

## 10. Post-Phase 5: Launch Sequence

Once Phase 5 is complete and tested:

1. Set `TESTING_MODE = false` in `src/lib/pro.ts`
2. Create Binara Pro product in LemonSqueezy dashboard ($7.99 one-time)
3. Update `LEMONSQUEEZY_CHECKOUT_URL` in `ProUpgrade.tsx`
4. Set `LEMONSQUEEZY_API_KEY` in Vercel environment variables
5. Add `binara.app` to Plausible dashboard
6. Deploy to Vercel
7. Verify: visit binara.app, test all 3 modes, test Pro upgrade flow
8. Add Binara to the Nestorium hub
9. Post first social content using `/promo`
10. Share with practitioner communities

Binara is live. 🎧
