# BINARA — Phase 3: Sacred Geometry, Haptic Sync, Guided Breathing & Daily Recommendation

## Implement in this order: Daily Recommendation first (quickest win), then Haptic Vibration, then Guided Breathing, then Sacred Geometry (most complex, do last with full attention).

---

## 1. Daily Recommended Session

### Why First
Lowest effort, highest retention impact. Users open the app → see a personalised suggestion → start a session. Builds daily habit without push notifications.

### Time-Based Recommendations

| Time Window | Brainwave | Recommended Preset | Label |
|-------------|-----------|-------------------|-------|
| 6:00–10:00 | Alpha/Beta | Study Flow or Morning Calm | "Good morning — ease into focus" |
| 10:00–14:00 | Beta/Gamma | Deep Focus or Problem Solving | "Peak hours — deep work mode" |
| 14:00–18:00 | Alpha | Creative Spark or Mindfulness | "Afternoon — creative recharge" |
| 18:00–22:00 | Theta/Alpha | Body Scan or Stress Relief | "Evening — wind down" |
| 22:00–6:00 | Delta | Fall Asleep or Deep Sleep | "Night — drift into sleep" |

### UI

Featured card at the TOP of the Listen tab, above the category filter and preset grid:

```
┌──────────────────────────────────────────────────┐
│  ✦ Recommended for this evening                  │
│                                                  │
│  Body Scan                                       │
│  Theta · 6 Hz · 30 min                          │
│                                                  │
│  Deep somatic awareness                          │
│                         ▶ Start Session          │
└──────────────────────────────────────────────────┘
```

- Full-width card, spans both grid columns
- Slightly different visual treatment from regular cards — subtle gradient border using the recommended brainwave colour, slightly taller
- Small star/sparkle icon with "Recommended for this [time of day]" label
- Preset name, frequency info, description
- Direct "Start Session" button (tapping anywhere on the card also works)
- Waveform signature from the card redesign if implemented
- Dismissible — small × in the corner to hide it for the current session (comes back next app open)

