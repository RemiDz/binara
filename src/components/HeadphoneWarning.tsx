'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';

const LS_DISMISSED = 'binara_hp_warning_dismissed';
const LS_PERMANENT = 'binara_hp_warning_permanent';

function shouldShowWarning(): boolean {
  if (typeof window === 'undefined') return false;

  const permanent = localStorage.getItem(LS_PERMANENT);
  if (permanent === 'true') return false;

  const dismissed = localStorage.getItem(LS_DISMISSED);
  if (!dismissed) return true;

  // Show again after 7 days
  const ts = parseInt(dismissed, 10);
  if (isNaN(ts)) return true;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - ts > sevenDays;
}

interface HeadphoneWarningProps {
  isOpen: boolean;
  onDismiss: (permanent: boolean) => void;
}

export function useHeadphoneWarning() {
  const [isOpen, setIsOpen] = useState(false);

  const showIfNeeded = useCallback((): boolean => {
    if (shouldShowWarning()) {
      setIsOpen(true);
      return true;
    }
    return false;
  }, []);

  const dismiss = useCallback((permanent: boolean) => {
    setIsOpen(false);
    localStorage.setItem(LS_DISMISSED, String(Date.now()));
    if (permanent) {
      localStorage.setItem(LS_PERMANENT, 'true');
    }
  }, []);

  return { isOpen, showIfNeeded, dismiss };
}

export default function HeadphoneWarning({ isOpen, onDismiss }: HeadphoneWarningProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleDismiss = useCallback(() => {
    onDismiss(dontShowAgain);
  }, [onDismiss, dontShowAgain]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
          onClick={handleDismiss}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md mx-4 mb-4 rounded-2xl px-6 py-8 text-center"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Headphone icon */}
            <div className="flex justify-center mb-4">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--text-secondary)', opacity: 0.7 }}
              >
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>

            <h3
              className="font-[family-name:var(--font-playfair)] text-lg mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Headphones recommended
            </h3>

            <p
              className="font-[family-name:var(--font-inter)] text-[13px] leading-relaxed mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              Binaural beats work by sending slightly different frequencies to each ear. For the full effect, use headphones or earbuds.
            </p>

            <p
              className="font-[family-name:var(--font-inter)] text-[11px] leading-relaxed mb-6"
              style={{ color: 'var(--text-muted)', opacity: 0.7 }}
            >
              {"Without headphones, you\u2019ll still enjoy the ambient sounds and tones, but the binaural beat effect requires isolated left/right audio channels."}
            </p>

            {/* Got it button */}
            <button
              onClick={handleDismiss}
              className="w-full max-w-[200px] py-2.5 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-primary)',
              }}
            >
              Got it
            </button>

            {/* Don't show again */}
            <label
              className="flex items-center justify-center gap-2 mt-4 cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-white/40"
              />
              <span className="text-[11px] font-[family-name:var(--font-inter)]">
                {"Don't show again"}
              </span>
            </label>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
