import { useState, useRef } from 'react';
import { useEmployeeProfile } from '../../hooks/useEmployeeProfile';
import { SERVER_BASE } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, X, Send, RotateCcw, Clock, CheckCircle2, XCircle, AlertCircle, Camera, Loader2 } from 'lucide-react';

const EDITABLE_FIELDS = {
  personal: ['first_name', 'middle_name', 'last_name', 'name_extension', 'date_of_birth', 'place_of_birth', 'sex', 'civil_status', 'blood_type', 'mobile_no', 'email'],
  ids: ['gsis_id', 'pagibig_id', 'philhealth_no', 'tin_no']
};

const STATUS_BADGE = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'Pending Review' },
  approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2, label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rejected' },
};

const Field = ({ label, value }) => (
  <div className="bg-slate-50 rounded-xl px-4 py-3">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-slate-700">{value || '—'}</p>
  </div>
);

const EditField = ({ label, field, value, onChange }) => {
  const isDate = field === 'date_of_birth';
  const isSelect = ['sex', 'civil_status', 'blood_type'].includes(field);

  if (isSelect) {
    const options = {
      sex: ['Male', 'Female'],
      civil_status: [
        { value: 'single', label: 'Single' },
        { value: 'married', label: 'Married' },
        { value: 'widowed', label: 'Widowed' },
        { value: 'separated', label: 'Separated' },
        { value: 'others', label: 'Others (Divorced/Annulled/etc.)' },
      ],
      blood_type: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    };
    return (
      <div className="bg-blue-50/60 rounded-xl px-4 py-3 border border-blue-200/60">
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{label}</p>
        <select
          value={value || ''}
          onChange={e => onChange(field, e.target.value || null)}
          className="text-sm font-bold text-slate-700 bg-transparent border-none outline-none w-full mt-1"
        >
          <option value="">—</option>
          {options[field].map(o => {
            const optVal = typeof o === 'string' ? o : o.value;
            const optLabel = typeof o === 'string' ? o : o.label;
            return <option key={optVal} value={optVal}>{optLabel}</option>;
          })}
        </select>
      </div>
    );
  }

  return (
    <div className="bg-blue-50/60 rounded-xl px-4 py-3 border border-blue-200/60">
      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{label}</p>
      <input
        type={isDate ? 'date' : 'text'}
        value={value || ''}
        onChange={e => onChange(field, e.target.value || null)}
        className="text-sm font-bold text-slate-700 bg-transparent border-none outline-none w-full mt-1"
      />
    </div>
  );
};

