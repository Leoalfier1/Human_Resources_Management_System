import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Printer, Trophy, Loader2, BarChart3 } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const authHeader = () => ({ 'Authorization': `Bearer ${token()}` });

const RRReportsManagement = () => {
    const [searches, setSearches] = useState([]);
    const [searchId, setSearchId] = useState(null);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    React.useEffect(() => {
        fetch(`${API_BASE}/api/rr/searches`, { headers: authHeader() })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                setSearches(data);
                if (data.length > 0) setSearchId(data[0].id);
            });
    }, []);

    const fetchReport = useCallback(async () => {
        if (!searchId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/rr/reports/${searchId}`, { headers: authHeader() });
            if (res.ok) setReport(await res.json());
            else setReport(null);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [searchId]);

    React.useEffect(() => { fetchReport(); }, [fetchReport]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch(`${API_BASE}/api/rr/reports/generate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ search_id: searchId })
            });
            if (res.ok) {
                setReport(await res.json());
                alert('Report generated!');
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (e) { alert('Failed'); }
        finally { setGenerating(false); }
    };

    const handleExportCSV = () => {
        window.open(`${API_BASE}/api/rr/reports/${searchId}/export-csv?token=${token()}`, '_blank');
    };

    const handlePrint = () => {
        window.print();
    };

    const awardsList = report?.report_data?.awards || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-2 rounded-xl">
                    <FileText size={22} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase italic text-[#1B3A6B]">R&R Implementation Reports</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Step 8 · Generate official reports</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <select value={searchId || ''} onChange={e => setSearchId(parseInt(e.target.value))}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-amber-500">
                    <option value="">Select Search</option>
                    {searches.map(s => <option key={s.id} value={s.id}>{s.title} ({s.school_year})</option>)}
                </select>
                <button onClick={handleGenerate} disabled={generating || !searchId}
                    className="flex items-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 disabled:opacity-50 shadow-md">
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />}
                    {report ? 'Regenerate Report' : 'Generate Report'}
                </button>
                {report && (
                    <>
                        <button onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-3 bg-[#1B3A6B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0F2A4F] shadow-md">
                            <Download size={14} /> Export CSV
                        </button>
                        <button onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-200">
                            <Printer size={14} /> Print
                        </button>
                    </>
                )}
            </div>

            {loading ? (
                <div className="animate-pulse space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-[2.5rem]" />)}
                    </div>
                    <div className="h-64 bg-slate-200 rounded-[2.5rem]" />
                </div>
            ) : !report ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 text-center">
                    <FileText size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-400">No report generated yet</p>
                    <p className="text-xs text-slate-300 mt-1">Select a search and click Generate Report</p>
                </div>
            ) : (
                <div className="space-y-6" id="report-content">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-amber-50 rounded-[2.5rem] p-6 border border-amber-100">
                            <p className="text-3xl font-black text-amber-700">{report.total_nominees || 0}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Total Nominees</p>
                        </div>
                        <div className="bg-emerald-50 rounded-[2.5rem] p-6 border border-emerald-100">
                            <p className="text-3xl font-black text-emerald-700">{report.total_awardees || 0}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Awardees</p>
                        </div>
                        <div className="bg-blue-50 rounded-[2.5rem] p-6 border border-blue-100">
                            <p className="text-3xl font-black text-blue-700">{report.teaching_awardees || 0}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Teaching Awardees</p>
                        </div>
                        <div className="bg-purple-50 rounded-[2.5rem] p-6 border border-purple-100">
                            <p className="text-3xl font-black text-purple-700">{report.non_teaching_awardees || 0}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Non-Teaching Awardees</p>
                        </div>
                        <div className="bg-violet-50 rounded-[2.5rem] p-6 border border-violet-100">
                            <p className="text-3xl font-black text-violet-700">{report.teaching_related_awardees || 0}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Tch-Related Awardees</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-black text-[#1B3A6B] text-lg">Schools Division Office of Dapitan City</h3>
                            <p className="text-sm font-bold text-slate-500">Summary List of Awards (Individual)</p>
                            <p className="text-[10px] text-slate-400 font-semibold">CY {report.report_data?.search?.school_year || ''}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500">No.</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500">Last Name</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500">First Name</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500">M.I.</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500">Ext.</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500">Sex</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500">Position</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500">Level</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500">Category</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500">Award Title</th>
                                        <th className="text-left px-4 py-3 text-[9px] font-black uppercase text-slate-500">Office</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {awardsList.length === 0 ? (
                                        <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-400">No awards data</td></tr>
                                    ) : (
                                        awardsList.map((a, i) => {
                                            const nameParts = (a.user_name || '').trim().split(/\s+/);
                                            const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : '';
                                            const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';
                                            return (
                                                <tr key={a.id || i} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-bold text-slate-600">{i + 1}</td>
                                                    <td className="px-4 py-3 text-slate-700">{lastName}</td>
                                                    <td className="px-4 py-3 text-slate-700">{firstName}</td>
                                                    <td className="px-4 py-3 text-slate-400">—</td>
                                                    <td className="px-4 py-3 text-slate-400">—</td>
                                                    <td className="px-4 py-3 text-slate-400">—</td>
                                                    <td className="px-4 py-3 text-slate-400">—</td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{a.award_level || 'Division'}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-700">{a.category_name}</td>
                                                    <td className="px-4 py-3 font-bold text-[#1B3A6B]">{a.award_title}</td>
                                                    <td className="px-4 py-3 text-slate-500">SDO Dapitan City</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {report.report_data?.by_level && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Award Level Breakdown</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(report.report_data.by_level).map(([level, count]) => (
                                    <div key={level} className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                                        <p className="text-2xl font-black text-[#1B3A6B]">{count}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 capitalize">{level}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RRReportsManagement;
