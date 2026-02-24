/**
 * Generate placeholder PWA icons as simple PNGs
 * Run: node scripts/generate-icons.mjs
 *
 * Creates minimal placeholder icons using Canvas API.
 * Replace with polished designs before launch.
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const SIZES = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-192-maskable.png', size: 192, maskable: true },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

function generateIcon(size, maskable) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#050810';
  if (maskable) {
    ctx.fillRect(0, 0, size, size);
  } else {
    const radius = size * 0.15;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
  }

  // Cyan glow ring
  const cx = size / 2;
  const cy = size / 2;
  const glowRadius = size * 0.3;
  const gradient = ctx.createRadialGradient(cx, cy, glowRadius * 0.6, cx, cy, glowRadius);
  gradient.addColorStop(0, 'rgba(79, 195, 247, 0.15)');
  gradient.addColorStop(1, 'rgba(79, 195, 247, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Letter "B"
  const fontSize = maskable ? size * 0.4 : size * 0.5;
  ctx.fillStyle = '#4fc3f7';
  ctx.font = `500 ${fontSize}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', cx, cy + fontSize * 0.05);

  return canvas.toBuffer('image/png');
}

const publicDir = path.resolve('public');

for (const { name, size, maskable } of SIZES) {
  const buffer = generateIcon(size, maskable);
  fs.writeFileSync(path.join(publicDir, name), buffer);
  console.log(`Generated ${name} (${size}x${size})`);
}

// Generate favicon.ico (32x32 PNG — browsers handle PNG favicons fine)
const faviconBuffer = generateIcon(32, false);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconBuffer);
console.log('Generated favicon.ico (32x32)');

console.log('\nAll icons generated. Replace with polished designs before launch.');
