import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeft, Award, Download, AwardIcon, CheckSquare, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';

const LearningHistoryPage = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [completedList, setCompletedList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sdsName, setSdsName] = useState("Schools Division Superintendent");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/ld/employee/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const enrolled = data.enrolled || [];
                    setCompletedList(enrolled.filter(e => e.enrollment_status === 'completed'));
                    setSdsName(data.sdsName || "Schools Division Superintendent");
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchHistory();
    }, [token]);

    const handleDownloadCertificate = (en) => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Background decorative borders
        doc.setFillColor(27, 58, 107); // #1B3A6B SDO Blue
        doc.rect(5, 5, 287, 8, 'F');
        doc.rect(5, 197, 287, 8, 'F');

        doc.setFillColor(214, 64, 47); // #D6402F Red/Orange
        doc.rect(5, 13, 287, 2, 'F');
        doc.rect(5, 195, 287, 2, 'F');

        // Certificate content
        doc.setFont("times", "bold");
        doc.setFontSize(28);
        doc.setTextColor(27, 58, 107);
        doc.text("CERTIFICATE OF COMPLETION", 148, 60, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text("This is proudly presented to", 148, 85, { align: "center" });

        doc.setFont("times", "bolditalic");
        doc.setFontSize(22);
        doc.setTextColor(50, 50, 50);
        const recipientName = user?.fullName ? user.fullName.toUpperCase() : "MEMBER";
        doc.text(recipientName, 148, 100, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(120, 120, 120);
        doc.text("for successfully completing the professional learning & development program", 148, 115, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(27, 58, 107);
        doc.text(en.title.toUpperCase(), 148, 130, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Methodology: ${en.methodology.toUpperCase()} | Date: ${en.schedule_date}`, 148, 142, { align: "center" });
        doc.text(`Schools Division Office of Dapitan City · PRIME-HRM Compliance`, 148, 148, { align: "center" });

        // Signatures
        doc.line(70, 175, 120, 175);
        doc.text(sdsName ? sdsName.toUpperCase() : "SCHOOLS DIVISION SUPERINTENDENT", 95, 180, { align: "center" });
        doc.setFontSize(8);
        doc.text("Schools Division Superintendent", 95, 184, { align: "center" });

        doc.setFontSize(10);
        doc.line(177, 175, 227, 175);
        doc.text("HR L&D OFFICER", 202, 180, { align: "center" });
        doc.setFontSize(8);
        doc.text("Division Office of Dapitan City", 202, 184, { align: "center" });

        doc.save(`Certificate_${en.title.replace(/\s+/g, '_')}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-xs font-black uppercase text-slate-600">
                Loading Certificates Database...
            </div>
        );
    }

    return (
        <div className="space-y-6 select-none max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/employee/learning')}
                    className="p-2 bg-white border border-slate-100 rounded-full hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                    <ArrowLeft size={16} className="text-black" />
                </button>
                <div>
                    <h2 className="text-sm font-black text-black uppercase tracking-wider">My Learning History & Credentials</h2>
                    <p className="text-[10px] text-slate-600 font-bold uppercase">View completed courses and print certificates</p>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
                <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-50 pb-3 flex items-center gap-2">
                    <Award size={16} className="text-black" /> Issued Completion Certificates
                </h3>

                <div className="space-y-4">
                    {completedList.map((en) => (
                        <div key={en.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="space-y-1.5">
                                <h4 className="text-xs font-black text-black uppercase tracking-tight">{en.title}</h4>
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Completed: {en.schedule_date} &middot; Rating: {en.post_score || "5.0"} / 5.0</p>
                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-100">
                                    <CheckSquare size={10} /> Certified
                                </span>
                            </div>

                            <button 
                                onClick={() => handleDownloadCertificate(en)}
                                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#D6402F] hover:bg-red-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md transition-all cursor-pointer select-none active:scale-95"
                            >
                                <Download size={13} /> Download Certificate
                            </button>
                        </div>
                    ))}
                    {completedList.length === 0 && (
                        <div className="text-center py-8 text-xs text-slate-600 font-bold uppercase flex flex-col items-center gap-2">
                            <AlertCircle size={22} className="text-slate-300" />
                            No completed training modules found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LearningHistoryPage;
