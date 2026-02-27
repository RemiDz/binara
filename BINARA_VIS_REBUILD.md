# BINARA — Remove Guided Breathing & Rebuild Visualisation

## Two changes.

---

## 1. Remove Guided Breathing — COMPLETELY

Remove ALL guided breathing code, UI, and references:

- ❌ Delete the breathing circle component
- ❌ Delete the breathing pattern data/types
- ❌ Delete the breathing toggle from session controls
- ❌ Delete any breathing-related state management
- ❌ Remove breathing references from sacred geometry (if it syncs with breathing)
- ❌ Remove breathing pattern selector UI
- ❌ Remove any breathing-related imports

Leave NO traces. No hidden toggles, no commented-out code, no "coming soon" placeholder. Remove it as if it never existed.

---

## 2. Rebuild Visualisation — Full Screen, Immersive, WOW Factor

### The Problem
The current visualisation is too subtle — barely noticeable, looks like a faint background pattern. For a premium app, the visualisation needs to be a FEATURE, not decoration. When users turn it on, they should immediately see something beautiful and alive.

### The New Approach

When the user enables visualisation, the session view TRANSFORMS. The entire screen becomes an immersive visual experience with the session controls floating on top. This is not a subtle background — it's a full-screen living artwork that reacts to the sound.

### Full-Screen Canvas

