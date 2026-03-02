const LS_KEY = 'binara-session-history';

export interface SessionLog {
  id: string;
  date: string;            // ISO date "2026-02-26"
  timestamp: number;       // Unix timestamp
  presetName: string;
  presetId?: string;
  mode: 'listen' | 'mix' | 'create';
  waveState: string;
  beatFreq: number;
  carrierFreq: number;
  durationMinutes: number; // actual minutes completed
  completedFull: boolean;
  ambientLayers: string[];
  sensorsUsed: boolean;
  hapticUsed: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string;
}

export interface MonthlyStats {
  totalSessions: number;
  totalMinutes: number;
  averageSessionMinutes: number;
  favouritePreset: string;
  favouriteWaveState: string;
  completionRate: number;
  daysActive: number;
}

// ─── Storage ───

export function loadHistory(): SessionLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessionLog(log: SessionLog): void {
  const history = loadHistory();
  history.push(log);

  // Prune if localStorage is getting large (>4MB for this key)
  const json = JSON.stringify(history);
  try {
    if (json.length > 4_000_000) {
      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      const pruned = history.filter(s => s.timestamp > oneYearAgo);
      localStorage.setItem(LS_KEY, JSON.stringify(pruned));
    } else {
      localStorage.setItem(LS_KEY, json);
    }
  } catch { /* QuotaExceededError — silently drop */ }
}

export function clearHistory(): void {
  localStorage.removeItem(LS_KEY);
}

// ─── Helpers ───

export function createSessionLog(opts: {
  presetName: string;
  presetId?: string;
  mode: 'listen' | 'mix' | 'create';
  waveState: string;
  beatFreq: number;
  carrierFreq: number;
  elapsedSeconds: number;
  presetDurationMinutes: number;
  completedFull: boolean;
  ambientLayers: string[];
  sensorsUsed: boolean;
  hapticUsed: boolean;
}): SessionLog | null {
  const durationMinutes = Math.round(opts.elapsedSeconds / 60);
  // Don't log sessions under 1 minute
  if (durationMinutes < 1) return null;

  const now = new Date();
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
    date: now.toISOString().split('T')[0],
    timestamp: now.getTime(),
    presetName: opts.presetName,
    presetId: opts.presetId,
    mode: opts.mode,
    waveState: opts.waveState,
    beatFreq: opts.beatFreq,
    carrierFreq: opts.carrierFreq,
    durationMinutes,
    completedFull: opts.completedFull,
    ambientLayers: opts.ambientLayers,
    sensorsUsed: opts.sensorsUsed,
    hapticUsed: opts.hapticUsed,
  };
}

// ─── Streak calculation ───

export function calculateStreak(history: SessionLog[]): StreakData {
  const dates = [...new Set(history.map(s => s.date))].sort().reverse();

  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0, lastSessionDate: '' };

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Current streak: must include today or yesterday
  let currentStreak = 0;
  if (dates[0] === today || dates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1] + 'T00:00:00');
      const curr = new Date(dates[i] + 'T00:00:00');
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak
  let longest = 1;
  let running = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T00:00:00');
    const curr = new Date(dates[i] + 'T00:00:00');
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
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

// ─── Monthly stats ───

export function getMonthlyStats(history: SessionLog[], year: number, month: number): MonthlyStats {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const sessions = history.filter(s => s.date.startsWith(prefix));

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      averageSessionMinutes: 0,
      favouritePreset: '-',
      favouriteWaveState: '-',
      completionRate: 0,
      daysActive: 0,
    };
  }

  const totalMinutes = sessions.reduce((s, l) => s + l.durationMinutes, 0);
  const completed = sessions.filter(s => s.completedFull).length;
  const uniqueDays = new Set(sessions.map(s => s.date)).size;

  // Most frequent preset
  const presetCounts: Record<string, number> = {};
  sessions.forEach(s => { presetCounts[s.presetName] = (presetCounts[s.presetName] || 0) + 1; });
  const favouritePreset = Object.entries(presetCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';

  // Most frequent wave state
  const waveCounts: Record<string, number> = {};
  sessions.forEach(s => { waveCounts[s.waveState] = (waveCounts[s.waveState] || 0) + 1; });
  const favouriteWaveState = Object.entries(waveCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';

  return {
    totalSessions: sessions.length,
    totalMinutes,
    averageSessionMinutes: Math.round(totalMinutes / sessions.length),
    favouritePreset,
    favouriteWaveState,
    completionRate: Math.round((completed / sessions.length) * 100),
    daysActive: uniqueDays,
  };
}

// ─── Calendar data ───

export interface CalendarDay {
  date: string;
  totalMinutes: number;
  sessionCount: number;
}

export function getCalendarData(history: SessionLog[], year: number, month: number): CalendarDay[] {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const sessions = history.filter(s => s.date.startsWith(prefix));

  const dayMap: Record<string, CalendarDay> = {};
  sessions.forEach(s => {
    if (!dayMap[s.date]) {
      dayMap[s.date] = { date: s.date, totalMinutes: 0, sessionCount: 0 };
    }
    dayMap[s.date].totalMinutes += s.durationMinutes;
    dayMap[s.date].sessionCount++;
  });

  // Fill all days of the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    result.push(dayMap[dateStr] ?? { date: dateStr, totalMinutes: 0, sessionCount: 0 });
  }

  return result;
}

// ─── Motivational text ───

export function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Start your first session today';
  if (streak === 1) return 'Great start \u2014 come back tomorrow';
  if (streak < 7) return 'Building momentum!';
  if (streak < 14) return 'One week strong \u2014 keep going!';
  if (streak < 30) return 'Incredible dedication';
  return "You're a natural";
}

// ─── Most used brainwave colour ───

export function getMostUsedWaveState(history: SessionLog[]): string {
  if (history.length === 0) return 'alpha';
  const counts: Record<string, number> = {};
  history.forEach(s => { counts[s.waveState] = (counts[s.waveState] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}
