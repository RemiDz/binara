# BINARA — Phone Sensors Feature (PRO Only)

## Overview

Add a "Phone Sensors" feature to all Listen tab preset sessions. This feature uses the device's gyroscope and accelerometer to create motion-reactive audio — tilting, rotating, or moving the phone subtly modifies the binaural beat experience in real-time. This feature is **PRO only** but must be visible and enticing to free users as a conversion driver.

---

## What Phone Sensors Do (Audio Effects)

When enabled during a session, the phone's motion data modulates the audio in these ways:

### Gyroscope (Device Orientation)

**Tilt Left/Right (gamma axis, -90° to +90°):**
- Smoothly shifts the stereo balance of the binaural beat
- Tilt left → left ear slightly louder, right ear slightly quieter (and vice versa)
- Range: ±3dB maximum shift — subtle, not extreme
- Centre position (phone flat) = equal balance
- Creates a sense of spatial immersion, like the sound follows your body position

**Tilt Forward/Back (beta axis, -180° to +180°):**
- Modulates the base carrier frequency by ±5 Hz
- Tilting forward raises the pitch slightly, tilting back lowers it
- Very subtle — the user feels it more than hears it consciously
- Creates an organic, living quality to the tone

### Accelerometer (Device Motion)

**Stillness Detection:**
- When the device is completely still for 10+ seconds, fade in a gentle harmonic overtone layer (2nd harmonic at low volume)
- This rewards stillness during meditation — the deeper you settle, the richer the sound becomes
- Any movement fades the overtone layer back out over 3 seconds

**Gentle Rocking / Breathing Detection:**
- Slow rhythmic forward/back motion (~0.1–0.3 Hz, like breathing while holding the phone)
- Modulates the master volume in a gentle wave pattern synchronised to the motion
- Creates a breathing-with-the-sound effect

### All Modulations Must Be:
- **Subtle** — enhancing, not distracting. Max ±3dB gain, ±5Hz pitch
- **Smooth** — all values fed through a low-pass filter / exponential smoothing to prevent jitter
- **Optional** — can be toggled on/off during a session
- **Recoverable** — when sensors are turned off, all values smoothly return to defaults

---

## Implementation

### Sensor Data Access

Use the `DeviceOrientationEvent` and `DeviceMotionEvent` APIs:

```typescript
// Request permission (required on iOS)
async function requestSensorPermission(): Promise<boolean> {
  if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
    try {
      const permission = await (DeviceOrientationEvent as any).requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
  // Android and non-iOS browsers don't need explicit permission
  return true;
}

// Smoothing utility
function smoothValue(current: number, target: number, factor: number = 0.08): number {
  return current + (target - current) * factor;
}
```

### Orientation Handler

```typescript
interface SensorState {
  gamma: number;   // left/right tilt (-90 to 90)
  beta: number;    // forward/back tilt (-180 to 180)
  isStill: boolean;
  stillDuration: number;
}

let sensorState: SensorState = { gamma: 0, beta: 0, isStill: false, stillDuration: 0 };
let smoothGamma = 0;
let smoothBeta = 0;

function handleOrientation(event: DeviceOrientationEvent) {
  const gamma = event.gamma ?? 0; // left/right
  const beta = event.beta ?? 0;   // forward/back

  // Clamp values
  const clampedGamma = Math.max(-45, Math.min(45, gamma)); // limit range
  const clampedBeta = Math.max(-30, Math.min(30, beta));

  // Smooth to prevent jitter
  smoothGamma = smoothValue(smoothGamma, clampedGamma);
  smoothBeta = smoothValue(smoothBeta, clampedBeta);

  // Apply to audio (called on each animation frame, not directly in event)
  sensorState.gamma = smoothGamma;
  sensorState.beta = smoothBeta;
}

window.addEventListener('deviceorientation', handleOrientation);
```

### Audio Modulation (in requestAnimationFrame loop)

