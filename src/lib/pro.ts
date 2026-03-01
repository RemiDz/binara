// ─── Pro licence management ───
// Uses LemonSqueezy API for licence activation/validation
// Persists Pro state to localStorage with offline grace period

// ━━━ TESTING MODE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Reads from env var NEXT_PUBLIC_PRO_TESTING_MODE. Defaults to false.
const TESTING_MODE = process.env.NEXT_PUBLIC_PRO_TESTING_MODE === 'true';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ProState {
  isActive: boolean;
  licenceKey: string;
  activatedAt: string;
  lastVerified: string;
}

const STORAGE_KEY = 'binara_pro';
const OFFLINE_GRACE_DAYS = 7;

// Placeholder until product is created on LemonSqueezy
export const LEMONSQUEEZY_CHECKOUT_URL = 'https://binara.lemonsqueezy.com/checkout';

export function getProState(): ProState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setProState(state: ProState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or private browsing — silently fail
  }
}

export function isPro(): boolean {
  if (TESTING_MODE) return true;
  const state = getProState();
  return state?.isActive === true;
}

export function clearPro(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function activatePro(licenceKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/licence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'activate',
        licence_key: licenceKey,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setProState({
        isActive: true,
        licenceKey,
        activatedAt: new Date().toISOString(),
        lastVerified: new Date().toISOString(),
      });
      return { success: true };
    }

    return { success: false, error: data.error ?? 'Activation failed' };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function verifyLicence(licenceKey: string): Promise<boolean> {
  try {
    const res = await fetch('/api/licence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify',
        licence_key: licenceKey,
      }),
    });

    const data = await res.json();
    return data.success && data.valid;
  } catch {
    return false; // Network error — offline grace period handles this
  }
}

export async function checkProOnLoad(): Promise<boolean> {
  if (TESTING_MODE) return true;
  const state = getProState();
  if (!state || !state.isActive) return false;

  // Try to verify online
  const verified = await verifyLicence(state.licenceKey);
  if (verified) {
    setProState({ ...state, lastVerified: new Date().toISOString() });
    return true;
  }

  // Offline grace period: if last verified within 7 days, keep Pro active
  const lastVerified = new Date(state.lastVerified).getTime();
  const now = Date.now();
  const daysSinceVerification = (now - lastVerified) / (1000 * 60 * 60 * 24);

  if (daysSinceVerification <= OFFLINE_GRACE_DAYS) {
    return true;
  }

  // Grace period expired — deactivate
  clearPro();
  return false;
}
