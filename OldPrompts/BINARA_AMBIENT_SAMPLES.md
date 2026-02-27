# BINARA — Sample-Based Ambient Layer Implementation

## Overview

Replace ALL synthesised ambient layer sounds with real audio recordings stored in `/public/audio/ambient/`. The user interface stays the same — ambient layer buttons in Listen, Mix, and Create modes. The only change is the audio source: from Web Audio synthesis to looping OGG sample playback.

---

## Audio Files Available

These files exist in `/public/audio/ambient/`:

```
morning-birds.ogg
forest-birds.ogg
forest-singing.ogg
thunder-rain.ogg
fire-crackling.ogg
ocean-waves.ogg
wind-birds.ogg
wild-birds.ogg
stream-flowing.ogg
night-crickets.ogg
```

---

## Ambient Layer Registry

Create a registry that maps ambient layer IDs to their audio files and display metadata. This replaces any existing ambient sound synthesis definitions:

```typescript
interface AmbientLayer {
  id: string;
  label: string;           // Display name in the UI button
  file: string;            // Path relative to /public/audio/ambient/
  icon?: string;           // Optional icon/emoji for the button (keep existing if present)
  category?: string;       // Optional grouping
}

const AMBIENT_LAYERS: AmbientLayer[] = [
  { id: "fire",           label: "Fire",           file: "fire-crackling.ogg" },
  { id: "forest",         label: "Forest",         file: "forest-birds.ogg" },
  { id: "forest-singing", label: "Forest Singing",  file: "forest-singing.ogg" },
  { id: "morning-birds",  label: "Morning Birds",   file: "morning-birds.ogg" },
  { id: "wild-birds",     label: "Wild Birds",      file: "wild-birds.ogg" },
  { id: "wind",           label: "Wind",            file: "wind-birds.ogg" },
  { id: "ocean",          label: "Ocean",           file: "ocean-waves.ogg" },
  { id: "rain",           label: "Rain & Thunder",  file: "thunder-rain.ogg" },
  { id: "stream",         label: "Stream",          file: "stream-flowing.ogg" },
  { id: "night",          label: "Night Crickets",   file: "night-crickets.ogg" },
];
```

If the existing app already has ambient layer IDs/names, keep those IDs where possible and just remap them to the new files. The goal is to avoid breaking any existing references in presets or saved user configurations.

---

## Audio Playback Architecture

### Loading

- Use `fetch()` + `AudioContext.decodeAudioData()` to load OGG files into AudioBuffers
- **Lazy load** — only fetch/decode a file when the user first taps that ambient layer button. Do NOT preload all 10 files on app start.
- **Cache decoded buffers** — once decoded, store the AudioBuffer in a Map so subsequent plays are instant. Never decode the same file twice.

```typescript
const bufferCache = new Map<string, AudioBuffer>();

async function loadAmbientBuffer(audioCtx: AudioContext, file: string): Promise<AudioBuffer> {
  if (bufferCache.has(file)) {
    return bufferCache.get(file)!;
  }
  const response = await fetch(`/audio/ambient/${file}`);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  bufferCache.set(file, audioBuffer);
  return audioBuffer;
}
```

### Playback (Looping)

- Create an `AudioBufferSourceNode` for playback
- Set `source.loop = true` — this loops the entire buffer seamlessly
- Connect to the **ambient gain node** (NOT to the beat effects chain — see routing below)
- Store a reference to the active source node so it can be stopped

```typescript
interface ActiveAmbient {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
}

const activeAmbients = new Map<string, ActiveAmbient>();

function startAmbient(audioCtx: AudioContext, ambientGain: GainNode, id: string, buffer: AudioBuffer) {
  // Stop existing instance of this layer if playing
  stopAmbient(id);

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Per-layer gain for individual volume control
  const layerGain = audioCtx.createGain();
  layerGain.gain.value = 0.5; // Default 50% — adjustable by user

  // Fade in over 1 second to avoid click
  layerGain.gain.setValueAtTime(0, audioCtx.currentTime);
  layerGain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 1.0);

  source.connect(layerGain);
  layerGain.connect(ambientGain);  // ambientGain → destination (see routing)
  source.start();

  activeAmbients.set(id, { source, gainNode: layerGain });
}

function stopAmbient(id: string) {
  const active = activeAmbients.get(id);
  if (active) {
    // Fade out over 0.5s to avoid click
    const now = active.gainNode.context.currentTime;
    active.gainNode.gain.setValueAtTime(active.gainNode.gain.value, now);
    active.gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
    // Stop source after fade completes
    active.source.stop(now + 0.5);
    activeAmbients.delete(id);
  }
}

function stopAllAmbients() {
  activeAmbients.forEach((_, id) => stopAmbient(id));
}
```

### Volume Control

- Each ambient layer has its own GainNode for individual volume
- The UI volume slider for each layer adjusts `layerGain.gain.value`
- If there is a master ambient volume control, it adjusts the shared `ambientGain` node

```typescript
function setAmbientVolume(id: string, volume: number) {
  const active = activeAmbients.get(id);
  if (active) {
    active.gainNode.gain.setTargetAtTime(volume, active.gainNode.context.currentTime, 0.05);
  }
}
```

---

## CRITICAL: Audio Routing

Ambient layers MUST be completely separate from the binaural beat effects chain. This is essential — effects like filter, LFO, isochronic gating, and stereo panning in Create mode must NOT affect ambient sounds.

```
CORRECT ROUTING:

[Beat Oscillators] → [Effects Chain (filter/LFO/isochronic/stereo)] → [Beat Gain] → [Compressor] → [Destination]

[Ambient Source 1] → [Layer Gain 1] ─┐
[Ambient Source 2] → [Layer Gain 2] ─┤→ [Ambient Master Gain] → [Compressor] → [Destination]
[Ambient Source N] → [Layer Gain N] ─┘
```

