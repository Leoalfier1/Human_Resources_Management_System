import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, DollarSign, Calendar, Layers, User, Plus } from 'lucide-react';

const LDPlanningScreen = () => {
    const { token } = useAuth();
    const [programs, setPrograms] = useState([]);
    
    // Form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [target, setTarget] = useState('');
    const [schedule, setSchedule] = useState('');
    const [budget, setBudget] = useState('');
    const [methodology, setMethodology] = useState('workshop');
    const [facilitator, setFacilitator] = useState('');

    const fetchPrograms = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/ld/programs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPrograms(data || []);
            }
        } catch (err) {
            console.error("Failed to fetch designed programs:", err);
        }
    };

    useEffect(() => {
        if (token) fetchPrograms();
    }, [token]);

    const handleCreateProgram = async (e) => {
        e.preventDefault();
        if (!title.trim() || !facilitator.trim()) return;

        try {
            const res = await fetch('http://localhost:5000/api/ld/programs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    target_participants: target,
                    schedule_date: schedule,
                    budget: parseFloat(budget) || 0,
                    methodology,
                    facilitator
                })
            });
            if (res.ok) {
                setTitle('');
                setDescription('');
                setTarget('');
                setSchedule('');
                setBudget('');
                setFacilitator('');
                alert("Professional training program designed successfully!");
                fetchPrograms();
            }
        } catch (err) {
            console.error("Failed to save program design:", err);
        }
    };

    return (
        <div className="space-y-6 select-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Form Input Panel */}
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-5">
                    <div>
                        <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-1.5">
                            <Plus size={15} /> Design L&D Program
                        </h3>
                        <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-wider">Define methodologies & budgets</p>
                    </div>

                    <form onSubmit={handleCreateProgram} className="space-y-3.5">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Program Title</label>
                            <input 
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Advanced PRIME-HRM Compliance Seminars"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Description / Course Outline</label>
                            <textarea 
                                rows="3"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Outline what the course intends to accomplish..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B] resize-none shadow-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Target Participants</label>
                            <input 
                                type="text"
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                placeholder="e.g. SDO Division Chiefs & Staff"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Schedule Dates</label>
                            <input 
                                type="text"
                                value={schedule}
                                onChange={(e) => setSchedule(e.target.value)}
                                placeholder="e.g. August 15-18, 2026"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Budget (PHP)</label>
                                <input 
                                    type="number"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    placeholder="50000"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Methodology</label>
                                <select 
                                    value={methodology}
                                    onChange={(e) => setMethodology(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                                >
                                    <option value="workshop">Workshop</option>
                                    <option value="seminar">Seminar</option>
                                    <option value="e-learning">E-Learning</option>
                                    <option value="coaching">Coaching</option>
                                    <option value="mentoring">Mentoring</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Resource Speaker / Facilitator</label>
                            <input 
                                type="text"
                                value={facilitator}
                                onChange={(e) => setFacilitator(e.target.value)}
                                placeholder="e.g. Chief Education Supervisor"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#1B3A6B] text-white rounded-xl text-xs font-black uppercase shadow-lg hover:bg-blue-800 transition-all cursor-pointer active:scale-95"
                            >
                                <BookOpen size={14} /> Create Program Design
                            </button>
                        </div>
                    </form>
                </div>

                {/* Listing Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                            Designed Programs & Methodology Outline
                        </h3>

                        <div className="space-y-4">
                            {programs.map((p) => (
                                <div key={p.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-2 max-w-lg">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-black text-black uppercase tracking-tight">{p.title}</h4>
                                            <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full">
                                                {p.methodology}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-800 font-medium leading-relaxed italic">
                                            "{p.description || "No course description outline loaded."}"
                                        </p>

                                        <div className="flex flex-wrap gap-4 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                                            <span className="flex items-center gap-1"><User size={13} /> {p.facilitator}</span>
                                            <span className="flex items-center gap-1"><Calendar size={13} /> {p.schedule_date}</span>
                                        </div>
                                    </div>

                                    <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Budget allocation</span>
                                            <p className="text-sm font-black text-black flex items-center"><DollarSign size={13} className="text-slate-600" /> {Number(p.budget).toLocaleString()}</p>
                                        </div>
                                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                                            <Layers size={10} /> PHASE 3: Design
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LDPlanningScreen;
