# Binara — Product Specification

> The Ultimate Binaural Beats Playground
> binara.app · Part of the Harmonic Waves Ecosystem
> Version 1.0 · February 2026

---

## 1. Vision

Binara is a mobile-first web app that lets anyone create, customise, and experience binaural beats — from complete beginners tapping a preset to advanced practitioners sculpting multi-layered frequency journeys with phone sensor interaction.

No other binaural beats tool combines a beginner-friendly preset library, a modular beat builder, AND a full synthesis playground with device sensor integration — all in the browser, no install required.

**One sentence:** The instrument that lets you play your own brain.

---

## 2. Target Audience

**Primary:**
- Sound healing practitioners who use binaural beats in sessions
- Meditation and mindfulness practitioners
- Frequency/vibration therapy enthusiasts
- Biohackers and focus optimisers

**Secondary:**
- People seeking help with sleep, anxiety, focus, or pain
- Music producers exploring brainwave entrainment
- Curious newcomers who've heard of binaural beats but never tried creating their own

---

## 3. Three-Tier Experience Model

The app has three distinct modes, each unlocking more control. The user selects their mode from a prominent switcher at the top of the app. They can move between modes freely (within their plan limits).

### 3.1 EASY MODE — "Listen"

**Purpose:** Zero learning curve. Tap and listen. Perfect for newcomers and casual users.

**UX:** A grid of beautifully designed preset cards. Each card has a name, icon, short description, and estimated session time. Tap to play. That's it.

**Preset Categories:**

| Category | Presets |
|----------|---------|
| 🧠 Focus | Deep Focus, Study Flow, Creative Spark, Problem Solving |
| 😴 Sleep | Fall Asleep, Deep Sleep, Power Nap (20min), Insomnia Relief |
| 🧘 Meditation | Mindfulness, Transcendental, Loving Kindness, Body Scan |
| 😌 Relaxation | Stress Relief, Anxiety Calm, Tension Release, Wind Down |
| ⚡ Energy | Morning Boost, Afternoon Revival, Pre-Workout, Confidence |
| 🎯 Therapy | Pain Relief, Headache Ease, Tinnitus Mask, ADHD Focus |

**Each preset contains:**
- Pre-configured carrier frequency (left ear)
- Pre-configured beat frequency (difference between ears)
- Brainwave target (delta/theta/alpha/beta/gamma)
- Session duration (adjustable: 5, 10, 15, 20, 30, 60 min)
- Optional ambient layer (rain, ocean, bowls, white noise — selectable)
- Fade in/out curve (gentle 30s ramps)

**Player UI (when a preset is playing):**
- Large circular visualiser showing the beat frequency as a pulsing ring
- Brainwave state label (e.g. "Theta · 6 Hz · Deep Relaxation")
- Session timer with progress ring
- Volume slider
- Ambient layer selector (4 options + off)
- Pause / Stop buttons
- "How it works" expandable info explaining what this preset does to your brain

**Free tier:** All presets available. This is the hook — fully functional, no paywall on Easy mode.

---

### 3.2 MODERATE MODE — "Mix"

**Purpose:** Build your own beats using modular blocks. No frequency knowledge needed — everything is labelled by effect, not numbers.

**UX:** A vertical builder interface. The user assembles a session by choosing blocks from categories, then customising each block's intensity and duration.

**Building Blocks:**

**Step 1 — Choose Your State:**
A single-select grid of brainwave targets:
| State | Frequency Range | Description |
|-------|----------------|-------------|
| Deep Sleep | Delta 0.5–4 Hz | Dreamless sleep, deep restoration |
| Dream State | Theta 4–8 Hz | REM sleep, vivid dreams, deep meditation |
| Calm Focus | Low Alpha 8–10 Hz | Relaxed awareness, light meditation |
| Flow State | High Alpha 10–12 Hz | Creative flow, effortless focus |
| Active Focus | Low Beta 12–20 Hz | Concentration, problem solving, study |
| High Performance | High Beta 20–30 Hz | Intense focus, peak mental performance |
| Insight | Gamma 30–50 Hz | Heightened perception, information processing |

