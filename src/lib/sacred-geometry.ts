// ─── Sacred Geometry Visualisation Engine ───
// Full-screen immersive renderer with triple-layer glow, particles, and beat-synced pulsing

export type GeometryType = 'circles' | 'flower' | 'metatron';

// ─── Vivid Brainwave Colour Palette ───

export interface VisColour {
  primary: string;
  glow: string;
  accent: string;
}

export const VIS_COLOURS: Record<string, VisColour> = {
  delta: { primary: '#8B6CE7', glow: '#A78BFA', accent: '#C4B5FD' },
  theta: { primary: '#A78BFA', glow: '#C084FC', accent: '#DDD6FE' },
  alpha: { primary: '#2DD4BF', glow: '#5EEAD4', accent: '#99F6E4' },
  beta:  { primary: '#FBBF24', glow: '#FCD34D', accent: '#FDE68A' },
  gamma: { primary: '#F87171', glow: '#FCA5A5', accent: '#FECACA' },
};

/** Map beat frequency to brainwave state name */
export function getBrainwaveStateFromFreq(freq: number): string {
  if (freq <= 4) return 'delta';
  if (freq <= 8) return 'theta';
  if (freq <= 14) return 'alpha';
  if (freq <= 30) return 'beta';
  return 'gamma';
}

/** Get interpolated colour for the current beat frequency */
export function getVisColour(beatFreq: number): VisColour {
  return VIS_COLOURS[getBrainwaveStateFromFreq(beatFreq)] ?? VIS_COLOURS.alpha;
}

/** Get beat-synced scale range for brainwave state */
export function getPulseRange(beatFreq: number): { min: number; max: number } {
  if (beatFreq <= 4) return { min: 0.85, max: 1.15 };   // Delta: 30% range
  if (beatFreq <= 8) return { min: 0.90, max: 1.10 };   // Theta: 20% range
  if (beatFreq <= 14) return { min: 0.93, max: 1.07 };  // Alpha: 14% range
  if (beatFreq <= 30) return { min: 0.96, max: 1.04 };  // Beta: 8% range
  return { min: 0.98, max: 1.02 };                       // Gamma: 4% shimmer
}

// ─── Triple-Layer Glow Drawing ───

function drawGlowingCircle(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  colour: string, glowColour: string,
  glowIntensity: number
): void {
  // Layer 1: Wide soft outer glow
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1;
  ctx.shadowBlur = 30 * glowIntensity;
  ctx.shadowColor = glowColour;
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

function drawGlowingLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  colour: string, glowColour: string,
  glowIntensity: number
): void {
  // Layer 1: Wide soft outer glow
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 0.5;
  ctx.shadowBlur = 25 * glowIntensity;
  ctx.shadowColor = glowColour;
  ctx.globalAlpha = 0.25 * glowIntensity;
  ctx.stroke();

  // Layer 2: Medium glow
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.shadowBlur = 12 * glowIntensity;
  ctx.globalAlpha = 0.45 * glowIntensity;
  ctx.stroke();

  // Layer 3: Crisp bright core
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.shadowBlur = 4 * glowIntensity;
  ctx.globalAlpha = 0.8 * glowIntensity;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// ─── Concentric Circles with Phase-Offset Ripples ───

function drawConcentricRipples(
  ctx: CanvasRenderingContext2D,
  baseRadius: number,
  time: number,
  beatFreq: number,
  colour: VisColour,
  glowIntensity: number,
): void {
  const numRings = 10;
  for (let i = 0; i < numRings; i++) {
    const phaseOffset = (i / numRings) * Math.PI * 2;
    const pulse = Math.sin(time * beatFreq * Math.PI * 2 + phaseOffset);
    const r = baseRadius * (0.15 + (i / numRings) * 0.85) * (1 + pulse * 0.05);
    const ringGlow = glowIntensity * (1 - (i / numRings) * 0.6); // inner rings brighter
    drawGlowingCircle(ctx, 0, 0, r, colour.primary, colour.glow, ringGlow);
  }
}

// ─── Flower of Life — Full Construction (19+ circles) ───

function drawFlowerOfLife(
  ctx: CanvasRenderingContext2D,
  baseRadius: number,
  colour: VisColour,
  glowIntensity: number,
): void {
  const R = baseRadius / 3;

  // Ring 0: centre circle
  drawGlowingCircle(ctx, 0, 0, R, colour.primary, colour.glow, glowIntensity);

  // Ring 1: 6 circles at distance R, 60 degrees apart
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x = R * Math.cos(angle);
    const y = R * Math.sin(angle);
    drawGlowingCircle(ctx, x, y, R, colour.primary, colour.glow, glowIntensity);
  }

  // Ring 2: 6 circles at distance R*sqrt(3), offset 30 degrees
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    const x = R * Math.sqrt(3) * Math.cos(angle);
    const y = R * Math.sqrt(3) * Math.sin(angle);
    drawGlowingCircle(ctx, x, y, R, colour.primary, colour.glow, glowIntensity * 0.85);
  }

  // Ring 2b: 6 more circles at distance 2R, aligned with ring 1
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x = 2 * R * Math.cos(angle);
    const y = 2 * R * Math.sin(angle);
    drawGlowingCircle(ctx, x, y, R, colour.primary, colour.glow, glowIntensity * 0.7);
  }

  // Ring 3: outer boundary circle
  drawGlowingCircle(ctx, 0, 0, R * 3, colour.primary, colour.glow, glowIntensity * 0.4);
}

