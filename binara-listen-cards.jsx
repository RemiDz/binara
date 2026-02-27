import { useState, useEffect, useRef } from "react";

// --- Frequency data mapped to brainwave states ---
const WAVE_STATES = {
  delta: { color: "#6B5CE7", glow: "rgba(107,92,231,0.3)", label: "Delta", range: "0.5–4 Hz", symbol: "δ" },
  theta: { color: "#8B6CE7", glow: "rgba(139,108,231,0.3)", label: "Theta", range: "4–8 Hz", symbol: "θ" },
  alpha: { color: "#4ECDC4", glow: "rgba(78,205,196,0.3)", label: "Alpha", range: "8–14 Hz", symbol: "α" },
  beta:  { color: "#F7B731", glow: "rgba(247,183,49,0.3)", label: "Beta", range: "14–30 Hz", symbol: "β" },
  gamma: { color: "#FC5C65", glow: "rgba(252,92,101,0.3)", label: "Gamma", range: "30–100 Hz", symbol: "γ" },
};

const PRESETS = [
  { id: 1, name: "Deep Focus", wave: "beta", freq: 16, duration: 25, desc: "Sustained concentration for deep work", category: "focus" },
  { id: 2, name: "Study Flow", wave: "beta", freq: 14, duration: 45, desc: "Background focus for reading and study", category: "focus" },
  { id: 3, name: "Creative Spark", wave: "alpha", freq: 10, duration: 20, desc: "Open, creative thinking and ideation", category: "focus" },
  { id: 4, name: "Problem Solving", wave: "gamma", freq: 40, duration: 15, desc: "Heightened information processing", category: "focus" },
  { id: 5, name: "Fall Asleep", wave: "delta", freq: 2, duration: 30, desc: "Gentle descent into sleep", category: "sleep" },
  { id: 6, name: "Deep Sleep", wave: "delta", freq: 1.5, duration: 60, desc: "Sustained deep, dreamless sleep", category: "sleep" },
  { id: 7, name: "Power Nap", wave: "theta", freq: 5, duration: 20, desc: "Quick restorative rest", category: "sleep" },
  { id: 8, name: "Insomnia Relief", wave: "delta", freq: 2.5, duration: 45, desc: "Calm a racing mind for sleep", category: "sleep" },
  { id: 9, name: "Morning Calm", wave: "alpha", freq: 10, duration: 15, desc: "Gentle awakening clarity", category: "meditation" },
  { id: 10, name: "Body Scan", wave: "theta", freq: 6, duration: 30, desc: "Deep somatic awareness", category: "meditation" },
  { id: 11, name: "Stress Relief", wave: "alpha", freq: 8, duration: 20, desc: "Release tension and restore balance", category: "relax" },
  { id: 12, name: "Evening Wind", wave: "theta", freq: 7, duration: 25, desc: "Transition from day to rest", category: "relax" },
];

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "focus", label: "Focus" },
  { id: "sleep", label: "Sleep" },
  { id: "meditation", label: "Meditation" },
  { id: "relax", label: "Relax" },
];

// --- Waveform Canvas Component ---
function WaveformSignature({ wave, freq, isHovered, width = 120, height = 32 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const phaseRef = useRef(0);
  const waveState = WAVE_STATES[wave];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      phaseRef.current += isHovered ? 0.06 : 0.015;

      const mid = height / 2;
      const amp = isHovered ? height * 0.38 : height * 0.25;
      const cycles = Math.max(2, Math.min(freq / 3, 8));

      // Glow layer
      ctx.beginPath();
      ctx.strokeStyle = waveState.glow;
      ctx.lineWidth = isHovered ? 6 : 3;
      ctx.filter = `blur(${isHovered ? 4 : 2}px)`;
      for (let x = 0; x <= width; x++) {
        const t = x / width;
        const y = mid + Math.sin(t * Math.PI * 2 * cycles + phaseRef.current) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.filter = "none";

      // Main line
      ctx.beginPath();
      ctx.strokeStyle = waveState.color;
      ctx.lineWidth = isHovered ? 2 : 1.5;
      ctx.lineCap = "round";
      for (let x = 0; x <= width; x++) {
        const t = x / width;
        const y = mid + Math.sin(t * Math.PI * 2 * cycles + phaseRef.current) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [wave, freq, isHovered, width, height, waveState]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, opacity: isHovered ? 1 : 0.6, transition: "opacity 0.4s ease" }}
    />
  );
}

