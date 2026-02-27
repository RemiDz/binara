# Fix: Create Mode First Play Silent — Silent Audio Element Race

## The Bug (STILL present)

First tap of "Tap to start playing" in Create mode produces no audio. Tapping Stop then Play again works fine. The previous fixes (race condition + context resume) didn't resolve this.

## Root Cause

In `src/lib/audio-engine.ts`, the `playAdvanced()` method creates oscillators and starts them, then AFTER that calls `startSilentAudioElement()` which calls `HTMLAudioElement.play()`. On iOS/Safari (and some Android browsers), calling `.play()` on an HTML audio element AFTER Web Audio oscillators have started can cause the browser to briefly interrupt/suspend the AudioContext while it activates the media audio session. The oscillators miss their start window and produce silence.

On the second tap, the silent audio element was cleaned up by `stopAdvancedImmediate`, and the audio session is already warm from the first attempt, so oscillators start cleanly.

The call order in `playAdvanced()` (line ~534) is currently:
```
1. Create oscillator nodes
2. Connect nodes to audio graph  
3. Start oscillators (osc.start(now))
4. Set _isPlaying = true
5. startKeepAlive()
6. startSilentAudioElement()  ← THIS disrupts the oscillators on first play
```

## The Fix

### In `src/lib/audio-engine.ts` — Move silent audio BEFORE oscillator creation

In the `startPreview()` method, start the silent audio element BEFORE calling `playAdvanced()`. This ensures the browser's audio session is active before any Web Audio nodes are created.

Change `startPreview()` to add `this.startSilentAudioElement()` right before the `playAdvanced` call:

```typescript
async startPreview(config: AdvancedSessionConfig): Promise<void> {
    // ... existing init, cleanup, resume code stays the same ...

    // Start silent audio element FIRST to activate the browser's audio session
    // This must happen before creating Web Audio nodes to avoid iOS audio session conflicts
    this.startSilentAudioElement();

    // Small delay to let the audio session activate
    await new Promise(resolve => setTimeout(resolve, 100));

    // Set up beat layers
    await this.playAdvanced(config.layers);

    // ... rest of subsystem enables stays the same ...
}
```

### Also in `playAdvanced()` — Move startSilentAudioElement before oscillators

Reorder `playAdvanced()` so the silent audio element starts BEFORE oscillator creation:

```typescript
async playAdvanced(layers: BeatLayer[]): Promise<void> {
    if (!this.ctx || !this.compressor) {
      await this.init();
    }

    // Ensure context is running
    if (this.ctx!.state !== 'running') {
      try { await this.ctx!.resume(); } catch { /* ignore */ }
    }

    if (this._isPlaying) {
      this.stopImmediate();
    }

    // Start keepalive and silent audio BEFORE creating oscillators
    // This activates the browser audio session first
    this.startKeepAlive();
    this.startSilentAudioElement();

    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Create sum gain for all beat layers
    this.beatSumGain = ctx.createGain();
    this.beatSumGain.gain.setValueAtTime(1, now);
    this.beatSumGain.connect(this.compressor!);

    // Create each beat layer
    for (const layer of layers) {
      this.createBeatLayerNodes(layer);
    }

    this._advancedMode = true;
    this._isPlaying = true;
    this._isPaused = false;
    this.startTime = now;
    this.pauseOffset = 0;
    this.wallStartTime = Date.now();
    this.wallPauseOffset = 0;

    // NOTE: startKeepAlive and startSilentAudioElement moved to BEFORE node creation above
}
```

### Also fix the Listen mode `play()` method — same issue

Apply the same reorder to the `play()` method (Listen mode) for consistency:

Move `this.startKeepAlive()` and `this.startSilentAudioElement()` from after `this.carrierLeft.start(now)` / `this.carrierRight.start(now)` to BEFORE the oscillator creation, right after the `stopImmediate()` guard.

## Why This Works

1. `startSilentAudioElement()` calls `new Audio(url).play()` — this activates the browser's media audio session
2. The 100ms delay in `startPreview` gives the audio session time to activate
3. When `playAdvanced` then creates and starts Web Audio oscillators, the audio session is already active, so no interruption occurs
4. On the second play, the silent audio is already cleaned up and the session is warm, which is why it already worked

## Test

1. Fresh page load → Create → tap Play → audio starts IMMEDIATELY on first tap
2. Stop → Play → still works
3. Switch modes → back to Create → Play → works
4. Close and reopen app → Create → Play → works on first tap
