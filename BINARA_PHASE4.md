# BINARA — Phase 4: Session History, Streak Tracking & Offline PWA

## Implement in this order: Session History & Streaks together (they share the same data layer), then Offline PWA.

---

## 1. Session History & Streak Tracking

### Data Model

Every completed session gets logged to localStorage:

```typescript
interface SessionLog {
  id: string;              // unique ID (timestamp-based)
  date: string;            // ISO date "2026-02-26"
  timestamp: number;       // Unix timestamp of session start
  presetName: string;      // "Deep Focus"
  presetId?: string;       // for Listen presets
  mode: 'listen' | 'mix' | 'create';
  waveState: string;       // "beta"
  beatFreq: number;        // 16
  carrierFreq: number;     // 200
  durationMinutes: number; // actual minutes completed (not preset default)
  completedFull: boolean;  // did they finish or stop early?
  ambientLayers: string[]; // ["fire-crackling", "stream-flowing"]
  sensorsUsed: boolean;    // were motion sensors or auto motion active?
  hapticUsed: boolean;
  breathingPattern?: string; // "box" if breathing was active
  visualisation?: string;  // "flower" if visualisation was active
}

// localStorage key: 'binara-session-history'
// Value: JSON.stringify(SessionLog[])
```

### When to Log

- Log when a session **completes** (timer runs out, sleep timer finishes)
- Log when a session is **manually stopped** — record actual duration completed
- Do NOT log sessions under 1 minute (accidental taps)
- Do NOT log card preview plays (those are 15-second auditions)

### Streak Calculation

```typescript
interface StreakData {
  currentStreak: number;    // consecutive days with at least 1 session
  longestStreak: number;    // all-time best
  lastSessionDate: string;  // ISO date of most recent session
}

function calculateStreak(history: SessionLog[]): StreakData {
  // Get unique dates with sessions, sorted newest first
  const dates = [...new Set(history.map(s => s.date))].sort().reverse();
  
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0, lastSessionDate: '' };
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // Current streak: must include today or yesterday
  let currentStreak = 0;
  if (dates[0] === today || dates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }
  
  // Longest streak: scan all dates
  let longest = 1;
  let running = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (diffDays === 1) {
      running++;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }
  
  return {
    currentStreak,
    longestStreak: Math.max(longest, currentStreak),
    lastSessionDate: dates[0],
  };
}
```

### Monthly Statistics

```typescript
interface MonthlyStats {
  totalSessions: number;
  totalMinutes: number;
  averageSessionMinutes: number;
  favouritePreset: string;        // most-used preset name
  favouriteWaveState: string;     // most-used brainwave state
  completionRate: number;         // % of sessions completed fully
  daysActive: number;             // unique days with sessions this month
}
```

### UI — History Tab

Add a new tab to the main navigation alongside Listen / Mix / Create:

```
♫ Listen    ⊞ Mix    ⚡ Create    📊 Stats
```

Or alternatively, add a small stats/history icon in the top-right header area (next to the settings icon) that opens a full-screen history view.

**Pick whichever approach fits the existing layout better — don't overcrowd the mode tabs if they're already tight on mobile.**

### History View Sections

**Section 1: Streak Banner (top)**
```
┌──────────────────────────────────────────┐
│  🔥 7 day streak                         │
│                                          │
│  Current: 7 days    Best: 14 days        │
│  Keep it going — don't break the chain!  │
└──────────────────────────────────────────┘
```

- Prominent streak number with a flame/fire icon
- Current streak and longest streak side by side
- Motivational text that changes:
  - 0 days: "Start your first session today"
  - 1 day: "Great start — come back tomorrow"
  - 3+ days: "Building momentum!"
  - 7+ days: "One week strong — keep going!"
  - 14+ days: "Incredible dedication"
  - 30+ days: "You're a natural"
- Streak banner uses a warm gradient (subtle gold tones matching PRO badge)

**Section 2: Monthly Summary**
```
February 2026

Sessions: 23        Minutes: 487
Avg Session: 21 min  Days Active: 18/28
Favourite: Deep Focus (Beta)
Completion Rate: 78%
```