// --- Frequency Ring ---
function FrequencyRing({ wave, freq, size = 44, isHovered }) {
  const waveState = WAVE_STATES[wave];
  const normalised = Math.min(freq / 50, 1);
  const dashLength = 2 + normalised * 6;
  const gapLength = 2 + (1 - normalised) * 4;
  const circumference = Math.PI * (size - 4);
  const rotation = isHovered ? 360 : 0;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{
        transition: "transform 2s linear",
        transform: `rotate(${rotation}deg)`,
      }}>
        {/* Outer ring */}
        <circle
          cx={size/2} cy={size/2} r={(size-4)/2}
          fill="none"
          stroke={waveState.color}
          strokeWidth={isHovered ? 2 : 1.5}
          strokeDasharray={`${dashLength} ${gapLength}`}
          opacity={isHovered ? 0.9 : 0.4}
          style={{ transition: "all 0.4s ease" }}
        />
        {/* Inner glow */}
        <circle
          cx={size/2} cy={size/2} r={size/2 - 8}
          fill={isHovered ? waveState.glow : "transparent"}
          style={{ transition: "fill 0.4s ease" }}
        />
      </svg>
      {/* Greek symbol */}
      <span style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: size * 0.42,
        fontWeight: 300,
        fontStyle: "italic",
        color: waveState.color,
        opacity: isHovered ? 1 : 0.7,
        transition: "all 0.4s ease",
      }}>
        {waveState.symbol}
      </span>
    </div>
  );
}

// --- Preset Card ---
function PresetCard({ preset, index }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const waveState = WAVE_STATES[preset.wave];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => { setIsHovered(false); setIsPressed(false); }}
      style={{
        position: "relative",
        padding: "1px",
        borderRadius: 16,
        background: isHovered
          ? `linear-gradient(135deg, ${waveState.color}40, transparent 50%, ${waveState.color}20)`
          : "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isPressed ? "scale(0.97)" : isHovered ? "translateY(-2px)" : "none",
        cursor: "pointer",
        animation: `cardReveal 0.5s ease ${index * 0.06}s both`,
      }}
    >
      {/* Card inner */}
      <div style={{
        position: "relative",
        borderRadius: 15,
        padding: "16px 16px 14px",
        background: isHovered
          ? `radial-gradient(ellipse at top left, ${waveState.color}08, rgba(12,14,24,0.97) 70%)`
          : "rgba(12,14,24,0.92)",
        backdropFilter: "blur(20px)",
        overflow: "hidden",
        minHeight: 140,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}>

        {/* Top row: ring + name + freq */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <FrequencyRing wave={preset.wave} freq={preset.freq} isHovered={isHovered} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: isHovered ? "#F0EDE6" : "rgba(240,237,230,0.85)",
              lineHeight: 1.2,
              transition: "color 0.3s ease",
            }}>
              {preset.name}
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                fontSize: 10.5,
                fontWeight: 500,
                color: waveState.color,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                opacity: isHovered ? 1 : 0.7,
                transition: "opacity 0.3s ease",
              }}>
                {waveState.label}
              </span>
              <span style={{
                width: 3, height: 3, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
              }} />
              <span style={{
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                fontSize: 10.5,
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.04em",
              }}>
                {preset.freq} Hz
              </span>
            </div>
          </div>
        </div>

        {/* Waveform signature */}
        <div style={{
          margin: "10px 0 6px",
          display: "flex",
          justifyContent: "center",
          opacity: isHovered ? 1 : 0.5,
          transition: "opacity 0.4s ease",
        }}>
          <WaveformSignature wave={preset.wave} freq={preset.freq} isHovered={isHovered} width={140} height={28} />
        </div>

        {/* Description */}
        <p style={{
          fontFamily: "'Inter', -apple-system, sans-serif",
          fontSize: 11.5,
          lineHeight: 1.45,
          color: "rgba(255,255,255,0.35)",
          margin: 0,
          letterSpacing: "0.01em",
          transition: "color 0.3s ease",
          ...(isHovered && { color: "rgba(255,255,255,0.5)" }),
        }}>
          {preset.desc}
        </p>

        {/* Bottom: duration */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 8,
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
            fontSize: 10,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.08em",
          }}>
            {preset.duration} min
          </span>

          {/* Play indicator on hover */}
          <div style={{
            width: 24, height: 24,
            borderRadius: "50%",
            border: `1px solid ${isHovered ? waveState.color : "rgba(255,255,255,0.08)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.4s ease",
            background: isHovered ? `${waveState.color}15` : "transparent",
          }}>
            <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
              <path d="M1 1L7 5L1 9V1Z"
                fill={isHovered ? waveState.color : "rgba(255,255,255,0.15)"}
                style={{ transition: "fill 0.3s ease" }}
              />
            </svg>
          </div>
        </div>

        {/* Ambient corner glow on hover */}
        {isHovered && (
          <div style={{
            position: "absolute",
            top: -30,
            left: -30,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${waveState.color}12, transparent 70%)`,
            pointerEvents: "none",
          }} />
        )}
      </div>
    </div>
  );
}

