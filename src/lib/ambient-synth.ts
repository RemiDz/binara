/**
 * Programmatic ambient sound generation using Web Audio API.
 * All sounds are synthesized client-side — zero bandwidth, works offline.
 */

const BUFFER_DURATION = 4; // seconds — loops seamlessly

export function generateAmbientBuffer(ctx: AudioContext, id: string): AudioBuffer {
  switch (id) {
    case 'white': return createWhiteNoise(ctx);
    case 'pink': return createPinkNoise(ctx);
    case 'brown': return createBrownNoise(ctx);
    case 'rain': return createRain(ctx);
    case 'ocean': return createOcean(ctx);
    case 'bowls': return createBowls(ctx);
    case 'forest': return createForest(ctx);
    case 'fireplace': return createFireplace(ctx);
    default: return createWhiteNoise(ctx);
  }
}

function createWhiteNoise(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate * BUFFER_DURATION;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return buffer;
}

function createPinkNoise(ctx: AudioContext): AudioBuffer {
  // Voss-McCartney algorithm
  const length = ctx.sampleRate * BUFFER_DURATION;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  return buffer;
}

function createBrownNoise(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate * BUFFER_DURATION;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
  }
  return buffer;
}

function createRain(ctx: AudioContext): AudioBuffer {
  // Filtered noise with amplitude modulation
  const length = ctx.sampleRate * BUFFER_DURATION;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      // Bandpass effect via simple IIR
      lastOut = lastOut * 0.95 + white * 0.05;
      // Amplitude modulation for rain texture
      const t = i / ctx.sampleRate;
      const mod = 0.7 + 0.3 * Math.sin(t * 2.3 + ch * 0.5) * Math.sin(t * 0.7);
      // Add sporadic droplet sounds
      const droplet = Math.random() > 0.9997 ? (Math.random() * 0.3) : 0;
      data[i] = (lastOut * mod + droplet) * 0.8;
    }
  }
  return buffer;
}

function createOcean(ctx: AudioContext): AudioBuffer {
  // Brown noise with slow LFO for wave-like rhythm
  const length = ctx.sampleRate * BUFFER_DURATION;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      const t = i / ctx.sampleRate;
      // Slow wave rhythm
      const wave = 0.4 + 0.6 * (Math.sin(t * Math.PI * 2 / BUFFER_DURATION + ch * 0.3) * 0.5 + 0.5);
      // Subtle high-frequency hiss for foam
      const foam = (Math.random() * 2 - 1) * 0.05 * Math.max(0, Math.sin(t * Math.PI * 2 / BUFFER_DURATION + 1));
      data[i] = (lastOut * 3.5 * wave + foam) * 0.7;
    }
  }
  return buffer;
}

function createBowls(ctx: AudioContext): AudioBuffer {
  // Sine oscillators at bowl frequencies with slow decay
  const length = ctx.sampleRate * BUFFER_DURATION;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  const frequencies = [396, 528, 639];
  const amplitudes = [0.15, 0.12, 0.08];

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / ctx.sampleRate;
      let sample = 0;
      for (let f = 0; f < frequencies.length; f++) {
        // Slight detuning per channel for width
        const freq = frequencies[f] + (ch === 0 ? -0.5 : 0.5) * (f + 1);
        const amp = amplitudes[f];
        // Gentle amplitude envelope
        const env = 0.6 + 0.4 * Math.sin(t * Math.PI * 2 / (BUFFER_DURATION * (f + 1)));
        sample += Math.sin(t * freq * Math.PI * 2) * amp * env;
      }
      data[i] = sample;
    }
  }
  return buffer;
}

function createForest(ctx: AudioContext): AudioBuffer {
  // High-pass filtered noise with sparse chirps
  const length = ctx.sampleRate * BUFFER_DURATION;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let prev = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      // Simple high-pass filter
      const hp = white - prev;
      prev = white;
      const t = i / ctx.sampleRate;
      // Gentle wind
      const wind = hp * 0.15 * (0.5 + 0.5 * Math.sin(t * 0.3 + ch));
      // Sparse bird chirps
      let chirp = 0;
      const chirpPhase = (t * 1.7 + ch * 0.5) % 1;
      if (chirpPhase < 0.03) {
        chirp = Math.sin(t * 2500 * (1 + 0.3 * Math.sin(t * 40))) * 0.06 * (1 - chirpPhase / 0.03);
      }
      data[i] = wind + chirp;
    }
  }
  return buffer;
}

function createFireplace(ctx: AudioContext): AudioBuffer {
  // Brown noise with random crackle impulses
  const length = ctx.sampleRate * BUFFER_DURATION;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      // Base rumble
      let sample = lastOut * 2.5;
      // Random crackles
      if (Math.random() > 0.9995) {
        const crackleLen = Math.floor(Math.random() * 200 + 50);
        for (let j = 0; j < crackleLen && (i + j) < length; j++) {
          const decay = 1 - j / crackleLen;
          data[i + j] += (Math.random() * 2 - 1) * 0.2 * decay;
        }
      }
      data[i] += sample * 0.5;
    }
  }
  return buffer;
}
