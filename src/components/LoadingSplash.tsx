'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface LoadingSplashProps {
  children: React.ReactNode;
}

export default function LoadingSplash({ children }: LoadingSplashProps) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show for minimum 500ms to avoid flash
    const timer = setTimeout(() => setShowSplash(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: '#050810' }}
          >
            <div className="text-center space-y-4">
              <h1
                className="font-[family-name:var(--font-playfair)] text-2xl tracking-[0.2em] uppercase"
                style={{ color: 'var(--text-primary)' }}
              >
                B I N A R A
              </h1>
              <div className="flex items-center justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 0.8, 0.2] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#4fc3f7' }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
