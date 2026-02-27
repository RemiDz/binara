# BINARA — Audio Crack Fix & Sleep Timer Test Mode

## Two fixes, do in this order.

---

## 1. Audio Crack/Click on Screen Lock

### Problem
There's an audible click/crack sound when the user locks their phone screen. The AudioContext is briefly suspending during the OS screen transition, causing a discontinuity in the audio output.

### Fix

Add a micro-fade protection around visibility changes. When the screen locks, briefly fade audio to 0 over 50ms, let the AudioContext settle, then fade back up. This masks any click from the suspend/resume cycle — the fade is so fast it's imperceptible, but it prevents the hard audio cut.

```typescript
let volumeBeforeHide = 1;

document.addEventListener('visibilitychange', () => {
  if (!audioCtx || !masterGain) return;
  
  const now = audioCtx.currentTime;

  if (document.visibilityState === 'hidden') {
    // Store current volume
    volumeBeforeHide = masterGain.gain.value;
    
    // Micro-fade to 0 over 50ms to mask any suspend click
    masterGain.gain.setValueAtTime(volumeBeforeHide, now);
    masterGain.gain.linearRampToValueAtTime(0, now + 0.05);
    
    // Resume AudioContext after a brief delay if it suspends
    setTimeout(async () => {
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      // Fade back up
      const resumeNow = audioCtx.currentTime;
      masterGain.gain.setValueAtTime(0, resumeNow);
      masterGain.gain.linearRampToValueAtTime(volumeBeforeHide, resumeNow + 0.05);
    }, 100);

  } else {
    // Returning to foreground — ensure audio is at correct volume
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(volumeBeforeHide, now + 0.05);
  }
});
```

Apply the same micro-fade to the `ambientGain` node as well — ambient layers can also crack on suspend.

### Test
- [ ] Lock phone screen during a session — NO click or crack sound
- [ ] Audio continues playing smoothly after screen lock
- [ ] Unlock phone — audio still playing at correct volume, no click
- [ ] Repeat 5 times rapidly (lock/unlock) — no audio glitches
- [ ] Test with ambient layers playing — no crack on those either

---

## 2. Sleep Timer Fade-Out Test Mode

### Problem
Cannot easily test the 3-minute fade-out without waiting for a full session to nearly complete.

### Temporary Change
Reduce the sleep timer fade-out duration from 180 seconds (3 minutes) to 30 seconds. This is TEMPORARY for testing — I will tell you to change it back to 180 seconds after I've verified it works.

Find the fade-out duration constant (likely `180` or `fadeSeconds = 180`) and change it to `30`.

### Also
Set the sleep timer countdown to start from a shorter duration for testing: when the timer is set to "15m", make it actually count down from 2 minutes instead. This way I can test the full flow (countdown → fade warning → fade-out → silent stop) within 2 minutes.

**Mark both changes clearly with a `// TODO: REVERT AFTER TESTING` comment so they're easy to find and restore.**

### Test
- [ ] Start a sleep preset with 15m timer → session starts with 2:00 countdown
- [ ] At 0:30 remaining, countdown text starts pulsing
- [ ] Audio fades out smoothly over the final 30 seconds
- [ ] Fade is gradual — no sudden drops, smooth ramp to silence
- [ ] At 0:00, all audio stops silently
- [ ] No completion chime on sleep preset
- [ ] Start a focus preset with 15m timer → same 2:00 countdown
- [ ] Fade works the same, but a gentle bowl chime plays at completion
- [ ] Ambient layers fade out at the same rate as the beat

---

## What NOT to Touch
- ✅ Session Phases — working correctly, do not modify
- ✅ Background Audio / Media Session — only add the micro-fade, don't change anything else
- ✅ All other features — unchanged
