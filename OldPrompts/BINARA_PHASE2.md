# BINARA — Phase 2: Favourites, Share Links & Headphone Warning

## Implement in this order: Headphone Warning first (quickest), then Favourites, then Share Links.

---

## 1. Headphone Warning

### Why
Binaural beats don't work without headphones — the effect requires different frequencies in each ear. New users who try without headphones will think the app is broken and leave. This is the simplest feature with the highest impact on first-time user experience.

### Behaviour

**On first session start (any mode — Listen, Mix, Create):**
- Show a brief overlay/bottom sheet before audio begins
- Non-blocking — user can dismiss and continue immediately

**Overlay content:**
```
🎧

Headphones recommended

Binaural beats work by sending slightly different 
frequencies to each ear. For the full effect, 
use headphones or earbuds.

        [ Got it ]
```

- Clean, minimal design matching Binara aesthetic (dark background, warm text)
- Headphone icon at the top (use a simple SVG, not emoji)
- Single "Got it" button to dismiss
- Tapping outside the overlay also dismisses it

**Display rules:**
- Show on the FIRST session start ever (first-time users)
- After dismissal, store a flag in localStorage: `headphoneWarningDismissed: true`
- Show again after 7 days if the user hasn't dismissed it permanently
- Add a small "Don't show again" checkbox or text link below "Got it"
- If "Don't show again" is checked, never show it again: `headphoneWarningPermanent: true`

**Session view indicator:**
- Small headphone icon in the session view (near the volume control or phase indicator)
- Purely decorative/reminder — not interactive
- Very subtle, low opacity (0.3)

### Test Checklist
- [ ] First ever session start shows the headphone overlay
- [ ] "Got it" dismisses and session starts
- [ ] Tapping outside overlay dismisses it
- [ ] Overlay does not show again on next session (within 7 days)
- [ ] After 7 days, overlay shows once more (unless "Don't show again" was used)
- [ ] "Don't show again" permanently hides the overlay
- [ ] Small headphone icon visible in session view
- [ ] Overlay works in Listen, Mix, and Create modes
- [ ] Overlay doesn't block or delay audio start excessively

---

## 2. Favourites / Save My Sessions

### Concept

Users can favourite presets and save custom Create mode sessions for quick access later. Favourited items appear in a dedicated "Favourites" section.

### UI — Favourite Button on Cards

Add a small heart icon to each preset card in the Listen tab:
- Position: top-right corner of the card
- Default: outline heart, very low opacity (0.2)
- Hover/tap: heart fills with the card's brainwave colour
- Tapping toggles favourite on/off
- Brief scale animation on tap (heart pulses 1.0 → 1.3 → 1.0)
- Must use `e.stopPropagation()` — tapping the heart should NOT trigger card navigation or preview

### UI — Favourite Button in Session View

Add the same heart icon in the session view header (near the preset name):
- Same toggle behaviour
- Allows users to favourite a preset after experiencing it

### UI — Favourite Button in Mix & Create

**Mix mode:** After the user configures a mix (state + tone), show a heart/save icon that saves this specific combination.

**Create mode:** After building a custom session, show a "Save Session" button that stores the full configuration:
- Beat frequency
- Carrier frequency
- Active effects (filter, LFO, isochronic, stereo settings)
- Active ambient layers and their volumes
- Auto Motion settings
- Session phase toggle state

### Favourites Section

Add a new category in the Listen tab filter bar:

```
♥   All   Focus   Sleep   Meditation   Relax
```

- Heart icon tab at the far left (or "Favourites" text)
- When selected, shows all favourited presets as cards
- Also shows saved Mix and Create sessions as cards with a different visual indicator:
  - Listen presets: normal card appearance
  - Mix saves: card with "Mix" badge, shows state + tone info
  - Create saves: card with "Create" badge, shows custom frequency info

### Data Storage

Store in localStorage as JSON:

```typescript
interface FavouriteItem {
  id: string;                    // unique ID (preset ID for Listen, generated UUID for Mix/Create)
  type: 'listen' | 'mix' | 'create';
  name: string;                  // preset name or user-given name
  timestamp: number;             // when favourited
  presetId?: string;             // for Listen presets
  config?: {                     // for Mix and Create saves
    beatFreq: number;
    carrierFreq: number;
    waveState: string;
    effects?: object;
    ambientLayers?: string[];
    ambientVolumes?: Record<string, number>;
    autoMotion?: boolean;
    autoMotionIntensity?: number;
    sessionPhases?: boolean;
  };
}

// localStorage key: 'binara-favourites'
// Value: JSON.stringify(FavouriteItem[])
```

### Naming Saved Sessions

When saving a Mix or Create session:
- Show a small inline text input: "Name this session" with a default like "My Mix — Alpha 10Hz" or "Custom — 432Hz"
- User can accept the default or type their own name
- Name appears on the saved card

### Limits

- **Free users:** up to 5 favourites
- **PRO users:** unlimited
- When a free user tries to save a 6th favourite, show inline message: "Upgrade to PRO for unlimited favourites" (same subtle pattern as phone sensors — no popup)

