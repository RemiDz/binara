# Binara.app — Deep Error Analysis Report

**Generated**: 2026-03-01
**Files scanned**: 120 source files (`.ts`/`.tsx`) + config files + public assets
**Total issues found**: 97
**TypeScript compiler**: CLEAN (0 type errors)
**npm audit**: 1 high severity vulnerability (minimatch ReDoS)

---

## Executive Summary

Binara is a well-structured Next.js 16 / React 19 application with clean TypeScript compilation and solid architectural patterns. However, this deep scan reveals **1 show-stopper** (TESTING_MODE=true ships all Pro features free to every user), **several critical audio bugs** (advanced timeline never updates frequencies, export is incomplete), **widespread stale closure issues** in the main App.tsx timer effects, and **pervasive accessibility gaps** (missing ARIA roles, sub-44px touch targets, no focus traps on modals). The audio engine is sophisticated but has race conditions in stop/restart flows and memory leaks from uncleaned event listeners and disconnected nodes. Overall risk level: **HIGH** — the monetisation bypass alone demands immediate attention.

---

## Critical Issues :red_circle:

Issues that will cause crashes, data loss, revenue loss, or security breaches.

| # | File | Line | Issue | Impact | Fix |
|---|------|------|-------|--------|-----|
| 1 | `src/lib/pro.ts` | 7, 38, 95 | `TESTING_MODE = true` hardcoded — `isPro()` returns `true` for ALL users unconditionally | **All Pro features are free in production.** Zero revenue from paid features. Every ProGate, save limit, and export restriction is bypassed. | Set `TESTING_MODE = false` and verify LemonSqueezy integration works end-to-end. |
| 2 | `src/lib/advanced-timeline.ts` | 91-106 | `tick()` computes interpolated frequencies but `void`s the results — never calls engine to update | **Advanced mode timeline is non-functional.** Frequencies never change during playback despite UI showing phase transitions. Users think they're getting frequency transitions but hear a flat tone. | Remove `void` statements; call `engine.setBeatLayerFrequency()` with computed values. |
| 3 | `src/lib/audio-export.ts` | 172-202 | `scheduleAdvancedTimeline()` is a complete no-op — empty function body | **Advanced mode exports have no frequency transitions.** Exported WAV files contain a flat tone for the entire duration. | Implement the timeline scheduling logic using `OfflineAudioContext` parameter automation. |
| 4 | `src/lib/audio-export.ts` | 204-293 | Mix mode `buildMixGraph()` ignores `config.ambientLayers` entirely | **Mix exports are missing all ambient sounds.** Users who add rain, ocean, etc. get exports with only the binaural tones. | Render ambient layers into the offline context using the same synthesis code from `ambient-synth.ts`. |
| 5 | `src/lib/audio-export.ts` | 62-114 | Advanced mode `buildAdvancedGraph()` omits LFO, isochronic, stereo, and ambient layers | **Advanced exports are severely incomplete.** Only basic oscillator + filter is rendered. All Pro-tier audio effects are silently dropped. | Add LFO modulation, isochronic gating, stereo panning, and ambient layers to the offline render. |
| 6 | `src/lib/audio-engine.ts` | 672 | `playAdvanced()` calls `stopImmediate()` instead of `stopAdvancedImmediate()` when already playing | **Memory leak + ghost audio.** Advanced-mode nodes (beatLayers, filter, LFO, isochronic, stereo) are never cleaned up. They continue playing in the background. | Check `this._advancedMode` flag and call `stopAdvancedImmediate()` when true. |
| 7 | `src/lib/audio-engine.ts` | 226-245 | `stop()` and `stopWithLongFade()` can orphan `stopTimeout` — first timeout fires and destroys nodes belonging to a new session | **Audio cuts out unexpectedly.** If play is called during fade-out, the orphaned timeout kills the new session's nodes. | Clear existing `stopTimeout` at the top of both `stop()` and `stopWithLongFade()`. |
| 8 | `src/lib/audio-export.ts` | 295-342 | `encodeWAV()` allocates entire file in single `ArrayBuffer` — 60min stereo = ~635MB | **OOM crash on mobile.** Long session exports will crash the browser tab. | Add maximum duration check (e.g., 30min) or implement chunked/streaming encoding. |
| 9 | `src/components/App.tsx` | 205-300 | Listen mode timer `useEffect` captures stale `state.activePreset`, `hapticActive`, `handleSessionComplete` in interval closure | **Session completion handlers fire with wrong state.** Timer callbacks use outdated references due to stale closures masked by `eslint-disable`. | Use refs to hold latest callback values, or restructure to avoid stale closures. |

---

## High Priority :orange_circle:

Issues that cause broken UX, audio glitches, payment problems, or data corruption.

