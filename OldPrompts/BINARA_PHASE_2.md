# Binara — Phase 2: Moderate Mode ("Mix")

## Overview

Build the Moderate mode for Binara — a modular beat builder where users create custom binaural beat sessions by choosing blocks (brainwave state, carrier tone, ambient layers, timeline) without needing to know raw frequency values. Everything is labelled by effect, not numbers.

**Prerequisites:** Phase 1 must be complete and working (audio engine, Easy mode, all presets).

**Principle:** Reuse the existing audio engine from Phase 1. Moderate mode is a different UI that feeds different parameters into the same `AudioEngine` class. Do NOT duplicate audio logic.

---

## 1. Enable Mode Switching

### Update ModeSwitcher

Remove the "Coming soon" behaviour from the Mix button. Tapping "Mix" should now switch to Moderate mode. "Create" remains "Coming soon" for now.

### Update AppContext

The `mode` state already exists. When mode switches to `'moderate'`, the content area renders the `MixBuilder` component instead of the preset grid.

### Content Area Routing

```tsx
// In page.tsx or wherever the content area renders:
{mode === 'easy' && <EasyMode />}
{mode === 'moderate' && <MixBuilder />}
{mode === 'advanced' && <ComingSoon />}
```

**Important:** If audio is currently playing when the user switches modes, it should continue playing. The MiniPlayer handles this. The user can switch modes freely without interrupting playback.

---

## 2. Mix Builder — Main Component

### File: `src/components/mix/MixBuilder.tsx`

The Mix builder is a vertical, step-by-step interface. The user works through 4 steps, then hits Play. Steps are always visible (not a wizard/stepper — more like a scrollable form).

```
┌─────────────────────────────┐
│  Build Your Session         │  ← Section title (Playfair, 20px)
│  Combine blocks to create   │  ← Subtitle (Inter, muted)
│  your perfect frequency     │
│  journey                    │
├─────────────────────────────┤
│                             │
│  Step 1: Choose Your State  │  ← Brainwave target selector
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │Delta│ │Theta│ │Alpha│   │
│  └─────┘ └─────┘ └─────┘   │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ Beta│ │Gamma│ │     │   │
│  └─────┘ └─────┘ └─────┘   │
│                             │
│  Step 2: Choose Your Tone   │  ← Carrier frequency selector
│  ┌──────────┐ ┌──────────┐  │
│  │Earth Tone│ │Warm Bass │  │
│  └──────────┘ └──────────┘  │
│  ...                        │
│                             │
│  Step 3: Ambient Layers     │  ← Multi-select ambient layers
│  [🌧️] [🌊] [🎵] [🍃]      │
│  [🔥] [☁️] [🌸] [🟫]      │
│                             │
│  Step 4: Session Timeline   │  ← 3-phase timeline
│  ┌───────────────────────┐  │
│  │ Ease In → Deep → Out  │  │
│  └───────────────────────┘  │
│                             │
│  ╭──────────────────────╮   │
│  │    ▶️  Start Session  │   │  ← Primary action button
│  ╰──────────────────────╯   │
│                             │
│  Session Summary:           │  ← Live summary of selections
│  Theta 6Hz · 200Hz carrier  │
│  Rain + Ocean · 20 min      │
│                             │
└─────────────────────────────┘
```

---

## 3. Step 1: Brainwave State Selector

### File: `src/components/mix/StateSelector.tsx`

A grid of selectable brainwave state cards. Single selection — tapping one deselects the previous.

**7 states available:**

| ID | Label | Frequency | Beat Hz | Colour | Description |
|----|-------|-----------|---------|--------|-------------|
| `deep-sleep` | Deep Sleep | Delta | 2 Hz | `#1a237e` | Dreamless sleep, deep restoration |
| `dream` | Dream State | Theta | 5.5 Hz | `#5c6bc0` | REM sleep, vivid dreams, deep meditation |
| `calm-focus` | Calm Focus | Low Alpha | 9 Hz | `#4fc3f7` | Relaxed awareness, light meditation |
| `flow` | Flow State | High Alpha | 11 Hz | `#26c6da` | Creative flow, effortless focus |
| `active-focus` | Active Focus | Low Beta | 15 Hz | `#ffab40` | Concentration, problem solving, study |
| `performance` | High Performance | High Beta | 25 Hz | `#ff7043` | Intense focus, peak mental performance |
| `insight` | Insight | Gamma | 40 Hz | `#e040fb` | Heightened perception, information processing |

