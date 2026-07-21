import React, { useState, useRef, useCallback } from 'react';

const InterviewNotesCard = ({ notes, onNotesChange }) => {
    const [localNotes, setLocalNotes] = useState(notes || '');
    const debounceRef = useRef(null);

    const handleChange = useCallback((e) => {
        const val = e.target.value;
        setLocalNotes(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onNotesChange(val);
        }, 800);
    }, [onNotesChange]);

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
                INTERVIEW NOTES
            </p>
            <textarea
                value={localNotes}
                onChange={handleChange}
                rows={5}
                placeholder="Record interview observations, highlights, and concerns here..."
                className="w-full text-xs text-slate-700 font-medium leading-relaxed border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20 placeholder:text-slate-300"
            />
        </div>
    );
};

export default InterviewNotesCard;
