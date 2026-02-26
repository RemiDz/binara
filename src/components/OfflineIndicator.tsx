'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 text-center py-1"
          style={{
            paddingTop: 'calc(var(--safe-area-top) + 4px)',
            background: 'rgba(255, 171, 64, 0.1)',
            borderBottom: '1px solid rgba(255, 171, 64, 0.15)',
          }}
        >
          <span
            className="font-[family-name:var(--font-inter)] text-[11px]"
            style={{ color: 'rgba(255, 171, 64, 0.7)' }}
          >
            Offline mode
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
