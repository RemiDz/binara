// ─── Session sharing via clean URLs ───

import type { AdvancedSessionConfig, MixConfig } from '@/types';

export type SharedSession =
  | { type: 'listen'; presetId: string }
  | { type: 'advanced'; config: AdvancedSessionConfig }
  | { type: 'mix'; config: MixConfig };

// ─── URL Generation ───

export function generateShareUrl(session: SharedSession): string {
  const base = typeof window !== 'undefined'
    ? `${window.location.origin}`
    : 'https://binara.app';

  if (session.type === 'listen') {
    return `${base}/s/${session.presetId}`;
  }

  if (session.type === 'mix') {
    const c = session.config;
    const params = new URLSearchParams();
    params.set('state', c.stateId);
    if (c.customBeatFreq) params.set('beat', String(c.customBeatFreq));
    params.set('tone', c.carrierId);
    if (c.customCarrierFreq) params.set('carrier', String(c.customCarrierFreq));
    if (c.ambientLayers.length > 0) {
      params.set('ambient', c.ambientLayers.map((l) => l.id).join(','));
    }
    params.set('ei', String(c.timeline.easeIn));
    params.set('d', String(c.timeline.deep));
    params.set('eo', String(c.timeline.easeOut));
    return `${base}/s/mix?${params.toString()}`;
  }

  if (session.type === 'advanced') {
    // Advanced sessions use compact hash encoding (too complex for query params)
    const encoded = btoa(encodeURIComponent(JSON.stringify({ type: 'advanced', config: session.config })));
    return `${base}/s/create?c=${encoded}`;
  }

  return base;
}

// ─── URL Parsing ───

export function parseShareUrl(): SharedSession | null {
  if (typeof window === 'undefined') return null;

  const path = window.location.pathname;

  // Check /s/... routes
  if (!path.startsWith('/s/')) {
    // Legacy: check #s= hash
    return getSharedSessionFromHash();
  }

  const rest = path.slice(3); // remove '/s/'

  // /s/mix?state=alpha&...
  if (rest === 'mix' || rest.startsWith('mix/')) {
    return parseMixFromUrl();
  }

  // /s/create?c=base64...
  if (rest === 'create' || rest.startsWith('create/')) {
    return parseAdvancedFromUrl();
  }

  // /s/deep-focus — listen preset
  const presetId = rest.replace(/\/$/, '');
  if (presetId) {
    return { type: 'listen', presetId };
  }

  return null;
}

function parseMixFromUrl(): SharedSession | null {
  const params = new URLSearchParams(window.location.search);
  const stateId = params.get('state');
  if (!stateId) return null;

  const config: MixConfig = {
    stateId,
    carrierId: params.get('tone') ?? 'earth',
    ambientLayers: (params.get('ambient') ?? '').split(',').filter(Boolean).map((id) => ({ id, volume: 50 })),
    timeline: {
      easeIn: Number(params.get('ei')) || 3,
      deep: Number(params.get('d')) || 15,
      easeOut: Number(params.get('eo')) || 2,
    },
  };

  const customCarrier = params.get('carrier');
  if (customCarrier) config.customCarrierFreq = Number(customCarrier);

  const customBeat = params.get('beat');
  if (customBeat) config.customBeatFreq = Number(customBeat);

  return { type: 'mix', config };
}

function parseAdvancedFromUrl(): SharedSession | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('c');
  if (!encoded) return null;

  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    if (parsed?.type === 'advanced' && parsed.config) {
      return { type: 'advanced', config: parsed.config };
    }
  } catch { /* invalid encoding */ }

  return null;
}

// Legacy hash-based sharing (backward compatible)
function getSharedSessionFromHash(): SharedSession | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#s=')) return null;

  try {
    const encoded = hash.slice(3);
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    if (parsed && (parsed.type === 'advanced' || parsed.type === 'mix') && parsed.config) {
      return parsed as SharedSession;
    }
  } catch { /* invalid */ }

  return null;
}

// ─── Share Action ───

export async function shareSession(session: SharedSession, name: string): Promise<boolean> {
  const url = generateShareUrl(session);
  if (!url) return false;

  const waveState = session.type === 'listen' ? '' : session.type === 'mix' ? 'mix ' : 'custom ';

  // Try native share API (mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Binara — ${name}`,
        text: `Try this ${waveState}binaural beat session on Binara`,
        url,
      });
      return true;
    } catch {
      // User cancelled — fall through to clipboard
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

// Keep old name for backward compatibility
export function getSharedSessionFromURL(): SharedSession | null {
  return parseShareUrl();
}
