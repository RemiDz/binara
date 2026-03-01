'use client';

import { useAppState, useAppDispatch } from '@/context/AppContext';
import { CATEGORIES } from '@/lib/constants';
import type { PresetCategory } from '@/types';

const SHORT_LABELS: Partial<Record<PresetCategory, string>> = {
  relaxation: 'Relax',
};

export default function CategoryFilter() {
  const { selectedCategory } = useAppState();
  const dispatch = useAppDispatch();

  const handleSelect = (category: PresetCategory | 'all' | 'favourites') => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
  };

  const allCategories: { id: PresetCategory | 'all' | 'favourites'; label: string }[] = [
    { id: 'favourites', label: '\u2661' },
    { id: 'all', label: 'All' },
    ...CATEGORIES.map((c) => ({
      id: c.id,
      label: SHORT_LABELS[c.id] || c.label,
    })),
  ];

  return (
    <div className="px-4 py-3">
      <div className="max-w-5xl mx-auto">
        <div
          role="tablist"
          aria-label="Preset category"
          className="flex gap-1 overflow-x-auto no-scrollbar"
          style={{
            padding: 4,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {allCategories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelect(cat.id)}
                className="flex-shrink-0 font-[family-name:var(--font-inter)] whitespace-nowrap"
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? 500 : 400,
                  letterSpacing: '0.04em',
                  color: isActive ? 'rgba(240,237,230,0.9)' : 'rgba(255,255,255,0.35)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))'
                    : 'transparent',
                  border: isActive
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid transparent',
                  borderRadius: 10,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