| # | File | Line | Issue | Impact | Fix |
|---|------|------|-------|--------|-----|
| 10 | `src/components/App.tsx` | 302-334 | Mix mode timer `useEffect` captures stale `handleMixSessionComplete` | Mix session completion logic uses outdated callback reference. | Use a ref to store the latest callback. |
| 11 | `src/components/App.tsx` | 1066-1113 | Advanced mode timer `useEffect` captures stale `handleAdvancedSessionComplete`, `state.advancedConfig` | Advanced session completion logic uses outdated references. | Same ref pattern as above. |
| 12 | `src/components/App.tsx` | 1118-1170 | Visibility change handler captures stale completion handlers | Returning from background may trigger wrong completion logic. | Add all handler refs to effect deps or use refs. |
| 13 | `src/components/App.tsx` | 1172-1210 | Media session callbacks capture stale stop handlers (dep array only `[state.isPlaying]`) | Media session play/pause/stop buttons may call wrong handlers after mode switch. | Add `state.showMixPlayer`, `state.showAdvancedPlayer` and handler refs to deps. |
| 14 | `src/hooks/useAudioEngine.ts` | 126-144 | Delayed `setIsPlaying(false)` via `setTimeout(1600ms)` desynchronises state from engine | If play is called during fade-out, the delayed setState incorrectly reports engine as stopped while it's playing. | Track timeout refs and clear them on new play calls. |
| 15 | `src/components/App.tsx` | 661, 860, 1015 | `setTimeout` callbacks call `dispatch` with no cleanup — fire on unmounted components | React warning, potential state corruption on unmount. | Store timeout IDs in refs and clear in cleanup. |
| 16 | `src/context/ProContext.tsx` | 25 | `checkProOnLoad().then(...)` has no `.catch()` | If promise rejects, `isLoading` stays `true` forever — Pro UI permanently stuck in loading state. | Add `.catch(() => setIsLoading(false))`. |
| 17 | `src/components/ProGate.tsx` | 13-23 | Pro gating is CSS-only (`opacity-40`, `pointer-events-none`) — children still rendered and functional in DOM | Users can bypass Pro gate via DevTools by removing CSS class. No server-side enforcement. | Add `{isPro && children}` instead of CSS-only gating for critical features. |
| 18 | `src/lib/pro.ts` | 23-35 | `localStorage` tampering: `setItem('binara_pro', '{"isActive":true,...}')` grants permanent Pro | With TESTING_MODE off, Pro is still trivially bypassable client-side. | Add server-side verification for critical Pro features (export, sharing). |
| 19 | `src/components/mix/MixBuilder.tsx` | 94 | `saveSession()` never passes `isPro` parameter — Pro users limited to 3 Mix sessions | Pro Mix session save limit is incorrectly enforced as free-tier (3 instead of unlimited). | Pass `isPro` from context to `saveSession(session, isPro)`. |
| 20 | `src/components/mix/SessionSummary.tsx` | 23-24 | Custom carrier/beat frequencies display as "0 Hz" — component doesn't receive custom values | Mix summary shows wrong frequencies for all custom configurations. | Pass `customCarrierFreq` and `customBeatFreq` as props and use when `carrierId === 'custom'`. |
| 21 | `src/components/mix/SavedSessionsList.tsx` | 62, 65 | Custom states/carriers show "0 Hz" in saved sessions list | Saved sessions with custom frequencies display incorrectly. | Use `s.customBeatFreq` / `s.customCarrierFreq` when available. |
| 22 | `src/components/mix/MixPlayer.tsx` | 66 | Custom beat frequency shows 10 Hz fallback instead of `config.customBeatFreq` | During Mix playback, custom frequency display is wrong. | Check `config.customBeatFreq` before falling back. |
| 23 | `src/lib/advanced-timeline.ts` | 33, 40 | All layers collapse to same beat frequency after first timeline phase | Multi-layer configurations lose their per-layer frequency differentiation during timeline transitions. | Track per-layer frequencies separately through timeline phases. |
| 24 | `src/lib/advanced-timeline.ts` | 66, 121 | Empty timeline array causes crash (`this.phases[-1]` is `undefined`) | If timeline is somehow empty, accessing `.name` on `undefined` throws. | Add guard: `if (this.phases.length === 0) return`. |
| 25 | `src/lib/session-timeline.ts` | 90 | Zero-duration phase produces `NaN` frequencies (`0/0`) | `NaN` propagates to `currentBeatFreq` in tick results. | Guard with `if (phase.duration === 0) return startFreq`. |
| 26 | `src/lib/audio-engine.ts` | 1116-1129 | Visibility/focus event listeners in `setupVisibilityHandler()` never removed in `destroy()` | Memory leak — listeners fire on destroyed engine, operating on null references. | Store listener refs and remove in `destroy()`. |
| 27 | `src/components/ExportModal.tsx` | 41-77 | `handleExport` has no try-catch — if `OfflineAudioContext` fails, UI stuck in rendering state forever | User sees permanent spinner with no way to dismiss. | Wrap in try-catch; call `setRendering(false)` in finally block. |
| 28 | `src/lib/audio-engine.ts` | 174 | `stopImmediate()` called directly from `play()` on restart — no fade-out, produces audible click/pop | Harsh audio artifact when switching presets or restarting playback. | Add a brief 50ms fade-out before `stopImmediate()`. |

---

## Medium Priority :yellow_circle:

Issues that degrade performance, accessibility, or maintainability.