**Card layout:**

```
┌────────────────────────┐
│  ● Deep Sleep          │  ← Coloured dot + label (Inter, 500, 13px)
│  Delta · 2 Hz          │  ← Frequency info (JetBrains Mono, 10px, muted)
│  Dreamless sleep,      │  ← Description (Inter, 11px, text-secondary)
│  deep restoration      │
└────────────────────────┘
```

- Grid: 2 columns on mobile, 3 on tablet+
- Selected card: border colour matches state colour, subtle glow, background tint
- Unselected: standard glass card
- Default selection: "Calm Focus" (most universally useful)

---

## 4. Step 2: Carrier Frequency Selector

### File: `src/components/mix/CarrierSelector.tsx`

Named carrier tone options. The user doesn't see raw Hz values prominently — they see descriptive names. The frequency is shown as a secondary detail.

**7 free options + 1 Pro-only:**

| ID | Label | Frequency | Description |
|----|-------|-----------|-------------|
| `earth` | Earth Tone | 136.1 Hz | OM frequency, grounding |
| `warm` | Warm Bass | 180 Hz | Rich, warm foundation |
| `verdi` | Verdi Tuning | 216 Hz | Natural resonance, 432 Hz harmonic |
| `heart` | Heart Centre | 256 Hz | C4, clear and balanced |
| `solfeggio` | Solfeggio Love | 264 Hz | Based on 528 Hz harmonic |
| `concert` | Concert Base | 220 Hz | A3, standard tuning reference |
| `crystal` | Crystal Clear | 320 Hz | Bright, clear, present |
| `custom` | Custom | User-defined | **Pro only** — shows lock icon, tap triggers Pro upsell |

**Card layout:**

```
┌────────────────────────┐
│  Earth Tone            │  ← Label (Inter, 500, 13px)
│  136.1 Hz              │  ← Frequency (JetBrains Mono, 10px, cyan)
│  OM frequency,         │  ← Description (Inter, 11px, muted)
│  grounding             │
└────────────────────────┘
```

- Grid: 2 columns
- Selected: cyan border + glow
- Default: "Concert Base" (220 Hz — most neutral)
- "Custom" card shows a 🔒 icon and "Pro" badge. Tapping it shows a brief toast or modal: "Custom carrier frequency is a Pro feature — coming soon"

**Frequency preview:** When the user taps a carrier option, play a very brief (500ms) soft tone at that frequency so they can hear the difference. Use the existing AudioEngine — create a quick `previewTone(freq, duration)` method that plays a single oscillator with fast fade in/out. Don't interfere with any currently playing session.

---

## 5. Step 3: Ambient Layer Selector

### File: `src/components/mix/AmbientMixer.tsx`

Multi-select ambient layers with individual volume controls. This is more powerful than Easy mode's single-layer picker.

**Layout:**

```
Ambient Layers                      │ 0 selected
                                    │
[🌧️ Rain    ] [🌊 Ocean   ] [🎵 Bowls  ] [🍃 Forest   ]
[🔥 Fire    ] [☁️ White   ] [🌸 Pink   ] [🟫 Brown    ]

── Active Layers ──────────────────
🌧️ Rain        ────────●──── 65%    ← individual volume slider
🌊 Ocean       ──────●────── 45%    ← individual volume slider
```

- Pill buttons in a 4×2 grid (or 2×4 on narrow screens)
- Tapping a pill toggles it on/off
- Active pills: filled background with layer colour/icon prominent
- When layers are active, a "Active Layers" section appears below with individual volume sliders
- Each slider: layer icon, name, horizontal slider, percentage value

**Free tier limit:** Maximum 2 simultaneous layers. If the user tries to select a 3rd:
- Show a toast: "Free plan supports 2 ambient layers. Upgrade to Pro for unlimited."
- Don't select the 3rd layer
- For Phase 2, just enforce the limit with the toast. Pro unlock comes in Phase 4.

**Audio implementation:**
- Each ambient layer plays through its own gain node in the AudioEngine
- Need to extend AudioEngine to support multiple simultaneous ambient layers:

