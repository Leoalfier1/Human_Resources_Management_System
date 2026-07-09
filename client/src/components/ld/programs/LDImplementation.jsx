import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, CheckCircle, XCircle, Clock, Users, MapPin, User, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE } from '../../../utils/api';
import LDProgramDetail from './LDProgramDetail';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const STATUS_TABS = [
    { key: '', label: 'All', color: 'bg-slate-100 text-slate-600' },
    { key: 'planned', label: 'Planned', color: 'bg-slate-100 text-slate-600' },
    { key: 'ongoing', label: 'Ongoing', color: 'bg-amber-100 text-amber-700' },
    { key: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
    { key: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-600' },
];

const TYPE_BADGES = {
    all: 'bg-slate-100 text-slate-600',
    teaching: 'bg-amber-100 text-amber-700',
    non_teaching: 'bg-sky-100 text-sky-700',
};

const LDImplementation = () => {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [statusTab, setStatusTab] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchPrograms = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams();
            if (statusTab) q.append('status', statusTab);
            if (typeFilter) q.append('target_position_type', typeFilter);
            const res = await fetch(`${API_BASE}/api/ld/programs?${q}`, { headers: headers() });
            if (res.ok) setPrograms(await res.json());
        } catch (e) { /* silent */ }
        finally { setLoading(false); }
    }, [statusTab, typeFilter]);

    useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

    const filtered = programs.filter(p =>
        !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const updateStatus = async (id, newStatus) => {
        await fetch(`${API_BASE}/api/ld/programs/${id}/status`, {
            method: 'PATCH', headers: headers(), body: JSON.stringify({ status: newStatus })
        });
        fetchPrograms();
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-black uppercase italic text-[#1B3A6B]">Implementation</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Step 4: Training Program Implementation</p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex gap-1 bg-slate-50 rounded-xl p-1">
                        {STATUS_TABS.map(tab => (
                            <button key={tab.key}
                                onClick={() => setStatusTab(tab.key)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                    statusTab === tab.key ? 'bg-white text-[#1B3A6B] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >{tab.label}</button>
                        ))}
                    </div>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-bold">
                        <option value="">All Types</option>
                        <option value="teaching">Teaching</option>
                        <option value="non_teaching">Non-Teaching</option>
                    </select>
                    <div className="relative flex-1 max-w-xs">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search programs..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-bold" />
                    </div>
                </div>
            </div>

            {/* Program Cards Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-48 bg-slate-200 rounded-[2.5rem] animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 text-center">
                    <PlayCircle size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-400">No programs found</p>
                    <p className="text-xs text-slate-300 mt-1">Create programs in the L&D Plan first</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => setSelectedProgram(p)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-[#1B3A6B] truncate">{p.title}</h3>
                                    {p.plan_title && <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{p.plan_title}</p>}
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-1 rounded-full ml-2 shrink-0 ${
                                    p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                    p.status === 'ongoing' ? 'bg-amber-100 text-amber-700' :
                                    p.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                    'bg-slate-100 text-slate-600'
                                }`}>{p.status}</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-3">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGES[p.target_position_type] || 'bg-slate-100'}`}>
                                    {p.target_position_type}
                                </span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                    {p.methodology}
                                </span>
                            </div>

                            <div className="space-y-1.5 text-[10px] text-slate-500 font-semibold">
                                {p.venue && <p className="flex items-center gap-1.5"><MapPin size={11} /> {p.venue}</p>}
                                {p.resource_person && <p className="flex items-center gap-1.5"><User size={11} /> {p.resource_person}</p>}
                                {p.start_date && (
                                    <p className="flex items-center gap-1.5">
                                        <Clock size={11} />
                                        {new Date(p.start_date).toLocaleDateString()}{p.end_date ? ` - ${new Date(p.end_date).toLocaleDateString()}` : ''}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                                    <Users size={12} />
                                    <span>{p.present_count || 0}/{p.total_attendance || 0} attended</span>
                                </div>
                                {p.status === 'planned' && (
                                    <button onClick={e => { e.stopPropagation(); updateStatus(p.id, 'ongoing'); }}
                                        className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-[9px] font-bold hover:bg-amber-200">
                                        Mark Ongoing
                                    </button>
                                )}
                                {p.status === 'ongoing' && (
                                    <button onClick={e => { e.stopPropagation(); updateStatus(p.id, 'completed'); }}
                                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[9px] font-bold hover:bg-emerald-200">
                                        Mark Complete
                                    </button>
                                )}
                                {p.status === 'completed' && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                        <CheckCircle size={12} /> Completed
                                    </span>
                                )}
                                {p.status === 'cancelled' && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                                        <XCircle size={12} /> Cancelled
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Program Detail Panel */}
            <AnimatePresence>
                {selectedProgram && (
                    <LDProgramDetail
                        program={selectedProgram}
                        onClose={() => { setSelectedProgram(null); fetchPrograms(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default LDImplementation;
