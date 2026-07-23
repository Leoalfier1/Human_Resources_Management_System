import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CalendarCheck, User, Users, ClipboardCheck, Award, ChevronRight } from 'lucide-react';

const LDImplementationScreen = () => {
    const { token } = useAuth();
    const [programs, setPrograms] = useState([]);
    const [selectedProgId, setSelectedProgId] = useState('');
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPrograms = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/ld/programs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPrograms(data || []);
                if (data.length > 0) setSelectedProgId(data[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchEnrollments = async (progId) => {
        if (!progId) return;
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/ld/programs/${progId}/enrollments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEnrollments(data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchPrograms();
    }, [token]);

    useEffect(() => {
        if (selectedProgId) fetchEnrollments(selectedProgId);
    }, [selectedProgId]);

    const handleCheckAttendance = async (enrollId) => {
        const today = new Date().toISOString().split('T')[0];
        try {
            const res = await fetch(`http://localhost:5000/api/ld/enrollments/${enrollId}/attendance`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ date: today })
            });
            if (res.ok) {
                alert(`Attendance marked successfully for today (${today})!`);
                fetchEnrollments(selectedProgId);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateStatus = async (enrollId, status) => {
        const postScore = status === 'completed' ? 4.50 : null; // Mock post training score evaluation
        try {
            const res = await fetch(`http://localhost:5000/api/ld/enrollments/${enrollId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, post_score: postScore })
            });
            if (res.ok) {
                alert(`Status updated to ${status.toUpperCase()} successfully!`);
                fetchEnrollments(selectedProgId);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const selectedProgram = programs.find(p => p.id === parseInt(selectedProgId));

    return (
        <div className="space-y-6 select-none">
            {/* Top Selector Card */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest block">Select Training Program</h3>
                    <p className="text-[10px] text-slate-800 font-bold uppercase mt-1">Track implementation, attendance roster, and completion states</p>
                </div>
                <select 
                    value={selectedProgId}
                    onChange={(e) => setSelectedProgId(e.target.value)}
                    className="w-full md:max-w-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                >
                    {programs.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Roster & Attendance Table */}
                <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                        <Users size={16} className="text-slate-800" /> Enrolled Participants & Attendance Tracker
                    </h3>

                    {loading ? (
                        <div className="text-center py-6 text-xs text-slate-600 font-bold uppercase">
                            Loading Participant Data...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                        <th className="py-2.5 px-4">Employee Details</th>
                                        <th className="py-2.5 px-4">Attendance Log</th>
                                        <th className="py-2.5 px-4">Status & Score</th>
                                        <th className="py-2.5 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-black">
                                    {enrollments.map((en) => {
                                        let attendance = [];
                                        try {
                                            attendance = typeof en.attendance_history === 'string' ? JSON.parse(en.attendance_history) : en.attendance_history;
                                        } catch (e) {
                                            attendance = [];
                                        }

                                        return (
                                            <tr key={en.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4.5 px-4">
                                                    <p className="font-black text-black uppercase">{en.employee_name}</p>
                                                    <p className="text-[9px] text-slate-600 uppercase leading-none mt-0.5">{en.employee_position} &middot; {en.employee_unit}</p>
                                                </td>
                                                <td className="py-4.5 px-4 space-y-1">
                                                    <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">
                                                        {attendance.length} Sessions Checked In
                                                    </span>
                                                    <div className="text-[9px] text-slate-600 flex flex-wrap gap-1 max-w-[150px]">
                                                        {attendance.map((date, i) => (
                                                            <span key={i} className="bg-slate-50 px-1 py-0.2 rounded border border-slate-100">{date}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-4.5 px-4 space-y-1">
                                                    <span className={`inline-block text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border
                                                        ${en.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                                          en.status === 'in_progress' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                          'bg-slate-100 text-black border-slate-200'}`}
                                                    >
                                                        {en.status}
                                                    </span>
                                                    {en.post_score && (
                                                        <p className="text-[10px] text-slate-800 font-bold uppercase">Score: <span className="font-black text-black">{en.post_score}</span></p>
                                                    )}
                                                </td>
                                                <td className="py-4.5 px-4">
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleCheckAttendance(en.id)}
                                                            className="px-2.5 py-1.5 bg-[#1B3A6B] hover:bg-blue-800 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer"
                                                        >
                                                            Check In
                                                        </button>
                                                        {en.status !== 'completed' && (
                                                            <button 
                                                                onClick={() => handleUpdateStatus(en.id, 'completed')}
                                                                className="px-2.5 py-1.5 bg-[#F59E0B] hover:bg-[#d97706] text-white rounded-lg text-[9px] font-black uppercase cursor-pointer"
                                                            >
                                                                Complete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {enrollments.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="text-center py-6 text-slate-600 font-bold uppercase">
                                                No participants enrolled in this program.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Calendar View Block */}
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                        <CalendarCheck size={16} className="text-slate-800" /> Implementation Calendar
                    </h3>

                    {selectedProgram && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 space-y-3">
                                <div>
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Course Schedule</span>
                                    <p className="text-xs font-black text-black uppercase">{selectedProgram.title}</p>
                                </div>
                                <div className="space-y-2 text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                                    <p className="flex justify-between"><span>Methodology:</span> <span className="font-black text-black">{selectedProgram.methodology}</span></p>
                                    <p className="flex justify-between"><span>Instructor:</span> <span className="font-black text-black">{selectedProgram.facilitator}</span></p>
                                    <p className="flex justify-between"><span>Schedule:</span> <span className="font-black text-black">{selectedProgram.schedule_date}</span></p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Upcoming Milestones</span>
                                <div className="space-y-2">
                                    <div className="flex gap-3 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-1.5 shrink-0" />
                                        <div>
                                            <p className="font-black text-black">Pre-training evaluation setup</p>
                                            <p className="text-[9px] text-slate-600 font-bold uppercase">Before August 15</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                        <div>
                                            <p className="font-black text-black">Competency assessment survey</p>
                                            <p className="text-[9px] text-slate-600 font-bold uppercase">Post August 18</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LDImplementationScreen;
