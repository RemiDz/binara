// ─── Sensor Engine ───
// Wraps DeviceOrientation + DeviceMotion APIs
// Provides tilt→frequency, tilt→stereo, stillness, breath detection, face-down

export interface SensorState {
  pitch: number;           // degrees, -180 to 180
  roll: number;            // degrees, -90 to 90
  acceleration: { x: number; y: number; z: number };
  motionMagnitude: number; // 0+
  isStill: boolean;
  breathRate: number;      // BPM (0 = not detected)
  isFaceDown: boolean;
  available: boolean;
  permissionGranted: boolean;
  active: boolean;
}

export interface SensorConfig {
  tiltSensitivity: number;  // 1–10, default 5
  tiltFreqMin: number;      // Hz, default 1
  tiltFreqMax: number;      // Hz, default 40
  motionEnabled: boolean;
  breathDetection: boolean;
  proximityEnabled: boolean;
}

type SensorListener = (state: SensorState) => void;

const DEFAULT_CONFIG: SensorConfig = {
  tiltSensitivity: 5,
  tiltFreqMin: 1,
  tiltFreqMax: 40,
  motionEnabled: true,
  breathDetection: true,
  proximityEnabled: true,
};

export class SensorEngine {
  private state: SensorState = {
    pitch: 0,
    roll: 0,
    acceleration: { x: 0, y: 0, z: 0 },
    motionMagnitude: 0,
    isStill: true,
    breathRate: 0,
    isFaceDown: false,
    available: false,
    permissionGranted: false,
    active: false,
  };

  private config: SensorConfig = { ...DEFAULT_CONFIG };
  private listeners: Set<SensorListener> = new Set();
  private lastNotify = 0;
  private motionHistory: number[] = [];
  private zHistory: { time: number; value: number }[] = [];
  private lastBreathPeakTime = 0;
  private breathIntervals: number[] = [];

  private boundOnOrientation = this.onOrientation.bind(this);
  private boundOnMotion = this.onMotion.bind(this);

  constructor() {
    this.state.available = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    if (typeof window === 'undefined') return false;
    return 'DeviceOrientationEvent' in window || 'DeviceMotionEvent' in window;
  }

  static get available(): boolean {
    if (typeof window === 'undefined') return false;
    return 'DeviceOrientationEvent' in window || 'DeviceMotionEvent' in window;
  }

  async requestPermission(): Promise<boolean> {
    // iOS 13+ requires explicit permission
    const DeviceOrientationEvt = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };

    if (DeviceOrientationEvt.requestPermission) {
      try {
        const result = await DeviceOrientationEvt.requestPermission();
        this.state.permissionGranted = result === 'granted';
      } catch {
        this.state.permissionGranted = false;
      }
    } else {
      // Android / non-iOS: permission is implicit
      this.state.permissionGranted = true;
    }

