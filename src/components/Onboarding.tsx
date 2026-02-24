'use client';

import { useState } from 'react';
import { useAppDispatch } from '@/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { trackEvent } from '@/lib/analytics';

interface OnboardingProps {
  onComplete: () => Promise<void>;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [screen, setScreen] = useState(1);
  const dispatch = useAppDispatch();

  const completeOnboarding = async () => {
    await onComplete();
    localStorage.setItem('binara_onboarding_complete', 'true');
    dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
    trackEvent('Onboarding Complete');
  };

  const handleScreen1Continue = async () => {
    await onComplete(); // Init AudioContext on user gesture
    setScreen(2);
  };

  const handleScreen1Skip = async () => {
    await onComplete();
    setScreen(2);
  };

  const handleModeSelect = async (mode: string) => {
    if (mode !== 'listen') {
      dispatch({ type: 'SET_TOAST', payload: 'Coming soon' });
    }
    dispatch({ type: 'SET_MODE', payload: 'listen' });
    await completeOnboarding();
  };

  return (
    <div className="relative z-10 min-h-dvh flex items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {screen === 1 && (
          <motion.div
            key="screen1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-8 max-w-sm"
          >
            <h1
              className="font-[family-name:var(--font-playfair)] text-2xl tracking-[0.15em] uppercase"
              style={{ color: 'var(--text-primary)' }}
            >
              B I N A R A
            </h1>

            <div className="text-5xl animate-pulse">{"🎧"}</div>

            <div className="space-y-2">
              <h2
                className="font-[family-name:var(--font-inter)] text-lg font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Headphones Required
              </h2>
              <p
                className="font-[family-name:var(--font-inter)] text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Binaural beats work by sending a slightly different frequency to each ear.
                Your brain perceives the difference as a gentle beat that can influence your mental state.
              </p>
              <p
                className="font-[family-name:var(--font-inter)] text-sm pt-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                For the full effect, please use headphones.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleScreen1Continue}
                className="w-full py-3 rounded-full text-sm font-[family-name:var(--font-inter)] font-medium transition-all active:scale-[0.98]"
                style={{
                  background: 'rgba(79, 195, 247, 0.15)',
                  border: '1px solid rgba(79, 195, 247, 0.3)',
                  color: '#4fc3f7',
                }}
              >
                {"I'm wearing headphones →"}
              </button>
              <button
                onClick={handleScreen1Skip}
                className="text-xs font-[family-name:var(--font-inter)]"
                style={{ color: 'var(--text-muted)' }}
              >
                skip
              </button>
            </div>
          </motion.div>
        )}

        {screen === 2 && (
          <motion.div
            key="screen2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 max-w-sm w-full"
          >
            <h2
              className="font-[family-name:var(--font-inter)] text-lg font-medium text-center"
              style={{ color: 'var(--text-primary)' }}
            >
              Choose your experience:
            </h2>

            <div className="space-y-3">
              {/* Listen */}
              <button
                onClick={() => handleModeSelect('listen')}
                className="w-full p-4 rounded-xl text-left transition-all active:scale-[0.98]"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid rgba(79, 195, 247, 0.2)',
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{"🎵"}</span>
                  <div>
                    <p className="font-[family-name:var(--font-inter)] font-medium text-sm" style={{ color: '#4fc3f7' }}>
                      Listen
                    </p>
                    <p className="font-[family-name:var(--font-inter)] text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      Tap a preset and relax
                    </p>
                  </div>
                </div>
              </button>

              {/* Mix */}
              <button
                onClick={() => handleModeSelect('mix')}
                className="w-full p-4 rounded-xl text-left transition-all active:scale-[0.98] relative"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid rgba(255, 171, 64, 0.15)',
                  opacity: 0.7,
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{"🎛️"}</span>
                  <div>
                    <p className="font-[family-name:var(--font-inter)] font-medium text-sm" style={{ color: '#ffab40' }}>
                      Mix
                      <span className="ml-2 text-[9px] font-[family-name:var(--font-jetbrains)] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,171,64,0.15)', color: '#ffab40' }}>
                        Coming soon
                      </span>
                    </p>
                    <p className="font-[family-name:var(--font-inter)] text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      Build your own session from blocks
                    </p>
                  </div>
                </div>
              </button>

              {/* Create */}
              <button
                onClick={() => handleModeSelect('create')}
                className="w-full p-4 rounded-xl text-left transition-all active:scale-[0.98] relative"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid rgba(121, 134, 203, 0.15)',
                  opacity: 0.7,
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{"⚡"}</span>
                  <div>
                    <p className="font-[family-name:var(--font-inter)] font-medium text-sm" style={{ color: '#7986cb' }}>
                      Create
                      <span className="ml-2 text-[9px] font-[family-name:var(--font-jetbrains)] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(121,134,203,0.15)', color: '#7986cb' }}>
                        Coming soon
                      </span>
                    </p>
                    <p className="font-[family-name:var(--font-inter)] text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      Full control over every parameter
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <p
              className="text-center font-[family-name:var(--font-inter)] text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              You can switch anytime
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
