# Binara — Create Mode: Live Audio Preview

## Overview

Transform Create (Advanced) mode from a silent configuration form into a live audio playground. Audio plays immediately when the user opens Create mode. Every parameter change is heard instantly in real-time. The user builds their sound by ear, not by guesswork. When they're happy, they tap "Start Session" to begin the timed session.

This is a Pro feature — it makes the Create mode dramatically more powerful and is a strong reason to upgrade.

---

## Current Flow (Bad)

```
Open Create → silence
→ configure oscillators in silence
→ configure filter in silence
→ configure LFO in silence
→ configure stereo in silence
→ configure ambient in silence
→ configure timeline in silence
→ tap "Start Session"
→ FINALLY hear what you built
→ probably not what you wanted
→ stop, go back, reconfigure, try again
```

## New Flow (Good)

```
Open Create → audio starts playing immediately (simple default)
→ tweak beat frequency → hear it change live
→ add second layer → hear it layer in
→ enable filter → hear it sweep live
→ enable LFO → hear modulation start
→ adjust stereo → hear the field shift
→ add ambient layers → hear them mix in
→ happy with the sound → tap "Start Session" → timer begins
→ OR save the preset first, then start session
→ OR keep tweaking — no commitment needed
```

---

## Implementation

### 1. Auto-Start Preview Audio

When the user navigates to Create mode (the AdvancedBuilder screen), automatically start a preview audio context with the current configuration.

```typescript
// In AdvancedBuilder.tsx or wherever Create mode mounts:

const [isPreviewing, setIsPreviewing] = useState(false);

// Start preview when Create mode opens
useEffect(() => {
  // Don't auto-start — wait for first user interaction (browser autoplay policy)
  // Instead, show a "Tap to start live preview" prompt
  return () => {
    // Stop preview when leaving Create mode
    if (isPreviewing) {
      audioEngine.stopPreview();
    }
  };
}, []);
```

**Browser autoplay policy:** Browsers won't let audio start without a user gesture. Two options:

**Option A (Recommended):** Show a prominent "Enable Live Preview" button at the top of the builder. Once tapped, audio starts and all parameters become live. The button changes to a speaker icon showing preview is active.

```
┌──────────────────────────────────────┐
│  🔇 Tap to enable live preview       │  ← Before activation
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  🔊 Live Preview Active    [Mute]    │  ← After activation
└──────────────────────────────────────┘
```

**Option B:** Auto-start preview on the first parameter interaction (slider drag, toggle tap). Less discoverable but cleaner UI.

Go with **Option A** — it's clearer and the user understands immediately that this mode is different.

### 2. Preview Audio Engine Methods

Add preview-specific methods to the audio engine. Preview mode plays audio continuously without a timer or timeline — just a steady output of the current configuration.

```typescript
// In audio-engine.ts, add:

/**
 * Start preview mode — plays the current advanced configuration
 * continuously without a timer. Every parameter change is applied
 * immediately.
 */
startPreview(config: AdvancedSessionConfig): void {
  // Same setup as playAdvanced() but:
  // - No timeline runner (no phase transitions)
  // - No session timer
  // - Audio just plays steadily at the current beat frequency
  // - All parameters (filter, LFO, stereo, isochronic) applied immediately
  
  this._isPreviewMode = true;
  
  // Create audio graph from config
  this.setupOscillators(config.layers);
  this.setupFilter(config.filter);
  this.setupLFO(config.lfo);
  this.setupStereo(config.stereo);
  this.setupIsochronic(config.isochronic);
  
  // Start all nodes
  this.startAllNodes();
}

/**
 * Update a single parameter during preview — applies immediately
 */
updatePreviewParam(param: string, value: any): void {
  // Route to the appropriate audio node update
  // All updates use setTargetAtTime for smooth transitions
}

/**
 * Stop preview mode
 */
stopPreview(): void {
  this._isPreviewMode = false;
  this.fadeOutAndStop(0.3); // Quick 300ms fade out
}

/**
 * Transition from preview to full session
 * Audio continues seamlessly — just starts the timer and timeline
 */
transitionPreviewToSession(config: AdvancedSessionConfig): void {
  // DON'T stop and restart audio
  // Just start the timeline runner and session timer
  // Audio continues uninterrupted
  this._isPreviewMode = false;
  this._isSessionActive = true;
  
  if (config.timeline && config.timeline.phases.length > 1) {
    this.startTimelineRunner(config.timeline);
  }
}
```

