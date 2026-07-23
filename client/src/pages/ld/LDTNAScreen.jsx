import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Send, Users, ClipboardCheck, BarChart3, AlertCircle } from 'lucide-react';

const LDTNAScreen = () => {
    const { token } = useAuth();
    const [title, setTitle] = useState('');
    const [targetDept, setTargetDept] = useState('All Departments');
    const [gaps, setGaps] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTNAData = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/ld/tna', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setGaps(data.gapsChart || []);
                setSubmissions(data.submissions || []);
                setCycles(data.cycles || []);
            }
        } catch (err) {
            console.error("Failed to load TNA data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchTNAData();
    }, [token]);

    const handleCreateTNA = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        try {
            const res = await fetch('http://localhost:5000/api/ld/tna', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    target_department: targetDept
                })
            });
            if (res.ok) {
                setTitle('');
                setTargetDept('All Departments');
                alert("TNA survey cycle dispatched successfully!");
                fetchTNAData();
            }
        } catch (err) {
            console.error("Failed to dispatch TNA:", err);
        }
    };

    const maxCount = gaps.length > 0 ? Math.max(...gaps.map(g => g.count)) : 1;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px] text-xs font-black uppercase text-slate-600">
                Loading Needs Assessment Data...
            </div>
        );
    }

    return (
        <div className="space-y-6 select-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* LEFT COLUMN: TNA Dispatch Builder */}
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-5">
                    <div>
                        <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3">Dispatch Competency TNA Survey</h3>
                        <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-wider">Deploy skills gaps audits division-wide</p>
                    </div>

                    <form onSubmit={handleCreateTNA} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Survey Title</label>
                            <input 
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. CY 2026 Q3 Teachers Competency Needs Assessment"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Target Department / Role Group</label>
                            <select 
                                value={targetDept}
                                onChange={(e) => setTargetDept(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                            >
                                <option value="All Departments">All SDO Personnel</option>
                                <option value="Curriculum Implementation Division">Curriculum Implementation (CID)</option>
                                <option value="School Governance & Operations Division">School Governance (SGOD)</option>
                                <option value="Administrative & Finance">Administrative & Finance Office</option>
                            </select>
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#1B3A6B] text-white rounded-xl text-xs font-black uppercase shadow-lg hover:bg-blue-800 transition-all cursor-pointer active:scale-95"
                            >
                                <Send size={14} /> Dispatch Assessment
                            </button>
                        </div>
                    </form>

                    {/* Active cycles list */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Active Survey Audits</span>
                        <div className="space-y-2">
                            {cycles.map((c) => (
                                <div key={c.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50 flex justify-between items-center text-xs font-bold">
                                    <div className="space-y-0.5">
                                        <p className="text-black uppercase text-[10px] line-clamp-1">{c.title}</p>
                                        <p className="text-[9px] text-slate-600 font-bold uppercase">{c.target_department}</p>
                                    </div>
                                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                                        {c.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Gaps Visual Aggregation charts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Aggregation Chart */}
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                        <div>
                            <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                                <BarChart3 size={15} className="text-slate-800" /> Aggregated Competency Gap Analysis
                            </h3>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-1">Identified needs from submitted assessment answers</p>
                        </div>

                        <div className="space-y-4 pt-2">
                            {gaps.map((g, idx) => {
                                const percent = Math.round((g.count / maxCount) * 100);
                                return (
                                    <div key={idx} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[10px] font-black text-black uppercase">
                                            <span>{g.name}</span>
                                            <span>{g.count} Responses ({percent}%)</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                            <div 
                                                className="bg-gradient-to-r from-[#1B3A6B] to-[#F59E0B] h-full rounded-full transition-all duration-700"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {gaps.length === 0 && (
                                <div className="text-center py-8 text-xs text-slate-600 font-bold uppercase flex flex-col items-center gap-2">
                                    <AlertCircle size={24} className="text-slate-300" />
                                    No competency gaps collected yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table list of detailed qualitative responses */}
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                            <Users size={16} className="text-slate-800" /> Employee Qualitative Responses
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                        <th className="py-2.5 px-4">Employee</th>
                                        <th className="py-2.5 px-4">Gaps Highlighted</th>
                                        <th className="py-2.5 px-4">Qualitative Feedback Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-black">
                                    {submissions.map((sub) => {
                                        const answers = typeof sub.qualitative_answers === 'string' ? JSON.parse(sub.qualitative_answers) : sub.qualitative_answers;
                                        const parsedGaps = typeof sub.competency_gaps === 'string' ? JSON.parse(sub.competency_gaps) : sub.competency_gaps;

                                        return (
                                            <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-4">
                                                    <p className="font-black text-black uppercase">{sub.employee_name}</p>
                                                    <p className="text-[9px] text-slate-600 uppercase">{sub.employee_position}</p>
                                                </td>
                                                <td className="py-4 px-4 space-y-1">
                                                    {Array.isArray(parsedGaps) && parsedGaps.map((g, i) => (
                                                        <span key={i} className="inline-block bg-amber-50 text-[#F59E0B] border border-amber-100 text-[8px] font-black px-2 py-0.5 rounded-full uppercase mr-1">
                                                            {g}
                                                        </span>
                                                    ))}
                                                </td>
                                                <td className="py-4 px-4 text-slate-800 font-medium italic">
                                                    "{answers?.q1 || answers?.q2 || "No comments"}"
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {submissions.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="text-center py-6 text-xs text-slate-600 font-bold uppercase">
                                                No submission records available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LDTNAScreen;
