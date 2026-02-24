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

  const allCategories: { id: PresetCategory | 'all'; label: string; icon?: string }[] = [
    { id: 'all', label: 'All' },
    ...CATEGORIES,
  ];

  return (
    <div className="px-4 py-3">
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
          {allCategories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.id)}
                className="flex-shrink-0 snap-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-[family-name:var(--font-inter)] font-medium transition-all whitespace-nowrap"
                style={{
                  background: isActive ? 'rgba(79, 195, 247, 0.1)' : 'var(--glass-bg)',
                  border: `1px solid ${isActive ? 'rgba(79, 195, 247, 0.3)' : 'var(--glass-border)'}`,
                  color: isActive ? '#4fc3f7' : 'var(--text-secondary)',
                }}
              >
                {cat.icon && <span>{cat.icon}</span>}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
