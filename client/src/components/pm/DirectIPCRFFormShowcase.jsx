import React, { useState } from 'react';
import { Award, CheckCircle2, ShieldCheck, FileText, UserCheck, Printer, Download, Eye, Sparkles, Building2 } from 'lucide-react';

const FORMS_DATA = {
  teaching_related: {
    title: "Teaching-Related Personnel IPCRF",
    subtitle: "Education Program Specialist II / Supervisor / School Head Track",
    badge: "TEACHING RELATED",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    employeeName: "Raul M. Colot Jr.",
    position: "Education Program Specialist II",
    unit: "Curriculum Implementation Division (CID)",
    itemNo: "EPS2-52-009",
    raterName: "Jay Montealto, CESO V",
    raterTitle: "Schools Division Superintendent",
    approverName: "Dr. Elena M. Reyes",
    approverTitle: "Assistant Regional Director",
    kras: [
      {
        id: 1,
        kraName: "BASIC EDUCATION SERVICES DELIVERY / TECHNICAL ASSISTANCE",
        weight: "25.00%",
        objective: "Provide Technical Assistance (TA) and Instructional Supervision to school heads and teachers on curriculum contextualization and learning area delivery.",
        indicator: "100% of targeted schools provided with technical assistance reports, instructional supervision notes, and intervention plans.",
        target: "Conduct quarterly instructional monitoring and TA visits across 52 assigned division schools with documented TA reports by December 2026.",
        selfRating: 4.5,
        raterRating: 4.8,
        score: "1.2000"
      },
      {
        id: 2,
        kraName: "HUMAN RESOURCE MANAGEMENT & DEVELOPMENT / LRMDS QA",
        weight: "20.00%",
        objective: "Manage the development, quality assurance, and contextualization of Learning Action Cell (LAC) sessions and DepEd LRMDS learning resources.",
        indicator: "100% of submitted Learning Activity Sheets (LAS) and instructional modules quality-assured following DepEd LRMDS standards.",
        target: "Quality assure 25 CID learning resources and facilitate 4 division-wide LAC sessions for instructional leaders.",
        selfRating: 4.8,
        raterRating: 5.0,
        score: "1.0000"
      },
      {
        id: 3,
        kraName: "FINANCIAL & ADMINISTRATIVE MANAGEMENT / PROGRAM ASSESSMENT",
        weight: "20.00%",
        objective: "Monitor, evaluate, and analyze division-wide curriculum program implementation and learning assessment results for CID reporting.",
        indicator: "100% of learning assessment results analyzed with strategic intervention plans submitted to the CID Chief.",
        target: "Submit 4 quarterly Curriculum Assessment & Learning Achievement reports with zero delayed submissions.",
        selfRating: 4.5,
        raterRating: 4.7,
        score: "0.9400"
      },
      {
        id: 4,
        kraName: "GOVERNANCE & ORGANIZATIONAL PERFORMANCE / ACTION RESEARCH",
        weight: "20.00%",
        objective: "Facilitate action research initiatives, curriculum innovations, and PRIME-HRM alignment for CID teaching-related personnel.",
        indicator: "100% of approved Division action research proposals monitored with completed progress reports and Zero CSC findings.",
        target: "Evaluate 10 school action research proposals and submit complete CID PRIME-HRM documentary requirements by Q4 2026.",
        selfRating: 4.8,
        raterRating: 4.9,
        score: "0.9800"
      },
      {
        id: 5,
        kraName: "STAKEHOLDER ENGAGEMENT & PARTNERSHIP",
        weight: "15.00%",
        objective: "Convene quarterly CID Stakeholders Assemblies and foster strategic partnerships with LGUs and community partners for curriculum enrichment.",
        indicator: "100% quarterly stakeholders assemblies convened with signed MOUs/MOAs for curriculum support programs.",
        target: "Organize 4 quarterly CID Stakeholders Assemblies with 100% LGU and community partner participation.",
        selfRating: 5.0,
        raterRating: 5.0,
        score: "0.7500"
      }
    ],
    overallScore: "4.8700",
    adjectivalRating: "Outstanding"
  },

  non_teaching: {
    title: "Non-Teaching Personnel IPCRF",
    subtitle: "Administrative Officer V / ADAS / Accountant / IT Officer Track",
    badge: "NON-TEACHING",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    employeeName: "Maria Santos-Reyes",
    position: "Administrative Officer V",
    unit: "Finance & Administrative Division (OSDS)",
    itemNo: "AOV-12-004",
    raterName: "Jay Montealto, CESO V",
    raterTitle: "Schools Division Superintendent",
    approverName: "Dr. Elena M. Reyes",
    approverTitle: "Assistant Regional Director",
    kras: [
      {
        id: 1,
        kraName: "BASIC EDUCATION SUPPORT & FRONTLINE SERVICE DELIVERY",
        weight: "25.00%",
        objective: "Execute daily administrative, document processing, and customer support services in compliance with ARTA and DepEd Service Standards.",
        indicator: "100% of client requests, communications, and transactions processed within the prescribed 3-day turnaround time.",
        target: "Process 500+ administrative requests and communications with 100% compliance with DepEd Citizen's Charter timelines.",
        selfRating: 4.7,
        raterRating: 4.9,
        score: "1.2250"
      },
      {
        id: 2,
        kraName: "HUMAN RESOURCE & PERSONNEL RECORDS MANAGEMENT",
        weight: "20.00%",
        objective: "Manage personnel records, SALN filings, service cards, leave applications, and 201 files of division employees.",
        indicator: "100% of personnel files updated and archived in accordance with CSC and DepEd records management policies.",
        target: "Maintain 100% updated 201 files for 487 division employees with zero unarchived personnel documents by Q3 2026.",
        selfRating: 4.8,
        raterRating: 5.0,
        score: "1.0000"
      },
      {
        id: 3,
        kraName: "FINANCIAL, PROCUREMENT & SUPPLY OPERATIONS",
        weight: "20.00%",
        objective: "Facilitate timely preparation of disbursement vouchers, purchase requests, supply inventories, and financial liquidations.",
        indicator: "100% of procurement documents and financial vouchers processed with zero audit findings from COA.",
        target: "Process 150+ financial vouchers and conduct quarterly physical inventory count of division equipment with zero COA disallowances.",
        selfRating: 4.6,
        raterRating: 4.8,
        score: "0.9600"
      },
      {
        id: 4,
        kraName: "GOVERNANCE, ISO & PRIME-HRM COMPLIANCE",
        weight: "20.00%",
        objective: "Ensure organizational compliance with PRIME-HRM Level II, ISO 9001:2015 Quality Management, and office performance standards.",
        indicator: "100% compliance with PRIME-HRM documentary requirements and internal quality audit standards.",
        target: "Achieve 100% PRIME-HRM Level II evidence submission and pass annual ISO Quality Management System audit.",
        selfRating: 4.9,
        raterRating: 4.9,
        score: "0.9800"
      },
      {
        id: 5,
        kraName: "CLIENT FEEDBACK & CUSTOMER SATISFACTION",
        weight: "15.00%",
        objective: "Monitor client satisfaction feedback and resolve customer complaints and frontline inquiries efficiently.",
        indicator: "Maintain a 98% or higher Very Satisfactory client satisfaction rating on division frontline services.",
        target: "Collect 200+ Client Satisfaction Measurement (CSM) feedback forms with 98%+ positive rating.",
        selfRating: 5.0,
        raterRating: 5.0,
        score: "0.7500"
      }
    ],
    overallScore: "4.9150",
    adjectivalRating: "Outstanding"
  },

  teaching: {
    title: "Teaching Personnel IPCRF",
    subtitle: "Classroom Teacher I-III / Master Teacher I-IV Track",
    badge: "TEACHING (PPST)",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    employeeName: "Juan Dela Cruz",
    position: "Teacher III",
    unit: "Dapitan City National High School",
    itemNo: "T3-99-012",
    raterName: "Head Teacher VI",
    raterTitle: "Secondary School Principal II",
    approverName: "Jay Montealto, CESO V",
    approverTitle: "Schools Division Superintendent",
    kras: [
      {
        id: 1,
        kraName: "CONTENT KNOWLEDGE AND PEDAGOGY (PPST DOMAIN 1)",
        weight: "25.00%",
        objective: "Apply knowledge of content within and across curriculum teaching areas using research-based teaching strategies.",
        indicator: "COT Rating Sheet score of 7 (Outstanding) across 4 classroom observations.",
        target: "Achieve COT rating average of 6.8+ and implement 4 research-backed teaching modules.",
        selfRating: 4.5,
        raterRating: 4.8,
        score: "1.2000"
      },
      {
        id: 2,
        kraName: "LEARNING ENVIRONMENT & DIVERSITY OF LEARNERS (PPST DOMAIN 2 & 3)",
        weight: "25.00%",
        objective: "Establish a safe, secure, inclusive, and learner-centered environment that promotes fairness, respect, and care.",
        indicator: "Zero learner dropouts and 100% positive learner engagement feedback logs.",
        target: "Maintain 100% learner retention rate and implement individualized learning plans for 15 at-risk students.",
        selfRating: 4.7,
        raterRating: 4.9,
        score: "1.2250"
      },
      {
        id: 3,
        kraName: "CURRICULUM AND PLANNING (PPST DOMAIN 4)",
        weight: "20.00%",
        objective: "Plan, manage, and implement developmentally sequenced teaching and learning processes with Daily Lesson Logs (DLL).",
        indicator: "100% of Daily Lesson Logs (DLL) submitted on time with quality-checked learning activities.",
        target: "Submit 40 complete Daily Lesson Logs (DLL) aligned with Most Essential Learning Competencies (MELCs).",
        selfRating: 4.8,
        raterRating: 4.8,
        score: "0.9600"
      },
      {
        id: 4,
        kraName: "ASSESSMENT AND REPORTING (PPST DOMAIN 5)",
        weight: "20.00%",
        objective: "Design, select, organize, and use diagnostic, formative, and summative assessment strategies to monitor student progress.",
        indicator: "100% of quarterly grades and electronic class records submitted on time with item analysis.",
        target: "Achieve 85%+ Mean Percentage Score (MPS) in National/Quarterly Learning Assessments.",
        selfRating: 4.6,
        raterRating: 4.7,
        score: "0.9400"
      },
      {
        id: 5,
        kraName: "COMMUNITY LINKAGES & PLUS FACTOR (PPST DOMAIN 6 & 7)",
        weight: "10.00%",
        objective: "Establish learning environments that respond to community contexts and perform professional voluntary assignments.",
        indicator: "100% attendance in PTA assemblies and active leadership in school learning committees.",
        target: "Organize 4 quarterly Homeroom PTA assemblies and lead 1 division-approved school innovation project.",
        selfRating: 5.0,
        raterRating: 5.0,
        score: "0.5000"
      }
    ],
    overallScore: "4.8250",
    adjectivalRating: "Outstanding"
  }
};

