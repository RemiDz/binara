'use client';

import { useEffect } from 'react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { AnimatePresence, motion } from 'motion/react';

export default function Toast() {
  const { toastMessage } = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_TOAST', payload: null });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, dispatch]);

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 glass px-4 py-2 rounded-full"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span className="text-sm font-[family-name:var(--font-inter)]">{toastMessage}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
