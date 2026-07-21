import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Layers, Zap } from 'lucide-react';
import StatusStepper from './StatusStepper';
import CategoryFilterPills from './CategoryFilterPills';
import RankingListItem from './RankingListItem';
import StatCards from './StatCards';
import StatusBadge, { VARIANT_CONFIG } from './StatusBadge';

const PropsStrip = ({ children }) => (
    <div className="mt-4 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
        <code className="text-[10px] font-mono text-slate-500 leading-relaxed whitespace-pre-wrap">
            {children}
        </code>
    </div>
);

const SectionCard = ({ title, description, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100"
    >
        <h2 className="text-sm font-black uppercase tracking-widest text-[#1B3A6B] mb-1">
            {title}
        </h2>
        {description && (
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">
                {description}
            </p>
        )}
        {children}
    </motion.div>
);

const SharedComponentLibrary = () => {
    const [activeCategory, setActiveCategory] = useState('teaching');

    return (
        <div className="space-y-6">
            {/* TOP HEADER BAR */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1B3A6B] rounded-[2.5rem] p-8 flex items-center justify-between"
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/10 p-2 rounded-xl">
                            <Layers size={20} className="text-white" />
                        </div>
                        <h1 className="text-xl font-black uppercase tracking-tight text-white">
                            SHARED COMPONENT LIBRARY
                        </h1>
                    </div>
                    <p className="text-[11px] text-blue-200 font-bold uppercase tracking-widest ml-11">
                        Reusable UI patterns for R&R and future modules
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-white/80" />
                    <div className="w-2 h-2 rounded-full bg-white/40" />
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                </div>
            </motion.div>

            {/* SECTION: STEPPER COMPONENT */}
            <SectionCard
                title="Stepper Component"
                description="PRAISE cycle progress tracker. Reuse for RSP, L&D, Performance Management status flows."
            >
                <div className="bg-slate-50 rounded-2xl p-6">
                    <StatusStepper
                        steps={[
                            { key: 'draft',       label: 'Draft',       number: 1 },
                            { key: 'submitted',   label: 'Submitted',   number: 2 },
                            { key: 'validation',  label: 'Validation',  number: 3 },
                            { key: 'deliberation',label: 'Deliberation',number: 4 },
                            { key: 'announcement',label: 'Announcement',number: 5 },
                            { key: 'results',     label: 'Results',     number: 6 },
                        ]}
                        currentStep={2}
                        activeColor="#D6402F"
                    />
                </div>
                <PropsStrip>{`Props: steps=[], currentStep, completedSteps=[], activeColor='#D6402F'`}</PropsStrip>
            </SectionCard>

            {/* SECTION: CATEGORY PILL FILTER */}
            <SectionCard
                title="Category Pill Filter"
                description="Personnel category filter. Active = solid red-orange, inactive = navy outline."
            >
                <div className="flex items-center justify-between">
                    <CategoryFilterPills
                        categoryFilter={activeCategory}
                        onFilterChange={setActiveCategory}
                    />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Active: {activeCategory}
                    </span>
                </div>
                <PropsStrip>{`Props: options=[], activeValue, onChange\nuseCase: Call for Nominees, IES, Comparative Assessment screens`}</PropsStrip>
            </SectionCard>

            {/* SECTION: RANKING / LEADERBOARD LIST ITEM */}
            <SectionCard
                title="Ranking / Leaderboard List Item"
                description="Used in Deliberation & Finalization. Rank badge varies by position."
            >
                <div className="space-y-3">
                    <RankingListItem
                        rank={1}
                        name="Ma. Cristina Valdez"
                        subtitle="Outstanding Teacher · Teaching"
                        score="92.4"
                        voteStatus="approve"
                        isTopRank
                    />
                    <RankingListItem
                        rank={2}
                        name="Carlos Mendoza"
                        subtitle="Outstanding Teacher · Teaching"
                        score="87.1"
                        voteStatus="approve"
                    />
                    <RankingListItem
                        rank={3}
                        name="Elona Bautista"
                        subtitle="Excellent Performance · Non-Teaching"
                        score="81.2"
                        voteStatus="hold"
                    />
                </div>
                <PropsStrip>{`Props: rank, name, subtitle, score, voteStatus, isTopRank`}</PropsStrip>
            </SectionCard>

            {/* SECTION: STAT CARDS */}
            <SectionCard
                title="Stat Cards"
                description="Used at top of summary screens. 3-4 across in a grid layout."
            >
                <StatCards
                    columns={4}
                    cards={[
                        {
                            label: 'TOTAL NOMINEES',
                            value: 12,
                            caption: 'This cycle',
                            color: 'text-[#1B3A6B]'
                        },
                        {
                            label: 'AWARDEES',
                            value: 4,
                            caption: '',
                            color: 'text-[#1B3A6B]'
                        },
                        {
                            label: 'PARTICIPATION',
                            value: '68%',
                            caption: 'of eligible staff',
                            color: 'text-[#D6402F]'
                        },
                        {
                            label: 'AVG SCORE',
                            value: 89.1,
                            caption: 'Out of 100',
                            color: 'text-[#1B3A6B]'
                        },
                    ]}
                />
                <PropsStrip>{`Props: label, value, caption, accentColor`}</PropsStrip>
            </SectionCard>

            {/* SECTION: STATUS BADGE SYSTEM */}
            <SectionCard
                title="Status Badge System"
                description="Centralized badge component. Each variant maps to a consistent color/label."
            >
                <div className="space-y-4">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Workflow</p>
                        <div className="flex flex-wrap gap-2">
                            {['draft', 'pending', 'in_progress', 'submitted', 'completed', 'published'].map(key => (
                                <StatusBadge key={key} variant={key} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Decision</p>
                        <div className="flex flex-wrap gap-2">
                            {['approved', 'rejected', 'needs_action'].map(key => (
                                <StatusBadge key={key} variant={key} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">R&R</p>
                        <div className="flex flex-wrap gap-2">
                            {['awarded', 'pending_review'].map(key => (
                                <StatusBadge key={key} variant={key} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Evaluation</p>
                        <div className="flex flex-wrap gap-2">
                            {['under_evaluation', 'qualified', 'disqualified', 'shortlisted', 'selected', 'appointed'].map(key => (
                                <StatusBadge key={key} variant={key} />
                            ))}
                        </div>
                    </div>
                </div>
                <PropsStrip>{`Props: variant, status (alias), label (override)\nVariants: ${Object.keys(VARIANT_CONFIG).join(', ')}`}</PropsStrip>
            </SectionCard>
        </div>
    );
};

export default SharedComponentLibrary;
