# Fix: Create Mode Beat Oscillators Silent — V4

## The Bug (STILL present after V3)

Create mode: tap Play → "Playing" indicator shows but **no audio from beat oscillators**. Ambient layers and isochronic tones play fine when enabled. Stop → Play again sometimes fixes it.

## Root Cause Analysis

Ambient and isochronic connect directly to `this.compressor` and work. Beat oscillators connect through `beatSumGain → compressor` and are silent. The audio graph chain from compressor → masterGain → destination is proven working (ambient/iso play).

The actual problem is the **gain fade-in ramp** in `createBeatLayerNodes`:

```typescript
gainL.gain.setValueAtTime(0, now);           // set to 0 at "now"
gainL.gain.linearRampToValueAtTime(0.5, now + 2);  // ramp to 0.5 over 2s
```

`now` is captured as `ctx.currentTime` but by the time the ramp is actually processed by the audio thread, `ctx.currentTime` has already moved past `now`. The `setValueAtTime(0, now)` is in the past. On many browsers (especially mobile Safari/Chrome), a `linearRampToValueAtTime` whose anchor `setValueAtTime` is in the past results in the gain staying at 0 — the ramp never starts.

This explains why:
- **Second play works**: After stop+play, the AudioContext has been running longer, timing is more predictable, and the code path is faster (no init, no delays)
- **Ambient works**: Ambient synths set gain immediately, no ramp from 0
- **Isochronic works**: Uses a pulse scheduler that sets gain via `setTargetAtTime`, not `linearRampToValueAtTime`

## The Fix

### File: `src/lib/audio-engine.ts`

### Change 1: Fix `createBeatLayerNodes` — use fresh currentTime and `setTargetAtTime` instead of `linearRampToValueAtTime`

Replace the current gain scheduling in `createBeatLayerNodes`:

```typescript
private createBeatLayerNodes(layer: BeatLayer): void {
    const ctx = this.ctx!;
    const vol = layer.volume / 100;
    const width = this._stereoWidth / 100;

    const oscL = ctx.createOscillator();
    oscL.type = layer.waveform;
    oscL.frequency.setValueAtTime(layer.carrierFreq, ctx.currentTime);

    const gainL = ctx.createGain();
    // Start at a small non-zero value and ramp up using setTargetAtTime
    // (more reliable than linearRampToValueAtTime across browsers)
    gainL.gain.value = 0.001;
    gainL.gain.setTargetAtTime(0.5, ctx.currentTime, 0.5);

    const panL = ctx.createStereoPanner();
    panL.pan.setValueAtTime(-width, ctx.currentTime);

    const oscR = ctx.createOscillator();
    oscR.type = layer.waveform;
    oscR.frequency.setValueAtTime(layer.carrierFreq + layer.beatFreq, ctx.currentTime);

    const gainR = ctx.createGain();
    gainR.gain.value = 0.001;
    gainR.gain.setTargetAtTime(0.5, ctx.currentTime, 0.5);

    const panR = ctx.createStereoPanner();
    panR.pan.setValueAtTime(width, ctx.currentTime);

    const layerGain = ctx.createGain();
    layerGain.gain.value = vol;

    // Wire: osc → gain → pan → layerGain → beatSumGain
    oscL.connect(gainL);
    gainL.connect(panL);
    panL.connect(layerGain);

    oscR.connect(gainR);
    gainR.connect(panR);
    panR.connect(layerGain);

    layerGain.connect(this.beatSumGain!);

    oscL.start();
    oscR.start();

    this.beatLayers.set(layer.id, { oscL, oscR, gainL, gainR, panL, panR, layerGain });
  }
```

Key changes:
1. **`gain.value = 0.001`** instead of `setValueAtTime(0, now)` — sets gain directly on the AudioParam, no scheduling, no timing issues
2. **`setTargetAtTime(0.5, ctx.currentTime, 0.5)`** instead of `linearRampToValueAtTime(0.5, now + 2)` — exponential approach, much more reliable cross-browser because it doesn't require a preceding anchor event
3. **`layerGain.gain.value = vol`** instead of `setValueAtTime(vol, now)` — direct assignment
4. **`oscL.start()`** with no argument instead of `oscL.start(now)` — starts immediately, no timing dependency
5. **Use `ctx.currentTime` inline** instead of caching `now` — always fresh

### Change 2: Also fix `playAdvanced` — use fresh currentTime for beatSumGain

```typescript
// In playAdvanced, change:
this.beatSumGain.gain.setValueAtTime(1, now);
// To:
this.beatSumGain.gain.value = 1;
```

### Change 3: Remove the 100ms delay from `startPreview`

The V3 delay was a misdiagnosis. Remove it — it only adds latency:

```typescript
// DELETE these lines from startPreview:
// Small delay to let the audio session activate
await new Promise(resolve => setTimeout(resolve, 100));
```

### Change 4: Also move `startSilentAudioElement` back to after oscillators in `playAdvanced`

The V3 reorder was also a misdiagnosis. Restore original order:

```typescript
async playAdvanced(layers: BeatLayer[]): Promise<void> {
    // ... init, resume, stopImmediate guards stay the same ...

    const ctx = this.ctx!;

    // Create sum gain for all beat layers
    this.beatSumGain = ctx.createGain();
    this.beatSumGain.gain.value = 1;
    this.beatSumGain.connect(this.compressor!);

    // Create each beat layer
    for (const layer of layers) {
      this.createBeatLayerNodes(layer);
    }

    this._advancedMode = true;
    this._isPlaying = true;
    this._isPaused = false;
    this.startTime = ctx.currentTime;
    this.pauseOffset = 0;
    this.wallStartTime = Date.now();
    this.wallPauseOffset = 0;

    this.startKeepAlive();
    this.startSilentAudioElement();
  }
```

### Change 5: Add diagnostic console.log (temporary — remove later)

Add this at the end of `startPreview`, after all subsystems are enabled:

```typescript
// Diagnostic — remove after confirming fix
console.log('[Binara Audio Debug]', {
  ctxState: this.ctx?.state,
  ctxTime: this.ctx?.currentTime,
  isPlaying: this._isPlaying,
  advancedMode: this._advancedMode,
  previewMode: this._isPreviewMode,
  beatLayerCount: this.beatLayers.size,
  beatSumGainConnected: !!this.beatSumGain,
  compressorConnected: !!this.compressor,
  masterGainValue: this.masterGain?.gain.value,
  masterGainConnected: !!this.masterGain,
});
```

## Why This Fixes It

`linearRampToValueAtTime` requires a precisely-timed anchor event (`setValueAtTime`) that must be at or before the current time. With async delays, React re-renders, and browser event loop jitter, the cached `now` value is frequently in the past by the time the audio thread processes the automation. This causes the gain to stay at 0 indefinitely.

`setTargetAtTime` doesn't have this problem — it starts ramping from the current value towards the target as soon as `ctx.currentTime` reaches the start time, with no dependency on a preceding anchor event. And setting `.value` directly always works regardless of timing.

## Test Checklist

1. Fresh load → Create → tap Play → **audio starts immediately**
2. Check console: all debug values look correct (ctxState: 'running', beatLayerCount: 1, etc.)
3. Ambient toggle → plays alongside beats
4. Isochronic toggle → plays alongside beats
5. Stop → Play → works
6. Mode switch → back to Create → Play → works
7. Adjust beat frequency slider while playing → hear change live
8. Add second layer → hear it layer in
