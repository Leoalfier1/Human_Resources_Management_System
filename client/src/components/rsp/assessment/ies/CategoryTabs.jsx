import React from 'react';

const CATEGORIES = [
    { key: 'teaching', label: 'Teaching' },
    { key: 'teaching_related', label: 'Teaching-Related' },
    { key: 'non_teaching', label: 'Non-Teaching' },
];

const CategoryTabs = ({ activeCategory, onSelect }) => (
    <div className="flex gap-2">
        {CATEGORIES.map(cat => (
            <button
                key={cat.key}
                onClick={() => onSelect(cat.key)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                    activeCategory === cat.key
                        ? 'bg-[#D6402F] text-white shadow-md'
                        : 'border border-[#1B3A6B]/30 text-[#1B3A6B] hover:bg-[#1B3A6B]/5'
                }`}
            >
                {cat.label}
            </button>
        ))}
    </div>
);

export default CategoryTabs;
