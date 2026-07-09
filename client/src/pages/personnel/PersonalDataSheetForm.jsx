import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    User, Users, GraduationCap, Award, Briefcase, Heart, BookOpen, Star,
    ShieldAlert, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Save, Lock, ArrowLeft, ChevronRight, ChevronLeft
} from 'lucide-react';
import { usePersonalDataSheet } from '../../hooks/usePersonalDataSheet';

// ── SHARED FIELD COMPONENTS ─────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
    <div className="flex flex-col gap-1.5 min-w-0">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
            {label}{required && <span className="text-[#D6402F] ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] disabled:opacity-60 disabled:cursor-not-allowed transition-all";

const TextInput = ({ value, onChange, disabled, placeholder, type = 'text' }) => (
    <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        disabled={disabled} placeholder={placeholder} className={inputCls} />
);

const SelectInput = ({ value, onChange, disabled, options, placeholder }) => (
    <select value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled} className={inputCls}>
        <option value="">{placeholder || 'Select...'}</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
);

const SectionCard = ({ icon: Icon, title, subtitle, children }) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#1B3A6B] shrink-0">
                <Icon size={18} />
            </div>
            <div>
                <h3 className="font-black text-base text-[#1B3A6B] uppercase italic leading-none">{title}</h3>
                {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
            </div>
        </div>
        {children}
    </motion.div>
);