```typescript
// Add to AudioEngine:
startAmbientLayer(id: string, volume: number): void;  // Can call multiple times for different IDs
stopAmbientLayer(id: string): void;
setAmbientVolume(id: string, volume: number): void;
stopAllAmbientLayers(): void;
getActiveAmbientLayers(): string[];
```

The existing ambient system from Phase 1 may only support a single layer. Extend it to support a `Map<string, { source, gain }>` of concurrent layers. Each layer loops independently.

---

## 6. Step 4: Session Timeline

### File: `src/components/mix/TimelineBuilder.tsx`

A 3-phase session timeline with adjustable durations.

**Visual layout:**

```
Session Timeline                    Total: 25 min

┌──────────────────────────────────────────────┐
│ ╭──────╮   ╭────────────────╮   ╭─────╮     │
│ │Ease  │ → │     Deep       │ → │Ease │     │
│ │ In   │   │    Session     │   │ Out │     │
│ │ 3min │   │    19 min      │   │2min │     │
│ ╰──────╯   ╰────────────────╯   ╰─────╯     │
└──────────────────────────────────────────────┘

Ease In      ──────●────────── 3 min
Deep Session ──────────────●── 19 min
Ease Out     ────●──────────── 2 min
```

**Three phases:**

| Phase | Purpose | Default | Min | Max | Description |
|-------|---------|---------|-----|-----|-------------|
| Ease In | Transition from waking state to target | 3 min | 1 min | 10 min | Starts at Alpha (10 Hz) and smoothly transitions to the target brainwave state |
| Deep | Main session at target frequency | 19 min | 3 min | 120 min | Sustained time at the chosen brainwave state |
| Ease Out | Return to waking state | 2 min | 1 min | 10 min | Smoothly transitions from target back to Alpha (10 Hz) |

**Visual timeline bar:**
- Horizontal bar divided into 3 coloured sections proportional to their duration
- Ease In: gradient from alpha colour (cyan) to target state colour
- Deep: solid target state colour
- Ease Out: gradient from target state colour back to alpha colour (cyan)
- Arrows or smooth transitions between sections

**Duration sliders:**
- Three horizontal sliders, one per phase
- Label on left, value on right
- Changing any slider updates the visual timeline bar in real time
- Total duration shown above the timeline

**Preset quick-select:**
Below the sliders, offer quick duration presets:

```
Quick presets: [ 10 min ] [ 20 min ] [ 30 min ] [ 45 min ] [ 60 min ]
```

Tapping a quick preset distributes time proportionally:
- 10 min: 2 + 7 + 1
- 20 min: 3 + 15 + 2
- 30 min: 3 + 24 + 3
- 45 min: 5 + 36 + 4
- 60 min: 5 + 50 + 5

---

## 7. Session Summary

### File: `src/components/mix/SessionSummary.tsx`

A live summary card that updates as the user makes selections. Fixed above the "Start Session" button so the user always sees what they've built.

```
┌──────────────────────────────────────┐
│  Your Session                        │
│                                      │
│  🧠 Calm Focus · Alpha · 9 Hz       │  ← State
│  🎵 Concert Base · 220 Hz           │  ← Carrier
│  🌧️ Rain (65%) + 🌊 Ocean (45%)    │  ← Ambient layers
│  ⏱️ 25 min (3 + 19 + 2)            │  ← Timeline
│                                      │
│  Left ear: 220 Hz                    │  ← Technical detail (small, muted)
│  Right ear: 229 Hz                   │
│  Beat: 9 Hz                          │
└──────────────────────────────────────┘
```

- Glass card with subtle accent border matching the selected brainwave state
- Updates in real time as selections change
- Technical frequency details shown small at the bottom for users who care

---

## 8. Start Session / Mix Player

When the user taps "Start Session", it should:

1. Validate all selections are made (state + carrier are required, ambient and timeline have defaults)
2. Calculate exact frequencies:
   - Left carrier = selected carrier frequency
   - Right carrier = selected carrier frequency + selected beat frequency
3. Build a session config object
4. Transition to the Mix Player view

### Mix Player View

Reuse the existing `PlayerView` component from Easy mode with these modifications:

**File: `src/components/mix/MixPlayer.tsx`** (wraps PlayerView with mix-specific data)

