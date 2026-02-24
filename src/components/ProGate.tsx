'use client';

import type { ReactNode } from 'react';
import { useProContext } from '@/context/ProContext';

interface ProGateProps {
  feature: string;
  isPro?: boolean; // Optional override — if provided, uses prop; otherwise reads context
  children: ReactNode;
  onUpgrade?: () => void;
}

export default function ProGate({ feature, isPro: isProProp, children, onUpgrade }: ProGateProps) {
  const { isPro: isProContext } = useProContext();
  const isPro = isProProp !== undefined ? isProProp : isProContext;

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div
          className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#7986cb' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span
            className="font-[family-name:var(--font-inter)] text-xs font-medium"
            style={{ color: '#7986cb' }}
          >
            {feature}
          </span>
          {onUpgrade ? (
            <button
              onClick={onUpgrade}
              className="font-[family-name:var(--font-inter)] text-[10px] font-medium px-3 py-1 rounded-full transition-all active:scale-[0.97]"
              style={{
                background: 'rgba(121, 134, 203, 0.15)',
                border: '1px solid rgba(121, 134, 203, 0.3)',
                color: '#7986cb',
              }}
            >
              Upgrade to Pro
            </button>
          ) : (
            <span
              className="font-[family-name:var(--font-jetbrains)] text-[9px]"
              style={{ color: 'var(--text-muted)' }}
            >
              Pro feature
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
