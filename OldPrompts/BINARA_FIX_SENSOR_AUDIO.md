# Binara — Fix: Phone Sensors Not Affecting Audio

## Problem

The phone sensor UI is working — it shows tilt frequency, motion status, breath rate, and phone position correctly. But the actual audio output doesn't change when tilting the phone or moving it. The sensor data is being displayed but never sent to the audio engine.

## Root Cause

The sensor state is being read and rendered in the UI, but there's no `useEffect` or callback that takes the sensor values and calls the audio engine methods to update the beat frequency, stereo width, or LFO rate in real-time.

## Fix: Wire Sensor Output to Audio Engine

Find the component where the sensor state is available alongside the audio engine reference. This is likely in `MixPlayer.tsx`, `AdvancedPlayer.tsx`, or whichever player component renders the `SensorControl` panel.

### 1. Tilt → Beat Frequency

When the user tilts the phone forward/back, the beat frequency should change in real-time.

```typescript
// In the player component where both sensorState and audioEngine are available:

useEffect(() => {
  if (!sensorActive || !audioEngine) return;

  // Get the tilt-mapped frequency from the sensor engine
  const tiltFreq = sensorEngine.getTiltFrequency();

  // Update the audio engine's beat frequency
  // The carrier frequency stays the same — only the beat frequency changes
  // Beat frequency = difference between left and right ear
  // So: left ear = carrier, right ear = carrier + tiltFreq
  const carrier = currentCarrierFrequency; // whatever the session's carrier is
  audioEngine.setCarrierFrequency(carrier, carrier + tiltFreq);

}, [sensorState.pitch]); // Re-run whenever pitch (tilt) changes
```

**Important:** The audio engine must have a method that updates the oscillator frequencies smoothly (using `setTargetAtTime` or `linearRampToValueAtTime`, NOT `setValueAtTime` — to avoid clicks):

```typescript
// In audio-engine.ts — verify this method exists and uses smooth ramping:
setCarrierFrequency(leftFreq: number, rightFreq: number) {
  if (this.leftOscillator) {
    this.leftOscillator.frequency.setTargetAtTime(leftFreq, this.audioContext.currentTime, 0.05);
  }
  if (this.rightOscillator) {
    this.rightOscillator.frequency.setTargetAtTime(rightFreq, this.audioContext.currentTime, 0.05);
  }
}
```

The `0.05` time constant means frequency changes smooth out over ~50ms — fast enough to feel responsive but smooth enough to avoid clicks.

### 2. Tilt → Stereo Width (Advanced mode only)

When the user tilts left/right, the stereo width should change.

```typescript
useEffect(() => {
  if (!sensorActive || !audioEngine) return;

  const stereoWidth = sensorEngine.getTiltStereoWidth(); // Returns 0–1

  // Only apply if stereo controls exist (Advanced mode)
  if (audioEngine.setStereoConfig) {
    audioEngine.setStereoConfig({ width: stereoWidth });
  }

}, [sensorState.roll]); // Re-run whenever roll (left/right tilt) changes
```

### 3. Breath Rate → LFO Sync

When breath detection is active and the user has enabled "Sync LFO to breath", the LFO rate should follow the detected breath rate.

```typescript
useEffect(() => {
  if (!sensorActive || !audioEngine || !breathSyncEnabled) return;
  if (!sensorState.breathRate) return; // No breath detected yet

  const breathHz = sensorState.breathRate / 60; // Convert BPM to Hz

  // Update LFO rate to match breathing
  if (audioEngine.setLFO) {
    audioEngine.setLFO({ rate: breathHz });
  }

}, [sensorState.breathRate, breathSyncEnabled]);
```

### 4. Throttle Updates

Sensor events fire at 50–60Hz. Audio parameter updates should be throttled to avoid overwhelming the engine.

```typescript
// Use a throttle utility — update audio at most every 50ms (20Hz)
import { throttle } from 'lodash'; // or implement a simple throttle

const updateAudioFromSensors = throttle((sensorState: SensorState) => {
  if (!audioEngine) return;

  // Tilt → frequency
  const tiltFreq = sensorEngine.getTiltFrequency();
  const carrier = currentCarrierFrequency;
  audioEngine.setCarrierFrequency(carrier, carrier + tiltFreq);

  // Tilt → stereo (if available)
  if (audioEngine.setStereoConfig) {
    const stereoWidth = sensorEngine.getTiltStereoWidth();
    audioEngine.setStereoConfig({ width: stereoWidth });
  }

  // Breath → LFO (if enabled and detected)
  if (breathSyncEnabled && sensorState.breathRate && audioEngine.setLFO) {
    const breathHz = sensorState.breathRate / 60;
    audioEngine.setLFO({ rate: breathHz });
  }

}, 50); // 50ms throttle = 20 updates per second

// Call this whenever sensor state changes:
useEffect(() => {
  if (!sensorActive) return;
  updateAudioFromSensors(sensorState);
}, [sensorState]);
```

### 5. Verify Audio Engine Methods Exist

The following methods must exist in `audio-engine.ts` and work correctly. Check each one:

**`setCarrierFrequency(left, right)`** — Updates left and right oscillator frequencies with smooth ramping. This is the most critical method for tilt control.

If this method doesn't exist, add it:
```typescript
setCarrierFrequency(leftFreq: number, rightFreq: number) {
  const now = this.audioContext!.currentTime;
  
  if (this.leftOscillator) {
    this.leftOscillator.frequency.setTargetAtTime(leftFreq, now, 0.05);
  }
  if (this.rightOscillator) {
    this.rightOscillator.frequency.setTargetAtTime(rightFreq, now, 0.05);
  }
}
```

**`setStereoConfig({ width })`** — Updates stereo width. Should exist from Phase 3 Advanced mode.

**`setLFO({ rate })`** — Updates LFO rate. Should exist from Phase 3 Advanced mode.

If any of these methods exist but use `setValueAtTime` instead of `setTargetAtTime`, change them to `setTargetAtTime` with a time constant of 0.05 for smooth transitions.

### 6. Which Player Components Need This

Add the sensor → audio wiring to ALL player components that have sensor controls:

- `src/components/mix/MixPlayer.tsx` — Tilt → frequency
- `src/components/advanced/AdvancedPlayer.tsx` — Tilt → frequency, tilt → stereo, breath → LFO

The Easy mode player likely doesn't have sensor controls (sensors are Pro-only). If it does, add the wiring there too.

---

## Testing

- [ ] Tilt phone forward → hear beat frequency increase (sound changes pitch)
- [ ] Tilt phone back → hear beat frequency decrease
- [ ] Hold phone flat → beat frequency returns to session's default
- [ ] Frequency changes are smooth — no clicks or jumps
- [ ] Tilt sensitivity slider affects how responsive the frequency change is
- [ ] Min/Max frequency range sliders limit the tilt mapping correctly
- [ ] UI frequency readout matches what you hear
- [ ] Tilt left/right → stereo width changes (in Advanced mode)
- [ ] Breath sync toggle: when ON and breathing detected, LFO pulses with your breath
- [ ] Rapid tilting doesn't cause audio glitches (throttle working)
- [ ] Stopping sensor mode returns to original session frequency
- [ ] Build passes cleanly