### Randomisation
- If multiple presets match the time window, pick one randomly each day
- Use the current date as the seed so the recommendation is consistent throughout the day (doesn't change on refresh)

```typescript
function getDailyRecommendation(): Preset {
  const hour = new Date().getHours();
  const dateKey = new Date().toISOString().split('T')[0]; // "2026-02-26"
  
  let candidates: Preset[];
  if (hour >= 6 && hour < 10) candidates = [...morningPresets];
  else if (hour >= 10 && hour < 14) candidates = [...focusPresets];
  else if (hour >= 14 && hour < 18) candidates = [...afternoonPresets];
  else if (hour >= 18 && hour < 22) candidates = [...eveningPresets];
  else candidates = [...sleepPresets];
  
  // Deterministic pick based on date
  const hash = dateKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return candidates[hash % candidates.length];
}
```

### Test Checklist
- [ ] Recommendation card appears at top of Listen tab
- [ ] Correct preset for time of day (morning=focus, evening=wind down, night=sleep)
- [ ] Tapping the card opens the session
- [ ] Same recommendation stays consistent all day (doesn't change on refresh)
- [ ] Different recommendation tomorrow
- [ ] × dismiss hides it for the current browser session
- [ ] Comes back on next app open
- [ ] Card style is visually distinct from regular preset cards
- [ ] Card works correctly across all category filters (always visible, not filtered out)

---

## 2. Haptic Vibration Sync (Android)

### Why
Physical vibration adds a tactile dimension. Combined with audio + motion sensors, Binara becomes multi-sensory. Simple to implement, unique differentiator.

### Browser Support
- ✅ Android Chrome — `navigator.vibrate()` supported
- ❌ iOS Safari — NOT supported, API does not exist
- Feature must be completely hidden on iOS and desktop — no toggle, no mention

### Implementation

```typescript
function isVibrationAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}
```

### Vibration Patterns

The vibration pulses at the binaural beat frequency. Since phone vibration motors are binary (on/off), we create rhythmic pulses:

```typescript
function startHapticSync(beatFreq: number, intensity: number) {
  // intensity: 0–1 (from user slider)
  // beatFreq: the current binaural beat frequency in Hz
  
  // Calculate pulse timing
  const periodMs = 1000 / beatFreq; // e.g. 4Hz = 250ms period
  const onMs = Math.max(10, periodMs * 0.3 * intensity); // vibrate for 30% of period
  const offMs = periodMs - onMs;
  
  // For very high frequencies (>20Hz), pulse at a sub-harmonic instead
  // Phone motors can't physically vibrate at 40Hz as distinct pulses
  let effectiveFreq = beatFreq;
  while (effectiveFreq > 15) effectiveFreq /= 2; // drop octaves until under 15Hz
  
  const effectivePeriod = 1000 / effectiveFreq;
  const effectiveOn = Math.max(10, effectivePeriod * 0.3 * intensity);
  const effectiveOff = effectivePeriod - effectiveOn;
  
  // Build a pattern array for 2 seconds, then repeat
  const patternDuration = 2000; // 2 second chunks
  const cycles = Math.floor(patternDuration / effectivePeriod);
  const pattern: number[] = [];
  for (let i = 0; i < cycles; i++) {
    pattern.push(effectiveOn, effectiveOff);
  }
  
  navigator.vibrate(pattern);
}
```

Repeat the pattern using a setInterval every 2 seconds. Stop with `navigator.vibrate(0)`.

### UI

**In session view, below Phone Sensors / Auto Motion toggle:**

```
📳 Haptic Pulse                    ○──
    Intensity  ━━━━━━━━━━━━━░░░░░░░
```

- Toggle on/off
- Intensity slider (subtle to strong) — only visible when toggled on
- Only renders on devices where `isVibrationAvailable()` returns true
- Completely hidden on iOS and desktop

**Integration with Session Phases:**
- During Ease In: haptic intensity gradually ramps up with the frequency
- During Deep Session: holds steady
- During Ease Out: gradually fades
- When sleep timer fade begins: haptic also fades to 0

**Auto-disable for sleep presets:**
- Haptic is OFF by default for sleep category presets
- User can still manually enable it if they want
- When the sleep timer fade starts, haptic stops regardless

### Test Checklist
- [ ] Haptic toggle only appears on Android Chrome
- [ ] Toggle does NOT appear on iOS Safari or desktop
- [ ] Enabling haptic starts vibration pulsing at the beat frequency
- [ ] Pulses feel rhythmic and aligned with the audio beat
- [ ] Intensity slider changes vibration strength
- [ ] Disabling haptic stops vibration immediately
- [ ] Haptic follows session phase transitions (ramps with ease-in/out)
- [ ] Haptic stops during sleep timer fade-out
- [ ] Haptic is OFF by default for sleep presets
- [ ] High beat frequencies (30Hz+) use sub-harmonic pulsing (not buzzing)
- [ ] Battery drain is acceptable (test 15-minute session)

---

## 3. Guided Breathing Overlay

### Concept
An expanding/contracting circle overlaid on the session view that guides the user's breathing rhythm. Optional, toggleable, works alongside audio and any visualisation.

### Breathing Patterns

```typescript
interface BreathingPattern {
  id: string;
  name: string;
  inhale: number;    // seconds
  hold1: number;     // hold after inhale (seconds, 0 = no hold)
  exhale: number;    // seconds
  hold2: number;     // hold after exhale (seconds, 0 = no hold)
}

const BREATHING_PATTERNS: BreathingPattern[] = [
  { id: 'relaxed',   name: 'Relaxed',      inhale: 4, hold1: 0, exhale: 6, hold2: 0 },
  { id: 'box',       name: 'Box Breathing', inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  { id: 'sleep478',  name: '4-7-8 Sleep',   inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
  { id: 'energise',  name: 'Energise',      inhale: 3, hold1: 0, exhale: 3, hold2: 0 },
  { id: 'deep',      name: 'Deep Calm',     inhale: 5, hold1: 2, exhale: 7, hold2: 2 },
];
```

### Visual — The Breathing Circle

A single circle centred on the session view:

**Inhale phase:**
- Circle expands smoothly from small (30% of container) to large (80% of container)
- Fill: radial gradient using the brainwave colour, very low opacity (0.05–0.1)
- Border: thin ring in the brainwave colour, opacity 0.3
- Text inside: "Breathe in" (fades in at start of inhale, fades out halfway)

**Hold phase:**
- Circle holds size
- Gentle pulse/glow animation on the border
- Text: "Hold" (if hold > 0 seconds)

**Exhale phase:**
- Circle contracts smoothly back to small
- Text: "Breathe out"

**Hold after exhale:**
- Circle holds at small size
- Text: "Hold"

**Animation easing:**
- Use ease-in-out for natural breathing feel — not linear
- Inhale starts slow, accelerates, then slows at the top
- Exhale starts slow, accelerates in the middle, slows at the bottom

```typescript
// Sinusoidal easing for natural breathing
function breathEase(t: number): number {
  return (1 - Math.cos(t * Math.PI)) / 2;
}
```

### UI Controls

**In session view, below the main controls:**

```
🫁 Guided Breathing                ○──
    Pattern: [ Relaxed ▾ ]
```

- Toggle on/off
- Dropdown to select breathing pattern (only visible when toggled on)
- Default pattern: "Relaxed" for meditation/relax presets, "Box Breathing" for focus presets, "4-7-8 Sleep" for sleep presets

**The breathing circle overlays the session view:**
- Positioned centrally, behind other UI elements (low z-index)
- Semi-transparent — doesn't obstruct the timer, phase indicator, or controls
- When combined with sacred geometry (Phase 3.4), the geometry breathes with the circle

### Integration with Session Phases

- During Ease In: breathing rate starts slightly faster and gradually slows to target
- During Deep Session: holds the selected pattern steady
- During Ease Out: breathing rate gradually slows further (winding down)
- Sleep timer fade: breathing circle fades out with the audio

### Test Checklist
- [ ] Breathing toggle appears in session controls
- [ ] Enabling shows the breathing circle overlay
- [ ] Circle expands on inhale, contracts on exhale, holds during holds
- [ ] "Breathe in" / "Hold" / "Breathe out" text displays at correct times
- [ ] All 5 breathing patterns work correctly
- [ ] Pattern selector changes the rhythm
- [ ] Default pattern matches preset category (sleep=4-7-8, focus=box)
- [ ] Circle animation is smooth, natural easing (not robotic/linear)
- [ ] Circle doesn't obstruct essential UI (timer, controls)
- [ ] Circle colour matches current brainwave state
- [ ] Breathing continues correctly with screen locked (timer-based, not animation-based)
- [ ] Disabling breathing removes the circle cleanly (fade out)

---

## 4. Sacred Geometry Visualisation

### Why This Is the Killer Feature
No binaural beats app has audio-reactive sacred geometry. This is the feature people will screenshot and share on TikTok and Instagram. Combined with motion sensors, haptics, and breathing — Binara becomes a full multi-sensory meditation experience.

### Geometry Types

Offer these geometries (start with the first two, add the rest over time):

| Geometry | Description | Complexity |
|----------|-------------|------------|
| **Flower of Life** | Overlapping circles in hexagonal pattern | Build first |
| **Metatron's Cube** | Lines connecting centres of Flower of Life | Build first |
| **Sri Yantra** | Interlocking triangles | Add later |
| **Torus** | 3D donut shape (requires WebGL/Three.js) | Add later |
| **Concentric Circles** | Simple expanding rings | Build first (fallback) |

Start with **Concentric Circles** (simplest, works as a fallback), **Flower of Life**, and **Metatron's Cube**.

### Audio-Reactive Behaviour

The geometry responds to the binaural beat in real-time:

**Beat frequency → breathing/pulsing:**
- The entire geometry scales slightly in and out at the beat frequency
- For low frequencies (Delta 1–4Hz): visible slow breathing, scale range 0.95–1.05
- For mid frequencies (Theta/Alpha 4–14Hz): gentle shimmer, scale range 0.98–1.02
- For high frequencies (Beta/Gamma 14Hz+): very subtle vibration, scale range 0.99–1.01
- Use the smoothed beat frequency from session phases (not static preset value)

**Brainwave state → colour:**
- Use the existing brainwave colour map (Delta=violet, Theta=lavender, Alpha=teal, Beta=gold, Gamma=coral)
- Geometry lines/strokes use the brainwave colour
- Background glow uses the brainwave glow colour
- During Ease In/Out: colours smoothly transition between states

**Ambient layer volume → particle effects:**
- If ambient layers are playing, emit subtle particle effects (tiny dots drifting outward)
- Particle intensity scales with ambient volume
- Particles use the brainwave colour at very low opacity
- No ambient = no particles (clean geometry only)

**Motion Sensors / Auto Motion → rotation:**
- If motion sensors or auto motion is active, the geometry slowly rotates with the motion data
- Gamma (left/right tilt) → geometry rotates around Y axis
- Beta (forward/back tilt) → geometry tilts on X axis
- Very slow, very subtle — max ±15 degrees rotation

**Guided Breathing → scale:**
- If breathing overlay is active, the geometry breathes WITH the breathing circle
- Inhale: geometry expands
- Exhale: geometry contracts
- This overrides the beat-frequency pulsing — breathing takes priority for scale

### Rendering

Use **HTML Canvas 2D** for the initial implementation (not WebGL). Reasons:
- Simpler, fewer dependencies
- Better battery life than WebGL
- Flower of Life and Metatron's Cube are 2D geometries
- Save WebGL for the Torus/3D geometries later

```typescript
// Core render loop
function renderGeometry(ctx: CanvasRenderingContext2D, state: GeometryState) {
  const { width, height } = ctx.canvas;
  const cx = width / 2;
  const cy = height / 2;
  const baseRadius = Math.min(width, height) * 0.35;
  
  // Apply breathing/beat pulse
  const radius = baseRadius * state.scale;
  
  // Apply rotation from motion sensors
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(state.rotation);
  
  // Clear
  ctx.clearRect(-cx, -cy, width, height);
  
  // Draw glow layer
  ctx.shadowBlur = 20 * state.glowIntensity;
  ctx.shadowColor = state.glowColour;
  
  // Draw geometry based on selected type
  switch (state.geometryType) {
    case 'circles': drawConcentricCircles(ctx, radius, state); break;
    case 'flower': drawFlowerOfLife(ctx, radius, state); break;
    case 'metatron': drawMetatronsCube(ctx, radius, state); break;
  }
  
  ctx.restore();
  
  // Draw particles if ambient is playing
  if (state.particleIntensity > 0) {
    drawParticles(ctx, cx, cy, state);
  }
}
```

### Flower of Life Construction

The Flower of Life is 7 overlapping circles (1 centre + 6 surrounding):

```typescript
function drawFlowerOfLife(ctx: CanvasRenderingContext2D, radius: number, state: GeometryState) {
  const r = radius / 3; // radius of each individual circle
  
  ctx.strokeStyle = state.colour;
  ctx.lineWidth = 1;
  ctx.globalAlpha = state.opacity;
  
  // Centre circle
  drawCircle(ctx, 0, 0, r);
  
  // 6 surrounding circles
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3; // 60 degree increments
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    drawCircle(ctx, x, y, r);
  }
  
  // Second ring (6 more circles for full Flower of Life)
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6; // offset by 30 degrees
    const x = r * 2 * Math.cos(angle);
    const y = r * 2 * Math.sin(angle);
    drawCircle(ctx, x, y, r);
  }
}
```

### Metatron's Cube Construction

Lines connecting all 13 circle centres of the Flower of Life:

```typescript
function drawMetatronsCube(ctx: CanvasRenderingContext2D, radius: number, state: GeometryState) {
  const r = radius / 3;
  
  // Get all 13 circle centres
  const points: [number, number][] = [[0, 0]];
  
  // First ring
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    points.push([r * Math.cos(angle), r * Math.sin(angle)]);
  }
  
  // Second ring
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    points.push([r * 2 * Math.cos(angle), r * 2 * Math.sin(angle)]);
  }
  
  // Draw all connecting lines
  ctx.strokeStyle = state.colour;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = state.opacity * 0.5;
  
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      ctx.beginPath();
      ctx.moveTo(points[i][0], points[i][1]);
      ctx.lineTo(points[j][0], points[j][1]);
      ctx.stroke();
    }
  }
  
  // Draw circles on top
  ctx.globalAlpha = state.opacity;
  ctx.lineWidth = 1;
  for (const [x, y] of points) {
    drawCircle(ctx, x, y, r * 0.3); // smaller circles at each point
  }
}
```

### UI — Geometry Toggle and Selector

**In session view, full-screen behind all controls:**

```
◎ Visualisation                    ○──
    Style: [ Flower of Life ▾ ]
```

- Toggle on/off
- Dropdown: Concentric Circles, Flower of Life, Metatron's Cube
- When on: canvas fills the entire session view background
- All session controls (timer, phase, volume, ambient, breathing) render ON TOP of the geometry
- Canvas opacity is LOW (0.15–0.25) so it doesn't overwhelm — it's atmospheric, not a screensaver

### PRO Gating

- **Free users:** Concentric Circles only
- **PRO users:** All geometry types
- Flower of Life and Metatron's Cube show lock icon in dropdown for free users
- Same subtle inline PRO messaging pattern — no popup

### Performance

- Use `requestAnimationFrame` for the render loop
- Target 30fps, not 60fps — saves battery, geometry is slow-moving
- When page is hidden (screen locked): stop rendering entirely, only audio continues
- Use `devicePixelRatio` for crisp rendering on retina displays
- Canvas size: match the session view container, not full window

### Test Checklist
- [ ] Visualisation toggle appears in session controls
- [ ] Concentric Circles render correctly and pulse with beat frequency
- [ ] Flower of Life renders correctly — 7+6 overlapping circles
- [ ] Metatron's Cube renders correctly — all lines connecting 13 points
- [ ] Geometry pulses/breathes in sync with the binaural beat
- [ ] Pulse rate changes with session phases (Ease In ramp visible)
- [ ] Colour matches current brainwave state
- [ ] Colour transitions smoothly during phase changes
- [ ] Motion sensors / Auto Motion cause subtle geometry rotation
- [ ] Guided breathing (if active) overrides beat pulsing for scale
- [ ] Ambient layers trigger subtle particle effects
- [ ] Geometry is low opacity and doesn't obstruct session controls
- [ ] Canvas stops rendering when screen is locked (battery saving)
- [ ] Free users can only select Concentric Circles
- [ ] PRO users can select all geometry types
- [ ] Locked geometries show PRO badge in dropdown
- [ ] Performance is smooth — no jank on mid-range phones
- [ ] Works correctly alongside all other features (sleep timer, haptics, breathing, sensors)

---

## Implementation Order

1. **Daily Recommendation** — quick, ship it
2. **Haptic Vibration** — small, isolated feature
3. **Guided Breathing** — medium complexity, needed before geometry (so geometry can sync with it)
4. **Sacred Geometry** — most complex, builds on breathing integration

Deploy after each feature.

---

## What NOT to Touch

- ✅ Audio engine — unchanged
- ✅ Sleep timer and session phases — unchanged
- ✅ Phone Sensors / Auto Motion — unchanged (geometry reads their data, doesn't modify)
- ✅ Ambient layers — unchanged (geometry reads volume, doesn't modify)
- ✅ Favourites, Share Links, Headphone Warning — unchanged
- ✅ /sell and /promo pages — unchanged
