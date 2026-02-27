# Fix: Create Mode Audio Still Not Playing on First Tap

## The Bug (still present after race condition fix)

When the user opens the app, goes to Create mode, and taps "Tap to start playing" — no audio. But if they switch to Mix mode and back to Create, then tap Play, it works. The race condition fix (clearing stopTimeout + resuming suspended context) is in place but hasn't resolved this.

## Diagnosis

The issue is likely that the AudioContext needs more aggressive handling. Multiple potential causes:

1. AudioContext may be in 'suspended' state and ctx.resume() might need to be called BEFORE creating oscillators, with a brief wait for it to actually transition to 'running'
2. The `_isPaused` flag from a previous session might block audio processing
3. The masterGain might need re-initialisation after context resume

## Required Changes

### 1. In `src/lib/audio-engine.ts` — Make `startPreview` bulletproof

Replace the current `startPreview` method with this more defensive version:

```typescript
async startPreview(config: AdvancedSessionConfig): Promise<void> {
  // Ensure audio engine is initialised
  if (!this.ctx || !this.compressor) {
    await this.init();
  }

  // Cancel any pending stop timeout from a previous stopPreview/stopAdvanced
  if (this.stopTimeout) {
    clearTimeout(this.stopTimeout);
    this.stopTimeout = null;
  }

  // Stop any existing playback cleanly BEFORE resuming context
  if (this._isPlaying) {
    if (this._advancedMode) {
      this.stopAdvancedImmediate();
    } else {
      this.stopImmediate();
    }
  }

  // Clear paused flag — crucial: if a previous session called pause(),
  // the context is suspended and _isPaused is true
  this._isPaused = false;

  // Force AudioContext to running state
  // This handles: auto-suspend by browser, previous pause(), iOS policies
  if (this.ctx!.state !== 'running') {
    try {
      await this.ctx!.resume();
    } catch (e) {
      console.warn('Failed to resume AudioContext:', e);
    }
    // Give the context a moment to actually start processing
    // Some browsers (especially mobile Safari) need this
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Double-check context is running
  if (this.ctx!.state !== 'running') {
    console.warn('AudioContext still not running after resume, state:', this.ctx!.state);
    // Try one more time
    try {
      await this.ctx!.resume();
    } catch { /* ignore */ }
  }

  // Re-verify masterGain is connected (safety net)
  if (this.masterGain && this.compressor) {
    try {
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx!.destination);
    } catch {
      // Already connected — this is fine
    }
  }

  // Set up beat layers
  await this.playAdvanced(config.layers);

  // Enable subsystems from config
  if (config.filter.enabled) {
    this.enableFilter(config.filter);
  }
  if (config.stereo.enabled) {
    this.setStereoWidth(config.stereo.width);
    this.setStereoOffset(config.stereo.pan);
    if (config.stereo.crossfeed > 0) {
      this.setCrossfeed(config.stereo.crossfeed);
    }
    if (config.stereo.rotation) {
      this.enableSpatialRotation(config.stereo.rotationSpeed);
    }
  }
  if (config.lfo.enabled) {
    this.enableLFO(config.lfo);
  }
  if (config.isochronic.enabled) {
    this.enableIsochronic(config.isochronic);
  }

  this._isPreviewMode = true;
}
```

### 2. In `src/lib/audio-engine.ts` — Also make `playAdvanced` resume context

At the top of `playAdvanced()`, after the `init()` check, add the same context resume:

```typescript
async playAdvanced(layers: BeatLayer[]): Promise<void> {
  if (!this.ctx || !this.compressor) {
    await this.init();
  }

  // Ensure context is running (may have been suspended)
  if (this.ctx!.state !== 'running') {
    try {
      await this.ctx!.resume();
    } catch { /* ignore */ }
  }

  if (this._isPlaying) {
    this.stopImmediate();
  }

  // ... rest unchanged
```

### 3. In `src/hooks/useAudioEngine.ts` — Ensure startPreview also resets paused state

The hook's `startPreview` should also make sure it's not in a paused state:

Find the current `startPreview` callback and ensure it looks like:

```typescript
const startPreview = useCallback(async (config: AdvancedSessionConfig) => {
  const engine = getEngine();
  if (!engine.isInitialized) await engine.init();
  await engine.startPreview(config);
  setIsPlaying(true);
  setIsPaused(false);
  setIsInitialized(true);
}, [getEngine]);
```

This should already be correct from the previous fix, just verify.

## Summary

The key defensive additions are:
1. Clear `_isPaused = false` before resuming context
2. Wait 50ms after `ctx.resume()` for the browser to actually start processing
3. Double-retry `ctx.resume()` if first attempt doesn't work
4. Re-verify masterGain → destination connection
5. Also resume context in `playAdvanced()` as a safety net

These are belt-and-suspenders fixes. The 50ms wait after resume is the most likely one to solve the issue — mobile browsers often need a tick to actually transition the AudioContext from 'suspended' to 'running'.

## Test

1. Fresh page load → complete onboarding → tap Create → tap Play → audio should start IMMEDIATELY
2. Create playing → Stop → Play again → works
3. Create playing → switch to Mix → switch back to Create → Play → works  
4. Create playing → switch to Listen → play a preset → stop → switch to Create → Play → works
5. Lock phone → unlock → Create mode → Play → works