// ── EDUCATION ROW ────────────────────────────────────────────────────────────
const EducationRow = ({ entry, onChange, onRemove, disabled, showRemove }) => (
    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 relative">
        {showRemove && !disabled && (
            <button type="button" onClick={onRemove}
                className="absolute top-3 right-3 text-slate-300 hover:text-[#D6402F] transition-colors">
                <Trash2 size={15} />
            </button>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Name of School"><TextInput value={entry.school_name} onChange={v => onChange({ ...entry, school_name: v })} disabled={disabled} /></Field>
            <Field label="Degree / Course"><TextInput value={entry.degree_course} onChange={v => onChange({ ...entry, degree_course: v })} disabled={disabled} /></Field>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Field label="From"><TextInput value={entry.period_from} onChange={v => onChange({ ...entry, period_from: v })} disabled={disabled} placeholder="YYYY" /></Field>
            <Field label="To"><TextInput value={entry.period_to} onChange={v => onChange({ ...entry, period_to: v })} disabled={disabled} placeholder="YYYY" /></Field>
            <Field label="Units Earned"><TextInput value={entry.highest_level_units} onChange={v => onChange({ ...entry, highest_level_units: v })} disabled={disabled} placeholder="N/A" /></Field>
            <Field label="Year Graduated"><TextInput value={entry.year_graduated} onChange={v => onChange({ ...entry, year_graduated: v })} disabled={disabled} placeholder="N/A" /></Field>
            <Field label="Honors Received"><TextInput value={entry.scholarship_honors} onChange={v => onChange({ ...entry, scholarship_honors: v })} disabled={disabled} placeholder="N/A" /></Field>
        </div>
    </div>
);

// ── EMPTY ROW FACTORIES ───────────────────────────────────────────────────────
const emptyEduEntry       = () => ({ school_name: '', degree_course: '', period_from: '', period_to: '', highest_level_units: '', year_graduated: '', scholarship_honors: '' });
const emptyChild          = () => ({ full_name: '', date_of_birth: '' });
const emptyEligibility    = () => ({ eligibility_name: '', rating: '', exam_date: '', exam_place: '', license_number: '', license_validity: '' });
const emptyWorkExp        = () => ({ date_from: '', date_to: '', position_title: '', department_agency: '', monthly_salary: '', salary_grade: '', status_of_appointment: '', is_govt_service: '' });
const emptyVoluntaryWork  = () => ({ org_name_address: '', date_from: '', date_to: '', num_hours: '', position_nature: '' });
const emptyLDTraining     = () => ({ title: '', date_from: '', date_to: '', num_hours: '', ld_type: '', conducted_by: '' });
const emptySkill          = () => ({ skill: '' });
const emptyDistinction    = () => ({ distinction: '' });
const emptyMembership     = () => ({ organization: '' });
const emptyReference      = () => ({ name: '', address: '', tel_no: '' });
const emptyGovtId         = () => ({ id_type: '', id_license_no: '', date_place_issuance: '' });

// ── STEP INDICATOR ────────────────────────────────────────────────────────────
const STEPS = [
    { num: 1, label: 'C1 · Personal Info' },
    { num: 2, label: 'C2 · Eligibility & Work' },
    { num: 3, label: 'C3 · Training & Other' },
    { num: 4, label: 'C4 · Questions & Sign' },
];

const StepIndicator = ({ currentStep }) => (
    <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
            const done    = s.num < currentStep;
            const active  = s.num === currentStep;
            const isLast  = i === STEPS.length - 1;
            return (
                <div key={s.num} className="flex items-center gap-1">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
                        done   ? 'bg-emerald-100 text-emerald-700' :
                        active ? 'bg-[#1B3A6B] text-white shadow-md' :
                                 'bg-slate-100 text-slate-400'
                    }`}>
                        {done ? <CheckCircle2 size={11} /> : <span>{s.num}</span>}
                        <span className="hidden sm:inline">{s.label}</span>
                    </div>
                    {!isLast && <ChevronRight size={12} className="text-slate-300 shrink-0" />}
                </div>
            );
        })}
    </div>
);

// ── REQUIRED FIELDS PER STEP ─────────────────────────────────────────────────
const STEP1_REQUIRED = [
    { key: 'surname',              label: 'Surname' },
    { key: 'first_name',           label: 'First Name' },
    { key: 'date_of_birth',        label: 'Date of Birth' },
    { key: 'place_of_birth',       label: 'Place of Birth' },
    { key: 'sex',                  label: 'Sex' },
    { key: 'civil_status',         label: 'Civil Status' },
    { key: 'res_city_municipality',label: 'City / Municipality (Residential Address)' },
    { key: 'res_province',         label: 'Province (Residential Address)' },
    { key: 'mobile_no',            label: 'Mobile No.' },
    { key: 'email_address',        label: 'Email Address' },
];

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const PersonalDataSheetForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { pds, loading, saving, submitting, error, isComplete, save, submit } = usePersonalDataSheet();

    const [form, setForm]               = useState(null);
    const [step, setStep]               = useState(1);
    const [saveMsg, setSaveMsg]         = useState('');
    const [submitMsg, setSubmitMsg]     = useState(null);
    const [missingFields, setMissingFields] = useState([]);

    useEffect(() => {
        if (!pds) return;
        setForm({
            ...pds,
            children:                   pds.children || [],
            college:                    pds.college?.length ? pds.college : [emptyEduEntry()],
            graduate_studies:           pds.graduate_studies || [],
            elementary:                 pds.elementary || emptyEduEntry(),
            secondary:                  pds.secondary  || emptyEduEntry(),
            civil_service_eligibility:  pds.civil_service_eligibility?.length ? pds.civil_service_eligibility : [emptyEligibility(), emptyEligibility()],
            work_experience:            pds.work_experience?.length ? pds.work_experience : Array.from({ length: 7 }, emptyWorkExp),
            voluntary_work:             pds.voluntary_work?.length ? pds.voluntary_work : Array.from({ length: 3 }, emptyVoluntaryWork),
            ld_training:                pds.ld_training?.length ? pds.ld_training : Array.from({ length: 3 }, emptyLDTraining),
            special_skills:             pds.special_skills?.length ? pds.special_skills : [emptySkill(), emptySkill(), emptySkill()],
            non_academic_distinctions:  pds.non_academic_distinctions?.length ? pds.non_academic_distinctions : [emptyDistinction(), emptyDistinction()],
            membership_associations:    pds.membership_associations?.length ? pds.membership_associations : [emptyMembership(), emptyMembership(), emptyMembership()],
            // C4
            q34a_answer: pds.q34a_answer || '', q34a_details: pds.q34a_details || '',
            q34b_answer: pds.q34b_answer || '', q34b_details: pds.q34b_details || '',
            q35a_answer: pds.q35a_answer || '', q35a_details: pds.q35a_details || '',
            q35b_answer: pds.q35b_answer || '', q35b_details: pds.q35b_details || '',
            q35b_date_filed: pds.q35b_date_filed || '', q35b_case_status: pds.q35b_case_status || '',
            q36_answer:  pds.q36_answer  || '', q36_details:  pds.q36_details  || '',
            q37_answer:  pds.q37_answer  || '', q37_details:  pds.q37_details  || '',
            q38a_answer: pds.q38a_answer || '', q38a_details: pds.q38a_details || '',
            q38b_answer: pds.q38b_answer || '', q38b_details: pds.q38b_details || '',
            q39_answer:  pds.q39_answer  || '', q39_details:  pds.q39_details  || '',
            q40a_answer: pds.q40a_answer || '', q40a_details: pds.q40a_details || '',
            q40b_answer: pds.q40b_answer || '', q40b_details: pds.q40b_details || '',
            q40c_answer: pds.q40c_answer || '', q40c_details: pds.q40c_details || '',
            references:  pds.references?.length  ? pds.references  : [emptyReference(), emptyReference(), emptyReference()],
            govt_ids:    pds.govt_ids?.length    ? pds.govt_ids    : [emptyGovtId()],
            date_accomplished: pds.date_accomplished || '',
        });
    }, [pds]);

    const isLocked = pds?.status === 'submitted';
    const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const saveAll = async () => {
        if (!form) return;
        const { id, user_id, status, submitted_at, created_at, updated_at, ...rest } = form;
        setSaveMsg('');
        const result = await save(rest);
        setSaveMsg(result.success ? 'Saved!' : result.message || 'Save failed');
        setTimeout(() => setSaveMsg(''), 2500);
        return result;
    };

    const updateRow = (key, idx, entry) => {
        const next = [...form[key]]; next[idx] = entry; set(key, next);
    };
    const addRow    = (key, factory) => set(key, [...(form[key] || []), factory()]);
    const removeRow = (key, idx) => set(key, form[key].filter((_, i) => i !== idx));

    const goToStep = async (nextStep) => {
        if (nextStep > step) {
            // validate current step before advancing
            const required = step === 1 ? STEP1_REQUIRED : [];
            const missing  = required.filter(f => !form[f.key] || String(form[f.key]).trim() === '');
            if (missing.length > 0) {
                setMissingFields(missing.map(f => f.label));
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            setMissingFields([]);
            await saveAll();
        }
        setStep(nextStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (!window.confirm('Submit your Personal Data Sheet? Once submitted you will not be able to edit it without contacting HR.')) return;
        await saveAll();
        const result = await submit();
        setSubmitMsg(result);
        if (result.success) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (location.state?.returnTo) {
                setTimeout(() => {
                    navigate(location.state.returnTo, { replace: true });
                }, 1500);
            }
        }
    };

    if (loading || !form) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#1B3A6B]" size={32} />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading your Personal Data Sheet…</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md">
                <AlertCircle className="text-[#D6402F] mx-auto mb-3" size={28} />
                <p className="text-sm font-black text-red-600">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F1F3F6] pb-24">

            {/* ── STICKY HEADER ─────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button onClick={() => navigate('/pillars')}
                            className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#1B3A6B] transition-colors mb-2">
                            <ArrowLeft size={12} /> Back to Pillars
                        </button>
                        <h1 className="text-xl font-black text-[#1B3A6B] uppercase italic leading-none mb-1">
                            Personal Data Sheet
                        </h1>
                        <p className="text-xs font-bold text-slate-500">
                            CS Form No. 212 (Revised 2017)
                            <span className="text-slate-300 mx-2">·</span>
                            <span className="text-[#D6402F]">Required before applying for any position</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isLocked
                            ? <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-black text-emerald-700 uppercase">
                                <Lock size={14} /> Submitted &amp; Locked
                              </div>
                            : <StepIndicator currentStep={step} />
                        }
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 mt-8 space-y-6">

                {/* PDS completeness requirement redirect warning */}
                {location.state?.pdsRequired && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
                        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">
                                Complete PDS Required
                            </p>
                            <p className="text-xs font-bold text-amber-700 leading-relaxed">
                                {location.state.message || 'You must complete and submit your Personal Data Sheet (PDS) before you can apply for a position.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Missing fields banner */}
                {missingFields.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={16} className="text-[#D6402F] shrink-0" />
                            <p className="text-xs font-black text-red-600 uppercase">Please fill in the following required fields before continuing:</p>
                        </div>
                        <ul className="list-disc list-inside space-y-1">
                            {missingFields.map(f => (
                                <li key={f} className="text-xs font-bold text-red-500">{f}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Submit result message */}
                {submitMsg && (
                    <div className={`rounded-2xl p-4 flex items-center gap-3 border ${submitMsg.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        {submitMsg.success ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertCircle size={18} className="text-[#D6402F] shrink-0" />}
                        <p className={`text-xs font-bold ${submitMsg.success ? 'text-emerald-700' : 'text-red-600'}`}>{submitMsg.message}</p>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    STEP 1 — C1: Personal Info, Family, Education
                ═══════════════════════════════════════════════════ */}
                {step === 1 && (
                    <AnimatePresence mode="wait">
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

                        {/* I. PERSONAL INFORMATION */}
                        <SectionCard icon={User} title="I. Personal Information" subtitle="Name, birth details, and contact information">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                <Field label="Surname" required><TextInput value={form.surname} onChange={v => set('surname', v)} disabled={isLocked} /></Field>
                                <Field label="First Name" required><TextInput value={form.first_name} onChange={v => set('first_name', v)} disabled={isLocked} /></Field>
                                <Field label="Middle Name"><TextInput value={form.middle_name} onChange={v => set('middle_name', v)} disabled={isLocked} /></Field>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
                                <Field label="Name Extension"><TextInput value={form.name_extension} onChange={v => set('name_extension', v)} disabled={isLocked} placeholder="JR., SR., III" /></Field>
                                <Field label="Date of Birth" required><TextInput type="date" value={form.date_of_birth ? String(form.date_of_birth).slice(0,10) : ''} onChange={v => set('date_of_birth', v)} disabled={isLocked} /></Field>
                                <Field label="Place of Birth" required><TextInput value={form.place_of_birth} onChange={v => set('place_of_birth', v)} disabled={isLocked} /></Field>
                                <Field label="Sex" required>
                                    <SelectInput value={form.sex} onChange={v => set('sex', v)} disabled={isLocked}
                                        options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
                                <Field label="Civil Status" required>
                                    <SelectInput value={form.civil_status} onChange={v => set('civil_status', v)} disabled={isLocked}
                                        options={[{ value:'single',label:'Single'},{value:'married',label:'Married'},{value:'widowed',label:'Widowed'},{value:'separated',label:'Separated'},{value:'others',label:'Others'}]} />
                                </Field>
                                <Field label="Height (m)"><TextInput type="number" value={form.height_m} onChange={v => set('height_m', v)} disabled={isLocked} placeholder="1.68" /></Field>
                                <Field label="Weight (kg)"><TextInput type="number" value={form.weight_kg} onChange={v => set('weight_kg', v)} disabled={isLocked} placeholder="61" /></Field>
                                <Field label="Blood Type"><TextInput value={form.blood_type} onChange={v => set('blood_type', v)} disabled={isLocked} placeholder="O, A, B, AB" /></Field>
                            </div>

                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-2">Government ID Numbers</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                <Field label="GSIS ID No."><TextInput value={form.gsis_id_no} onChange={v => set('gsis_id_no', v)} disabled={isLocked} /></Field>
                                <Field label="PAG-IBIG ID No."><TextInput value={form.pagibig_id_no} onChange={v => set('pagibig_id_no', v)} disabled={isLocked} /></Field>
                                <Field label="PhilHealth No."><TextInput value={form.philhealth_no} onChange={v => set('philhealth_no', v)} disabled={isLocked} /></Field>
                                <Field label="SSS No."><TextInput value={form.sss_no} onChange={v => set('sss_no', v)} disabled={isLocked} /></Field>
                                <Field label="TIN No."><TextInput value={form.tin_no} onChange={v => set('tin_no', v)} disabled={isLocked} /></Field>
                                <Field label="Agency Employee No."><TextInput value={form.agency_employee_no} onChange={v => set('agency_employee_no', v)} disabled={isLocked} /></Field>
                            </div>

                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-2">Citizenship</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                <Field label="Citizenship">
                                    <SelectInput value={form.citizenship} onChange={v => set('citizenship', v)} disabled={isLocked}
                                        options={[{value:'filipino',label:'Filipino'},{value:'dual_citizen',label:'Dual Citizen'}]} />
                                </Field>
                                {form.citizenship === 'dual_citizen' && (<>
                                    <Field label="By Birth / Naturalization">
                                        <SelectInput value={form.dual_citizenship_type} onChange={v => set('dual_citizenship_type', v)} disabled={isLocked}
                                            options={[{value:'by_birth',label:'By Birth'},{value:'by_naturalization',label:'By Naturalization'}]} />
                                    </Field>
                                    <Field label="Country"><TextInput value={form.dual_citizenship_country} onChange={v => set('dual_citizenship_country', v)} disabled={isLocked} /></Field>
                                </>)}
                            </div>

                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-2">Residential Address</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-2">
                                <Field label="House / Block / Lot No."><TextInput value={form.res_house_block_lot} onChange={v => set('res_house_block_lot', v)} disabled={isLocked} /></Field>
                                <Field label="Street"><TextInput value={form.res_street} onChange={v => set('res_street', v)} disabled={isLocked} /></Field>
                                <Field label="Subdivision / Village"><TextInput value={form.res_subdivision_village} onChange={v => set('res_subdivision_village', v)} disabled={isLocked} /></Field>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                                <Field label="Barangay"><TextInput value={form.res_barangay} onChange={v => set('res_barangay', v)} disabled={isLocked} /></Field>
                                <Field label="City / Municipality" required><TextInput value={form.res_city_municipality} onChange={v => set('res_city_municipality', v)} disabled={isLocked} /></Field>
                                <Field label="Province" required><TextInput value={form.res_province} onChange={v => set('res_province', v)} disabled={isLocked} /></Field>
                                <Field label="Zip Code"><TextInput value={form.res_zip_code} onChange={v => set('res_zip_code', v)} disabled={isLocked} /></Field>
                            </div>

                            <div className="flex items-center justify-between mb-3 mt-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permanent Address</p>
                                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 cursor-pointer">
                                    <input type="checkbox" disabled={isLocked} checked={!!form.perm_same_as_residential}
                                        onChange={e => {
                                            const same = e.target.checked;
                                            setForm(prev => ({
                                                ...prev, perm_same_as_residential: same,
                                                ...(same ? {
                                                    perm_house_block_lot: prev.res_house_block_lot, perm_street: prev.res_street,
                                                    perm_subdivision_village: prev.res_subdivision_village, perm_barangay: prev.res_barangay,
                                                    perm_city_municipality: prev.res_city_municipality, perm_province: prev.res_province,
                                                    perm_zip_code: prev.res_zip_code
                                                } : {})
                                            }));
                                        }}
                                        className="rounded border-slate-300 text-[#1B3A6B]" />
                                    Same as residential address
                                </label>
                            </div>
                            {!form.perm_same_as_residential && (<>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-2">
                                    <Field label="House / Block / Lot No."><TextInput value={form.perm_house_block_lot} onChange={v => set('perm_house_block_lot', v)} disabled={isLocked} /></Field>
                                    <Field label="Street"><TextInput value={form.perm_street} onChange={v => set('perm_street', v)} disabled={isLocked} /></Field>
                                    <Field label="Subdivision / Village"><TextInput value={form.perm_subdivision_village} onChange={v => set('perm_subdivision_village', v)} disabled={isLocked} /></Field>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                                    <Field label="Barangay"><TextInput value={form.perm_barangay} onChange={v => set('perm_barangay', v)} disabled={isLocked} /></Field>
                                    <Field label="City / Municipality"><TextInput value={form.perm_city_municipality} onChange={v => set('perm_city_municipality', v)} disabled={isLocked} /></Field>
                                    <Field label="Province"><TextInput value={form.perm_province} onChange={v => set('perm_province', v)} disabled={isLocked} /></Field>
                                    <Field label="Zip Code"><TextInput value={form.perm_zip_code} onChange={v => set('perm_zip_code', v)} disabled={isLocked} /></Field>
                                </div>
                            </>)}

                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-2">Contact Information</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <Field label="Telephone No."><TextInput value={form.telephone_no} onChange={v => set('telephone_no', v)} disabled={isLocked} placeholder="N/A" /></Field>
                                <Field label="Mobile No." required><TextInput value={form.mobile_no} onChange={v => set('mobile_no', v)} disabled={isLocked} /></Field>
                                <Field label="Email Address" required><TextInput type="email" value={form.email_address} onChange={v => set('email_address', v)} disabled={isLocked} /></Field>
                            </div>
                        </SectionCard>

                        {/* II. FAMILY BACKGROUND */}
                        <SectionCard icon={Users} title="II. Family Background" subtitle="Spouse, parents, and children">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Spouse</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-3">
                                <Field label="Surname"><TextInput value={form.spouse_surname} onChange={v => set('spouse_surname', v)} disabled={isLocked} placeholder="N/A" /></Field>
                                <Field label="First Name"><TextInput value={form.spouse_first_name} onChange={v => set('spouse_first_name', v)} disabled={isLocked} placeholder="N/A" /></Field>
                                <Field label="Middle Name"><TextInput value={form.spouse_middle_name} onChange={v => set('spouse_middle_name', v)} disabled={isLocked} placeholder="N/A" /></Field>
                                <Field label="Name Extension"><TextInput value={form.spouse_name_extension} onChange={v => set('spouse_name_extension', v)} disabled={isLocked} placeholder="N/A" /></Field>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                                <Field label="Occupation"><TextInput value={form.spouse_occupation} onChange={v => set('spouse_occupation', v)} disabled={isLocked} placeholder="N/A" /></Field>
                                <Field label="Employer / Business Name"><TextInput value={form.spouse_employer_business_name} onChange={v => set('spouse_employer_business_name', v)} disabled={isLocked} placeholder="N/A" /></Field>
                                <Field label="Business Address"><TextInput value={form.spouse_business_address} onChange={v => set('spouse_business_address', v)} disabled={isLocked} placeholder="N/A" /></Field>
                                <Field label="Telephone No."><TextInput value={form.spouse_telephone_no} onChange={v => set('spouse_telephone_no', v)} disabled={isLocked} placeholder="N/A" /></Field>
                            </div>

                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Father</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                                <Field label="Surname"><TextInput value={form.father_surname} onChange={v => set('father_surname', v)} disabled={isLocked} /></Field>
                                <Field label="First Name"><TextInput value={form.father_first_name} onChange={v => set('father_first_name', v)} disabled={isLocked} /></Field>
                                <Field label="Middle Name"><TextInput value={form.father_middle_name} onChange={v => set('father_middle_name', v)} disabled={isLocked} /></Field>
                                <Field label="Name Extension"><TextInput value={form.father_name_extension} onChange={v => set('father_name_extension', v)} disabled={isLocked} placeholder="N/A" /></Field>
                            </div>

                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mother's Maiden Name</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                                <Field label="Surname"><TextInput value={form.mother_maiden_surname} onChange={v => set('mother_maiden_surname', v)} disabled={isLocked} /></Field>
                                <Field label="First Name"><TextInput value={form.mother_first_name} onChange={v => set('mother_first_name', v)} disabled={isLocked} /></Field>
                                <Field label="Middle Name"><TextInput value={form.mother_middle_name} onChange={v => set('mother_middle_name', v)} disabled={isLocked} /></Field>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Children</p>
                                {!isLocked && <button type="button" onClick={() => addRow('children', emptyChild)} className="flex items-center gap-1.5 text-[10px] font-black text-[#1B3A6B] uppercase hover:underline"><Plus size={13} /> Add Child</button>}
                            </div>
                            {!form.children?.length
                                ? <p className="text-xs font-bold text-slate-400 italic">No children added.</p>
                                : <div className="space-y-3">
                                    {form.children.map((child, idx) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_180px_40px] gap-3 items-end">
                                            <Field label="Full Name"><TextInput value={child.full_name} onChange={v => updateRow('children', idx, { ...child, full_name: v })} disabled={isLocked} /></Field>
                                            <Field label="Date of Birth"><TextInput type="date" value={child.date_of_birth} onChange={v => updateRow('children', idx, { ...child, date_of_birth: v })} disabled={isLocked} /></Field>
                                            {!isLocked && <button type="button" onClick={() => removeRow('children', idx)} className="h-[42px] flex items-center justify-center text-slate-300 hover:text-[#D6402F]"><Trash2 size={16} /></button>}
                                        </div>
                                    ))}
                                  </div>
                            }
                        </SectionCard>

                        {/* III. EDUCATIONAL BACKGROUND */}
                        <SectionCard icon={GraduationCap} title="III. Educational Background" subtitle="Elementary through Graduate Studies">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Elementary</p>
                            <div className="mb-6"><EducationRow entry={form.elementary} onChange={v => set('elementary', v)} disabled={isLocked} showRemove={false} /></div>

                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Secondary</p>
                            <div className="mb-6"><EducationRow entry={form.secondary} onChange={v => set('secondary', v)} disabled={isLocked} showRemove={false} /></div>

                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">College</p>
                                {!isLocked && <button type="button" onClick={() => addRow('college', emptyEduEntry)} className="flex items-center gap-1.5 text-[10px] font-black text-[#1B3A6B] uppercase hover:underline"><Plus size={13} /> Add Entry</button>}
                            </div>
                            <div className="space-y-3 mb-6">
                                {form.college.map((e, idx) => <EducationRow key={idx} entry={e} onChange={v => updateRow('college', idx, v)} onRemove={() => removeRow('college', idx)} disabled={isLocked} showRemove={form.college.length > 1} />)}
                            </div>

                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Graduate Studies</p>
                                {!isLocked && <button type="button" onClick={() => addRow('graduate_studies', emptyEduEntry)} className="flex items-center gap-1.5 text-[10px] font-black text-[#1B3A6B] uppercase hover:underline"><Plus size={13} /> Add Entry</button>}
                            </div>
                            {!form.graduate_studies?.length
                                ? <p className="text-xs font-bold text-slate-400 italic">No graduate studies added.</p>
                                : <div className="space-y-3">{form.graduate_studies.map((e, idx) => <EducationRow key={idx} entry={e} onChange={v => updateRow('graduate_studies', idx, v)} onRemove={() => removeRow('graduate_studies', idx)} disabled={isLocked} showRemove />)}</div>
                            }
                        </SectionCard>

                        {/* Step 1 footer */}
                        {!isLocked && (
                            <div className="flex justify-between items-center pb-8">
                                <button onClick={() => saveAll()} disabled={saving}
                                    className="flex items-center gap-2 px-6 py-3 border-2 border-[#1B3A6B] text-[#1B3A6B] rounded-xl text-xs font-black uppercase hover:bg-blue-50 transition-all disabled:opacity-50">
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Draft
                                </button>
                                <div className="flex items-center gap-3">
                                    {saveMsg && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} />{saveMsg}</span>}
                                    <button onClick={() => goToStep(2)}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#1B3A6B] text-white rounded-xl text-xs font-black uppercase hover:bg-[#162E55] shadow-lg transition-all">
                                        Continue to C2 <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* ═══════════════════════════════════════════════════
                    STEP 2 — C2: Civil Service Eligibility & Work Experience
                ═══════════════════════════════════════════════════ */}
                {step === 2 && (
                    <AnimatePresence mode="wait">
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

                        {/* IV. CIVIL SERVICE ELIGIBILITY */}
                        <SectionCard icon={Award} title="IV. Civil Service Eligibility" subtitle="Career Service / RA 1080 / Special Laws / CES / CSEE / Barangay Eligibility / Driver's License">
                            <div className="flex justify-end mb-3">
                                {!isLocked && <button type="button" onClick={() => addRow('civil_service_eligibility', emptyEligibility)} className="flex items-center gap-1.5 text-[10px] font-black text-[#1B3A6B] uppercase hover:underline"><Plus size={13} /> Add Eligibility</button>}
                            </div>
                            <div className="hidden md:grid grid-cols-[1.6fr_0.7fr_0.9fr_1.3fr_0.9fr_0.7fr_32px] gap-3 px-1 mb-2">
                                {['Eligibility / Examination','Rating','Exam Date','Place of Examination','License No.','Validity',''].map(h => (
                                    <span key={h} className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</span>
                                ))}
                            </div>
                            <div className="space-y-2">
                                {form.civil_service_eligibility.map((entry, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-[1.6fr_0.7fr_0.9fr_1.3fr_0.9fr_0.7fr_32px] gap-3 items-center bg-slate-50 md:bg-transparent rounded-xl md:rounded-none p-3 md:p-0">
                                        <TextInput value={entry.eligibility_name} onChange={v => updateRow('civil_service_eligibility', idx, { ...entry, eligibility_name: v })} disabled={isLocked} placeholder="e.g. LET, CSC Professional" />
                                        <TextInput value={entry.rating} onChange={v => updateRow('civil_service_eligibility', idx, { ...entry, rating: v })} disabled={isLocked} placeholder="N/A" />
                                        <TextInput type="date" value={entry.exam_date} onChange={v => updateRow('civil_service_eligibility', idx, { ...entry, exam_date: v })} disabled={isLocked} />
                                        <TextInput value={entry.exam_place} onChange={v => updateRow('civil_service_eligibility', idx, { ...entry, exam_place: v })} disabled={isLocked} placeholder="N/A" />
                                        <TextInput value={entry.license_number} onChange={v => updateRow('civil_service_eligibility', idx, { ...entry, license_number: v })} disabled={isLocked} placeholder="N/A" />
                                        <TextInput type="date" value={entry.license_validity} onChange={v => updateRow('civil_service_eligibility', idx, { ...entry, license_validity: v })} disabled={isLocked} />
                                        {!isLocked && form.civil_service_eligibility.length > 1 && (
                                            <button type="button" onClick={() => removeRow('civil_service_eligibility', idx)} className="h-[42px] flex items-center justify-center text-slate-300 hover:text-[#D6402F]"><Trash2 size={15} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* V. WORK EXPERIENCE */}
                        <SectionCard icon={Briefcase} title="V. Work Experience" subtitle="Include private employment. Start from your most recent work.">
                            <div className="flex justify-end mb-3">
                                {!isLocked && <button type="button" onClick={() => addRow('work_experience', emptyWorkExp)} className="flex items-center gap-1.5 text-[10px] font-black text-[#1B3A6B] uppercase hover:underline"><Plus size={13} /> Add Row</button>}
                            </div>
                            <div className="space-y-3">
                                {form.work_experience.map((entry, idx) => (
                                    <div key={idx} className="bg-slate-50 rounded-xl p-5 border border-slate-100 relative">
                                        {!isLocked && form.work_experience.length > 1 && (
                                            <button type="button" onClick={() => removeRow('work_experience', idx)} className="absolute top-3 right-3 text-slate-300 hover:text-[#D6402F] transition-colors"><Trash2 size={15} /></button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <Field label="Position Title"><TextInput value={entry.position_title} onChange={v => updateRow('work_experience', idx, { ...entry, position_title: v })} disabled={isLocked} /></Field>
                                            <Field label="Department / Agency / Office / Company"><TextInput value={entry.department_agency} onChange={v => updateRow('work_experience', idx, { ...entry, department_agency: v })} disabled={isLocked} /></Field>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <Field label="From"><TextInput type="date" value={entry.date_from} onChange={v => updateRow('work_experience', idx, { ...entry, date_from: v })} disabled={isLocked} /></Field>
                                            <Field label="To"><TextInput type="date" value={entry.date_to} onChange={v => updateRow('work_experience', idx, { ...entry, date_to: v })} disabled={isLocked} placeholder="Present" /></Field>
                                            <Field label="Monthly Salary"><TextInput type="number" value={entry.monthly_salary} onChange={v => updateRow('work_experience', idx, { ...entry, monthly_salary: v })} disabled={isLocked} /></Field>
                                            <Field label="Salary Grade / Step"><TextInput value={entry.salary_grade} onChange={v => updateRow('work_experience', idx, { ...entry, salary_grade: v })} disabled={isLocked} placeholder="N/A" /></Field>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Field label="Status of Appointment">
                                                <SelectInput value={entry.status_of_appointment} onChange={v => updateRow('work_experience', idx, { ...entry, status_of_appointment: v })} disabled={isLocked}
                                                    options={[{value:'permanent',label:'Permanent'},{value:'temporary',label:'Temporary'},{value:'casual',label:'Casual'},{value:'contractual',label:'Contractual'},{value:'regular',label:'Regular'},{value:'coterminous',label:'Co-Terminous'}]} />
                                            </Field>
                                            <Field label="Gov't Service?">
                                                <SelectInput value={entry.is_govt_service} onChange={v => updateRow('work_experience', idx, { ...entry, is_govt_service: v })} disabled={isLocked}
                                                    options={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]} />
                                            </Field>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Step 2 footer */}
                        {!isLocked && (
                            <div className="flex justify-between items-center pb-8">
                                <button onClick={() => goToStep(1)} className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase hover:bg-slate-50 transition-all">
                                    <ChevronLeft size={16} /> Back to C1
                                </button>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => saveAll()} disabled={saving}
                                        className="flex items-center gap-2 px-5 py-3 border-2 border-[#1B3A6B] text-[#1B3A6B] rounded-xl text-xs font-black uppercase hover:bg-blue-50 transition-all disabled:opacity-50">
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Draft
                                    </button>
                                    {saveMsg && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} />{saveMsg}</span>}
                                    <button onClick={() => goToStep(3)}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#1B3A6B] text-white rounded-xl text-xs font-black uppercase hover:bg-[#162E55] shadow-lg transition-all">
                                        Continue to C3 <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* ═══════════════════════════════════════════════════
                    STEP 3 — C3: Voluntary Work, L&D Training, Other Info
                ═══════════════════════════════════════════════════ */}
                {step === 3 && (
                    <AnimatePresence mode="wait">
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

                        {/* VI. VOLUNTARY WORK */}
                        <SectionCard icon={Heart} title="VI. Voluntary Work" subtitle="Voluntary work or involvement in civic / non-government / people / voluntary organizations">
                            <div className="flex justify-end mb-3">
                                {!isLocked && <button type="button" onClick={() => addRow('voluntary_work', emptyVoluntaryWork)} className="flex items-center gap-1.5 text-[10px] font-black text-[#1B3A6B] uppercase hover:underline"><Plus size={13} /> Add Row</button>}
                            </div>
                            <div className="space-y-3">
                                {form.voluntary_work.map((entry, idx) => (
                                    <div key={idx} className="bg-slate-50 rounded-xl p-5 border border-slate-100 relative">
                                        {!isLocked && form.voluntary_work.length > 1 && (
                                            <button type="button" onClick={() => removeRow('voluntary_work', idx)} className="absolute top-3 right-3 text-slate-300 hover:text-[#D6402F] transition-colors"><Trash2 size={15} /></button>
                                        )}
                                        <div className="mb-4">
                                            <Field label="Name & Address of Organization">
                                                <TextInput value={entry.org_name_address} onChange={v => updateRow('voluntary_work', idx, { ...entry, org_name_address: v })} disabled={isLocked} placeholder="N/A" />
                                            </Field>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <Field label="From (mm/dd/yyyy)"><TextInput type="date" value={entry.date_from} onChange={v => updateRow('voluntary_work', idx, { ...entry, date_from: v })} disabled={isLocked} /></Field>
                                            <Field label="To (mm/dd/yyyy)"><TextInput type="date" value={entry.date_to} onChange={v => updateRow('voluntary_work', idx, { ...entry, date_to: v })} disabled={isLocked} /></Field>
                                            <Field label="Number of Hours"><TextInput type="number" value={entry.num_hours} onChange={v => updateRow('voluntary_work', idx, { ...entry, num_hours: v })} disabled={isLocked} placeholder="N/A" /></Field>
                                            <Field label="Position / Nature of Work"><TextInput value={entry.position_nature} onChange={v => updateRow('voluntary_work', idx, { ...entry, position_nature: v })} disabled={isLocked} placeholder="N/A" /></Field>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* VII. L&D TRAINING */}
                        <SectionCard icon={BookOpen} title="VII. Learning and Development (L&D) Interventions / Training Programs Attended" subtitle="Start from the most recent L&D/training program. Include only the relevant L&D/training taken for the last 5 years.">
                            <div className="flex justify-end mb-3">
                                {!isLocked && <button type="button" onClick={() => addRow('ld_training', emptyLDTraining)} className="flex items-center gap-1.5 text-[10px] font-black text-[#1B3A6B] uppercase hover:underline"><Plus size={13} /> Add Training</button>}
                            </div>
                            <div className="space-y-3">
                                {form.ld_training.map((entry, idx) => (
                                    <div key={idx} className="bg-slate-50 rounded-xl p-5 border border-slate-100 relative">
                                        {!isLocked && form.ld_training.length > 1 && (
                                            <button type="button" onClick={() => removeRow('ld_training', idx)} className="absolute top-3 right-3 text-slate-300 hover:text-[#D6402F] transition-colors"><Trash2 size={15} /></button>
                                        )}
                                        <div className="mb-4">
                                            <Field label="Title of Learning and Development Interventions / Training Programs">
                                                <TextInput value={entry.title} onChange={v => updateRow('ld_training', idx, { ...entry, title: v })} disabled={isLocked} />
                                            </Field>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            <Field label="From (mm/dd/yyyy)"><TextInput type="date" value={entry.date_from} onChange={v => updateRow('ld_training', idx, { ...entry, date_from: v })} disabled={isLocked} /></Field>
                                            <Field label="To (mm/dd/yyyy)"><TextInput type="date" value={entry.date_to} onChange={v => updateRow('ld_training', idx, { ...entry, date_to: v })} disabled={isLocked} /></Field>
                                            <Field label="Number of Hours"><TextInput type="number" value={entry.num_hours} onChange={v => updateRow('ld_training', idx, { ...entry, num_hours: v })} disabled={isLocked} /></Field>
                                            <Field label="Type of LD">
                                                <SelectInput value={entry.ld_type} onChange={v => updateRow('ld_training', idx, { ...entry, ld_type: v })} disabled={isLocked}
                                                    options={[{value:'managerial',label:'Managerial'},{value:'supervisory',label:'Supervisory'},{value:'technical',label:'Technical'},{value:'foundation',label:'Foundation'}]} />
                                            </Field>
                                            <Field label="Conducted / Sponsored By"><TextInput value={entry.conducted_by} onChange={v => updateRow('ld_training', idx, { ...entry, conducted_by: v })} disabled={isLocked} /></Field>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* VIII. OTHER INFORMATION */}
                        <SectionCard icon={Star} title="VIII. Other Information" subtitle="Special skills, non-academic distinctions, and membership in associations">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                                {/* Special Skills */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">31. Special Skills and Hobbies</p>
                                        {!isLocked && <button type="button" onClick={() => addRow('special_skills', emptySkill)} className="text-[10px] font-black text-[#1B3A6B] hover:underline"><Plus size={12} /></button>}
                                    </div>
                                    <div className="space-y-2">
                                        {form.special_skills.map((entry, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <TextInput value={entry.skill} onChange={v => updateRow('special_skills', idx, { skill: v })} disabled={isLocked} placeholder="e.g. I.T. Specialist" />
                                                {!isLocked && form.special_skills.length > 1 && (
                                                    <button type="button" onClick={() => removeRow('special_skills', idx)} className="text-slate-300 hover:text-[#D6402F] shrink-0"><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Non-Academic Distinctions */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">32. Non-Academic Distinctions / Recognition</p>
                                        {!isLocked && <button type="button" onClick={() => addRow('non_academic_distinctions', emptyDistinction)} className="text-[10px] font-black text-[#1B3A6B] hover:underline"><Plus size={12} /></button>}
                                    </div>
                                    <div className="space-y-2">
                                        {form.non_academic_distinctions.map((entry, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <TextInput value={entry.distinction} onChange={v => updateRow('non_academic_distinctions', idx, { distinction: v })} disabled={isLocked} placeholder="e.g. Best Employee Award" />
                                                {!isLocked && form.non_academic_distinctions.length > 1 && (
                                                    <button type="button" onClick={() => removeRow('non_academic_distinctions', idx)} className="text-slate-300 hover:text-[#D6402F] shrink-0"><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Membership in Associations */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">33. Membership in Association / Organization</p>
                                        {!isLocked && <button type="button" onClick={() => addRow('membership_associations', emptyMembership)} className="text-[10px] font-black text-[#1B3A6B] hover:underline"><Plus size={12} /></button>}
                                    </div>
                                    <div className="space-y-2">
                                        {form.membership_associations.map((entry, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <TextInput value={entry.organization} onChange={v => updateRow('membership_associations', idx, { organization: v })} disabled={isLocked} placeholder="e.g. DepEd Basketball Association" />
                                                {!isLocked && form.membership_associations.length > 1 && (
                                                    <button type="button" onClick={() => removeRow('membership_associations', idx)} className="text-slate-300 hover:text-[#D6402F] shrink-0"><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Step 3 footer — Continue to C4 */}
                        {!isLocked && (
                            <div className="flex justify-between items-center pb-8">
                                <button onClick={() => goToStep(2)} className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase hover:bg-slate-50 transition-all">
                                    <ChevronLeft size={16} /> Back to C2
                                </button>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => saveAll()} disabled={saving}
                                        className="flex items-center gap-2 px-5 py-3 border-2 border-[#1B3A6B] text-[#1B3A6B] rounded-xl text-xs font-black uppercase hover:bg-blue-50 transition-all disabled:opacity-50">
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Draft
                                    </button>
                                    {saveMsg && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} />{saveMsg}</span>}
                                    <button onClick={() => goToStep(4)}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#1B3A6B] text-white rounded-xl text-xs font-black uppercase hover:bg-[#162E55] shadow-lg transition-all">
                                        Continue to C4 <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* ══════════════ STEP 4 — C4: Questions, References, Signature ══════════════ */}
                {step === 4 && (
                    <AnimatePresence mode="wait">
                        <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.25 }} className="space-y-6">

                            {/* ── QUESTIONS 34–40 ─────────────────────────────── */}
                            <SectionCard icon={ShieldAlert} title="Questions 34–40" subtitle="Answer all questions truthfully. If YES, provide the required details.">

                                {/* Reusable Yes/No row component inline */}
                                {[
                                    {
                                        num: '34a', q: 'Are you related by consanguinity or affinity to the appointing or recommending chief of bureau or office or to the person who has immediate supervision over the Bureau or Department where you will be appointed, within the third degree?',
                                        detailLabel: 'If YES, give details:',
                                        ansKey: 'q34a_answer', detKey: 'q34a_details'
                                    },
                                    {
                                        num: '34b', q: 'Within the fourth degree (for Local Government Unit – Career Employees)?',
                                        detailLabel: 'If YES, give details:',
                                        ansKey: 'q34b_answer', detKey: 'q34b_details'
                                    },
                                    {
                                        num: '35a', q: 'Have you ever been found guilty of any administrative offense?',
                                        detailLabel: 'If YES, give details:',
                                        ansKey: 'q35a_answer', detKey: 'q35a_details'
                                    },
                                    {
                                        num: '36', q: 'Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?',
                                        detailLabel: 'If YES, give details:',
                                        ansKey: 'q36_answer', detKey: 'q36_details'
                                    },
                                    {
                                        num: '37', q: 'Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector?',
                                        detailLabel: 'If YES, give details:',
                                        ansKey: 'q37_answer', detKey: 'q37_details'
                                    },
                                    {
                                        num: '38a', q: 'Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?',
                                        detailLabel: 'If YES, give details:',
                                        ansKey: 'q38a_answer', detKey: 'q38a_details'
                                    },
                                    {
                                        num: '38b', q: 'Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?',
                                        detailLabel: 'If YES, give details:',
                                        ansKey: 'q38b_answer', detKey: 'q38b_details'
                                    },
                                    {
                                        num: '39', q: 'Have you acquired the status of an immigrant or permanent resident of another country?',
                                        detailLabel: 'If YES, give details (country):',
                                        ansKey: 'q39_answer', detKey: 'q39_details'
                                    },
                                    {
                                        num: '40a', q: 'Pursuant to RA 8371 (Indigenous People\'s Act) — Are you a member of any indigenous group?',
                                        detailLabel: 'If YES, please specify:',
                                        ansKey: 'q40a_answer', detKey: 'q40a_details'
                                    },
                                    {
                                        num: '40b', q: 'Pursuant to RA 7277 (Magna Carta for Disabled Persons) — Are you a person with disability?',
                                        detailLabel: 'If YES, please specify ID No.:',
                                        ansKey: 'q40b_answer', detKey: 'q40b_details'
                                    },
                                    {
                                        num: '40c', q: 'Pursuant to RA 8972 (Solo Parents Welfare Act of 2000) — Are you a solo parent?',
                                        detailLabel: 'If YES, please specify ID No.:',
                                        ansKey: 'q40c_answer', detKey: 'q40c_details'
                                    },
                                ].map(row => (
                                    <div key={row.num} className="border-b border-slate-50 last:border-0 pb-5 mb-5">
                                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Question {row.num}</p>
                                                <p className="text-sm font-bold text-slate-700 leading-relaxed">{row.q}</p>
                                            </div>
                                            <div className="md:w-64 shrink-0 space-y-3">
                                                <Field label="Answer">
                                                    <SelectInput
                                                        value={form[row.ansKey]}
                                                        onChange={v => set(row.ansKey, v)}
                                                        disabled={isLocked}
                                                        options={[{ value: 'yes', label: 'YES' }, { value: 'no', label: 'NO' }]}
                                                    />
                                                </Field>
                                                {form[row.ansKey] === 'yes' && (
                                                    <Field label={row.detailLabel}>
                                                        <TextInput value={form[row.detKey]} onChange={v => set(row.detKey, v)} disabled={isLocked} />
                                                    </Field>
                                                )}
                                            </div>
                                        </div>

                                        {/* Q35b has extra date filed / case status fields */}
                                        {row.num === '35a' && (
                                            <div className="mt-4 border-t border-slate-50 pt-4">
                                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Question 35b</p>
                                                        <p className="text-sm font-bold text-slate-700 leading-relaxed">Have you been criminally charged before any court?</p>
                                                    </div>
                                                    <div className="md:w-64 shrink-0 space-y-3">
                                                        <Field label="Answer">
                                                            <SelectInput value={form.q35b_answer} onChange={v => set('q35b_answer', v)} disabled={isLocked}
                                                                options={[{ value: 'yes', label: 'YES' }, { value: 'no', label: 'NO' }]} />
                                                        </Field>
                                                        {form.q35b_answer === 'yes' && (
                                                            <>
                                                                <Field label="If YES, give details:">
                                                                    <TextInput value={form.q35b_details} onChange={v => set('q35b_details', v)} disabled={isLocked} />
                                                                </Field>
                                                                <Field label="Date Filed:">
                                                                    <TextInput type="date" value={form.q35b_date_filed} onChange={v => set('q35b_date_filed', v)} disabled={isLocked} />
                                                                </Field>
                                                                <Field label="Status of Case/s:">
                                                                    <TextInput value={form.q35b_case_status} onChange={v => set('q35b_case_status', v)} disabled={isLocked} />
                                                                </Field>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </SectionCard>

                            {/* ── REFERENCES (Q41) ─────────────────────────────── */}
                            <SectionCard icon={Users} title="41. References" subtitle="Person not related by consanguinity or affinity to applicant / appointee">
                                <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_32px] gap-4 px-1 mb-2">
                                    {['Name', 'Address', 'Tel. No.', ''].map(h => (
                                        <span key={h} className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</span>
                                    ))}
                                </div>
                                <div className="space-y-3">
                                    {form.references.map((ref, idx) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_32px] gap-3 items-center">
                                            <TextInput value={ref.name} onChange={v => updateRow('references', idx, { ...ref, name: v })} disabled={isLocked} placeholder="Full Name" />
                                            <TextInput value={ref.address} onChange={v => updateRow('references', idx, { ...ref, address: v })} disabled={isLocked} placeholder="Address" />
                                            <TextInput value={ref.tel_no} onChange={v => updateRow('references', idx, { ...ref, tel_no: v })} disabled={isLocked} placeholder="09XXXXXXXXX" />
                                            {!isLocked && form.references.length > 1 && (
                                                <button type="button" onClick={() => removeRow('references', idx)} className="h-[42px] flex items-center justify-center text-slate-300 hover:text-[#D6402F]"><Trash2 size={14} /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {!isLocked && (
                                    <button type="button" onClick={() => addRow('references', emptyReference)}
                                        className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-[#1B3A6B] uppercase hover:underline">
                                        <Plus size={13} /> Add Reference
                                    </button>
                                )}
                            </SectionCard>

                            {/* ── GOVERNMENT ID (Q42 / bottom section) ─────────── */}
                            <SectionCard icon={Award} title="Government Issued ID" subtitle="Indicate ID Number and Date of Issuance — e.g. Passport, GSIS, SSS, PRC, Driver's License">
                                <div className="space-y-4">
                                    {form.govt_ids.map((gid, idx) => (
                                        <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative">
                                            {!isLocked && form.govt_ids.length > 1 && (
                                                <button type="button" onClick={() => removeRow('govt_ids', idx)} className="absolute top-3 right-3 text-slate-300 hover:text-[#D6402F]"><Trash2 size={14} /></button>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Field label="Government Issued ID Type">
                                                    <TextInput value={gid.id_type} onChange={v => updateRow('govt_ids', idx, { ...gid, id_type: v })} disabled={isLocked} placeholder="e.g. Driver's License" />
                                                </Field>
                                                <Field label="ID / License / Passport No.">
                                                    <TextInput value={gid.id_license_no} onChange={v => updateRow('govt_ids', idx, { ...gid, id_license_no: v })} disabled={isLocked} />
                                                </Field>
                                                <Field label="Date / Place of Issuance">
                                                    <TextInput value={gid.date_place_issuance} onChange={v => updateRow('govt_ids', idx, { ...gid, date_place_issuance: v })} disabled={isLocked} placeholder="MM/DD/YYYY · City" />
                                                </Field>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {!isLocked && (
                                    <button type="button" onClick={() => addRow('govt_ids', emptyGovtId)}
                                        className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-[#1B3A6B] uppercase hover:underline">
                                        <Plus size={13} /> Add Another ID
                                    </button>
                                )}
                            </SectionCard>

                            {/* ── DATE ACCOMPLISHED + OATH TEXT ─────────────────── */}
                            <SectionCard icon={CheckCircle2} title="42. Declaration" subtitle="I declare under oath that I have personally accomplished this Personal Data Sheet which is a true, correct and complete statement.">
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6">
                                    <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                        I declare under oath that I have personally accomplished this Personal Data Sheet which is a true, correct and complete statement pursuant to the provisions of pertinent laws, rules and regulations of the Republic of the Philippines. I authorize the agency head/authorized representative to verify/validate the contents stated herein. I agree that any misrepresentation made in this document and its attachments shall cause the filing of administrative/criminal case/s against me.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Field label="Date Accomplished">
                                        <TextInput type="date" value={form.date_accomplished} onChange={v => set('date_accomplished', v)} disabled={isLocked} />
                                    </Field>
                                </div>
                                {!isLocked && (
                                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <p className="text-[11px] font-bold text-amber-700">
                                            After submitting, your PDS will be locked and sent to HR for review. Ensure all information across all 4 pages is accurate before submitting.
                                        </p>
                                    </div>
                                )}
                            </SectionCard>

                            {/* Step 4 footer — final Submit PDS */}
                            {!isLocked && (
                                <div className="flex justify-between items-center pb-8">
                                    <button onClick={() => goToStep(3)} className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase hover:bg-slate-50 transition-all">
                                        <ChevronLeft size={16} /> Back to C3
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => saveAll()} disabled={saving}
                                            className="flex items-center gap-2 px-5 py-3 border-2 border-[#1B3A6B] text-[#1B3A6B] rounded-xl text-xs font-black uppercase hover:bg-blue-50 transition-all disabled:opacity-50">
                                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Draft
                                        </button>
                                        {saveMsg && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} />{saveMsg}</span>}
                                        <button onClick={handleSubmit} disabled={submitting}
                                            className="flex items-center gap-2 px-6 py-3 bg-[#D6402F] text-white rounded-xl text-xs font-black uppercase hover:bg-[#b53526] shadow-lg disabled:opacity-40 transition-all">
                                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                            Submit PDS
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default PersonalDataSheetForm;