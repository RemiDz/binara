'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Don't show if dismissed before
    if (localStorage.getItem('binara_install_dismissed') === 'true') return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;

      // Show after 2+ completed sessions
      const sessionCount = parseInt(localStorage.getItem('binara_sessions_count') || '0');
      if (sessionCount >= 2) {
        setShow(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    deferredPromptRef.current = null;
  };

  const handleDismiss = () => {
    localStorage.setItem('binara_install_dismissed', 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4"
          style={{ paddingBottom: 'calc(var(--safe-area-bottom) + 16px)' }}
        >
          <div
            className="max-w-md mx-auto flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              background: 'rgba(10, 22, 40, 0.95)',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <span
              className="font-[family-name:var(--font-inter)] text-sm flex-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Add Binara to your home screen
            </span>
            <button
              onClick={handleInstall}
              className="font-[family-name:var(--font-inter)] text-xs font-medium px-3 py-1.5 rounded-full transition-all shrink-0"
              style={{
                background: 'rgba(79, 195, 247, 0.15)',
                border: '1px solid rgba(79, 195, 247, 0.3)',
                color: '#4fc3f7',
              }}
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center rounded-full shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
