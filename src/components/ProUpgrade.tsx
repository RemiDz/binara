'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProContext } from '@/context/ProContext';
import { LEMONSQUEEZY_CHECKOUT_URL } from '@/lib/pro';
import { trackEvent } from '@/lib/analytics';

interface ProUpgradeProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRO_FEATURES = [
  'Multi-layer beats (up to 4)',
  'Stereo field control',
  'LFO modulation',
  'Isochronic tones',
  'Phone sensor control',
  'Multi-phase timeline (up to 6)',
  'Export sessions to WAV',
  'Share sessions via URL',
  'Unlimited saved sessions',
  'Custom carrier frequencies',
  'Unlimited ambient layers',
];

export default function ProUpgrade({ isOpen, onClose }: ProUpgradeProps) {
  const { activate } = useProContext();
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [licenceKey, setLicenceKey] = useState('');
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    if (!licenceKey.trim()) return;
    setError('');
    setActivating(true);

    const result = await activate(licenceKey.trim());
    setActivating(false);

    if (result.success) {
      trackEvent('Pro Activated', { source: 'manual' });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset state after close animation
        setTimeout(() => {
          setSuccess(false);
          setShowKeyInput(false);
          setLicenceKey('');
        }, 300);
      }, 1500);
    } else {
      setError(result.error ?? 'Activation failed');
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setShowKeyInput(false);
      setLicenceKey('');
      setError('');
      setSuccess(false);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 space-y-5 max-h-[85dvh] overflow-y-auto"
            style={{
              background: 'linear-gradient(180deg, rgba(15, 18, 35, 0.98) 0%, rgba(8, 10, 22, 0.98) 100%)',
              border: '1px solid rgba(121, 134, 203, 0.15)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Close button */}
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {success ? (
              /* Success state */
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8 space-y-3"
              >
                <div className="text-4xl">{"✨"}</div>
                <h3
                  className="font-[family-name:var(--font-playfair)] text-xl"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Welcome to Pro!
                </h3>
                <p
                  className="font-[family-name:var(--font-inter)] text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  All features unlocked
                </p>
              </motion.div>
            ) : (
              <>
                {/* Header */}
                <div className="text-center space-y-2">
                  <h3
                    className="font-[family-name:var(--font-playfair)] text-xl"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Upgrade to Pro
                  </h3>
                  <p
                    className="font-[family-name:var(--font-inter)] text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Unlock the full Binara experience
                  </p>
                </div>

                {/* Feature checklist */}
                <div className="space-y-2">
                  {PRO_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7986cb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span
                        className="font-[family-name:var(--font-inter)] text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Purchase button */}
                <a
                  href={LEMONSQUEEZY_CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('Pro Upgrade Click', { source: 'progate' })}
                  className="block w-full py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium text-center transition-all active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(121, 134, 203, 0.3) 0%, rgba(79, 195, 247, 0.2) 100%)',
                    border: '1px solid rgba(121, 134, 203, 0.4)',
                    color: '#b0bec5',
                  }}
                >
                  {"Upgrade \u00b7 $7.99 one-time"}
                </a>

                {/* Licence key section */}
                <div className="pt-2">
                  {!showKeyInput ? (
                    <button
                      onClick={() => setShowKeyInput(true)}
                      className="w-full text-center font-[family-name:var(--font-inter)] text-xs py-2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Already have a licence key?
                    </button>
                  ) : (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="space-y-2"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={licenceKey}
                          onChange={(e) => { setLicenceKey(e.target.value); setError(''); }}
                          placeholder="Enter licence key..."
                          className="flex-1 px-3 py-2 rounded-xl text-xs font-[family-name:var(--font-jetbrains)] bg-transparent outline-none"
                          style={{
                            border: `1px solid ${error ? 'rgba(244, 67, 54, 0.4)' : 'var(--glass-border)'}`,
                            color: 'var(--text-primary)',
                          }}
                          autoFocus
                        />
                        <button
                          onClick={handleActivate}
                          disabled={activating || !licenceKey.trim()}
                          className="px-4 py-2 rounded-xl text-xs font-[family-name:var(--font-inter)] font-medium transition-all disabled:opacity-40"
                          style={{
                            background: 'rgba(121, 134, 203, 0.2)',
                            border: '1px solid rgba(121, 134, 203, 0.3)',
                            color: '#7986cb',
                          }}
                        >
                          {activating ? '...' : 'Go'}
                        </button>
                      </div>
                      {error && (
                        <p
                          className="font-[family-name:var(--font-inter)] text-[10px] px-1"
                          style={{ color: '#f44336' }}
                        >
                          {error}
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
