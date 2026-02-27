# Fix: Create Mode Audio Not Playing / Dying After Mode Switch

## The Bug

When opening Create mode and tapping "Tap to start playing", no audio plays. When toggling between modes (Mix/Listen) and back to Create, audio starts for ~1 second then goes silent.

## Root Cause: Race Condition in stopAdvanced + startPreview

There are TWO issues:

### Issue 1: stopAdvanced has a 1800ms delayed cleanup that races with new startPreview

`stopAdvanced()` (in `src/lib/audio-engine.ts` ~line 577) fades out audio over 300ms then sets a `setTimeout` for 1800ms to call `stopAdvancedImmediate()`. But if the user starts a new preview within that 1800ms window, the old timeout fires and kills the new audio graph.

`startPreview()` tries to guard against this by calling `stopAdvancedImmediate()` first if `_isPlaying` is true — but by the time the user re-enters Create mode, the engine state may be inconsistent (fade-out running, nodes partially disconnected, etc).

### Issue 2: stopPreview in the hook has a 2000ms setTimeout for React state

In `src/hooks/useAudioEngine.ts` (~line 241), `stopPreview` calls `engine.stopPreview()` then waits 2000ms before setting React `isPlaying = false`. This creates a window where the hook thinks audio is still playing but the engine is shutting down.

## The Fix

### In `src/lib/audio-engine.ts`:

**1. In `startPreview()` — always clear any pending stop timeout first, regardless of `_isPlaying` state:**

At the very top of `startPreview()`, before the `if (this._isPlaying)` check, add:

```typescript
// Cancel any pending stop from a previous stopAdvanced/stopPreview
if (this.stopTimeout) {
  clearTimeout(this.stopTimeout);
  this.stopTimeout = null;
}
```

**2. In `startPreview()` — also resume AudioContext if it's suspended:**

After the `init()` check, add:

```typescript
if (this.ctx && this.ctx.state === 'suspended') {
  await this.ctx.resume();
}
```

So the full top of `startPreview()` should look like:

```typescript
async startPreview(config: AdvancedSessionConfig): Promise<void> {
  if (!this.ctx || !this.compressor) {
    await this.init();
  }

  // Resume AudioContext if suspended (e.g. after a previous session/pause)
  if (this.ctx && this.ctx.state === 'suspended') {
    await this.ctx.resume();
  }

  // Cancel any pending stop timeout from a previous stopPreview/stopAdvanced
  if (this.stopTimeout) {
    clearTimeout(this.stopTimeout);
    this.stopTimeout = null;
  }

  // Stop any existing playback cleanly
  if (this._isPlaying) {
    if (this._advancedMode) {
      this.stopAdvancedImmediate();
    } else {
      this.stopImmediate();
    }
  }

  // Set up beat layers
  await this.playAdvanced(config.layers);

  // ... rest of the method unchanged
```

### In `src/hooks/useAudioEngine.ts`:

**3. In `stopPreview` — set React `isPlaying` to false immediately, not after 2000ms delay:**

Change the `stopPreview` callback from:

```typescript
const stopPreview = useCallback(() => {
  engineRef.current?.stopPreview();
  setTimeout(() => {
    setIsPlaying(false);
    setIsPaused(false);
  }, 2000);
}, []);
```

To:

```typescript
const stopPreview = useCallback(() => {
  engineRef.current?.stopPreview();
  setIsPlaying(false);
  setIsPaused(false);
}, []);
```

The engine handles its own fade-out timing internally — the React state should reflect reality immediately so there's no confusion about whether audio is "still playing" during cleanup.

## Summary of Changes

| File | Change |
|------|--------|
| `src/lib/audio-engine.ts` | In `startPreview()`: clear `stopTimeout` + resume suspended AudioContext before doing anything else |
| `src/hooks/useAudioEngine.ts` | In `stopPreview()`: set React state immediately instead of after 2000ms delay |

## Test After Fix

1. Fresh page load → Create mode → tap Play → audio should start immediately
2. Create mode playing → switch to Mix → switch back to Create → tap Play → audio should start and stay playing
3. Create mode playing → switch to Listen → switch back → tap Play → audio stable
4. Create mode → tap Play → tap Stop → tap Play again → audio starts clean
5. Create mode → tap Play → mute → unmute → audio resumes at correct volume
