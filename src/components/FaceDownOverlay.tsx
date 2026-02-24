'use client';

import { AnimatePresence, motion } from 'motion/react';

interface FaceDownOverlayProps {
  isActive: boolean;
}

export default function FaceDownOverlay({ isActive }: FaceDownOverlayProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-end justify-center pb-16"
          style={{ background: 'black' }}
        >
          <p
            className="font-[family-name:var(--font-inter)] text-xs text-center pointer-events-none"
            style={{ color: 'rgba(255, 255, 255, 0.15)' }}
          >
            Phone face-down {"·"} Session active {"·"} Lift to interact
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