- Canvas fills the ENTIRE screen (position: fixed, inset: 0)
- Session controls (timer, volume, sleep timer, ambient, sensors) float on top with semi-transparent dark backgrounds so they remain readable
- Background: deep black (#050508) — darker than the normal app background to make the geometry glow

### Geometry Rendering — Make It Glow

The key to "WOW" is GLOW. The geometry should look like it's made of light, not just drawn with thin lines.

**Multi-layer glow technique:**

```typescript
function drawGlowingCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, colour: string, glowIntensity: number) {
  // Layer 1: Wide soft outer glow
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1;
  ctx.shadowBlur = 30 * glowIntensity;
  ctx.shadowColor = colour;
  ctx.globalAlpha = 0.3 * glowIntensity;
  ctx.stroke();
  
  // Layer 2: Medium glow
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.shadowBlur = 15 * glowIntensity;
  ctx.globalAlpha = 0.5 * glowIntensity;
  ctx.stroke();
  
  // Layer 3: Crisp bright core line
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.shadowBlur = 5 * glowIntensity;
  ctx.globalAlpha = 0.9 * glowIntensity;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Reset
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}
```

Every line and circle must be drawn with this 3-layer glow technique. The geometry should look like neon light suspended in darkness.

### Colour Palette — Vivid, Not Muted

The current brainwave colours need to be MORE vivid for the visualisation:

```typescript
const VIS_COLOURS = {
  delta: { primary: '#8B6CE7', glow: '#A78BFA', accent: '#C4B5FD' },
  theta: { primary: '#A78BFA', glow: '#C084FC', accent: '#DDD6FE' },
  alpha: { primary: '#2DD4BF', glow: '#5EEAD4', accent: '#99F6E4' },
  beta:  { primary: '#FBBF24', glow: '#FCD34D', accent: '#FDE68A' },
  gamma: { primary: '#F87171', glow: '#FCA5A5', accent: '#FECACA' },
};
```

Use the `primary` for main geometry lines, `glow` for the shadowColor, and `accent` for particles and highlights.

### Geometry Animations — Alive, Not Static

**Slow continuous rotation:**
- The entire geometry rotates very slowly (1 full rotation per 60 seconds)
- This creates a living, breathing feel even without any other interaction
- If Auto Motion or Phone Sensors are active, their rotation ADDS to this base rotation

**Beat-synced pulsing — VISIBLE:**
- Scale pulsing must be CLEARLY visible:
  - Delta (1–4 Hz): scale oscillates 0.85 → 1.15 (30% range — big, slow, meditative breathing)
  - Theta (4–8 Hz): scale oscillates 0.90 → 1.10 (20% range)
  - Alpha (8–14 Hz): scale oscillates 0.93 → 1.07 (14% range)
  - Beta (14–30 Hz): scale oscillates 0.96 → 1.04 (8% range — faster, tighter)
  - Gamma (30+ Hz): scale oscillates 0.98 → 1.02 (4% range — shimmer)
- The pulse is a smooth sine wave at the beat frequency
- During Session Phases, the pulse frequency follows the ramping beat frequency

**Glow intensity pulsing:**
- The glow brightness also pulses with the beat, slightly offset from the scale
- This creates a "breathing light" effect
- Glow intensity oscillates between 0.5 and 1.0

### Particle System

Subtle particles floating outward from the geometry centre:

```typescript
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;     // 0–1, decreases over time
  size: number;     // 1–3px
  opacity: number;
}

const MAX_PARTICLES = 50;

function emitParticle(cx: number, cy: number, colour: string): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.2 + Math.random() * 0.5;
  return {
    x: cx + (Math.random() - 0.5) * 50,
    y: cy + (Math.random() - 0.5) * 50,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1,
    size: 1 + Math.random() * 2,
    opacity: 0.3 + Math.random() * 0.4,
  };
}

function updateAndDrawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], colour: string) {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.003; // fade over ~5 seconds
    
    if (p.life > 0) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = colour;
      ctx.globalAlpha = p.opacity * p.life;
      ctx.fill();
    }
  }
  // Remove dead particles and emit new ones
}
```

- Particles emit continuously at a slow rate (~3 per second)
- When ambient layers are playing, emission rate doubles
- Particles drift outward slowly and fade over 5 seconds
- Creates a "energy emanating from sacred geometry" effect

### Flower of Life — Full Construction

Build the COMPLETE Flower of Life, not just 13 circles. The full pattern has multiple rings:

**Ring 0 (centre):** 1 circle
**Ring 1:** 6 circles at radius R from centre, 60° apart
**Ring 2:** 12 circles at radius R×√3 and R×2, 30° offset
**Ring 3 (outer boundary):** Large circle encompassing everything

Total: 19 circles minimum for a recognisable Flower of Life.

Each circle should use the glowing technique. Where circles overlap, the intersections create natural bright points — this is the beauty of the pattern.

### Metatron's Cube — Full Construction

All 13 points connected with lines, PLUS the Flower of Life circles underneath at lower opacity. The lines glow brightly, the underlying circles glow dimly — creating depth and layers.

### Concentric Circles — Enhanced

Not just static rings. Each ring pulses at a slightly different phase offset, creating a ripple-outward effect:

```typescript
function drawConcentricRipples(ctx, cx, cy, baseRadius, numRings, time, beatFreq, colour) {
  for (let i = 0; i < numRings; i++) {
    const phaseOffset = (i / numRings) * Math.PI * 2;
    const pulse = Math.sin(time * beatFreq * Math.PI * 2 + phaseOffset);
    const r = baseRadius * (0.2 + (i / numRings) * 0.8) * (1 + pulse * 0.05);
    const opacity = 1 - (i / numRings) * 0.7; // inner rings brighter
    
    drawGlowingCircle(ctx, cx, cy, r, colour, opacity);
  }
}
```

8–12 concentric rings, each pulsing with a phase offset, creating a ripple emanating outward. This looks like a frequency visualisation — visually communicating "waves" to the user.

### Interaction with Session Controls

When visualisation is ON:
- Session controls get a darker semi-transparent background: `rgba(5,5,8,0.7)` with `backdrop-filter: blur(10px)`
- This ensures controls remain readable over the bright geometry
- Timer, volume slider, sleep timer, ambient buttons, sensor toggles — all still fully functional
- The visualisation canvas sits BEHIND everything at z-index: 0

### Toggle UI

Keep the toggle simple in session controls:

```
◎ Visualisation                    ○──
    [ Circles ]  [ Flower ]  [ Metatron ]
```

- Three pill buttons to select geometry type (not a dropdown — direct selection)
- Free: Circles only
- PRO: all three with lock icons on Flower and Metatron for free users

### Performance

- **30fps target** — use `setTimeout(renderLoop, 33)` instead of uncapped requestAnimationFrame
- **Stop rendering when hidden** — visibilitychange → pause canvas entirely
- **Reduce particle count on low-end devices** — if frame time exceeds 40ms, halve particle count
- **devicePixelRatio** — render at native resolution for crispness

### Test Checklist
- [ ] Guided Breathing is COMPLETELY removed — no UI, no code, no references
- [ ] Enabling visualisation transforms the session into full-screen immersive mode
- [ ] Background goes darker (#050508)
- [ ] Geometry GLOWS visibly — neon light effect, not thin faint lines
- [ ] Concentric Circles ripple outward with phase-offset pulsing
- [ ] Flower of Life renders complete pattern (19+ circles) with glow
- [ ] Metatron's Cube shows all connecting lines with Flower underneath
- [ ] Geometry pulses visibly with the beat frequency
- [ ] Pulse range is appropriate for each brainwave state (Delta=big slow, Gamma=tight shimmer)
- [ ] Slow continuous rotation visible (60s per revolution)
- [ ] Colours match brainwave state and are VIVID
- [ ] Colour transitions smoothly during session phases
- [ ] Particles emit from centre and drift outward
- [ ] Particles increase when ambient layers are playing
- [ ] Auto Motion / Phone Sensors add rotation to geometry
- [ ] Session controls remain readable over the visualisation
- [ ] Controls have dark blur background
- [ ] Geometry selector pills work (Circles/Flower/Metatron)
- [ ] Free users locked to Circles, PRO gets all three
- [ ] Performance is smooth on mobile (30fps, no jank)
- [ ] Canvas stops when screen locks (battery saving)
- [ ] WOW factor confirmed — first reaction should be "that's beautiful"
