# BINARA — Listen Tab: Card Preview & Category Filter Improvements

## Two Changes

1. **Card preview playback** — the small play button on each preset card plays a preview of that preset directly, without navigating into the full session view
2. **Category filter styling** — restyle the category filter buttons to feel more refined and integrated with the app's aesthetic

---

## 1. Card Preview Playback

### Concept

The small play button (bottom-right of each preset card) becomes a **preview toggle**. Tap it to hear a 15-second preview of that preset's binaural beat. Tap again (or tap a different card's preview) to stop. This lets users audition presets before committing.

Tapping the **card itself** (anywhere except the play button) still navigates into the full session view as it does now.

### Behaviour

**Tap play button on a card:**
1. Start playing that preset's binaural beat at the specified frequency — same oscillator setup as the full session but without any timer, ambient layers, or session tracking
2. Play button visually transforms into a stop/pause icon
3. Card enters a "previewing" state with a visual indicator (see UI States below)
4. A subtle progress bar or timer shows the preview is playing (max 15 seconds)
5. After 15 seconds, preview auto-stops and the card returns to idle state

**Tap play button again while previewing:**
- Stop the preview immediately (with short fade-out)
- Card returns to idle state

**Tap a different card's play button while one is previewing:**
- Stop the current preview (fade out)
- Start the new preview (fade in)
- Only ONE preview can play at a time

**Tap the card body (not the play button) while previewing:**
- Stop the preview
- Navigate into the full session view as normal

**Tap the card body when not previewing:**
- Navigate into the full session view as normal (existing behaviour, unchanged)

### Audio Implementation

```typescript
// Preview uses a simplified version of the beat engine
// No ambient layers, no effects chain, no timer — just the core binaural beat

interface PreviewState {
  isPlaying: boolean;
  presetId: string | null;
  source: {
    leftOsc: OscillatorNode;
    rightOsc: OscillatorNode;
    gainNode: GainNode;
  } | null;
  timeout: ReturnType<typeof setTimeout> | null;
}

function startPreview(audioCtx: AudioContext, preset: Preset) {
  // Stop any existing preview first
  stopPreview();

  const baseFreq = 200; // Base carrier frequency for preview
  const beatFreq = preset.freq; // e.g. 16 Hz for Deep Focus

  // Create simple binaural beat
  const leftOsc = audioCtx.createOscillator();
  const rightOsc = audioCtx.createOscillator();
  const merger = audioCtx.createChannelMerger(2);
  const gainNode = audioCtx.createGain();

  leftOsc.frequency.value = baseFreq;
  rightOsc.frequency.value = baseFreq + beatFreq;

  const leftGain = audioCtx.createGain();
  const rightGain = audioCtx.createGain();

  leftOsc.connect(leftGain);
  rightOsc.connect(rightGain);
  leftGain.connect(merger, 0, 0);
  rightGain.connect(merger, 0, 1);
  merger.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // Fade in
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.5);

  leftOsc.start();
  rightOsc.start();

  // Auto-stop after 15 seconds
  const timeout = setTimeout(() => stopPreview(), 15000);

  // Store state...
}

function stopPreview() {
  // Fade out over 0.3s, then disconnect and clean up
  // Clear the auto-stop timeout
}
```

**Important:** The preview audio should be at a comfortable, lower volume than a full session (gain ~0.3 instead of the usual session volume). It's a quick taste, not a full experience.

### UI States for the Play Button

The play button (bottom-right of card) has three states:

**Idle (default):**
- Small circle with play triangle icon
- Subtle border, low opacity
- Uses the card's brainwave colour on hover (if the card redesign from BINARA_LISTEN_REDESIGN.md is implemented)

**Previewing (active):**
- Play triangle swaps to a **pause icon** (two vertical bars) or a **stop icon** (square)
- Button border and fill use the card's brainwave colour at higher opacity
- Subtle pulse animation on the button to indicate active playback

**Loading (brief, only if AudioContext needs to resume):**
- Subtle spinner or pulse — this should be near-instant since there's no file to load

### Card Visual State During Preview

When a card is being previewed, add a subtle visual indicator so the user knows which preset is playing:

- Thin animated progress bar along the bottom edge of the card (fills over 15 seconds in the brainwave colour)
- The card border/glow subtly activates (similar to hover state but persistent)
- Waveform signature (if implemented from BINARA_LISTEN_REDESIGN.md) animates faster

