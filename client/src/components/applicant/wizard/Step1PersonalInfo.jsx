import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]";
const selectCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]";
const labelCls = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2";

function safeParseJSON(field) {
    if (!field) return null;
    if (typeof field === 'string') { try { return JSON.parse(field); } catch { return null; } }
    return field;
}

function computeAge(dob) {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age > 0 ? age : null;
}

function buildAddress(pds) {
    if (!pds) return '';
    return [
        pds.res_house_block_lot, pds.res_street, pds.res_subdivision_village,
        pds.res_barangay, pds.res_city_municipality, pds.res_province, pds.res_zip_code
    ].filter(Boolean).join(', ');
}

function getHighestEducation(pds) {
    if (!pds) return '';
    try {
        const graduate = safeParseJSON(pds.graduate_studies);
        if (Array.isArray(graduate) && graduate.length > 0) {
            const entry = graduate.find(e => e.degree_course) || graduate[0];
            if (entry.degree_course) return entry.degree_course;
        }
        const college = safeParseJSON(pds.college);
        if (Array.isArray(college) && college.length > 0) {
            const entry = college.find(e => e.degree_course) || college[0];
            if (entry.degree_course) return entry.degree_course;
        }
        const vocational = safeParseJSON(pds.vocational);
        if (Array.isArray(vocational) && vocational.length > 0) {
            const entry = vocational.find(e => e.degree_course) || vocational[0];
            if (entry.degree_course) return `Vocational - ${entry.degree_course}`;
        }
        const secondary = safeParseJSON(pds.secondary);
        if (secondary && secondary.school_name) return `High School - ${secondary.school_name}`;
        const elementary = safeParseJSON(pds.elementary);
        if (elementary && elementary.school_name) return `Elementary - ${elementary.school_name}`;
    } catch { /* malformed JSON */ }
    return '';
}

function getTopEligibility(pds) {
    if (!pds) return '';
    try {
        const eligibility = safeParseJSON(pds.civil_service_eligibility);
        if (Array.isArray(eligibility) && eligibility.length > 0) {
            const entry = eligibility.find(e => e.eligibility_name) || eligibility[0];
            return entry.eligibility_name || '';
        }
    } catch { /* malformed JSON */ }
    return '';
}

function getTotalTrainingHours(pds) {
    if (!pds) return '';
    try {
        const training = safeParseJSON(pds.ld_training);
        if (Array.isArray(training) && training.length > 0) {
            const total = training.reduce((sum, t) => sum + (parseFloat(t.num_hours) || 0), 0);
            return total > 0 ? total : '';
        }
    } catch { /* malformed JSON */ }
    return '';
}

