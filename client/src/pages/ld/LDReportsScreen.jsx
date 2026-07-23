import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Download, CheckCircle2, Award, Calendar, Users, Target } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const LDReportsScreen = () => {
    const { token } = useAuth();
    const [programs, setPrograms] = useState([]);
    const [selectedProgId, setSelectedProgId] = useState('');
    const [reportDetails, setReportDetails] = useState({
        program: null,
        objectives: [],
        enrollments: [],
        evaluations: []
    });
    const [loading, setLoading] = useState(false);

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

    const fetchReportDetails = async (progId) => {
        if (!progId) return;
        setLoading(true);
        try {
            const selectedProg = programs.find(p => p.id === parseInt(progId));
            
            // Objectives
            const objRes = await fetch(`http://localhost:5000/api/ld/objectives/${progId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const objectives = objRes.ok ? await objRes.json() : [];

            // Enrollments and evaluations
            const evalRes = await fetch(`http://localhost:5000/api/ld/programs/${progId}/evaluations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const enrollments = evalRes.ok ? await evalRes.json() : [];

            setReportDetails({
                program: selectedProg,
                objectives,
                enrollments,
                evaluations: enrollments.filter(e => e.satisfaction_score)
            });
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
        if (selectedProgId && programs.length > 0) fetchReportDetails(selectedProgId);
    }, [selectedProgId, programs]);

    const { program, objectives, enrollments, evaluations } = reportDetails;

    // Report Summary Stats
    const totalEnrolled = enrollments.length;
    const completedCount = enrollments.filter(e => e.status === 'completed').length;
    const completionRate = totalEnrolled > 0 ? ((completedCount / totalEnrolled) * 100).toFixed(0) : "0";
    
    const avgSatisfaction = evaluations.length > 0 
        ? (evaluations.reduce((acc, curr) => acc + curr.satisfaction_score, 0) / evaluations.length).toFixed(1)
        : "N/A";
    const avgPostScore = evaluations.length > 0 
        ? (evaluations.reduce((acc, curr) => acc + curr.competency_score_rating, 0) / evaluations.length).toFixed(1)
        : "N/A";

    const exportPDF = () => {
        if (!program) return;
        const doc = new jsPDF();
        
        doc.setFillColor(27, 58, 107); // #1B3A6B
        doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("DEPED SDO DAPITAN CITY - HRMIS", 15, 18);
        doc.setFontSize(10);
        doc.text("CONSOLIDATED LEARNING & DEVELOPMENT AUDIT REPORT (PRIME-HRM)", 15, 28);
        
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(12);
        doc.text(`Training Program: ${program.title.toUpperCase()}`, 15, 50);
        doc.text(`Methodology: ${program.methodology.toUpperCase()} | Facilitator: ${program.facilitator}`, 15, 58);
        doc.text(`Target Participants: ${program.target_participants}`, 15, 66);
        doc.text(`Schedule Date: ${program.schedule_date} | Budget: Php ${Number(program.budget).toLocaleString()}`, 15, 74);
        
        doc.text("L&D METRICS SUMMARY", 15, 88);
        doc.autoTable({
            startY: 92,
            head: [['Indicator', 'Value']],
            body: [
                ['Total Participants Enrolled', totalEnrolled],
                ['Completion Rate (%)', `${completionRate}%`],
                ['Average Trainee Satisfaction', avgSatisfaction],
                ['Average Trainee Post-competency Score', avgPostScore]
            ],
            theme: 'grid',
            headStyles: { fillColor: [27, 58, 107] }
        });
        
        doc.text("MAPPED OBJECTIVES & COMPLIANCE STANDARDS", 15, doc.lastAutoTable.finalY + 12);
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 16,
            head: [['Needs Gap', 'Objective Description', 'PPST Standard']],
            body: objectives.map(obj => [obj.linked_gap, obj.objective_description, obj.mapped_standard]),
            theme: 'grid',
            headStyles: { fillColor: [27, 58, 107] }
        });

        doc.save(`LD_Consolidated_Report_${program.id}.pdf`);
    };

    return (
        <div className="space-y-6 select-none">
            {/* Selection Card */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest block">Select Training Program</h3>
                    <p className="text-[10px] text-slate-800 font-bold uppercase mt-1">Select initiative to generate consolidated PRIME-HRM compliance audit reports</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <select 
                        value={selectedProgId}
                        onChange={(e) => setSelectedProgId(e.target.value)}
                        className="w-full md:max-w-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                    >
                        {programs.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                    <button 
                        onClick={exportPDF}
                        disabled={!program}
                        className="flex items-center gap-2 px-5 py-3 bg-[#D6402F] text-white hover:bg-red-700 disabled:bg-slate-300 rounded-xl text-xs font-black uppercase shadow-lg transition-all cursor-pointer select-none whitespace-nowrap active:scale-95"
                    >
                        <Download size={14} /> Export PDF Report
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-xs text-slate-600 font-bold uppercase">
                    Generating Report Sheet...
                </div>
            ) : (
                program && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        
                        {/* Summary panel */}
                        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
                            <div>
                                <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                                    <FileText size={16} /> Performance Metrics
                                </h3>
                                <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-wider">Evaluation & Completion Summary</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs font-bold py-2 border-b border-slate-50">
                                    <span className="text-slate-800 uppercase text-[10px]">Trainees Enrolled</span>
                                    <span className="font-black text-black">{totalEnrolled}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold py-2 border-b border-slate-50">
                                    <span className="text-slate-800 uppercase text-[10px]">Trainees Completed</span>
                                    <span className="font-black text-black">{completedCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold py-2 border-b border-slate-50">
                                    <span className="text-slate-800 uppercase text-[10px]">Completion Rate</span>
                                    <span className="font-black text-black">{completionRate}%</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold py-2 border-b border-slate-50">
                                    <span className="text-slate-800 uppercase text-[10px]">Average Trainee Satisfaction</span>
                                    <span className="font-black text-amber-500">{avgSatisfaction} / 5.0</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold py-2 border-b border-slate-50">
                                    <span className="text-slate-800 uppercase text-[10px]">Average Post-Training Impact</span>
                                    <span className="font-black text-emerald-600">{avgPostScore} / 5.0</span>
                                </div>
                            </div>
                        </div>

                        {/* Middle panel: 5 step status audit */}
                        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3">
                                PRIME-HRM L&D Stage Compliance
                            </h3>
                            <div className="space-y-4 text-xs font-bold">
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                    <span className="text-black uppercase text-[10px]">Stage 1: Training Needs Survey (TNA)</span>
                                    <span className="bg-emerald-50 text-emerald-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100">completed</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                    <span className="text-black uppercase text-[10px]">Stage 2: Learning Objectives Formulation</span>
                                    <span className="bg-emerald-50 text-emerald-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100">completed</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                    <span className="text-black uppercase text-[10px]">Stage 3: Course Design & Methodology</span>
                                    <span className="bg-emerald-50 text-emerald-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100">completed</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                    <span className="text-black uppercase text-[10px]">Stage 4: Program Implementation</span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border
                                        ${program.step_4_status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-100'}`}
                                    >
                                        {program.step_4_status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                    <span className="text-black uppercase text-[10px]">Stage 5: Outcomes & Impact Assessment</span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border
                                        ${program.step_5_status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-slate-100 text-slate-800'}`}
                                    >
                                        {program.step_5_status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Program specifications details */}
                        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3">
                                Program Specifications
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-3 text-xs">
                                    <Calendar size={16} className="text-slate-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-wider">Schedule & Duration</p>
                                        <p className="font-black text-black">{program.schedule_date}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 text-xs">
                                    <Users size={16} className="text-slate-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-wider">Target Participants Profile</p>
                                        <p className="font-bold text-black">{program.target_participants}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 text-xs">
                                    <Target size={16} className="text-slate-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-wider font-bold">Training Objectives Listed</p>
                                        <ul className="list-disc pl-4 space-y-1 mt-1 font-semibold text-black text-[11px]">
                                            {objectives.map((o, i) => (
                                                <li key={i}>{o.objective_description}</li>
                                            ))}
                                            {objectives.length === 0 && <li>No objectives defined.</li>}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )
            )}
        </div>
    );
};

export default LDReportsScreen;