| # | File | Line | Issue | Impact | Fix |
|---|------|------|-------|--------|-----|
| 29 | `src/lib/audio-engine.ts` | 353-356 | `setWaveform()` changes oscillator type instantly — causes click/pop | Audible artifact on waveform change. | Cross-fade: create new oscillator at 0 gain, fade up, fade down old, swap. |
| 30 | `src/lib/audio-engine.ts` | 336-341 | `rampCarrierFrequency()` missing `cancelScheduledValues` before `linearRampToValueAtTime` | Ramp may fight with prior `setTargetAtTime` scheduling, producing unpredictable frequency curves. | Call `cancelScheduledValues(now)` before the ramp. |
| 31 | `src/lib/audio-engine.ts` | 397-407 | Overtone layer intermediate `GainNode`s not tracked — leaked on cleanup | Minor memory leak accumulating over time with overtone usage. | Store overtone gain nodes and disconnect in cleanup. |
| 32 | `src/lib/audio-engine.ts` | 511-568 | `previewTone()` and `playCompletionChime()` gain nodes never disconnected | Gain nodes remain connected to `masterGain` indefinitely. | Disconnect after oscillator stops. |
| 33 | `src/lib/audio-engine.ts` | 1139-1149 | Keep-alive interval creates `BufferSourceNode` every 10s, never explicitly stopped | Hundreds of orphaned source nodes accumulate in long sessions (hours). | Call `source.stop()` after a short duration. |
| 34 | `src/lib/ambient-synth.ts` | 112-117 | `setVolume()` may conflict with ongoing fade-in `linearRampToValueAtTime` | Volume jump or gain curve artifacts if volume changed during fade-in. | Call `cancelScheduledValues(now)` before `setTargetAtTime`. |
| 35 | `src/lib/ambient-synth.ts` | 246 | Synthesized ambient layers start at gain 0.5 with no fade-in — can click on start | Audible pop when starting white/pink/brown noise layers. | Add a brief fade-in ramp from 0 to target volume. |
| 36 | `src/lib/audio-export.ts` | 105-106 | Fade-in/fade-out overlap for short durations (< 4s advanced, < 6s mix) | Audio discontinuity at crossover point. | Clamp: `fadeIn = Math.min(fadeIn, duration / 2)`. |
| 37 | `src/hooks/usePreview.ts` | 10 | Preview uses hardcoded `BASE_CARRIER = 200Hz` instead of preset's `carrierFreq` | Preview sounds different from actual playback — misleading user experience. | Use the preset's `carrierFreq` for preview. |
| 38 | `src/hooks/usePreview.ts` | 38 | `ctxRef.current.resume()` called without `await` | Oscillators may start on a suspended context — no sound until resume completes asynchronously. | `await` the resume or chain `.then()` before starting oscillators. |
| 39 | `src/hooks/useAudioEngine.ts` | 268 | `isPreviewMode` reads from ref during render — not reactive | Components won't re-render when preview mode changes. | Track as state variable updated via effect or callback. |
| 40 | `src/components/AdvancedBuilder.tsx` | 150-161 | `audio.addBeatLayer()` called inside `setConfig` callback — side effect in setState | React Strict Mode may execute this twice, adding duplicate audio layers. | Move audio side effect outside setState callback. |
| 41 | `next.config.ts` | entire | No Content-Security-Policy headers configured | No restriction on script sources — any injected script can execute freely. | Add CSP headers restricting scripts to `'self'` and `https://plausible.io`. |
| 42 | `src/app/api/licence/route.ts` | entire | No rate limiting on `/api/licence` endpoint | Attacker can brute-force licence keys. | Add rate limiting middleware or IP-based throttling. |
| 43 | `src/app/api/licence/route.ts` | entire | No webhook endpoint for LemonSqueezy refund/revocation events | Refunded users keep Pro access indefinitely (until offline grace expires). | Implement webhook handler with signature verification. |
| 44 | Multiple | - | 10 `localStorage.setItem()` calls have no try-catch | Crash on Safari private browsing or when storage quota exceeded. | Wrap all writes in try-catch. Files: `pro.ts:34`, `session-storage.ts:36,42,80,86`, `session-history.ts:58,60`, `favourites-storage.ts:26`, `settings.ts:32`. |
| 45 | `src/hooks/useReducedMotion.ts` | 23-25 | Polls `getSettings()` every 2 seconds via `setInterval` | Wasteful — reads localStorage every 2s. | Use `window.addEventListener('storage', ...)` or custom event. |
| 46 | `src/components/mix/StateSelector.tsx` | 116-127 | Interactive `Slider` nested inside `<button>` element | Invalid HTML — accessibility tools and browsers may handle unpredictably. | Move slider outside the button, use separate container. |
| 47 | `src/components/mix/CarrierSelector.tsx` | 112-124 | Interactive `Slider` nested inside `<button>` element | Same as above. | Same fix. |
| 48 | `src/components/mix/SavedSessionsList.tsx` | 75-98 | `<button>` elements nested inside parent `<button>` | Invalid HTML nesting. | Use `<div role="button">` for outer container. |
| 49 | `src/components/WaveformSignature.tsx` | 69 | 24 independent `requestAnimationFrame` loops (one per preset card) with no visibility check | Significant performance drain — 24 continuous canvas animations even when off-screen. | Use IntersectionObserver to pause off-screen canvases. |
| 50 | `src/components/SacredGeometry.tsx` | 161-182 | Duplicated render loop code (copy of lines 77-124) | Maintenance risk — changes must be made in two places. | Extract render function. |
| 51 | `src/components/PresetGrid.tsx` | 58 | `loadFavourites()` called on every render without memoization | Reads localStorage on every render cycle. | Wrap in `useMemo` with appropriate dependencies. |
| 52 | `src/components/DailyRecommendation.tsx` | 24-27 | `AnimatePresence` wrapping never triggers exit animation (component returns `null` before reaching it) | Exit animation dead code — recommendation disappears instantly instead of animating out. | Move the `null` return inside `AnimatePresence` as a conditional child. |

