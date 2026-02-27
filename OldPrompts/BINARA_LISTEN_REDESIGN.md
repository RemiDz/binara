# BINARA — Listen Tab Card Redesign

## What This Is

A complete visual redesign of the preset cards on the Listen tab. The current cards use a generic AI-coded aesthetic (emoji icons, uniform borders, cookie-cutter layout). This redesign replaces them with crafted, frequency-aware cards that feel like a premium audio tool, not a template.

**Reference prototype:** See the attached `binara-listen-cards.jsx` file. This is the design source of truth. Match it precisely.

---

## Design System

### Typography (3 fonts, strict roles)

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display / names | Cormorant Garamond | 600 | Preset names, app title |
| Data / technical | JetBrains Mono | 400–500 | Frequencies, durations, wave labels |
| Body / descriptions | Inter | 300–400 | Descriptions, UI labels |

Load via Google Fonts. These fonts are already used across the Harmonic Waves ecosystem.

### Brainwave Colour Map (DO NOT deviate)

```typescript
const WAVE_STATES = {
  delta: { color: "#6B5CE7", glow: "rgba(107,92,231,0.3)", label: "Delta", range: "0.5–4 Hz", symbol: "δ" },
  theta: { color: "#8B6CE7", glow: "rgba(139,108,231,0.3)", label: "Theta", range: "4–8 Hz", symbol: "θ" },
  alpha: { color: "#4ECDC4", glow: "rgba(78,205,196,0.3)", label: "Alpha", range: "8–14 Hz", symbol: "α" },
  beta:  { color: "#F7B731", glow: "rgba(247,183,49,0.3)", label: "Beta", range: "14–30 Hz", symbol: "β" },
  gamma: { color: "#FC5C65", glow: "rgba(252,92,101,0.3)", label: "Gamma", range: "30–100 Hz", symbol: "γ" },
};
```

Every card derives its entire colour identity from its brainwave type. No arbitrary colours.

### Background
- App background: `#080A12`
- Card inner background: `rgba(12,14,24,0.92)` with `backdrop-filter: blur(20px)`
- Two fixed ambient radial gradients on the page (very subtle, see prototype)

---

## Card Anatomy

Each preset card contains these elements, top to bottom:

### 1. Frequency Ring (replaces emoji icons)
- SVG circle with dashed stroke — dash density proportional to frequency
- Greek letter (δ θ α β γ) centred inside, rendered in Cormorant Garamond italic
- Colour matches brainwave state
- On hover: ring rotates slowly (2s linear), opacity increases, inner fill glows

### 2. Name + Metadata
- Preset name: Cormorant Garamond 17px/600
- Below: wave label (e.g. "BETA") in brainwave colour + dot separator + frequency in Hz
- Both in JetBrains Mono 10.5px uppercase

### 3. Waveform Signature (KEY FEATURE)
- HTML Canvas element, unique per card
- Draws a sine wave whose cycle count reflects the actual frequency (clamped 2–8 cycles)
- Two-pass rendering: blurred glow layer underneath, crisp line on top
- Colour matches brainwave state
- Animates continuously (slow idle, faster on hover)
- Centred horizontally in the card

### 4. Description
- Inter 11.5px, very low opacity (0.35), brightens slightly on hover (0.5)

### 5. Bottom Row
- Duration in JetBrains Mono (left)
- Small play circle with triangle icon (right) — border and fill respond to hover with brainwave colour

---

## Card Container / Border

This is critical to getting the feel right:

- Outer wrapper has 1px padding with a gradient background (the "border")
- Default: `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`
- Hover: `linear-gradient(135deg, ${color}40, transparent 50%, ${color}20)` — the brainwave colour bleeds into the border
- Border radius: 16px outer, 15px inner
- On hover: `translateY(-2px)` lift
- On press: `scale(0.97)` feedback

---

## Hover Behaviour (all transitions 0.3–0.5s cubic-bezier)

When a card is hovered:
- Border gradient shifts to brainwave colour
- Card lifts 2px
- Frequency ring rotates, glows, increases opacity
- Waveform animation speeds up, opacity goes to 1
- Name text brightens
- Wave label brightens
- Description text brightens slightly
- Play circle border and fill adopt brainwave colour
- Subtle radial glow appears at top-left corner inside the card

---

## Animation

- Cards stagger in on mount: `opacity 0→1, translateY 12px→0`, duration 0.5s, delay `index * 0.06s`
- When switching categories, re-trigger the stagger animation on the new filtered set

---

## Category Tabs

Replace the current emoji-prefixed category pills with clean text-only tabs:

- Container: `rgba(255,255,255,0.03)` background, 3px padding, 10px radius
- Each tab: Inter 12px, 7px 14px padding, 8px radius
- Active: `rgba(255,255,255,0.08)` background, white text
- Inactive: transparent, 0.35 opacity text
- No emojis. Text only: All, Focus, Sleep, Meditation, Relax

---

## Mode Tabs (Listen / Mix / Create)

- Same container style as categories but with 1px border
- Active tab gets a subtle gold gradient background + gold border (matching the PRO badge)
- Icons: ♫ Listen, ⊞ Mix, ⚡ Create (or keep existing icons if they work better)

---

## What to Remove

- ❌ All emoji icons from cards (🧠 etc.)
- ❌ Emoji icons from category tabs
- ❌ Any uniform/static card borders
- ❌ Any flat colour card backgrounds

## What to Keep

- ✅ All existing preset data (names, frequencies, durations, descriptions, categories)
- ✅ The existing audio engine and playback logic — DO NOT touch audio code
- ✅ PRO badge styling
- ✅ Grid layout (2 columns)
- ✅ All existing functionality — this is purely a visual redesign of the card components

---

## Implementation Notes

- The WaveformSignature component uses `requestAnimationFrame` — make sure to clean up with `cancelAnimationFrame` in the useEffect return
- Use `window.devicePixelRatio` for sharp canvas rendering on retina displays
- The canvas should be sized with CSS (logical pixels) and scaled internally (physical pixels)
- Touch devices: use `onTouchStart`/`onTouchEnd` as hover equivalents
- Performance: 12 cards × 1 canvas each is fine. The animation is lightweight (single sine wave per frame)

---

## Test Checklist

- [ ] All preset cards render with correct brainwave colours
- [ ] Greek symbols display correctly (δ θ α β γ)
- [ ] Waveforms animate smoothly (no jank)
- [ ] Hover states work on desktop (lift, glow, waveform speed)
- [ ] Touch feedback works on mobile
- [ ] Category filtering works and re-triggers stagger animation
- [ ] Fonts load correctly (Cormorant Garamond, JetBrains Mono, Inter)
- [ ] Cards are tappable and trigger preset playback (existing functionality preserved)
- [ ] No visual regression on Mix or Create tabs
- [ ] Dark background renders correctly, no white flash on load
