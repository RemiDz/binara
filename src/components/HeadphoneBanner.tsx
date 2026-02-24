'use client';

import { useHeadphoneDetection } from '@/hooks/useHeadphoneDetection';
import { AnimatePresence, motion } from 'motion/react';

export default function HeadphoneBanner() {
  const { headphonesConnected, dismissed, dismiss } = useHeadphoneDetection();

  // Show banner if headphones not connected (false) or unknown (null, show once)
  const shouldShow = !dismissed && headphonesConnected !== true;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="px-4 overflow-hidden"
        >
          <div className="max-w-5xl mx-auto">
            <div
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-[family-name:var(--font-inter)]"
              style={{
                background: 'rgba(255, 171, 64, 0.08)',
                border: '1px solid rgba(255, 171, 64, 0.2)',
                color: '#ffab40',
              }}
            >
              <span>{"🎧 Headphones recommended for binaural beats to work"}</span>
              <button
                onClick={dismiss}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full transition-colors hover:bg-white/5"
                aria-label="Dismiss"
              >
                {"✕"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