### 3. Real-Time Parameter Updates

Every parameter in the builder must call `updatePreviewParam()` when changed. Here's how each panel connects:

#### Oscillator Panel

When the user changes beat frequency, carrier frequency, waveform, or volume on any layer:

```typescript
// In OscillatorPanel.tsx:
function onBeatFrequencyChange(layerId: string, newFreq: number) {
  // Update state
  updateLayer(layerId, { beatFrequency: newFreq });
  
  // Update audio immediately
  if (isPreviewing) {
    audioEngine.updateBeatLayer(layerId, { beatFrequency: newFreq });
  }
}

function onCarrierFrequencyChange(layerId: string, newFreq: number) {
  updateLayer(layerId, { carrierFrequency: newFreq });
  
  if (isPreviewing) {
    audioEngine.updateBeatLayer(layerId, { carrierFrequency: newFreq });
  }
}

function onWaveformChange(layerId: string, newWaveform: OscillatorType) {
  updateLayer(layerId, { waveform: newWaveform });
  
  if (isPreviewing) {
    audioEngine.updateBeatLayer(layerId, { waveform: newWaveform });
  }
}

function onLayerVolumeChange(layerId: string, newVolume: number) {
  updateLayer(layerId, { volume: newVolume });
  
  if (isPreviewing) {
    audioEngine.updateBeatLayer(layerId, { volume: newVolume });
  }
}
```

**Adding/removing layers during preview:**

```typescript
function addLayer() {
  const newLayer = createDefaultLayer();
  addLayerToState(newLayer);
  
  if (isPreviewing) {
    audioEngine.addBeatLayer(newLayer); // Audio starts for this layer immediately
  }
}

function removeLayer(layerId: string) {
  removeLayerFromState(layerId);
  
  if (isPreviewing) {
    audioEngine.removeBeatLayer(layerId); // Audio stops for this layer with quick fade
  }
}
```

#### Filter Panel

```typescript
function onFilterTypeChange(newType: BiquadFilterType | 'off') {
  updateFilter({ type: newType });
  
  if (isPreviewing) {
    if (newType === 'off') {
      audioEngine.setFilter({ enabled: false });
    } else {
      audioEngine.setFilter({ enabled: true, type: newType, cutoff: currentCutoff, resonance: currentResonance });
    }
  }
}

function onCutoffChange(newCutoff: number) {
  updateFilter({ cutoff: newCutoff });
  
  if (isPreviewing) {
    audioEngine.setFilter({ cutoff: newCutoff });
  }
}

function onResonanceChange(newResonance: number) {
  updateFilter({ resonance: newResonance });
  
  if (isPreviewing) {
    audioEngine.setFilter({ resonance: newResonance });
  }
}
```

#### Stereo Panel

```typescript
function onStereoWidthChange(newWidth: number) {
  updateStereo({ width: newWidth });
  if (isPreviewing) audioEngine.setStereoConfig({ width: newWidth });
}

function onPanChange(newPan: number) {
  updateStereo({ pan: newPan });
  if (isPreviewing) audioEngine.setStereoConfig({ pan: newPan });
}

function onCrossfeedChange(newCrossfeed: number) {
  updateStereo({ crossfeed: newCrossfeed });
  if (isPreviewing) audioEngine.setStereoConfig({ crossfeed: newCrossfeed });
}

function onRotationChange(newRotation: string) {
  updateStereo({ rotation: newRotation });
  if (isPreviewing) audioEngine.setStereoConfig({ rotation: newRotation });
}
```

#### LFO Panel

```typescript
function onLFOTargetChange(newTarget: string) {
  updateLFO({ target: newTarget });
  if (isPreviewing) audioEngine.setLFO({ target: newTarget });
}

function onLFORateChange(newRate: number) {
  updateLFO({ rate: newRate });
  if (isPreviewing) audioEngine.setLFO({ rate: newRate });
}

function onLFODepthChange(newDepth: number) {
  updateLFO({ depth: newDepth });
  if (isPreviewing) audioEngine.setLFO({ depth: newDepth });
}

function onLFOShapeChange(newShape: string) {
  updateLFO({ shape: newShape });
  if (isPreviewing) audioEngine.setLFO({ shape: newShape });
}
```

#### Isochronic Panel