**Step 2 — Choose Your Carrier:**
The base tone frequency. Presented as named options, not raw numbers:
| Option | Frequency | Description |
|--------|-----------|-------------|
| Earth Tone | 136.1 Hz | OM frequency, grounding |
| Warm Bass | 180 Hz | Rich, warm foundation |
| Verdi Tuning | 216 Hz | Half of 432 Hz, natural resonance |
| Heart Centre | 256 Hz | C4, clear and balanced |
| Solfeggio Love | 264 Hz | Based on 528 Hz harmonic |
| Concert Base | 220 Hz | A3, standard tuning reference |
| Crystal Clear | 320 Hz | Bright, clear, present |
| Custom | User-defined | Pro only |

**Step 3 — Add Ambient Layers (optional, multi-select):**
| Layer | Description |
|-------|-------------|
| 🌧️ Rain | Gentle rainfall |
| 🌊 Ocean | Rolling waves |
| 🎵 Singing Bowls | Tibetan bowl drones |
| 🍃 Forest | Birds, breeze, rustling leaves |
| 🔥 Fireplace | Crackling fire |
| ☁️ White Noise | Flat spectrum masking |
| 🌸 Pink Noise | Warmer, natural masking |
| 🟫 Brown Noise | Deep, rumbling masking |

Each layer has its own volume slider (0–100%).

**Step 4 — Session Timeline:**
A simple 3-phase timeline:
| Phase | Purpose | Default Duration |
|-------|---------|-----------------|
| Ease In | Gradual transition from waking state | 3 min |
| Deep | Main session at target frequency | Adjustable (5–60 min) |
| Ease Out | Gentle return to waking state | 2 min |

The "Ease In" phase starts at Alpha (10 Hz) and transitions down/up to the target state over its duration. "Ease Out" reverses this. The user can adjust durations with sliders.

**Step 5 — Play:**
Same player UI as Easy mode, but with additional displays:
- Real-time frequency readout (left ear / right ear / beat frequency)
- Phase indicator showing current timeline position (Ease In → Deep → Ease Out)
- Layer mixer showing active ambient layers with individual volume controls

**Free tier limits:**
- 3 saved custom sessions (unlimited for Pro)
- No custom carrier frequency
- Maximum 2 ambient layers simultaneously (unlimited for Pro)
- No session export

---

### 3.3 ADVANCED MODE — "Create"

**Purpose:** Full synthesis playground. Complete control over every parameter. This is for practitioners, producers, and power users.

**UX:** A professional-looking control surface with multiple expandable panels. Think audio workstation meets meditation app.

**Parameters Available:**

**Core Oscillators:**
| Parameter | Range | Description |
|-----------|-------|-------------|
| Left Carrier Frequency | 20–1500 Hz | Base tone in left ear |
| Right Carrier Frequency | 20–1500 Hz | Base tone in right ear (beat = difference) |
| Beat Frequency | 0.5–50 Hz | Auto-calculated from L/R difference |
| Waveform | Sine, Triangle, Sawtooth, Square | Oscillator shape |
| Carrier Volume | 0–100% | Master carrier level |

**Stereo Field:**
| Parameter | Range | Description |
|-----------|-------|-------------|
| Stereo Width | 0–100% | How separated the L/R channels feel |
| Stereo Pan | -100 to +100 | Shift the stereo image |
| Crossfeed | 0–50% | Blend of opposite channel (reduces isolation) |
| Spatial Rotation | Off / Slow / Medium / Fast | Auto-panning effect (circular motion) |
| Rotation Speed | 0.01–2 Hz | Speed of spatial rotation |

**Depth & Texture:**
| Parameter | Range | Description |
|-----------|-------|-------------|
| Harmonic Richness | 0–100% | Add overtones above the carrier |
| Sub-Harmonic | Off / -1 oct / -2 oct | Add sub-bass layer below carrier |
| Chorus Depth | 0–100% | Thicken the tone with slight detuning |
| Reverb | 0–100% | Spaciousness / room size |
| Reverb Decay | 0.5–10s | How long reverb tail lasts |
| Filter Type | None / Low Pass / High Pass / Band Pass | Shape the tone colour |
| Filter Cutoff | 20–20000 Hz | Where the filter acts |
| Filter Resonance | 0–100% | Emphasis at cutoff point |

**Modulation (LFO):**
| Parameter | Range | Description |
|-----------|-------|-------------|
| LFO Target | Volume / Pitch / Filter / Pan | What the LFO modulates |
| LFO Rate | 0.01–10 Hz | Speed of modulation |
| LFO Depth | 0–100% | Intensity of modulation |
| LFO Shape | Sine / Triangle / Square / Random | Modulation waveform |

