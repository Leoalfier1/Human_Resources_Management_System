import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const STATUS_CONFIG = {
    pending:    { label: 'PENDING',    bg: 'bg-amber-100',    text: 'text-amber-700',    hover: 'hover:bg-amber-200' },
    printed:    { label: 'PRINTED',    bg: 'bg-[#1B3A6B]/10', text: 'text-[#1B3A6B]',    hover: 'hover:bg-[#1B3A6B]/20' },
    distributed:{ label: 'DISTRIBUTED', bg: 'bg-green-100',    text: 'text-green-700',    hover: 'hover:bg-green-200' }
};

const STATUS_ORDER = ['pending', 'printed', 'distributed'];

const StatusBadgeDropdown = ({ status, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${cfg.bg} ${cfg.text} ${cfg.hover}`}
            >
                {cfg.label}
                <ChevronDown size={10} />
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 min-w-[120px]">
                    {STATUS_ORDER.map(s => {
                        const c = STATUS_CONFIG[s];
                        return (
                            <button
                                key={s}
                                onClick={() => { onChange(s); setOpen(false); }}
                                className={`w-full text-left px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors
                                    ${s === status ? `${c.bg} ${c.text}` : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                {c.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StatusBadgeDropdown;
