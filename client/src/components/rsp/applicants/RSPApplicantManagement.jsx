import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Download, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2, Wifi, WifiOff } from 'lucide-react';
import StatusBadge from './StatusBadge';
import io from 'socket.io-client';
import { API_BASE, SERVER_BASE } from '../../../utils/api';
import ResizableTable from '../../shared/ResizableTable';

const API = API_BASE;

const DEFAULT_WIDTHS = [
  50, 120, 200, 220, 50, 65, 120, 120, 120, 120,
  220, 150, 200, 200, 70, 220, 70, 200, 150,
];
const COL_WIDTHS_KEY = 'rspApplicantMgmtColWidths';

const COLUMNS = [
  { key: 'no', label: 'No.', width: 50, align: 'center' },
  { key: 'code', label: 'App. Code', width: 120 },
  { key: 'name', label: 'Name of Applicant', width: 200 },
  { key: 'address', label: 'Address', width: 220 },
  { key: 'age', label: 'Age', width: 50, align: 'center' },
  { key: 'sex', label: 'Sex', width: 65, align: 'center' },
  { key: 'civil_status', label: 'Civil Status', width: 120 },
  { key: 'religion', label: 'Religion', width: 120 },
  { key: 'disability', label: 'Disability', width: 120 },
  { key: 'ethnic_group', label: 'Ethnic Group', width: 120 },
  { key: 'email', label: 'Email Address', width: 220 },
  { key: 'contact_no', label: 'Contact No.', width: 150 },
  { key: 'education', label: 'Education', width: 200 },
  { key: 'training_title', label: 'Training Title', width: 200 },
  { key: 'hours', label: 'Hours', width: 70, align: 'center' },
  { key: 'experience_details', label: 'Experience Details', width: 220 },
  { key: 'years', label: 'Years', width: 70, align: 'center' },
  { key: 'eligibility', label: 'Eligibility', width: 200 },
  { key: 'remarks', label: 'Remarks', width: 150, align: 'center' },
];