The `ambientGain` node connects to the final compressor/limiter (shared with the beat path for overall volume protection) but does NOT pass through any of the beat effects nodes.

If the current codebase already has this routing from the BINARA_AMBIENT_FIXES spec, then simply plug the new sample-based sources into the existing ambient gain node. If not, create the separate routing as part of this change.

---

## UI Behaviour

### Button States

Each ambient layer button has three states:

1. **Idle** — not playing, not loading. Default appearance.
2. **Loading** — user tapped, file is being fetched/decoded. Show a subtle loading indicator (spinner, pulse animation, or opacity change). This only happens on first tap — subsequent taps use the cached buffer and are instant.
3. **Active/Playing** — looping. Visually highlighted (glow, colour change, or icon animation to indicate it's on).

### Toggle Behaviour

- **Tap to start** — loads (if needed) and plays the ambient layer as a loop
- **Tap again to stop** — fades out and stops the layer
- **Multiple layers can play simultaneously** — user can have fire + rain + wind all playing at once

### Volume Per Layer

- If the existing UI has per-layer volume sliders, wire them to `setAmbientVolume()`
- If not, the default 50% volume is fine for now

### Stopping

- When the user stops the main binaural beat session, also call `stopAllAmbients()`
- When switching between Listen/Mix/Create modes, ambient layers should stop (or persist — match the existing behaviour)

---

## What Stays as Synthesis (DO NOT REMOVE)

Some ambient layers are better as synthesis — keep these exactly as they are:

- ✅ **Singing Bowls** — oscillator-based tonal synthesis. Keep existing code.
- ✅ **White Noise** — generated via AudioBuffer with random samples. Keep existing code.
- ✅ **Pink Noise** — filtered white noise (-3dB/octave). Keep existing code.
- ✅ **Brown Noise** — filtered white noise (-6dB/octave). Keep existing code.

These synthesised layers must also follow the same routing rule: connect to `ambientGain`, NOT to the beat effects chain.

## What to Remove (Replace with Samples)

- ❌ Fire synthesis code — replaced by `fire-crackling.ogg`
- ❌ Forest / bird synthesis code — replaced by sample files
- ❌ Rain synthesis code — replaced by `thunder-rain.ogg`
- ❌ Ocean / waves synthesis code — replaced by `ocean-waves.ogg`
- ❌ Wind synthesis code — replaced by `wind-birds.ogg`
- ❌ Stream / water synthesis code — replaced by `stream-flowing.ogg`
- ❌ Cricket / night synthesis code — replaced by `night-crickets.ogg`
- ❌ Any other nature-sound synthesis that now has an OGG sample replacement

Keep the ambient UI components, buttons, volume controls, and routing infrastructure. The synthesised layers (bowls, white/pink/brown noise) and the sample-based layers (nature sounds) should coexist in the same UI, using the same ambient gain routing.

---

## What NOT to Touch

- ✅ Binaural beat oscillator code — unchanged
- ✅ Effects chain (filter, LFO, isochronic, stereo) — unchanged
- ✅ Beat playback logic in Listen/Mix/Create — unchanged
- ✅ Timer/session logic — unchanged
- ✅ UI layout and styling — unchanged (unless ambient button count changes)

---

## Error Handling

- If a file fails to load (404, network error), catch the error and show the button in an error state. Do not crash the app.
- Log the error: `console.error(`Failed to load ambient: ${file}`, error)`
- The user should still be able to play other ambient layers and the main beat.

---

## Test Checklist

### Basic Playback
- [ ] Tap each of the 10 ambient layer buttons — each plays its corresponding OGG file
- [ ] Audio loops seamlessly with no gap or click at the loop point
- [ ] Tap an active layer again — it fades out and stops
- [ ] Multiple layers can play simultaneously (e.g. fire + stream + night)
- [ ] First tap shows brief loading state, subsequent taps are instant

### Volume
- [ ] Per-layer volume control works (if UI exists)
- [ ] Master ambient volume control works (if UI exists)
- [ ] Volume changes are smooth (no clicks or jumps)

### Routing (CRITICAL)
- [ ] In Create mode: play an ambient layer, then toggle filter ON — ambient sound is NOT affected
- [ ] In Create mode: play an ambient layer, then toggle LFO ON — ambient sound is NOT affected
- [ ] In Create mode: play an ambient layer, then toggle isochronic ON — ambient sound is NOT affected
- [ ] In Create mode: play an ambient layer, then toggle stereo ON — ambient sound is NOT affected
- [ ] Beat effects only affect beat oscillators, never ambient layers

### Fade In/Out
- [ ] Starting a layer fades in smoothly over ~1 second (no abrupt start)
- [ ] Stopping a layer fades out smoothly over ~0.5 seconds (no abrupt cut)

### Session Integration
- [ ] Stopping the main session also stops all ambient layers
- [ ] Starting a new preset/session clears any previously playing ambient layers

### Error Handling
- [ ] If an OGG file is missing or corrupted, the app does not crash
- [ ] Other ambient layers still work if one fails to load

### Synthesised Layers (No Regression)
- [ ] Singing Bowls still play correctly
- [ ] White Noise still plays correctly
- [ ] Pink Noise still plays correctly
- [ ] Brown Noise still plays correctly
- [ ] Synthesised layers also route through ambientGain (not effects chain)
- [ ] Synthesised layers can play simultaneously with sample-based layers

### Cross-Mode
- [ ] Ambient layers work in Listen mode with presets
- [ ] Ambient layers work in Mix mode
- [ ] Ambient layers work in Create mode
- [ ] Audio quality sounds natural and high-quality — no synthesis artefacts
