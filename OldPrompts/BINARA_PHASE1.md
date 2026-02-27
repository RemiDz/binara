# BINARA — Phase 1: Sleep Timer, Session Phases & Background Audio

## Implement all three features in this order: Background Audio first, then Sleep Timer, then Session Phases.

---

## 1. Background Audio (Screen Lock Support)

### Why First
Without this, the Sleep Timer and Session Phases are pointless — if audio stops when the screen locks, nothing else matters.

### Implementation

Register Binara as a media session so the OS treats it as a music player and doesn't suspend it:

```typescript
if ('mediaSession' in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: presetName,           // e.g. "Deep Focus"
    artist: 'Binara',
    album: waveState.label,      // e.g. "Beta · 16 Hz"
    artwork: [
      { src: '/icons/binara-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/binara-512.png', sizes: '512x512', type: 'image/png' },
    ]
  });

  navigator.mediaSession.setActionHandler('play', () => resumeSession());
  navigator.mediaSession.setActionHandler('pause', () => pauseSession());
  navigator.mediaSession.setActionHandler('stop', () => stopSession());
}
```

**What this enables:**
- Audio continues when screen locks on iOS and Android
- Lock screen shows: preset name, "Binara", brainwave info
- Lock screen play/pause/stop controls work
- Notification shade on Android shows playback controls

**Additional requirements:**
- Update metadata when user switches presets or starts a new session
- Clear media session when session stops
- Make sure the AudioContext is not suspended by the browser — on visibility change, check `audioCtx.state` and call `audioCtx.resume()` if needed:

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
});
```

- Disable or reduce any visual animations (waveforms, canvas elements) when the page is hidden to save battery:

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    pauseAllAnimations();
  } else {
    resumeAllAnimations();
  }
});
```

**Icons needed:**
- Create `/public/icons/binara-192.png` and `/public/icons/binara-512.png` — simple Binara logo on dark background for lock screen artwork

### Test Checklist
- [ ] Start a session → lock screen → audio continues playing
- [ ] Lock screen shows preset name and Binara branding
- [ ] Lock screen play/pause controls work
- [ ] Switch to another app → audio continues
- [ ] Return to Binara → session is still running, UI reflects correct state
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Animations pause when screen is locked/hidden (battery saving)
- [ ] AudioContext doesn't get suspended on iOS after 30+ seconds in background

---

## 2. Sleep Timer

### UI Location

Add the sleep timer control inside the session view, between the volume control and the ambient layers section. It should feel like a natural part of the session controls, not a separate feature.

### Timer Options

A horizontal scrollable row of pill buttons:

```
Off   15m   30m   45m   60m   90m   ∞
```

- **Off**: no timer (session plays until manually stopped) — this is the DEFAULT for non-sleep presets
- **15m / 30m / 45m / 60m / 90m**: auto-stop after this duration
- **∞ (infinity)**: play indefinitely (same as Off, but visually distinct for users who consciously choose "no limit")

For **sleep category presets** (Fall Asleep, Deep Sleep, Insomnia Relief, Power Nap), default to **30m** instead of Off.

### Active Timer Display

When a timer is set and the session is playing:
- Show countdown below the main session timer: "Sleep timer: 23:41 remaining"
- Small font, low opacity — informational, not prominent
- When under 3 minutes remaining, the text gently pulses to indicate fade-out is approaching

### Fade-Out Behaviour

This is the most important part. Do NOT abruptly stop audio.

**Last 3 minutes of the timer:**
1. Begin gradually reducing master volume using `linearRampToValueAtTime`
2. Ramp from current volume to 0 over 180 seconds (3 minutes)
3. Also fade out all ambient layers at the same rate
4. When volume reaches 0, stop all audio sources and clean up