```typescript
function applySensorModulation(audioCtx: AudioContext, nodes: AudioNodes) {
  // Stereo balance from gamma (left/right tilt)
  // Map -45..+45 degrees to -3dB..+3dB balance shift
  const balanceShift = (sensorState.gamma / 45) * 3; // dB
  const leftGainDb = Math.min(0, -balanceShift);
  const rightGainDb = Math.min(0, balanceShift);
  nodes.leftGain.gain.setTargetAtTime(
    Math.pow(10, leftGainDb / 20), audioCtx.currentTime, 0.1
  );
  nodes.rightGain.gain.setTargetAtTime(
    Math.pow(10, rightGainDb / 20), audioCtx.currentTime, 0.1
  );

  // Carrier frequency shift from beta (forward/back tilt)
  // Map -30..+30 degrees to -5Hz..+5Hz
  const freqShift = (sensorState.beta / 30) * 5;
  const baseFreq = currentPreset.carrierFrequency; // e.g. 200 Hz
  nodes.leftOsc.frequency.setTargetAtTime(
    baseFreq + freqShift, audioCtx.currentTime, 0.1
  );
  nodes.rightOsc.frequency.setTargetAtTime(
    baseFreq + currentPreset.beatFreq + freqShift, audioCtx.currentTime, 0.1
  );

  // Stillness detection — add overtone layer
  if (sensorState.isStill && sensorState.stillDuration > 10) {
    // Fade in 2nd harmonic
    nodes.overtoneGain.gain.setTargetAtTime(0.08, audioCtx.currentTime, 2.0);
  } else {
    // Fade out overtone
    nodes.overtoneGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
  }
}
```

### Stillness Detection

```typescript
let lastAccelMagnitude = 0;
let stillStartTime = 0;
const STILLNESS_THRESHOLD = 0.3; // m/s² — very small movement allowed

function handleMotion(event: DeviceMotionEvent) {
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;

  // Calculate magnitude of acceleration change
  const magnitude = Math.sqrt(
    (acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2
  );
  const delta = Math.abs(magnitude - lastAccelMagnitude);
  lastAccelMagnitude = magnitude;

  if (delta < STILLNESS_THRESHOLD) {
    if (!sensorState.isStill) {
      sensorState.isStill = true;
      stillStartTime = Date.now();
    }
    sensorState.stillDuration = (Date.now() - stillStartTime) / 1000;
  } else {
    sensorState.isStill = false;
    sensorState.stillDuration = 0;
  }
}

window.addEventListener('devicemotion', handleMotion);
```

---

## PRO Gating & Free User Visibility

### In-Session Toggle (PRO users)

When a PRO user opens a preset session, show a **Phone Sensors toggle** in the session controls:

- Icon: a phone/device icon with motion lines, or a gyroscope icon
- Label: "Motion Sensors"
- Toggle on → requests permission (iOS shows system dialog), starts sensor listeners
- Toggle off → stops listeners, smoothly returns all modulations to default
- Small status indicator when active (e.g. subtle pulse or glow on the icon)

### On Preset Cards (All users — the marketing hook)

Add a small **sensor badge/indicator** on each preset card in the Listen tab grid. This is visible to ALL users (free and PRO):

**For PRO users:**
- Small icon badge on the card (e.g. bottom-left corner, near the duration)
- Subtle, not competing with the play button
- Indicates "this preset supports motion sensors"

**For FREE users:**
- Same badge but with a tiny lock icon overlay
- When the FREE user taps this badge (or taps the sensor toggle in a session), show a **PRO upsell overlay/bottom sheet**:

```
┌─────────────────────────────────┐
│                                 │
│    📱 Motion Sensors            │
│                                 │
│    Unlock a deeper experience.  │
│    Binara PRO uses your phone's │
│    gyroscope to make sound      │
│    respond to your body.        │
│                                 │
│    • Tilt to shift the spatial  │
│      balance of your session    │
│    • Stay still and the sound   │
│      rewards your stillness     │
│      with harmonic overtones    │
│    • Gentle rocking creates a   │
│      breathing-with-sound       │
│      effect                     │
│                                 │
│    ┌─────────────────────────┐  │
│    │   Upgrade to PRO        │  │
│    └─────────────────────────┘  │
│                                 │
│    Restore Purchase             │
│                                 │
└─────────────────────────────────┘
```