The player should show:
- Everything the Easy mode player shows (visualiser, timer, volume, pause/stop)
- **Phase indicator:** Which phase is currently active (Ease In / Deep / Ease Out) with progress within that phase
- **Phase progress bar:** A thin horizontal bar below the main visualiser showing the 3 phases with a moving indicator

```
┌────────────────────────────────┐
│                                │
│    [Beat Visualiser]           │  ← Same as Easy mode
│                                │
│  Calm Focus · Alpha · 9 Hz    │  ← State label
│  220 Hz carrier                │  ← Carrier label
│                                │
│  ── Phase: Ease In (1:23) ──  │  ← Current phase + time in phase
│  ████░░░░░░░░░░░░░░░░░░░░░░  │  ← Phase progress bar (3 sections)
│  ↑ In      Deep         Out   │
│                                │
│      08:42 / 25:00             │  ← Total session timer
│                                │
│  [Volume slider]               │
│  [Ambient controls]            │  ← Show active layers with volume
│                                │
│    [ ⏸️ Pause ]  [ ⏹️ Stop ]   │
│                                │
└────────────────────────────────┘
```

### Phase Transition Logic

The audio engine needs to smoothly transition frequencies during Ease In and Ease Out phases.

**Ease In behaviour:**
- Start at Alpha beat frequency (10 Hz)
- Linearly ramp to target beat frequency over the Ease In duration
- e.g. if target is Theta 5.5 Hz and Ease In is 3 minutes:
  - At 0:00 → beat = 10 Hz
  - At 1:30 → beat = 7.75 Hz
  - At 3:00 → beat = 5.5 Hz

**Deep behaviour:**
- Sustain target beat frequency for the full Deep duration
- No frequency changes

**Ease Out behaviour:**
- Start at target beat frequency
- Linearly ramp back to Alpha (10 Hz) over the Ease Out duration
- e.g. if target is Theta 5.5 Hz and Ease Out is 2 minutes:
  - At 0:00 → beat = 5.5 Hz
  - At 1:00 → beat = 7.75 Hz
  - At 2:00 → beat = 10 Hz

**Implementation:**

Create a session timeline manager:

### File: `src/lib/session-timeline.ts`

```typescript
interface TimelinePhase {
  name: 'easeIn' | 'deep' | 'easeOut';
  duration: number;        // seconds
  startBeatFreq: number;   // Hz
  endBeatFreq: number;     // Hz
}

interface SessionTimeline {
  phases: TimelinePhase[];
  totalDuration: number;   // seconds
  carrierFreq: number;     // Hz (left ear base)
}

class TimelineRunner {
  private timeline: SessionTimeline;
  private startTime: number;
  private engine: AudioEngine;

  constructor(timeline: SessionTimeline, engine: AudioEngine);

  // Call this on every tick (e.g. from a setInterval or rAF)
  tick(): {
    currentPhase: 'easeIn' | 'deep' | 'easeOut';
    phaseProgress: number;      // 0–1 within current phase
    totalProgress: number;      // 0–1 overall
    elapsedSeconds: number;
    currentBeatFreq: number;
    isComplete: boolean;
  };

  // Updates the engine's frequencies based on current position
  private updateFrequencies(): void;
}
```

The `tick()` method:
1. Calculates elapsed time since start
2. Determines which phase we're in
3. Calculates the interpolated beat frequency for the current moment
4. Calls `engine.setCarrierFrequency(carrier, carrier + currentBeat)` for smooth transitions
5. Returns current state for the UI to display

Run `tick()` from a `setInterval` at 100ms intervals (10Hz update rate is sufficient for smooth frequency ramps).

---

## 9. Saving Sessions

### File: `src/lib/session-storage.ts`

Users can save their custom Mix sessions to localStorage.

```typescript
interface SavedSession {
  id: string;              // crypto.randomUUID()
  name: string;            // user-provided or auto-generated
  createdAt: string;       // ISO date
  stateId: string;         // brainwave state ID
  carrierId: string;       // carrier tone ID
  ambientLayers: { id: string; volume: number }[];
  timeline: {
    easeIn: number;        // minutes
    deep: number;          // minutes
    easeOut: number;       // minutes
  };
}

function saveSession(session: SavedSession): void;
function loadSessions(): SavedSession[];
function deleteSession(id: string): void;
function getSessionCount(): number;
```

