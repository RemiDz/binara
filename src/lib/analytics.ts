// ─── Plausible Analytics ───
// Lightweight event tracking via Plausible (only fires on binara.app domain)

export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plausible = (window as any).plausible;
  if (typeof plausible === 'function') {
    plausible(name, props ? { props } : undefined);
  }
}