**Isochronic Tones (optional layer):**
| Parameter | Range | Description |
|-----------|-------|-------------|
| Enabled | On / Off | Add isochronic pulses |
| Pulse Frequency | 0.5–50 Hz | Rate of on/off pulsing |
| Pulse Shape | Sharp / Soft / Ramp | How the pulse fades in/out |
| Pulse Volume | 0–100% | Level of isochronic layer |
| Pulse Tone | 200–2000 Hz | Frequency of the pulsed tone |

**Multi-Layer Beat Stacking:**
Up to 4 simultaneous binaural beat layers, each with independent:
- Carrier frequency
- Beat frequency
- Volume
- Waveform

This allows complex entrainment patterns, e.g.:
- Layer 1: Theta (6 Hz) for meditation base
- Layer 2: Alpha (10 Hz) for relaxed awareness
- Layer 3: Gamma (40 Hz) for heightened perception
- Layer 4: Sub-delta (0.5 Hz) for deep body relaxation

**Timeline Editor:**
A visual timeline (horizontal) where the user can:
- Add multiple phases (unlimited)
- Set target frequency for each phase
- Set transition curve between phases (linear, ease-in, ease-out, S-curve)
- Set duration for each phase
- Preview the frequency journey as a graph

Example session:
```
[Alpha 10Hz, 3min] → ease-in → [Theta 6Hz, 15min] → linear → [Delta 2Hz, 10min] → ease-out → [Alpha 10Hz, 2min]
```

**Ambient Layers:**
Same as Moderate mode but with additional controls:
- Per-layer EQ (bass/mid/treble)
- Per-layer reverb send
- Per-layer volume envelope (fade in/out independently)

**Free tier limits:**
- 1 saved session (unlimited for Pro)
- 1 beat layer only (4 layers for Pro)
- No isochronic tones (Pro only)
- No timeline editor (Pro only — single phase only)
- No export
- No LFO modulation (Pro only)
- Basic stereo only — no rotation, crossfeed, or spatial effects (Pro only)

---

## 4. Phone Sensor Integration (Pro Feature)

**This is the killer feature that no competitor has.** The user's phone becomes a physical controller for the sound.

### 4.1 Tilt Control (DeviceOrientation API)
- **Pitch (forward/back tilt):** Maps to beat frequency. Tilt forward = frequency increases (more alert). Tilt back = frequency decreases (deeper relaxation).
- **Roll (left/right tilt):** Maps to stereo field width. Tilt left = narrow/mono. Tilt right = wide stereo.
- **Sensitivity slider:** User adjusts how responsive the tilt mapping is.
- **Range lock:** User sets min/max frequency bounds so tilting can't go outside a safe range.

### 4.2 Motion Intensity (DeviceMotion API - Accelerometer)
- Detect stillness vs movement
- When the phone is completely still (placed on chest/mat): sound enters a "deep" mode — lower frequencies, slower modulation, expanded reverb
- When the phone detects gentle rhythmic motion (breathing on chest): sync LFO rate to detected breath rhythm
- Threshold: configurable sensitivity so small hand tremors don't trigger changes

### 4.3 Proximity Sensor (where available)
- Phone face-down: automatically dims screen to black (OLED battery save) and enters "session mode" — disables touch to prevent accidental stops
- Phone face-up: normal interactive mode

### 4.4 Sensor Dashboard
When sensor mode is active, show a real-time display:
- Phone orientation visualised as a 3D phone icon
- Current tilt values mapped to frequency/stereo
- Breath detection indicator (if motion tracking is active)
- "Sensor Active" badge with option to disable

### 4.5 Technical Notes
- Use the Web DeviceOrientation API and DeviceMotion API
- iOS requires explicit permission request (must be triggered by user gesture)
- Provide graceful fallback — if sensors unavailable, hide the feature entirely
- All sensor features are Pro only

---

## 5. Monetisation

### Pricing Model: Freemium + One-Time Purchase

| | Free | Pro ($7.99 one-time) |
|---|---|---|
| Easy Mode (all presets) | ✅ Full access | ✅ Full access |
| Moderate Mode | 3 saved sessions, 2 ambient layers, no custom carrier | Unlimited saves, unlimited layers, custom carrier |
| Advanced Mode | 1 save, 1 beat layer, no LFO/isochronic/timeline/spatial | Full access to everything |
| Phone Sensors | ❌ | ✅ |
| Session Export (WAV/MP3) | ❌ | ✅ |
| Preset Sharing (URL) | ❌ | ✅ |
| Remove "Made with Binara" watermark on exports | ❌ | ✅ |

