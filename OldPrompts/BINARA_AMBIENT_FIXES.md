# BINARA — Ambient Layer Audio Fixes

## Three Problems to Fix

### Problem 1: Fire sound is white noise
The current "Fire" ambient layer sounds like loud white noise — harsh and unnatural. Real fire has a specific spectral character: low-frequency crackle (60–300 Hz), mid-frequency roar (200–800 Hz), and sharp high-frequency pops (random transients). White noise is flat across the spectrum and sounds nothing like fire.

**Fix:** Replace the current Fire synthesis with a proper fire algorithm:

```
Architecture:
1. Base layer — brown noise (filtered white noise, -6dB/octave rolloff)
   - Use a BiquadFilter (lowpass, cutoff ~400Hz, Q ~0.7) on a white noise source
   - This creates the low rumble/roar

2. Crackle layer — random short bursts
   - Generate random gain envelope bursts (5–30ms duration)
   - Bandpass filter them (800–3000Hz)
   - Randomise timing: trigger every 50–300ms (Math.random intervals)
   - Randomise amplitude per burst (0.1–0.5)

3. Master shaping
   - Slow LFO (0.05–0.2Hz) on the base layer gain to create "breathing" intensity
   - Overall lowpass at ~4000Hz to remove harshness
   - Gentle compression to keep peaks under control
```

The key is the crackle layer — without random transients, any fire synth just sounds like filtered noise. The bursts should be SHORT (clicks/pops, not sustained).

### Problem 2: Forest birds sound like whistles
The bird sounds are likely simple sine wave oscillators with pitch sweeps — which produces a synthetic whistle, not a bird call. Real birdsong has:
- Rapid frequency modulation (vibrato/trill)
- Amplitude envelope shaping (attack–sustain–release per note)
- Multiple notes in quick succession (phrases)
- Frequency range typically 1500–8000 Hz
- Silence between phrases (birds don't sing continuously)

**Fix:** Replace the current bird synthesis with a more realistic approach:

```
Architecture:
1. Base tone — sine oscillator

2. Frequency modulation — fast LFO (15–40Hz) modulating pitch
   - Depth: ±50–200Hz (varies per "species")
   - This creates the trill/warble character

3. Amplitude envelope per note
   - Quick attack (5–15ms)
   - Short sustain (30–100ms) 
   - Quick release (20–50ms)
   - This shapes each chirp as a distinct note, not a continuous tone

4. Phrase generator
   - Each "bird" plays 2–6 notes in quick succession (50–150ms gaps)
   - Then silence for 2–8 seconds before next phrase
   - Randomise: base pitch, number of notes, gap between notes, silence duration
   - Have 2–3 "birds" with different base frequencies and timing offsets

5. Background layer
   - Very gentle brown noise (barely audible) for forest ambience
   - Optional: slow filtered noise sweeps for "wind through trees" texture

6. Each bird note sequence:
   startPitch = 2000 + Math.random() * 3000
   for each note in phrase:
     pitch = startPitch + (noteIndex * randomDirection * 100–400Hz)
     schedule oscillator start/stop with envelope
     apply FM vibrato during the note
```

The critical difference: individual NOTES with silence between them, not a continuous sweeping tone. And FM vibrato on each note, not just pitch slides.

### Problem 3: Ambient layers affected by Create mode effects
When a user builds a custom sound in Create mode and applies effects (filter, LFO, stereo panning, isochronic gating, etc.), the ambient layer audio is ALSO being processed through those effects. Ambient layers should play clean and unaffected — they're background texture, not part of the binaural beat.

**Fix:** The ambient layer audio chain must be completely separate from the beat/effect chain.

```
Current (broken):
  Beat Oscillators → Effects Chain → Master Gain → Destination
  Ambient Sources  → Effects Chain → Master Gain → Destination
                     ^^^^^^^^^^^^
                     BUG: ambient goes through effects

Correct:
  Beat Oscillators → Effects Chain → Master Gain → Compressor → Destination
  Ambient Sources  → Ambient Gain ─────────────────────────────→ Destination
                     (or → Compressor → Destination if you want
                      ambient included in the limiter)
```

Implementation:
1. Create a dedicated `ambientGainNode` connected directly to the AudioContext destination (or to the final compressor/limiter only)
2. All ambient sources connect to `ambientGainNode` — NOT to any node in the effects chain
3. The ambient volume control adjusts `ambientGainNode.gain`
4. The effects chain (filter, LFO, isochronic gate, stereo panner) should ONLY have beat oscillators as input
5. Verify: when user toggles filter/LFO/isochronic/stereo in Create mode, ambient sound should be completely unchanged

**Audio graph should look like:**
```
[Left Osc] ──→ [Left Gain] ──→ [Merger] ──→ [Filter?] ──→ [LFO Gain?] ──→ [Isochronic Gate?] ──→ [Stereo Panner?] ──→ [Beat Gain] ──→ [Compressor] ──→ [Destination]
[Right Osc] ──→ [Right Gain] ──↗

[Fire/Forest/Rain/etc. Source] ──→ [Ambient Gain] ──→ [Compressor] ──→ [Destination]
```

The ambient path joins ONLY at the compressor (for overall limiting) or goes straight to destination. It must bypass filter, LFO, isochronic gate, and stereo panner entirely.

---

## Priority Order

1. **Problem 3 first** (ambient routing) — this is an architectural fix that affects how ambient sources connect. Fix the routing before improving the sounds themselves.
2. **Problem 1** (fire) — replace the synthesis algorithm
3. **Problem 2** (forest birds) — replace the synthesis algorithm

---

## Test Checklist

### Ambient Routing (Problem 3)
- [ ] Open Create mode → add a beat → add Fire ambient layer → hear fire
- [ ] Toggle filter ON → beat sound changes, fire sound does NOT change
- [ ] Toggle LFO ON → beat pulses, fire does NOT pulse
- [ ] Toggle isochronic ON → beat gates, fire does NOT gate
- [ ] Toggle stereo ON → beat pans, fire stays centred/natural
- [ ] Adjust filter cutoff → only beat affected
- [ ] Ambient volume slider still works independently
- [ ] Multiple ambient layers play simultaneously without routing issues
- [ ] Listen mode presets with ambient layers still work correctly

### Fire Sound (Problem 1)
- [ ] Fire sounds like a crackling campfire, not white noise
- [ ] Audible random crackle/pop transients
- [ ] Low rumble base layer present
- [ ] Intensity varies naturally over time (breathing effect)
- [ ] Not harsh or piercing at any volume
- [ ] Sounds good at low volume (not just rumble — crackles still audible)

### Forest/Birds Sound (Problem 2)  
- [ ] Birds sound like distinct chirps/trills, not continuous whistles
- [ ] Clear silence gaps between bird phrases
- [ ] Multiple "birds" with different pitches audible
- [ ] Each note has a natural attack-sustain-release shape
- [ ] Warble/vibrato audible on individual notes
- [ ] Overall effect feels organic and varied, not robotic/looping
- [ ] Gentle background ambience layer present beneath birds

### No Regressions
- [ ] Rain ambient still sounds correct
- [ ] Ocean/waves ambient still sounds correct
- [ ] All other ambient layers unaffected
- [ ] Listen mode playback unchanged
- [ ] Mix mode playback unchanged
- [ ] Beat audio quality unchanged in all modes
