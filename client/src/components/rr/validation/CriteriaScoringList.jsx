import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

const CriteriaScoringList = ({ criteria, onScoreChange }) => {
    return (
        <div className="space-y-2">
            {criteria.map((criterion, idx) => (
                <CriterionRow
                    key={criterion.id}
                    criterion={criterion}
                    index={idx}
                    onScoreChange={onScoreChange}
                />
            ))}
        </div>
    );
};

const CriterionRow = ({ criterion, index, onScoreChange }) => {
    const [localValue, setLocalValue] = useState(
        criterion.raw_score !== null && criterion.raw_score !== undefined
            ? String(criterion.raw_score)
            : ''
    );
    const debounceRef = useRef(null);

    const handleChange = useCallback((e) => {
        const val = e.target.value;
        setLocalValue(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const num = val === '' ? null : parseFloat(val);
            if (val !== '' && (isNaN(num) || num < 0 || num > criterion.max_raw_score)) return;
            onScoreChange(criterion.id, num);
        }, 400);
    }, [criterion.id, criterion.max_raw_score, onScoreChange]);

    const displayContribution = criterion.raw_score !== null && criterion.raw_score !== undefined
        ? ((criterion.raw_score / criterion.max_raw_score) * criterion.weight_percent).toFixed(1)
        : '0.0';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-white transition-all"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1B3A6B] truncate">
                        {criterion.criterion_label}
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#1B3A6B] text-white whitespace-nowrap">
                        {criterion.weight_percent}%
                    </span>
                </div>
            </div>
            <div className="text-[10px] text-slate-400 font-bold tabular-nums whitespace-nowrap">
                {displayContribution}
            </div>
            <input
                type="number"
                min={0}
                max={criterion.max_raw_score}
                step={0.5}
                value={localValue}
                onChange={handleChange}
                placeholder="—"
                className="w-16 h-8 text-center text-xs font-bold border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20 tabular-nums placeholder:text-slate-300"
            />
        </motion.div>
    );
};

export default CriteriaScoringList;
