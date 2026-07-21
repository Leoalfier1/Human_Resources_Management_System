import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Printer, Loader2 } from 'lucide-react';

const ATTESTATION_TEXT_APPLICANT = `We hereby attest that the individual evaluation of the above-named applicant has been conducted objectively, judiciously, and in accordance with the criteria and weights prescribed under DO 007, s. 2023 and pertinent PRIME-HRM guidelines.`;

const ATTESTATION_TEXT_CHAIR = `I attest to the objective and judicious conduct of the HRMPSB evaluation in accordance with the applicable guidelines, policies, and merit selection principles.`;

const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-PH', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

const SignatureBlock = ({ label, name, dateValue, caption, children }) => (
    <div className="rounded-2xl border border-slate-200 p-5">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-black uppercase text-slate-800 mt-3">
            {name || 'Pending signature'}
        </p>
        <div className="mt-3 border-b-2 border-slate-300" />
        <p className="text-[9px] font-bold text-slate-400 mt-1.5">{caption}</p>
        {children}
        <p className="text-[10px] font-bold text-slate-500 mt-3">
            DATE: {dateValue ? formatDate(dateValue) : 'mm/dd/yyyy'}
        </p>
    </div>
);

const AttestationCard = ({
    evaluation,
    isLocked,
    onSubmit,
    onAttestApplicant,
    onAttestChair,
    saving,
    downloadPDF,
    downloading
}) => {
    const [applicantModal, setApplicantModal] = useState(false);
    const [chairModal, setChairModal] = useState(false);
    const [applicantName, setApplicantName] = useState('');
    const [chairName, setChairName] = useState('');

    if (!evaluation) return null;

    const isDraft = evaluation.status === 'draft';
    const isSubmitted = evaluation.status === 'submitted';
    const isAttested = evaluation.status === 'attested';
    const hasApplicantAttested = !!evaluation.attested_by_applicant_at;
    const hasChairAttested = !!evaluation.attested_by_chair_at;

    const canSubmit = isDraft;
    const canAttestApplicant = (isSubmitted || isAttested) && !hasApplicantAttested;
    const canAttestChair = (isSubmitted || isAttested) && !hasChairAttested;

    return (
        <>
            <div className="rounded-[2.5rem] border border-slate-200 bg-white overflow-hidden">
                <div className="bg-[#1B3A6B] px-6 py-3 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-white" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Attestation</h3>
                </div>

                <div className="p-6 space-y-5">
                    <p className="text-xs italic text-slate-400 leading-relaxed">
                        {ATTESTATION_TEXT_APPLICANT}
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                        <SignatureBlock
                            label="Applicant"
                            name={hasApplicantAttested ? (evaluation.attested_by_applicant_signature_name || evaluation.applicant_name) : ''}
                            dateValue={evaluation.attested_by_applicant_at}
                            caption="Signature over Printed Name"
                        />
                        <SignatureBlock
                            label="HRMPSB Chairperson"
                            name={hasChairAttested ? (evaluation.attested_by_chair_signature_name || evaluation.chair_name) : ''}
                            dateValue={evaluation.attested_by_chair_at}
                            caption="Signature over Printed Name / CESO Rank"
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap justify-end gap-2 pt-2">
                        {canSubmit && (
                            <button
                                onClick={onSubmit}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#1B3A6B] px-5 py-2.5 text-[10px] font-black uppercase text-white hover:bg-[#152d55] transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Processing...' : 'Submit for Attestation'}
                            </button>
                        )}
                        {isAttested && (
                            <>
                                <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-2.5 text-[10px] font-black uppercase text-emerald-600">
                                    <CheckCircle2 size={14} /> Already Attested
                                </span>
                                <button
                                    onClick={() => downloadPDF(evaluation.id, evaluation.applicant_name)}
                                    disabled={downloading}
                                    className="inline-flex items-center gap-2 rounded-xl border border-[#1B3A6B]/20 px-5 py-2.5 text-[10px] font-black uppercase text-[#1B3A6B] hover:bg-[#1B3A6B]/5 transition-colors disabled:opacity-50"
                                >
                                    {downloading ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                                    Download PDF
                                </button>
                            </>
                        )}
                        {canAttestApplicant && (
                            <button
                                onClick={() => { setApplicantName(evaluation.applicant_name || ''); setApplicantModal(true); }}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl border border-[#1B3A6B]/20 px-5 py-2.5 text-[10px] font-black uppercase text-[#1B3A6B] hover:bg-[#1B3A6B]/5 transition-colors disabled:opacity-50"
                            >
                                <CheckCircle2 size={14} /> Applicant Attestation
                            </button>
                        )}
                        {canAttestChair && (
                            <button
                                onClick={() => { setChairName(evaluation.chair_name || ''); setChairModal(true); }}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#D6402F] px-5 py-2.5 text-[10px] font-black uppercase text-white hover:bg-[#b53526] transition-colors disabled:opacity-50"
                            >
                                <ShieldCheck size={14} /> Chair Attestation
                            </button>
                        )}
                        {isSubmitted && !hasApplicantAttested && !hasChairAttested && (
                            <span className="text-[10px] font-bold text-slate-400 italic self-center">
                                Awaiting applicant and chair attestations...
                            </span>
                        )}
                        {isSubmitted && hasApplicantAttested && !hasChairAttested && (
                            <span className="text-[10px] font-bold text-slate-400 italic self-center">
                                Applicant attested. Awaiting chair attestation.
                            </span>
                        )}
                        {isSubmitted && !hasApplicantAttested && hasChairAttested && (
                            <span className="text-[10px] font-bold text-slate-400 italic self-center">
                                Chair attested. Awaiting applicant attestation.
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Applicant Attestation Modal */}
            <AnimatePresence>
                {applicantModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.96, y: 12 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.96, y: 12 }}
                            className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl"
                        >
                            <h3 className="text-sm font-black uppercase text-[#1B3A6B]">Applicant Attestation</h3>
                            <p className="mt-2 text-xs text-slate-500">Type the applicant's full name as digital signature.</p>
                            <input
                                type="text"
                                value={applicantName}
                                onChange={(e) => setApplicantName(e.target.value)}
                                className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 outline-none focus:border-[#1B3A6B]"
                                placeholder="Full Name"
                            />
                            <div className="mt-5 flex justify-end gap-2">
                                <button onClick={() => setApplicantModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-[10px] font-black uppercase text-slate-500">Cancel</button>
                                <button
                                    onClick={() => { onAttestApplicant(applicantName); setApplicantModal(false); }}
                                    disabled={saving || !applicantName.trim()}
                                    className="rounded-xl bg-[#1B3A6B] px-4 py-2 text-[10px] font-black uppercase text-white disabled:opacity-50"
                                >
                                    {saving ? 'Processing...' : 'Confirm Attestation'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chair Attestation Modal */}
            <AnimatePresence>
                {chairModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.96, y: 12 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.96, y: 12 }}
                            className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl"
                        >
                            <h3 className="text-sm font-black uppercase text-[#1B3A6B]">HRMPSB Chair Attestation</h3>
                            <p className="mt-2 text-xs text-slate-500">Type the chairperson's full name and CESO rank as digital signature.</p>
                            <input
                                type="text"
                                value={chairName}
                                onChange={(e) => setChairName(e.target.value)}
                                className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 outline-none focus:border-[#1B3A6B]"
                                placeholder="Full Name / CESO Rank"
                            />
                            <div className="mt-5 flex justify-end gap-2">
                                <button onClick={() => setChairModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-[10px] font-black uppercase text-slate-500">Cancel</button>
                                <button
                                    onClick={() => { onAttestChair(chairName); setChairModal(false); }}
                                    disabled={saving || !chairName.trim()}
                                    className="rounded-xl bg-[#D6402F] px-4 py-2 text-[10px] font-black uppercase text-white disabled:opacity-50"
                                >
                                    {saving ? 'Processing...' : 'Confirm Attestation'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AttestationCard;
