# Fix: Create Mode Audio Silent — V5 DIAGNOSTIC APPROACH

## Strategy Change

We've tried 4 fixes based on theories. None worked. Time to **diagnose** rather than guess. This spec adds two things:

1. A **test tone** that bypasses the entire audio graph — if this is also silent, the problem is browser autoplay policy, not the audio graph
2. **Comprehensive logging** at every step of the chain so we can see exactly where the signal breaks

## Changes Required

### File: `src/lib/audio-engine.ts`

#### Change 1: Add a `playTestTone()` method

Add this method to the `AudioEngine` class. It creates a simple oscillator connected directly to `ctx.destination`, bypassing compressor, masterGain, beatSumGain — everything:

```typescript
  // Diagnostic: plays a 440Hz tone directly to destination for 1 second
  // This bypasses the entire audio graph (compressor, masterGain, etc.)
  async playTestTone(): Promise<void> {
    if (!this.ctx) await this.init();
    const ctx = this.ctx!;
    if (ctx.state !== 'running') {
      await ctx.resume();
    }
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 440;
    gain.gain.value = 0.3;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    
    console.log('[TEST TONE] Started 440Hz → destination', {
      ctxState: ctx.state,
      ctxTime: ctx.currentTime,
      sampleRate: ctx.sampleRate,
    });
    
    setTimeout(() => {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
      console.log('[TEST TONE] Stopped');
    }, 1000);
  }
```

#### Change 2: Replace the diagnostic log in `startPreview` with comprehensive chain analysis

Replace the existing `console.log('[Binara Audio Debug]'...` block at the end of `startPreview` with:

```typescript
    // ─── DIAGNOSTIC: Analyse the entire audio chain ───
    const ctx = this.ctx!;
    
    // Check 1: Context state
    console.log('[DIAG 1/6] AudioContext', {
      state: ctx.state,
      currentTime: ctx.currentTime,
      sampleRate: ctx.sampleRate,
      baseLatency: ctx.baseLatency,
    });
    
    // Check 2: Beat layers exist
    console.log('[DIAG 2/6] Beat Layers', {
      count: this.beatLayers.size,
      ids: [...this.beatLayers.keys()],
      layerData: [...this.beatLayers.entries()].map(([id, s]) => ({
        id,
        oscLFreq: s.oscL.frequency.value,
        oscRFreq: s.oscR.frequency.value,
        gainLValue: s.gainL.gain.value,
        gainRValue: s.gainR.gain.value,
        layerGainValue: s.layerGain.gain.value,
        panLValue: s.panL.pan.value,
        panRValue: s.panR.pan.value,
      })),
    });
    
    // Check 3: beatSumGain
    console.log('[DIAG 3/6] beatSumGain', {
      exists: !!this.beatSumGain,
      gainValue: this.beatSumGain?.gain.value,
    });
    
    // Check 4: Compressor
    console.log('[DIAG 4/6] Compressor', {
      exists: !!this.compressor,
      threshold: this.compressor?.threshold.value,
      ratio: this.compressor?.ratio.value,
      reduction: this.compressor?.reduction,
    });
    
    // Check 5: Master gain
    console.log('[DIAG 5/6] MasterGain', {
      exists: !!this.masterGain,
      gainValue: this.masterGain?.gain.value,
    });
    
    // Check 6: Flags
    console.log('[DIAG 6/6] Flags', {
      isPlaying: this._isPlaying,
      isPaused: this._isPaused,
      advancedMode: this._advancedMode,
      previewMode: this._isPreviewMode,
      filterEnabled: this._filterEnabled,
    });
    
    // Check 7: Quick signal test — inject a KNOWN working tone through the same graph
    // Create a 1-second 440Hz beep through beatSumGain → compressor → masterGain → dest
    const testOsc = ctx.createOscillator();
    const testGain = ctx.createGain();
    testOsc.frequency.value = 440;
    testGain.gain.value = 0.3;
    testOsc.connect(testGain);
    testGain.connect(this.beatSumGain!);
    testOsc.start();
    console.log('[DIAG 7] Injected 440Hz test tone through beatSumGain');
    setTimeout(() => {
      try { testOsc.stop(); } catch {}
      testOsc.disconnect();
      testGain.disconnect();
      console.log('[DIAG 7] Test tone stopped');
    }, 2000);
```

**The test tone in Check 7 is the KEY diagnostic.** It injects a 440Hz sine wave directly into `beatSumGain`, completely bypassing `createBeatLayerNodes`. If this test tone is audible, the graph chain is fine and the problem is specifically in `createBeatLayerNodes`. If the test tone is ALSO silent, the problem is in the `beatSumGain → compressor → masterGain → destination` chain.

### File: `src/hooks/useAudioEngine.ts`

Add `playTestTone` to the hook:

```typescript
  const playTestTone = useCallback(async () => {
    const engine = getEngine();
    if (!engine.isInitialized) await engine.init();
    await engine.playTestTone();
  }, [getEngine]);
```

Add it to the return object and the `UseAudioEngineReturn` type.

### File: `src/components/advanced/PreviewBar.tsx`

Add a temporary "Test Tone" button next to the Play button. This lets us test if the AudioContext works at all:

In the non-playing state, add a small button:

```tsx
<button
  onClick={async () => { await audio.playTestTone(); }}
  style={{
    padding: '4px 12px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '12px',
    cursor: 'pointer',
  }}
>
  🔊 Test
</button>
```

## What To Do After Deploying

### Test 1: Tap "Test Tone" button (WITHOUT tapping Play first)
- If you hear a 440Hz beep: AudioContext works, browser autoplay is fine
- If silent: Browser is blocking audio — the whole approach needs rethinking

### Test 2: Tap "Play" button
- Check console for [DIAG 1/6] through [DIAG 7]
- **Critical question: Do you hear the 440Hz test tone from DIAG 7?**
  - If YES: The graph chain works, `createBeatLayerNodes` is the problem
  - If NO: The `beatSumGain → compressor → masterGain` chain is broken
- **Report back these console values:**
  - [DIAG 2/6] → `gainLValue` and `gainRValue` — are they 0 or 0.001?
  - [DIAG 3/6] → `gainValue` — is it 1?
  - [DIAG 4/6] → `reduction` — any compression happening?
  - [DIAG 5/6] → `gainValue` — is it 0.15?

### Test 3: Now enable isochronic from the panel
- Does isochronic play? (We know it does)
- Do the beat oscillators ALSO start playing now, or still silent?

This will tell us exactly where the problem is and the next fix will be targeted rather than theoretical.
