# Binara — Phase 4: Pro Features

## Overview

Wire up everything that makes Binara a commercial product: LemonSqueezy payment for Pro unlock, phone sensor integration (the killer feature), session export to WAV, and preset sharing via URL.

**Prerequisites:** Phases 1–3 must be complete and building cleanly.

**Principle:** Pro features are already built and gated behind `ProGate`. This phase replaces the hardcoded `isPro = false` with a real licence check, then builds the remaining Pro-exclusive features (sensors, export, sharing).

---

## 1. LemonSqueezy Integration

### 1.1 Store Setup

The developer (Remigijus) needs to create the product in the LemonSqueezy dashboard manually. This spec covers the code side only.

**Product details for LemonSqueezy dashboard:**
- Product name: "Binara Pro"
- Price: $7.99 (one-time payment)
- Description: "Unlock multi-layer beats, stereo field, LFO modulation, isochronic tones, phone sensors, session export, unlimited saves, and more."
- Licence key activation: enabled (single activation)
- Thank you page redirect: `https://binara.app?licence_key={licence_key}`

### 1.2 Pro State Management

### File: `src/lib/pro.ts`

```typescript
interface ProState {
  isActive: boolean;
  licenceKey: string | null;
  activatedAt: string | null;
  lastVerified: string | null;
}

const STORAGE_KEY = 'binara_pro';

// Read Pro state from localStorage
function getProState(): ProState;

// Save Pro state to localStorage
function setProState(state: ProState): void;

// Check if Pro is currently active
function isPro(): boolean;

// Activate Pro with a licence key
async function activatePro(licenceKey: string): Promise<{ success: boolean; error?: string }>;

// Verify licence key with LemonSqueezy API (called periodically)
async function verifyLicence(licenceKey: string): Promise<boolean>;

// Clear Pro state (for deactivation/testing)
function clearPro(): void;
```

**Activation flow:**

```typescript
async function activatePro(licenceKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Call LemonSqueezy licence activation API
    const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: licenceKey,
        instance_name: 'binara-web',
      }),
    });

    const data = await response.json();

    if (data.activated || data.valid) {
      setProState({
        isActive: true,
        licenceKey,
        activatedAt: new Date().toISOString(),
        lastVerified: new Date().toISOString(),
      });
      return { success: true };
    }

    return { success: false, error: data.error || 'Invalid licence key' };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}
```

**Verification:** On app load, if a licence key exists in localStorage, verify it with LemonSqueezy. If verification fails but was verified within the last 7 days, still allow Pro access (offline grace period). If it's been more than 7 days since last successful verification, disable Pro.

```typescript
async function checkProOnLoad(): Promise<boolean> {
  const state = getProState();
  if (!state.isActive || !state.licenceKey) return false;

  try {
    const valid = await verifyLicence(state.licenceKey);
    if (valid) {
      setProState({ ...state, lastVerified: new Date().toISOString() });
      return true;
    }
    // Licence no longer valid
    clearPro();
    return false;
  } catch {
    // Network error — check offline grace period
    if (state.lastVerified) {
      const daysSinceVerified = (Date.now() - new Date(state.lastVerified).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceVerified < 7) {
        return true; // Grace period
      }
    }
    clearPro();
    return false;
  }
}
```

### 1.3 React Integration

### File: `src/hooks/usePro.ts`

```typescript
interface UseProReturn {
  isPro: boolean;
  isLoading: boolean;        // true while checking licence on load
  activate: (key: string) => Promise<{ success: boolean; error?: string }>;
  deactivate: () => void;
}

function usePro(): UseProReturn;
```

- On mount, call `checkProOnLoad()` and set `isPro` accordingly
- Provide through React context so all components can access it

### File: `src/context/ProContext.tsx`

```typescript
const ProContext = createContext<UseProReturn>({ isPro: false, isLoading: true, activate: async () => ({ success: false }), deactivate: () => {} });

function ProProvider({ children }: { children: React.ReactNode }) {
  const pro = usePro();
  return <ProContext.Provider value={pro}>{children}</ProContext.Provider>;
}
```

Wrap the app in `ProProvider` in `layout.tsx` or the root component.

### 1.4 Update ProGate Component

Update `ProGate.tsx` to use the real Pro context instead of `isPro = false`:

