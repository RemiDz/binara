# Binara — Phase 1: Core Audio Engine + Easy Mode

## Overview

Build the foundation of Binara (binara.app) — a mobile-first binaural beats web app. Phase 1 delivers a fully working product: a beautiful preset grid where users tap to play binaural beats with ambient layers, a real-time visualiser, and session timer.

**Repo:** https://github.com/RemiDz/binara
**Domain:** binara.app
**Stack:** Next.js 15+, React 19, TypeScript, Tailwind CSS 4, Web Audio API, Framer Motion

**Important:** This is a mobile-first app. Design for portrait phone screens first, then adapt for tablet/desktop. Everything must work on iOS Safari and Chrome Android.

---

## 1. Project Scaffold

### Initialise Next.js project

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
```

### Fonts

Load via `next/font`:
- **Playfair Display** (weights: 400, 500, 600) — display/headings
- **Inter** (weights: 200, 300, 400, 500) — body text
- **JetBrains Mono** (weights: 400, 500) — data values, frequencies

### Tailwind Config

Extend with custom colours:

```ts
colors: {
  abyss: '#050810',
  deep: '#0a1628',
  neural: '#0c1832',
  synapse: '#132640',
  pulse: {
    cyan: '#4fc3f7',
    violet: '#7986cb',
    amber: '#ffab40',
    green: '#66bb6a',
  },
}
```

### Global Styles

Dark mode only. Base background `#050810`. Set up CSS custom properties for the glass system:

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-bg-hover: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.06);
  --glass-border-hover: rgba(255, 255, 255, 0.12);
  --glass-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  --text-primary: rgba(255, 255, 255, 0.85);
  --text-secondary: rgba(255, 255, 255, 0.60);
  --text-muted: rgba(255, 255, 255, 0.35);
}
```

### Meta & SEO

In `layout.tsx`:
```
Title: Binara — Binaural Beats Playground
Description: Create custom binaural beats for focus, sleep, meditation, and healing. Free presets, modular builder, and advanced synthesis with phone sensor control.
Theme colour: #050810
OG image: (skip for now, add later)
```

### PWA Setup

Create `manifest.json`:
```json
{
  "name": "Binara",
  "short_name": "Binara",
  "description": "The Binaural Beats Playground",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#050810",
  "theme_color": "#050810",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Create a basic service worker for offline caching (use `next-pwa` or manual SW). The app should work offline after first load since all audio is synthesised client-side.

For icons, create simple placeholder icons (white "B" on #050810 background) at 192x192 and 512x512.

---

## 2. Audio Engine

This is the most critical part. Build it as a standalone module that can be used across all three modes.

### File: `src/lib/audio-engine.ts`

The audio engine manages a single `AudioContext` and provides methods to create, control, and destroy audio sessions.

### Architecture

```
AudioContext
├── Carrier Left (OscillatorNode)
│   └── GainNode → StereoPannerNode (pan: -1)
├── Carrier Right (OscillatorNode)
│   └── GainNode → StereoPannerNode (pan: +1)
├── Ambient Layer (AudioBufferSourceNode, optional)
│   └── GainNode
├── Master Chain
│   ├── DynamicsCompressorNode (safety limiter)
│   └── GainNode (master volume, HARD CAP at 0.3)
└── AudioDestination (speakers/headphones)
```

### AudioEngine class

```typescript
interface AudioEngineConfig {
  carrierFreqLeft: number;    // Hz (e.g. 220)
  carrierFreqRight: number;   // Hz (e.g. 226 → 6 Hz beat)
  masterVolume: number;       // 0–1 (will be capped at 0.3)
  waveform: OscillatorType;   // 'sine' | 'triangle' | 'sawtooth' | 'square'
  fadeInDuration: number;     // seconds (default 2)
  fadeOutDuration: number;    // seconds (default 1.5)
}

interface AmbientLayerConfig {
  id: string;                 // e.g. 'rain', 'ocean'
  volume: number;             // 0–1
  loop: boolean;              // always true for ambient
}

class AudioEngine {
  private ctx: AudioContext | null;
  private carrierLeft: OscillatorNode | null;
  private carrierRight: OscillatorNode | null;
  private gainLeft: GainNode | null;
  private gainRight: GainNode | null;
  private panLeft: StereoPannerNode | null;
  private panRight: StereoPannerNode | null;
  private masterGain: GainNode | null;
  private compressor: DynamicsCompressorNode | null;
  private ambientLayers: Map<string, { source: AudioBufferSourceNode; gain: GainNode }>;
  private isPlaying: boolean;

  constructor();

  // Core methods
  async init(): Promise<void>;  // Create AudioContext (must be called from user gesture)
  async play(config: AudioEngineConfig): Promise<void>;  // Start binaural beat
  stop(): void;  // Stop with fade out
  pause(): void;  // Pause audio context
  resume(): void;  // Resume audio context

  // Parameter updates (real-time, no clicks/pops)
  setCarrierFrequency(left: number, right: number): void;  // Smooth ramp
  setMasterVolume(volume: number): void;  // Capped at 0.3
  setWaveform(waveform: OscillatorType): void;

  // Ambient layers
  async loadAmbientBuffer(id: string, url: string): Promise<void>;  // Pre-load audio file
  startAmbientLayer(config: AmbientLayerConfig): void;
  stopAmbientLayer(id: string): void;
  setAmbientVolume(id: string, volume: number): void;

  // Getters
  get beatFrequency(): number;  // carrierRight - carrierLeft
  get playing(): boolean;
  get currentTime(): number;  // AudioContext time

  // Cleanup
  destroy(): void;  // Tear down everything
}
```

### Critical Implementation Details

**AudioContext creation:**
```typescript
async init() {
  this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  // iOS Safari requires resume from user gesture
  if (this.ctx.state === 'suspended') {
    await this.ctx.resume();
  }
}
```

**Safe volume capping:**
```typescript
setMasterVolume(volume: number) {
  const safeVolume = Math.min(volume, 0.3); // HARD CAP
  this.masterGain?.gain.setTargetAtTime(safeVolume, this.ctx!.currentTime, 0.02);
}
```

**Smooth fade in (no clicks):**
```typescript
// When starting oscillators:
this.gainLeft!.gain.setValueAtTime(0, this.ctx!.currentTime);
this.gainLeft!.gain.linearRampToValueAtTime(targetGain, this.ctx!.currentTime + fadeInDuration);
```

**Smooth fade out (no clicks):**
```typescript
stop() {
  const now = this.ctx!.currentTime;
  const fadeOut = 1.5;
  this.gainLeft!.gain.setTargetAtTime(0, now, fadeOut / 5);
  this.gainRight!.gain.setTargetAtTime(0, now, fadeOut / 5);
  // Stop oscillators after fade completes
  setTimeout(() => {
    this.carrierLeft?.stop();
    this.carrierRight?.stop();
    this.isPlaying = false;
  }, fadeOut * 1000 + 100);
}
```

**Smooth frequency changes (for timeline transitions later):**
```typescript
setCarrierFrequency(left: number, right: number) {
  const now = this.ctx!.currentTime;
  this.carrierLeft?.frequency.linearRampToValueAtTime(left, now + 0.05);
  this.carrierRight?.frequency.linearRampToValueAtTime(right, now + 0.05);
}
```

**DynamicsCompressor (safety limiter):**
```typescript
this.compressor = this.ctx.createDynamicsCompressor();
this.compressor.threshold.setValueAtTime(-6, this.ctx.currentTime);
this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
```

### Ambient Audio Files

Store as small, seamlessly loopable audio files in `/public/audio/`:

```
/public/audio/rain.mp3       (~30s loop, ~200KB)
/public/audio/ocean.mp3      (~30s loop, ~200KB)
/public/audio/bowls.mp3      (~30s loop, ~200KB)
/public/audio/forest.mp3     (~30s loop, ~200KB)
/public/audio/fireplace.mp3  (~30s loop, ~200KB)
/public/audio/white.mp3      (~10s loop, ~50KB)
/public/audio/pink.mp3       (~10s loop, ~50KB)
/public/audio/brown.mp3      (~10s loop, ~50KB)
```

**Important:** For V1, GENERATE the noise layers (white, pink, brown) programmatically using Web Audio API instead of loading files. This saves bandwidth and works offline:

```typescript
// White noise: random values
function createWhiteNoise(ctx: AudioContext, duration: number): AudioBuffer {
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return buffer;
}

// Pink noise: -3dB/octave rolloff (Voss-McCartney algorithm)
// Brown noise: -6dB/octave rolloff (integrate white noise)
```

For nature sounds (rain, ocean, bowls, forest, fireplace), these need real audio files. For V1, generate them synthetically too:
- **Rain:** Filtered noise with random amplitude modulation
- **Ocean:** Low-frequency filtered noise with slow volume LFO (wave-like rhythm)
- **Bowls:** Sine oscillators at typical bowl frequencies (396, 528, 639 Hz) with slow amplitude decay
- **Forest:** Filtered noise (high-pass for bird-like) with random sparse chirps
- **Fireplace:** Brown noise with random crackle impulses

This keeps the app fully offline and zero-bandwidth. If the synthetic versions don't sound good enough, we can replace them with real audio files in a later phase.

### React Hook: `src/hooks/useAudioEngine.ts`

```typescript
interface UseAudioEngineReturn {
  isPlaying: boolean;
  isPaused: boolean;
  isInitialised: boolean;
  beatFrequency: number;
  currentTime: number;
  play: (config: AudioEngineConfig) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setVolume: (volume: number) => void;
  setFrequency: (left: number, right: number) => void;
  addAmbient: (id: string, volume: number) => void;
  removeAmbient: (id: string) => void;
  setAmbientVolume: (id: string, volume: number) => void;
  init: () => Promise<void>;
}

function useAudioEngine(): UseAudioEngineReturn;
```

The hook wraps the AudioEngine class in React state. The engine instance should be stored in a `useRef` so it persists across re-renders. State updates (isPlaying, currentTime, beatFrequency) should use `useState` and be updated via an interval or requestAnimationFrame.

---

## 3. Preset Data

### File: `src/lib/presets.ts`

```typescript
interface Preset {
  id: string;
  name: string;
  category: PresetCategory;
  icon: string;            // emoji
  description: string;     // short, 1 sentence
  carrierFreq: number;     // Hz (left ear base)
  beatFreq: number;        // Hz (difference between ears)
  brainwaveState: string;  // 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'
  brainwaveLabel: string;  // human-readable, e.g. "Theta · 6 Hz"
  defaultDuration: number; // minutes
  fadeIn: number;          // seconds
  fadeOut: number;         // seconds
  color: string;           // accent colour for this preset's UI
}

type PresetCategory = 'focus' | 'sleep' | 'meditation' | 'relaxation' | 'energy' | 'therapy';
```

### Category Definitions

```typescript
const CATEGORIES: { id: PresetCategory; label: string; icon: string; description: string }[] = [
  { id: 'focus',      label: 'Focus',      icon: '🧠', description: 'Sharpen concentration and mental clarity' },
  { id: 'sleep',      label: 'Sleep',      icon: '😴', description: 'Drift into deep, restorative rest' },
  { id: 'meditation', label: 'Meditation', icon: '🧘', description: 'Deepen your practice' },
  { id: 'relaxation', label: 'Relaxation', icon: '😌', description: 'Release tension and unwind' },
  { id: 'energy',     label: 'Energy',     icon: '⚡', description: 'Boost alertness and vitality' },
  { id: 'therapy',    label: 'Therapy',    icon: '🎯', description: 'Targeted frequency support' },
];
```

### All 24 Presets

**Focus (Beta/Gamma):**
```
Deep Focus       | carrier: 200 Hz | beat: 16 Hz  | beta  | 25 min | "Sustained concentration for deep work"
Study Flow       | carrier: 250 Hz | beat: 14 Hz  | beta  | 45 min | "Background focus for reading and study"
Creative Spark   | carrier: 180 Hz | beat: 10 Hz  | alpha | 20 min | "Open, creative thinking and ideation"
Problem Solving  | carrier: 220 Hz | beat: 40 Hz  | gamma | 15 min | "Heightened information processing"
```

**Sleep (Delta/Theta):**
```
Fall Asleep      | carrier: 150 Hz | beat: 3 Hz   | delta | 30 min | "Gentle descent into sleep"
Deep Sleep       | carrier: 120 Hz | beat: 1.5 Hz | delta | 60 min | "Sustained deep, dreamless sleep"
Power Nap        | carrier: 180 Hz | beat: 5 Hz   | theta | 20 min | "Quick restorative rest"
Insomnia Relief  | carrier: 136 Hz | beat: 2.5 Hz | delta | 45 min | "Calm a racing mind for sleep"
```

**Meditation (Theta/Alpha):**
```
Mindfulness      | carrier: 200 Hz | beat: 7 Hz   | theta | 20 min | "Present-moment awareness"
Transcendental   | carrier: 136 Hz | beat: 4.5 Hz | theta | 30 min | "Deep transcendent meditation"
Loving Kindness  | carrier: 264 Hz | beat: 8 Hz   | alpha | 15 min | "Heart-centred compassion practice"
Body Scan        | carrier: 180 Hz | beat: 6 Hz   | theta | 25 min | "Progressive body awareness"
```

**Relaxation (Alpha/Theta):**
```
Stress Relief    | carrier: 200 Hz | beat: 10 Hz  | alpha | 15 min | "Rapid stress reduction"
Anxiety Calm     | carrier: 170 Hz | beat: 7.5 Hz | theta | 20 min | "Soothe anxious thoughts"
Tension Release  | carrier: 150 Hz | beat: 5.5 Hz | theta | 15 min | "Physical and mental tension relief"
Wind Down        | carrier: 190 Hz | beat: 9 Hz   | alpha | 20 min | "Evening transition to rest"
```

**Energy (Beta/Gamma):**
```
Morning Boost    | carrier: 250 Hz | beat: 18 Hz  | beta  | 10 min | "Energise your morning"
Afternoon Revival| carrier: 230 Hz | beat: 15 Hz  | beta  | 10 min | "Beat the afternoon slump"
Pre-Workout      | carrier: 280 Hz | beat: 25 Hz  | beta  | 10 min | "Physical activation and drive"
Confidence       | carrier: 200 Hz | beat: 20 Hz  | beta  | 15 min | "Self-assurance and presence"
```

**Therapy (Various):**
```
Pain Relief      | carrier: 174 Hz | beat: 4 Hz   | theta | 30 min | "Frequency support for pain management"
Headache Ease    | carrier: 160 Hz | beat: 6 Hz   | theta | 15 min | "Soothing relief for headaches"
Tinnitus Mask    | carrier: 400 Hz | beat: 10 Hz  | alpha | 30 min | "Gentle masking for tinnitus"
ADHD Focus       | carrier: 200 Hz | beat: 14 Hz  | beta  | 25 min | "Sustained attention support"
```

---

## 4. UI Components

### 4.1 App Layout

**File: `src/app/page.tsx`**

The main page is a single-page app with mode switching. For Phase 1, only Easy mode is functional. Moderate and Advanced show a "Coming Soon" state.

```
┌─────────────────────────────┐
│  Header                     │
├─────────────────────────────┤
│  Mode Switcher              │
├─────────────────────────────┤
│                             │
│  Content Area               │
│  (Easy mode for Phase 1)    │
│                             │
├─────────────────────────────┤
│  Mini Player (when playing) │
└─────────────────────────────┘
```

### 4.2 Header

**File: `src/components/Header.tsx`**

```
┌─────────────────────────────┐
│  B I N A R A          ⚙️    │
└─────────────────────────────┘
```

- "BINARA" in Playfair Display, letter-spacing 0.15em, uppercase
- Settings gear icon (opens settings bottom sheet later — for now just a placeholder)
- Glass background with backdrop-filter blur on scroll
- Safe area padding for notched phones

### 4.3 Mode Switcher

**File: `src/components/ModeSwitcher.tsx`**

Three horizontal pill buttons:

```
[ 🎵 Listen ]  [ 🎛️ Mix ]  [ ⚡ Create ]
```

- Active mode: filled with mode colour (cyan for Listen, amber for Mix, violet for Create)
- Inactive modes: glass background, muted text
- For Phase 1: "Mix" and "Create" show as slightly dimmed with a subtle "Soon" label
- Tapping an inactive mode shows a brief toast: "Coming soon"
- Sticky below header

### 4.4 Category Filter

**File: `src/components/CategoryFilter.tsx`**

Horizontal scrollable pill row:

```
[ All ] [ 🧠 Focus ] [ 😴 Sleep ] [ 🧘 Meditation ] [ 😌 Relaxation ] [ ⚡ Energy ] [ 🎯 Therapy ]
```

- "All" selected by default
- Active pill: glass background with cyan border
- Horizontal scroll with no scrollbar (overflow-x: auto, scrollbar-width: none)
- Snaps to pill boundaries on mobile

### 4.5 Preset Grid

**File: `src/components/PresetGrid.tsx`**

A responsive grid of preset cards:
- Mobile: 2 columns
- Tablet: 3 columns
- Desktop: 4 columns
- Gap: 12px

### 4.6 Preset Card

**File: `src/components/PresetCard.tsx`**

Each card:

```
┌───────────────────────┐
│ 🧠                    │  ← category icon, top-left
│                       │
│    Deep Focus         │  ← preset name (Inter, 500 weight, 14px)
│    Beta · 16 Hz       │  ← brainwave label (JetBrains Mono, 10px, muted)
│                       │
│ Sustained             │  ← description (Inter, 11px, text-secondary)
│ concentration         │
│ for deep work         │
│                       │
│ 25 min                │  ← duration (JetBrains Mono, 10px, bottom-right, muted)
└───────────────────────┘
```

- Glass card background with glass border
- Border-left: 2px solid with brainwave colour:
  - Delta: `#1a237e` (deep navy)
  - Theta: `#7986cb` (violet)
  - Alpha: `#4fc3f7` (cyan)
  - Beta: `#ffab40` (amber)
  - Gamma: `#e040fb` (magenta)
- Hover: border colour brightens, slight scale(1.02)
- Tap: opens the Player view for this preset
- Framer Motion: staggered fade-up entry animation on grid load

### 4.7 Player View

**File: `src/components/PlayerView.tsx`**

When a preset is tapped, the player expands over the grid (full screen on mobile, modal on desktop). This is the main listening experience.

```
┌─────────────────────────────┐
│  ← Back              ⋮     │  ← back arrow, options menu
│                             │
│         ╭─────────╮         │
│       ╭─┤         ├─╮       │
│     ╭─┤ │    ●    │ ├─╮     │  ← Beat Visualiser
│     ╰─┤ │         │ ├─╰     │     Concentric pulsing rings
│       ╰─┤         ├─╯       │     Pulse rate = beat frequency
│         ╰─────────╯         │
│                             │
│       Deep Focus            │  ← Preset name (Playfair, 24px)
│     Beta · 16 Hz            │  ← Brainwave state (JetBrains Mono, 12px, coloured)
│                             │
│  Sustained concentration    │  ← Description (Inter, 14px, text-secondary)
│  for deep work              │
│                             │
│     ╭─────────────────╮     │
│     │   12:34 / 25:00 │     │  ← Session timer with progress ring
│     ╰─────────────────╯     │
│                             │
│  ────────●──────────────    │  ← Volume slider
│  🔈                    🔊   │
│                             │
│  Ambient Layer:             │  ← Label (JetBrains Mono, 10px, muted)
│  [Off] [🌧️] [🌊] [🎵]     │  ← Layer selector pills
│  [🍃] [🔥] [☁️] [🌸] [🟫] │
│                             │  ← Ambient volume slider (appears when layer selected)
│                             │
│     ╭──────────────────╮    │
│     │    ⏸️  Pause      │    │  ← Large pause/play button
│     ╰──────────────────╯    │
│     ╭──────────────────╮    │
│     │    ⏹️  Stop       │    │  ← Stop button (secondary style)
│     ╰──────────────────╯    │
│                             │
│  ℹ️ How Binaural Beats Work │  ← Expandable info section
│                             │
└─────────────────────────────┘
```

### Beat Visualiser

**File: `src/components/BeatVisualiser.tsx`**

The centrepiece of the player. A canvas or SVG element showing concentric rings that pulse at the beat frequency.

Implementation:
- Use `requestAnimationFrame` (throttled to 30fps on mobile)
- 3-5 concentric rings expanding outward from centre
- Ring opacity and radius oscillate at the beat frequency rate
- Ring colour matches the brainwave state colour
- Centre dot pulses gently
- Background: subtle radial gradient glow matching brainwave colour

```typescript
// Pseudocode for ring animation
const rings = [
  { baseRadius: 40, maxExpand: 15, phase: 0 },
  { baseRadius: 65, maxExpand: 12, phase: 0.3 },
  { baseRadius: 90, maxExpand: 10, phase: 0.6 },
  { baseRadius: 115, maxExpand: 8, phase: 0.9 },
];

function animate(time: number) {
  const beatCycle = (time / 1000) * beatFrequency * Math.PI * 2;
  for (const ring of rings) {
    const expand = Math.sin(beatCycle + ring.phase) * ring.maxExpand;
    const radius = ring.baseRadius + expand;
    const opacity = 0.15 + Math.sin(beatCycle + ring.phase) * 0.1;
    // Draw ring at (cx, cy) with radius and opacity
  }
}
```

Respect `prefers-reduced-motion`: if enabled, show static rings with no animation.

### Session Timer

**File: `src/components/SessionTimer.tsx`**

- Circular progress ring (SVG) showing elapsed / total time
- Digital time display in centre: "12:34 / 25:00" (JetBrains Mono)
- Ring colour matches brainwave state
- Smooth progress animation (update every second)
- When session completes: gentle 3-chime sound (synthesised), show "Session Complete" state

### Volume Slider

**File: `src/components/VolumeSlider.tsx`**

- Custom styled range input
- Track: glass-style bar
- Thumb: circular, brainwave colour with glow
- Left icon: quiet speaker
- Right icon: loud speaker
- Maps 0–100% to 0–0.3 gain (the user sees 0–100%, the engine caps at 0.3)

### Ambient Layer Selector

**File: `src/components/AmbientSelector.tsx`**

- Row of pill buttons for each ambient option
- "Off" is first option (default selected)
- Active layer: filled with subtle colour, icon prominent
- When a layer is selected, an ambient volume slider appears below with smooth animation
- Tapping a different layer crossfades between them (fade out current over 1s, fade in new over 1s)
- Tapping the active layer again deselects it (returns to "Off")

### Duration Selector

**Before the player starts** (on the preset card detail or as a pre-play modal), let the user adjust session duration:

```
Session Duration:
[ 5 ] [ 10 ] [ 15 ] [ 20 ] [ 30 ] [ 60 ] min
```

Default is the preset's `defaultDuration`. Selected pill is highlighted.

### Expandable Info: "How Binaural Beats Work"

At the bottom of the player, an expandable section:

```
ℹ️ How Binaural Beats Work
▼

Binaural beats are created when each ear receives a tone at a 
slightly different frequency. Your brain perceives the difference 
as a gentle pulsing beat.

This preset plays [200 Hz] in your left ear and [216 Hz] in your 
right ear. The [16 Hz] difference produces a Beta brainwave 
pattern, associated with focused concentration and active thinking.

🎧 Headphones are required for binaural beats to work.

Brainwave States:
• Delta (0.5–4 Hz) — Deep sleep, restoration
• Theta (4–8 Hz) — Meditation, creativity, dreams
• Alpha (8–12 Hz) — Relaxation, calm focus
• Beta (12–30 Hz) — Concentration, active thinking
• Gamma (30–50 Hz) — Peak awareness, information processing
```

Dynamic values inserted from the preset data: carrier frequencies, beat frequency, brainwave state description.

---

## 5. Background

### File: `src/components/Background.tsx`

Subtle animated background consistent with the Harmonic Waves ecosystem:

- Deep gradient: `#050810` → `#0a1628`
- 20-30 bioluminescent particles (tiny cyan and violet dots) drifting slowly
- Subtle caustic light pattern (very low opacity, ~0.02)
- No waves (this isn't an ocean app)
- Instead: faint neural pathway lines — thin, glowing connections that slowly shift (think synaptic activity). Low opacity (0.03-0.05), very subtle.

Keep this lightweight — it should not impact audio performance. Use CSS animations where possible instead of canvas.

Respect `prefers-reduced-motion`: disable all background animation.

---

## 6. Onboarding

### File: `src/components/Onboarding.tsx`

First-visit flow (stored in localStorage as `binara_onboarding_complete`).

**Screen 1:**
```
B I N A R A

🎧

Headphones Required

Binaural beats work by sending a slightly 
different frequency to each ear. Your brain 
perceives the difference as a gentle beat 
that can influence your mental state.

For the full effect, please use headphones.

        [ I'm wearing headphones → ]

              skip
```

- The "I'm wearing headphones" button should also initialise the AudioContext (user gesture required for iOS)
- "skip" link below in muted text — also initialises AudioContext
- Playfair Display for "BINARA", Inter for body text
- Pulsing headphone icon (subtle animation)

**Screen 2:**
```
Choose your experience:

╭────────────────────────╮
│  🎵  Listen            │
│  Tap a preset          │  ← Cyan accent
│  and relax             │
╰────────────────────────╯

╭────────────────────────╮
│  🎛️  Mix               │
│  Build your own        │  ← Amber accent, "Coming soon" badge
│  session from blocks   │
╰────────────────────────╯

╭────────────────────────╮
│  ⚡  Create            │
│  Full control over     │  ← Violet accent, "Coming soon" badge
│  every parameter       │
╰────────────────────────╯

You can switch anytime
```

- Tapping any card sets the initial mode and dismisses onboarding
- For Phase 1, tapping Mix or Create still works — it just opens the app in Easy mode with a toast that the other modes are coming soon

---

## 7. Headphone Detection

### File: `src/hooks/useHeadphoneDetection.ts`

```typescript
function useHeadphoneDetection(): {
  headphonesConnected: boolean | null;  // null = unknown
  dismissed: boolean;
  dismiss: () => void;
}
```

Use `navigator.mediaDevices.enumerateDevices()` to check for audio output devices with `kind === 'audiooutput'`. If only speaker-type outputs detected, set `headphonesConnected = false`.

Show a dismissible banner at the top of the player if headphones aren't detected:

```
🎧 Headphones recommended for binaural beats to work    ✕
```

- Glass card style, subtle amber border
- Dismiss stores in sessionStorage (re-shows each new session)
- If API unavailable, `headphonesConnected = null` → show banner once on first play

---

## 8. Mini Player

### File: `src/components/MiniPlayer.tsx`

When audio is playing and the user navigates away from the player view (back to the preset grid), a mini player appears fixed at the bottom of the screen:

```
┌──────────────────────────────────┐
│ ●  Deep Focus   12:34  ⏸️  ⏹️   │
│ ██████████░░░░░░░░░░░░░░░░░░░░  │  ← thin progress bar
└──────────────────────────────────┘
```

- Pulsing dot (brainwave colour) indicates active playback
- Preset name
- Elapsed time (JetBrains Mono)
- Pause and Stop buttons
- Thin progress bar at bottom of the mini player
- Tapping the mini player (not the buttons) re-opens the full player view
- Glass card style with backdrop blur
- Safe area padding at bottom for phones with gesture bars

---

## 9. Session Completion

When the timer reaches the set duration:

1. Fade out all audio over 3 seconds (longer than normal stop)
2. Play a gentle completion chime: three ascending sine tones (C5, E5, G5) each 200ms with 100ms gap, very soft
3. Show a completion overlay:

```
┌─────────────────────────────┐
│                             │
│           ✨                │
│                             │
│    Session Complete         │  ← Playfair Display
│                             │
│    Deep Focus · 25 min      │  ← JetBrains Mono, muted
│                             │
│    [ Play Again ]           │  ← Primary button
│    [ Choose Another ]       │  ← Secondary button (returns to grid)
│                             │
└─────────────────────────────┘
```

---

## 10. State Management

Use React context for global app state:

### File: `src/context/AppContext.tsx`

```typescript
interface AppState {
  mode: 'easy' | 'moderate' | 'advanced';
  activePreset: Preset | null;
  isPlaying: boolean;
  isPaused: boolean;
  sessionDuration: number;  // minutes
  elapsedTime: number;      // seconds
  volume: number;           // 0–100 (UI value)
  activeAmbient: string | null;
  ambientVolume: number;    // 0–100
  showPlayer: boolean;
  onboardingComplete: boolean;
}
```

---

## 11. Testing Checklist

### Audio Engine
- [ ] AudioContext initialises on user gesture (button tap)
- [ ] Binaural beat plays with correct frequencies in left and right ears
- [ ] Beat frequency is audibly correct (test with known values like 10 Hz)
- [ ] Volume slider works smoothly with no clicks or pops
- [ ] Fade in is smooth (no click at start)
- [ ] Fade out is smooth (no click at stop)
- [ ] Pause and resume work without audio glitches
- [ ] Frequency changes are smooth (no clicks)
- [ ] Master volume cannot exceed 0.3 (test by setting to 1.0 — should cap)
- [ ] Ambient layers loop seamlessly
- [ ] Ambient crossfade works when switching layers
- [ ] Multiple ambient layers don't play simultaneously (for Phase 1 — single layer only)
- [ ] Works on iOS Safari (AudioContext resume, webkit prefix)
- [ ] Works on Chrome Android
- [ ] Works on desktop Chrome/Firefox/Safari

### UI
- [ ] Onboarding shows on first visit only
- [ ] Preset grid loads with staggered animation
- [ ] Category filter works (filters presets)
- [ ] Tapping a preset opens the player
- [ ] Beat visualiser pulses at the correct rate
- [ ] Session timer counts correctly
- [ ] Timer completes at set duration
- [ ] Completion chime plays
- [ ] Completion overlay shows with correct data
- [ ] Back button returns to grid
- [ ] Mini player appears when navigating away during playback
- [ ] Mini player controls work (pause, stop)
- [ ] Tapping mini player re-opens full player
- [ ] Headphone detection banner shows when no headphones detected
- [ ] Banner is dismissible
- [ ] Duration selector works before playback
- [ ] Mode switcher shows "Coming soon" toast for Mix and Create
- [ ] Background animation is subtle and doesn't impact performance
- [ ] `prefers-reduced-motion` disables all animations
- [ ] Safe area insets work on notched phones
- [ ] Responsive: works on 320px–1440px width

### PWA
- [ ] manifest.json is valid
- [ ] App can be added to home screen
- [ ] App loads offline (after first visit)
- [ ] Standalone display mode works (no browser chrome)

---

## 12. File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, fonts, meta, PWA
│   ├── page.tsx            # Main page (single page app)
│   └── globals.css         # Global styles, glass system, CSS vars
├── components/
│   ├── Header.tsx
│   ├── ModeSwitcher.tsx
│   ├── CategoryFilter.tsx
│   ├── PresetGrid.tsx
│   ├── PresetCard.tsx
│   ├── PlayerView.tsx
│   ├── BeatVisualiser.tsx
│   ├── SessionTimer.tsx
│   ├── VolumeSlider.tsx
│   ├── AmbientSelector.tsx
│   ├── DurationSelector.tsx
│   ├── MiniPlayer.tsx
│   ├── SessionComplete.tsx
│   ├── HeadphoneBanner.tsx
│   ├── Onboarding.tsx
│   ├── Background.tsx
│   └── InfoSection.tsx     # Expandable "How it works"
├── context/
│   └── AppContext.tsx
├── hooks/
│   ├── useAudioEngine.ts
│   └── useHeadphoneDetection.ts
├── lib/
│   ├── audio-engine.ts     # Core AudioEngine class
│   ├── ambient-synth.ts    # Synthetic ambient layer generation
│   ├── presets.ts          # All 24 presets data
│   └── constants.ts        # Colours, brainwave ranges, etc.
└── types/
    └── index.ts            # Shared TypeScript types
```

---

## 13. What NOT to Build in Phase 1

Do NOT implement any of these yet:
- ❌ Moderate mode (Mix) — show "Coming soon"
- ❌ Advanced mode (Create) — show "Coming soon"
- ❌ LemonSqueezy / Pro features
- ❌ Phone sensor integration
- ❌ Session export
- ❌ Preset sharing
- ❌ Multiple simultaneous ambient layers (single layer only for now)
- ❌ Isochronic tones
- ❌ LFO modulation
- ❌ Stereo field controls
- ❌ Multi-layer beat stacking
- ❌ Timeline editor
- ❌ Promo page (/promo)
- ❌ i18n / translations
- ❌ Settings page

Focus entirely on making the audio engine bulletproof and the Easy mode experience beautiful and delightful.
