// ─── App settings persistence ───

export interface AppSettings {
  defaultVolume: number;          // 0–100, default 60
  completionChime: boolean;       // default true
  headphoneReminder: boolean;     // default true
  reducedMotion: boolean;         // default: match system pref
  backgroundParticles: boolean;   // default true
}

const STORAGE_KEY = 'binara_settings';

const DEFAULTS: AppSettings = {
  defaultVolume: 60,
  completionChime: true,
  headphoneReminder: true,
  reducedMotion: false,
  backgroundParticles: true,
};

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getDefaultSettings(): AppSettings {
  return { ...DEFAULTS };
}
