'use client';

import { useAppState, useAppDispatch } from '@/context/AppContext';
import { CATEGORIES } from '@/lib/constants';
import type { PresetCategory } from '@/types';

export default function CategoryFilter() {
  const { selectedCategory } = useAppState();
  const dispatch = useAppDispatch();

  const handleSelect = (category: PresetCategory | 'all') => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
  };

  const allCategories: { id: PresetCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  ];

  return (
    <div className="px-4 py-3">
      <div className="max-w-5xl mx-auto">
        <div
          className="flex gap-1 overflow-x-auto no-scrollbar"
          style={{
            padding: 3,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
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
                  fontSize: 12,
                  fontWeight: isActive ? 500 : 400,
                  letterSpacing: '0.03em',
                  color: isActive ? '#F0EDE6' : 'rgba(255,255,255,0.35)',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
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