### Payment Provider: LemonSqueezy
- Same setup as Overtone Singer Pro
- One-time payment, no subscription
- Activation via licence key stored in localStorage
- Verification on app load (with offline grace period)

### Why one-time, not subscription:
- Matches your ecosystem pricing (Overtone Singer Pro is $6.99)
- Lower friction for impulse purchases
- The tool doesn't require ongoing server costs (all client-side)
- Users in the wellness space are wary of subscriptions

**Price point: $7.99** — slightly above Overtone Singer because the feature set is significantly deeper. Still impulse-buy territory.

---

## 6. Technical Architecture

### Stack
| Technology | Purpose |
|------------|---------|
| Next.js 15+ | Framework (App Router) |
| React 19 | UI |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| Web Audio API | All audio synthesis (oscillators, gain, panning, filters, LFO) |
| DeviceOrientation API | Tilt control |
| DeviceMotion API | Motion/breath detection |
| Framer Motion | UI animations |
| LemonSqueezy | Payment processing |
| Plausible | Privacy-friendly analytics |
| Vercel | Hosting |
| GitHub Pages | Fallback/secondary |

### Audio Architecture

All audio runs client-side via Web Audio API. No audio files are loaded or streamed — everything is synthesised in real time.

```
AudioContext
├── Carrier Oscillator (Left)
│   └── GainNode → StereoPannerNode (left)
├── Carrier Oscillator (Right)  
│   └── GainNode → StereoPannerNode (right)
├── Sub-Harmonic Oscillator (optional)
│   └── GainNode
├── Isochronic Tone Oscillator (optional)
│   └── GainNode (pulsed by LFO)
├── Ambient Layer(s)
│   └── AudioBufferSourceNode → GainNode → BiquadFilterNode
├── LFO Oscillator
│   └── GainNode → connected to target param
├── Master Chain
│   ├── ConvolverNode (reverb)
│   ├── DynamicsCompressorNode (limiter)
│   └── GainNode (master volume, capped at safe level)
└── AudioDestination
```

**Safety:**
- Master gain hard-capped at 0.3 (30%) to prevent hearing damage
- Fade in/out on all play/stop actions (minimum 500ms ramp)
- Warning displayed when headphones not detected (binaural beats require headphones)

### Data Architecture

All data stored in localStorage:
```
binara_sessions: [{
  id: string,
  name: string,
  mode: 'easy' | 'moderate' | 'advanced',
  created: ISO date,
  config: { ... mode-specific parameters }
}]

binara_pro: {
  licenceKey: string,
  activatedAt: ISO date,
  verified: boolean
}

binara_preferences: {
  defaultDuration: number,
  defaultAmbient: string | null,
  sensorSensitivity: number,
  theme: 'dark' // dark only
}
```

### PWA Configuration
- Service worker for offline capability
- Web App Manifest for "Add to Home Screen"
- Full-screen display mode (no browser chrome)
- Orientation: portrait locked
- Theme colour: #050810 (matching Harmonic Waves ecosystem)

---

## 7. Visual Design

### Aesthetic Direction

**"Neural Depths"** — A fusion of the deep-ocean Harmonic Waves aesthetic with synaptic/neural imagery. Dark, bioluminescent, but with electric pulses and neural pathway motifs.

### Colour Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Abyss | `#050810` | Base background |
| Deep | `#0a1628` | Secondary background |
| Neural | `#0c1832` | Card backgrounds |
| Synapse | `#132640` | Tertiary |
| Pulse Cyan | `#4fc3f7` | Primary accent (matches ecosystem) |
| Pulse Violet | `#7986cb` | Secondary accent |
| Pulse Amber | `#ffab40` | Warm accent / warnings |
| Pulse Green | `#66bb6a` | Success / active states |
| Text Primary | `rgba(255,255,255,0.85)` | Main text |
| Text Secondary | `rgba(255,255,255,0.60)` | Labels, descriptions |
| Text Muted | `rgba(255,255,255,0.35)` | Hints, disabled |

### Mode Colours
Each mode has a subtle colour identity:
- **Easy:** Cyan `#4fc3f7` — calm, approachable
- **Moderate:** Amber `#ffab40` — creative, building
- **Advanced:** Violet `#7986cb` — deep, complex