**Storage key:** `binara_sessions`

**Free tier limit:** Maximum 3 saved sessions. When the user tries to save a 4th:
- Show a modal: "You've reached the free limit of 3 saved sessions. Delete one to save a new one, or upgrade to Pro for unlimited saves."
- Don't save the 4th session

### Save UI

After a session completes (or when the user taps a "Save" button in the player):

```
┌────────────────────────────────┐
│  Save Session                  │
│                                │
│  Name: [Theta Evening Wind-   │  ← Text input with auto-generated name
│          down                ] │
│                                │
│  [ Cancel ]  [ Save ✓ ]       │
└────────────────────────────────┘
```

Auto-generated name format: `"{State} {TimeOfDay} Session"` — e.g. "Theta Evening Session", "Alpha Morning Session".

### Saved Sessions List

Add a "My Sessions" section at the top of the Mix builder (above the step-by-step builder), visible only when saved sessions exist:

```
My Sessions (2/3)                    │ ← count / limit

┌────────────────────────┐ ┌────────────────────────┐
│ Theta Evening          │ │ Alpha Morning          │
│ 🧠 Dream · 5.5 Hz     │ │ 🧠 Calm Focus · 9 Hz  │
│ 🎵 Earth · 136.1 Hz   │ │ 🎵 Concert · 220 Hz   │
│ 🌧️ Rain               │ │ 🌊 Ocean + 🍃 Forest  │
│ 25 min                 │ │ 15 min                 │
│                        │ │                        │
│ [ ▶️ Play ] [ 🗑️ ]     │ │ [ ▶️ Play ] [ 🗑️ ]     │
└────────────────────────┘ └────────────────────────┘
```

- Horizontal scrollable row of saved session cards
- Each card shows: name, state, carrier, ambient layers, duration
- Play button: loads the session config and starts playback immediately
- Delete button: confirmation toast then removes from localStorage
- Tapping the card (not buttons) loads the session into the builder for editing

---

## 10. Audio Engine Extensions

### Extend `src/lib/audio-engine.ts`

Add these capabilities to the existing engine:

**1. Multiple simultaneous ambient layers:**

The Phase 1 engine may only support a single ambient layer. Extend the `ambientLayers` Map to properly support multiple concurrent layers, each with independent gain and source nodes.

```typescript
// Ensure these work correctly with multiple layers:
startAmbientLayer(id: string, volume: number): void;
stopAmbientLayer(id: string): void;
setAmbientVolume(id: string, volume: number): void;
stopAllAmbientLayers(): void;
```

**2. Tone preview method:**

```typescript
// Play a brief preview tone (for carrier selection UI)
async previewTone(frequency: number, duration?: number): Promise<void> {
  // duration default: 500ms
  // Create a temporary oscillator, quick fade in (50ms), sustain, quick fade out (100ms)
  // Don't interfere with currently playing session
  // Use a separate gain node connected directly to destination
}
```

**3. Smooth frequency ramp over time:**

```typescript
// Ramp carrier frequency smoothly over a duration (for timeline transitions)
rampCarrierFrequency(
  targetLeft: number,
  targetRight: number, 
  durationSeconds: number
): void {
  const now = this.ctx!.currentTime;
  this.carrierLeft?.frequency.linearRampToValueAtTime(targetLeft, now + durationSeconds);
  this.carrierRight?.frequency.linearRampToValueAtTime(targetRight, now + durationSeconds);
}
```

---

## 11. Updated Mini Player

The MiniPlayer should work with Mix sessions too. When a Mix session is playing and the user navigates back to the builder:

```
┌──────────────────────────────────┐
│ ●  Calm Focus · Ease In  08:42  ⏸️ ⏹️ │
│ ██████████░░░░░░░░░░░░░░░░░░░░  │
└──────────────────────────────────┘
```

- Shows the brainwave state name
- Shows the current phase (Ease In / Deep / Ease Out)
- Shows elapsed time
- Tapping re-opens the Mix Player

---

## 12. File Structure (new files)

