'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { checkProOnLoad, activatePro, clearPro, isPro as checkIsPro } from '@/lib/pro';

interface ProContextValue {
  isPro: boolean;
  isLoading: boolean;
  activate: (key: string) => Promise<{ success: boolean; error?: string }>;
  deactivate: () => void;
}

const ProContext = createContext<ProContextValue>({
  isPro: false,
  isLoading: true,
  activate: async () => ({ success: false }),
  deactivate: () => {},
});

export function ProProvider({ children }: { children: ReactNode }) {
  const [pro, setPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkProOnLoad().then((active) => {
      setPro(active);
      setIsLoading(false);
    }).catch(() => {
      setPro(false);
      setIsLoading(false);
    });
  }, []);

  const activate = useCallback(async (key: string) => {
    const result = await activatePro(key);
    if (result.success) {
      setPro(true);
    }
    return result;
  }, []);

  const deactivate = useCallback(() => {
    clearPro();
    setPro(false);
  }, []);

  // Also sync with localStorage on focus (in case another tab changed it)
  useEffect(() => {
    const handleFocus = () => {
      setPro(checkIsPro());
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <ProContext.Provider value={{ isPro: pro, isLoading, activate, deactivate }}>
      {children}
    </ProContext.Provider>
  );
}

export function useProContext() {
  return useContext(ProContext);
}
