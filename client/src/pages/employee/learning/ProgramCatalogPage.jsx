import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeft, BookOpen, Search, User, Calendar, Layers, ShieldCheck } from 'lucide-react';

const ProgramCatalogPage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [programs, setPrograms] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [enrolledIds, setEnrolledIds] = useState([]);

    const fetchCatalogData = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/ld/employee/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const enrolled = data.enrolled || [];
                const recommended = data.recommended || [];
                setPrograms([...enrolled, ...recommended]);
                setEnrolledIds(enrolled.map(e => e.id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (token) fetchCatalogData();
    }, [token]);

    const handleEnroll = async (progId) => {
        try {
            const res = await fetch('http://localhost:5000/api/ld/employee/enroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ld_program_id: progId })
            });
            if (res.ok) {
                alert("Successfully enrolled in training program!");
                fetchCatalogData();
            } else {
                const errData = await res.json();
                alert(errData.message || "Failed to enroll");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = programs.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.methodology && p.methodology.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6 select-none max-w-6xl mx-auto">
            {/* Header + Search bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/employee/learning')}
                        className="p-2 bg-white border border-slate-100 rounded-full hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <ArrowLeft size={16} className="text-black" />
                    </button>
                    <div>
                        <h2 className="text-sm font-black text-black uppercase tracking-wider">L&D Program Catalog</h2>
                        <p className="text-[10px] text-slate-600 font-bold uppercase">Browse active professional training workshops</p>
                    </div>
                </div>

                {/* Search query input */}
                <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3 top-3.5 text-slate-600" size={14} />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search programs or methods..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                    />
                </div>
            </div>

            {/* Catalog Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map((p) => {
                    const isEnrolled = enrolledIds.includes(p.id);
                    return (
                        <div key={p.id} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between gap-6 hover:shadow-md transition-all">
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full">
                                        {p.methodology}
                                    </span>
                                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider">{p.schedule_date}</span>
                                </div>
                                <h4 className="text-xs font-black text-black uppercase tracking-tight">{p.title}</h4>
                                <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                                    {p.description || "Learn core validation and compliance procedures to meet DepEd Meritocracy standards."}
                                </p>

                                <div className="pt-2 border-t border-slate-50 space-y-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                    <p className="flex items-center gap-1.5"><User size={13} /> Facilitator: <span className="font-black text-black">{p.facilitator}</span></p>
                                    <p className="flex items-center gap-1.5"><Layers size={13} /> Participants: <span className="font-black text-black">{p.target_participants}</span></p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">PRIME-HRM Level II</span>
                                {isEnrolled ? (
                                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase px-4 py-2 rounded-xl">
                                        <ShieldCheck size={12} /> Enrolled
                                    </span>
                                ) : (
                                    <button 
                                        onClick={() => handleEnroll(p.id)}
                                        className="px-5 py-2.5 bg-[#1B3A6B] hover:bg-blue-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md transition-all cursor-pointer active:scale-95"
                                    >
                                        Enroll Course
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProgramCatalogPage;
