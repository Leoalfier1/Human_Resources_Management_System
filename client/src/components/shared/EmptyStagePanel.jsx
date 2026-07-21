import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Reusable empty-state panel for RSP pipeline screens.
 *
 * Props:
 *   icon        – Lucide icon component (e.g. Users, BarChart3, AlertCircle)
 *   title       – Short heading (e.g. "No Selected Applicants")
 *   message     – Descriptive body text
 *   actionLabel – Button label (e.g. "Go to Congratulatory Advice")
 *   onAction    – Click handler for the action button
 */
const EmptyStagePanel = ({ icon: Icon, title, message, actionLabel, onAction }) => (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center shadow-sm">
        <div className="inline-flex flex-col items-center gap-4 max-w-md">
            {Icon && (
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                    <Icon size={28} className="text-slate-300" />
                </div>
            )}
            <div>
                <h3 className="text-sm font-black text-slate-600 uppercase">{title}</h3>
                <p className="text-[11px] font-bold text-slate-400 mt-2 leading-relaxed">
                    {message}
                </p>
            </div>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B3A6B] hover:bg-[#152d54] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm"
                >
                    {actionLabel}
                    <ArrowRight size={14} />
                </button>
            )}
        </div>
    </div>
);

export default EmptyStagePanel;