```
src/
├── components/
│   ├── mix/
│   │   ├── MixBuilder.tsx         # Main container for Moderate mode
│   │   ├── StateSelector.tsx      # Brainwave state grid
│   │   ├── CarrierSelector.tsx    # Carrier frequency grid
│   │   ├── AmbientMixer.tsx       # Multi-layer ambient selector with volume controls
│   │   ├── TimelineBuilder.tsx    # 3-phase timeline with duration sliders
│   │   ├── SessionSummary.tsx     # Live summary card
│   │   ├── MixPlayer.tsx          # Player view for mix sessions
│   │   ├── SaveSessionModal.tsx   # Save session dialog
│   │   └── SavedSessionsList.tsx  # Horizontal scrollable saved sessions
│   └── ... (existing Phase 1 components)
├── lib/
│   ├── session-timeline.ts        # TimelineRunner for phase transitions
│   ├── session-storage.ts         # Save/load sessions to localStorage
│   ├── carrier-tones.ts           # Carrier tone definitions
│   ├── brainwave-states.ts        # Brainwave state definitions
│   └── ... (existing Phase 1 libs)
└── types/
    └── index.ts                   # Add SavedSession, TimelinePhase, etc.
```

---

## 13. Testing Checklist

### Mode Switching
- [ ] Tapping "Mix" switches to Moderate mode
- [ ] Tapping "Listen" switches back to Easy mode
- [ ] Audio continues playing when switching modes
- [ ] MiniPlayer shows correctly in both modes

### State Selector
- [ ] All 7 states render correctly
- [ ] Single selection works (selecting one deselects previous)
- [ ] Selected card has correct accent colour and glow
- [ ] Default selection is "Calm Focus"

### Carrier Selector
- [ ] All 7 free carriers render correctly
- [ ] "Custom" shows lock icon and Pro toast on tap
- [ ] Tapping a carrier plays a brief preview tone
- [ ] Preview tone doesn't interrupt currently playing session
- [ ] Selected card has correct styling

### Ambient Mixer
- [ ] All 8 ambient options render as toggleable pills
- [ ] Multiple layers can be selected simultaneously
- [ ] Individual volume sliders appear for active layers
- [ ] Volume changes are reflected in audio immediately
- [ ] 3rd layer selection is blocked with Pro upsell toast
- [ ] Deselecting a layer stops its audio and removes its slider

### Timeline Builder
- [ ] 3 phase sliders render with correct defaults
- [ ] Adjusting sliders updates the visual timeline bar
- [ ] Quick presets distribute time correctly
- [ ] Total duration updates in real time
- [ ] Minimum and maximum values are enforced

### Session Summary
- [ ] Updates in real time as selections change
- [ ] Shows correct frequency calculations (left ear, right ear, beat)
- [ ] All selected options are reflected

### Playback
- [ ] "Start Session" validates selections and starts playback
- [ ] Ease In phase: beat frequency ramps from 10 Hz to target smoothly
- [ ] Deep phase: beat frequency sustains at target
- [ ] Ease Out phase: beat frequency ramps from target back to 10 Hz smoothly
- [ ] Phase indicator shows correct current phase
- [ ] Phase progress bar updates correctly
- [ ] Session completes at total duration with completion chime
- [ ] Ambient layers play throughout the session
- [ ] Volume control works during mix playback

### Saving
- [ ] Save modal appears with auto-generated name
- [ ] Session saves to localStorage correctly
- [ ] Saved sessions appear in "My Sessions" list
- [ ] Playing a saved session works
- [ ] Deleting a saved session works
- [ ] 4th save attempt is blocked with limit message
- [ ] Session count shows correctly (e.g. "2/3")

### Audio Engine Extensions
- [ ] Multiple ambient layers play simultaneously without issues
- [ ] Tone preview plays and doesn't interfere with active session
- [ ] Frequency ramps are smooth with no clicks or pops
- [ ] All existing Easy mode functionality still works (no regressions)

---

## 14. What NOT to Build in Phase 2

- ❌ Advanced mode (Create) — still "Coming soon"
- ❌ LemonSqueezy / Pro purchase flow (just show toasts for Pro features)
- ❌ Phone sensor integration
- ❌ Session export
- ❌ Preset sharing
- ❌ Custom carrier frequency input (just the locked "Custom" card)
- ❌ Per-layer EQ on ambient layers
- ❌ Promo page
- ❌ Settings page

Focus on making the Mix builder intuitive, the timeline transitions silky smooth, and the save/load system reliable.