// ── LIVE INDICATOR ────────────────────────────────────────────────────────────
const LiveDot = ({ connected }) => (
    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${connected ? 'text-emerald-600' : 'text-slate-400'}`}>
        {connected
            ? <><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live</>
            : <><WifiOff size={12} /> Offline</>
        }
    </div>
);

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const RSPApplicantManagement = () => {
    const [applicants, setApplicants] = useState({ applicants: [], pagination: {} });
    const [stats, setStats]           = useState({ total: 0, qualified: 0, disqualified: 0, shortlisted: 0 });
    const [vacancies, setVacancies]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [exporting, setExporting]   = useState(false);
    const [connected, setConnected]   = useState(false);
    const socketRef                   = useRef(null);

    const [filters, setFilters] = useState({ search: '', status: 'all', vacancy_id: 'all', position_type: 'all', page: 1 });

    const token = () => localStorage.getItem('token');
    const authH = () => ({ 'Authorization': `Bearer ${token()}` });

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const query = new URLSearchParams(filters).toString();
        try {
            const [appRes, statRes, vacRes] = await Promise.all([
                fetch(`${API}/api/rsp/applicants?${query}`, { headers: authH() }),
                fetch(`${API}/api/rsp/applicants/summary?vacancy_id=${filters.vacancy_id}`, { headers: authH() }),
                fetch(`${API}/api/rsp/vacancies`, { headers: authH() })
            ]);
            setApplicants(await appRes.json());
            setStats(await statRes.json());
            setVacancies(await vacRes.json());
        } catch (e) { console.error(e); }
        finally { if (!silent) setLoading(false); }
    }, [filters]);

    // Initial load + debounced search re-fetch
    useEffect(() => {
        const t = setTimeout(() => fetchData(), filters.search ? 400 : 0);
        return () => clearTimeout(t);
    }, [fetchData]);

    // ── REAL-TIME SOCKET ──────────────────────────────────────────
    useEffect(() => {
        const socket = io(SERVER_BASE);
        socketRef.current = socket;

        socket.on('connect',    () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        // These events mean the applicant list has changed — silent refresh
        const refresh = () => fetchData(true);
        socket.on('rsp:applicants:update', refresh);
        socket.on('rsp:dashboard:update',  refresh);
        socket.on('application:new',       refresh);

        return () => socket.disconnect();
    }, [fetchData]);

    const handleUpdateStatus = async (id, newStatus) => {
        if (!window.confirm(`Mark this applicant as ${newStatus}?`)) return;
        await fetch(`${API}/api/rsp/applicants/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...authH() },
            body: JSON.stringify({ status: newStatus })
        });
        // Socket will trigger silent refresh, but also do it immediately for responsiveness
        fetchData(true);
    };

    const handleExport = async () => {
        setExporting(true);
        const query = new URLSearchParams(filters).toString();
        try {
            const res = await fetch(`${API}/api/rsp/applicants/export?${query}`, { headers: authH() });
            if (res.ok) {
                const blob = await res.blob();
                const url  = window.URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href     = url;
                a.download = 'applicants.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            }
        } catch (e) { console.error(e); }
        setExporting(false);
    };

    const list = applicants.applicants || [];

    return (
        <div className="space-y-5 select-none">

            {/* HEADER */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-[#1B3A6B] uppercase tracking-tight italic">Applicant Management</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Career Service (Sub-Professional) Second Level Eligibility — Personal Information
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <LiveDot connected={connected} />
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#1B3A6B] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#162E55] transition-all shadow-lg"
                    >
                        {exporting ? <Loader2 className="animate-spin" size={15} /> : <Download size={15} />}
                        Export CSV
                    </button>
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total,         color: 'bg-[#1B3A6B]' },
                    { label: 'Qualified', value: stats.qualified,     color: 'bg-emerald-500' },
                    { label: 'Disqualified', value: stats.disqualified, color: 'bg-red-500' },
                    { label: 'Shortlisted', value: stats.shortlisted,  color: 'bg-amber-500' },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${s.color}`} />
                        <div className="ml-2">
                            <p className="text-3xl font-black text-[#1B3A6B]">{s.value}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* FILTERS */}
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[260px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search name, code, position…"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#1B3A6B] text-sm font-medium transition-all"
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    />
                </div>
                <select className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-600 outline-none"
                    value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}>
                    <option value="all">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_evaluation">Under Evaluation</option>
                    <option value="qualified">Qualified</option>
                    <option value="disqualified">Disqualified</option>
                    <option value="shortlisted">Shortlisted</option>
                </select>
                <select className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-600 outline-none max-w-[240px]"
                    value={filters.vacancy_id} onChange={e => setFilters({ ...filters, vacancy_id: e.target.value, page: 1 })}>
                    <option value="all">All Positions</option>
                    {vacancies.map(v => <option key={v.id} value={v.id}>{v.ref_no} — {v.position_title}</option>)}
                </select>
                <select className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-600 outline-none"
                    value={filters.position_type} onChange={e => setFilters({ ...filters, position_type: e.target.value, page: 1 })}>
                    <option value="all">All Types</option>
                    <option value="teaching">Teaching</option>
                    <option value="non_teaching">Non-Teaching</option>
                    <option value="teaching_related">Teaching-Related</option>
                </select>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <ResizableTable
                    columns={COLUMNS}
                    colWidthsKey={COL_WIDTHS_KEY}
                    defaultWidths={DEFAULT_WIDTHS}
                    data={list}
                    rowKey="id"
                    loading={loading}
                    emptyMessage="No applicants found"
                    loadingMessage="Loading\u2026"
                    stickyCols={3}
                    renderCell={(app, ci, ri) => {
                        switch (ci) {
                            case 0: return (filters.page - 1) * 50 + ri + 1;
                            case 1: return app.applicant_code;
                            case 2: return (
                                <>
                                    <p className="font-black text-[#1B3A6B] text-xs uppercase">{app.full_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] font-bold text-slate-400">{app.position_title}</p>
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-wider ${
                                            app.position_type === 'non_teaching'
                                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                                : app.position_type === 'teaching_related'
                                                    ? 'bg-violet-50 text-violet-600 border border-violet-200'
                                                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                                        }`}>
                                            {app.position_type === 'non_teaching' ? 'NT' : app.position_type === 'teaching_related' ? 'Tch-Rel' : 'T'}
                                        </span>
                                    </div>
                                </>
                            );
                            case 3: return app.address;
                            case 4: return app.age;
                            case 5: return app.sex ? app.sex.charAt(0).toUpperCase() : '\u2014';
                            case 6: return app.civil_status || '\u2014';
                            case 7: return <span className="text-slate-300">N/A</span>;
                            case 8: return <span className="text-slate-300">N/A</span>;
                            case 9: return <span className="text-slate-300">N/A</span>;
                            case 10: return app.pds_email || app.email;
                            case 11: return app.contact_no;
                            case 12: return app.education;
                            case 13: return app.training_title;
                            case 14: return app.training_hours;
                            case 15: return app.experience_details;
                            case 16: return app.experience_years;
                            case 17: return app.eligibility_name;
                            case 18: return (
                                <div className="flex items-center justify-center gap-1.5">
                                    <button
                                        onClick={() => handleUpdateStatus(app.id, 'qualified')}
                                        title="Mark Qualified"
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                                            app.status === 'qualified' || app.status === 'shortlisted'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'text-slate-300 hover:bg-emerald-100 hover:text-emerald-600'
                                        }`}
                                    >
                                        <CheckCircle2 size={13} className="inline mr-0.5" />Q
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(app.id, 'disqualified')}
                                        title="Mark Disqualified"
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                                            app.status === 'disqualified'
                                                ? 'bg-red-100 text-red-700'
                                                : 'text-slate-300 hover:bg-red-100 hover:text-red-500'
                                        }`}
                                    >
                                        <XCircle size={13} className="inline mr-0.5" />D
                                    </button>
                                    <StatusBadge status={app.status} />
                                </div>
                            );
                            default: return null;
                        }
                    }}
                />

                {/* PAGINATION */}
                <div className="p-5 border-t border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Showing {list.length} of {applicants.pagination?.total_count || 0} applicants
                    </p>
                    <div className="flex gap-2">
                        <button disabled={filters.page === 1}
                            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#1B3A6B] disabled:opacity-30">
                            <ChevronLeft size={16} />
                        </button>
                        {[...Array(applicants.pagination?.total_pages || 0)].map((_, i) => (
                            <button key={i} onClick={() => setFilters({ ...filters, page: i + 1 })}
                                className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${
                                    filters.page === i + 1 ? 'bg-[#1B3A6B] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                                }`}>
                                {i + 1}
                            </button>
                        ))}
                        <button disabled={filters.page === applicants.pagination?.total_pages}
                            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#1B3A6B] disabled:opacity-30">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RSPApplicantManagement;