- Clean card layout with the key stats
- Month selector to view previous months (left/right arrows)

**Section 3: Activity Calendar**

GitHub-style contribution grid showing session activity:

```
Mon  ░ ░ █ ░ █ █ ░ ░ █ █ ░ ░ █
Wed  ░ █ ░ █ █ ░ ░ █ ░ █ █ ░ ░
Fri  █ ░ ░ █ ░ █ █ ░ █ ░ ░ █ ░
```

- Each cell = one day
- Colour intensity based on total minutes that day:
  - 0 min: empty/dark (`rgba(255,255,255,0.03)`)
  - 1–15 min: light (`brainwaveColour` at 0.2 opacity)
  - 15–30 min: medium (0.4 opacity)
  - 30+ min: full (0.7 opacity)
- Use the user's most-used brainwave colour for the fill
- Tapping a day shows a tooltip: "Feb 14 — 2 sessions, 45 min"
- Show the current month by default, scrollable to past months

**Section 4: Recent Sessions List**

Scrollable list of individual sessions, newest first:

```
Today
  Deep Focus · Beta 16Hz · 25 min ✓
  Morning Calm · Alpha 10Hz · 15 min ✓

Yesterday  
  Fall Asleep · Delta 2Hz · 30 min ✓
  Custom Mix · Theta 6Hz · 12 min (stopped early)

Feb 24
  Creative Spark · Alpha 10Hz · 20 min ✓
```

- Grouped by date
- Each entry shows: preset name, wave state, frequency, duration
- ✓ for fully completed sessions
- "(stopped early)" for sessions ended before timer/preset duration
- Tapping a session entry could replay that session (nice-to-have, not essential)

### Session Complete Screen Enhancement

Update the existing "Session Complete" screen to show session stats:

```
✦ Session Complete

Deep Focus · 25 min

🔥 Streak: 7 days
📊 Total this month: 487 min

[ Play Again ]    [ Choose Another ]
```

Add the streak counter and monthly total to reinforce the habit loop.

### Data Retention

- Keep all session history in localStorage
- No automatic deletion — let it grow
- Add a "Clear History" option in settings for users who want a fresh start
- If localStorage gets too large (>5MB), prune sessions older than 12 months

### Test Checklist
- [ ] Session is logged when completed (timer or manual stop)
- [ ] Sessions under 1 minute are NOT logged
- [ ] Card preview plays are NOT logged
- [ ] Session log captures all metadata (preset, mode, wave, duration, features used)
- [ ] Streak calculates correctly for consecutive days
- [ ] Streak resets if a day is missed (yesterday check)
- [ ] Longest streak tracks all-time best
- [ ] Monthly stats are accurate (sessions, minutes, favourite, completion rate)
- [ ] Activity calendar displays correctly with intensity levels
- [ ] Tapping a calendar day shows session details
- [ ] Recent sessions list shows correct entries grouped by date
- [ ] History persists across browser sessions (localStorage)
- [ ] Session Complete screen shows streak and monthly total
- [ ] Motivational text changes based on streak length
- [ ] "Clear History" option works
- [ ] Month navigation works in calendar and stats

---

## 2. Offline Mode / PWA

### Why
Users want Binara on flights, in meditation spaces without wifi, during retreats. The binaural beat generation already works offline (Web Audio is client-side), but the app shell and ambient audio files need caching.

### PWA Manifest

Create `/public/manifest.json`:

```json
{
  "name": "Binara — Binaural Beats",
  "short_name": "Binara",
  "description": "Binaural beats for focus, sleep, and meditation",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#080A12",
  "theme_color": "#080A12",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/binara-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/binara-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/binara-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Add to the HTML `<head>`:
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#080A12" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/icons/binara-192.png" />
```

### Service Worker

Create a service worker that caches:

**Cache on install (app shell — always cached):**
- All HTML pages (/, and key routes)
- All CSS and JS bundles
- All font files (Cormorant Garamond, JetBrains Mono, Inter)
- App icons
- Manifest