### Typography
| Role | Font | Usage |
|------|------|-------|
| Display | Playfair Display | App title, section headings |
| Body | Inter | Body text, descriptions, UI |
| Data | JetBrains Mono | Frequencies, values, labels |

### Glass System
Same as Tide Resonance and Earth Pulse:
- Background: `rgba(255,255,255,0.03)`
- Border: `rgba(255,255,255,0.06)`
- Backdrop filter: `blur(20px)`
- Dark mode only

### Key Visual Elements
- **Beat Visualiser:** Concentric pulsing rings that expand at the beat frequency rate. Colour matches brainwave state (delta=deep blue, theta=indigo, alpha=cyan, beta=amber, gamma=violet).
- **Frequency Spectrum:** Thin horizontal bar showing where the carrier frequency sits in the audible range.
- **Timeline View:** Horizontal gradient bar showing the session journey from start to finish with phase markers.
- **Sensor Visualiser:** 3D phone icon that mirrors device orientation in real time.

### Animations
- All UI transitions: 300ms ease-out
- Beat visualiser: requestAnimationFrame driven, synced to actual audio
- Mode switcher: smooth morph between layouts
- Card entries: staggered spring animation (Framer Motion)
- `prefers-reduced-motion`: all animations disabled

---

## 8. Information Architecture

```
binara.app/
├── / .......................... Main app (3-mode interface)
│   ├── Easy mode ............. Preset grid + player
│   ├── Moderate mode ......... Block builder + player  
│   └── Advanced mode ......... Full control surface + player
├── /promo .................... Hidden content studio (for you)
└── (no other routes — single page app)
```

### App Shell Layout (mobile-first)

```
┌─────────────────────────┐
│  Binara        ⚙️  PRO  │  ← Header: logo, settings, pro badge
├─────────────────────────┤
│  [Easy] [Mix] [Create]  │  ← Mode switcher (3 pills)
├─────────────────────────┤
│                         │
│     Mode-specific       │
│     content area        │  ← Scrollable content
│                         │
│                         │
├─────────────────────────┤
│   advancement ▶️ advancement ⏸️  │  ← Persistent mini player (when audio playing)
│  Theta 6Hz · 12:34      │     Shows state, timer, play/pause
└─────────────────────────┘
```

The mini player sticks to the bottom when audio is active, so the user can switch modes or browse presets while listening.

---

## 9. Onboarding

### Welcome Flow (first visit)

**Screen 1:** 
```
B I N A R A
The Binaural Beats Playground

🎧 Headphones Required
Binaural beats only work with headphones.
Each ear receives a slightly different frequency,
and your brain perceives the difference as a beat.

[I'm wearing headphones →]
```

**Screen 2:**
```
Choose your experience:

[🎵 Listen]        ← Easy mode
Tap a preset and relax

[🎛️ Mix]           ← Moderate mode  
Build your own session from blocks

[⚡ Create]        ← Advanced mode
Full control over every parameter

(You can switch anytime)
```

**Screen 3:** Launches directly into chosen mode.

One-time display, stored in localStorage. "Skip" option available.

---

## 10. Headphone Detection

Critical UX feature — binaural beats don't work without headphones.

### Detection Method
Use the `navigator.mediaDevices.enumerateDevices()` API to check for audio output devices. If only speakers are detected (no headphones/earbuds), show a persistent but dismissible banner:

```
🎧 Headphones recommended — binaural beats require separate audio in each ear to work
```

### Fallback
If the API is unavailable or permission denied, show the banner once per session and let the user dismiss it. Don't block usage.

---

## 11. Session Export (Pro)

Users can export their creation as an audio file:
- **Format:** WAV (lossless) or MP3 (compressed)
- **Method:** Use OfflineAudioContext to render the full session at high speed, then encode to chosen format
- **Duration:** Full session length as configured
- **Metadata:** Embed session name and "Made with Binara" tag
- **Download:** Trigger browser download of the file
- **Free tier:** Export blocked, shows Pro upgrade prompt

---

## 12. Preset Sharing (Pro)

Users can share their creations via URL:
- Session config encoded as base64 in URL hash: `binara.app/#s=eyJ...`
- Recipient opens the URL → session loads automatically
- If recipient is on Free tier, they can play the shared session but not save or modify Advanced features
- Sharing button generates a copy-able link

---

## 13. SEO & Discovery

