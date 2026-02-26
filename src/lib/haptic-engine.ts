export class HapticEngine {
  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _intensity = 0.5; // 0–1
  private _beatFreq = 4;
  private _phaseMultiplier = 1; // for ease in/out fading

  static get available(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  start(beatFreq: number, intensity: number): void {
    if (!HapticEngine.available) return;
    this._beatFreq = beatFreq;
    this._intensity = intensity;
    this._phaseMultiplier = 1;
    this._schedulePattern();
  }

  stop(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    if (HapticEngine.available) {
      navigator.vibrate(0);
    }
  }

  setIntensity(intensity: number): void {
    this._intensity = Math.max(0, Math.min(1, intensity));
  }

  setBeatFreq(beatFreq: number): void {
    if (Math.abs(this._beatFreq - beatFreq) > 0.1) {
      this._beatFreq = beatFreq;
      // Restart pattern with new frequency
      if (this._intervalId !== null) {
        this.stop();
        this._schedulePattern();
      }
    }
  }

  /** Set phase multiplier: 0 = silent, 1 = full. Used for ease-in/out and sleep fade. */
  setPhaseMultiplier(multiplier: number): void {
    this._phaseMultiplier = Math.max(0, Math.min(1, multiplier));
    if (this._phaseMultiplier <= 0.01) {
      // Effectively off — stop vibrating
      if (HapticEngine.available) navigator.vibrate(0);
    }
  }

  private _schedulePattern(): void {
    if (!HapticEngine.available) return;

    const vibrateChunk = () => {
      const effectiveIntensity = this._intensity * this._phaseMultiplier;
      if (effectiveIntensity <= 0.01) return;

      // Limit effective frequency to what motors can physically do
      let effectiveFreq = this._beatFreq;
      while (effectiveFreq > 15) effectiveFreq /= 2;

      const effectivePeriod = 1000 / effectiveFreq;
      const onMs = Math.max(10, effectivePeriod * 0.3 * effectiveIntensity);
      const offMs = Math.max(10, effectivePeriod - onMs);

      // Build a 2-second pattern chunk
      const chunkDuration = 2000;
      const cycles = Math.max(1, Math.floor(chunkDuration / effectivePeriod));
      const pattern: number[] = [];
      for (let i = 0; i < cycles; i++) {
        pattern.push(Math.round(onMs), Math.round(offMs));
      }

      navigator.vibrate(pattern);
    };

    vibrateChunk();
    this._intervalId = setInterval(vibrateChunk, 2000);
  }
}
