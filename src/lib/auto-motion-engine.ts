// ─── Auto Motion Engine ───
// Simulates gyroscope tilt using layered sine waves.
// Produces the same pitch/roll values as real device orientation,
// feeding into the exact same modulation pipeline as SensorEngine.

export interface AutoMotionState {
  pitch: number;      // degrees, simulated
  roll: number;       // degrees, simulated
  active: boolean;
  intensity: number;  // 0–100
}

type AutoMotionListener = (state: AutoMotionState) => void;

// Layered sine frequencies + amplitudes for organic figure-8 drift
const PITCH_LAYERS = [
  { freq: 0.023, amp: 1.0 },
  { freq: 0.041, amp: 0.6 },
  { freq: 0.11,  amp: 0.25 },
  { freq: 0.37,  amp: 0.07 },
];

const ROLL_LAYERS = [
  { freq: 0.031, amp: 1.0 },
  { freq: 0.047, amp: 0.55 },
  { freq: 0.13,  amp: 0.2 },
  { freq: 0.43,  amp: 0.06 },
];

const MAX_PITCH = 30;  // degrees
const MAX_ROLL = 35;   // degrees

export class AutoMotionEngine {
  private state: AutoMotionState = {
    pitch: 0,
    roll: 0,
    active: false,
    intensity: 50,
  };

  private listeners: Set<AutoMotionListener> = new Set();
  private rafId = 0;
  private startTime = 0;
  private pitchPhases: number[];
  private rollPhases: number[];

  constructor() {
    // Random initial phases so each session feels different
    this.pitchPhases = PITCH_LAYERS.map(() => Math.random() * Math.PI * 2);
    this.rollPhases = ROLL_LAYERS.map(() => Math.random() * Math.PI * 2);
  }

  start(): void {
    if (this.state.active) return;
    this.startTime = performance.now() / 1000;
    this.state.active = true;
    this.notify();
    this.loop();
  }

  stop(): void {
    if (!this.state.active) return;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.state.active = false;
    this.state.pitch = 0;
    this.state.roll = 0;
    this.notify();
  }

  setIntensity(value: number): void {
    this.state.intensity = Math.max(0, Math.min(100, value));
  }

  getState(): AutoMotionState {
    return { ...this.state };
  }

  subscribe(listener: AutoMotionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.stop();
    this.listeners.clear();
  }

  // ─── Derived values (identical math to SensorEngine) ───

  getTiltFrequency(tiltSensitivity = 5, tiltFreqMin = 1, tiltFreqMax = 40): number {
    const { pitch } = this.state;
    const maxAngle = 45;
    const normalised = Math.max(0, Math.min(1, (pitch + maxAngle) / (2 * maxAngle)));
    const sensExponent = 1 + (10 - tiltSensitivity) * 0.3;
    const curved = Math.pow(normalised, sensExponent);
    return tiltFreqMin + curved * (tiltFreqMax - tiltFreqMin);
  }

  getTiltStereoWidth(): number {
    const normalised = Math.max(0, Math.min(1, (this.state.roll + 90) / 180));
    return normalised;
  }

  // ─── Internal ───

  private loop = (): void => {
    if (!this.state.active) return;

    const t = performance.now() / 1000 - this.startTime;
    const scale = this.state.intensity / 100;

    // Sum layered sines for pitch
    let pitchSum = 0;
    let pitchAmpTotal = 0;
    for (let i = 0; i < PITCH_LAYERS.length; i++) {
      const layer = PITCH_LAYERS[i];
      pitchSum += Math.sin(t * layer.freq * Math.PI * 2 + this.pitchPhases[i]) * layer.amp;
      pitchAmpTotal += layer.amp;
    }
    // Normalise to [-1, 1] then scale
    this.state.pitch = (pitchSum / pitchAmpTotal) * scale * MAX_PITCH;

    // Sum layered sines for roll
    let rollSum = 0;
    let rollAmpTotal = 0;
    for (let i = 0; i < ROLL_LAYERS.length; i++) {
      const layer = ROLL_LAYERS[i];
      rollSum += Math.sin(t * layer.freq * Math.PI * 2 + this.rollPhases[i]) * layer.amp;
      rollAmpTotal += layer.amp;
    }
    this.state.roll = (rollSum / rollAmpTotal) * scale * MAX_ROLL;

    this.notify();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private notify(): void {
    const snapshot = { ...this.state };
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