**Cache on first use (ambient audio — cached when user first plays them):**
- `/audio/ambient/*.ogg` files — only cache files the user has actually played
- This avoids downloading all 10 ambient files upfront (50MB+)
- When a user plays "fire-crackling.ogg" for the first time, the service worker caches it
- Next time, it loads from cache even without network

```typescript
// service-worker.ts

const APP_CACHE = 'binara-app-v1';
const AUDIO_CACHE = 'binara-audio-v1';

const APP_SHELL = [
  '/',
  '/manifest.json',
  // CSS and JS bundles will be added by the build process
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(APP_CACHE).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);
  
  // Ambient audio files: cache on first use
  if (url.pathname.startsWith('/audio/ambient/')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }
  
  // App shell: cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
```

### "Add to Home Screen" Prompt

When the PWA criteria are met (manifest + service worker + HTTPS), browsers automatically show an install banner. Additionally:

- After the user's 3rd session, show a subtle inline prompt at the top of the Listen tab:
  ```
  📱 Add Binara to your home screen for the best experience
      [ Add to Home Screen ]    [ Maybe Later ]
  ```
- Tapping "Add to Home Screen" triggers the browser's install prompt (`beforeinstallprompt` event)
- "Maybe Later" hides the prompt for 7 days
- After install, the prompt never shows again

### Offline Indicator

When the device has no network connection:
- Show a small, subtle indicator at the top of the screen: "Offline mode — cached sessions available"
- Low opacity, not alarming
- All cached presets and ambient layers work normally
- Share links and any features requiring network gracefully degrade (share button hidden or shows "offline")

### Offline Audio Availability

Show which ambient layers are available offline:

- In the ambient layer section during a session, cached layers show normally
- Uncached layers show a small download icon or cloud icon
- Tapping an uncached layer while offline shows: "This ambient sound hasn't been cached yet. Connect to wifi to download it."
- Tapping an uncached layer while online: plays normally AND caches for next time

### Icons

Create these icon files if they don't already exist:
- `/public/icons/binara-192.png` — 192×192, Binara logo on #080A12 background
- `/public/icons/binara-512.png` — 512×512, same
- `/public/icons/binara-maskable-512.png` — 512×512 with safe zone padding for Android adaptive icons

If custom icons are too complex right now, use a simple text-based icon: "B" in Cormorant Garamond on the dark background, with a subtle brainwave colour accent.

### Test Checklist

**PWA Install:**
- [ ] manifest.json loads correctly (check in DevTools → Application)
- [ ] Service worker registers successfully
- [ ] "Add to Home Screen" works on Android Chrome
- [ ] "Add to Home Screen" works on iOS Safari
- [ ] App opens in standalone mode (no browser chrome) when launched from home screen
- [ ] Theme colour and status bar match Binara's dark theme
- [ ] App icon looks correct on home screen

**Offline App Shell:**
- [ ] Disconnect wifi → reload app → app still loads
- [ ] All pages/routes accessible offline
- [ ] Fonts load from cache offline
- [ ] Session controls and UI fully functional offline

**Offline Audio:**
- [ ] Binaural beat generation works offline (Web Audio = client-side)
- [ ] Previously played ambient layers play from cache offline
- [ ] Unplayed ambient layers show "not cached" indicator offline
- [ ] Playing an ambient layer online caches it for future offline use
- [ ] Session history and favourites work offline (localStorage)

**Offline Indicator:**
- [ ] Subtle offline banner appears when no connection
- [ ] Banner disappears when connection returns
- [ ] Share button hidden or gracefully disabled offline

**Install Prompt:**
- [ ] Prompt appears after 3rd completed session
- [ ] "Add to Home Screen" triggers browser install flow
- [ ] "Maybe Later" hides prompt for 7 days
- [ ] Prompt never shows again after install

---

## Implementation Order

1. **Session History & Streaks** — data layer + UI (do together, they share the same storage)
2. **Offline PWA** — service worker + manifest + caching + install prompt

Deploy after each.

---

## What NOT to Touch

- ✅ Audio engine — unchanged
- ✅ All Phase 1–3 features — unchanged
- ✅ /sell and /promo pages — unchanged
- ✅ PRO purchase flow — unchanged
