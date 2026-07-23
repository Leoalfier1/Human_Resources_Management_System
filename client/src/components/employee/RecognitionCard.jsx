import React from 'react';
import { Award, ExternalLink } from 'lucide-react';

const RecognitionCard = ({ ratingPeriodLabel, onRRRedirect }) => {
    return (
        <div className="bg-white border-2 border-blue-500 rounded-3xl p-6 shadow-sm flex items-start gap-4 select-none">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl shrink-0 shadow-sm">
                <Award size={24} />
            </div>
            <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Eligible for Performance-Based Incentives</h4>

                <button 
                    onClick={onRRRedirect}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1.5 pt-2 transition-colors cursor-pointer"
                >
                    <ExternalLink size={12} /> View R&R details
                </button>
            </div>
        </div>
    );
};

export default RecognitionCard;
