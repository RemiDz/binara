'use client';

import { useState } from 'react';
import { useProContext } from '@/context/ProContext';
import { trackEvent } from '@/lib/analytics';
import ProUpgrade from './ProUpgrade';
import Settings from './Settings';

export default function Header() {
  const { isPro } = useProContext();
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 glass px-4 py-3" style={{ paddingTop: 'calc(var(--safe-area-top) + 12px)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1
              className="font-[family-name:var(--font-playfair)] text-lg tracking-[0.15em] uppercase"
              style={{ color: 'var(--text-primary)' }}
            >
              B I N A R A
            </h1>
            {isPro && (
              <span
                className="font-[family-name:var(--font-jetbrains)] text-[9px] font-medium px-1.5 py-0.5 rounded-md"
                style={{
                  background: 'rgba(255, 171, 64, 0.15)',
                  border: '1px solid rgba(255, 171, 64, 0.25)',
                  color: '#ffab40',
                }}
              >
                PRO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isPro && (
              <button
                onClick={() => { trackEvent('Pro Upgrade Click', { source: 'header' }); setShowProUpgrade(true); }}
                className="font-[family-name:var(--font-inter)] text-[11px] font-medium px-2.5 py-1 rounded-full transition-all active:scale-[0.97]"
                style={{
                  color: '#7986cb',
                  background: 'rgba(121, 134, 203, 0.08)',
                }}
              >
                Upgrade
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full glass-hover transition-colors"
              aria-label="Settings"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <ProUpgrade isOpen={showProUpgrade} onClose={() => setShowProUpgrade(false)} />
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
