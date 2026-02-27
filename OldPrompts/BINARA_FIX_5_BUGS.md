# Binara — Bug Fixes: 5 Issues

## Bug 1: Live Preview Bar Touching Mode Switcher

The "Tap to enable live preview" container and the active "Live" preview bar have no gap between them and the Listen/Mix/Create mode switcher above.

### Fix:

Add `margin-top: 12px` (or equivalent Tailwind `mt-3`) to the preview bar container. There should be a clear 12px gap between the mode switcher and the preview bar.

```tsx
// In the preview bar wrapper:
<div className="preview-bar" style={{ marginTop: '12px' }}>
  ...
</div>
```

Check both states:
- The "Tap to enable live preview" dashed-border state
- The active "Live" state with volume slider

Both need the same top margin.

---

## Bug 2: Live Preview Volume Slider Thumb Not Centred

The volume slider thumb (the cyan circle) in the Live preview bar is positioned slightly above the slider track instead of being vertically centred on it.

### Fix:

This is a CSS alignment issue on the `<input type="range">` inside the preview bar. The thumb needs to be vertically centred on the track.

```css
/* Ensure the range input and its thumb are vertically centred */
.preview-bar input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  outline: none;
  margin: 0;
  vertical-align: middle;
}

.preview-bar input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4fc3f7;
  cursor: pointer;
  /* Critical: centre the thumb on the track */
  margin-top: -8px; /* (thumb height - track height) / 2 = (20 - 4) / 2 = 8 */
}

/* Firefox */
.preview-bar input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4fc3f7;
  cursor: pointer;
  border: none;
}
```

If the app uses a custom Slider component (like `src/components/ui/Slider.tsx`), check that component's CSS instead. The fix is the same — the thumb's `margin-top` needs to offset by half the difference between thumb height and track height.

Also check: is the preview bar using `display: flex; align-items: center;`? If not, add it — this ensures the "Live" text, slider, speaker icon, and close button are all vertically aligned.

---

## Bug 3: Phone Sensor 3D Animation Not Working Properly

The phone sensor panel shows a phone outline with two dots (one at the bottom, one transparent at the top) but the animation doesn't accurately follow the phone's real tilt. The phone graphic should rotate to match the actual device orientation.

### Fix:

The 3D phone preview uses CSS transforms driven by sensor data. The issue is likely that the CSS custom properties (`--pitch` and `--roll`) aren't being updated, or the transform mapping is inverted/wrong.

**Step 1: Verify the CSS custom properties are being set:**

```typescript
// In SensorControl.tsx, wherever the phone preview div is rendered:
<div
  className="phone-preview"
  style={{
    '--pitch': sensorState.pitch,
    '--roll': sensorState.roll,
  } as React.CSSProperties}
>
  {/* Phone outline SVG or div */}
</div>
```

**Step 2: Fix the CSS transform:**

```css
.phone-preview {
  width: 80px;
  height: 140px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.1s ease-out;
  transform:
    perspective(400px)
    rotateX(calc(var(--pitch) * -0.5deg))  /* Note: NEGATIVE for natural feel — tilt forward = top tilts away */
    rotateY(calc(var(--roll) * 0.5deg));   /* Multiply by 0.5 to reduce sensitivity */
}
```

**Key fixes:**
- `rotateX` should be **negative** pitch — when the phone tilts forward (positive pitch/beta), the top of the 3D preview should tilt away from the viewer
- Multiply by 0.5 to dampen the effect — raw sensor values (±90°) are too extreme for the small preview
- `perspective(400px)` creates the 3D depth effect

**Step 3: Remove the two dots and use a cleaner phone graphic:**

The current implementation has two confusing dots. Replace with a simple phone outline:

```tsx
<div className="phone-preview" style={{ '--pitch': pitch, '--roll': roll }}>
  {/* Simple phone body */}
  <div style={{
    width: '60px',
    height: '110px',
    border: '1.5px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '10px',
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.03)',
  }}>
    {/* Screen area */}
    <div style={{
      position: 'absolute',
      inset: '8px 4px',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '4px',
    }} />
    {/* Bottom indicator (home bar) */}
    <div style={{
      position: 'absolute',
      bottom: '4px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '20px',
      height: '2px',
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '1px',
    }} />
  </div>
</div>
```

