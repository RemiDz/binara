'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSettings } from '@/hooks/useSettings';
import { useProContext } from '@/context/ProContext';
import { getProState } from '@/lib/pro';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const { settings, updateSettings } = useSettings();
  const { isPro, deactivate } = useProContext();
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const stableOnClose = useCallback(() => onClose(), [onClose]);
  const trapRef = useFocusTrap(isOpen, stableOnClose);

  const proState = getProState();
  const maskedKey = proState?.licenceKey
    ? '\u2022'.repeat(Math.max(0, proState.licenceKey.length - 4)) + proState.licenceKey.slice(-4)
    : null;

  const handleClearSessions = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    localStorage.removeItem('binara_sessions');
    localStorage.removeItem('binara_advanced_sessions');
    setConfirmClear(false);
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem('binara_onboarding_complete');
    window.location.reload();
  };

  const handleDeactivatePro = () => {
    if (!confirmDeactivate) {
      setConfirmDeactivate(true);
      return;
    }
    deactivate();
    setConfirmDeactivate(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl"
            style={{
              background: 'rgba(10, 22, 40, 0.98)',
              borderTop: '1px solid var(--glass-border)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              paddingBottom: 'calc(var(--safe-area-bottom) + 16px)',
            }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 pt-5 pb-3" style={{ background: 'rgba(10, 22, 40, 0.98)' }}>
              <h2
                id="settings-title"
                className="font-[family-name:var(--font-playfair)] text-lg"
                style={{ color: 'var(--text-primary)' }}
              >
                Settings
              </h2>
              <button
                onClick={onClose}
                aria-label="Close settings"
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ background: 'var(--glass-bg)', color: 'var(--text-muted)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 pb-6 space-y-8">
              {/* ── Audio ── */}
              <section>
                <SectionLabel>Audio</SectionLabel>
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <SettingLabel>Default volume</SettingLabel>
                      <span className="font-[family-name:var(--font-jetbrains)] text-xs" style={{ color: '#4fc3f7' }}>
                        {settings.defaultVolume}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={settings.defaultVolume}
                      onChange={(e) => updateSettings({ defaultVolume: Number(e.target.value) })}
                      aria-label="Default volume"
                    />
                  </div>
                  <Toggle
                    label="Completion chime"
                    checked={settings.completionChime}
                    onChange={(v) => updateSettings({ completionChime: v })}
                  />
                  <Toggle
                    label="Headphone reminder"
                    checked={settings.headphoneReminder}
                    onChange={(v) => updateSettings({ headphoneReminder: v })}
                  />
                </div>
              </section>

              {/* ── Display ── */}
              <section>
                <SectionLabel>Display</SectionLabel>
                <div className="space-y-5">
                  <Toggle
                    label="Reduced motion"
                    checked={settings.reducedMotion}
                    onChange={(v) => updateSettings({ reducedMotion: v })}
                  />
                  <Toggle
                    label="Background particles"
                    checked={settings.backgroundParticles}
                    onChange={(v) => updateSettings({ backgroundParticles: v })}
                  />
                </div>
              </section>

              {/* ── Data ── */}
              <section>
                <SectionLabel>Data</SectionLabel>
                <div className="space-y-3">
                  <button
                    onClick={handleClearSessions}
                    className="w-full text-left font-[family-name:var(--font-inter)] text-sm px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: confirmClear ? 'rgba(239, 83, 80, 0.12)' : 'var(--glass-bg)',
                      border: `1px solid ${confirmClear ? 'rgba(239, 83, 80, 0.25)' : 'var(--glass-border)'}`,
                      color: confirmClear ? '#ef5350' : 'var(--text-secondary)',
                    }}
                  >
                    {confirmClear ? 'Tap again to confirm' : 'Clear All Saved Sessions'}
                  </button>
                  <button
                    onClick={handleResetOnboarding}
                    className="w-full text-left font-[family-name:var(--font-inter)] text-sm px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Reset Onboarding
                  </button>
                </div>
              </section>

              {/* ── Pro ── */}
              <section>
                <SectionLabel>Pro</SectionLabel>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                    <span className="font-[family-name:var(--font-inter)] text-sm" style={{ color: 'var(--text-muted)' }}>Status:</span>
                    {isPro ? (
                      <span
                        className="font-[family-name:var(--font-jetbrains)] text-xs font-medium px-2 py-0.5 rounded"
                        style={{ background: 'rgba(255, 171, 64, 0.15)', color: '#ffab40' }}
                      >
                        Active (PRO)
                      </span>
                    ) : (
                      <span className="font-[family-name:var(--font-inter)] text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Free
                      </span>
                    )}
                  </div>

                  {isPro && maskedKey && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                      <span className="font-[family-name:var(--font-inter)] text-sm" style={{ color: 'var(--text-muted)' }}>Licence key:</span>
                      <span className="font-[family-name:var(--font-jetbrains)] text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {maskedKey}
                      </span>
                    </div>
                  )}

                  {isPro && (
                    <button
                      onClick={handleDeactivatePro}
                      className="w-full text-left font-[family-name:var(--font-inter)] text-sm px-4 py-3 rounded-xl transition-all"
                      style={{
                        background: confirmDeactivate ? 'rgba(239, 83, 80, 0.12)' : 'var(--glass-bg)',
                        border: `1px solid ${confirmDeactivate ? 'rgba(239, 83, 80, 0.25)' : 'var(--glass-border)'}`,
                        color: confirmDeactivate ? '#ef5350' : 'var(--text-secondary)',
                      }}
                    >
                      {confirmDeactivate ? 'Tap again to deactivate' : 'Deactivate Pro'}
                    </button>
                  )}
                </div>
              </section>

              {/* ── About ── */}
              <section>
                <SectionLabel>About</SectionLabel>
                <div
                  className="rounded-xl p-4 space-y-2"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                >
                  <p className="font-[family-name:var(--font-playfair)] text-sm" style={{ color: 'var(--text-primary)' }}>
                    Binara v1.0
                  </p>
                  <p className="font-[family-name:var(--font-inter)] text-xs" style={{ color: 'var(--text-muted)' }}>
                    Part of the Harmonic Waves ecosystem
                  </p>
                  <p className="font-[family-name:var(--font-inter)] text-xs" style={{ color: 'var(--text-muted)' }}>
                    Crafted by Remigijus Dzingelevi{'\u010D'}ius {'\u00B7'} 2026
                  </p>
                  <a
                    href="https://harmonicwaves.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-[family-name:var(--font-inter)] text-xs mt-1"
                    style={{ color: '#4fc3f7' }}
                  >
                    harmonicwaves.app {'\u2192'}
                  </a>
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Helpers ───

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-[family-name:var(--font-jetbrains)] text-[10px] tracking-[0.15em] uppercase mb-3"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </h3>
  );
}

function SettingLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-[family-name:var(--font-inter)] text-sm" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </span>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <SettingLabel>{label}</SettingLabel>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="w-10 h-6 rounded-full transition-all relative focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        style={{
          background: checked ? 'rgba(79, 195, 247, 0.3)' : 'rgba(255, 255, 255, 0.08)',
          border: `1px solid ${checked ? 'rgba(79, 195, 247, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
        }}
      >
        <div
          className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
          style={{
            background: checked ? '#4fc3f7' : 'rgba(255, 255, 255, 0.25)',
            left: checked ? 20 : 4,
          }}
        />
      </button>
    </div>
  );
}
