# Binara — Fix: Preview Bar Volume Slider Thumb Still Not Centred

The cyan thumb on the Live preview volume slider is still sitting above the track centre line.

## Root Cause

The `-webkit-slider-thumb` margin-top of `-8px` wasn't sufficient. This can happen if:
- The track height is different than assumed
- The `<input type="range">` has default padding/margin from the browser
- The component uses a custom slider wrapper that adds its own offset

## Fix

**Option A — Nuclear reset (recommended):**

Replace the entire range input styling with a fully reset approach:

```css
/* On the range input itself */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 24px;           /* Make the input tall enough to contain the thumb */
  background: transparent; /* Transparent — track is drawn via pseudo-element */
  margin: 0;
  padding: 0;
  cursor: pointer;
  display: block;
}

/* Track */
input[type="range"]::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  border: none;
}

/* Thumb — centred on the track via the input height */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #4fc3f7;
  border: none;
  margin-top: -10px;  /* (track height - thumb height) / 2 = (4 - 24) / 2 = -10 */
  cursor: pointer;
}

/* Firefox */
input[type="range"]::-moz-range-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  border: none;
}

input[type="range"]::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #4fc3f7;
  border: none;
  cursor: pointer;
  /* Firefox auto-centres, no margin-top needed */
}
```

The key value is `margin-top: -10px` — this is calculated as `(trackHeight - thumbHeight) / 2` = `(4 - 24) / 2` = `-10`.

**Option B — Replace with a custom div-based slider:**

If the native range input keeps fighting back, replace it entirely with a div-based slider. This gives full CSS control:

```tsx
function PreviewVolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  
  const handleInteraction = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(Math.round(ratio * 100));
  };

  return (
    <div
      ref={trackRef}
      style={{
        position: 'relative',
        height: '32px',        // Touch target
        display: 'flex',
        alignItems: 'center',  // This guarantees vertical centring
        cursor: 'pointer',
        flex: 1,
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        handleInteraction(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0) handleInteraction(e.clientX);
      }}
    >
      {/* Track background */}
      <div style={{
        width: '100%',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '2px',
        position: 'relative',
      }}>
        {/* Filled portion */}
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: 'linear-gradient(to right, rgba(79, 195, 247, 0.5), #4fc3f7)',
          borderRadius: '2px',
        }} />
        {/* Thumb — absolutely positioned, centred via transform */}
        <div style={{
          position: 'absolute',
          left: `${value}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',  /* THIS guarantees perfect centring */
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: '#4fc3f7',
          boxShadow: '0 0 8px rgba(79, 195, 247, 0.4)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
```

**Option B is bulletproof** — `transform: translate(-50%, -50%)` with `top: 50%` will ALWAYS centre the thumb on the track regardless of browser, OS, or device. It also avoids all the cross-browser webkit/moz track/thumb headaches.

## Recommendation

Go with **Option B** (custom div slider) for the preview bar only. It's ~30 lines and eliminates the browser range input inconsistencies permanently. The existing sliders elsewhere in the app (oscillator panels, etc.) can stay as they are since they seem to work fine.
