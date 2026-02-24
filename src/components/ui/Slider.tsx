'use client';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  color?: string;
  logarithmic?: boolean;
  disabled?: boolean;
  onChange: (value: number) => void;
}

function toLog(value: number, min: number, max: number): number {
  const minLog = Math.log(min || 1);
  const maxLog = Math.log(max);
  return (Math.log(value || 1) - minLog) / (maxLog - minLog);
}

function fromLog(position: number, min: number, max: number): number {
  const minLog = Math.log(min || 1);
  const maxLog = Math.log(max);
  return Math.exp(minLog + position * (maxLog - minLog));
}

function formatValue(value: number, suffix?: string): string {
  const display = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value >= 100 ? Math.round(value).toString() : value >= 10 ? value.toFixed(1) : value.toFixed(2);
  return suffix ? `${display} ${suffix}` : display;
}

export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  color = '#4fc3f7',
  logarithmic = false,
  disabled = false,
  onChange,
}: SliderProps) {
  const sliderValue = logarithmic ? toLog(value, min, max) * 1000 : value;
  const sliderMin = logarithmic ? 0 : min;
  const sliderMax = logarithmic ? 1000 : max;
  const sliderStep = logarithmic ? 1 : step;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    if (logarithmic) {
      const actual = fromLog(raw / 1000, min, max);
      const snapped = Math.round(actual / step) * step;
      onChange(Math.max(min, Math.min(max, snapped)));
    } else {
      onChange(raw);
    }
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <span
          className="font-[family-name:var(--font-inter)] text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </span>
        <span
          className="font-[family-name:var(--font-jetbrains)] text-[10px]"
          style={{ color }}
        >
          {formatValue(value, suffix)}
        </span>
      </div>
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={sliderValue}
        onChange={handleChange}
        disabled={disabled}
        className="w-full h-[44px]"
        style={{
          '--color-pulse-cyan': color,
        } as React.CSSProperties}
        aria-label={label}
      />
    </div>
  );
}