```typescript
function beginSleepFadeOut(audioCtx: AudioContext, masterGain: GainNode, ambientGain: GainNode) {
  const now = audioCtx.currentTime;
  const fadeSeconds = 180; // 3 minutes

  // Fade master (beats)
  masterGain.gain.setValueAtTime(masterGain.gain.value, now);
  masterGain.gain.linearRampToValueAtTime(0, now + fadeSeconds);

  // Fade ambient
  ambientGain.gain.setValueAtTime(ambientGain.gain.value, now);
  ambientGain.gain.linearRampToValueAtTime(0, now + fadeSeconds);

  // Schedule full stop after fade completes
  setTimeout(() => {
    stopSession();
  }, fadeSeconds * 1000);
}
```

### Completion

When the sleep timer finishes:
- All audio stops silently (already faded to 0)
- Session state updates to "completed"
- NO completion chime for sleep presets (don't wake the user!)
- For non-sleep presets with a timer: optional soft completion chime (a gentle singing bowl tone, 2 seconds, at 20% volume)
- Clear the media session / lock screen controls

### Remembering Timer Setting

- Store the last-used timer value per preset category in localStorage
- Next time the user opens a sleep preset, it defaults to their last-used sleep timer
- Next time they open a focus preset, it defaults to their last-used focus timer (probably Off)

### Test Checklist
- [ ] Timer pills display correctly in session view
- [ ] Tapping a timer value selects it (visual highlight)
- [ ] Countdown displays and counts down accurately
- [ ] At 3 minutes remaining, volume begins fading out smoothly
- [ ] At 0 minutes, all audio stops completely
- [ ] No abrupt audio cut at any point
- [ ] Sleep presets default to 30m timer
- [ ] Non-sleep presets default to Off
- [ ] Timer setting is remembered per category
- [ ] Pausing the session pauses the sleep timer countdown
- [ ] Resuming the session resumes the countdown
- [ ] Changing the timer mid-session works (e.g. extending from 30m to 60m)
- [ ] Sleep presets: NO completion chime
- [ ] Non-sleep presets with timer: gentle completion chime plays
- [ ] Timer works correctly with background audio (screen locked)

---

## 3. Session Phases (Ease In → Deep → Ease Out)

### Concept

Every session has three phases. The binaural beat frequency is not flat — it transitions smoothly, creating a more natural and effective brainwave entrainment experience.

### Phase Structure

| Phase | Duration | What Happens |
|-------|----------|--------------|
| **Ease In** | 12% of total session | Frequency starts at a comfortable baseline and smoothly ramps to the target |
| **Deep Session** | 76% of total session | Holds the target frequency steady |
| **Ease Out** | 12% of total session | Frequency smoothly returns toward baseline (except sleep presets) |

**Example: Deep Focus preset (Beta 16Hz, 25 minutes)**
- Ease In (3 min): Beat frequency ramps from 10Hz (Alpha) → 16Hz (Beta)
- Deep Session (19 min): Holds at 16Hz
- Ease Out (3 min): Ramps from 16Hz → 10Hz (Alpha)

**Example: Fall Asleep preset (Delta 2Hz, 30 minutes)**
- Ease In (3.5 min): Beat frequency ramps from 8Hz (Alpha) → 2Hz (Delta)
- Deep Session (23 min): Holds at 2Hz
- Ease Out (3.5 min): NO frequency ramp — instead, volume fades gently (don't wake them up by shifting to Alpha)

### Ease In Starting Frequencies

The ease-in always starts from a lighter brainwave state than the target:

| Target State | Ease In Starts At |
|-------------|-------------------|
| Delta (0.5–4 Hz) | Alpha 8 Hz |
| Theta (4–8 Hz) | Alpha 10 Hz |
| Alpha (8–14 Hz) | Low Beta 14 Hz |
| Beta (14–30 Hz) | Alpha 10 Hz |
| Gamma (30–100 Hz) | Beta 20 Hz |

### Frequency Ramping

Use smooth exponential interpolation, not linear — it should feel organic:

```typescript
function getPhaseFrequency(
  elapsedSeconds: number,
  totalSeconds: number,
  targetFreq: number,
  startFreq: number,
  isSleepPreset: boolean
): number {
  const easeInEnd = totalSeconds * 0.12;
  const easeOutStart = totalSeconds * 0.88;

  if (elapsedSeconds < easeInEnd) {
    // Ease In: smooth ramp from startFreq to targetFreq
    const progress = elapsedSeconds / easeInEnd;
    const smoothProgress = progress * progress * (3 - 2 * progress); // smoothstep
    return startFreq + (targetFreq - startFreq) * smoothProgress;
  } else if (elapsedSeconds < easeOutStart) {
    // Deep Session: hold target
    return targetFreq;
  } else {
    // Ease Out
    if (isSleepPreset) {
      // Sleep: no frequency change, just volume fade (handled by sleep timer)
      return targetFreq;
    }
    const progress = (elapsedSeconds - easeOutStart) / (totalSeconds - easeOutStart);
    const smoothProgress = progress * progress * (3 - 2 * progress); // smoothstep
    return targetFreq + (startFreq - targetFreq) * smoothProgress;
  }
}
```

Update the beat oscillator frequencies every 100ms using `setTargetAtTime` for smooth transitions:

```typescript
// In a setInterval or requestAnimationFrame loop (every 100ms):
const currentBeatFreq = getPhaseFrequency(elapsed, total, target, start, isSleep);
const baseCarrier = 200; // or whatever the carrier frequency is

leftOsc.frequency.setTargetAtTime(baseCarrier, audioCtx.currentTime, 0.1);
rightOsc.frequency.setTargetAtTime(baseCarrier + currentBeatFreq, audioCtx.currentTime, 0.1);
```

### Phase Indicator UI

Show a subtle visual indicator in the session view so the user knows which phase they're in:

```
● Ease In    ○ Deep Session    ○ Ease Out
```

- Three small dots/labels in a horizontal row
- Active phase dot is filled and uses the brainwave colour
- Inactive phases are outlined/dimmed
- Smooth transition between phases (dot fill animates)
- Below the main timer

Also show the current beat frequency in real-time next to the phase indicator:
```
● Ease In                          12.3 Hz
━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

A thin progress bar spanning the full width, filled portion represents session progress, with phase boundaries marked as subtle notches.

### Interaction with Sleep Timer

When both sleep timer and session phases are active:
- Session phases calculate based on the TIMER duration, not the preset's default duration
- If the user sets a 30m sleep timer on a preset that defaults to 60m, the phases compress to fit 30 minutes
- The sleep timer's 3-minute fade-out takes priority over the ease-out phase — if both overlap, the volume fade wins

### Interaction with Create Mode

In Create mode, session phases are **optional** — add a toggle:
- "Session Phases" toggle in Create mode controls
- When off: flat frequency, no ramping (current behaviour)
- When on: ease in/out behaviour applied to the custom frequency

### Test Checklist
- [ ] Ease In: frequency starts at the correct baseline and ramps to target
- [ ] The ramp is smooth (no stepping, no audible clicks)
- [ ] Deep Session: frequency holds steady at target
- [ ] Ease Out (non-sleep): frequency ramps back toward baseline
- [ ] Ease Out (sleep): frequency stays at target (volume fade only)
- [ ] Phase indicator shows correct active phase
- [ ] Current beat frequency updates in real-time
- [ ] Progress bar shows session progress with phase markers
- [ ] Phases scale correctly to different session/timer durations
- [ ] Short sessions (15m) still have distinct phases (not too compressed)
- [ ] Long sessions (90m) have comfortable ease periods
- [ ] Create mode: phases toggle works on/off
- [ ] Phases work correctly with sleep timer active
- [ ] Phases work correctly with background audio (screen locked)
- [ ] Phase transitions are inaudible — no clicks, pops, or jumps

---

## Implementation Order

1. **Background Audio** — do this first, test it, deploy it
2. **Sleep Timer** — depends on background audio working
3. **Session Phases** — most complex, do last

Deploy after each feature so you can test in production between them.

---

## What NOT to Touch

- ✅ Ambient layer playback — unchanged
- ✅ Phone Sensors / Auto Motion — unchanged  
- ✅ Card preview playback — unchanged
- ✅ PRO gating — unchanged
- ✅ /sell and /promo pages — unchanged
- ✅ Mix and Create mode core logic — unchanged (except adding phase toggle to Create)
