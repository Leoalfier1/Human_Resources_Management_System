import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, Eye, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2, Filter } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { motion, AnimatePresence } from 'framer-motion';

const RSPApplicantManagement = () => {
    const [applicants, setApplicants] = useState([]);
    const [stats, setStats] = useState({ total: 0, qualified: 0, disqualified: 0, shortlisted: 0 });
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Filters State
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        vacancy_id: 'all',
        page: 1
    });

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const query = new URLSearchParams(filters).toString();
        
        try {
            const [appRes, statRes, vacRes] = await Promise.all([
                fetch(`http://localhost:5000/api/rsp/applicants?${query}`, { headers: { 'Authorization': `Bearer ${token}` }}),
                fetch(`http://localhost:5000/api/rsp/applicants/summary?vacancy_id=${filters.vacancy_id}`, { headers: { 'Authorization': `Bearer ${token}` }}),
                fetch(`http://localhost:5000/api/rsp/vacancies`, { headers: { 'Authorization': `Bearer ${token}` }})
            ]);

            const appData = await appRes.json();
            const statData = await statRes.json();
            const vacData = await vacRes.json();

            setApplicants(appData);
            setStats(statData);
            setVacancies(vacData);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchData();
        }, 400); // 400ms debounce for search
        return () => clearTimeout(delayDebounce);
    }, [filters.search, filters.status, filters.vacancy_id, filters.page]);

    const handleUpdateStatus = async (id, newStatus) => {
        if (!window.confirm(`Mark this applicant as ${newStatus}?`)) return;
        
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/rsp/applicants/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) fetchData();
    };

    const handleExport = async () => {
        setExporting(true);
        const query = new URLSearchParams(filters).toString();
        window.location.href = `http://localhost:5000/api/rsp/applicants/export?${query}`;
        setTimeout(() => setExporting(false), 2000);
    };

    return (
        <div className="space-y-6 select-none">
            {/* HEADER */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-[#1B3A6B] uppercase tracking-tight italic">Applicant Management</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Manage and track all RSP applicants per position</p>
                </div>
                <button 
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 px-6 py-3 bg-[#1B3A6B] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#162E55] transition-all shadow-lg"
                >
                    {exporting ? <Loader2 className="animate-spin" size={16}/> : <Download size={16} />}
                    Export List
                </button>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                    { label: 'Total', value: stats.total, color: 'bg-[#1B3A6B]' },
                    { label: 'Qualified', value: stats.qualified, color: 'bg-emerald-500' },
                    { label: 'Disqualified', value: stats.disqualified, color: 'bg-red-500' },
                    { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-amber-500' }
                ].map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${s.color}`} />
                        <div>
                            <p className="text-3xl font-black text-[#1B3A6B]">{s.value}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* FILTERS */}
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or ID..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#1B3A6B] transition-all text-sm font-medium"
                        value={filters.search}
                        onChange={e => setFilters({...filters, search: e.target.value, page: 1})}
                    />
                </div>
                <select 
                    className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 outline-none"
                    value={filters.status}
                    onChange={e => setFilters({...filters, status: e.target.value, page: 1})}
                >
                    <option value="all">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_evaluation">Under Evaluation</option>
                    <option value="qualified">Qualified</option>
                    <option value="disqualified">Disqualified</option>
                </select>
                <select 
                    className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 outline-none max-w-[250px]"
                    value={filters.vacancy_id}
                    onChange={e => setFilters({...filters, vacancy_id: e.target.value, page: 1})}
                >
                    <option value="all">All Positions</option>
                    {vacancies.map(v => <option key={v.id} value={v.id}>{v.ref_no} - {v.position_title}</option>)}
                </select>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                <th className="px-8 py-5">ID</th>
                                <th className="px-4 py-5">Applicant</th>
                                <th className="px-4 py-5">Position</th>
                                <th className="px-4 py-5 text-center">CA Score</th>
                                <th className="px-4 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {applicants.applicants?.map((app) => (
                                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5 text-xs font-bold text-slate-400">{app.applicant_code}</td>
                                    <td className="px-4 py-5">
                                        <p className="font-black text-[#1B3A6B] text-sm uppercase">{app.full_name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest">{app.id_number}</p>
                                    </td>
                                    <td className="px-4 py-5">
                                        <p className="font-bold text-[#1B3A6B] text-xs">{app.position_title}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{app.school_abbreviation}</p>
                                    </td>
                                    <td className="px-4 py-5 text-center font-black text-slate-600 text-sm">
                                        {app.ca_score || '—'}
                                    </td>
                                    <td className="px-4 py-5">
                                        <StatusBadge status={app.status} />
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 text-slate-300 hover:bg-[#1B3A6B] hover:text-white rounded-xl transition-all shadow-sm"><Eye size={16}/></button>
                                            <button onClick={() => handleUpdateStatus(app.id, 'qualified')} className="p-2 text-slate-300 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm"><CheckCircle2 size={16}/></button>
                                            <button onClick={() => handleUpdateStatus(app.id, 'disqualified')} className="p-2 text-slate-300 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"><XCircle size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="p-6 border-t border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Showing {applicants.applicants?.length} of {applicants.pagination?.total_count} applicants
                    </p>
                    <div className="flex gap-2">
                        <button 
                            disabled={filters.page === 1}
                            onClick={() => setFilters({...filters, page: filters.page - 1})}
                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#1B3A6B] disabled:opacity-30"
                        >
                            <ChevronLeft size={18}/>
                        </button>
                        {[...Array(applicants.pagination?.total_pages || 0)].map((_, i) => (
                            <button 
                                key={i}
                                onClick={() => setFilters({...filters, page: i + 1})}
                                className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${filters.page === i + 1 ? 'bg-[#1B3A6B] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button 
                            disabled={filters.page === applicants.pagination?.total_pages}
                            onClick={() => setFilters({...filters, page: filters.page + 1})}
                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#1B3A6B] disabled:opacity-30"
                        >
                            <ChevronRight size={18}/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RSPApplicantManagement;