```tsx
function ProGate({ feature, children }: ProGateProps) {
  const { isPro } = useContext(ProContext);

  if (isPro) return <>{children}</>;

  return (
    // existing overlay UI...
    // Update "Coming soon" text to "Upgrade to Pro" with a button
  );
}
```

### 1.5 Pro Upgrade UI

### File: `src/components/ProUpgrade.tsx`

A modal/bottom sheet that shows when the user taps "Upgrade to Pro" anywhere in the app.

```
┌──────────────────────────────────┐
│                                  │
│         ⚡ Binara Pro             │  ← Playfair Display
│                                  │
│  Unlock the full playground      │
│                                  │
│  ✓ Multi-layer beats (up to 4)  │
│  ✓ Stereo field controls        │
│  ✓ LFO modulation              │
│  ✓ Isochronic tones            │
│  ✓ Phone sensor control        │  ← highlight this one
│  ✓ Timeline editor             │
│  ✓ Session export (WAV)        │
│  ✓ Preset sharing              │
│  ✓ Unlimited saves             │
│  ✓ Custom carrier frequency    │
│  ✓ Unlimited ambient layers    │
│                                  │
│  ╭────────────────────────────╮  │
│  │  Upgrade · $7.99 one-time  │  │  ← Primary button → opens LemonSqueezy checkout
│  ╰────────────────────────────╯  │
│                                  │
│  One-time purchase. No           │
│  subscription. Yours forever.    │
│                                  │
│  ─── Already have a key? ───    │
│                                  │
│  [ Enter licence key ]    [Go]  │  ← Text input + activate button
│                                  │
│           [ Close ]              │
│                                  │
└──────────────────────────────────┘
```

**"Upgrade" button:** Opens the LemonSqueezy checkout URL in a new tab. The checkout URL should be configured as a constant:

```typescript
const LEMONSQUEEZY_CHECKOUT_URL = 'https://binara.lemonsqueezy.com/buy/YOUR_PRODUCT_ID';
// Replace with actual URL after creating the product in LemonSqueezy dashboard
```

**Licence key input:** For users who already purchased — they paste their key, tap "Go", and `activate()` is called.

**Post-activation:** On successful activation, show a brief celebration state (confetti emoji or sparkle animation), then close the modal. All ProGate overlays should immediately disappear.

### 1.6 URL-based Activation

When LemonSqueezy redirects back to `binara.app?licence_key=XXXX`, auto-activate:

```typescript
// In page.tsx or App.tsx useEffect:
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const key = params.get('licence_key');
  if (key) {
    activate(key).then(result => {
      if (result.success) {
        // Clean URL
        window.history.replaceState({}, '', '/');
        // Show success toast
      }
    });
  }
}, []);
```

### 1.7 Pro Badge in Header

When Pro is active, show a small badge in the header:

```
┌─────────────────────────────┐
│  B I N A R A     PRO   ⚙️   │
└─────────────────────────────┘
```

"PRO" badge: small pill with amber background, bold text. When Pro is NOT active, show a subtle "Upgrade" link in its place that opens ProUpgrade modal.

### 1.8 Update All Free Tier Limits

Now that Pro state is real, wire up all the limits properly:

| Feature | Free | Pro |
|---------|------|-----|
| Easy mode presets | All | All |
| Mix mode saves | 3 | Unlimited |
| Mix ambient layers | 2 | Unlimited |
| Mix custom carrier | ❌ | ✅ |
| Advanced beat layers | 1 | 4 |
| Advanced stereo panel | ❌ | ✅ |
| Advanced LFO panel | ❌ | ✅ |
| Advanced isochronic panel | ❌ | ✅ |
| Advanced timeline phases | 1 | Unlimited |
| Advanced saves | 1 | Unlimited |
| Phone sensors | ❌ | ✅ |
| Session export | ❌ | ✅ |
| Preset sharing | ❌ | ✅ |

Update all components that check `isPro` — they should now read from `ProContext` instead of using a hardcoded value.

---

## 2. Phone Sensor Integration (Pro Only)

This is the headline differentiator. Nobody else does this.

### 2.1 Sensor Engine

### File: `src/lib/sensor-engine.ts`