### Upsell Design

- Dark overlay/bottom sheet matching app aesthetic
- Clean, short copy — not salesy, informative
- 3 bullet points describing what the sensors do (from the user's perspective, not technical)
- Primary CTA button: "Upgrade to PRO" (links to existing PRO purchase flow)
- Secondary link: "Restore Purchase"
- Dismiss by tapping outside or swiping down

### Visibility Strategy

The goal is that free users **constantly see** that motion sensors exist but can't use them. Every preset card quietly reminds them. The upsell copy focuses on the *experience* ("sound responds to your body") not the *technology* ("gyroscope API"). This creates desire through curiosity.

---

## Device Support & Fallbacks

- **iOS Safari**: requires explicit permission via `DeviceOrientationEvent.requestPermission()` — must be triggered by a user gesture (tap)
- **Android Chrome**: no permission needed, events fire automatically
- **Desktop browsers**: no gyroscope/accelerometer available — hide the sensor toggle entirely on desktop. Do not show the badge on cards when viewed on desktop.
- **Devices without sensors**: if `DeviceOrientationEvent` or `DeviceMotionEvent` are not available, hide the feature gracefully. No errors, no broken UI.

```typescript
function isSensorAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('DeviceOrientationEvent' in window || 'DeviceMotionEvent' in window) &&
    // Check if we're likely on a mobile device
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  );
}
```

---

## What NOT to Touch

- ✅ Existing beat oscillator code — sensors modulate gain and frequency on existing nodes
- ✅ Ambient layer playback — sensors do NOT affect ambient layers
- ✅ Effects chain in Create mode — sensors do NOT interact with filter/LFO/isochronic/stereo
- ✅ Timer and session logic — unchanged
- ✅ PRO purchase flow — use existing mechanism, just link to it from the upsell

---

## CSS Fix (Separate Issue)

### Card Height Bug

Preset cards in the same grid row must be equal height. Currently shorter cards have grey empty space at the bottom.

**Fix:**
- Grid container: ensure `align-items: stretch` (this is the CSS Grid default, but check it's not overridden)
- Outer card wrapper (the 1px padding border element): add `display: flex; flex-direction: column;`
- Inner card div: add `flex: 1;` so it fills the full height of the wrapper
- Inside the inner card, use `justify-content: space-between` on the flex column so content spreads evenly and description/duration push to the bottom

This ensures all cards in a row match the height of the tallest card, with content evenly distributed.

---

## Test Checklist

### Phone Sensors (PRO)
- [ ] Sensor toggle appears in session controls on mobile devices
- [ ] Sensor toggle does NOT appear on desktop
- [ ] Tapping toggle on iOS triggers permission dialog
- [ ] After granting permission, tilting phone left/right shifts stereo balance
- [ ] Tilting forward/back subtly shifts carrier frequency
- [ ] Holding phone completely still for 10+ seconds fades in overtone layer
- [ ] Moving the phone fades overtone layer back out
- [ ] All modulations are smooth — no jitter, clicks, or sudden jumps
- [ ] Toggling sensors off returns all values to default smoothly
- [ ] Sensors do NOT affect ambient layers
- [ ] Sensors only active during a session, not on the card grid

### PRO Gating (Free Users)
- [ ] Sensor badge visible on all preset cards for free users (with lock icon)
- [ ] Tapping badge shows upsell bottom sheet
- [ ] Upsell copy is clear and non-technical
- [ ] "Upgrade to PRO" button links to existing purchase flow
- [ ] "Restore Purchase" link works
- [ ] Dismissing upsell returns to normal view
- [ ] PRO users see the badge without lock, and can use the feature

### Card Height Fix
- [ ] All cards in the same grid row are equal height
- [ ] No grey/empty space at the bottom of shorter cards
- [ ] Content is evenly distributed within each card
- [ ] Fix works across all category filters

### No Regressions
- [ ] All preset sessions play correctly without sensors enabled
- [ ] Card preview playback still works
- [ ] Ambient layers unaffected
- [ ] Mix and Create modes unaffected