**Step 4: Verify sensor data is actually reaching the component:**

Add a console.log temporarily to verify:
```typescript
useEffect(() => {
  console.log('Sensor pitch:', sensorState.pitch, 'roll:', sensorState.roll);
}, [sensorState.pitch, sensorState.roll]);
```

If pitch/roll are always 0, the issue is in the sensor engine not passing data to the component.

---

## Bug 4: Lock Screen Audio Stops + Ugly Logo

Two sub-issues:

### 4a: Audio stops when screen is locked

The background audio fix (Media Session API + silent audio element) was implemented but is clearly not working fully on iOS. 

**Additional fix — ensure the silent audio element starts on session start:**

Check `audio-engine.ts` and verify:

1. `startSilentAudioElement()` is called when ANY session starts (Easy, Mix, or Advanced)
2. The silent audio element is created BEFORE the Web Audio oscillators start
3. The silent audio's `.play()` call is happening inside a user gesture handler (the Play/Start button tap)

```typescript
// The silent audio MUST be started from within the user gesture event chain
// If it's in a setTimeout or async callback, iOS will block it

// CORRECT — inside the button handler:
function handleStartSession() {
  audioEngine.startSilentAudioElement(); // Must be first — needs user gesture
  audioEngine.play(config);              // Then start Web Audio
}

// WRONG — in a useEffect or delayed callback:
useEffect(() => {
  audioEngine.startSilentAudioElement(); // iOS will block this — no user gesture
}, []);
```

Also verify the Media Session metadata is being set:
```typescript
if ('mediaSession' in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: presetName || 'Binaural Session',
    artist: 'Binara',
    album: 'Binaural Beats',
    // Add artwork (see 4b below)
  });
  
  navigator.mediaSession.setActionHandler('play', () => resumeSession());
  navigator.mediaSession.setActionHandler('pause', () => pauseSession());
  navigator.mediaSession.setActionHandler('stop', () => stopSession());
}
```

### 4b: Lock screen artwork is ugly black triangle

The lock screen shows a generic black circle with a white triangle (play icon). This needs custom artwork.

**Create a proper lock screen artwork image:**

Create `public/media-artwork-512.png` (512×512) with Binara branding:

```
┌────────────────────────┐
│                        │
│    Deep ocean gradient  │  ← #050810 → #0a1628
│    background           │
│                        │
│      B I N A R A       │  ← Playfair Display, white, centred
│                        │
│      ～～～～～～       │  ← Subtle cyan frequency wave
│                        │
│    Binaural Beats      │  ← Inter, small, muted
│                        │
└────────────────────────┘
```

Generate this as a static PNG. It could be:
- Option A: A simple canvas-generated image at build time
- Option B: A pre-made static PNG placed in `/public`