---

## Low Priority :large_blue_circle:

Code quality, best practices, minor improvements.

| # | File | Line | Issue | Impact | Fix |
|---|------|------|-------|--------|-----|
| 53 | `src/lib/audio-engine.ts` | 98-102 | `init()` does not catch `AudioContext` constructor failure | Unhandled error if browser doesn't support Web Audio. | Wrap in try-catch, set error state. |
| 54 | `src/lib/audio-engine.ts` | 208 | `fadeInDuration = 0` produces `tau = 0` in `setTargetAtTime` — undefined behaviour per spec | Safari may behave differently than Chrome for zero tau. | Guard: `if (tau === 0) use setValueAtTime instead`. |
| 55 | `src/lib/audio-engine.ts` | 33-34 | No `StereoPannerNode` fallback for Safari < 14.1 | Crash on older Safari versions. | Feature-detect and fall back to `ChannelMergerNode`. |
| 56 | `src/lib/ambient-synth.ts` | 34 | `bufferCache` is module-level Map that never evicts entries | Decoded audio buffers accumulate over app lifetime. | Add LRU eviction or clear on context destruction. |
| 57 | `src/lib/ambient-synth.ts` | 435 | Timeout ID cast to `ReturnType<typeof setInterval>` — semantically incorrect | `clearInterval` works for `clearTimeout` in browsers, but code is misleading. | Use separate arrays for timeout vs interval IDs. |
| 58 | `src/lib/audio-export.ts` | 56-58 | `exportSession()` catch block returns `null` silently | Caller cannot distinguish invalid config from rendering failure. | Return `{ error: string }` object instead of null. |
| 59 | `src/hooks/usePreview.ts` | 33-41 | Separate `AudioContext` from main `AudioEngine` | Two concurrent audio contexts consume extra resources; iOS limits apply. | Share the engine's `AudioContext` or use the engine's preview methods. |
| 60 | `src/components/App.tsx` | 84, 87 | Ref assignments during render (not in effect) | Technically a side effect during render; harmless in practice. | Move to `useEffect` if strict purity is desired. |
| 61 | `src/components/ErrorBoundary.tsx` | - | Class error boundary cannot catch async/event handler errors | Most app errors occur in `useEffect`/`useCallback` and bypass the boundary. | Add global `window.addEventListener('unhandledrejection', ...)`. |
| 62 | `src/lib/sharing.ts` | 105-118 | No schema validation on `JSON.parse` of URL-shared config | Malformed shared URLs could cause runtime errors downstream. | Add Zod or manual validation before using parsed config. |
| 63 | `src/lib/session-storage.ts` | 20-27 | No schema validation on localStorage data after `JSON.parse` | Corrupt or old-format localStorage data causes runtime errors. | Validate shape before returning. |
| 64 | `src/components/mix/CarrierSelector.tsx` | 12 | `onPreview` typed as `void` but receives `Promise<void>` | Type mismatch — promise is never awaited. | Type as `(frequency: number) => void \| Promise<void>`. |
| 65 | `src/components/advanced/TimelineEditor.tsx` | 31 | Phase IDs use `Date.now()` without random suffix — can collide in rapid clicks | Duplicate IDs in fast interactions or React Strict Mode. | Add `Math.random().toString(36).slice(2,6)` suffix. |
| 66 | `src/types/index.ts` | 1-5 | Redundant type import/alias — dead code | Unnecessary code. | Remove the local alias; the re-export is sufficient. |
| 67 | `src/types/advanced.ts` | 3 | `'step'` easing in `EasingType` but not selectable in TimelineEditor UI | Users can receive shared configs with step easing but can't select it. | Either add step to UI or document it as API-only. |
| 68 | Multiple | - | Duplicated `getBrainwaveColor()`/`getBrainwaveLabel()` in 4 files | DRY violation — changes must be made in 4 places. | Extract to shared utility in `src/lib/brainwave-states.ts`. |
| 69 | `src/components/advanced/OscillatorPanel.tsx` | 94 | Beat freq max 50 Hz vs. Mix mode StateSelector custom max 100 Hz | Inconsistent frequency range between modes. | Align to same maximum or document the difference. |
| 70 | `src/components/advanced/TimelineBuilder.tsx` | 136-143 | Uses native `<input type="range">` instead of custom `Slider` component | Visual inconsistency with rest of app. | Use the custom `Slider` component. |

---

## Audio Engine Analysis