const DirectIPCRFFormShowcase = () => {
  const [selectedTrack, setSelectedTrack] = useState('teaching_related');
  const formData = FORMS_DATA[selectedTrack];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-lg p-6 md:p-8 space-y-6 select-none max-w-6xl mx-auto my-6">
      
      {/* Top Bar / Direct Track Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-xl border border-blue-200 flex items-center gap-1.5 w-fit mb-1">
            <Sparkles size={12} /> Direct DepEd Form Showcase
          </span>
          <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Official DepEd IPCRF Form Viewer</h2>
          <p className="text-xs text-slate-500 font-semibold">Switch tracks below to preview exact IPCRF structures for Teaching-Related, Non-Teaching, and Teaching Personnel.</p>
        </div>

        {/* Track Selection Buttons */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1.5 shrink-0">
          <button
            onClick={() => setSelectedTrack('teaching_related')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedTrack === 'teaching_related'
                ? 'bg-[#1B3A6B] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            📑 Teaching-Related
          </button>
          <button
            onClick={() => setSelectedTrack('non_teaching')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedTrack === 'non_teaching'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            💼 Non-Teaching
          </button>
          <button
            onClick={() => setSelectedTrack('teaching')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedTrack === 'teaching'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            🎓 Teaching
          </button>
        </div>
      </div>

      {/* Official DepEd Form Header */}
      <div className="border-2 border-slate-800 rounded-3xl p-6 bg-slate-50/50 space-y-6">
        <div className="text-center space-y-1 border-b border-slate-300 pb-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Republic of the Philippines · Department of Education</p>
          <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
            INDIVIDUAL PERFORMANCE COMMITMENT AND REVIEW FORM (IPCRF)
          </h3>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className={`text-[10px] font-black uppercase px-3 py-0.5 rounded-full border ${formData.badgeColor}`}>
              {formData.badge}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Rating Period: CY 2026 (Annual Cycle)</span>
          </div>
        </div>

        {/* Employee Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-0.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name of Ratee</label>
            <p className="font-black text-slate-900">{formData.employeeName}</p>
            <p className="text-[10px] text-slate-500 font-bold">{formData.position}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-0.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Office / Unit</label>
            <p className="font-black text-slate-900">{formData.unit}</p>
            <p className="text-[10px] text-slate-500 font-bold">Plantilla: {formData.itemNo}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-0.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name of Rater</label>
            <p className="font-black text-slate-900">{formData.raterName}</p>
            <p className="text-[10px] text-slate-500 font-bold">{formData.raterTitle}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-0.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Approving Authority</label>
            <p className="font-black text-slate-900">{formData.approverName}</p>
            <p className="text-[10px] text-slate-500 font-bold">{formData.approverTitle}</p>
          </div>
        </div>

        {/* Form Part I Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} className="text-blue-700" /> Part I: Accomplishment of KRAs & Performance Objectives
            </h4>
            <div className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              Final Score: {formData.overallScore} ({formData.adjectivalRating})
            </div>
          </div>

          <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-xs bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-700">
                  <th className="px-4 py-3 w-1/4">Key Result Area (KRA) & Objectives</th>
                  <th className="px-4 py-3 w-1/4">Success Indicator & Target</th>
                  <th className="px-3 py-3 text-center w-16">Weight</th>
                  <th className="px-3 py-3 text-center w-16">Ratee</th>
                  <th className="px-3 py-3 text-center w-16">Rater</th>
                  <th className="px-4 py-3 text-right w-24">Weighted Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {formData.kras.map((kra) => (
                  <tr key={kra.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 align-top space-y-1">
                      <span className="text-[9px] font-black text-blue-900 uppercase block tracking-wider">{kra.kraName}</span>
                      <p className="font-bold text-slate-900 text-[11px] leading-snug">{kra.objective}</p>
                    </td>
                    <td className="px-4 py-3 align-top space-y-1">
                      <p className="text-[11px] text-slate-700 font-semibold leading-snug">{kra.indicator}</p>
                      <p className="text-[10px] text-slate-500 font-bold italic">Target: {kra.target}</p>
                    </td>
                    <td className="px-3 py-3 align-top text-center font-black text-slate-700">{kra.weight}</td>
                    <td className="px-3 py-3 align-top text-center font-black text-blue-700">{kra.selfRating.toFixed(1)}</td>
                    <td className="px-3 py-3 align-top text-center font-black text-emerald-700">{kra.raterRating.toFixed(1)}</td>
                    <td className="px-4 py-3 align-top text-right font-black text-slate-900">{kra.score}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black text-xs text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider">Overall Weighted Score (100% Total Weight):</td>
                  <td className="px-3 py-3 text-center text-blue-900">100%</td>
                  <td colSpan={2} className="px-3 py-3 text-center text-emerald-800 uppercase tracking-wider">{formData.adjectivalRating}</td>
                  <td className="px-4 py-3 text-right text-sm font-black text-blue-900">{formData.overallScore}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Part II Behavioral Competencies Preview */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <UserCheck size={14} className="text-emerald-600" /> Part II: Core Behavioral Competencies (DepEd Norms & Values)
          </h4>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-700">
            <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">1. Self-Management (5/5)</span>
            <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">2. Professionalism & Ethics (5/5)</span>
            <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">3. Results Focus (5/5)</span>
            <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">4. Teamwork (5/5)</span>
            <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">5. Service Orientation (5/5)</span>
            <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">6. Innovation (5/5)</span>
            <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">7. Gender Sensitivity (5/5)</span>
          </div>
        </div>

        {/* Official Signatures Block */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-white p-4 rounded-2xl border border-emerald-300 text-center space-y-1">
            <div className="font-serif italic font-black text-sm text-slate-900">✍️ {formData.employeeName}</div>
            <div className="text-[9px] font-black uppercase text-emerald-700 flex items-center justify-center gap-1">
              <CheckCircle2 size={11} /> Ratee Official Signature
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-300 text-center space-y-1">
            <div className="font-serif italic font-black text-sm text-slate-900">✍️ {formData.raterName}</div>
            <div className="text-[9px] font-black uppercase text-emerald-700 flex items-center justify-center gap-1">
              <ShieldCheck size={11} /> Rater Official Signature
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-300 text-center space-y-1">
            <div className="font-serif italic font-black text-sm text-slate-900">✍️ {formData.approverName}</div>
            <div className="text-[9px] font-black uppercase text-emerald-700 flex items-center justify-center gap-1">
              <CheckCircle2 size={11} /> Approving Authority Signature
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DirectIPCRFFormShowcase;
