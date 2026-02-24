// ─── Session sharing via URL hash ───
// Encodes full session config in URL hash for zero-server sharing

import type { AdvancedSessionConfig, MixConfig } from '@/types';

export type SharedSession = {
  type: 'advanced';
  config: AdvancedSessionConfig;
} | {
  type: 'mix';
  config: MixConfig;
};

export function encodeSession(session: SharedSession): string {
  try {
    return btoa(encodeURIComponent(JSON.stringify(session)));
  } catch {
    return '';
  }
}

export function decodeSession(hash: string): SharedSession | null {
  try {
    const json = decodeURIComponent(atob(hash));
    const parsed = JSON.parse(json);
    if (parsed && (parsed.type === 'advanced' || parsed.type === 'mix') && parsed.config) {
      return parsed as SharedSession;
    }
    return null;
  } catch {
    return null;
  }
}

export async function shareSession(session: SharedSession, name: string): Promise<boolean> {
  const encoded = encodeSession(session);
  if (!encoded) return false;

  const url = `${window.location.origin}${window.location.pathname}#s=${encoded}`;

  // Try native share API (mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Binara — ${name}`,
        text: `Listen to my "${name}" binaural beats session on Binara`,
        url,
      });
      return true;
    } catch {
      // User cancelled or not supported — fall through to clipboard
    }
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

export function getSharedSessionFromURL(): SharedSession | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#s=')) return null;

  const encoded = hash.slice(3);
  return decodeSession(encoded);
}
