import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ClipboardList, Users, CheckCircle2, TrendingUp, ArrowRight, Play, Award } from 'lucide-react';
import LDStepper from '../../components/ld/LDStepper';

const LDDashboard = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        activeTNA: 0,
        ongoingPrograms: 0,
        completedPrograms: 0,
        avgImpactScore: "0.00"
    });
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/ld/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.stats) setStats(data.stats);
                    if (data.programs) setPrograms(data.programs);
                }
            } catch (err) {
                console.error("Failed to load L&D Dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchDashboardData();
    }, [token]);

    const getStatusStyle = (status) => {
        if (status === 'completed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (status === 'in_progress') return 'bg-amber-100 text-amber-800 border-amber-200';
        return 'bg-slate-100 text-black border-slate-200';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px] text-xs font-black uppercase text-slate-600">
                Loading L&D Dashboard Stats...
            </div>
        );
    }

    return (
        <div className="space-y-8 select-none">
            {/* 1. OVERVIEW KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Active TNA */}
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Active TNA Assessments</span>
                        <p className="text-3xl font-black text-black">{stats.activeTNA}</p>
                    </div>
                    <div className="bg-[#1B3A6B]/5 p-3 rounded-2xl text-black">
                        <ClipboardList size={22} />
                    </div>
                </div>

                {/* Ongoing */}
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Ongoing Programs</span>
                        <p className="text-3xl font-black text-black">{stats.ongoingPrograms}</p>
                    </div>
                    <div className="bg-[#F59E0B]/10 p-3 rounded-2xl text-[#F59E0B]">
                        <Play size={22} className="fill-current" />
                    </div>
                </div>

                {/* Completed */}
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Programs Completed</span>
                        <p className="text-3xl font-black text-black">{stats.completedPrograms}</p>
                    </div>
                    <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
                        <CheckCircle2 size={22} />
                    </div>
                </div>

                {/* Impact */}
                <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Average Impact Score</span>
                        <p className="text-3xl font-black text-black">{stats.avgImpactScore} <span className="text-xs text-slate-600 font-bold">/ 5.00</span></p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                        <TrendingUp size={22} />
                    </div>
                </div>
            </div>

            {/* 2. ACTIVE STEPR TRACKER PER PROGRAM */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                    <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3">Active Program Progress Steppers</h3>
                    <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-wider">PRIME-HRM Level II 5-stage sequential workflows</p>
                </div>

                <div className="space-y-6">
                    {programs.map((p) => (
                        <div key={p.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100/60 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="space-y-1 lg:max-w-[30%] shrink-0">
                                <h4 className="text-xs font-black text-black uppercase tracking-tight">{p.title}</h4>
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{p.target_participants} &middot; Facilitator: {p.facilitator}</p>
                            </div>
                            
                            {/* Reusable Stepper */}
                            <div className="w-full lg:max-w-[65%] shrink-0">
                                <LDStepper stepsStatus={[p.step_1_status, p.step_2_status, p.step_3_status, p.step_4_status, p.step_5_status]} />
                            </div>
                        </div>
                    ))}
                    {programs.length === 0 && (
                        <div className="text-center py-10 text-xs text-slate-600 font-bold uppercase">
                            No training initiatives currently scheduled.
                        </div>
                    )}
                </div>
            </div>

            {/* 3. INITIATIVES DETAILS GRID LIST */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-black uppercase tracking-widest">Training Programs Directory</h3>
                    <button 
                        onClick={() => navigate('/ld/planning')}
                        className="text-[10px] font-black text-[#D6402F] hover:text-black uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        Design New Program <ArrowRight size={12} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                <th className="py-3 px-4">Program Title</th>
                                <th className="py-3 px-4">Methodology</th>
                                <th className="py-3 px-4">Facilitator</th>
                                <th className="py-3 px-4">Target Participants</th>
                                <th className="py-3 px-4">Budget</th>
                                <th className="py-3 px-4">L&D Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs font-semibold text-black">
                            {programs.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4.5 px-4 font-black text-black uppercase">{p.title}</td>
                                    <td className="py-4.5 px-4 font-bold uppercase tracking-wider text-[10px]">{p.methodology}</td>
                                    <td className="py-4.5 px-4">{p.facilitator}</td>
                                    <td className="py-4.5 px-4">{p.target_participants}</td>
                                    <td className="py-4.5 px-4 font-black">₱{Number(p.budget).toLocaleString()}</td>
                                    <td className="py-4.5 px-4">
                                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getStatusStyle(p.step_4_status)}`}>
                                            {p.step_4_status === 'completed' ? 'Implemented' : p.step_4_status === 'in_progress' ? 'In Progress' : 'Planned'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LDDashboard;