```typescript
interface SensorState {
  // DeviceOrientation
  pitch: number;           // forward/back tilt (-90 to +90 degrees)
  roll: number;            // left/right tilt (-90 to +90 degrees)

  // DeviceMotion
  acceleration: { x: number; y: number; z: number };
  motionMagnitude: number; // sqrt(x² + y² + z²) — overall movement intensity
  isStill: boolean;        // below stillness threshold
  breathRate: number | null; // detected breath cycles per minute (null if not detected)

  // Proximity
  isFaceDown: boolean;     // phone face-down on surface

  // Meta
  available: boolean;      // are sensors available on this device
  permissionGranted: boolean;
  active: boolean;         // is sensor tracking currently on
}

interface SensorConfig {
  tiltSensitivity: number;    // 0–1 (how responsive tilt mapping is)
  tiltFreqMin: number;        // minimum beat frequency when tilted (Hz)
  tiltFreqMax: number;        // maximum beat frequency when tilted (Hz)
  motionEnabled: boolean;     // track accelerometer
  breathDetection: boolean;   // attempt breath rhythm detection
  proximityEnabled: boolean;  // track face-down state
}

class SensorEngine {
  private state: SensorState;
  private config: SensorConfig;
  private listeners: Set<(state: SensorState) => void>;

  // Request permissions (iOS requires user gesture)
  async requestPermission(): Promise<boolean>;

  // Start tracking
  start(config: SensorConfig): void;

  // Stop tracking
  stop(): void;

  // Subscribe to state updates
  subscribe(listener: (state: SensorState) => void): () => void;

  // Get current state
  getState(): SensorState;

  // Map current tilt to a beat frequency
  getTiltFrequency(): number;

  // Map current tilt to stereo width
  getTiltStereoWidth(): number;
}
```

### 2.2 Tilt Control (DeviceOrientation API)

**Pitch (forward/back):** Maps to beat frequency.
- Phone flat (0°): uses the session's set beat frequency (no change)
- Tilted forward (+45°): increases beat frequency toward `tiltFreqMax`
- Tilted back (-45°): decreases beat frequency toward `tiltFreqMin`

```typescript
getTiltFrequency(): number {
  const { pitch } = this.state;
  const { tiltSensitivity, tiltFreqMin, tiltFreqMax } = this.config;

  // Normalise pitch to -1..+1 range (clamped at ±45°)
  const normPitch = Math.max(-1, Math.min(1, pitch / 45));

  // Apply sensitivity curve (higher sensitivity = more responsive at small angles)
  const curved = Math.sign(normPitch) * Math.pow(Math.abs(normPitch), 2 - tiltSensitivity);

  // Map to frequency range
  const midFreq = (tiltFreqMin + tiltFreqMax) / 2;
  const range = (tiltFreqMax - tiltFreqMin) / 2;
  return midFreq + curved * range;
}
```

**Roll (left/right):** Maps to stereo field width.
- Phone flat (0°): full stereo width (100%)
- Tilted left (-30°): narrowing toward mono (0%)
- Tilted right (+30°): expanding (stays at 100%)

```typescript
getTiltStereoWidth(): number {
  const { roll } = this.state;
  // Normalise roll to 0..1 (flat = 1, tilted left = 0)
  const normRoll = Math.max(0, Math.min(1, (roll + 30) / 30));
  return normRoll;
}
```

**Implementation:**

```typescript
private handleOrientation = (event: DeviceOrientationEvent) => {
  this.state.pitch = event.beta ?? 0;   // -180 to 180 (front/back)
  this.state.roll = event.gamma ?? 0;   // -90 to 90 (left/right)
  this.notifyListeners();
};

start() {
  window.addEventListener('deviceorientation', this.handleOrientation);
}
```

**iOS permission:**

```typescript
async requestPermission(): Promise<boolean> {
  // iOS 13+ requires explicit permission request
  if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
    try {
      const result = await (DeviceOrientationEvent as any).requestPermission();
      if (result === 'granted') {
        this.state.permissionGranted = true;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Android and older iOS: no permission needed
  this.state.permissionGranted = true;
  return true;
}
```

### 2.3 Motion / Breath Detection (DeviceMotion API)

**Stillness detection:**
When the phone is very still (placed on a surface or chest), detect it:

```typescript
private handleMotion = (event: DeviceMotionEvent) => {
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;

  this.state.acceleration = { x: acc.x ?? 0, y: acc.y ?? 0, z: acc.z ?? 0 };
  this.state.motionMagnitude = Math.sqrt(
    (acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2
  );

  // Stillness: magnitude close to gravity (9.81) with very low variance
  // Sample over last 2 seconds and check standard deviation
  this.motionHistory.push(this.state.motionMagnitude);
  if (this.motionHistory.length > 100) this.motionHistory.shift(); // 100 samples at ~50Hz = 2s

  const mean = this.motionHistory.reduce((a, b) => a + b, 0) / this.motionHistory.length;
  const variance = this.motionHistory.reduce((a, b) => a + (b - mean) ** 2, 0) / this.motionHistory.length;
  const stdDev = Math.sqrt(variance);

  this.state.isStill = stdDev < 0.15; // threshold — tune this
};
```

