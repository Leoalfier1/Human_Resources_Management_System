import React from 'react';

const DEFAULT_OPTIONS = [
    { value: 'all', label: 'ALL' },
    { value: 'teaching', label: 'TEACHING' },
    { value: 'teaching_related', label: 'TEACHING-RELATED' },
    { value: 'non_teaching', label: 'NON-TEACHING' }
];

const CategoryFilterPills = ({ categoryFilter, onFilterChange, options = DEFAULT_OPTIONS }) => {
    return (
        <div className="flex gap-1.5">
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onFilterChange(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        categoryFilter === opt.value
                            ? 'bg-[#D6402F] text-white shadow-sm'
                            : 'border border-[#1B3A6B] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
};

export default CategoryFilterPills;