### Test Checklist
- [ ] Heart icon visible on all Listen tab preset cards
- [ ] Tapping heart toggles favourite (fills/unfills with animation)
- [ ] Heart tap does NOT trigger card navigation or preview (stopPropagation)
- [ ] Heart icon in session view works the same way
- [ ] Favourites tab shows all favourited presets
- [ ] Favourited Listen preset opens normally when tapped from Favourites
- [ ] Mix session can be saved with custom name
- [ ] Create session can be saved with full config
- [ ] Saved Mix/Create sessions restore all settings when opened
- [ ] Free users limited to 5 favourites with inline PRO message at limit
- [ ] PRO users have unlimited favourites
- [ ] Favourites persist after closing and reopening the browser
- [ ] Removing a favourite updates the Favourites tab immediately
- [ ] Empty Favourites tab shows a friendly message: "No favourites yet. Tap the heart on any preset to save it here."

---

## 3. Share a Session Link

### Concept

Users can share a direct link to any preset or custom session. The recipient opens the link and lands directly in that session, ready to play.

### Share Button Location

- **Listen tab cards:** small share icon (bottom-left, near duration) — low opacity, appears on hover/tap
- **Session view:** share button in the session controls area
- **Mix/Create:** share button after configuring a session

### URL Structure

**Listen presets (simple — just the preset ID):**
```
https://binara.app/s/deep-focus
https://binara.app/s/fall-asleep
https://binara.app/s/creative-spark
```

**Mix sessions (encoded params):**
```
https://binara.app/s/mix?state=alpha&beat=10&tone=earth&carrier=136.1
```

**Create sessions (encoded params):**
```
https://binara.app/s/create?beat=7.83&carrier=200&filter=1&lfo=0&iso=0&stereo=1&ambient=fire,stream
```

Keep URLs short and readable. Use simple query params, not base64 blobs.

### Share Flow

When the user taps the share button:

1. Generate the session URL
2. Use the **Web Share API** if available (mobile native share sheet):
```typescript
if (navigator.share) {
  navigator.share({
    title: `Binara — ${presetName}`,
    text: `Try this ${waveState} binaural beat session on Binara`,
    url: sessionUrl,
  });
} else {
  // Fallback: copy to clipboard
  navigator.clipboard.writeText(sessionUrl);
  showToast('Link copied to clipboard');
}
```

3. On desktop (no Web Share API): copy link to clipboard with a brief toast notification "Link copied!"

### Receiving a Shared Link

When someone opens a `/s/...` URL:

**Listen preset:**
- Route directly to the session view for that preset
- Show the preset name, frequency info, and a prominent "Play" button
- If the preset doesn't exist, show a friendly error: "Session not found. Explore Binara's presets instead." with a link to the main Listen tab

**Mix session:**
- Decode the URL params and open Mix mode with those settings pre-filled
- User can adjust or play immediately

**Create session:**
- Decode the URL params and open Create mode with all settings restored
- User can adjust or play immediately

### Share Card Preview (Open Graph)

When shared links appear on social media or messaging apps, they should show a rich preview:

```html
<meta property="og:title" content="Binara — Deep Focus (Beta · 16 Hz)" />
<meta property="og:description" content="Try this binaural beat session for sustained concentration. Free, no download needed." />
<meta property="og:image" content="https://binara.app/og/deep-focus.png" />
<meta property="og:url" content="https://binara.app/s/deep-focus" />
```

- Generate a simple OG image per brainwave state (5 images total: delta, theta, alpha, beta, gamma)
- Each image: dark background, brainwave name, frequency, Binara logo
- Or a single generic OG image for all shares if per-state images are too much work initially

### Test Checklist
- [ ] Share button visible on preset cards and in session view
- [ ] Tapping share on mobile opens native share sheet (Web Share API)
- [ ] Tapping share on desktop copies link to clipboard with toast
- [ ] Listen preset share URL opens the correct session view for recipients
- [ ] Mix share URL restores the correct state, beat, and tone settings
- [ ] Create share URL restores all settings (frequency, effects, ambient)
- [ ] Invalid share URLs show friendly error with redirect to main app
- [ ] Shared links show a rich preview card on social media / messaging apps
- [ ] Share button tap does NOT trigger card navigation (stopPropagation)
- [ ] Share works for both free and PRO users (sharing is not gated)

---

## Implementation Order

1. **Headphone Warning** — 15 minutes, ship it
2. **Favourites** — the meatiest feature, take your time
3. **Share Links** — depends on solid routing, do last

Deploy after each feature.

---

## What NOT to Touch

- ✅ Audio engine — unchanged
- ✅ Sleep timer — unchanged  
- ✅ Session phases — unchanged
- ✅ Phone Sensors / Auto Motion — unchanged
- ✅ Ambient layers — unchanged
- ✅ /sell and /promo pages — unchanged
- ✅ PRO purchase flow — use existing mechanism for favourites limit
