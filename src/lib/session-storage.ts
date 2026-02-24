export interface SavedSession {
  id: string;
  name: string;
  createdAt: string;
  stateId: string;
  carrierId: string;
  ambientLayers: { id: string; volume: number }[];
  timeline: {
    easeIn: number; // minutes
    deep: number;
    easeOut: number;
  };
}

const STORAGE_KEY = 'binara_sessions';
const MAX_FREE_SESSIONS = 3;

export function loadSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSession(session: SavedSession, isPro = false): { success: boolean; error?: string } {
  const sessions = loadSessions();
  if (!isPro && sessions.length >= MAX_FREE_SESSIONS) {
    return { success: false, error: `Free plan supports ${MAX_FREE_SESSIONS} saved sessions. Delete one to save a new one, or upgrade to Pro for unlimited saves.` };
  }
  sessions.push(session);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  return { success: true };
}

export function deleteSession(id: string): void {
  const sessions = loadSessions().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getSessionCount(): number {
  return loadSessions().length;
}

export function generateSessionName(stateLabel: string): string {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  return `${stateLabel} ${timeOfDay} Session`;
}

export { MAX_FREE_SESSIONS };

// ─── Advanced session storage ───

import type { SavedAdvancedSession } from '@/types';

const ADVANCED_STORAGE_KEY = 'binara_advanced_sessions';
const MAX_FREE_ADVANCED_SESSIONS = 2;

export function loadAdvancedSessions(): SavedAdvancedSession[] {
  try {
    const raw = localStorage.getItem(ADVANCED_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAdvancedSession(session: SavedAdvancedSession, isPro = false): { success: boolean; error?: string } {
  const sessions = loadAdvancedSessions();
  if (!isPro && sessions.length >= MAX_FREE_ADVANCED_SESSIONS) {
    return { success: false, error: `Free plan supports ${MAX_FREE_ADVANCED_SESSIONS} saved advanced sessions. Delete one to save a new one, or upgrade to Pro for unlimited saves.` };
  }
  sessions.push(session);
  localStorage.setItem(ADVANCED_STORAGE_KEY, JSON.stringify(sessions));
  return { success: true };
}

export function deleteAdvancedSession(id: string): void {
  const sessions = loadAdvancedSessions().filter((s) => s.id !== id);
  localStorage.setItem(ADVANCED_STORAGE_KEY, JSON.stringify(sessions));
}

export { MAX_FREE_ADVANCED_SESSIONS };