```typescript
function onIsochronicToggle(enabled: boolean) {
  updateIsochronic({ enabled });
  if (isPreviewing) audioEngine.setIsochronic({ enabled });
}

function onPulseFrequencyChange(newFreq: number) {
  updateIsochronic({ pulseFrequency: newFreq });
  if (isPreviewing) audioEngine.setIsochronic({ pulseFrequency: newFreq });
}

// Same pattern for pulseShape, tonePitch, volume
```

#### Ambient Panel

```typescript
// Ambient already plays in real-time from the multi-layer update
// Just make sure it works during preview mode too
function toggleAmbient(sound: string) {
  // existing toggle logic...
  
  if (isPreviewing) {
    // Ambient should already work since it uses the same audio engine
    // Verify it does
  }
}
```

### 4. Preview Volume Control

Add a small volume slider to the preview bar so users can control preview loudness while building:

```
┌──────────────────────────────────────────────┐
│  🔊 Live Preview Active  ──●── 50%   [Mute]  │
└──────────────────────────────────────────────┘
```

```typescript
function onPreviewVolumeChange(volume: number) {
  if (isPreviewing) {
    audioEngine.setMasterVolume(volume / 100);
  }
}
```

### 5. Start Session Transition

When the user taps "Start Session" while preview is active, the audio should continue seamlessly — no gap, no restart, no click. Just start the timer and timeline on top of the already-playing audio.

```typescript
function handleStartSession() {
  if (isPreviewing) {
    // Seamless transition — audio keeps playing
    audioEngine.transitionPreviewToSession(currentConfig);
    
    // Start session timer
    startSessionTimer(totalDuration);
    
    // Navigate to player view
    setView('advanced-player');
  } else {
    // Normal start (if preview wasn't active)
    audioEngine.playAdvanced(currentConfig);
    startSessionTimer(totalDuration);
    setView('advanced-player');
  }
}
```

### 6. UI Changes to AdvancedBuilder

#### Preview Bar (new — sticky at top of builder)

```
┌──────────────────────────────────────────────┐
│  🔇 Tap to enable live preview               │  ← Initial state
└──────────────────────────────────────────────┘
```

After tapping:

```
┌──────────────────────────────────────────────┐
│  🔊 Live Preview   ──●── 50%   [⏸ Mute]     │  ← Active state
└──────────────────────────────────────────────┘
```

- Sticky/fixed at the top of the builder (always visible while scrolling through panels)
- Glass background, consistent with app design
- Mute button pauses preview without losing configuration
- Volume slider: compact, inline

#### Start Session Button Update

Change the "Start Session" button text based on preview state:

```
Preview OFF:  "▶ Start Session"        ← Normal
Preview ON:   "▶ Start Timed Session"  ← Clarifies that this adds a timer to what's already playing
```

#### Visual Feedback During Preview

When preview is active, add subtle visual cues that the builder is "live":

