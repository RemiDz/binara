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
    { id: 'favourites', label: '\u2665' },
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
                onClick={() => handleSelect(cat.id)}
                className="flex-shrink-0 font-[family-name:var(--font-inter)] whitespace-nowrap"
                style={{
                  fontSize: cat.id === 'favourites' ? 14 : 12,
                  fontWeight: isActive ? 500 : 400,
                  letterSpacing: '0.04em',
                  color: isActive
                    ? cat.id === 'favourites' ? '#ff6b8a' : 'rgba(240,237,230,0.9)'
                    : cat.id === 'favourites' ? 'rgba(255,107,138,0.4)' : 'rgba(255,255,255,0.35)',
                  background: isActive
                    ? cat.id === 'favourites'
                      ? 'linear-gradient(135deg, rgba(255,107,138,0.12), rgba(255,107,138,0.06))'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))'
                    : 'transparent',
                  border: isActive
                    ? cat.id === 'favourites'
                      ? '1px solid rgba(255,107,138,0.2)'
                      : '1px solid rgba(255,255,255,0.08)'
                    : '1px solid transparent',
                  borderRadius: 10,
                  padding: cat.id === 'favourites' ? '8px 12px' : '8px 16px',
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