const ProfileAvatar = ({ profile, editing, onPhotoSelect, photoPreview, uploading }) => {
  const fileInputRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`;
  const displaySrc = photoPreview || (profile.photo_path ? `${SERVER_BASE}${profile.photo_path}` : null);

  const handleClick = () => {
    if (editing && !uploading) fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onPhotoSelect(file);
    e.target.value = '';
  };

  return (
    <div
      className={`relative group ${editing ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {displaySrc ? (
        <img
          src={displaySrc}
          alt={`${profile.first_name} ${profile.last_name}`}
          className="w-16 h-16 rounded-2xl object-cover border-2 border-[#1B3A6B]/20 shadow-sm bg-slate-50"
        />
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
          <span className="text-lg font-black text-slate-400">{initials}</span>
        </div>
      )}

      {editing && (
        <div className={`absolute inset-0 rounded-2xl flex items-center justify-center transition-all duration-200 ${
          uploading ? 'bg-black/40' : 'bg-black/0 hover:bg-black/40'
        }`}>
          {uploading ? (
            <Loader2 size={22} className="text-white animate-spin" />
          ) : (
            <Camera size={20} className={`text-white transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`} />
          )}
        </div>
      )}

      {editing && !uploading && (
        <span className={`absolute -bottom-1 -right-1 w-5 h-5 bg-[#D6402F] rounded-full flex items-center justify-center transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <Camera size={10} className="text-white" />
        </span>
      )}
    </div>
  );
};

const EmployeeProfile = () => {
  const { profile, loading, error, refresh, changeRequests, submitChangeRequest, revokeRequest, uploadPhoto } = useEmployeeProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState(null);

  const pendingRequest = changeRequests.find(r => r.status === 'pending');

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const startEditing = () => {
    const initial = {};
    [...EDITABLE_FIELDS.personal, ...EDITABLE_FIELDS.ids].forEach(f => { initial[f] = profile[f] || ''; });
    setForm(initial);
    setEditing(true);
    setSubmitMsg(null);
    setPhotoMsg(null);
  };

  const cancelEditing = () => { setEditing(false); setForm({}); setSubmitMsg(null); setPhotoPreview(null); setPhotoMsg(null); };

  const handlePhotoSelect = async (file) => {
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setPhotoUploading(true);
    setPhotoMsg(null);
    try {
      await uploadPhoto(file);
      setPhotoMsg({ type: 'success', text: 'Photo updated.' });
    } catch (err) {
      setPhotoMsg({ type: 'error', text: err.message });
      setPhotoPreview(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async () => {
    const changes = {};
    [...EDITABLE_FIELDS.personal, ...EDITABLE_FIELDS.ids].forEach(f => {
      const newVal = form[f] || null;
      const oldVal = profile[f] != null ? String(profile[f]) : null;
      if (newVal !== oldVal) changes[f] = newVal;
    });
    if (Object.keys(changes).length === 0) { setSubmitMsg({ type: 'error', text: 'No changes made.' }); return; }
    try {
      setSubmitting(true);
      await submitChangeRequest(changes, 'Profile update requested by employee');
      setEditing(false);
      setSubmitMsg({ type: 'success', text: 'Change request submitted for HR review.' });
      setPhotoPreview(null);
      refresh();
    } catch (err) {
      setSubmitMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id) => {
    try { await revokeRequest(id); refresh(); } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
    </div>
  );

  if (error) return (
    <div className="p-8 text-center">
      <p className="text-[#D6402F] font-black text-lg">{error}</p>
    </div>
  );

  if (!profile) return (
    <div className="p-8 text-center">
      <p className="text-slate-400 font-bold">No employee profile found. Please contact HR.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ProfileAvatar
            profile={profile}
            editing={editing}
            onPhotoSelect={handlePhotoSelect}
            photoPreview={photoPreview}
            uploading={photoUploading}
          />
          <div>
            <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic">My Profile</h1>
            <p className="text-xs font-bold text-slate-400">Personal and employment information</p>
            {editing && !photoUploading && (
              <p className="text-[10px] text-slate-400 mt-0.5">Click the photo to change it (saves immediately)</p>
            )}
          </div>
        </div>
        {!editing && (
          <button
            onClick={startEditing}
            disabled={!!pendingRequest}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${
              pendingRequest
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-[#1B3A6B] text-white hover:bg-[#162E55] shadow-sm'
            }`}
          >
            <Pencil size={16} />
            {pendingRequest ? 'Request Pending...' : 'Edit Profile'}
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-2">
            <button onClick={cancelEditing} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all">
              <X size={14} /> Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50"
            >
              <Send size={14} />
              {submitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {photoMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${
              photoMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {photoMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {photoMsg.text}
          </motion.div>
        )}
        {submitMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${
              submitMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {submitMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {submitMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {changeRequests.length > 0 && !editing && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
          <h3 className="text-sm font-black text-[#1B3A6B] uppercase italic">Recent Change Requests</h3>
          {changeRequests.slice(0, 5).map(req => {
            const badge = STATUS_BADGE[req.status];
            const changes = typeof req.changes_json === 'string' ? JSON.parse(req.changes_json) : req.changes_json;
            const fields = Object.keys(changes);
            return (
              <div key={req.id} className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate">
                    Changed: {fields.join(', ')}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(req.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {req.review_notes && ` — ${req.review_notes}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                    <badge.icon size={12} /> {badge.label}
                  </span>
                  {req.status === 'pending' && (
                    <button onClick={() => handleRevoke(req.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Withdraw">
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Employee No." value={profile.employee_no} />
          {editing ? <EditField label="First Name" field="first_name" value={form.first_name} onChange={handleChange} /> : <Field label="First Name" value={profile.first_name} />}
          {editing ? <EditField label="Middle Name" field="middle_name" value={form.middle_name} onChange={handleChange} /> : <Field label="Middle Name" value={profile.middle_name} />}
          {editing ? <EditField label="Last Name" field="last_name" value={form.last_name} onChange={handleChange} /> : <Field label="Last Name" value={profile.last_name} />}
          {editing ? <EditField label="Name Extension" field="name_extension" value={form.name_extension} onChange={handleChange} /> : <Field label="Name Extension" value={profile.name_extension} />}
          {editing ? <EditField label="Date of Birth" field="date_of_birth" value={form.date_of_birth} onChange={handleChange} /> : <Field label="Date of Birth" value={profile.date_of_birth} />}
          {editing ? <EditField label="Place of Birth" field="place_of_birth" value={form.place_of_birth} onChange={handleChange} /> : <Field label="Place of Birth" value={profile.place_of_birth} />}
          {editing ? <EditField label="Sex" field="sex" value={form.sex} onChange={handleChange} /> : <Field label="Sex" value={profile.sex} />}
          {editing ? <EditField label="Civil Status" field="civil_status" value={form.civil_status} onChange={handleChange} /> : <Field label="Civil Status" value={profile.civil_status} />}
          {editing ? <EditField label="Blood Type" field="blood_type" value={form.blood_type} onChange={handleChange} /> : <Field label="Blood Type" value={profile.blood_type} />}
          {editing ? <EditField label="Mobile No." field="mobile_no" value={form.mobile_no} onChange={handleChange} /> : <Field label="Mobile No." value={profile.mobile_no} />}
          {editing ? <EditField label="Email" field="email" value={form.email} onChange={handleChange} /> : <Field label="Email" value={profile.email} />}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic">Government IDs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {editing ? <EditField label="GSIS ID" field="gsis_id" value={form.gsis_id} onChange={handleChange} /> : <Field label="GSIS ID" value={profile.gsis_id} />}
          {editing ? <EditField label="PAG-IBIG ID" field="pagibig_id" value={form.pagibig_id} onChange={handleChange} /> : <Field label="PAG-IBIG ID" value={profile.pagibig_id} />}
          {editing ? <EditField label="PhilHealth No." field="philhealth_no" value={form.philhealth_no} onChange={handleChange} /> : <Field label="PhilHealth No." value={profile.philhealth_no} />}
          {editing ? <EditField label="TIN No." field="tin_no" value={form.tin_no} onChange={handleChange} /> : <Field label="TIN No." value={profile.tin_no} />}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic">Employment Details</h2>
          {editing && (
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg">
              HR-managed — cannot be edited
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Position" value={profile.position_title} />
          <Field label="Employment Status" value={profile.employment_status} />
          <Field label="Employment Type" value={profile.employment_type} />
          <Field label="Salary Grade" value={profile.salary_grade} />
          <Field label="Monthly Salary" value={profile.monthly_salary ? `₱${parseFloat(profile.monthly_salary).toLocaleString()}` : '—'} />
          <Field label="Item Number" value={profile.item_number} />
          <Field label="Assigned School" value={profile.assigned_school} />
          <Field label="Date Hired" value={profile.date_hired} />
          <Field label="Date of Original Appointment" value={profile.date_original_appointment} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic">Leave Credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Sick Leave" value={profile.sick_leave_balance} />
          <Field label="Vacation Leave" value={profile.vacation_leave_balance} />
          <Field label="Forced Leave" value={profile.forced_leave_balance} />
          <Field label="Special Privilege" value={profile.special_privilege_balance} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