    this.notify();
    return this.state.permissionGranted;
  }

  start(config?: Partial<SensorConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    window.addEventListener('deviceorientation', this.boundOnOrientation);
    window.addEventListener('devicemotion', this.boundOnMotion);

    this.state.active = true;
    this.notify();
  }

  stop(): void {
    window.removeEventListener('deviceorientation', this.boundOnOrientation);
    window.removeEventListener('devicemotion', this.boundOnMotion);

    this.state.active = false;
    this.motionHistory = [];
    this.zHistory = [];
    this.breathIntervals = [];
    this.notify();
  }

  subscribe(listener: SensorListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): SensorState {
    return { ...this.state };
  }

  getConfig(): SensorConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<SensorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ─── Derived values ───

  getTiltFrequency(): number {
    const { pitch } = this.state;
    const { tiltSensitivity, tiltFreqMin, tiltFreqMax } = this.config;

    // Map pitch -45..+45 to 0..1 with sensitivity curve
    const maxAngle = 45;
    const normalised = Math.max(0, Math.min(1, (pitch + maxAngle) / (2 * maxAngle)));

    // Apply sensitivity: higher = more responsive near center
    const sensExponent = 1 + (10 - tiltSensitivity) * 0.3;
    const curved = Math.pow(normalised, sensExponent);

    return tiltFreqMin + curved * (tiltFreqMax - tiltFreqMin);
  }

  getTiltStereoWidth(): number {
    // Map roll -90..+90 to 0..1
    const normalised = Math.max(0, Math.min(1, (this.state.roll + 90) / 180));
    return normalised;
  }

  // ─── Event handlers ───

  private onOrientation(e: DeviceOrientationEvent): void {
    if (!this.state.permissionGranted) {
      this.state.permissionGranted = true;
    }

    this.state.pitch = e.beta ?? 0;  // front-back tilt
    this.state.roll = e.gamma ?? 0;  // left-right tilt

    // Face-down detection
    const absPitch = Math.abs(this.state.pitch);
    this.state.isFaceDown = Math.abs(absPitch - 180) < 30;

    this.throttledNotify();
  }

  private onMotion(e: DeviceMotionEvent): void {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;

    this.state.acceleration = {
      x: acc.x ?? 0,
      y: acc.y ?? 0,
      z: acc.z ?? 0,
    };

    // Motion magnitude
    const mag = Math.sqrt(
      (acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2
    );
    // Subtract gravity (~9.8) to get movement magnitude
    this.state.motionMagnitude = Math.abs(mag - 9.8);

    // Face-down from acceleration (backup)
    if (this.config.proximityEnabled && (acc.z ?? 0) > 8) {
      this.state.isFaceDown = true;
    }

    // Stillness detection: stdDev of 2s motion history < 0.15
    if (this.config.motionEnabled) {
      this.motionHistory.push(this.state.motionMagnitude);
      const maxHistoryLength = 40; // ~2s at 20Hz
      if (this.motionHistory.length > maxHistoryLength) {
        this.motionHistory.shift();
      }

      if (this.motionHistory.length >= 10) {
        const mean = this.motionHistory.reduce((a, b) => a + b, 0) / this.motionHistory.length;
        const variance = this.motionHistory.reduce((sum, v) => sum + (v - mean) ** 2, 0) / this.motionHistory.length;
        this.state.isStill = Math.sqrt(variance) < 0.15;
      }
    }

    // Breath detection: Z-axis moving average + peak detection
    if (this.config.breathDetection) {
      this.detectBreath(acc.z ?? 0);
    }

    this.throttledNotify();
  }

  private detectBreath(z: number): void {
    const now = Date.now();
    this.zHistory.push({ time: now, value: z });

    // Keep 10s of data
    const cutoff = now - 10000;
    this.zHistory = this.zHistory.filter((h) => h.time > cutoff);

    if (this.zHistory.length < 20) return;

    // Simple moving average (window = 5)
    const smoothed: number[] = [];
    for (let i = 2; i < this.zHistory.length - 2; i++) {
      const avg = (
        this.zHistory[i - 2].value +
        this.zHistory[i - 1].value +
        this.zHistory[i].value +
        this.zHistory[i + 1].value +
        this.zHistory[i + 2].value
      ) / 5;
      smoothed.push(avg);
    }

    // Peak detection
    const peaks: number[] = [];
    for (let i = 1; i < smoothed.length - 1; i++) {
      if (smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1]) {
        const peakTime = this.zHistory[i + 2].time;
        // Min 2s between peaks (max 30 BPM)
        if (peaks.length === 0 || peakTime - peaks[peaks.length - 1] > 2000) {
          peaks.push(peakTime);
        }
      }
    }

    if (peaks.length >= 2) {
      // Calculate average interval between last few peaks
      const intervals: number[] = [];
      for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = 60000 / avgInterval;

      // Valid breath range: 6–30 BPM
      if (bpm >= 6 && bpm <= 30) {
        this.state.breathRate = Math.round(bpm * 10) / 10;
      }
    }
  }

  // ─── Throttled notify (max 20Hz) ───

  private throttledNotify(): void {
    const now = Date.now();
    if (now - this.lastNotify < 50) return;
    this.lastNotify = now;
    this.notify();
  }

  private notify(): void {
    const snapshot = { ...this.state };
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
