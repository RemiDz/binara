export type GeometryType = 'circles' | 'flower' | 'metatron';

export interface GeometryState {
  geometryType: GeometryType;
  scale: number;       // beat-driven or breathing-driven pulsing
  rotation: number;    // from motion sensors / auto motion (radians)
  colour: string;      // brainwave colour
  glowColour: string;
  glowIntensity: number;
  opacity: number;
  particleIntensity: number; // 0–1, from ambient volume
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

const MAX_PARTICLES = 40;
let particles: Particle[] = [];
let lastParticleSpawn = 0;

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawConcentricCircles(ctx: CanvasRenderingContext2D, radius: number, state: GeometryState): void {
  const rings = 7;
  ctx.strokeStyle = state.colour;
  ctx.lineWidth = 1;

  for (let i = 1; i <= rings; i++) {
    const r = (radius / rings) * i;
    ctx.globalAlpha = state.opacity * (0.3 + (i / rings) * 0.5);
    drawCircle(ctx, 0, 0, r);
  }
}

function drawFlowerOfLife(ctx: CanvasRenderingContext2D, radius: number, state: GeometryState): void {
  const r = radius / 3;
  ctx.strokeStyle = state.colour;
  ctx.lineWidth = 1;
  ctx.globalAlpha = state.opacity;

  // Centre circle
  drawCircle(ctx, 0, 0, r);

  // First ring: 6 circles
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    drawCircle(ctx, r * Math.cos(angle), r * Math.sin(angle), r);
  }

  // Second ring: 6 more circles
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    const x = r * Math.sqrt(3) * Math.cos(angle);
    const y = r * Math.sqrt(3) * Math.sin(angle);
    drawCircle(ctx, x, y, r);
  }
}

function drawMetatronsCube(ctx: CanvasRenderingContext2D, radius: number, state: GeometryState): void {
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
    points.push([r * Math.sqrt(3) * Math.cos(angle), r * Math.sqrt(3) * Math.sin(angle)]);
  }

  // Draw all connecting lines
  ctx.strokeStyle = state.colour;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = state.opacity * 0.4;

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      ctx.beginPath();
      ctx.moveTo(points[i][0], points[i][1]);
      ctx.lineTo(points[j][0], points[j][1]);
      ctx.stroke();
    }
  }

  // Draw circles on top
  ctx.globalAlpha = state.opacity * 0.7;
  ctx.lineWidth = 1;
  for (const [x, y] of points) {
    drawCircle(ctx, x, y, r * 0.3);
  }
}

function spawnParticles(cx: number, cy: number, radius: number, intensity: number, colour: string, now: number): void {
  if (now - lastParticleSpawn < 100 / intensity) return;
  if (particles.length >= MAX_PARTICLES) return;

  lastParticleSpawn = now;
  const angle = Math.random() * Math.PI * 2;
  const dist = radius * 0.3 + Math.random() * radius * 0.3;

  particles.push({
    x: cx + Math.cos(angle) * dist,
    y: cy + Math.sin(angle) * dist,
    vx: Math.cos(angle) * (0.2 + Math.random() * 0.3),
    vy: Math.sin(angle) * (0.2 + Math.random() * 0.3),
    life: 0,
    maxLife: 2 + Math.random() * 3,
    size: 1 + Math.random() * 1.5,
  });
}

function drawParticles(ctx: CanvasRenderingContext2D, cx: number, cy: number, state: GeometryState, dt: number): void {
  particles = particles.filter(p => {
    p.life += dt;
    if (p.life >= p.maxLife) return false;
    p.x += p.vx;
    p.y += p.vy;
    return true;
  });

  for (const p of particles) {
    const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.4 * state.particleIntensity;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = state.colour;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function renderGeometry(
  ctx: CanvasRenderingContext2D,
  state: GeometryState,
  dt: number, // delta time in seconds
): void {
  const { width, height } = ctx.canvas;
  const cx = width / 2;
  const cy = height / 2;
  const baseRadius = Math.min(width, height) * 0.35;
  const radius = baseRadius * state.scale;

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(state.rotation);

  // Glow layer
  ctx.shadowBlur = 20 * state.glowIntensity;
  ctx.shadowColor = state.glowColour;

  switch (state.geometryType) {
    case 'circles': drawConcentricCircles(ctx, radius, state); break;
    case 'flower': drawFlowerOfLife(ctx, radius, state); break;
    case 'metatron': drawMetatronsCube(ctx, radius, state); break;
  }

  ctx.restore();

  // Particles
  if (state.particleIntensity > 0) {
    spawnParticles(cx, cy, radius, state.particleIntensity, state.colour, performance.now());
    drawParticles(ctx, cx, cy, state, dt);
  }

  ctx.globalAlpha = 1;
}

/** Reset particle system (call when toggling off) */
export function resetParticles(): void {
  particles = [];
}
