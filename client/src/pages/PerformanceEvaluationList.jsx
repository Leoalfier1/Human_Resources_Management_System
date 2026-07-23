import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Search, UserCheck, Calendar, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PerformanceEvaluationList = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [period, setPeriod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        fetchEmployees();
    }, [token]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${apiUrl}/pm/performance/supervisor/employees`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.employees || []);
                setPeriod(data.period);
            } else {
                console.error("Failed to fetch assigned employees");
            }
        } catch (err) {
            console.error("Error fetching employees:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'acknowledged':
                return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
            case 'submitted':
                return { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
            case 'draft':
            case 'in progress':
                return { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' };
            default:
                return { bg: 'bg-slate-50 text-black border-slate-200', dot: 'bg-slate-400' };
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.unit.toLowerCase().includes(searchTerm.toLowerCase());
        
        const mappedStatus = emp.evaluation_status === 'draft' ? 'In Progress' : emp.evaluation_status;
        const matchesStatus = filterStatus === 'All' || mappedStatus.toLowerCase() === filterStatus.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] p-8 flex justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-[#1B3A6B] border-t-[#D6402F] rounded-full animate-spin" />
                    <p className="text-slate-800 text-xs font-bold uppercase tracking-wider">Loading Assigned Staff...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans">
            {/* Header section */}
            <div className="bg-[#1B3A6B] text-white py-10 px-8 md:px-16 border-b-4 border-[#D6402F] shadow-lg">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-black uppercase text-[#D6402F] tracking-widest mb-2">
                            <ClipboardList size={14} />
                            <span>Performance Management Module</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Evaluate Assigned Staff</h1>
                        <p className="text-slate-600 text-[11px] font-bold mt-1 uppercase tracking-wider">
                            PRIME-HRM Level II Standards &bull; Non-Teaching Personnel Scoped
                        </p>
                    </div>

                    {period ? (
                        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex items-center gap-3 shadow-inner">
                            <div className="bg-[#D6402F] p-2 rounded-xl text-white">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <span className="block text-[9px] font-black uppercase text-slate-600 tracking-wider">Active Evaluation Cycle</span>
                                <span className="block text-xs font-black text-white uppercase">{period.period_name}</span>
                                <span className="block text-[10px] text-slate-600 font-medium">
                                    {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-950/40 border border-amber-900/60 rounded-2xl p-4 flex items-center gap-3">
                            <div className="bg-amber-500 p-2 rounded-xl text-white">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <span className="block text-xs font-black text-amber-500 uppercase">No Active Evaluation Period</span>
                                <span className="block text-[10px] text-slate-600">Please contact HR Administrator to open a period.</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main content grid */}
            <div className="max-w-7xl mx-auto px-6 md:px-8 mt-8">
                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-md">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-600 pointer-events-none">
                            <Search size={16} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search staff by name, position or unit..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] focus:bg-white transition-all shadow-inner"
                        />
                    </div>

                    <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        {['All', 'Not Started', 'In Progress', 'Submitted', 'Acknowledged'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                                    filterStatus === status
                                        ? 'bg-[#1B3A6B] text-white shadow-md'
                                        : 'bg-slate-100 text-black hover:bg-slate-200 hover:text-black'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Employees list */}
                {filteredEmployees.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                            <User size={28} />
                        </div>
                        <h3 className="text-sm font-black text-black uppercase">No Staff Records Found</h3>
                        <p className="text-slate-600 text-xs mt-1">There are no assigned non-teaching employees that match your filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEmployees.map((emp) => {
                            const statusMapped = emp.evaluation_status === 'draft' ? 'In Progress' : emp.evaluation_status;
                            const styles = getStatusStyles(statusMapped);
                            
                            return (
                                <motion.div
                                    key={emp.id}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative group"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1B3A6B] group-hover:bg-[#D6402F] transition-colors" />

                                    <div className="p-6 flex-grow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase flex items-center gap-1.5 ${styles.bg}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                                                {statusMapped}
                                            </div>
                                            
                                            {emp.overall_score > 0 && (
                                                <div className="text-right">
                                                    <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest">Score</span>
                                                    <span className="text-sm font-black text-[#1B3A6B]">{Number(emp.overall_score).toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-[13px] font-black text-[#1B3A6B] uppercase tracking-tight mb-1 group-hover:text-[#D6402F] transition-colors">
                                            {emp.name}
                                        </h3>
                                        <p className="text-[10px] text-slate-800 font-bold uppercase">{emp.position}</p>
                                        
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                                            <div className="bg-slate-100 px-2.5 py-1 rounded text-[9px] font-black text-slate-800 uppercase tracking-wider">
                                                {emp.unit}
                                            </div>
                                            <div className="bg-[#D6402F]/10 px-2.5 py-1 rounded text-[9px] font-black text-[#D6402F] uppercase tracking-wider">
                                                {emp.employee_type}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                            {statusMapped === 'Acknowledged' ? 'Evaluation Locked' : 'Action Required'}
                                        </span>
                                        
                                        <button
                                            disabled={!period}
                                            onClick={() => navigate(`/pm/evaluate/${emp.id}`)}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                statusMapped === 'Submitted' || statusMapped === 'Acknowledged'
                                                    ? 'bg-slate-200 hover:bg-slate-300 text-black'
                                                    : 'bg-[#1B3A6B] hover:bg-[#D6402F] text-white shadow-sm'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <span>
                                                {statusMapped === 'Submitted' || statusMapped === 'Acknowledged' ? 'View evaluation' : 'Evaluate'}
                                            </span>
                                            <ArrowRight size={10} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PerformanceEvaluationList;
