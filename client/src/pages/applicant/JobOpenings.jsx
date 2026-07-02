import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Clock, Search, SlidersHorizontal, X,
    ChevronDown, BookOpen, GraduationCap, Building2
} from 'lucide-react';
import { API_BASE } from '../../utils/api';
import JobCard from '../../components/applicant/JobCard';

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, suffix = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5"
    >
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1B3A6B] flex items-center justify-center flex-shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-2xl font-black text-[#1B3A6B] leading-none">
                {value}<span className="text-sm font-bold text-slate-400 ml-1">{suffix}</span>
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
        </div>
    </motion.div>
);

// ─── FILTER DRAWER ────────────────────────────────────────────────────────────
const FilterDrawer = ({ open, onClose, filters, setFilters, schools }) => {
    const statuses = [
        { value: '', label: 'All' },
        { value: 'open', label: 'Open' },
        { value: 'closing_soon', label: 'Closing Soon' },
        { value: 'closed', label: 'Closed' },
    ];

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="font-black text-[#1B3A6B] uppercase tracking-tight text-sm">Filter Openings</h3>
                            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                                <X size={18} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Status Filter */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Status</label>
                                <div className="space-y-2">
                                    {statuses.map(s => (
                                        <button
                                            key={s.value}
                                            onClick={() => setFilters(f => ({ ...f, status: s.value }))}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all
                                                ${filters.status === s.value
                                                    ? 'bg-[#1B3A6B] text-white'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* School Filter */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">School / Station</label>
                                <div className="relative">
                                    <select
                                        value={filters.school}
                                        onChange={e => setFilters(f => ({ ...f, school: e.target.value }))}
                                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 pr-10 focus:ring-2 focus:ring-[#1B3A6B] outline-none"
                                    >
                                        <option value="">All Schools / Stations</option>
                                        {schools.map(s => (
                                            <option key={s.id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100">
                            <button
                                onClick={() => { setFilters({ status: '', school: '' }); onClose(); }}
                                className="w-full py-3 rounded-xl border-2 border-slate-200 text-sm font-black text-slate-500 hover:bg-slate-50 transition-all"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const JobOpenings = () => {
    const [jobs, setJobs] = useState([]);
    const [stats, setStats] = useState({
        openPositions: 0,
        totalVacancies: 0,
        daysRemaining: 10,
        applicantType: 'all'   // returned by the updated vacancyController
    });
    const [settings, setSettings] = useState({ office_name: '', region: '', contact_number: '' });
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ status: '', school: '' });
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);
    const debounceRef = useRef(null);

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    // Load settings once
    useEffect(() => {
        fetch(`${API_BASE}/api/vacancies/settings`)
            .then(r => r.json())
            .then(d => setSettings(d))
            .catch(() => {});
    }, []);

    // Load schools for filter drawer
    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${API_BASE}/api/vacancies?search=`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
            .then(r => r.json())
            .then(data => {
                const seen = new Set();
                const schoolList = [];
                (data.list || []).forEach(v => {
                    if (v.assigned_school && !seen.has(v.assigned_school)) {
                        seen.add(v.assigned_school);
                        schoolList.push({ id: v.id, name: v.assigned_school });
                    }
                });
                setSchools(schoolList);
            })
            .catch(() => {});
    }, []);

    // Fetch jobs with debounced search + filters
    // Always sends auth token so the backend can filter by applicant_type
    const fetchJobs = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (filters.status) params.set('status', filters.status);
        if (filters.school) params.set('school', filters.school);

        const token = localStorage.getItem('token');
        fetch(`${API_BASE}/api/vacancies?${params}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
            .then(r => r.json())
            .then(data => {
                setJobs(data.list || []);
                setStats(data.stats || { openPositions: 0, totalVacancies: 0, daysRemaining: 10, applicantType: 'all' });
            })
            .catch(() => setJobs([]))
            .finally(() => setLoading(false));
    }, [search, filters]);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(fetchJobs, 400);
        return () => clearTimeout(debounceRef.current);
    }, [fetchJobs]);

    // ── Derive hero content from applicantType ─────────────────────────────
    const isTeaching    = stats.applicantType === 'teaching';
    const isNonTeaching = stats.applicantType === 'non_teaching';

    const heroTitle = isNonTeaching
        ? 'Non-Teaching\nPosition Vacancies'
        : isTeaching
        ? 'Teaching Position\nVacancies'
        : 'Position\nVacancies';

    const heroIcon = isNonTeaching
        ? <Building2 size={18} className="text-sky-300" />
        : <GraduationCap size={18} className="text-amber-300" />;

    const heroBadgeClass = isNonTeaching
        ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
        : 'bg-amber-500/20 text-amber-200 border border-amber-400/30';

    const heroBadgeLabel = isNonTeaching
        ? 'Non-Teaching Positions'
        : isTeaching
        ? 'Teaching Positions'
        : 'All Positions';

    return (
        <div className="min-h-screen bg-[#F1F3F6] pb-24">

            {/* ── HERO BANNER ─────────────────────────────────────────── */}
            <div className="relative bg-gradient-to-br from-[#0d2347] via-[#1B3A6B] to-[#1e4a8a] text-white overflow-hidden">
                <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

                <div className="relative max-w-6xl mx-auto px-6 pt-14 pb-32 text-center">
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-300 uppercase mb-3">
                        PRIME-HRM COMPLIANT SYSTEM
                    </p>

                    {/* Position type badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-5 ${heroBadgeClass}`}>
                        {heroIcon}
                        {heroBadgeLabel}
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter uppercase mb-4 leading-tight whitespace-pre-line">
                        {heroTitle}
                    </h1>
                    <p className="text-sm font-bold text-blue-200 uppercase tracking-widest opacity-90">
                        {settings.office_name
                            ? `${settings.office_name} · ${settings.region}`
                            : 'Loading...'}
                    </p>
                </div>
            </div>

            {/* ── SEARCH + FILTER BAR ──────────────────────────────────── */}
            <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-10">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center gap-2 p-2">
                    <div className="flex-1 flex items-center gap-3 px-4">
                        <Search size={20} className="text-slate-300 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder={isNonTeaching
                                ? "Search administrative positions, stations..."
                                : "Search positions, subjects, schools..."}
                            className="w-full py-3 text-sm text-slate-700 outline-none placeholder:text-slate-300 font-medium"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-500">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setFilterOpen(true)}
                        className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all
                            ${activeFilterCount > 0
                                ? 'bg-[#D6402F] text-white'
                                : 'bg-[#1B3A6B] text-white hover:bg-[#162E55]'}`}
                    >
                        <SlidersHorizontal size={16} />
                        Filter
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-white text-[#D6402F] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── STAT CARDS ───────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    label="Open Positions"
                    value={stats.openPositions}
                    icon={<Briefcase size={22} />}
                />
                <StatCard
                    label="Total Vacancies"
                    value={stats.totalVacancies}
                    icon={<BookOpen size={22} />}
                />
                <StatCard
                    label="Application Window"
                    value={stats.daysRemaining}
                    suffix="cal. days"
                    icon={<Clock size={22} />}
                />
            </div>

            {/* ── JOB LIST ─────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-6 mt-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                        Available Positions ({jobs.length})
                    </h2>
                    {activeFilterCount > 0 && (
                        <button
                            onClick={() => setFilters({ status: '', school: '' })}
                            className="text-[10px] font-black text-[#D6402F] uppercase tracking-widest hover:underline"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-2xl h-56 animate-pulse border border-slate-100" />
                        ))}
                    </div>
                ) : jobs.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-2xl border border-slate-100 p-20 text-center"
                    >
                        <Briefcase size={40} className="text-slate-200 mx-auto mb-4" />
                        <p className="font-black text-slate-300 uppercase tracking-widest text-sm">
                            {search || activeFilterCount > 0
                                ? 'No matching positions found'
                                : isNonTeaching
                                ? 'No non-teaching vacancies posted yet'
                                : isTeaching
                                ? 'No teaching vacancies posted yet'
                                : 'No vacancies posted yet'}
                        </p>
                        {(isTeaching || isNonTeaching) && !search && !activeFilterCount && (
                            <p className="text-[11px] font-bold text-slate-300 mt-2">
                                Check back later or contact the HR Office directly.
                            </p>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {jobs.map((job, i) => (
                            <JobCard key={job.id} job={job} index={i} />
                        ))}
                    </div>
                )}
            </div>

            {/* Filter Drawer */}
            <FilterDrawer
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                filters={filters}
                setFilters={setFilters}
                schools={schools}
            />
        </div>
    );
};

export default JobOpenings;