When preview stops, these indicators smoothly fade back to idle.

### Event Handling — Separating Play Button from Card Tap

This is the most important implementation detail. The play button and the card body must have **separate click/tap handlers**:

```typescript
// On the play button — MUST stop propagation
function handlePlayButtonClick(e: React.MouseEvent | React.TouchEvent) {
  e.stopPropagation(); // Prevent card's onClick from firing
  e.preventDefault();
  
  if (isPreviewingThisCard) {
    stopPreview();
  } else {
    startPreview(preset);
  }
}

// On the card wrapper — navigates to full session
function handleCardClick() {
  stopPreview(); // Stop any active preview
  navigateToSession(preset);
}
```

**`e.stopPropagation()` on the play button is essential** — without it, tapping the play button will also trigger the card navigation.

---

## 2. Category Filter Buttons Restyle

### Current Problem

The category filter buttons are plain text pills with minimal styling — they feel disconnected from the premium aesthetic of the rest of the app.

### New Design

Restyle the category filter buttons to feel integrated with the cosmic/sacred geometry aesthetic of Binara while remaining clean and readable:

**Container:**
- Slightly more visible background: `rgba(255,255,255,0.04)`
- Thin top and bottom border: `1px solid rgba(255,255,255,0.04)`
- Full-width with horizontal scroll if needed
- Padding: `4px`
- Border radius: `12px`

**Inactive button:**
- Background: `transparent`
- Text colour: `rgba(255,255,255,0.35)`
- Font: Inter, 12px, weight 400
- Letter-spacing: `0.04em`
- Padding: `8px 16px`
- Border-radius: `10px`
- Transition: all 0.3s ease
- On hover: text brightens to `rgba(255,255,255,0.55)`, background `rgba(255,255,255,0.03)`

**Active button:**
- Background: `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))`
- Border: `1px solid rgba(255,255,255,0.08)`
- Text colour: `rgba(240,237,230,0.9)` (warm white)
- Font weight: 500
- Subtle inner glow/shadow: `box-shadow: inset 0 1px 0 rgba(255,255,255,0.06)`
- A very subtle dot indicator below the text (small 3px circle in a warm accent colour like the PRO badge gold `#F7B731`, opacity 0.6)

**The dot indicator on the active tab:**
```css
/* Pseudo-element below active tab text */
.active-tab::after {
  content: '';
  display: block;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(247, 183, 49, 0.6);
  margin: 4px auto 0;
}
```

**Category labels (text only, no emojis):**
- All
- Focus
- Sleep
- Meditation
- Relax

### Animation

When switching categories:
- Active indicator (dot + background) transitions smoothly to the new tab
- Cards below re-render with a staggered fade-in animation (reuse the `cardReveal` animation from the card redesign if implemented)

---

## Test Checklist

### Card Preview Playback
- [ ] Tap play button on a card → binaural beat preview starts playing
- [ ] Audio fades in smoothly (no click)
- [ ] Play icon changes to pause/stop icon
- [ ] Card shows visual "previewing" state (progress bar, glow)
- [ ] Preview auto-stops after 15 seconds
- [ ] Progress bar fills over 15 seconds and resets
- [ ] Tap play button again → preview stops with fade-out
- [ ] Tap a different card's play button → first preview stops, second starts
- [ ] Only ONE preview plays at a time (never two simultaneously)
- [ ] Tap card body (not play button) → navigates to full session (not preview)
- [ ] Tap card body while previewing → preview stops AND navigates to full session
- [ ] Play button tap does NOT trigger card navigation (stopPropagation works)
- [ ] Preview volume is comfortable and lower than full session volume
- [ ] Preview works with headphones (left/right channels correct for binaural beat)
- [ ] AudioContext resumes on first interaction (handles browser autoplay policy)

### Category Filters
- [ ] Active tab has gradient background, border, and dot indicator
- [ ] Inactive tabs have subtle hover state
- [ ] Switching categories animates smoothly
- [ ] Cards below re-stagger on category change
- [ ] No emojis in category labels
- [ ] Horizontal scroll works on narrow screens if needed
- [ ] Touch targets are large enough for comfortable tapping (min 44px height)

### No Regressions
- [ ] Full session view still works when tapping card body
- [ ] All preset data (frequency, duration, description) unchanged
- [ ] Mix and Create tabs unaffected
- [ ] Ambient layers unaffected
- [ ] Beat audio quality unchanged
