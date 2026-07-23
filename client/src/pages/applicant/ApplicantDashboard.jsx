import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, Info, Clipboard, Briefcase, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const ApplicantDashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    // States
    const [vacancies, setVacancies] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [selectedVac, setSelectedVac] = useState(null);
    const [vacChecklist, setVacChecklist] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [applying, setApplying] = useState(false);
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [idNumber, setIdNumber] = useState(user?.mobile || '');
    const [criteriaAnswers, setCriteriaAnswers] = useState({}); // { criterion_id: boolean }
    const [documentsChecked, setDocumentsChecked] = useState({
        pds: false,
        tor: false,
        license: false
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch vacancies and applications
    const fetchData = async () => {
        try {
            setLoading(true);
            const [vacRes, appRes] = await Promise.all([
                fetch('http://localhost:5000/api/rsp/vacancies', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/rsp/applicants/my-applications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (vacRes.ok && appRes.ok) {
                const vacData = await vacRes.json();
                const appData = await appRes.json();
                setVacancies(vacData.filter(v => v.computed_status === 'active'));
                setMyApplications(appData);
            }
        } catch (e) {
            console.error("Failed to load applicant portal data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    // Fetch checklist when a vacancy is selected
    useEffect(() => {
        const fetchChecklist = async () => {
            if (!selectedVac) return;
            try {
                const res = await fetch(`http://localhost:5000/api/rsp/vacancies/${selectedVac.id}/checklist`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setVacChecklist(data);
                    // Initialize criteriaAnswers as false for all
                    const initialAnswers = {};
                    data.forEach(item => {
                        initialAnswers[item.id] = false;
                    });
                    setCriteriaAnswers(initialAnswers);
                }
            } catch (e) {
                console.error("Failed to fetch checklist", e);
            }
        };
        fetchChecklist();
    }, [selectedVac]);

    const handleApply = (vac) => {
        setSelectedVac(vac);
        setFullName(user?.fullName || '');
        setIdNumber(user?.mobile || '');
        setDocumentsChecked({ pds: false, tor: false, license: false });
        setApplying(true);
    };

    const handleSubmitApplication = async (e) => {
        e.preventDefault();
        if (!selectedVac) return;

        setSubmitting(true);
        try {
            // Construct criteriaAnswers payload array
            const answersArray = vacChecklist.map(c => ({
                criterion_id: c.id,
                passed: criteriaAnswers[c.id] || false
            }));

            // Construct documents checked payload array
            const documentsArray = [
                { document_type: 'Personal Data Sheet (PDS)', is_required: true },
                { document_type: 'Transcript of Records (TOR)', is_required: true },
                { document_type: 'PRC License / Eligibility Board Rating', is_required: true }
            ];

            const res = await fetch('http://localhost:5000/api/rsp/applicants/apply', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    vacancy_id: selectedVac.id,
                    full_name: fullName,
                    id_number: idNumber,
                    criteriaAnswers: answersArray,
                    documents: documentsArray
                })
            });

            if (res.ok) {
                alert("Application submitted successfully!");
                setApplying(false);
                setSelectedVac(null);
                fetchData(); // Refresh list and submissions
            } else {
                const data = await res.json();
                alert(`Error: ${data.message}`);
            }
        } catch (err) {
            alert("Could not connect to the server.");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'qualified': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'disqualified': return 'bg-red-100 text-red-800 border-red-200';
            case 'under_evaluation': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-amber-100 text-amber-800 border-amber-200';
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F3F6] flex flex-col font-sans select-none justify-between">
            {/* Header */}
            <header className="w-full bg-[#1B3A6B] text-white px-8 py-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                    <div className="bg-[#D6402F] p-1.5 rounded-lg shadow shrink-0">
                        <Shield size={16} className="text-white" fill="currentColor" />
                    </div>
                    <span className="font-black text-sm tracking-tight uppercase text-white">
                        <span className="hidden md:inline text-white">Human Resource Management Information System</span>
                        <span className="md:hidden text-white">HRMIS</span> &middot; DepEd Dapitan Applicant Portal
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {user?.role === 'employee' && (
                        <button 
                            onClick={() => navigate('/pm/employee/dashboard')}
                            className="flex items-center gap-2 px-4 py-1.5 bg-[#D6402F] hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-full transition-all active:scale-95 cursor-pointer shadow-sm"
                        >
                            Employee Portal
                        </button>
                    )}
                    <button 
                        onClick={logout} 
                        className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-[10px] uppercase tracking-widest rounded-full transition-all active:scale-95 cursor-pointer"
                    >
                        <LogOut size={12} /> Sign Out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow p-8 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="lg:col-span-3 flex flex-col items-center justify-center py-20 text-slate-600 font-bold uppercase text-xs">
                        <Loader2 className="animate-spin text-black mb-4" size={32} />
                        Loading Portal Database...
                    </div>
                ) : (
                    <>
                        {/* LEFT/CENTER: OPEN VACANCIES or FORM */}
                        <div className="lg:col-span-2 space-y-6">
                            {applying ? (
                                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6">
                                    <div className="flex justify-between items-start border-b pb-4">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Application Form</span>
                                            <h2 className="text-[14px] font-black text-black uppercase italic">{selectedVac?.position_title}</h2>
                                            <p className="text-[10px] font-bold text-slate-800 uppercase mt-0.5">{selectedVac?.ref_no} &middot; {selectedVac?.assigned_school}</p>
                                        </div>
                                        <button 
                                            onClick={() => setApplying(false)} 
                                            className="px-4 py-1.5 border border-slate-200 text-slate-800 rounded-full text-[10px] font-bold uppercase hover:bg-slate-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmitApplication} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-black mb-1 uppercase tracking-wider">Full Name</label>
                                                <input 
                                                    type="text" 
                                                    required 
                                                    value={fullName}
                                                    onChange={e => setFullName(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-black focus:ring-2 focus:ring-[#1B3A6B] outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-black mb-1 uppercase tracking-wider">Mobile / ID Number</label>
                                                <input 
                                                    type="text" 
                                                    required 
                                                    value={idNumber}
                                                    onChange={e => setIdNumber(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-black focus:ring-2 focus:ring-[#1B3A6B] outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Criteria Checklist */}
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black text-black uppercase tracking-wider">Minimum Qualification Standards (Self-Declaration)</h4>
                                            <div className="space-y-2">
                                                {vacChecklist.map(c => (
                                                    <label key={c.id} className="flex items-start gap-3 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-all select-none">
                                                        <input 
                                                            type="checkbox" 
                                                            className="mt-0.5 rounded text-black focus:ring-[#1B3A6B]"
                                                            checked={criteriaAnswers[c.id] || false}
                                                            onChange={e => setCriteriaAnswers({
                                                                ...criteriaAnswers,
                                                                [c.id]: e.target.checked
                                                            })}
                                                        />
                                                        <div>
                                                            <p className="text-xs font-bold text-black">{c.criterion_label}</p>
                                                            {c.is_required && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest block mt-0.5">Required Standard</span>}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Required Documents Upload Check */}
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black text-black uppercase tracking-wider">Document Checklist (Attach files offline/online)</h4>
                                            <div className="space-y-2">
                                                {[
                                                    { key: 'pds', label: 'Personal Data Sheet (CS Form 212 Revised 2017)' },
                                                    { key: 'tor', label: 'Transcript of Records (TOR) with Special Order' },
                                                    { key: 'license', label: 'PRC LET License / Board Rating Certificate' }
                                                ].map(d => (
                                                    <label key={d.key} className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-all select-none">
                                                        <input 
                                                            type="checkbox" 
                                                            required
                                                            className="rounded text-black focus:ring-[#1B3A6B]"
                                                            checked={documentsChecked[d.key]}
                                                            onChange={e => setDocumentsChecked({
                                                                ...documentsChecked,
                                                                [d.key]: e.target.checked
                                                            })}
                                                        />
                                                        <div>
                                                            <p className="text-xs font-bold text-black">{d.label}</p>
                                                            <span className="text-[8px] font-black text-[#D6402F] uppercase tracking-widest block mt-0.5">Mandatory File Attachment</span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <button 
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full bg-[#1B3A6B] hover:bg-[#162E55] text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                        >
                                            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Clipboard size={16} />}
                                            Submit Application to HR Division
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                                        <div className="bg-red-50 text-red-600 p-3 rounded-2xl">
                                            <Briefcase size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black text-black uppercase">Open Vacancies</h2>
                                            <p className="text-[10px] text-slate-600 font-bold uppercase">Apply for active teaching and administrative positions in Dapitan City</p>
                                        </div>
                                    </div>

                                    {vacancies.length === 0 ? (
                                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm text-slate-600 font-bold uppercase text-xs">
                                            No active open postings at the moment.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {vacancies.map(v => (
                                                <div key={v.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100">{v.ref_no}</span>
                                                            <span className="text-[8px] font-black text-slate-600 uppercase">SG {v.salary_grade}</span>
                                                        </div>
                                                        <h3 className="text-sm font-black text-black uppercase leading-tight">{v.position_title}</h3>
                                                        <p className="text-[10px] font-bold text-slate-600 uppercase">{v.assigned_school}</p>
                                                        <p className="text-[10px] text-slate-800 whitespace-pre-line leading-relaxed border-t pt-2 mt-2">{v.minimum_qualifications}</p>
                                                    </div>

                                                    <button 
                                                        onClick={() => handleApply(v)}
                                                        className="w-full bg-[#1B3A6B] hover:bg-[#162E55] text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-2xl transition-all shadow-sm text-center"
                                                    >
                                                        Apply for Position
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: SUBMISSIONS HISTORY */}
                        <div className="space-y-6">
                            <div className="bg-[#1B3A6B] text-white rounded-3xl p-6 shadow-md border border-white/5 space-y-4">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">My Applications</h3>
                                    <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5">Track your screening status</p>
                                </div>

                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                    {myApplications.length === 0 ? (
                                        <div className="text-center py-10 text-[10px] text-slate-800 font-bold uppercase">
                                            No submitted applications yet.
                                        </div>
                                    ) : (
                                        myApplications.map(app => (
                                            <div key={app.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                        <p className="text-xs font-black uppercase text-white truncate max-w-[160px]">{app.position_title}</p>
                                                        <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5">{app.applicant_code}</p>
                                                    </div>
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusColor(app.status)}`}>
                                                        {app.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-[8px] font-bold text-slate-600 uppercase pt-1 border-t border-white/5">
                                                    <span>{app.school_abbreviation}</span>
                                                    <span>{new Date(app.date_submitted).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Help & Privacy Banner */}
                            <div className="bg-amber-50 border border-amber-200/50 p-5 rounded-3xl space-y-2">
                                <div className="flex items-center gap-2 text-amber-800">
                                    <Info size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-wider">Hiring Guidelines</span>
                                </div>
                                <p className="text-[10px] text-amber-700 leading-relaxed font-bold">
                                    Applications are reviewed by the DepEd Division HRMPSB. Status changes will reflect here in real-time. Ensure documents are verified at the division office.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="w-full text-center py-4 bg-slate-100 border-t border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                DepEd SDO Zamboanga Peninsula &middot; Division of Dapitan City
            </footer>
        </div>
    );
};

export default ApplicantDashboard;
