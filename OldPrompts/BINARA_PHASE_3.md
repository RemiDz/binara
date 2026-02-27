# Binara — Phase 3: Advanced Mode ("Create")

## Overview

Build the Advanced mode for Binara — a full synthesis playground giving users complete control over every audio parameter. Multi-layer beat stacking, stereo field manipulation, LFO modulation, isochronic tones, filter shaping, and a multi-phase visual timeline editor.

This is the power-user mode. The UI should feel like a professional audio tool — dense with controls but elegantly organised in collapsible panels. Think modular synth meets meditation app.

**Prerequisites:** Phase 1 (audio engine + Easy mode) and Phase 2 (Mix mode) must be complete and working.

**Principle:** Extend the existing `AudioEngine` class. Do NOT create a separate audio system. All new synthesis features (LFO, filters, isochronic, multi-layer) are additions to the same engine. Phase 3 also introduces Pro-gating — many Advanced features will be locked behind Pro, but the gate is just a UI block for now (no payment integration yet, that's Phase 4).

---

## 1. Enable Advanced Mode

### Update ModeSwitcher

Remove the "Coming soon" behaviour from the Create button. All three modes are now active.

### Content Area

```tsx
{mode === 'easy' && <EasyMode />}
{mode === 'moderate' && <MixBuilder />}
{mode === 'advanced' && <AdvancedBuilder />}
```

---

## 2. Advanced Builder — Main Component

### File: `src/components/advanced/AdvancedBuilder.tsx`

The Advanced builder is a vertical stack of collapsible panels. Each panel controls a different aspect of the synthesis. Panels can be expanded/collapsed independently so the user can focus on what they're tweaking.

**Layout:**

```
┌─────────────────────────────┐
│  Create                     │  ← Title (Playfair, 20px)
│  Full control over every    │  ← Subtitle (Inter, muted)
│  parameter                  │
├─────────────────────────────┤
│  ▼ Oscillators              │  ← Panel 1 (expanded by default)
│    [oscillator controls]    │
├─────────────────────────────┤
│  ▶ Stereo Field        🔒   │  ← Panel 2 (collapsed, Pro badge)
├─────────────────────────────┤
│  ▶ Modulation (LFO)   🔒   │  ← Panel 3 (collapsed, Pro badge)
├─────────────────────────────┤
│  ▶ Isochronic Tones   🔒   │  ← Panel 4 (collapsed, Pro badge)
├─────────────────────────────┤
│  ▶ Filter                   │  ← Panel 5 (collapsed, free)
├─────────────────────────────┤
│  ▶ Ambient Layers           │  ← Panel 6 (collapsed, free)
├─────────────────────────────┤
│  ▶ Timeline            🔒   │  ← Panel 7 (collapsed, Pro badge)
├─────────────────────────────┤
│  [Session Summary]          │  ← Live summary of all parameters
│  [ ▶️ Start Session ]        │  ← Primary action button
├─────────────────────────────┤
│  My Creations (1/1)         │  ← Saved advanced sessions
│  [saved session cards]      │
└─────────────────────────────┘
```

### Collapsible Panel Component

**File: `src/components/advanced/Panel.tsx`**

Reusable collapsible panel:

```
┌────────────────────────────────┐
│  ▼ Panel Title          🔒 PRO │  ← Header (always visible)
├────────────────────────────────┤
│                                │
│  [Panel content]               │  ← Collapsible body
│                                │
└────────────────────────────────┘
```

- Tap header to expand/collapse (smooth height animation with Framer Motion)
- Arrow rotates on expand/collapse
- 🔒 icon + "PRO" badge on Pro-only panels
- When a Pro-locked panel is expanded, show the controls but with a semi-transparent overlay and a centred message: "This feature requires Binara Pro" with a "Learn More" button (links to nothing for now — Phase 4 will add the purchase flow)
- Pro-locked panels should still show the controls visually (so users can see what they're missing) but all inputs are disabled

---

## 3. Panel 1: Oscillators (Free)

### File: `src/components/advanced/OscillatorPanel.tsx`

Core beat frequency controls. This is the only panel expanded by default.

**Controls:**

### Beat Layers

Up to 4 independent binaural beat layers. Free tier gets 1 layer. Pro unlocks 4.

Each layer is a card:

```
┌─────────────────────────────────────┐
│  Layer 1                    ✕       │  ← Layer header + remove button
│                                     │
│  Beat Frequency     ──────●── 6 Hz  │  ← Slider (0.5–50 Hz, step 0.1)
│  State: Theta · Deep Meditation     │  ← Auto-label based on frequency
│                                     │
│  Carrier Freq       ──────●── 220Hz │  ← Slider (20–1500 Hz, step 0.1)
│                                     │
│  Waveform   [Sine] [Tri] [Saw] [Sq]│  ← Waveform selector pills
│                                     │
│  Volume             ──────●── 80%   │  ← Per-layer volume (0–100%)
│                                     │
└─────────────────────────────────────┘
```

**"Add Layer" button:** Below the layer cards. Adds a new layer (up to 4). Free tier: disabled after 1 layer with Pro badge.

**Beat frequency auto-labelling:**
Based on the beat frequency value, show the brainwave state:
```typescript
function getBrainwaveLabel(hz: number): string {
  if (hz < 0.5) return 'Sub-Delta';
  if (hz <= 4) return `Delta · ${hz < 2 ? 'Deep Sleep' : 'Restoration'}`;
  if (hz <= 8) return `Theta · ${hz < 6 ? 'Deep Meditation' : 'Creativity'}`;
  if (hz <= 12) return `Alpha · ${hz < 10 ? 'Calm Focus' : 'Flow State'}`;
  if (hz <= 30) return `Beta · ${hz < 20 ? 'Active Focus' : 'High Performance'}`;
  return `Gamma · Heightened Perception`;
}
```

**Waveform selector:**
Four pills: Sine (default), Triangle, Sawtooth, Square. Each changes the oscillator waveform. Sine is smoothest and most traditional for binaural beats. The others add harmonic character.

**Frequency calculation:**
For each layer:
- Left ear = carrier frequency
- Right ear = carrier frequency + beat frequency
- Display both values below the sliders in small muted text

---

## 4. Panel 2: Stereo Field (Pro Only)

### File: `src/components/advanced/StereoPanel.tsx`

Controls how the binaural beat sits in the stereo image.

**Controls:**

```
Stereo Width      ──────────●── 100%     ← 0–100% (0=mono, 100=full stereo)
Stereo Pan        ────────●──── 0        ← -100 to +100 (centre default)
Crossfeed         ●──────────── 0%       ← 0–50% (blend opposite channels)
Spatial Rotation  [Off] [Slow] [Med] [Fast]  ← Rotation speed presets
Rotation Speed    ──●────────── 0.1 Hz   ← 0.01–2 Hz (only when rotation enabled)
```

**Stereo Width:** At 100%, left and right channels are fully separated (normal binaural). At 0%, both ears hear the same blended signal (mono — binaural effect disappears). Useful for transitioning.

**Pan:** Shifts the entire stereo image left or right. Default is 0 (centred).

**Crossfeed:** Bleeds a percentage of the left channel into the right and vice versa. Reduces the "in your head" feeling. Some users prefer slight crossfeed for comfort during long sessions.

**Spatial Rotation:** Auto-pans the stereo image in a circular motion. Creates a sense of the sound "orbiting" around the listener's head. Rate controlled by Rotation Speed slider.

**Audio implementation:**

```typescript
// Stereo width: adjust pan values
// width = 1.0 (full stereo): panLeft = -1, panRight = +1
// width = 0.5: panLeft = -0.5, panRight = +0.5
// width = 0.0: panLeft = 0, panRight = 0 (mono)
panLeft.pan.setValueAtTime(-width, now);
panRight.pan.setValueAtTime(width, now);

// Crossfeed: create two additional gain nodes that route
// left → right and right → left at the crossfeed percentage
crossfeedGainLR.gain.setValueAtTime(crossfeed, now);
crossfeedGainRL.gain.setValueAtTime(crossfeed, now);

// Spatial rotation: use an LFO connected to pan values
// rotationLFO oscillates between -width and +width
```

---

## 5. Panel 3: Modulation / LFO (Pro Only)

### File: `src/components/advanced/LFOPanel.tsx`

Low Frequency Oscillator that modulates other parameters over time, creating evolving, breathing textures.

**Controls:**

```
LFO Target    [Volume] [Pitch] [Filter] [Pan]   ← What to modulate
LFO Rate      ──────●────── 0.5 Hz               ← 0.01–10 Hz
LFO Depth     ────────●──── 50%                   ← 0–100%
LFO Shape     [Sine] [Tri] [Square] [Random]      ← Modulation waveform

Preview: ~~~∿∿∿~~~∿∿∿~~~   ← Small SVG showing the LFO waveform shape
```

**LFO Target options:**

| Target | Effect |
|--------|--------|
| Volume | Sound fades in and out rhythmically (tremolo) |
| Pitch | Carrier frequency wobbles up and down (vibrato) |
| Filter | Filter cutoff sweeps up and down (wah-wah effect) |
| Pan | Sound moves left and right (auto-pan) |

**LFO waveform preview:**
A small SVG (200×40px) below the shape selector showing what the selected waveform looks like. Updates when shape changes. Draw 2-3 cycles of the waveform.

**Audio implementation:**

```typescript
// Create LFO oscillator
const lfo = ctx.createOscillator();
lfo.type = lfoShape; // 'sine', 'triangle', 'square'
lfo.frequency.setValueAtTime(lfoRate, ctx.currentTime);

// Create LFO gain (controls depth)
const lfoGain = ctx.createGain();
lfoGain.gain.setValueAtTime(lfoDepth, ctx.currentTime);

// Connect LFO to target
lfo.connect(lfoGain);

switch (lfoTarget) {
  case 'volume':
    lfoGain.connect(masterGain.gain);
    break;
  case 'pitch':
    // Modulate carrier frequencies
    lfoGain.connect(carrierLeft.frequency);
    lfoGain.connect(carrierRight.frequency);
    break;
  case 'filter':
    lfoGain.connect(filter.frequency);
    break;
  case 'pan':
    lfoGain.connect(panLeft.pan);
    // Invert for right channel
    const lfoInvert = ctx.createGain();
    lfoInvert.gain.setValueAtTime(-1, ctx.currentTime);
    lfoGain.connect(lfoInvert);
    lfoInvert.connect(panRight.pan);
    break;
}

lfo.start();

// For 'random' shape: use a ScriptProcessorNode or AudioWorklet
// that outputs random values at the LFO rate
```

---

## 6. Panel 4: Isochronic Tones (Pro Only)

### File: `src/components/advanced/IsochronicPanel.tsx`

Isochronic tones are rhythmic pulses of a single tone — unlike binaural beats, they work without headphones and provide an additional entrainment mechanism.

**Controls:**

```
Enabled           [On] / [Off]                    ← Toggle
Pulse Frequency   ──────●────── 10 Hz             ← 0.5–50 Hz
Pulse Shape       [Sharp] [Soft] [Ramp]           ← How pulses fade
Pulse Tone        ──────●────── 400 Hz            ← 200–2000 Hz
Pulse Volume      ────────●──── 40%               ← 0–100%

Visual:  █ █ █ █ █ █ █ █   ← Small animation showing pulse rhythm
```

**Pulse shapes:**
- **Sharp:** Instant on/off — tone switches between full volume and silence
- **Soft:** Smooth sine-envelope on each pulse — gentle fade in and fade out
- **Ramp:** Sawtooth envelope — quick attack, gradual decay (like striking a bell)

**Audio implementation:**

```typescript
// Isochronic tone: a continuous oscillator gated by a pulsing gain node
const isoOsc = ctx.createOscillator();
isoOsc.type = 'sine';
isoOsc.frequency.setValueAtTime(pulseTone, ctx.currentTime);

const isoGain = ctx.createGain();
isoGain.gain.setValueAtTime(0, ctx.currentTime);

isoOsc.connect(isoGain);
isoGain.connect(masterChain);
isoOsc.start();

// Pulse the gain node at the pulse frequency using a timer
// For 'sharp': gain alternates between pulseVolume and 0
// For 'soft': gain follows a sine envelope
// For 'ramp': gain has quick attack (10ms) and exponential decay

// Use setInterval or a scheduling approach:
const pulsePeriod = 1 / pulseFrequency; // seconds
const pulseOn = pulsePeriod * 0.5;      // 50% duty cycle

function schedulePulse(time: number) {
  switch (pulseShape) {
    case 'sharp':
      isoGain.gain.setValueAtTime(pulseVolume, time);
      isoGain.gain.setValueAtTime(0, time + pulseOn);
      break;
    case 'soft':
      isoGain.gain.setValueAtTime(0, time);
      isoGain.gain.linearRampToValueAtTime(pulseVolume, time + pulseOn * 0.3);
      isoGain.gain.linearRampToValueAtTime(0, time + pulseOn);
      break;
    case 'ramp':
      isoGain.gain.setValueAtTime(0, time);
      isoGain.gain.linearRampToValueAtTime(pulseVolume, time + 0.01);
      isoGain.gain.exponentialRampToValueAtTime(0.001, time + pulseOn);
      break;
  }
}

// Schedule pulses ahead using AudioContext timing for precise rhythm
```

**Pulse visualiser:**
A small horizontal strip (200×30px) showing animated vertical bars pulsing at the set frequency. Bars light up in the accent colour and fade based on the pulse shape.

---

## 7. Panel 5: Filter (Free)

### File: `src/components/advanced/FilterPanel.tsx`

Shape the tonal character of the carrier oscillators.

**Controls:**

```
Filter Type    [Off] [Low Pass] [High Pass] [Band Pass]
Cutoff         ──────────●──── 2000 Hz       ← 20–20000 Hz (logarithmic scale)
Resonance      ────●──────────  25%           ← 0–100% (maps to Q: 0.1–20)
```

**Filter types:**
- **Off:** No filtering (default)
- **Low Pass:** Removes frequencies above the cutoff — makes sound warmer/darker
- **High Pass:** Removes frequencies below the cutoff — makes sound thinner/brighter
- **Band Pass:** Only allows frequencies near the cutoff — nasal/focused sound

**Frequency display:** Show a small frequency response curve (SVG, ~200×60px) that updates in real time as the user adjusts cutoff and resonance. Simple visualisation showing the filter shape:

```
Low Pass at 2000Hz, Q=5:
amplitude
  │ ─────────╲
  │           ╲
  │            ╲___
  └──────────────── frequency
           2kHz
```

**Audio implementation:**

```typescript
const filter = ctx.createBiquadFilter();
filter.type = filterType; // 'lowpass', 'highpass', 'bandpass'
filter.frequency.setValueAtTime(cutoff, ctx.currentTime);
filter.Q.setValueAtTime(resonanceToQ(resonance), ctx.currentTime);

// Insert filter into the signal chain BEFORE the master gain
// carrierLeft → gainLeft → panLeft → filter → compressor → masterGain → destination

function resonanceToQ(pct: number): number {
  // Map 0–100% to Q range 0.1–20 (logarithmic)
  return 0.1 * Math.pow(200, pct / 100);
}
```

**Important:** The filter should affect only the carrier oscillators, NOT the ambient layers. Route carriers through the filter, but ambient layers bypass it.

---

## 8. Panel 6: Ambient Layers (Free, with limits)

### File: `src/components/advanced/AdvancedAmbientPanel.tsx`

Same ambient layer system as Moderate mode — reuse `AmbientMixer` component from Phase 2.

In Advanced mode:
- Free tier: 2 simultaneous layers (same as Moderate)
- Pro: unlimited layers

No additional ambient features in Phase 3 (per-layer EQ is a future enhancement).

---

## 9. Panel 7: Timeline Editor (Pro Only)

### File: `src/components/advanced/TimelineEditor.tsx`

A visual multi-phase timeline where users design frequency journeys with multiple phases and transition curves.

**Layout:**

```
Timeline                                      Total: 32 min

┌──────────────────────────────────────────────────────┐
│                                                      │
│  Hz                                                  │
│  40 ┤                                                │
│     │                                                │
│  20 ┤                          ╭──╮                  │  ← Frequency curve
│     │               ╭─────────╯  │                  │
│  10 ┤──────╮       ╱              ╰─────╮           │
│     │      ╰──────╯                     ╰──────     │
│   0 ┤────────────────────────────────────────────    │
│     └─────┬─────┬──────┬──────┬──────┬──────┬───    │
│          0:00  5:00  10:00  15:00  20:00  25:00     │
│                                                      │
│  Phases:                                             │
│  [ Alpha 10Hz ] → [ Theta 6Hz ] → [ Beta 20Hz ] → [ Alpha 10Hz ]
│     5 min           12 min          10 min           5 min
│                                                      │
└──────────────────────────────────────────────────────┘

[ + Add Phase ]

Phase 1: Alpha                          ✕ Remove
  Beat Frequency  ──────●──── 10 Hz
  Duration        ──────●──── 5 min
  Transition In   [Instant] [Linear] [Ease In] [Ease Out] [S-Curve]

Phase 2: Theta                          ✕ Remove
  Beat Frequency  ──────●──── 6 Hz
  Duration        ──────●──── 12 min
  Transition In   [Instant] [Linear] [Ease In] [Ease Out] [S-Curve]

...
```

### Frequency Journey Graph

An SVG visualisation (full width, ~150px tall) showing the beat frequency over time:
- X-axis: time (0 to total duration)
- Y-axis: frequency (0 to max frequency across all phases, with padding)
- Line: smooth curve connecting phase frequencies with the selected transition curves
- Phase segments: coloured backgrounds matching the brainwave state colour
- Current position marker (when playing): vertical line with dot

### Phase List

Below the graph, each phase is an editable card:

```typescript
interface TimelinePhase {
  id: string;
  beatFreq: number;        // Hz
  duration: number;         // minutes
  transitionType: 'instant' | 'linear' | 'easeIn' | 'easeOut' | 'sCurve';
}
```

**Controls per phase:**
- Beat frequency slider (0.5–50 Hz)
- Duration slider (1–60 min)
- Transition type selector (how this phase transitions FROM the previous phase)
- Remove button (minimum 1 phase must remain)
- Brainwave state auto-label (same as oscillator panel)

**"Add Phase" button:** Adds a new phase to the end. New phase defaults to Alpha 10 Hz, 5 min, linear transition.

**Default timeline:** Single phase — Alpha 10 Hz, 20 min, instant transition. This makes the free tier functional (1 phase = simple sustained session, same as Easy mode).

**Transition types:**

| Type | Behaviour |
|------|-----------|
| Instant | Jump directly to the new frequency (no ramp) |
| Linear | Constant-rate ramp over the first 30 seconds of the phase |
| Ease In | Slow start, fast finish (quadratic ease-in) |
| Ease Out | Fast start, slow finish (quadratic ease-out) |
| S-Curve | Slow start, fast middle, slow finish (cubic ease-in-out) |

**Transition duration:** Fixed at 30 seconds or phase duration, whichever is shorter. The transition happens at the START of each phase (transitioning from the previous phase's frequency to this phase's frequency).

### Free tier limits

- Free: 1 phase only (no "Add Phase" button, no transitions). Effectively a simple sustained session.
- Pro: unlimited phases with all transition types.

---

## 10. Audio Engine Extensions

### File: `src/lib/audio-engine.ts` (extend existing)

Add these capabilities to support Advanced mode:

### Multi-Layer Beat System

```typescript
interface BeatLayer {
  id: string;
  carrierFreq: number;
  beatFreq: number;
  volume: number;          // 0–1
  waveform: OscillatorType;
  oscLeft: OscillatorNode;
  oscRight: OscillatorNode;
  gainLeft: GainNode;
  gainRight: GainNode;
  panLeft: StereoPannerNode;
  panRight: StereoPannerNode;
}

// New methods:
addBeatLayer(config: { carrierFreq: number; beatFreq: number; volume: number; waveform: OscillatorType }): string; // returns layer ID
removeBeatLayer(id: string): void;
updateBeatLayer(id: string, params: Partial<{ carrierFreq: number; beatFreq: number; volume: number; waveform: OscillatorType }>): void;
getBeatLayers(): BeatLayer[];
```

Each layer creates its own oscillator pair + gain + pan nodes, all routed through the shared filter → compressor → master gain chain.

### Stereo Field

```typescript
interface StereoConfig {
  width: number;           // 0–1
  pan: number;             // -1 to +1
  crossfeed: number;       // 0–0.5
  rotationEnabled: boolean;
  rotationSpeed: number;   // Hz
}

setStereoConfig(config: Partial<StereoConfig>): void;
```

**Crossfeed implementation:**
Create two crossfeed gain nodes:
- Left → crossfeedGainLR → Right channel
- Right → crossfeedGainRL → Left channel

**Rotation implementation:**
Create an LFO oscillator connected to the pan nodes. When rotation is active, the LFO modulates pan values sinusoidally.

### LFO System

```typescript
interface LFOConfig {
  target: 'volume' | 'pitch' | 'filter' | 'pan';
  rate: number;            // Hz
  depth: number;           // 0–1
  shape: 'sine' | 'triangle' | 'square';
}

setLFO(config: LFOConfig | null): void;  // null to disable
```

### Isochronic Tone System

```typescript
interface IsochronicConfig {
  enabled: boolean;
  pulseFreq: number;       // Hz
  pulseShape: 'sharp' | 'soft' | 'ramp';
  tonePitch: number;       // Hz
  volume: number;          // 0–1
}

setIsochronic(config: IsochronicConfig | null): void;  // null to disable
```

Use precise AudioContext scheduling for isochronic pulses. Schedule pulses 1 second ahead in a lookahead pattern to avoid timing jitter:

```typescript
private scheduleIsochronicPulses() {
  const lookahead = 1; // schedule 1 second ahead
  const now = this.ctx!.currentTime;
  while (this.nextPulseTime < now + lookahead) {
    this.scheduleSinglePulse(this.nextPulseTime);
    this.nextPulseTime += 1 / this.isoConfig!.pulseFreq;
  }
}

// Call scheduleIsochronicPulses from a setInterval(25ms) timer
```

### Filter System

```typescript
interface FilterConfig {
  type: 'off' | 'lowpass' | 'highpass' | 'bandpass';
  cutoff: number;          // Hz
  resonance: number;       // 0–1 (mapped to Q internally)
}

setFilter(config: FilterConfig): void;
```

Insert the BiquadFilterNode into the carrier signal chain (BEFORE compressor), but ensure ambient layers bypass the filter.

Updated signal chain:

```
Beat Layer(s) → [Filter] → Compressor → Master Gain → Destination
Ambient Layer(s) ──────────→ Compressor → Master Gain → Destination
Isochronic Tone ──────────→ Compressor → Master Gain → Destination
```

### Advanced Timeline Runner

Extend the `TimelineRunner` from Phase 2 to support:
- Multiple phases (not just 3)
- Transition curve types (instant, linear, easeIn, easeOut, sCurve)
- Multiple beat layers (transition all layers simultaneously, or transition only layer 1)

```typescript
// Easing functions for transitions
function easeIn(t: number): number { return t * t; }
function easeOut(t: number): number { return 1 - (1 - t) * (1 - t); }
function sCurve(t: number): number { return t * t * (3 - 2 * t); }
function linear(t: number): number { return t; }
function instant(t: number): number { return t > 0 ? 1 : 0; }
```

---

## 11. Advanced Session Config

### File: `src/types/index.ts` (extend)

```typescript
interface AdvancedSessionConfig {
  layers: {
    id: string;
    carrierFreq: number;
    beatFreq: number;
    volume: number;
    waveform: OscillatorType;
  }[];
  stereo: StereoConfig;
  lfo: LFOConfig | null;
  isochronic: IsochronicConfig | null;
  filter: FilterConfig;
  ambientLayers: { id: string; volume: number }[];
  timeline: {
    id: string;
    beatFreq: number;
    duration: number;       // minutes
    transitionType: string;
  }[];
}
```

### Saving Advanced Sessions

Extend `session-storage.ts` to handle advanced sessions:

```typescript
interface SavedAdvancedSession {
  id: string;
  name: string;
  createdAt: string;
  mode: 'advanced';
  config: AdvancedSessionConfig;
}
```

**Free tier limit:** 1 saved advanced session. Show limit message on 2nd save attempt.

---

## 12. Advanced Player

### File: `src/components/advanced/AdvancedPlayer.tsx`

When the user starts an advanced session, show a player with additional readouts.

Reuse the existing beat visualiser and session timer from Phase 1/2, but add:

```
┌─────────────────────────────┐
│  ← Back              ⋮     │
│                             │
│     [Beat Visualiser]       │  ← Multiple concentric ring sets for multi-layer
│                             │
│  Layer 1: Theta · 6 Hz     │  ← Per-layer readout
│  Layer 2: Alpha · 10 Hz    │
│                             │
│  Carrier: 220 Hz · Sine    │  ← Carrier info
│  Filter: LP 2000Hz Q5      │  ← Filter info (if active)
│  LFO: Volume · 0.5Hz       │  ← LFO info (if active)
│  Iso: 10Hz Sharp            │  ← Isochronic info (if active)
│                             │
│  ── Phase 2 of 4 ──────── │  ← Timeline phase indicator
│  ████████████░░░░░░░░░░░░  │  ← Phase progress
│                             │
│      12:34 / 32:00          │  ← Total timer
│                             │
│  [Volume] [Pause] [Stop]    │
└─────────────────────────────┘
```

**Multi-layer visualiser:** When multiple beat layers are active, show nested visualiser rings — one set per layer, each in the layer's brainwave colour. Outer ring = Layer 1, inner ring = Layer 4.

**Parameter readout:** Show active parameters in small muted text (JetBrains Mono). Only show parameters that are actually active (don't show "LFO: Off").

---

## 13. Pro Gate UI

### File: `src/components/ProGate.tsx`

A reusable overlay component for Pro-locked features.

```tsx
interface ProGateProps {
  feature: string;  // "Multi-layer beats", "Stereo field", etc.
  children: React.ReactNode;
}

function ProGate({ feature, children }: ProGateProps) {
  const isPro = false; // Will be wired to LemonSqueezy in Phase 4

  if (isPro) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="glass-card p-4 text-center">
          <span className="text-pulse-amber text-xs font-mono">🔒 PRO</span>
          <p className="text-sm text-white/80 mt-1">{feature}</p>
          <p className="text-xs text-white/40 mt-1">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
```

**Where to apply ProGate:**
- Beat layers 2, 3, 4 (layer 1 is free)
- Entire Stereo Field panel content
- Entire LFO panel content
- Entire Isochronic panel content
- Timeline phases beyond the first
- Custom carrier frequency in Moderate mode
- 3rd+ ambient layer
- Save beyond free limit

---

## 14. Slider Component

### File: `src/components/ui/Slider.tsx`

Advanced mode needs a lot of sliders. Create a polished, reusable slider component if one doesn't exist already.

```tsx
interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  valueLabel?: string;       // e.g. "6 Hz", "220 Hz", "50%"
  color?: string;            // accent colour for thumb and track fill
  logarithmic?: boolean;     // for frequency sliders (cutoff)
  disabled?: boolean;
  onChange: (value: number) => void;
}
```

**Styling:**
- Track: glass-style bar (rgba white low opacity), 4px tall, rounded
- Filled portion: accent colour
- Thumb: 16px circle, accent colour with subtle glow
- Label left, value right
- Touch target: at least 44px tall for mobile
- Logarithmic mode: for frequency sliders where low values need more precision

---

## 15. File Structure (new files)

```
src/
├── components/
│   ├── advanced/
│   │   ├── AdvancedBuilder.tsx      # Main container with collapsible panels
│   │   ├── Panel.tsx                # Reusable collapsible panel
│   │   ├── OscillatorPanel.tsx      # Beat layers with carrier/beat/waveform
│   │   ├── StereoPanel.tsx          # Stereo width, pan, crossfeed, rotation
│   │   ├── LFOPanel.tsx             # LFO target, rate, depth, shape
│   │   ├── IsochronicPanel.tsx      # Isochronic toggle, pulse freq/shape/tone
│   │   ├── FilterPanel.tsx          # Filter type, cutoff, resonance
│   │   ├── AdvancedAmbientPanel.tsx # Reuses AmbientMixer from Phase 2
│   │   ├── TimelineEditor.tsx       # Multi-phase visual timeline
│   │   ├── FrequencyGraph.tsx       # SVG frequency journey visualisation
│   │   ├── AdvancedPlayer.tsx       # Player with multi-layer readouts
│   │   └── AdvancedSummary.tsx      # Session summary for advanced config
│   ├── ui/
│   │   └── Slider.tsx               # Reusable slider component
│   ├── ProGate.tsx                  # Pro feature overlay
│   └── ... (existing components)
├── lib/
│   ├── audio-engine.ts              # Extended with multi-layer, stereo, LFO, iso, filter
│   ├── session-timeline.ts          # Extended with multi-phase, easing curves
│   ├── easing.ts                    # Easing functions
│   └── ... (existing libs)
└── types/
    └── index.ts                     # Extended with Advanced types
```

---

## 16. Testing Checklist

### Mode Switching
- [ ] All three modes now work (no "Coming soon" on any)
- [ ] Switching modes preserves playback
- [ ] MiniPlayer works for all three modes

### Oscillator Panel
- [ ] Single beat layer works in free tier
- [ ] Beat frequency slider produces correct binaural beat
- [ ] Carrier frequency slider changes the base tone
- [ ] Waveform selector changes oscillator type (audibly different)
- [ ] Per-layer volume works
- [ ] Brainwave auto-label updates correctly
- [ ] "Add Layer" blocked at 1 for free tier with Pro badge
- [ ] Multi-layer renders correctly when Pro is simulated

### Stereo Panel
- [ ] Pro gate overlay shows correctly
- [ ] Width slider changes stereo separation (test with headphones)
- [ ] Pan slider moves sound left/right
- [ ] Crossfeed blends channels
- [ ] Spatial rotation creates circular panning effect
- [ ] All controls disabled behind Pro gate

### LFO Panel
- [ ] Pro gate overlay shows correctly
- [ ] Volume target: audible tremolo effect
- [ ] Pitch target: audible vibrato effect
- [ ] Filter target: audible filter sweep (requires filter to be active)
- [ ] Pan target: audible auto-panning
- [ ] Rate slider changes modulation speed
- [ ] Depth slider changes modulation intensity
- [ ] Shape selector changes waveform character
- [ ] LFO waveform preview SVG renders correctly

### Isochronic Panel
- [ ] Pro gate overlay shows correctly
- [ ] Toggle on/off works
- [ ] Pulse frequency changes audible pulse rate
- [ ] Sharp shape: clean on/off pulses
- [ ] Soft shape: smooth fade in/out pulses
- [ ] Ramp shape: quick attack, gradual decay
- [ ] Tone pitch changes the pitch of pulses
- [ ] Volume controls pulse loudness independently
- [ ] Pulse visual animation matches actual pulse rate

### Filter Panel
- [ ] "Off" bypasses filter entirely
- [ ] Low Pass: audibly removes high frequencies
- [ ] High Pass: audibly removes low frequencies
- [ ] Band Pass: audibly narrows to a frequency band
- [ ] Cutoff slider changes filter frequency
- [ ] Resonance slider adds emphasis at cutoff
- [ ] Filter response curve SVG updates in real time
- [ ] Filter only affects carriers, not ambient layers

### Timeline Editor
- [ ] Free tier: single phase works, "Add Phase" blocked
- [ ] Pro (simulated): multiple phases can be added
- [ ] Phase frequency sliders work
- [ ] Phase duration sliders work
- [ ] Remove phase works (minimum 1 phase)
- [ ] Frequency journey graph renders correctly
- [ ] Transition types produce different ramp curves
- [ ] All phases play in sequence during session
- [ ] Transitions between phases are smooth (no clicks)

### Advanced Player
- [ ] Session starts with all configured parameters
- [ ] Multi-layer visualiser shows correct number of ring sets
- [ ] Parameter readouts display active features
- [ ] Phase indicator shows correct phase
- [ ] Timer works correctly across all phases
- [ ] Session completes with chime at total duration
- [ ] Pause/resume maintains all parameter state
- [ ] Stop fades out all layers cleanly

### Saving
- [ ] Advanced sessions save to localStorage
- [ ] Free tier blocked at 1 save
- [ ] Saved sessions load and play correctly
- [ ] All parameters are preserved on save/load

### Audio Quality
- [ ] No clicks or pops when starting/stopping
- [ ] No clicks when changing frequencies
- [ ] No clicks when toggling features on/off
- [ ] Multi-layer doesn't cause audio distortion (compressor works)
- [ ] Volume never exceeds safe levels
- [ ] Works on iOS Safari
- [ ] Works on Chrome Android

### Pro Gate
- [ ] All Pro features show overlay correctly
- [ ] Disabled controls can't be interacted with
- [ ] Free features still work normally alongside locked panels

---

## 17. What NOT to Build in Phase 3

- ❌ LemonSqueezy payment integration (Phase 4)
- ❌ Phone sensor integration (Phase 4)
- ❌ Session export WAV/MP3 (Phase 4)
- ❌ Preset sharing via URL (Phase 4)
- ❌ Per-layer EQ on ambient layers (future)
- ❌ Promo page (Phase 5)
- ❌ Settings page (Phase 5)

Focus on making the synthesis engine comprehensive and the control surface intuitive. Every parameter change should be silky smooth with zero audio artefacts.
