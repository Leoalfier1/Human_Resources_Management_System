import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Calendar, Send, Loader2 } from 'lucide-react';

const CATEGORIES = [
    { value: 'teaching', label: 'TEACHING' },
    { value: 'teaching_related', label: 'TEACHING-RELATED' },
    { value: 'non_teaching', label: 'NON-TEACHING' }
];

const NominationWindowConfigCard = ({ awardTypes, selectedCall, onNewCall, onPublishRequest }) => {
    const [awardTypeId, setAwardTypeId] = useState('');
    const [eligibleCategory, setEligibleCategory] = useState('');
    const [nominationOpens, setNominationOpens] = useState('');
    const [nominationCloses, setNominationCloses] = useState('');
    const [criteriaSummary, setCriteriaSummary] = useState('');

    useEffect(() => {
        if (selectedCall) {
            setAwardTypeId(selectedCall.award_type_id || '');
            setEligibleCategory(selectedCall.eligible_category || '');
            setNominationOpens(selectedCall.nomination_opens ? selectedCall.nomination_opens.slice(0, 10) : '');
            setNominationCloses(selectedCall.nomination_closes ? selectedCall.nomination_closes.slice(0, 10) : '');
            setCriteriaSummary(selectedCall.criteria_summary || '');
        } else {
            setAwardTypeId('');
            setEligibleCategory('');
            setNominationOpens('');
            setNominationCloses('');
            setCriteriaSummary('');
        }
    }, [selectedCall]);

    const formatDateVal = (d) => {
        if (!d) return '';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return '';
        const pad = n => String(n).padStart(2, '0');
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    };

    const handlePublish = () => {
        if (!awardTypeId) return alert('Please select an award category');
        if (!eligibleCategory) return alert('Please select an eligible personnel category');
        if (!nominationOpens) return alert('Please set the nomination opening date');
        if (!nominationCloses) return alert('Please set the nomination closing date');
        if (new Date(nominationCloses) < new Date(nominationOpens)) return alert('Closing date must be after opening date');

        onPublishRequest({
            awardTypeId: parseInt(awardTypeId),
            eligibleCategory,
            nominationOpens,
            nominationCloses,
            criteriaSummary
        });
    };

    const handleReset = () => {
        setAwardTypeId('');
        setEligibleCategory('');
        setNominationOpens('');
        setNominationCloses('');
        setCriteriaSummary('');
        onNewCall();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#1B3A6B]">
                    Nomination Window Configuration
                </h3>
                {selectedCall && (
                    <button
                        onClick={handleReset}
                        className="text-[9px] font-black uppercase tracking-widest text-[#D6402F] hover:text-[#c03525] transition-colors"
                    >
                        + New Call
                    </button>
                )}
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Award / Recognition Category
                    </label>
                    <div className="relative">
                        <select
                            value={awardTypeId}
                            onChange={(e) => setAwardTypeId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-[#1B3A6B] appearance-none focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-colors bg-white"
                        >
                            <option value="">Select award category...</option>
                            {awardTypes.map(at => (
                                <option key={at.id} value={at.id}>{at.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Eligible Personnel Category
                    </label>
                    <div className="flex gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.value}
                                onClick={() => setEligibleCategory(cat.value)}
                                className={`flex-1 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    eligibleCategory === cat.value
                                        ? 'bg-[#D6402F] text-white shadow-md'
                                        : 'border-2 border-[#1B3A6B] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                            Nomination Opens
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={nominationOpens}
                                onChange={(e) => setNominationOpens(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-[#1B3A6B] focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-colors"
                            />
                            <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                            Nomination Closes
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={nominationCloses}
                                onChange={(e) => setNominationCloses(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-[#1B3A6B] focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-colors"
                            />
                            <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Criteria Summary
                    </label>
                    <textarea
                        value={criteriaSummary}
                        onChange={(e) => setCriteriaSummary(e.target.value)}
                        placeholder="Briefly describe the eligibility criteria and required qualifications..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-[#1B3A6B] placeholder-slate-300 focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-colors resize-none"
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={handlePublish}
                        className="flex items-center gap-2 px-6 py-3 bg-[#D6402F] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#c03525] shadow-md transition-all"
                    >
                        <Send size={14} />
                        Publish Call for Nominees
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default NominationWindowConfigCard;
