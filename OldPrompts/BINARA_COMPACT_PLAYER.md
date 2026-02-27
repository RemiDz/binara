# Binara — Redesign: Compact Player with Background Visualiser

## Problem

The current player screen has a large pulsing ring animation that takes up ~50% of the screen. Users have to scroll to reach ambient layer controls, volume, and play/pause/stop buttons. The big animation isn't engaging enough to justify the space it consumes.

## Goal

Redesign the player screen so that **everything fits on one mobile screen without scrolling**. Move the visualisation to the background. Make controls immediately accessible.

## Design: Background Visualiser + Compact Layout

The entire player screen becomes a subtle living canvas. The pulsing visualisation fills the whole background at very low opacity. All controls and information are layered on top in a compact, scroll-free layout.

---

## Background Visualiser

Replace the current large `BeatVisualiser` canvas component with a full-screen background effect.

### Visual Effect: Concentric Ripples

Slow-expanding concentric rings that pulse outward from the centre of the screen at the beat frequency rate. Think of the screen itself breathing.

```typescript
// Canvas fills the entire player view (position: absolute, inset: 0)
// z-index: 0 (behind all content)

function drawRipples(ctx, canvas, beatFrequency, time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const maxRadius = Math.max(canvas.width, canvas.height) * 0.8;

  // 4–5 rings expanding outward
  const ringCount = 5;
  const cycleDuration = 1 / beatFrequency; // seconds per beat cycle
  const phase = (time % cycleDuration) / cycleDuration; // 0–1

  for (let i = 0; i < ringCount; i++) {
    const ringPhase = (phase + i / ringCount) % 1;
    const radius = ringPhase * maxRadius;
    const opacity = (1 - ringPhase) * 0.07; // Max 7% opacity — very subtle

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(79, 195, 247, ${opacity})`; // bio-cyan
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Central glow — subtle radial gradient that pulses
  const pulseIntensity = 0.03 + Math.sin(time * beatFrequency * Math.PI * 2) * 0.02;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 0.3);
  gradient.addColorStop(0, `rgba(79, 195, 247, ${pulseIntensity})`);
  gradient.addColorStop(1, 'rgba(79, 195, 247, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
```

### Key Properties:
- **Canvas:** `position: absolute; inset: 0; z-index: 0; pointer-events: none;`
- **Opacity:** Rings at 5–7% opacity max. This is atmosphere, not a focal point.
- **Colour:** Use the app's bio-cyan (#4fc3f7) — consistent with the design system
- **Animation:** `requestAnimationFrame` at 30fps (not 60 — save battery, it's subtle enough)
- **Beat-synced:** Ring expansion rate matches the current beat frequency
- **Respects reduced motion:** If reduced motion is enabled, show a static subtle radial gradient instead of animated rings

---

## Compact Layout

All content sits on top of the background canvas with `position: relative; z-index: 1`.

### Structure (top to bottom, single screen):

```tsx
<div className="player-screen" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
  
  {/* Background visualiser canvas — fills entire screen */}
  <BackgroundVisualiser beatFrequency={beatFrequency} />

  {/* Content layer */}
  <div className="player-content" style={{ position: 'relative', zIndex: 1, padding: '...' }}>

    {/* Header row */}
    <PlayerHeader />

    {/* Session info — centred */}
    <SessionInfo presetName={...} brainwaveState={...} beatFrequency={...} />

    {/* Compact circular timer */}
    <CompactTimer elapsed={...} total={...} />

    {/* Main volume */}
    <VolumeSlider />

    {/* Ambient layers */}
    <AmbientSelector />
    <ActiveAmbientLayers />

    {/* Action buttons */}
    <SessionControls />

    {/* Expandable info */}
    <InfoAccordion />

  </div>
</div>
```

---

## Component Specifications

### 1. BackgroundVisualiser

New component replacing the old large `BeatVisualiser`.

**File:** `src/components/BackgroundVisualiser.tsx`

```tsx
interface BackgroundVisualiserProps {
  beatFrequency: number;  // Hz — controls ripple speed
  isPlaying: boolean;
}
```

- Full-screen canvas, absolutely positioned
- Concentric ripple animation as described above
- Pauses animation when `isPlaying` is false (show static gradient)
- Cleans up `requestAnimationFrame` on unmount
- 30fps cap for battery efficiency

### 2. SessionInfo

Compact centred text block showing what's playing.

```
         Body Scan              ← Playfair Display, 1.4rem
       Theta · 6 Hz            ← JetBrains Mono, 0.75rem, muted
   Progressive body awareness   ← Inter, 0.8rem, secondary (optional — hide if tight on space)
```

- Centred horizontally
- No card/box/border — just floating text over the background
- Bottom margin: 16px

### 3. CompactTimer

Shrink the existing circular timer from ~250px to **90–100px diameter**.

```
        ╭─────╮
       ╱  1:59 ╲        ← Elapsed time, JetBrains Mono, 1rem
      │ / 25:00  │       ← Total time, 0.65rem, muted
       ╲        ╱
        ╰─────╯
```

- SVG circle progress arc (same as current, just smaller)
- Stroke width: 2px (thinner than current)
- Progress colour: bio-cyan with subtle glow
- Background circle: rgba(255,255,255,0.06)
- Centred horizontally
- Bottom margin: 20px

### 4. VolumeSlider

Existing volume slider — keep as-is but ensure compact layout:

```
VOLUME   ◁  ────────●────── 60%  ▷
```

- Single row, full width
- Label "VOLUME" in JetBrains Mono, 0.6rem, uppercase
- Bottom margin: 20px

### 5. AmbientSelector

The ambient layer toggle buttons (updated from the multi-ambient spec):

```
AMBIENT LAYERS
[Off] [🌧 Rain] [🌊 Ocean] [🎵 Bowls] [🌲 Forest]
[🔥 Fire] [⚪ White] [🌸 Pink] [🟫 Brown]
```

- Wrap in a flex container with `flex-wrap: wrap` and `gap: 8px`
- Buttons: compact pills, ~36px height
- Active buttons: highlighted background, brighter text
- Bottom margin: 12px

### 6. ActiveAmbientLayers

Per-layer volume controls for active ambient sounds:

```
🌧 Rain    ───●─── 70%   [×]
🎵 Bowls   ─────●─ 45%   [×]
```

- Only visible when 1+ layers active
- Each row: 40px height
- Compact slider
- [×] remove button: 24px, muted until hover/tap
- AnimatePresence for enter/exit
- Bottom margin: 16px

### 7. SessionControls

Pause and Stop buttons:

```
╭──────────────────────────────────╮
│           ⏸  Pause               │   ← Primary style
╰──────────────────────────────────╯
╭──────────────────────────────────╮
│           ⏹  Stop                │   ← Secondary/muted style
╰──────────────────────────────────╯
```

- Full width
- Pause: glass background with cyan accent border
- Stop: glass background, more muted
- Gap between buttons: 8px
- Button height: 48px
- Bottom margin: 16px

### 8. InfoAccordion (How Binaural Beats Work)

Keep the existing expandable info section at the bottom. It's fine being below the fold since it's supplementary content.

```
▸ How Binaural Beats Work
```

---

## Layout Spacing Guide (Mobile — 390px width viewport)

Target: everything visible without scrolling on iPhone 13/14/15 (844px viewport height with safe areas).

```
Safe area top:          ~60px
Header:                 44px
Session info:           60px (name + state + description)
Spacing:                12px
Compact timer:          100px
Spacing:                16px
Volume slider:          40px
Spacing:                16px
Ambient label + grid:   ~80px (2 rows of buttons)
Spacing:                8px
Active layers:          ~80px (2 active layers)
Spacing:                12px
Pause button:           48px
Stop button:            48px
Spacing:                12px
Info accordion:         36px
Safe area bottom:       ~34px
─────────────────────────────
Total:                  ~696px ✓ (fits within 844px)
```

If only 1 ambient layer is active, or none, there's even more room. The layout should flex — don't use fixed heights, let content determine spacing.

### If Space Is Tight

If the viewport is smaller (older iPhones, 667px height):
- Hide the preset description line (keep just name + state/freq)
- Reduce timer to 80px
- Reduce spacing between sections
- The info accordion can go below the fold — that's OK

---

## Files to Modify

### New:
- `src/components/BackgroundVisualiser.tsx` — Full-screen ripple canvas

### Modify:
- `src/components/PlayerView.tsx` — Restructure layout, replace old BeatVisualiser with BackgroundVisualiser, compact all sections
- `src/components/SessionTimer.tsx` (or wherever the circular timer lives) — Reduce size to 90–100px

### Possibly Remove:
- `src/components/BeatVisualiser.tsx` — If it was the old large pulsing ring component, it can be removed or repurposed. The BackgroundVisualiser replaces it.

### Do NOT Modify:
- Audio engine — no audio changes in this update
- Other modes (Mix/Advanced players) — this change is for Easy mode player only. If Mix and Advanced modes have the same large visualiser issue, apply the same pattern to those too, but keep it as a separate step.

---

## Apply to All Player Screens

If the Mix mode player (`MixPlayer.tsx`) and Advanced mode player (`AdvancedPlayer.tsx`) also have the same large visualiser problem, apply the same background visualiser + compact layout pattern to those as well. The background ripple canvas and compact timer are reusable components.

For Mix and Advanced modes, the layout will have additional elements (phase indicator, layer readouts, etc.) but the same principle applies: visualiser in background, controls on top, no scrolling needed.

---

## Testing

- [ ] Easy mode player: all controls visible without scrolling on iPhone 13/14/15
- [ ] Background ripples pulse at the correct beat frequency
- [ ] Ripples are very subtle (5–7% opacity) — atmosphere, not distraction
- [ ] Timer is compact (~100px) but readable
- [ ] Volume slider works
- [ ] Ambient layer toggles work
- [ ] Per-layer volume sliders work (if multi-ambient update is applied)
- [ ] Pause/Stop buttons are immediately accessible
- [ ] Smooth transitions when ambient layers are added/removed (no layout jump)
- [ ] Reduced motion: static gradient instead of animated rings
- [ ] Background canvas doesn't interfere with touch events on controls
- [ ] No performance issues (30fps cap, canvas is lightweight)
- [ ] Layout adapts to smaller viewports (iPhone SE, older models)
- [ ] Mix mode player also fits on one screen (if updated)
- [ ] Advanced mode player also fits on one screen (if updated)
- [ ] Build passes cleanly
