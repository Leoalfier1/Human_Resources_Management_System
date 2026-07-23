import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Target, Shield, BookOpen, AlertCircle, Plus } from 'lucide-react';

const LDObjectivesScreen = () => {
    const { token } = useAuth();
    const [programs, setPrograms] = useState([]);
    const [selectedProgId, setSelectedProgId] = useState('');
    const [objectives, setObjectives] = useState([]);
    
    // Form states
    const [description, setDescription] = useState('');
    const [linkedGap, setLinkedGap] = useState('Advanced PRIME-HRM Documentation');
    const [standard, setStandard] = useState('PPST Strand 7.4 - Professional Collaboration');

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
            console.error("Failed to load programs:", err);
        }
    };

    const fetchObjectives = async (progId) => {
        if (!progId) return;
        try {
            const res = await fetch(`http://localhost:5000/api/ld/objectives/${progId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setObjectives(data || []);
            }
        } catch (err) {
            console.error("Failed to load objectives:", err);
        }
    };

    useEffect(() => {
        if (token) fetchPrograms();
    }, [token]);

    useEffect(() => {
        if (selectedProgId) fetchObjectives(selectedProgId);
    }, [selectedProgId]);

    const handleCreateObjective = async (e) => {
        e.preventDefault();
        if (!description.trim() || !selectedProgId) return;

        try {
            const res = await fetch('http://localhost:5000/api/ld/objectives', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ld_program_id: selectedProgId,
                    objective_description: description,
                    linked_gap: linkedGap,
                    mapped_standard: standard
                })
            });
            if (res.ok) {
                setDescription('');
                alert("Objective mapped and registered successfully!");
                fetchObjectives(selectedProgId);
            }
        } catch (err) {
            console.error("Failed to save objective:", err);
        }
    };

    return (
        <div className="space-y-6 select-none">
            {/* Top Selector Card */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest block">Select Training Program</h3>
                    <p className="text-[10px] text-slate-800 font-bold uppercase mt-1">Formulate objectives for designed professional development</p>
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
                
                {/* Form Input Block */}
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-5">
                    <div>
                        <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-1.5">
                            <Plus size={15} /> Formulate Objective
                        </h3>
                        <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-wider">Map learning goal to standards framework</p>
                    </div>

                    <form onSubmit={handleCreateObjective} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Objective Statement</label>
                            <textarea 
                                rows="3"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the expected learning and behavior outcome..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B] resize-none shadow-sm"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Mapped Competency Gap</label>
                            <select 
                                value={linkedGap}
                                onChange={(e) => setLinkedGap(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                            >
                                <option value="Advanced PRIME-HRM Documentation">Advanced PRIME-HRM Documentation</option>
                                <option value="Compliance Auditing">Compliance Auditing</option>
                                <option value="Leadership & Management">Leadership & Management</option>
                                <option value="Strategic Alignment">Strategic Alignment</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Professional Standard / PPST Strand</label>
                            <select 
                                value={standard}
                                onChange={(e) => setStandard(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                            >
                                <option value="PPST Strand 7.4 - Professional Collaboration">PPST Strand 7.4 - Professional Collaboration</option>
                                <option value="PPST Strand 7.5 - Professional Development">PPST Strand 7.5 - Professional Development</option>
                                <option value="PPST Strand 7.1 - Administrative Governance">PPST Strand 7.1 - Administrative Governance</option>
                                <option value="PPST Strand 7.2 - Competency Alignments">PPST Strand 7.2 - Competency Alignments</option>
                            </select>
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#1B3A6B] text-white rounded-xl text-xs font-black uppercase shadow-lg hover:bg-blue-800 transition-all cursor-pointer active:scale-95"
                            >
                                <Target size={14} /> Map Learning Objective
                            </button>
                        </div>
                    </form>
                </div>

                {/* Table mappings gap -> objective -> standard */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                                <BookOpen size={16} className="text-slate-800" /> Objectives Mapped to Gaps (PRIME-HRM Audit Checklist)
                            </h3>
                            <div className="flex items-center gap-1.5 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                                <Shield size={12} className="text-emerald-500" /> Compliant
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                        <th className="py-2.5 px-4">Competency Needs Gap</th>
                                        <th className="py-2.5 px-4">Learning Objective & Description</th>
                                        <th className="py-2.5 px-4">Mapped PPST Standard</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-black">
                                    {objectives.map((obj) => (
                                        <tr key={obj.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-4 shrink-0">
                                                <span className="inline-block bg-amber-50 text-[#F59E0B] border border-amber-100 text-[8px] font-black px-2 py-0.5 rounded-full uppercase mr-1 whitespace-nowrap">
                                                    {obj.linked_gap}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 font-bold text-black leading-relaxed">{obj.objective_description}</td>
                                            <td className="py-4 px-4 whitespace-nowrap text-[10px] font-black uppercase text-blue-600 tracking-tight">{obj.mapped_standard}</td>
                                        </tr>
                                    ))}
                                    {objectives.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="text-center py-8 text-xs text-slate-600 font-bold uppercase flex flex-col items-center gap-2">
                                                <AlertCircle size={24} className="text-slate-300" />
                                                No objectives defined for this program yet. Use the left panel to formulate.
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

export default LDObjectivesScreen;
