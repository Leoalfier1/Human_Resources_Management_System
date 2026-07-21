import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, FileText, Loader2, Printer, Save, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../../../utils/api';

const formatDateTime = (value) => {
    if (!value) return 'Not yet attested';
    return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

const numeric = (value) => Number(value || 0).toFixed(2);

const Field = ({ label, value }) => (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-1 min-h-5 text-sm font-black text-slate-700">{value || '—'}</p>
    </div>
);

const CriterionRow = ({ criterion, onChange }) => {
    const max = Number(criterion.weight_allocation || 0);
    const score = Number(criterion.actual_score || 0);

    return (
        <tr className="align-top">
            <td className="border border-slate-200 p-3 text-xs font-black text-slate-700 print:p-2">
                {criterion.criteria_label}
            </td>
            <td className="border border-slate-200 p-3 text-center text-xs font-black text-slate-700 print:p-2">
                {numeric(max)}
            </td>
            <td className="border border-slate-200 p-2 print:p-2">
                <textarea
                    value={criterion.qualification_notes || ''}
                    onChange={(event) => onChange(criterion.criteria_key, { qualification_notes: event.target.value })}
                    className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-600 outline-none focus:border-[#1B3A6B] print:border-0 print:p-0"
                    placeholder="Details of Applicant's Actual Qualifications"
                />
            </td>
            <td className="border border-slate-200 p-2 print:p-2">
                <textarea
                    value={criterion.computation_notes || ''}
                    onChange={(event) => onChange(criterion.criteria_key, { computation_notes: event.target.value })}
                    className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-600 outline-none focus:border-[#1B3A6B] print:border-0 print:p-0"
                    placeholder="Computation"
                />
            </td>
            <td className="border border-slate-200 p-3 text-right print:p-2">
                <input
                    type="number"
                    min="0"
                    max={max}
                    step="0.01"
                    value={criterion.actual_score ?? 0}
                    onChange={(event) => {
                        const raw = Number(event.target.value || 0);
                        const clamped = Math.max(0, Math.min(max, raw));
                        onChange(criterion.criteria_key, { actual_score: clamped });
                    }}
                    className={`w-24 rounded-xl border px-3 py-2 text-right text-xs font-black outline-none print:border-0 ${score > max ? 'border-[#D6402F] text-[#D6402F]' : 'border-slate-200 text-slate-700 focus:border-[#1B3A6B]'}`}
                />
                {score > max && <p className="mt-1 text-[9px] font-black text-[#D6402F]">Max {numeric(max)}</p>}
            </td>
        </tr>
    );
};

const AttestationBlock = ({ title, name, timestamp, text }) => (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 print:rounded-none print:border-slate-400">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attested</p>
        <h4 className="mt-1 text-sm font-black uppercase text-[#1B3A6B]">{title}</h4>
        <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-600">{text}</p>
        <div className="mt-6 border-t border-slate-300 pt-3 text-center">
            <p className="text-sm font-black uppercase text-slate-800">{name || 'Pending digital signature'}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{formatDateTime(timestamp)}</p>
        </div>
    </div>
);

const ConfirmModal = ({ open, title, body, onCancel, onConfirm, busy }) => (
    <AnimatePresence>
        {open && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 print:hidden"
            >
                <motion.div
                    initial={{ scale: 0.96, y: 12 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.96, y: 12 }}
                    className="w-full max-w-md rounded-[2.5rem] bg-white p-7 shadow-2xl"
                >
                    <h3 className="text-lg font-black uppercase text-[#1B3A6B]">{title}</h3>
                    <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">{body}</p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 text-[10px] font-black uppercase text-slate-500">Cancel</button>
                        <button onClick={onConfirm} disabled={busy} className="rounded-xl bg-[#D6402F] px-4 py-2 text-[10px] font-black uppercase text-white disabled:opacity-50">
                            {busy ? 'Processing...' : 'Confirm'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

const IndividualEvaluationSheet = () => {
    const [vacancies, setVacancies] = useState([]);
    const [vacancyId, setVacancyId] = useState('');
    const [applications, setApplications] = useState([]);
    const [applicationId, setApplicationId] = useState('');
    const [evaluation, setEvaluation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [modal, setModal] = useState(null);

    useEffect(() => {
        const loadVacancies = async () => {
            setLoading(true);
            try {
                const response = await apiFetch('/rsp/vacancies');
                const data = response?.ok ? await response.json() : [];
                const list = Array.isArray(data) ? data : [];
                setVacancies(list);
                if (list.length > 0) setVacancyId(String(list[0].id));
            } catch (err) {
                setError(err.message || 'Could not load vacancies.');
            } finally {
                setLoading(false);
            }
        };
        loadVacancies();
    }, []);

    useEffect(() => {
        if (!vacancyId) return;
        const loadApplicants = async () => {
            setEvaluation(null);
            setApplicationId('');
            setError('');
            try {
                const response = await apiFetch(`/rsp/applicants?vacancy_id=${vacancyId}&status=qualified`);
                const data = response?.ok ? await response.json() : {};
                const list = Array.isArray(data.applicants) ? data.applicants : [];
                setApplications(list);
                if (list.length > 0) setApplicationId(String(list[0].id));
            } catch (err) {
                setError(err.message || 'Could not load qualified applicants.');
            }
        };
        loadApplicants();
    }, [vacancyId]);

    useEffect(() => {
        if (!applicationId) return;
        const openEvaluation = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await apiFetch(`/rsp/ies/${applicationId}`, { method: 'POST' });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Could not open IES.');
                setEvaluation(data);
            } catch (err) {
                setError(err.message || 'Could not open IES.');
                setEvaluation(null);
            } finally {
                setLoading(false);
            }
        };
        openEvaluation();
    }, [applicationId]);

    const runningTotal = evaluation?.criteria?.reduce((sum, row) => sum + Number(row.actual_score || 0), 0) || 0;

    const selectedVacancy = vacancies.find(v => String(v.id) === String(vacancyId));

    const updateCriterion = (criteriaKey, patch) => {
        setEvaluation(prev => ({
            ...prev,
            criteria: prev.criteria.map(row => row.criteria_key === criteriaKey ? { ...row, ...patch } : row)
        }));
    };

    const saveScores = async () => {
        if (!evaluation) return;
        setSaving(true);
        setError('');
        try {
            const response = await apiFetch(`/rsp/ies/${evaluation.id}/scores`, {
                method: 'PUT',
                body: JSON.stringify({ scores: evaluation.criteria })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not save IES scores.');
            setEvaluation(data);
        } catch (err) {
            setError(err.message || 'Could not save IES scores.');
        } finally {
            setSaving(false);
        }
    };

    const attest = async (payload) => {
        if (!evaluation) return;
        setSaving(true);
        setError('');
        try {
            const response = await apiFetch(`/rsp/ies/${evaluation.id}/attest`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not attest IES.');
            setEvaluation(data);
            setModal(null);
        } catch (err) {
            setError(err.message || 'Could not attest IES.');
        } finally {
            setSaving(false);
        }
    };

    if (loading && !evaluation) {
        return <div className="p-20 text-center text-sm font-black uppercase tracking-widest text-slate-400">Loading Individual Evaluation Sheet...</div>;
    }

    return (
        <div className="space-y-6 text-slate-700 print:bg-white print:text-black">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #ies-print-root, #ies-print-root * { visibility: visible; }
                    #ies-print-root { position: absolute; inset: 0; padding: 0; }
                    .print\\:hidden { display: none !important; }
                    textarea { resize: none !important; }
                }
            `}</style>

            <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recruitment, Selection and Placement</p>
                    <h2 className="text-2xl font-black uppercase italic text-[#1B3A6B]">Individual Evaluation Sheet</h2>
                    <p className="mt-1 text-xs font-bold text-slate-400">Annex G to DepEd Order No. 007, s. 2023</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select value={vacancyId} onChange={(event) => setVacancyId(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 outline-none">
                        {vacancies.map(vacancy => <option key={vacancy.id} value={vacancy.id}>{vacancy.position_title} · {vacancy.ref_no}</option>)}
                    </select>
                    <select value={applicationId} onChange={(event) => setApplicationId(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 outline-none">
                        {applications.map(app => <option key={app.id} value={app.id}>{app.full_name} · {app.applicant_code}</option>)}
                    </select>
                </div>
            </div>

            {error && <div className="rounded-2xl border border-[#D6402F]/20 bg-[#D6402F]/10 p-4 text-xs font-black text-[#D6402F] print:hidden">{error}</div>}

            {!evaluation ? (
                <div className="rounded-[2.5rem] border border-dashed border-slate-200 bg-white p-12 text-center text-sm font-black uppercase tracking-widest text-slate-400">
                    No qualified applicant selected for IES.
                </div>
            ) : (
                <div id="ies-print-root" className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-100 print:rounded-none print:p-0 print:shadow-none print:ring-0">
                    <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Annex G</p>
                            <h1 className="text-2xl font-black uppercase text-[#1B3A6B] print:text-black">Individual Evaluation Sheet</h1>
                            <p className="mt-1 text-xs font-bold text-slate-500">DepEd Order No. 007, s. 2023</p>
                        </div>
                        <div className="flex gap-2 print:hidden">
                            <button onClick={saveScores} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#1B3A6B] px-4 py-2 text-[10px] font-black uppercase text-white disabled:opacity-50">
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Scores
                            </button>
                            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-[#1B3A6B]/20 px-4 py-2 text-[10px] font-black uppercase text-[#1B3A6B]">
                                <Printer size={14} /> Generate PDF
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4 print:grid-cols-4">
                        <Field label="Name of Applicant" value={evaluation.applicant_name} />
                        <Field label="Application Code" value={evaluation.application_code} />
                        <Field label="Position Applied For" value={evaluation.position_title || selectedVacancy?.position_title} />
                        <Field label="Office" value={evaluation.office || evaluation.assigned_school} />
                        <Field label="Contact Number" value={evaluation.contact_number || evaluation.applicant_phone} />
                        <Field label="Job Group/SG-Level" value={evaluation.job_group_sg_level || (evaluation.salary_grade ? `SG-${evaluation.salary_grade}` : null)} />
                        <Field label="Position Category" value={`${evaluation.position_category}${evaluation.bracket_key ? ` · ${evaluation.bracket_key}` : ''}`} />
                        <Field label="Development Officer" value={evaluation.evaluator_name} />
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full min-w-[980px] border-collapse text-left print:min-w-0">
                            <thead>
                                <tr className="bg-[#1B3A6B] text-[10px] font-black uppercase tracking-widest text-white print:bg-white print:text-black">
                                    <th className="border border-slate-200 p-3">Criteria</th>
                                    <th className="w-28 border border-slate-200 p-3 text-center">Weight Allocation</th>
                                    <th className="border border-slate-200 p-3">Details of Applicant's Actual Qualifications</th>
                                    <th className="border border-slate-200 p-3">Computation</th>
                                    <th className="w-32 border border-slate-200 p-3 text-right">Actual Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {evaluation.criteria.map(criterion => (
                                    <CriterionRow key={criterion.criteria_key} criterion={criterion} onChange={updateCriterion} />
                                ))}
                                <tr className="bg-[#D6402F]/10 text-[#D6402F]">
                                    <td className="border border-slate-200 p-4 text-right text-sm font-black uppercase" colSpan="4">Total</td>
                                    <td className="border border-slate-200 p-4 text-right text-sm font-black">{numeric(runningTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 print:grid-cols-2">
                        <AttestationBlock
                            title="Applicant"
                            name={evaluation.attested_by_applicant_at ? evaluation.applicant_name : ''}
                            timestamp={evaluation.attested_by_applicant_at}
                            text="I attest to the conduct of the application process in accordance with applicable DepEd guidelines and acknowledge this Individual Evaluation Sheet as part of the recruitment, selection, and placement records."
                        />
                        <AttestationBlock
                            title="HRMPSB Chair"
                            name={evaluation.attested_by_chair_at ? evaluation.chair_name : ''}
                            timestamp={evaluation.attested_by_chair_at}
                            text="I attest to the objective and judicious conduct of the HRMPSB evaluation in accordance with the applicable guidelines, policies, and merit selection principles."
                        />
                    </div>

                    <div className="mt-5 flex flex-wrap justify-end gap-2 print:hidden">
                        <button onClick={() => setModal('applicant')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-[10px] font-black uppercase text-slate-600">
                            <CheckCircle2 size={14} /> Applicant Attestation
                        </button>
                        <button onClick={() => setModal('chair')} className="inline-flex items-center gap-2 rounded-xl bg-[#D6402F] px-4 py-2 text-[10px] font-black uppercase text-white">
                            <ShieldCheck size={14} /> Chair Attestation
                        </button>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={modal === 'applicant'}
                title="Applicant Attestation"
                body={`Capture digital attestation for ${evaluation?.applicant_name || 'the applicant'} using typed name and timestamp?`}
                busy={saving}
                onCancel={() => setModal(null)}
                onConfirm={() => attest({ applicant: true })}
            />
            <ConfirmModal
                open={modal === 'chair'}
                title="HRMPSB Chair Attestation"
                body="Capture your digital attestation as HRMPSB Chair/member for this Individual Evaluation Sheet?"
                busy={saving}
                onCancel={() => setModal(null)}
                onConfirm={() => attest({ chair: true })}
            />

            <div className="hidden print:block">
                <FileText size={1} />
            </div>
        </div>
    );
};

export default IndividualEvaluationSheet;
