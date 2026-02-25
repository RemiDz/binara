'use client';

import { motion, AnimatePresence } from 'motion/react';

interface SensorUpsellProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const BENEFITS = [
  'Tilt to shift the spatial balance of your session',
  'Stay still and the sound rewards your stillness with harmonic overtones',
  'Gentle rocking creates a breathing-with-sound effect',
];

export default function SensorUpsell({ isOpen, onClose, onUpgrade }: SensorUpsellProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-3xl p-6 space-y-5"
            style={{
              background: 'linear-gradient(180deg, rgba(15, 18, 35, 0.98) 0%, rgba(8, 10, 22, 0.98) 100%)',
              border: '1px solid rgba(121, 134, 203, 0.15)',
              borderBottom: 'none',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* Header */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(121, 134, 203, 0.1)',
                  border: '1px solid rgba(121, 134, 203, 0.2)',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7986cb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
                  <line x1="12" y1="18" x2="12" y2="18.01" />
                </svg>
              </div>
              <h3
                className="font-[family-name:var(--font-playfair)] text-lg"
                style={{ color: 'var(--text-primary)' }}
              >
                Motion Sensors
              </h3>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              {BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7986cb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span
                    className="font-[family-name:var(--font-inter)] text-sm leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            {/* Upgrade button */}
            <button
              onClick={onUpgrade}
              className="w-full py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium text-center transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(121, 134, 203, 0.3) 0%, rgba(79, 195, 247, 0.2) 100%)',
                border: '1px solid rgba(121, 134, 203, 0.4)',
                color: '#b0bec5',
              }}
            >
              Upgrade to PRO
            </button>

            {/* Restore link */}
            <button
              onClick={onClose}
              className="w-full text-center font-[family-name:var(--font-inter)] text-xs py-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