const Step1PersonalInfo = ({ applicationId, setApplicationId, vacancy, onNext }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [pdsReady, setPdsReady] = useState(false);

    const isNonTeaching = vacancy?.position_type === 'non_teaching';
    const isTeachingRelated = vacancy?.position_type === 'teaching_related';

    const [formData, setFormData] = useState({
        full_name: user?.fullName || '',
        email: user?.email || '',
        phone: '',
        current_school: '',
        years_experience: '',
        snap_address: '',
        snap_age: '',
        snap_sex: '',
        snap_civil_status: '',
        snap_religion: '',
        snap_disability: '',
        snap_ethnic_group: '',
        snap_education: '',
        snap_training_hours: '',
        snap_eligibility: ''
    });

    useEffect(() => {
        const fetchPDS = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/applicant/pds`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) return;
                const data = await res.json();
                const pds = data.pds;
                if (!pds) return;

                setFormData(prev => ({
                    ...prev,
                    snap_address: buildAddress(pds),
                    snap_age: computeAge(pds.date_of_birth) ?? '',
                    snap_sex: pds.sex || '',
                    snap_civil_status: pds.civil_status || '',
                    snap_religion: pds.religion || '',
                    snap_disability: pds.disability || '',
                    snap_ethnic_group: pds.ethnic_group || '',
                    snap_education: getHighestEducation(pds),
                    snap_training_hours: getTotalTrainingHours(pds),
                    snap_eligibility: getTopEligibility(pds)
                }));
            } catch (err) {
                console.error('Error fetching PDS for Step 1:', err);
            } finally {
                setPdsReady(true);
            }
        };
        fetchPDS();
    }, []);

    const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

    const isBaseComplete = formData.full_name && formData.email && formData.phone && formData.current_school && formData.years_experience !== '';

    const handleSaveAndContinue = async () => {
        if (!isBaseComplete) return;
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

            let appId = applicationId;

            if (!appId) {
                const res1 = await fetch(`${API_BASE}/api/applications`, {
                    method: 'POST', headers,
                    body: JSON.stringify({ vacancy_id: vacancy.id })
                });
                const data1 = await res1.json();
                appId = data1.applicationId;
                setApplicationId(appId);
            }

            const payload = {
                ...formData,
                snap_age: formData.snap_age !== '' ? Number(formData.snap_age) : null,
                snap_training_hours: formData.snap_training_hours !== '' ? Number(formData.snap_training_hours) : null
            };

            await fetch(`${API_BASE}/api/applications/${appId}`, {
                method: 'PATCH', headers,
                body: JSON.stringify(payload)
            });

            onNext();
        } catch (error) {
            console.error('Error saving step 1:', error);
            alert('Failed to save progress. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <h3 className="font-black text-xl text-[#1B3A6B] uppercase italic">Personal Information</h3>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        isNonTeaching ? 'bg-sky-100 text-sky-700' : isTeachingRelated ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                        {isNonTeaching ? 'Non-Teaching' : isTeachingRelated ? 'Teaching-Related' : 'Teaching'} Position
                    </span>
                </div>

                {/* ── BASIC INFORMATION ─────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className={labelCls}>Full Name *</label>
                        <input type="text" className={inputCls} value={formData.full_name} onChange={set('full_name')} required />
                    </div>
                    <div>
                        <label className={labelCls}>Email Address *</label>
                        <input type="email" className={inputCls} value={formData.email} onChange={set('email')} required />
                    </div>
                    <div>
                        <label className={labelCls}>Contact Number *</label>
                        <input type="tel" className={inputCls} placeholder="e.g. 0917-123-4567" value={formData.phone} onChange={set('phone')} required />
                    </div>
                    <div>
                        <label className={labelCls}>{isNonTeaching ? 'Current Office / Station *' : 'Current School / Station *'}</label>
                        <input type="text" className={inputCls}
                            placeholder={isNonTeaching ? 'e.g. DepEd Division Office, Dapitan City' : 'e.g. Dapitan City National High School'}
                            value={formData.current_school} onChange={set('current_school')} required />
                    </div>
                    <div>
                        <label className={labelCls}>
                            {isNonTeaching || isTeachingRelated ? 'Years of Relevant Experience' : 'Years of Teaching Experience'}
                        </label>
                        <input type="number" min="0" className={inputCls}
                            placeholder={isNonTeaching ? 'Years in administrative/support role' : isTeachingRelated ? 'Years in a teaching-related role' : 'Years as a classroom teacher'}
                            value={formData.years_experience} onChange={set('years_experience')} required />
                    </div>
                </div>

                {/* ── PDS-DERIVED FIELDS ────────────────────────────────── */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-5">
                        <h4 className="font-black text-sm text-[#1B3A6B] uppercase italic">Personal Data (from PDS)</h4>
                        {!pdsReady && <Loader2 size={14} className="animate-spin text-slate-400" />}
                        {pdsReady && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Pre-filled</span>}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mb-5 -mt-3">These fields are auto-filled from your Personal Data Sheet. You may correct them for this application.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Address */}
                        <div className="md:col-span-2">
                            <label className={labelCls}>Address</label>
                            <input type="text" className={inputCls} value={formData.snap_address} onChange={set('snap_address')} />
                        </div>

                        {/* Age + Sex */}
                        <div>
                            <label className={labelCls}>Age *</label>
                            <input type="number" min="18" max="65" className={inputCls}
                                value={formData.snap_age} onChange={set('snap_age')}
                                placeholder="e.g. 28" required />
                        </div>
                        <div>
                            <label className={labelCls}>Sex</label>
                            <select className={selectCls} value={formData.snap_sex} onChange={set('snap_sex')}>
                                <option value="">Select...</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>

                        {/* Civil Status + Religion */}
                        <div>
                            <label className={labelCls}>Civil Status</label>
                            <select className={selectCls} value={formData.snap_civil_status} onChange={set('snap_civil_status')}>
                                <option value="">Select...</option>
                                <option value="single">Single</option>
                                <option value="married">Married</option>
                                <option value="widowed">Widowed</option>
                                <option value="separated">Separated</option>
                                <option value="others">Others</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Religion</label>
                            <input type="text" className={inputCls} value={formData.snap_religion} onChange={set('snap_religion')} />
                        </div>

                        {/* Disability + Ethnic Group */}
                        <div>
                            <label className={labelCls}>Disability</label>
                            <input type="text" className={inputCls} value={formData.snap_disability} onChange={set('snap_disability')} placeholder="None" />
                        </div>
                        <div>
                            <label className={labelCls}>Ethnic Group</label>
                            <input type="text" className={inputCls} value={formData.snap_ethnic_group} onChange={set('snap_ethnic_group')} />
                        </div>

                        {/* Education */}
                        <div className="md:col-span-2">
                            <label className={labelCls}>Education (Highest Level / Degree)</label>
                            <input type="text" className={inputCls} value={formData.snap_education} onChange={set('snap_education')} />
                        </div>

                        {/* Training Hours + Eligibility */}
                        <div>
                            <label className={labelCls}>Training (Total Hours)</label>
                            <input type="number" min="0" step="0.5" className={inputCls} value={formData.snap_training_hours} onChange={set('snap_training_hours')} placeholder="0" />
                        </div>
                        <div>
                            <label className={labelCls}>Eligibility</label>
                            <input type="text" className={inputCls} value={formData.snap_eligibility} onChange={set('snap_eligibility')} />
                        </div>
                    </div>
                </div>

                {/* Position-specific note */}
                {isNonTeaching && (
                    <div className="mt-6 bg-sky-50 border border-sky-100 rounded-xl px-5 py-3 text-[11px] font-bold text-sky-700">
                        You are applying for a <span className="font-black">Non-Teaching</span> position. Please provide your office/administrative experience details above.
                    </div>
                )}
                {isTeachingRelated && (
                    <div className="mt-6 bg-violet-50 border border-violet-100 rounded-xl px-5 py-3 text-[11px] font-bold text-violet-700">
                        You are applying for a <span className="font-black">Teaching-Related</span> position. Please provide your relevant experience details above.
                    </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex justify-end">
                    <button onClick={handleSaveAndContinue} disabled={!isBaseComplete || loading}
                        className={`flex items-center gap-2 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                            ${isBaseComplete && !loading ? 'bg-[#1B3A6B] hover:bg-[#162E55] text-white shadow-lg shadow-blue-900/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                        {loading && <Loader2 size={16} className="animate-spin" />} Continue →
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default Step1PersonalInfo;
