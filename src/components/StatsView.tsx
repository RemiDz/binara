'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  loadHistory,
  calculateStreak,
  getMonthlyStats,
  getCalendarData,
  getStreakMessage,
  getMostUsedWaveState,
  clearHistory,
} from '@/lib/session-history';
import { WAVE_STATES } from './listen/wave-states';
import type { BrainwaveState } from '@/types';

interface StatsViewProps {
  onClose: () => void;
}

export default function StatsView({ onClose }: StatsViewProps) {
  const history = useMemo(() => loadHistory(), []);
  const streak = useMemo(() => calculateStreak(history), [history]);
  const waveState = useMemo(() => getMostUsedWaveState(history), [history]);
  const waveColor = WAVE_STATES[waveState as BrainwaveState]?.color ?? '#4ECDC4';

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const monthlyStats = useMemo(() => getMonthlyStats(history, viewYear, viewMonth), [history, viewYear, viewMonth]);
  const calendarData = useMemo(() => getCalendarData(history, viewYear, viewMonth), [history, viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const navigateMonth = useCallback((dir: -1 | 1) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
    setSelectedDay(null);
  }, [viewMonth, viewYear]);

  // Group recent sessions by date (newest first, max 30)
  const recentGroups = useMemo(() => {
    const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp).slice(0, 30);
    const groups: { label: string; sessions: typeof sorted }[] = [];
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let currentDate = '';
    for (const s of sorted) {
      if (s.date !== currentDate) {
        currentDate = s.date;
        let label = s.date;
        if (s.date === today) label = 'Today';
        else if (s.date === yesterday) label = 'Yesterday';
        else {
          const d = new Date(s.date + 'T00:00:00');
          label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        groups.push({ label, sessions: [] });
      }
      groups[groups.length - 1].sessions.push(s);
    }
    return groups;
  }, [history]);

  const selectedDayInfo = selectedDay ? calendarData.find(d => d.date === selectedDay) : null;

  const handleClear = useCallback(() => {
    clearHistory();
    setShowClearConfirm(false);
    onClose();
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 min-h-dvh flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ paddingTop: 'calc(var(--safe-area-top) + 12px)' }}>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full glass-hover transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2
          className="font-[family-name:var(--font-playfair)] text-lg"
          style={{ color: 'var(--text-primary)' }}
        >
          Stats
        </h2>
        <div className="w-10" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">

        {/* Streak banner */}
        <div
          className="rounded-2xl px-5 py-4"
          style={{
            background: streak.currentStreak > 0
              ? 'linear-gradient(135deg, rgba(247,183,49,0.1), rgba(247,183,49,0.03))'
              : 'rgba(255,255,255,0.03)',
            border: `1px solid ${streak.currentStreak > 0 ? 'rgba(247,183,49,0.15)' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span style={{ fontSize: 20 }}>{streak.currentStreak > 0 ? '\uD83D\uDD25' : '\u2728'}</span>
            <span
              className="font-[family-name:var(--font-playfair)] text-2xl font-semibold"
              style={{ color: streak.currentStreak > 0 ? '#F7B731' : 'var(--text-primary)' }}
            >
              {streak.currentStreak > 0 ? `${streak.currentStreak} day streak` : 'No streak yet'}
            </span>
          </div>
          {streak.longestStreak > 0 && (
            <div className="flex gap-4 mb-2">
              <span className="font-[family-name:var(--font-inter)] text-xs" style={{ color: 'var(--text-secondary)' }}>
                Current: {streak.currentStreak} {streak.currentStreak === 1 ? 'day' : 'days'}
              </span>
              <span className="font-[family-name:var(--font-inter)] text-xs" style={{ color: 'var(--text-muted)' }}>
                Best: {streak.longestStreak} {streak.longestStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}
          <p
            className="font-[family-name:var(--font-inter)] text-[11px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {getStreakMessage(streak.currentStreak)}
          </p>
        </div>

        {/* Monthly summary */}
        <div
          className="rounded-2xl px-5 py-4"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigateMonth(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)' }}
              aria-label="Previous month"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <span
              className="font-[family-name:var(--font-inter)] text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {monthLabel}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)' }}
              aria-label="Next month"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>

          {monthlyStats.totalSessions > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              <StatCell label="Sessions" value={String(monthlyStats.totalSessions)} />
              <StatCell label="Minutes" value={String(monthlyStats.totalMinutes)} />
              <StatCell label="Avg Session" value={`${monthlyStats.averageSessionMinutes} min`} />
              <StatCell label="Days Active" value={`${monthlyStats.daysActive}/${daysInMonth}`} />
              <StatCell label="Favourite" value={monthlyStats.favouritePreset} span />
              <StatCell label="Completion" value={`${monthlyStats.completionRate}%`} />
              <StatCell label="Wave State" value={monthlyStats.favouriteWaveState} />
            </div>
          ) : (
            <p className="font-[family-name:var(--font-inter)] text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
              No sessions this month
            </p>
          )}
        </div>

        {/* Activity calendar */}
        <div
          className="rounded-2xl px-5 py-4"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h3
            className="font-[family-name:var(--font-inter)] text-xs font-medium mb-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            Activity
          </h3>
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {/* Day labels */}
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center font-[family-name:var(--font-jetbrains)] text-[9px]" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                {d}
              </div>
            ))}
            {/* Empty cells for offset */}
            {Array.from({ length: getFirstDayOffset(viewYear, viewMonth) }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {/* Day cells */}
            {calendarData.map((day) => {
              const intensity = day.totalMinutes === 0 ? 0
                : day.totalMinutes <= 15 ? 0.2
                : day.totalMinutes <= 30 ? 0.4
                : 0.7;
              const isSelected = selectedDay === day.date;
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDay(isSelected ? null : day.date)}
                  className="aspect-square rounded-sm transition-all"
                  style={{
                    background: intensity > 0 ? `${waveColor}${Math.round(intensity * 255).toString(16).padStart(2, '0')}` : 'rgba(255,255,255,0.03)',
                    border: isSelected ? `1px solid ${waveColor}` : '1px solid transparent',
                    minHeight: 16,
                  }}
                  aria-label={`${day.date}: ${day.sessionCount} sessions, ${day.totalMinutes} min`}
                />
              );
            })}
          </div>

          {/* Selected day tooltip */}
          {selectedDayInfo && (
            <div
              className="mt-2 px-3 py-1.5 rounded-lg font-[family-name:var(--font-inter)] text-[11px]"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
            >
              {new Date(selectedDayInfo.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' \u2014 '}
              {selectedDayInfo.sessionCount === 0
                ? 'No sessions'
                : `${selectedDayInfo.sessionCount} session${selectedDayInfo.sessionCount > 1 ? 's' : ''}, ${selectedDayInfo.totalMinutes} min`
              }
            </div>
          )}
        </div>

        {/* Recent sessions */}
        <div
          className="rounded-2xl px-5 py-4"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h3
            className="font-[family-name:var(--font-inter)] text-xs font-medium mb-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            Recent Sessions
          </h3>

          {recentGroups.length === 0 ? (
            <p className="font-[family-name:var(--font-inter)] text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
              No sessions yet. Start your first one!
            </p>
          ) : (
            <div className="space-y-3">
              {recentGroups.map((group) => (
                <div key={group.label}>
                  <p className="font-[family-name:var(--font-inter)] text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.sessions.map((s) => {
                      const wc = WAVE_STATES[s.waveState as BrainwaveState]?.color ?? 'var(--text-muted)';
                      return (
                        <div
                          key={s.id}
                          className="flex items-center gap-2 py-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: wc }} />
                          <span className="font-[family-name:var(--font-inter)] text-xs flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                            {s.presetName}
                          </span>
                          <span className="font-[family-name:var(--font-jetbrains)] text-[10px] shrink-0" style={{ color: wc, opacity: 0.7 }}>
                            {s.waveState}
                          </span>
                          <span className="font-[family-name:var(--font-jetbrains)] text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                            {s.beatFreq} Hz
                          </span>
                          <span className="font-[family-name:var(--font-jetbrains)] text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                            {s.durationMinutes} min
                          </span>
                          <span className="text-[10px] shrink-0" style={{ color: s.completedFull ? '#4ECDC4' : 'var(--text-muted)', opacity: 0.6 }}>
                            {s.completedFull ? '\u2713' : '\u2022'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clear history */}
        {history.length > 0 && (
          <div className="text-center pt-2">
            {showClearConfirm ? (
              <div className="flex items-center justify-center gap-3">
                <span className="font-[family-name:var(--font-inter)] text-xs" style={{ color: 'var(--text-muted)' }}>
                  Clear all history?
                </span>
                <button
                  onClick={handleClear}
                  className="font-[family-name:var(--font-inter)] text-xs px-3 py-1 rounded-full"
                  style={{ background: 'rgba(252,92,101,0.15)', color: '#FC5C65', border: '1px solid rgba(252,92,101,0.3)' }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="font-[family-name:var(--font-inter)] text-xs px-3 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="font-[family-name:var(--font-inter)] text-[11px]"
                style={{ color: 'var(--text-muted)', opacity: 0.5 }}
              >
                Clear History
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Helper components ───

function StatCell({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <p className="font-[family-name:var(--font-inter)] text-[10px]" style={{ color: 'var(--text-muted)', marginBottom: 2 }}>
        {label}
      </p>
      <p className="font-[family-name:var(--font-inter)] text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

function getFirstDayOffset(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday=0 format
  return day === 0 ? 6 : day - 1;
}
