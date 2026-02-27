# BINARA — Phone Sensors PRO Gating Fix

## Problems to Fix

1. **Listen tab presets**: Phone Sensors toggle is NOT locked for free users — they can use it. It must be locked.
2. **Mix tab presets**: The lock popup is an aggressive modal/alert blocking the UI. Remove it completely.
3. **All tabs**: The PRO gating approach needs to be subtle and non-intrusive, not a blocking popup.

---

## How PRO Gating Should Work

### For FREE Users

The Phone Sensors section should be **always visible but permanently disabled** — no popups, no alerts, no modals. Instead:

**Toggle appearance:**
- Toggle is greyed out / disabled state — cannot be switched on
- Small lock icon (🔒) displayed inline next to "Phone Sensors" text
- Opacity reduced to ~0.4 to visually communicate "not available"
- Tapping the toggle does NOTHING — no popup, no alert, no response

**Inline description below the toggle** (uses the empty space already available on screen):
- Sits directly underneath the Phone Sensors row
- Subtle text, low opacity (rgba(255,255,255,0.35)), small font (12px)
- Always visible — not triggered by a tap, just always there for free users to read

**Text content:**
```
Unlock Motion Sensors with Binara PRO. Your phone's gyroscope 
creates a deeper experience — tilt to shift the spatial balance, 
stay still and the sound rewards you with harmonic overtones.
```

**Below the description, a single subtle link/button:**
- Text: "Upgrade to PRO" 
- Styled as a text link, not a button — matches the brainwave accent colour or warm gold (#F7B731) at ~0.6 opacity
- Tapping this opens the existing PRO purchase flow
- No "Restore Purchase" link needed here (that belongs in settings)

**Full layout for free users:**
```
┌──────────────────────────────────────────┐
│ 🔒 Phone Sensors                    ○──  │  ← greyed out toggle, not interactive
├──────────────────────────────────────────┤
│ Unlock Motion Sensors with Binara PRO.   │  ← subtle description text
│ Your phone's gyroscope creates a deeper  │    always visible, not triggered
│ experience — tilt to shift the spatial   │    by a tap
│ balance, stay still and the sound        │
│ rewards you with harmonic overtones.     │
│                                          │
│ Upgrade to PRO                           │  ← text link, not a button
└──────────────────────────────────────────┘
```

### For PRO Users

- Toggle is fully interactive — can be switched on/off
- No lock icon
- No description text (they already have access)
- "LIVE" badge appears when sensors are active (as currently implemented in Listen tab)

---

## Apply Consistently Across ALL Tabs

This gating must work identically in:
- **Listen tab** presets (currently NOT locked — fix this)
- **Mix tab** presets (currently has aggressive popup — replace with inline approach)
- **Create tab** if sensors are available there

Same visual treatment everywhere. No popups anywhere.

---

## What to Remove

- ❌ Any modal/alert/popup triggered when free users interact with Phone Sensors
- ❌ Any overlay or blocking UI element related to sensor PRO gating
- ❌ The "Sensor Control / Pro Feature" popup shown in Mix tab

## What to Add/Change

- ✅ Greyed out toggle with lock icon for free users (all tabs)
- ✅ Inline description text below the toggle (always visible for free users)
- ✅ Subtle "Upgrade to PRO" text link below the description
- ✅ Lock the toggle in Listen tab (currently unlocked for free users — this is a bug)

---

## Test Checklist

- [ ] FREE user — Listen tab: Phone Sensors toggle is greyed out with lock icon
- [ ] FREE user — Listen tab: tapping toggle does nothing (no popup, no alert)
- [ ] FREE user — Mix tab: Phone Sensors toggle is greyed out with lock icon
- [ ] FREE user — Mix tab: tapping toggle does nothing (no popup, no alert)
- [ ] FREE user — description text visible below toggle in all tabs
- [ ] FREE user — "Upgrade to PRO" link opens purchase flow
- [ ] FREE user — no modal/popup/overlay appears anywhere for sensors
- [ ] PRO user — toggle works normally, no lock, no description text
- [ ] PRO user — LIVE badge shows when sensors active
- [ ] The old "Sensor Control / Pro Feature" popup is completely removed