// --- Category Tabs ---
function CategoryTabs({ active, onChange }) {
  return (
    <div style={{
      display: "flex",
      gap: 4,
      padding: "3px",
      borderRadius: 10,
      background: "rgba(255,255,255,0.03)",
      marginBottom: 20,
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
    }}>
      {CATEGORIES.map(cat => {
        const isActive = cat.id === active;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            style={{
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: 12,
              fontWeight: isActive ? 500 : 400,
              letterSpacing: "0.03em",
              color: isActive ? "#F0EDE6" : "rgba(255,255,255,0.35)",
              background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.3s ease",
            }}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

// --- Mode Tabs (Listen / Mix / Create) ---
function ModeTabs() {
  const [active, setActive] = useState("listen");
  const modes = [
    { id: "listen", label: "Listen", icon: "♫" },
    { id: "mix", label: "Mix", icon: "⊞" },
    { id: "create", label: "Create", icon: "⚡" },
  ];

  return (
    <div style={{
      display: "flex",
      gap: 2,
      padding: "3px",
      borderRadius: 12,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      marginBottom: 16,
    }}>
      {modes.map(mode => {
        const isActive = mode.id === active;
        return (
          <button
            key={mode.id}
            onClick={() => setActive(mode.id)}
            style={{
              flex: 1,
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? "#F0EDE6" : "rgba(255,255,255,0.35)",
              background: isActive
                ? "linear-gradient(135deg, rgba(247,183,49,0.15), rgba(247,183,49,0.05))"
                : "transparent",
              border: isActive ? "1px solid rgba(247,183,49,0.2)" : "1px solid transparent",
              borderRadius: 10,
              padding: "9px 0",
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 14 }}>{mode.icon}</span>
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

// --- Main App ---
export default function BinaraListenRedesign() {
  const [category, setCategory] = useState("all");
  const filtered = category === "all" ? PRESETS : PRESETS.filter(p => p.category === category);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080A12",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient background layers */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(107,92,231,0.04), transparent)",
      }} />
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 80% 90%, rgba(78,205,196,0.03), transparent)",
      }} />

      {/* Content container — mobile width */}
      <div style={{
        maxWidth: 420,
        margin: "0 auto",
        padding: "16px 16px 100px",
        position: "relative",
      }}>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          padding: "8px 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 22,
              fontWeight: 300,
              letterSpacing: "0.2em",
              color: "rgba(240,237,230,0.9)",
              margin: 0,
              textTransform: "uppercase",
            }}>
              Binara
            </h1>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: "0.15em",
              color: "#F7B731",
              border: "1px solid rgba(247,183,49,0.3)",
              borderRadius: 4,
              padding: "2px 6px",
              textTransform: "uppercase",
            }}>
              Pro
            </span>
          </div>
          {/* Settings dot */}
          <div style={{
            width: 28, height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            opacity: 0.4,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="3" r="1.2" fill="rgba(255,255,255,0.6)" />
              <circle cx="8" cy="8" r="1.2" fill="rgba(255,255,255,0.6)" />
              <circle cx="8" cy="13" r="1.2" fill="rgba(255,255,255,0.6)" />
            </svg>
          </div>
        </div>

        <ModeTabs />
        <CategoryTabs active={category} onChange={setCategory} />

        {/* Card grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}>
          {filtered.map((preset, i) => (
            <PresetCard key={preset.id} preset={preset} index={i} />
          ))}
        </div>
      </div>

      {/* Keyframe animation */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=JetBrains+Mono:wght@400;500&family=Inter:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080A12; }

        @keyframes cardReveal {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Hide scrollbar on category tabs */
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
