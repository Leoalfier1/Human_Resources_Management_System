import React from 'react';
import { User } from 'lucide-react';

const Field = ({ label, value }) => (
    <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-0.5 text-xs font-black text-slate-700 min-h-[18px]">{value || '—'}</p>
    </div>
);

const CATEGORY_LABELS = {
    teacher_i: 'Teacher I - Teaching Position',
    teaching_related: 'Teaching Related Position',
    non_teaching: 'Non-Teaching Position',
};

const ApplicantInfoCard = ({ evaluation }) => {
    if (!evaluation) return null;

    return (
        <div className="rounded-[2.5rem] border border-slate-200 bg-white overflow-hidden">
            <div className="bg-[#1B3A6B] px-6 py-3 flex items-center gap-2">
                <User size={14} className="text-white" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Applicant Information</h3>
            </div>
            <div className="p-6 grid gap-x-8 gap-y-4 md:grid-cols-4">
                <Field label="Name of Applicant" value={evaluation.applicant_name} />
                <Field label="Application Code" value={evaluation.application_code} />
                <Field label="Office/School" value={evaluation.office || evaluation.assigned_school || evaluation.current_school} />
                <Field label="Contact Number" value={evaluation.contact_number || evaluation.applicant_phone} />
                <Field label="Position Development Officer" value={evaluation.evaluator_name} />
                <Field label="Date of Evaluation" value={evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
                <Field label="Position Applied For" value={evaluation.position_title} />
                <Field label="Job Group/SG-Level" value={evaluation.job_group_sg_level || (evaluation.salary_grade ? `SG-${evaluation.salary_grade}` : '—')} />
            </div>
        </div>
    );
};

export default ApplicantInfoCard;
