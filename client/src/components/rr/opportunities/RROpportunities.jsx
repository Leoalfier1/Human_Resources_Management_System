import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Calendar, ArrowRight, X, Star, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE } from '../../../utils/api';
import CategoryFilterPills from '../../shared/CategoryFilterPills';

const token = () => localStorage.getItem('token');
const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

const CATEGORY_LABELS = {
    teaching: 'Teaching',
    teaching_related: 'Teaching-Related',
    non_teaching: 'Non-Teaching',
};

const CATEGORY_COLORS = {
    teaching: 'bg-blue-50 text-blue-700 border-blue-200',
    teaching_related: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    non_teaching: 'bg-purple-50 text-purple-700 border-purple-200',
};

const AWARD_ICONS = [Trophy, Award, Star, Sparkles];

const Skeleton = () => (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="h-56 bg-slate-200 rounded-[2.5rem] animate-pulse" />
        <div className="flex gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-9 w-28 bg-slate-200 rounded-lg animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-52 bg-slate-200 rounded-[2.5rem] animate-pulse" />)}
        </div>
    </div>
);

const HeroBanner = ({ cycleInfo, onLearnMore }) => {
    const yearLabel = cycleInfo?.year || new Date().getFullYear();
    const isOpen = cycleInfo?.is_open;
    const statusText = cycleInfo?.status_text || 'Checking cycle status...';

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-[#1B3A6B] rounded-[2.5rem] p-10 overflow-hidden"
        >
            {/* Decorative circles */}
            <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/[0.04]" />
            <div className="absolute -right-8 top-8 w-56 h-56 rounded-full bg-white/[0.06]" />
            <div className="absolute right-20 -bottom-12 w-40 h-40 rounded-full bg-white/[0.03]" />

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-amber-500/20 p-1.5 rounded-lg">
                        <Trophy size={16} className="text-amber-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                        PRAISE {yearLabel}
                    </span>
                    {isOpen !== undefined && (
                        <span className={`ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/50'
                        }`}>
                            {isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                    )}
                </div>

                <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                    Rewards & Recognition
                </h1>
                <p className="text-blue-200 text-sm font-semibold leading-relaxed max-w-xl">
                    Program for Rewards and Incentives for Service Excellence.
                </p>
                <p className="text-blue-300/70 text-xs mt-1">
                    {statusText}{yearLabel ? ` for the ${yearLabel} cycle.` : ''}
                </p>

                <div className="flex items-center gap-3 mt-6">
                    <button
                        onClick={onLearnMore}
                        className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/30 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors"
                    >
                        Learn About PRAISE
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const NominationCallCard = ({ call, index }) => {
    const navigate = useNavigate();
    const Icon = AWARD_ICONS[index % AWARD_ICONS.length];
    const daysLeft = call.days_remaining || 0;
    const closesDate = call.nomination_closes
        ? new Date(call.nomination_closes).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="bg-amber-50 p-3 rounded-2xl">
                    <Icon size={22} className="text-amber-500" />
                </div>
                {daysLeft > 0 && (
                    <span className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                        {daysLeft} LEFT
                    </span>
                )}
                {daysLeft <= 0 && (
                    <span className="bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                        CLOSING SOON
                    </span>
                )}
            </div>

            <h3 className="text-base font-black text-[#1B3A6B] leading-tight mb-2">
                {call.award_type_name}
            </h3>

            <span className={`inline-block text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border mb-3 self-start ${CATEGORY_COLORS[call.eligible_category] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {CATEGORY_LABELS[call.eligible_category] || call.eligible_category}
            </span>

            <p className="text-xs text-slate-500 leading-relaxed flex-1 line-clamp-3">
                {call.criteria_summary || 'No description available for this award.'}
            </p>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar size={13} />
                    <span className="text-[10px] font-semibold">
                        Closes {closesDate}
                    </span>
                </div>
                <button
                    onClick={() => navigate(`/jobs/rr-opportunities/${call.id}/nominate`)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#D6402F] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#c1361f] transition-colors shadow-sm"
                >
                    Submit Nomination
                    <ArrowRight size={12} />
                </button>
            </div>
        </motion.div>
    );
};

const LearnAboutPraiseModal = ({ isOpen, onClose }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.25 }}
                    className="relative bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X size={18} className="text-slate-400" />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-amber-500 p-2.5 rounded-xl">
                            <Trophy size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-[#1B3A6B] uppercase">About PRAISE</h2>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Program Overview</p>
                        </div>
                    </div>

                    <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                        <p>
                            <strong className="text-[#1B3A6B]">PRAISE</strong> — <em>Program for Rewards and Incentives for Service Excellence</em> — is the
                            Division's formal recognition system for outstanding employees who demonstrate exceptional performance,
                            dedication, and commitment to service.
                        </p>
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1B3A6B] mb-2">Award Categories</h4>
                            <ul className="space-y-1.5 text-xs">
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-500 mt-0.5"><Trophy size={12} /></span>
                                    <span><strong>Outstanding Teacher of the Year</strong> — Recognizes exemplary teaching performance and contributions to student success.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-500 mt-0.5"><Award size={12} /></span>
                                    <span><strong>Outstanding Non-Teaching Personnel</strong> — Honors exceptional administrative and support staff performance.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-500 mt-0.5"><Star size={12} /></span>
                                    <span><strong>Service & Loyalty Awards</strong> — Recognizes years of dedicated service to the Division.</span>
                                </li>
                            </ul>
                        </div>
                        <p>
                            Nominations are open to all qualified personnel. The PRAISE Committee reviews all submissions,
                            conducts validation interviews, and deliberates on the final awardees who exemplify the values of
                            the DepEd Schools Division Office of Dapitan City.
                        </p>
                        <div className="bg-[#1B3A6B]/5 rounded-2xl p-5 border border-[#1B3A6B]/10">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1B3A6B] mb-2">Nomination Process</h4>
                            <ol className="space-y-1 text-xs list-decimal list-inside">
                                <li>Browse open calls and select an award category</li>
                                <li>Submit your nomination with supporting documents</li>
                                <li>Preliminary evaluation by the PRAISE Committee</li>
                                <li>Validation interview for shortlisted nominees</li>
                                <li>Deliberation and finalization of awardees</li>
                                <li>Announcement and awarding ceremony</li>
                            </ol>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="mt-6 w-full py-3 bg-[#1B3A6B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#152d55] transition-colors"
                    >
                        Got It
                    </button>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

const RROpportunities = () => {
    const { user } = useAuth();
    const [calls, setCalls] = useState([]);
    const [cycleInfo, setCycleInfo] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [showPraiseModal, setShowPraiseModal] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [oppRes, cycleRes] = await Promise.all([
                fetch(`${API_BASE}/api/rr/opportunities?category=${categoryFilter}`, { headers: authHeaders() }),
                fetch(`${API_BASE}/api/rr/opportunities/cycle-info`, { headers: authHeaders() }),
            ]);
            if (oppRes.ok) setCalls(await oppRes.json());
            if (cycleRes.ok) setCycleInfo(await cycleRes.json());
        } catch (e) {
            console.error('Failed to load opportunities:', e);
        } finally {
            setLoading(false);
        }
    }, [categoryFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return <Skeleton />;

    return (
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
            <HeroBanner cycleInfo={cycleInfo} onLearnMore={() => setShowPraiseModal(true)} />

            <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1B3A6B]">
                    Open Calls for Nominees
                </h2>
                <CategoryFilterPills
                    categoryFilter={categoryFilter}
                    onFilterChange={setCategoryFilter}
                />
            </div>

            {calls.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 shadow-sm"
                >
                    <Clock size={44} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                        No Open Calls
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                        There are currently no open nomination calls{categoryFilter !== 'all' ? ` for the ${CATEGORY_LABELS[categoryFilter]} category` : ''}.
                        Check back later or browse other categories.
                    </p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {calls.map((call, i) => (
                        <NominationCallCard key={call.id} call={call} index={i} />
                    ))}
                </div>
            )}

            <LearnAboutPraiseModal isOpen={showPraiseModal} onClose={() => setShowPraiseModal(false)} />
        </div>
    );
};

export default RROpportunities;