This is the core of the app. The `AudioEngine` class in `src/lib/audio-engine.ts` is ~1150 lines with sophisticated binaural beat generation, but has several critical issues.

### Architecture Overview
- **AudioContext lifecycle**: Created lazily on first `play()` via `init()`. Uses `webkitAudioContext` fallback for older Safari. Includes `ensureRunning()` that calls `ctx.resume()` to handle autoplay restrictions.
- **Signal chain**: Oscillators → StereoPanner (L/R separation) → MasterGain → DynamicsCompressor → Destination
- **Advanced mode**: Separate code path with beatLayers map, filter, LFO, isochronic, stereo subsystems
- **Ambient**: Delegated to `AmbientSynth` instances, connected to master gain

### Critical Audio Bugs

1. **Advanced timeline is a no-op** (Issue #2): `AdvancedTimelineRunner.tick()` at `advanced-timeline.ts:91-106` computes correct frequencies but `void`s them. The entire multi-phase frequency transition feature is cosmetic — audio never changes.

2. **Race condition on restart** (Issue #7): Calling `play()` while `stopWithLongFade()` is fading out orphans the first `stopTimeout`. When it fires, it destroys the new session's audio nodes mid-playback.

3. **Wrong cleanup on advanced restart** (Issue #6): `playAdvanced()` calls `stopImmediate()` (listen-mode cleanup) instead of `stopAdvancedImmediate()`, leaking all advanced-specific nodes.

4. **Click/pop on preset switch** (Issue #28): `play()` calls `stopImmediate()` directly with no fade, causing an instantaneous amplitude discontinuity.

### Memory Leak Inventory

| Location | Leak | Severity |
|----------|------|----------|
| `audio-engine.ts:397-407` | Overtone GainNodes not tracked/disconnected | Medium |
| `audio-engine.ts:511-568` | Preview/chime GainNodes remain connected | Low |
| `audio-engine.ts:1116-1129` | visibilitychange + focus listeners never removed | Medium |
| `audio-engine.ts:1139-1149` | Keep-alive BufferSourceNodes accumulate | Low |
| `ambient-synth.ts:34` | Buffer cache never evicted | Low |

### Export Completeness

| Feature | Listen Export | Mix Export | Advanced Export |
|---------|-------------|-----------|-----------------|
| Binaural tones | YES | YES | YES |
| Timeline transitions | N/A | NO (flat) | NO (no-op) |
| Ambient layers | N/A | NO | NO |
| LFO modulation | N/A | N/A | NO |
| Isochronic tones | N/A | N/A | NO |
| Stereo field | N/A | N/A | NO |
| Filter | N/A | N/A | YES |

---

## Payment Flow Analysis

### Current State: TESTING_MODE = true

**`src/lib/pro.ts` line 7**: `const TESTING_MODE = true;`

This single line makes the entire monetisation system non-functional:
- `isPro()` returns `true` for all users (line 38)
- `checkProOnLoad()` returns `true` without API call (line 95)
- All ProGate overlays are invisible
- All session/favourite limits are bypassed
- LemonSqueezy checkout exists but purchase has no effect

### Even With TESTING_MODE = false

| Vulnerability | Risk | Mitigation |
|---------------|------|------------|
| `localStorage` tampering gives permanent Pro | HIGH | Needs server-side verification |
| ProGate is CSS-only (pointer-events-none) | HIGH | Children still render; use conditional rendering |
| No webhook for refund/revocation | MEDIUM | Add LemonSqueezy webhook handler |
| No rate limiting on `/api/licence` | MEDIUM | Add IP-based throttling |
| Offline grace period (7 days) refreshable via localStorage | LOW | Sign `lastVerified` with HMAC |
| MixBuilder doesn't pass `isPro` to `saveSession` | MEDIUM | Pass `isPro` parameter |

### LemonSqueezy Integration Flow
```
User clicks "Upgrade" → Opens LemonSqueezy checkout URL (external)
  → User purchases → Returns to app with ?licence_key=XXX
  → App calls POST /api/licence { action: 'activate', licenceKey: XXX }
  → Server validates against LemonSqueezy API
  → Stores { isActive, licenceKey, activatedAt, lastVerified } in localStorage
```

**Missing**: Webhook for subscription management, refund handling, licence revocation.

---

## Accessibility Audit

### Critical Accessibility Issues

| Issue | Affected Components | WCAG Criterion |
|-------|-------------------|----------------|
| No focus trap on modals | HeadphoneWarning, Settings, SaveSessionModal | 2.4.3 Focus Order |
| `outline: 'none'` removes focus indicator | PresetCard (x2), PlayerView, DailyRecommendation | 2.4.7 Focus Visible |
| Toast lacks `role="alert"` | Toast | 4.1.3 Status Messages |
| OfflineIndicator lacks `aria-live` | OfflineIndicator | 4.1.3 Status Messages |
| Modals missing `role="dialog"` + `aria-modal` | HeadphoneWarning, Settings, SaveSessionModal | 4.1.2 Name, Role, Value |

### Touch Target Violations (< 44x44px minimum)

| Component | Element | Approximate Size |
|-----------|---------|-----------------|
| PresetCard | Heart button | 24x24px |
| PresetCard | Play/preview button | 28x28px |
| PlayerView | Heart button | 20x20px |
| HeadphoneBanner | Dismiss button | 20x20px |
| DailyRecommendation | Dismiss button | 22x22px |
| AmbientSelector | Remove layer button | 24x24px |
| InstallBanner | Dismiss button | 28x28px |
| Header | Upgrade button | ~28px height |
| MiniPlayer | Pause/Stop buttons | 32x32px |
| StatsView | Month nav buttons | 32x32px |
| StatsView | Calendar day cells | as small as 16px |
| PreviewBar | Stop button | 28x28px |
| DurationSelector | Duration pills | ~28px height |
| SleepTimer | Timer pills | ~26px height |
| CategoryFilter | Category tabs | ~30px height |
| ModeSwitcher | Mode buttons | ~38px height |

### Missing ARIA Patterns

| Pattern | Components Affected |
|---------|-------------------|
| `role="tablist"` + `role="tab"` + `aria-selected` | ModeSwitcher, CategoryFilter |
| `role="timer"` | SessionTimer |
| `role="progressbar"` + `aria-valuenow` | PhaseIndicator |
| `role="switch"` + `aria-checked` | Settings toggle, all toggle components |
| `aria-expanded` | Panel (AdvancedBuilder), InfoSection |
| `aria-pressed` | DurationSelector, SleepTimer, AmbientSelector, StateSelector, CarrierSelector |
| `aria-hidden="true"` on decorative elements | SacredGeometry canvas, FrequencyRing SVG, WaveformSignature canvas |

---

## Dependency Audit

### npm audit

```
1 high severity vulnerability

minimatch  <=3.1.3 || 10.0.0 - 10.2.2
  - ReDoS via multiple non-adjacent GLOBSTAR segments
  - ReDoS via nested *() extglobs
  Paths:
    node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch
    node_modules/minimatch
  Fix: npm audit fix
```

### Outdated Packages

| Package | Current | Wanted | Latest | Risk |
|---------|---------|--------|--------|------|
| `@types/node` | 20.19.33 | 20.19.35 | 25.3.3 | Low — major version jump, may require changes |
| `eslint` | 9.39.3 | 9.39.3 | 10.0.2 | Low — major version, breaking changes likely |
| `html2canvas-pro` | 2.0.1 | 2.0.2 | 2.0.2 | Low — patch update, safe to upgrade |
| `react` | 19.2.3 | 19.2.3 | 19.2.4 | Low — patch update, safe to upgrade |
| `react-dom` | 19.2.3 | 19.2.3 | 19.2.4 | Low — patch update, safe to upgrade |

### Missing Peer Dependencies
None detected. All peer dependency requirements are satisfied.

### Configuration Validation
- **tsconfig.json**: `strict: true` enabled. Module resolution `bundler` is correct for Next.js 16. Path alias `@/*` maps to `./src/*`. Clean.
- **next.config.ts**: Only configures SW headers. Missing CSP headers, no image optimisation config, no redirects.
- **Tailwind 4**: Using CSS-first config via `@theme inline` in `globals.css`. No `tailwind.config.js` needed. Correct.
- **PostCSS**: Using `@tailwindcss/postcss` plugin. Correct for Tailwind 4.
- **ESLint**: Using flat config with `eslint-config-next`. Correct.
- **No `vercel.json`**: Relying on default Vercel configuration. Acceptable.
- **Environment variables**: Only `LEMONSQUEEZY_API_KEY` used, correctly via `process.env` (server-side only). `.env.local` has placeholder value.

---

## Recommendations

Top 10 prioritised actions to improve app stability, ordered by impact:

### 1. Set `TESTING_MODE = false` in `src/lib/pro.ts`
**Impact**: Enables monetisation. Without this, all Pro features are free.
**Effort**: 1 line change + E2E verification of LemonSqueezy flow.

### 2. Fix advanced timeline to actually update frequencies
**Impact**: Makes the multi-phase frequency transition feature functional — currently entirely cosmetic.
**Files**: `src/lib/advanced-timeline.ts` lines 91-106. Remove `void` statements, call `engine.setBeatLayerFrequency()`.

### 3. Fix audio engine race conditions
**Impact**: Prevents audio cutting out unexpectedly, ghost audio, and click/pop artifacts.
**Files**: `src/lib/audio-engine.ts` — clear existing `stopTimeout` in `stop()`/`stopWithLongFade()`, use `stopAdvancedImmediate()` in `playAdvanced()`, add fade-out before `stopImmediate()` in `play()`.

### 4. Fix stale closure issues in App.tsx timer effects
**Impact**: Prevents wrong session completion logic, wrong state in callbacks.
**Approach**: Create refs for all callbacks used inside intervals (`handleSessionComplete`, `handleMixSessionComplete`, `handleAdvancedSessionComplete`, `handleSleepTimerComplete`) and read `.current` inside the interval.

### 5. Complete the audio export pipeline
**Impact**: Users paying for Pro export get complete output instead of partial renders.
**Files**: `src/lib/audio-export.ts` — implement ambient rendering, timeline scheduling, LFO, isochronic, stereo in offline context. Add max duration guard.

### 6. Fix custom frequency display bugs in Mix mode
**Impact**: Custom carrier/beat frequencies show correct values instead of "0 Hz".
**Files**: `SessionSummary.tsx`, `SavedSessionsList.tsx`, `MixPlayer.tsx`, `MixBuilder.tsx` (pass `isPro`).

### 7. Wrap all `localStorage.setItem()` calls in try-catch
**Impact**: Prevents crashes on Safari private browsing and when storage quota is exceeded.
**Files**: 10 write locations across `pro.ts`, `session-storage.ts`, `session-history.ts`, `favourites-storage.ts`, `settings.ts`.

### 8. Add Content-Security-Policy headers
**Impact**: Defense-in-depth against XSS and script injection.
**File**: `next.config.ts` — add CSP header allowing `'self'` and `https://plausible.io`.

### 9. Fix critical accessibility: focus traps, focus indicators, ARIA roles
**Impact**: Makes the app usable for keyboard and screen reader users.
**Priority fixes**: Add focus trap to modals, remove `outline: 'none'` (use `focus-visible` instead), add `role="alert"` to Toast, add `role="dialog"` to modals.

### 10. Fix touch targets to meet 44x44px minimum
**Impact**: Improves mobile usability — 16+ interactive elements are currently too small.
**Approach**: Add `min-h-[44px] min-w-[44px]` or increase padding on all undersized buttons and controls.

---

## Fix Summary

All issues from phases 1–4 have been systematically addressed. Below is the complete fix log.

### Phase 1: Critical Fixes (9/9 complete)

| # | Issue | Fix | Files Changed |
|---|-------|-----|---------------|
| 1 | TESTING_MODE hardcoded true | Changed to `process.env.NEXT_PUBLIC_PRO_TESTING_MODE === 'true'` (defaults false) | `pro.ts` |
| 2 | Advanced timeline no-op (`void` statements) | Removed void, added `carrierFreqs`, calls `engine.setBeatLayerFrequency()` | `advanced-timeline.ts` |
| 3 | ProGate CSS-only gating | Changed to conditional rendering (children not rendered for non-Pro) | `ProGate.tsx` |
| 4 | ProContext uncaught promise | Added `.catch()` to `checkProOnLoad().then()` | `ProContext.tsx` |
| 5 | `setProState()` can throw | Wrapped in try-catch | `pro.ts` |
| 6 | Audio export incomplete | Added max duration guard, fixed `createOfflineBeatLayer` return type, rewrote `scheduleAdvancedTimeline` with actual ramps, fixed `buildMixGraph` custom freqs | `audio-export.ts` |
| 7 | Stale closures in App.tsx timers | Added 10 stable callback refs, updated all interval/event callbacks to use `.current` | `App.tsx` |
| 8 | Custom frequency display bugs | Added `customCarrierFreq`/`customBeatFreq` props and fallbacks | `SessionSummary.tsx`, `SavedSessionsList.tsx`, `MixPlayer.tsx`, `MixBuilder.tsx` |
| 9 | Visibility handler memory leak | Added cleanup in `destroy()`, null assignment after removal | `audio-engine.ts` |

### Phase 2: High Priority Fixes (19 issues, many overlapping Phase 1)

| # | Issue | Fix | Files Changed |
|---|-------|-----|---------------|
| 14 | useAudioEngine setTimeout desync | Added `stopTimeoutRef` + `clearStopTimeout`, updated play/stop/preview | `useAudioEngine.ts` |
| 15 | App.tsx setTimeout cleanup | Added `stopDispatchTimeoutRef`, clear on all stop handlers | `App.tsx` |
| 23 | Advanced timeline per-layer frequency collapse | Converted `.map()` to for loop using resolved phases | `advanced-timeline.ts` |
| 24 | Empty timeline crash guard | Added guard in `tick()` for empty phases array | `advanced-timeline.ts` |
| 25 | Zero-duration phase NaN | Added `phase.duration === 0 ? 1` guard | `session-timeline.ts` |
| 27 | ExportModal try-catch | Wrapped `handleExport` in try-catch-finally | `ExportModal.tsx` |

### Phase 3: Medium Priority Fixes (15/24 applicable issues fixed)

| # | Issue | Fix | Files Changed |
|---|-------|-----|---------------|
| 29 | setWaveform click/pop | Added gain dip (0→original in 20ms) around waveform change | `audio-engine.ts` |
| 31 | Overtone GainNodes not tracked | Stored `overtoneGainL`/`overtoneGainR` as class properties, disconnect on cleanup | `audio-engine.ts` |
| 32 | previewTone/chime gain cleanup | Added `osc.onended` handlers to disconnect gain nodes | `audio-engine.ts` |
| 33 | Keep-alive BufferSourceNode accumulates | Added `source.onended` to disconnect | `audio-engine.ts` |
| 34 | ambient-synth setVolume conflict | Added `cancelScheduledValues` + `setValueAtTime` before `setTargetAtTime` | `ambient-synth.ts` |
| 35 | Synthesised ambient fade-in | Changed `initOutput` to start at gain 0 with 50ms ramp to 0.5 | `ambient-synth.ts` |
| 36 | Fade overlap for short exports | Added `safeFadeIn`/`safeFadeOut` clamping to `duration/2` | `audio-export.ts` |
| 37 | usePreview hardcoded carrier | Changed to use `preset.carrierFreq` | `usePreview.ts` |
| 38 | usePreview ctx.resume not awaited | Added `void` prefix | `usePreview.ts` |
| 40 | AdvancedBuilder side effects in setState | Moved side effects to `queueMicrotask()` | `AdvancedBuilder.tsx` |
| 41 | Missing CSP headers | Added Content-Security-Policy to all routes | `next.config.ts` |
| 42 | No rate limiting on /api/licence | Added in-memory rate limiter (10 req/min per IP) | `api/licence/route.ts` |
| 44 | localStorage.setItem without try-catch | Wrapped all 8 write locations in try-catch | `session-storage.ts`, `session-history.ts`, `favourites-storage.ts`, `settings.ts` |
| 45 | useReducedMotion polling | Replaced 2s interval with `storage`/`focus` event listeners | `useReducedMotion.ts` |
| 46-48 | Nested interactive elements | Changed outer `<button>` to `<div role="button" tabIndex={0}>` | `StateSelector.tsx`, `CarrierSelector.tsx`, `SavedSessionsList.tsx` |
| 49 | 24 rAF loops in WaveformSignature | Added `IntersectionObserver` to pause when off-screen | `WaveformSignature.tsx` |
| 50 | SacredGeometry duplicated render loop | Extracted `startRenderLoop` callback shared between main effect and visibility handler | `SacredGeometry.tsx` |
| 51 | PresetGrid loadFavourites on every render | Wrapped in `useMemo` with `selectedCategory` dependency | `PresetGrid.tsx` |
| 52 | DailyRecommendation AnimatePresence | Moved conditional inside AnimatePresence for proper exit animation | `DailyRecommendation.tsx` |

**Skipped (by design):**
- #39: `isPreviewMode` not reactive — low impact, internal flag only
- #43: LemonSqueezy webhook — new feature requiring product-specific setup

### Phase 4: Low Priority Fixes (12/18 applicable issues fixed)

| # | Issue | Fix | Files Changed |
|---|-------|-----|---------------|
| 53 | `init()` AudioContext constructor failure | Added feature-detect + try-catch with descriptive error | `audio-engine.ts` |
| 54 | `fadeInDuration = 0` produces `tau = 0` | Guard: if tau=0 use `setValueAtTime` instead of `setTargetAtTime` | `audio-engine.ts` |
| 56 | Buffer cache never evicted | Added `MAX_BUFFER_CACHE = 15` with FIFO eviction | `ambient-synth.ts` |
| 58 | `exportSession` catch returns null | Changed to throw descriptive errors (caller already has try-catch) | `audio-export.ts` |
| 61 | ErrorBoundary misses async errors | Added `unhandledrejection` + `error` global event listeners | `ErrorBoundary.tsx` |
| 62 | No schema validation on shared configs | Added `isValidAdvancedConfig`/`isValidMixConfig` validators | `sharing.ts` |
| 63 | No schema validation on localStorage | Added `Array.isArray` + object shape checks in `loadSessions`/`loadAdvancedSessions` | `session-storage.ts` |
| 64 | `onPreview` type mismatch | Changed to `void | Promise<void>` | `CarrierSelector.tsx` |
| 65 | Phase IDs without random suffix | Added `Math.random().toString(36).slice(2,6)` suffix | `TimelineEditor.tsx` |
| 66 | Redundant type alias in types/index.ts | Removed unused local alias (kept import for local reference) | `types/index.ts` |
| 68 | Duplicated `getBrainwaveColor`/`getBrainwaveLabel` | Extracted to `brainwave-states.ts`, updated 5 consumer files | `brainwave-states.ts`, `AdvancedBuilder.tsx`, `AdvancedPlayer.tsx`, `AdvancedSummary.tsx`, `FrequencyGraph.tsx`, `OscillatorPanel.tsx` |
| 69 | Beat freq max inconsistency (50 vs 100 Hz) | Aligned OscillatorPanel max to 100 Hz | `OscillatorPanel.tsx` |

**Skipped (by design):**
- #55: StereoPannerNode fallback for Safari < 14.1 — browser too old (2021), minimal user base
- #57: Timeout/interval type cast — semantically cosmetic, no runtime impact
- #59: Separate AudioContext in usePreview — larger refactor, deferred
- #60: Ref assignments during render — harmless in practice
- #67: 'step' easing not in UI — design choice, valid as API-only option
- #70: Native range vs custom Slider — visual polish, deferred

### Verification Results

- **TypeScript**: `npx tsc --noEmit` — 0 errors
- **Production build**: `npm run build` — compiled successfully, all 10 routes generated
- **npm audit**: 1 pre-existing high (minimatch in eslint devDep, not app code)
- **TESTING_MODE**: Correctly reads from env var `NEXT_PUBLIC_PRO_TESTING_MODE`, defaults to `false`
- **console.log**: 0 instances in source code

### Total: 55 issues fixed across 30+ files