- A small pulsing dot next to "Live Preview" text (same as Tide Resonance's live indicator)
- Panel headers could show a tiny speaker icon when their parameter is actively affecting audio
- The background visualiser (from the compact player update) could be visible behind the builder at very low opacity — showing the beat frequency response to changes

### 7. Preview State Management

Add preview state to the app context or the AdvancedBuilder's local state:

```typescript
interface PreviewState {
  isActive: boolean;
  isMuted: boolean;
  volume: number;  // 0–100
}

// In AdvancedBuilder:
const [preview, setPreview] = useState<PreviewState>({
  isActive: false,
  isMuted: false,
  volume: 50,
});

function enablePreview() {
  audioEngine.startPreview(currentAdvancedConfig);
  setPreview({ isActive: true, isMuted: false, volume: 50 });
}

function toggleMute() {
  if (preview.isMuted) {
    audioEngine.setMasterVolume(preview.volume / 100);
  } else {
    audioEngine.setMasterVolume(0);
  }
  setPreview(prev => ({ ...prev, isMuted: !prev.isMuted }));
}

function disablePreview() {
  audioEngine.stopPreview();
  setPreview({ isActive: false, isMuted: false, volume: 50 });
}
```

### 8. Headphone Reminder for Preview

When the user enables preview, check if the headphone reminder has been shown. Binaural beats require headphones — remind the user before they start tweaking:

```typescript
function enablePreview() {
  // Show headphone reminder if not dismissed
  if (!hasSeenHeadphoneReminder) {
    showHeadphoneReminder(() => {
      // After dismissal, start preview
      audioEngine.startPreview(currentAdvancedConfig);
      setPreview({ isActive: true, isMuted: false, volume: 50 });
    });
  } else {
    audioEngine.startPreview(currentAdvancedConfig);
    setPreview({ isActive: true, isMuted: false, volume: 50 });
  }
}
```

### 9. Cleanup

When the user navigates away from Create mode (back to mode selector, or switches to Easy/Mix):

```typescript
useEffect(() => {
  return () => {
    // Always stop preview when leaving Create mode
    if (preview.isActive) {
      audioEngine.stopPreview();
    }
  };
}, [preview.isActive]);
```

---

## Audio Engine Changes Summary

### New Methods:

```typescript
startPreview(config: AdvancedSessionConfig): void;
stopPreview(): void;
transitionPreviewToSession(config: AdvancedSessionConfig): void;
```

### Existing Methods to Verify:

These methods must work correctly during preview mode (not just during a session). They should already exist from Phase 3, but verify they work when called outside of `playAdvanced()`:

```typescript
addBeatLayer(config): string;
removeBeatLayer(id): void;
updateBeatLayer(id, params): void;
setStereoConfig(config): void;
setLFO(config): void;
setIsochronic(config): void;
setFilter(config): void;
setMasterVolume(volume): void;
```

### New State Flag:

```typescript
private _isPreviewMode: boolean = false;

get isPreviewMode(): boolean {
  return this._isPreviewMode;
}
```

---

## Files to Modify

### Audio Engine:
- `src/lib/audio-engine.ts` — Add `startPreview()`, `stopPreview()`, `transitionPreviewToSession()`

### Builder Components:
- `src/components/advanced/AdvancedBuilder.tsx` — Add preview state, preview bar UI, wire enable/disable/mute
- `src/components/advanced/OscillatorPanel.tsx` — Add live audio updates on every parameter change
- `src/components/advanced/FilterPanel.tsx` — Add live audio updates
- `src/components/advanced/StereoPanel.tsx` — Add live audio updates
- `src/components/advanced/LFOPanel.tsx` — Add live audio updates
- `src/components/advanced/IsochronicPanel.tsx` — Add live audio updates
- `src/components/advanced/AdvancedAmbientPanel.tsx` — Verify works during preview

### New Component:
- `src/components/advanced/PreviewBar.tsx` — Sticky preview control bar (enable/volume/mute)

### App/Player:
- `src/components/App.tsx` — Handle seamless preview→session transition
- `src/components/advanced/AdvancedPlayer.tsx` — Accept already-playing audio from preview

---

## Also Apply to Mix Mode

The same problem exists in Mix mode — the user configures state, carrier, ambient, and timeline in silence, then hits play.

For Mix mode, a simpler version of this feature works:

- When the user selects a carrier tone in step 2, preview that carrier + selected brainwave state as a beat
- When they add ambient layers in step 3, those play live (ambient already works in real-time from the multi-layer update)
- This gives them a rough preview of their mix as they build it

The carrier tone preview (short beep on tap) already exists from Phase 2. Extend it to play continuously while the user is on step 2+, not just a short beep.

This is a smaller change — focus on Create mode first, then apply to Mix mode as a follow-up.

---

## Testing

- [ ] Open Create mode → "Tap to enable live preview" button visible
- [ ] Tap preview → audio starts playing with default config
- [ ] Change beat frequency slider → hear frequency change in real-time
- [ ] Change carrier frequency → hear pitch shift live
- [ ] Change waveform → hear timbre change live
- [ ] Add second beat layer → hear it layer in smoothly
- [ ] Remove a layer → hear it fade out
- [ ] Enable filter → hear filtering applied live
- [ ] Sweep filter cutoff → hear the sweep in real-time
- [ ] Change resonance → hear it sharpen/soften
- [ ] Enable LFO → hear modulation start
- [ ] Change LFO rate → hear modulation speed change
- [ ] Change LFO depth → hear modulation intensity change
- [ ] Adjust stereo width → hear stereo field change
- [ ] Enable isochronic → hear pulsing start
- [ ] Add ambient layers → hear them mix in
- [ ] Preview volume slider works
- [ ] Mute button silences without stopping
- [ ] Unmute restores audio
- [ ] Tap "Start Timed Session" → timer starts, audio continues seamlessly (no gap!)
- [ ] Session plays correctly after transition from preview
- [ ] Navigate away from Create mode → preview stops cleanly
- [ ] Switch to Easy/Mix mode → preview stops
- [ ] Headphone reminder shows before first preview
- [ ] No audio clicks or glitches during parameter changes
- [ ] CPU usage reasonable during preview with multiple layers + effects
- [ ] Build passes cleanly