**Breath detection:**
When the phone is on the user's chest, the accelerometer picks up the rhythmic rise/fall of breathing. Detect this by:

1. Isolate the Z-axis (vertical when phone is face-up on chest)
2. Apply a bandpass filter: 0.1–0.5 Hz (6–30 breaths per minute)
3. Detect peaks in the filtered signal
4. Calculate breath rate from peak intervals

```typescript
// Simplified breath detection
private breathSamples: { time: number; z: number }[] = [];
private breathPeaks: number[] = [];

private detectBreath() {
  // Collect Z-axis samples
  this.breathSamples.push({ time: Date.now(), z: this.state.acceleration.z });

  // Keep last 30 seconds of data
  const cutoff = Date.now() - 30000;
  this.breathSamples = this.breathSamples.filter(s => s.time > cutoff);

  if (this.breathSamples.length < 50) return; // need enough data

  // Simple peak detection on Z-axis
  // Apply moving average smoothing (window: 10 samples)
  const smoothed = this.movingAverage(this.breathSamples.map(s => s.z), 10);

  // Find peaks (local maxima)
  const peaks: number[] = [];
  for (let i = 1; i < smoothed.length - 1; i++) {
    if (smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1]) {
      peaks.push(this.breathSamples[i].time);
    }
  }

  if (peaks.length >= 3) {
    // Calculate average interval between peaks
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = 60000 / avgInterval; // breaths per minute

    // Validate: reasonable breath rate is 6–30 BPM
    if (bpm >= 6 && bpm <= 30) {
      this.state.breathRate = Math.round(bpm * 10) / 10;
    } else {
      this.state.breathRate = null;
    }
  }
}
```

**When breath is detected and audio is playing:** Sync the LFO rate to the breath rate. If the LFO is active with target "volume", its rate follows the user's breathing — sound swells on inhale and fades on exhale.

### 2.4 Proximity / Face-Down Detection

