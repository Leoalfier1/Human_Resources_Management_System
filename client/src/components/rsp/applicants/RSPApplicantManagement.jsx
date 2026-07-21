import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, Loader2, WifiOff, ChevronDown } from 'lucide-react';
import StatusBadge from '../../shared/StatusBadge';
import DisqualificationModal from '../../shared/DisqualificationModal';
import io from 'socket.io-client';
import { API_BASE, SERVER_BASE } from '../../../utils/api';

const API = API_BASE;

const fmt = (val) => {
    if (val === null || val === undefined || val === '' || val === 'N/A' || val === 'n/a') return 'Not provided';
    return val;
};

const LiveDot = ({ connected }) => (
    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${connected ? 'text-emerald-600' : 'text-slate-400'}`}>
        {connected
            ? <><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live</>
            : <><WifiOff size={12} /> Offline</>
        }
    </div>
);

const RSPApplicantManagement = () => {
    const [applicants, setApplicants]       = useState({ applicants: [], pagination: {} });
    const [stats, setStats]                 = useState({ total: 0, qualified: 0, disqualified: 0, shortlisted: 0 });
    const [vacancies, setVacancies]         = useState([]);
    const [loading, setLoading]             = useState(true);
    const [exporting, setExporting]         = useState(false);
    const [connected, setConnected]         = useState(false);
    const socketRef                         = useRef(null);
    const [showDisqualifyModal, setShowDisqualifyModal] = useState(false);
    const [disqualifyTarget, setDisqualifyTarget]       = useState(null);
    const [disqualifyLoading, setDisqualifyLoading]     = useState(false);
    const [mqsData, setMqsData]             = useState(null);
    const [mqsLoading, setMqsLoading]       = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);

    const [filters, setFilters] = useState({ search: '', status: 'all', vacancy_id: 'all', position_type: 'all', page: 1 });

    const token = () => localStorage.getItem('token');
    const authH = () => ({ 'Authorization': 'Bearer ' + token() });

    const fetchMqsCriteria = useCallback(async (vacancyId) => {
        if (!vacancyId || vacancyId === 'all') {
            setMqsData(null);
            return;
        }
        setMqsLoading(true);
        try {
            const res = await fetch(API + '/api/rsp/applicants/mqs-criteria?vacancy_id=' + vacancyId, { headers: authH() });
            if (res.ok) setMqsData(await res.json());
            else setMqsData(null);
        } catch { setMqsData(null); }
        setMqsLoading(false);
    }, []);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const query = new URLSearchParams(filters).toString();
        try {
            const [appRes, statRes, vacRes] = await Promise.all([
                fetch(API + '/api/rsp/applicants?' + query, { headers: authH() }),
                fetch(API + '/api/rsp/applicants/summary?vacancy_id=' + filters.vacancy_id, { headers: authH() }),
                fetch(API + '/api/rsp/vacancies', { headers: authH() })
            ]);
            setApplicants(await appRes.json());
            setStats(await statRes.json());
            setVacancies(await vacRes.json());
        } catch (e) { console.error(e); }
        finally { if (!silent) setLoading(false); }
    }, [filters]);

    useEffect(() => {
        const t = setTimeout(() => fetchData(), filters.search ? 400 : 0);
        return () => clearTimeout(t);
    }, [fetchData]);

    useEffect(() => {
        fetchMqsCriteria(filters.vacancy_id);
    }, [filters.vacancy_id, fetchMqsCriteria]);

    useEffect(() => {
        const socket = io(SERVER_BASE);
        socketRef.current = socket;
        socket.on('connect',    () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));
        const refresh = () => fetchData(true);
        socket.on('rsp:applicants:update', refresh);
        socket.on('rsp:dashboard:update',  refresh);
        socket.on('application:new',       refresh);
        socket.on('rsp:initial-evaluation-decided', refresh);
        return () => socket.disconnect();
    }, [fetchData]);

    const handleDisqualifyConfirm = async (remarks) => {
        if (!disqualifyTarget) return;
        setDisqualifyLoading(true);
        try {
            const res = await fetch(API + '/api/rsp/applicants/' + disqualifyTarget.id + '/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authH() },
                body: JSON.stringify({ status: 'disqualified', remarks })
            });
            if (res.ok) {
                setShowDisqualifyModal(false);
                setDisqualifyTarget(null);
                fetchData(true);
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to disqualify applicant');
            }
        } catch {
            alert('Could not reach the server.');
        }
        setDisqualifyLoading(false);
    };

    const handleStatusChange = async (app, newStatus) => {
        if (newStatus === app.status) return;
        if (newStatus === 'disqualified') {
            setDisqualifyTarget(app);
            setShowDisqualifyModal(true);
            return;
        }
        setUpdatingStatusId(app.id);
        try {
            const res = await fetch(API + '/api/rsp/applicants/' + app.id + '/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authH() },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchData(true);
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to update status');
            }
        } catch {
            alert('Could not reach the server.');
        }
        setUpdatingStatusId(null);
    };

    const handleExport = async () => {
        setExporting(true);
        const query = new URLSearchParams(filters).toString();
        try {
            const res = await fetch(API + '/api/rsp/applicants/export?' + query, { headers: authH() });
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

    const COL_COUNT = 17;

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
                    { label: 'Total', value: stats.total, color: 'bg-[#1B3A6B]' },
                    { label: 'Qualified', value: stats.qualified, color: 'bg-emerald-500' },
                    { label: 'Disqualified', value: stats.disqualified, color: 'bg-red-500' },
                    { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-amber-500' },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
                        <div className={'absolute left-0 top-0 bottom-0 w-1.5 ' + s.color} />
                        <div className="ml-2">
                            <p className="text-3xl font-black text-[#1B3A6B]">{s.value}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ANNEX D HEADER BLOCK */}
            {filters.vacancy_id !== 'all' && (
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    {mqsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin text-[#1B3A6B]" size={20} />
                        </div>
                    ) : mqsData ? (
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[#1B3A6B]">
                                <div>
                                    <h3 className="text-sm font-black text-[#1B3A6B] uppercase tracking-widest">
                                        Initial Evaluation Result (IER)
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        Screening of Applicants per Vacancy
                                    </p>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 border border-slate-200 rounded-lg px-2.5 py-1 uppercase tracking-widest">
                                    Annex D
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Position</p>
                                    <p className="text-xs font-black text-[#1B3A6B]">{mqsData.position_title}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Salary Grade and Monthly Salary</p>
                                    <p className="text-xs font-black text-[#1B3A6B]">
                                        {mqsData.salary_grade || 'N/A'}
                                        {mqsData.monthly_salary
                                            ? <> &middot; &#8369;{Number(mqsData.monthly_salary).toLocaleString('en-PH')}/month</>
                                            : null
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
                                <p className="text-[9px] font-black text-[#1B3A6B] uppercase tracking-widest mb-3">
                                    Qualification Standards
                                </p>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Education',    value: mqsData.mqs.education },
                                        { label: 'Training',     value: mqsData.mqs.training },
                                        { label: 'Experience',   value: mqsData.mqs.experience },
                                        { label: 'Eligibility',  value: mqsData.mqs.eligibility },
                                    ].map(qs => (
                                        <div key={qs.label}>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{qs.label}</p>
                                            <p className="text-[11px] font-bold text-slate-600 leading-snug">{qs.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {/* FILTERS */}
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[260px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search name, code, position..."
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

            {/* TABLE — flat columns, horizontal scroll */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" style={{ minWidth: '2100px' }}>
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider w-12 text-center sticky left-0 bg-slate-50 z-10">No.</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">App Code</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Name of Applicant</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Address</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-center whitespace-nowrap">Age</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-center whitespace-nowrap">Sex</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Civil Status</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Religion</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Disability</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Ethnic Group</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Email Address</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Contact No.</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Education</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Training (Hours)</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-center whitespace-nowrap">Experience (Years)</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Eligibility</th>
                                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={COL_COUNT} className="text-center py-16 text-slate-400 text-xs font-black uppercase tracking-widest">
                                        <Loader2 className="animate-spin inline mr-2" size={16} />
                                        Loading...
                                    </td>
                                </tr>
                            ) : list.length === 0 ? (
                                <tr>
                                    <td colSpan={COL_COUNT} className="text-center py-16 text-slate-300 text-xs font-black uppercase tracking-widest">
                                        No applicants found
                                    </td>
                                </tr>
                            ) : (
                                list.map((app, ri) => (
                                    <tr key={app.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-3 py-3 text-[11px] font-bold text-slate-500 text-center sticky left-0 bg-white z-10">
                                            {(filters.page - 1) * 50 + ri + 1}
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-bold text-[#1B3A6B] whitespace-nowrap">
                                            {app.applicant_code}
                                        </td>
                                        <td className="px-3 py-3">
                                            <p className="font-black text-[#1B3A6B] text-xs uppercase leading-tight">{app.full_name}</p>
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-bold text-slate-600 max-w-[200px]" title={app.address}>
                                            <span className="line-clamp-2">{fmt(app.address)}</span>
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-bold text-slate-600 text-center">
                                            {app.age != null ? app.age : <span className="text-slate-300">&mdash;</span>}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            {app.sex
                                                ? <span className={'text-[9px] font-black px-2 py-0.5 rounded uppercase ' + (app.sex === 'male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700')}>{app.sex}</span>
                                                : <span className="text-slate-300">&mdash;</span>
                                            }
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-bold text-slate-600 whitespace-nowrap">
                                            {fmt(app.civil_status)}
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-bold text-slate-600 max-w-[140px]" title={app.religion}>
                                            <span className="line-clamp-2">{fmt(app.religion)}</span>
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-bold text-slate-600 max-w-[120px]" title={app.disability}>
                                            <span className="line-clamp-2">{fmt(app.disability)}</span>
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-bold text-slate-600 max-w-[120px]" title={app.ethnic_group}>
                                            <span className="line-clamp-2">{fmt(app.ethnic_group)}</span>
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-bold text-slate-600 max-w-[200px]" title={app.pds_email || app.email}>
                                            <span className="line-clamp-2">{app.pds_email || app.email || <span className="text-slate-300">Not provided</span>}</span>
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-bold text-slate-600 whitespace-nowrap">
                                            {fmt(app.contact_no)}
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-bold text-slate-600 max-w-[180px]" title={app.education}>
                                            <span className="line-clamp-2">{fmt(app.education)}</span>
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-bold text-slate-600 text-center">
                                            {app.training_hours != null ? app.training_hours : <span className="text-slate-300">&mdash;</span>}
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-bold text-slate-600 text-center">
                                            {app.experience_years != null ? app.experience_years : <span className="text-slate-300">&mdash;</span>}
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-bold text-slate-600 max-w-[180px]" title={app.eligibility}>
                                            <span className="line-clamp-2">{fmt(app.eligibility)}</span>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            {['shortlisted', 'selected', 'appointed'].includes(app.status) ? (
                                                <StatusBadge status={app.status} />
                                            ) : updatingStatusId === app.id ? (
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                    <Loader2 size={12} className="animate-spin" /> Updating…
                                                </div>
                                            ) : (
                                                <div className="relative inline-block">
                                                    <select
                                                        value={app.status === 'submitted' || app.status === 'under_evaluation' ? '' : app.status}
                                                        onChange={(e) => {
                                                            if (e.target.value) handleStatusChange(app, e.target.value);
                                                            e.target.value = '';
                                                        }}
                                                        className={`appearance-none pl-2.5 pr-7 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 transition-all ${
                                                            app.status === 'qualified' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400'
                                                            : app.status === 'disqualified' ? 'bg-red-50 text-red-600 border-red-200 hover:border-red-400'
                                                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#1B3A6B]/40'
                                                        }`}
                                                    >
                                                        <option value="" disabled>
                                                            {app.status === 'qualified' ? 'Qualified' : app.status === 'disqualified' ? 'Disqualified' : 'Set status…'}
                                                        </option>
                                                        <option value="qualified">Qualified</option>
                                                        <option value="disqualified">Disqualified</option>
                                                    </select>
                                                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

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
                                className={'w-9 h-9 rounded-xl font-black text-xs transition-all ' + (
                                    filters.page === i + 1 ? 'bg-[#1B3A6B] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                                )}>
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

            <DisqualificationModal
                isOpen={showDisqualifyModal}
                applicantName={disqualifyTarget?.full_name || ''}
                applicantCode={disqualifyTarget?.applicant_code || ''}
                unmetCriteria={[]}
                unverifiedDocs={[]}
                onConfirm={handleDisqualifyConfirm}
                onCancel={() => { setShowDisqualifyModal(false); setDisqualifyTarget(null); }}
                loading={disqualifyLoading}
            />
        </div>
    );
};

export default RSPApplicantManagement;