For now, create it as a simple static image. A dark gradient background (#050810 to #0a1628) with "BINARA" in white Playfair Display and a subtle cyan wave line underneath.

**Also create smaller sizes:**
- `public/media-artwork-96.png` (96×96)
- `public/media-artwork-256.png` (256×256)
- `public/media-artwork-512.png` (512×512)

**Set the artwork in Media Session:**

```typescript
navigator.mediaSession.metadata = new MediaMetadata({
  title: presetName || 'Binaural Session',
  artist: 'Binara',
  album: category || 'Binaural Beats',
  artwork: [
    { src: '/media-artwork-96.png', sizes: '96x96', type: 'image/png' },
    { src: '/media-artwork-256.png', sizes: '256x256', type: 'image/png' },
    { src: '/media-artwork-512.png', sizes: '512x512', type: 'image/png' },
  ],
});
```

**Dynamic metadata per session:**

Update the Media Session metadata title when different presets/sessions start:
- Easy mode: `title: presetName` (e.g., "Body Scan")
- Mix mode: `title: "Mix Session"` or the saved session name
- Advanced mode: `title: "Advanced Session"` or saved session name

**Regarding dynamic/live artwork:** Unfortunately the Media Session API only supports static images — you can't show a live animation on the lock screen. But you can change the artwork image when a different category of session starts (e.g., different colours for Focus vs Sleep vs Meditation). This is a nice-to-have for later, not essential now.

---

## Bug 5: Promo Page Cards Are Generic and Empty

The promo cards on `/promo` have too much wasted space and not enough useful content. Looking at the screenshot, the "Preset Spotlight" and "Pro Features" cards are mostly empty dark space with tiny text at the bottom.

### Fix: Redesign all 6 cards to be content-dense

**General rules for ALL cards:**
- Fill the card with content — no large empty areas
- Text should be large enough to read on social media (minimum 14px equivalent at 1080px)
- Key information should be in the top 60% of the card (that's what shows in feed thumbnails)
- Use the full card area — star field background dots are fine but content must dominate
- Brand elements (binara.app, date) stay small at the bottom

**Card 1 — Feature Overview (redesign):**
```
┌──────────────────────────────────┐
│                                  │
│  🎧 B I N A R A                  │  ← Large header
│                                  │
│  Binaural Beats                  │  ← Large subtitle
│  Engineered for                  │
│  Your Brain                      │
│                                  │
│  ─────────────────────           │  ← Divider
│                                  │
│  ✦  24 Presets                   │  ← Large text, not tiny
│  ✦  3 Creation Modes            │
│  ✦  Phone Sensor Control         │
│  ✦  Export to WAV                │
│  ✦  Free to Start               │
│                                  │
│  binara.app            Feb 2026  │
└──────────────────────────────────┘
```

**Card 2 — Brainwave Guide (redesign):**
```
┌──────────────────────────────────┐
│                                  │
│  YOUR BRAIN ON                   │  ← Bold header
│  BINAURAL BEATS                  │
│                                  │
│  ━━━━━━━━━━━━━  Delta  0.5–4 Hz │  ← Bar + label + range
│  Deep Sleep                      │     Each state gets
│                                  │     2 lines: bar and
│  ━━━━━━━━━━━━━  Theta  4–8 Hz   │     description
│  Meditation & Dreams             │
│                                  │
│  ━━━━━━━━━━━━━  Alpha  8–13 Hz  │
│  Calm Focus & Flow               │
│                                  │
│  ━━━━━━━━━━━━━  Beta   13–30 Hz │
│  Active Thinking                 │
│                                  │
│  ━━━━━━━━━━━━━  Gamma  30–50 Hz │
│  Peak Performance                │
│                                  │
│  binara.app            Feb 2026  │
└──────────────────────────────────┘
```
Each brainwave state bar should be coloured differently and take up meaningful horizontal space.

**Card 3 — Preset Spotlight (redesign):**
```
┌──────────────────────────────────┐
│                                  │
│  PRESET OF THE DAY               │  ← Amber accent label
│                                  │
│  "Study Flow"                    │  ← Large preset name
│  Focus                           │  ← Category
│                                  │
│  ┌─────────────────────────────┐ │
│  │ Brainwave    Beta           │ │  ← Info grid with labels
│  │ Beat         14 Hz          │ │     Large, readable
│  │ Carrier      250 Hz         │ │
│  │ Duration     45 min         │ │
│  └─────────────────────────────┘ │
│                                  │
│  ▶ Try it free at binara.app     │  ← CTA text
│                                  │
│  ～～～～～～～～～～～           │  ← Frequency wave SVG
│                                  │
│  binara.app            Feb 2026  │
└──────────────────────────────────┘
```
The info grid should be prominent — large font, clear labels, using the full card width.

**Card 4 — Pro Features (redesign):**
```
┌──────────────────────────────────┐
│                                  │
│  ⚡ BINARA PRO                   │  ← Amber, large
│                                  │
│  Unlock the full                 │  ← Subtitle
│  playground                      │
│                                  │
│  ✦ Multi-layer beats (×4)       │  ← Feature list
│  ✦ Stereo field control          │     Each line large
│  ✦ LFO modulation               │     enough to read
│  ✦ Isochronic tones              │     on a phone feed
│  ✦ Phone sensor control          │
│  ✦ Timeline editor               │
│  ✦ Export to WAV                 │
│  ✦ Unlimited saves               │
│                                  │
│  $7.99 · One-Time · Forever      │  ← Price prominent
│                                  │
│  binara.app            Feb 2026  │
└──────────────────────────────────┘
```

**Card 5 — CTA (redesign):**
```
┌──────────────────────────────────┐
│                                  │
│                                  │
│  Stop scrolling.                 │  ← Large, bold
│  Start syncing                   │
│  your brainwaves.                │
│                                  │
│  ～～～～～～～～～～～           │  ← Wide frequency wave
│  ～～～～～～～～～～～           │  ← Multiple wave lines
│                                  │
│  24 presets                      │  ← Key stats
│  3 creation modes                │
│  Phone sensor control            │
│                                  │
│  Free to start · No account      │
│                                  │
│  binara.app                      │  ← Large, prominent
│                                  │
│  binara.app            Feb 2026  │
└──────────────────────────────────┘
```

**Card 6 — Phone Sensor Feature (redesign):**
```
┌──────────────────────────────────┐
│                                  │
│  📱 YOUR PHONE                   │  ← Large header
│  BECOMES THE                     │
│  CONTROLLER                      │
│                                  │
│  ┌───────────────────────────┐   │
│  │  Tilt Forward              │   │  ← Action boxes
│  │  → Increase frequency      │   │     Clear cause/effect
│  └───────────────────────────┘   │
│  ┌───────────────────────────┐   │
│  │  Tilt Back                 │   │
│  │  → Decrease frequency      │   │
│  └───────────────────────────┘   │
│  ┌───────────────────────────┐   │
│  │  Place Face-Down           │   │
│  │  → Deep session mode       │   │
│  └───────────────────────────┘   │
│  ┌───────────────────────────┐   │
│  │  Breathe With Phone        │   │
│  │  → Sound follows breath    │   │
│  └───────────────────────────┘   │
│                                  │
│  Only in Binara Pro              │
│  binara.app            Feb 2026  │
└──────────────────────────────────┘
```

### Styling Rules for All Cards:

```
Card background:    Linear gradient #050810 → #0a1628
Star field:         Keep but reduce count to ~20 dots (less noise)
Headers:            Playfair Display, 28–32px equivalent at 1080px output
Body text:          Inter, 18–22px equivalent at 1080px output
Data/labels:        JetBrains Mono, 16–18px equivalent at 1080px output
Feature items:      At least 20px equivalent — must be readable in an Instagram feed
Accent colours:     Cyan (#4fc3f7) for general, Amber (#ffab40) for Pro/spotlight
Padding:            At least 48px on all sides at 1080px output
Line spacing:       Generous — at least 1.5× for body text
```

The key principle: **these cards ARE the advert**. Every pixel should earn its place. If there's empty space, fill it with useful content or remove the empty space.

---

## Testing

- [ ] Bug 1: 12px gap between mode switcher and preview bar
- [ ] Bug 2: Volume slider thumb centred on the track
- [ ] Bug 3: Phone preview rotates accurately when tilting device
- [ ] Bug 3: No confusing dots — clean phone outline
- [ ] Bug 4: Audio continues when screen is locked (iOS + Android)
- [ ] Bug 4: Lock screen shows "Binara — [Preset Name]" with branded artwork
- [ ] Bug 4: Lock screen play/pause controls work
- [ ] Bug 4: No ugly black triangle — proper Binara branding
- [ ] Bug 5: All 6 promo cards are content-dense with no wasted space
- [ ] Bug 5: Text is readable at social media feed size
- [ ] Bug 5: Cards download as clean PNGs
- [ ] Build passes cleanly