Detect when the phone is face-down (placed on a surface or on the user's body):

```typescript
// Use DeviceOrientation to detect face-down
// When pitch (beta) is close to ±180° and the phone is still
private checkFaceDown() {
  const { pitch } = this.state;
  // Face-down: beta close to 180 or -180, or acceleration Z is positive (screen facing down)
  const isFaceDown = Math.abs(Math.abs(pitch) - 180) < 30 || this.state.acceleration.z > 8;
  this.state.isFaceDown = isFaceDown;
}
```

**When face-down:**
- Dim screen to black (apply a CSS class that sets `background: black` on a full-screen overlay)
- Disable touch events on the overlay (prevent accidental taps)
- Show a small muted text at bottom: "Phone face-down · Session active · Lift to interact"
- Continue audio playback normally

### 2.5 React Hook

### File: `src/hooks/useSensors.ts`

```typescript
interface UseSensorsReturn {
  available: boolean;
  permissionGranted: boolean;
  active: boolean;
  state: SensorState;
  config: SensorConfig;
  requestPermission: () => Promise<boolean>;
  start: (config?: Partial<SensorConfig>) => void;
  stop: () => void;
  updateConfig: (config: Partial<SensorConfig>) => void;
}

function useSensors(): UseSensorsReturn;
```

### 2.6 Sensor Control UI

### File: `src/components/SensorControl.tsx`

A panel that appears in the player view when Pro is active. Replaces the standard volume/controls area when sensor mode is enabled.

```
┌──────────────────────────────────┐
│  📱 Sensor Control          [On] │  ← Toggle sensor mode
├──────────────────────────────────┤
│                                  │
│       ╭───────────╮              │
│       │   📱      │              │  ← 3D phone orientation preview
│       │  ╱    ╲   │              │     (simple CSS 3D transform)
│       ╰───────────╯              │
│                                  │
│  Tilt → Frequency                │
│  Current: 6.2 Hz (Theta)        │  ← Live readout
│  Range: ───●────●─── 2–20 Hz    │  ← Min/max range slider (dual thumb)
│  Sensitivity: ────●── 70%       │  ← How responsive
│                                  │
│  Tilt → Stereo Width             │
│  Current: 85%                    │  ← Live readout
│                                  │
│  ── Motion ──                    │
│  Status: Still ● / Moving ○     │  ← Stillness indicator
│  Breath: 12.4 BPM 🫁            │  ← Breath rate (or "Not detected")
│  Sync LFO to breath: [On]       │  ← Toggle
│                                  │
│  ── Phone Position ──            │
│  Face down: No                   │  ← Status indicator
│                                  │
└──────────────────────────────────┘
```

**3D phone preview:**
A simple CSS 3D transform showing a phone rectangle that rotates to match the device orientation:

```css
.phone-preview {
  transform: perspective(400px)
    rotateX(calc(var(--pitch) * 1deg))
    rotateY(calc(var(--roll) * 1deg));
  transition: transform 0.1s ease-out;
}
```

Update `--pitch` and `--roll` CSS custom properties from the sensor state.

**Range slider (dual thumb):**
For the tilt frequency range, use two thumbs on a single slider to set min and max. If a dual-thumb slider is complex to build, use two separate sliders labelled "Min" and "Max" instead.

**Breath sync toggle:**
When enabled and breath is detected, automatically set the LFO rate to match the detected breath rate. Show a visual indicator (pulsing circle) that syncs with the detected breath rhythm.

### 2.7 Sensor Integration with Audio Engine

When sensors are active, they need to feed into the audio engine on every update:

```typescript
// In the player component, when sensor state updates:
useEffect(() => {
  if (!sensorActive || !audioEngine) return;

  // Tilt → beat frequency
  const tiltFreq = sensorEngine.getTiltFrequency();
  audioEngine.setCarrierFrequency(carrierFreq, carrierFreq + tiltFreq);

  // Tilt → stereo width (if stereo controls are active)
  const tiltWidth = sensorEngine.getTiltStereoWidth();
  audioEngine.setStereoConfig({ width: tiltWidth });

  // Stillness → deep mode
  if (sensorState.isStill && !wasStill) {
    // Gradually increase reverb, decrease volume slightly for "deep" feel
    // Optional: lower beat frequency by 1-2 Hz
  }

  // Breath → LFO sync
  if (breathSyncEnabled && sensorState.breathRate) {
    const breathHz = sensorState.breathRate / 60; // BPM to Hz
    audioEngine.setLFO({ ...currentLFO, rate: breathHz });
  }

}, [sensorState]);
```

**Throttle updates:** Sensor events fire at 50-60Hz. Throttle audio parameter updates to every 50ms (20Hz) to avoid overwhelming the audio engine with parameter changes.

### 2.8 Sensor Availability Detection

Not all devices have the required sensors. Detect availability early:

```typescript
function checkSensorAvailability(): { orientation: boolean; motion: boolean } {
  return {
    orientation: 'DeviceOrientationEvent' in window,
    motion: 'DeviceMotionEvent' in window,
  };
}
```

If sensors aren't available (desktop browsers, older devices), hide the sensor control panel entirely. Don't show a broken or useless feature.

---

## 3. Session Export (Pro Only)

### File: `src/lib/audio-export.ts`

Export the current session configuration as an audio file.

### 3.1 Export Flow

```
User taps "Export" in player → Choose format (WAV/MP3) → Choose duration →
Rendering progress bar → Download file
```

### 3.2 Offline Rendering

Use `OfflineAudioContext` to render the session at maximum speed (not real-time):

```typescript
interface ExportConfig {
  format: 'wav';             // WAV only for Phase 4 (MP3 needs lamejs, add later)
  duration: number;          // seconds
  sampleRate: number;        // 44100
  sessionConfig: any;        // the current session's audio config
}

async function exportSession(
  config: ExportConfig,
  onProgress: (percent: number) => void
): Promise<Blob> {
  const { duration, sampleRate, sessionConfig } = config;

  // Create offline context
  const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  // Recreate the entire audio graph in the offline context
  // This mirrors what AudioEngine.play() does, but using offlineCtx instead of real-time ctx
  buildAudioGraph(offlineCtx, sessionConfig);

  // For timeline sessions: schedule all frequency changes ahead of time
  scheduleTimelineChanges(offlineCtx, sessionConfig);

  // Render
  const audioBuffer = await offlineCtx.startRendering();

  // Encode to WAV
  const wavBlob = encodeWAV(audioBuffer);

  return wavBlob;
}
```

### 3.3 WAV Encoding

```typescript
function encodeWAV(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = audioBuffer.length * blockAlign;
  const bufferLength = 44 + dataLength; // 44-byte WAV header

  const buffer = new ArrayBuffer(bufferLength);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);           // chunk size
  view.setUint16(20, format, true);        // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Interleave channels and write PCM data
  const channels = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(audioBuffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
```

### 3.4 Export UI

### File: `src/components/ExportModal.tsx`

```
┌──────────────────────────────────┐
│  Export Session                   │
│                                  │
│  Format: [WAV]                   │  ← Single option for now
│                                  │
│  Duration:                       │
│  [ 5 min ] [ 10 ] [ 15 ] [ 20 ] │
│  [ 30 ] [ 60 ] [ Custom ]       │
│                                  │
│  Estimated file size: ~52 MB     │  ← Calculate: sampleRate * 2ch * 2bytes * seconds
│                                  │
│  ╭────────────────────────────╮  │
│  │  Export                    │  │
│  ╰────────────────────────────╯  │
│                                  │
│  ████████████░░░░░░ 62%          │  ← Progress bar (shown during export)
│  Rendering audio...              │
│                                  │
│           [ Cancel ]             │
└──────────────────────────────────┘
```

**Progress:** OfflineAudioContext doesn't provide progress callbacks natively. Estimate progress based on a timer: if rendering 60 seconds of audio typically takes ~3 seconds, show a smooth progress bar over that estimated duration. When rendering completes, jump to 100% and trigger the download.

**Download:** Create a temporary URL and trigger download:

```typescript
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

**Filename format:** `binara-{session-name}-{YYYY-MM-DD}.wav`

**Export button location:** Add an export icon button in the player view header (next to the back button). Also add to the session completion screen.

---

## 4. Preset Sharing (Pro Only)

### File: `src/lib/sharing.ts`

Users can share their session configurations via URL.

### 4.1 Encoding

Encode the session config as a compressed base64 string in the URL hash:

```typescript
function encodeSession(config: any): string {
  const json = JSON.stringify(config);
  // Compress with simple approach: btoa(json)
  // For smaller URLs, use a minimal key mapping
  const encoded = btoa(encodeURIComponent(json));
  return encoded;
}

function decodeSession(hash: string): any | null {
  try {
    const json = decodeURIComponent(atob(hash));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
```

**Sharing URL format:** `https://binara.app/#s=eyJ...`

### 4.2 Share Flow

User taps "Share" button in player or session complete screen:

1. Encode current session config
2. Generate URL: `https://binara.app/#s=${encoded}`
3. Copy to clipboard
4. Show toast: "Link copied! Share it with anyone."

```typescript
async function shareSession(config: any): Promise<void> {
  const encoded = encodeSession(config);
  const url = `https://binara.app/#s=${encoded}`;

  if (navigator.share) {
    // Native share sheet on mobile
    await navigator.share({
      title: 'Binara Session',
      text: 'Check out this binaural beats session I created',
      url,
    });
  } else {
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(url);
  }
}
```

### 4.3 Receiving Shared Sessions

On app load, check for a shared session in the URL hash:

```typescript
// In page.tsx or App.tsx useEffect:
useEffect(() => {
  const hash = window.location.hash;
  if (hash.startsWith('#s=')) {
    const encoded = hash.substring(3);
    const config = decodeSession(encoded);
    if (config) {
      // Load the session into the appropriate mode
      // Show a banner: "Shared session loaded! Tap Play to listen."
      // If the session uses Pro features and user is free, they can still PLAY it
      // but can't save or modify Pro-locked parameters
      loadSharedSession(config);
      // Clean URL
      window.history.replaceState({}, '', '/');
    }
  }
}, []);
```

**Free tier receiving shared sessions:** If someone shares a session that uses Pro features (multi-layer, LFO, etc.), the free-tier recipient CAN play it — they just can't save it or modify the Pro parameters. This is intentional — it lets them experience Pro features and incentivises upgrading.

### 4.4 Share Button

Add a share icon button:
- In the player view header (next to export button)
- On session completion screen
- On saved session cards (long-press or options menu)

---

## 5. File Structure (new files)

```
src/
├── components/
│   ├── ProUpgrade.tsx              # Pro upgrade modal with checkout link
│   ├── ExportModal.tsx             # Session export UI
│   ├── SensorControl.tsx           # Phone sensor controls and visualisation
│   ├── FaceDownOverlay.tsx         # Black screen overlay when phone face-down
│   └── ... (existing components)
├── context/
│   ├── ProContext.tsx               # Pro state provider
│   └── ... (existing contexts)
├── hooks/
│   ├── usePro.ts                   # Pro licence management hook
│   ├── useSensors.ts               # Phone sensor hook
│   └── ... (existing hooks)
├── lib/
│   ├── pro.ts                      # LemonSqueezy licence activation/verification
│   ├── sensor-engine.ts            # Device sensor tracking + breath detection
│   ├── audio-export.ts             # Offline rendering + WAV encoding
│   ├── sharing.ts                  # Session URL encoding/decoding
│   └── ... (existing libs)
└── types/
    └── index.ts                    # Add SensorState, SensorConfig, ExportConfig, etc.
```

---

## 6. Testing Checklist

### LemonSqueezy / Pro
- [ ] Pro state reads from localStorage correctly
- [ ] `isPro = false` by default for new users
- [ ] ProGate overlays use real Pro context (not hardcoded)
- [ ] "Upgrade" button opens LemonSqueezy checkout in new tab
- [ ] Licence key input activates Pro successfully (test with LemonSqueezy test key)
- [ ] URL-based activation works (`?licence_key=XXX`)
- [ ] URL is cleaned after activation
- [ ] Pro badge appears in header after activation
- [ ] All ProGate overlays disappear after activation
- [ ] All free tier limits are enforced correctly (saves, layers, features)
- [ ] All limits lift when Pro is active
- [ ] Offline grace period works (Pro stays active for 7 days without network)
- [ ] Expired/invalid licence key correctly disables Pro
- [ ] Deactivation works

### Phone Sensors
- [ ] Sensor availability correctly detected (true on mobile, false on desktop)
- [ ] iOS permission request works (triggered by button tap)
- [ ] Android: sensors work without explicit permission
- [ ] Tilt → frequency mapping works (test by tilting phone)
- [ ] Tilt → stereo width mapping works
- [ ] Sensitivity slider changes responsiveness
- [ ] Frequency range (min/max) slider limits the mapping range
- [ ] 3D phone preview matches actual device orientation
- [ ] Stillness detection works (phone on flat surface)
- [ ] Breath detection works (phone on chest, breathing normally) — this may be unreliable; that's OK
- [ ] Breath sync toggle connects breath rate to LFO
- [ ] Face-down detection works
- [ ] Face-down overlay shows black screen with "lift to interact" text
- [ ] Lifting phone dismisses the overlay
- [ ] Sensor data throttled to 20Hz (not overwhelming audio engine)
- [ ] Sensor panel hidden on desktop browsers
- [ ] Sensor panel hidden for free tier (shows Pro gate)
- [ ] Sensors stop cleanly when session ends

### Export
- [ ] Export modal opens from player
- [ ] Duration selector works
- [ ] File size estimate is roughly correct
- [ ] WAV export produces a valid, playable audio file
- [ ] Exported audio matches what was playing (correct frequencies, ambient, etc.)
- [ ] Progress indicator shows during rendering
- [ ] Download triggers automatically on completion
- [ ] Filename format is correct
- [ ] Export blocked for free tier with Pro upsell
- [ ] Large exports (60 min) don't crash the browser (monitor memory)

### Sharing
- [ ] Share button generates correct URL
- [ ] URL contains encoded session config
- [ ] Native share sheet opens on mobile (if supported)
- [ ] Clipboard copy fallback works on desktop
- [ ] Opening a shared URL loads the session correctly
- [ ] Shared sessions with Pro features play on free tier
- [ ] Free tier can't save/modify Pro parameters of shared session
- [ ] URL is cleaned after loading shared session
- [ ] Invalid/corrupted share URLs handled gracefully (no crash)

---

## 7. What NOT to Build in Phase 4

- ❌ MP3 export (WAV only for now — MP3 needs lamejs library, add later)
- ❌ Community preset gallery / public sharing
- ❌ Settings page (Phase 5)
- ❌ Promo page (Phase 5)
- ❌ Plausible analytics (Phase 5)
- ❌ Apple Watch / wearable integration
- ❌ AI recommendations

Focus on getting the payment flow bulletproof, the sensors magical, and export/sharing reliable.