// ─── Metatron's Cube — Full Construction ───

function drawMetatronsCube(
  ctx: CanvasRenderingContext2D,
  baseRadius: number,
  colour: VisColour,
  glowIntensity: number,
): void {
  const R = baseRadius / 3;

  // Build all 13 points
  const points: [number, number][] = [[0, 0]];

  // Inner ring: 6 points at R
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    points.push([R * Math.cos(angle), R * Math.sin(angle)]);
  }

  // Outer ring: 6 points at 2R
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    points.push([2 * R * Math.cos(angle), 2 * R * Math.sin(angle)]);
  }

  // Draw Flower of Life underneath at low opacity
  const dimGlow = glowIntensity * 0.3;
  drawGlowingCircle(ctx, 0, 0, R, colour.primary, colour.glow, dimGlow);
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    drawGlowingCircle(ctx, R * Math.cos(angle), R * Math.sin(angle), R, colour.primary, colour.glow, dimGlow);
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    drawGlowingCircle(ctx, R * Math.sqrt(3) * Math.cos(angle), R * Math.sqrt(3) * Math.sin(angle), R, colour.primary, colour.glow, dimGlow * 0.7);
  }

  // Draw all connecting lines between 13 points
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      drawGlowingLine(
        ctx,
        points[i][0], points[i][1],
        points[j][0], points[j][1],
        colour.primary, colour.glow,
        glowIntensity * 0.6,
      );
    }
  }

  // Draw small circles at each vertex
  for (const [x, y] of points) {
    drawGlowingCircle(ctx, x, y, R * 0.12, colour.accent, colour.glow, glowIntensity);
  }
}

// ─── Particle System ───

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
let particles: Particle[] = [];
let lastEmitTime = 0;

function emitParticle(cx: number, cy: number): Particle {
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

function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  colour: string,
  ambientActive: boolean,
  now: number,
): void {
  // Emit particles: ~3/sec base, ~6/sec with ambient
  const emitInterval = ambientActive ? 167 : 333; // ms
  if (now - lastEmitTime > emitInterval && particles.length < MAX_PARTICLES) {
    particles.push(emitParticle(cx, cy));
    lastEmitTime = now;
  }

  // Update and draw
  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.003; // ~5 seconds at 60fps, ~10 seconds at 30fps — adjusted below
    return p.life > 0;
  });

  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = colour;
    ctx.globalAlpha = p.opacity * p.life;
    ctx.shadowBlur = 8;
    ctx.shadowColor = colour;
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// ─── Main Render Function ───

export interface RenderState {
  geometryType: GeometryType;
  beatFreq: number;
  time: number;            // monotonic seconds (for pulsing/rotation)
  scale: number;           // beat-driven scale
  glowIntensity: number;   // 0.5–1.0 pulsing
  rotation: number;        // total rotation in radians (base + sensor)
  ambientActive: boolean;
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
): void {
  const { width, height } = ctx.canvas;
  const dpr = window.devicePixelRatio || 1;
  const w = width / dpr;
  const h = height / dpr;
  const cx = w / 2;
  const cy = h / 2;
  const baseRadius = Math.min(w, h) * 0.35;
  const radius = baseRadius * state.scale;

  const colour = getVisColour(state.beatFreq);

  // Clear with deep black
  ctx.clearRect(0, 0, w, h);

  // Draw geometry
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(state.rotation);

  switch (state.geometryType) {
    case 'circles':
      drawConcentricRipples(ctx, radius, state.time, state.beatFreq, colour, state.glowIntensity);
      break;
    case 'flower':
      drawFlowerOfLife(ctx, radius, colour, state.glowIntensity);
      break;
    case 'metatron':
      drawMetatronsCube(ctx, radius, colour, state.glowIntensity);
      break;
  }

  ctx.restore();

  // Particles
  updateAndDrawParticles(ctx, cx, cy, colour.accent, state.ambientActive, performance.now());
}

/** Reset particle system (call when toggling off) */
export function resetParticles(): void {
  particles = [];
  lastEmitTime = 0;
}