### Meta Tags
```
Title: Binara — Binaural Beats Playground
Description: Create custom binaural beats for focus, sleep, meditation, and healing. Free presets, modular beat builder, and advanced synthesis with phone sensor control.
Keywords: binaural beats, binaural beats generator, focus music, sleep sounds, meditation, brainwave entrainment, theta waves, alpha waves
```

### Target Search Queries
- "binaural beats generator"
- "custom binaural beats"
- "binaural beats for sleep"
- "binaural beats for focus"
- "binaural beats app"
- "theta wave generator"
- "alpha wave music"
- "brainwave entrainment tool"

---

## 14. Analytics Events (Plausible)

| Event | Properties |
|-------|------------|
| `mode_switch` | `mode: easy/moderate/advanced` |
| `preset_play` | `preset: name, category: name` |
| `session_start` | `mode, duration, beat_frequency` |
| `session_complete` | `mode, duration, completed: boolean` |
| `pro_upgrade_click` | `trigger: feature_name` |
| `pro_activated` | — |
| `sensor_enabled` | `type: tilt/motion/proximity` |
| `session_exported` | `format: wav/mp3, duration` |
| `session_shared` | `mode` |

---

## 15. Future Roadmap (Post-V1)

These are NOT part of V1 but worth noting for future development:

- **Community Presets:** Users share and discover presets in a public gallery
- **Session History:** Track which presets/frequencies the user has used and for how long
- **Sleep Timer:** Auto-stop after user falls asleep (detect phone stillness)
- **Apple Watch / Wearable:** Heart rate → frequency mapping
- **AI Recommendations:** "Based on the time of day and your usage patterns, try this..."
- **Tidal Integration:** Pull current tidal phase from Tide Resonance and suggest frequency alignment
- **Earth Pulse Integration:** Pull current Kp and suggest session type based on geomagnetic activity
- **Guided Sessions:** Voice-guided meditations with binaural beats underneath
- **Binaural ASMR:** Combine binaural beats with spatial audio triggers

---

## 16. V1 Build Priority

Build in this order:

### Phase 1: Core Audio Engine + Easy Mode
1. Project scaffold (Next.js, Tailwind, PWA config)
2. Web Audio engine (carrier oscillators, beat frequency, gain, fade)
3. Easy mode preset grid with all 24 presets
4. Player UI with visualiser, timer, volume
5. Ambient layer system (8 layers with mixing)
6. Headphone detection
7. Onboarding flow

### Phase 2: Moderate Mode
8. Block builder UI (state → carrier → ambient → timeline)
9. 3-phase timeline (ease in → deep → ease out)
10. Session save/load (localStorage)
11. Free tier limits enforcement

### Phase 3: Advanced Mode
12. Full parameter control surface
13. Multi-layer beat stacking (4 layers)
14. Stereo field controls
15. LFO modulation system
16. Isochronic tone generator
17. Timeline editor (multi-phase)
18. Filter system

### Phase 4: Pro Features
19. LemonSqueezy integration
20. Phone sensor integration (tilt, motion, proximity)
21. Session export (WAV/MP3)
22. Preset sharing via URL
23. Pro gate enforcement across all modes

### Phase 5: Polish
24. Promo page (/promo) — content studio for social media
25. Plausible analytics integration
26. PWA optimisation
27. Performance tuning
28. Cross-browser testing (especially iOS Safari Web Audio quirks)

---

## 17. Technical Notes & Gotchas

### Web Audio on iOS Safari
- AudioContext must be created/resumed from a user gesture (tap)
- The onboarding "I'm wearing headphones" button should also call `audioContext.resume()`
- iOS Safari has historically been buggy with Web Audio — test thoroughly
- Use `webkit` prefixed APIs where needed

### DeviceOrientation on iOS
- Requires explicit `DeviceOrientationEvent.requestPermission()` call
- Must be triggered by a user gesture (button tap)
- Permission may be denied — always provide fallback

### Offline Audio Export
- `OfflineAudioContext` renders audio at maximum speed (not real-time)
- For MP3 encoding, use a library like `lamejs` (runs in Web Worker to avoid blocking UI)
- WAV encoding is straightforward — just write PCM data with headers

### Performance
- Limit `requestAnimationFrame` visualisations to 30fps on mobile
- Use `AudioWorklet` if available for custom processing (fallback to ScriptProcessorNode)
- Lazy-load Advanced mode components — most users won't need them immediately

### Privacy
- No user data leaves the device
- No accounts, no server-side storage
- Plausible analytics only (privacy-friendly, no cookies)
- LemonSqueezy handles payment — we never see card details
