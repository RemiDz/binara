'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PanelProps {
  title: string;
  subtitle?: string;
  isPro?: boolean;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export default function Panel({ title, subtitle, isPro = false, defaultExpanded = false, children }: PanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <div>
            <span
              className="font-[family-name:var(--font-inter)] text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {title}
            </span>
            {subtitle && (
              <span
                className="font-[family-name:var(--font-inter)] text-xs ml-2"
                style={{ color: 'var(--text-muted)' }}
              >
                {subtitle}
              </span>
            )}
          </div>
          {isPro && (
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider"
              style={{
                background: 'rgba(121, 134, 203, 0.15)',
                color: '#7986cb',
                border: '1px solid rgba(121, 134, 203, 0.25)',
              }}
            >
              Pro
            </span>
          )}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200"
          style={{
            color: 'var(--text-muted)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
