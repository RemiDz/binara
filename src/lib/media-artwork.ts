/**
 * Generate branded media artwork for lock screen / Media Session API.
 * Creates a canvas-rendered dark gradient with "BINARA" branding.
 */

const ARTWORK_CACHE = new Map<number, string>();

export function generateMediaArtwork(size: number): string {
  // Return cached version if available
  const cached = ARTWORK_CACHE.get(size);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#050810');
  grad.addColorStop(1, '#0a1628');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle radial glow
  const glow = ctx.createRadialGradient(
    size / 2, size * 0.4, 0,
    size / 2, size * 0.4, size * 0.5
  );
  glow.addColorStop(0, 'rgba(79, 195, 247, 0.06)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // "BINARA" text
  const titleSize = Math.round(size * 0.12);
  ctx.font = `600 ${titleSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'center';
  ctx.letterSpacing = `${size * 0.02}px`;
  ctx.fillText('BINARA', size / 2, size * 0.42);

  // Frequency wave line
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(79, 195, 247, 0.4)';
  ctx.lineWidth = size * 0.005;
  const waveY = size * 0.55;
  const waveAmplitude = size * 0.04;
  const waveWidth = size * 0.6;
  const startX = (size - waveWidth) / 2;
  for (let x = 0; x <= waveWidth; x++) {
    const normalX = x / waveWidth;
    const y = waveY + Math.sin(normalX * Math.PI * 4) * waveAmplitude * Math.sin(normalX * Math.PI);
    if (x === 0) ctx.moveTo(startX + x, y);
    else ctx.lineTo(startX + x, y);
  }
  ctx.stroke();

  // "Binaural Beats" subtitle
  const subSize = Math.round(size * 0.055);
  ctx.font = `300 ${subSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.letterSpacing = `${size * 0.01}px`;
  ctx.fillText('Binaural Beats', size / 2, size * 0.66);

  const url = canvas.toDataURL('image/png');
  ARTWORK_CACHE.set(size, url);
  return url;
}

export function getMediaArtwork(): MediaImage[] {
  return [
    { src: generateMediaArtwork(96), sizes: '96x96', type: 'image/png' },
    { src: generateMediaArtwork(256), sizes: '256x256', type: 'image/png' },
    { src: generateMediaArtwork(512), sizes: '512x512', type: 'image/png' },
  ];
}
