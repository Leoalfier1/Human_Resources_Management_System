import React, { useState, useMemo } from 'react';
import { CalendarCheck, ShieldCheck } from 'lucide-react';
import { useLeave } from '../../hooks/useLeave';

const LEAVE_TYPES = [
  { value: 'vacation', label: 'Vacation Leave' },
  { value: 'forced', label: 'Mandatory/Forced Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'special_privilege', label: 'Special Privilege Leave' },
  { value: 'solo_parent', label: 'Solo Parent Leave' },
  { value: 'study', label: 'Study Leave' },
  { value: 'vawc', label: '10-Day VAWC Leave' },
  { value: 'rehabilitation', label: 'Rehabilitation Privilege' },
  { value: 'special_benefits_women', label: 'Special Benefits for Women' },
  { value: 'special_emergency', label: 'Special Emergency (Calamity)' },
  { value: 'adoption', label: 'Adoption Leave' },
  { value: 'others', label: 'Others' },
];

const DETAIL_FIELDS = {
  vacation: {
    label: 'Location',
    options: [
      { value: 'within_philippines', label: 'Within Philippines' },
      { value: 'abroad', label: 'Abroad' },
    ],
    placeholder: 'Specify city/country',
  },
  special_privilege: {
    label: 'Location',
    options: [
      { value: 'within_philippines', label: 'Within Philippines' },
      { value: 'abroad', label: 'Abroad' },
    ],
    placeholder: 'Specify city/country',
  },
  sick: {
    label: 'Illness',
    options: [
      { value: 'in_hospital', label: 'In Hospital' },
      { value: 'out_patient', label: 'Out Patient' },
    ],
    placeholder: 'Specify illness',
  },
  study: {
    label: 'Study Type',
    options: [
      { value: 'masters_degree', label: 'Completion of Master\'s Degree' },
      { value: 'bar_review', label: 'BAR Review' },
    ],
  },
  special_benefits_women: {
    label: 'Illness',
    options: [],
    placeholder: 'Specify illness',
  },
  others: {
    label: 'Sub-Type',
    options: [
      { value: 'monetization', label: 'Monetization of Leave Credits' },
      { value: 'terminal_leave', label: 'Terminal Leave' },
    ],
  },
};

const COMMUTATION_TYPES = ['vacation', 'special_privilege'];

const statusBadge = (status) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-700',
    recommended: 'bg-blue-50 text-blue-700',
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };
  return `inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase ${styles[status] || 'bg-slate-100 text-slate-500'}`;
};

const INITIAL_FORM = {
  leave_type: 'sick',
  date_from: '',
  date_to: '',
  num_days: '',
  reason: '',
  detail_option: '',
  detail_text: '',
  study_type: '',
  others_sub_type: '',
  commutation: 'not_requested',
  esignature_consented: false,
};

const LeaveApplication = () => {
  const { credits, applications, loading, submitLeave, cancelLeave } = useLeave();
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const selectedType = form.leave_type;
  const detailConfig = DETAIL_FIELDS[selectedType];
  const showCommutation = COMMUTATION_TYPES.includes(selectedType);

  const buildPayload = () => {
    const payload = {
      leave_type: form.leave_type,
      date_from: form.date_from,
      date_to: form.date_to,
      num_days: form.num_days,
      reason: form.reason,
      leave_details: null,
      commutation: showCommutation ? form.commutation : 'not_requested',
      esignature_consented: form.esignature_consented ? 1 : 0,
    };

    if (detailConfig) {
      if (selectedType === 'study') {
        const studyLabel = form.study_type === 'masters_degree'
          ? "Completion of Master's Degree"
          : form.study_type === 'bar_review' ? 'BAR Review' : '';
        if (studyLabel) payload.leave_details = `Study Leave: ${studyLabel}`;
      } else if (selectedType === 'others') {
        const subLabel = form.others_sub_type === 'monetization'
          ? 'Monetization of Leave Credits'
          : form.others_sub_type === 'terminal_leave' ? 'Terminal Leave' : '';
        if (subLabel) payload.leave_details = subLabel;
      } else if (detailConfig.options.length > 0 && form.detail_option) {
        const optLabel = detailConfig.options.find(o => o.value === form.detail_option)?.label || form.detail_option;
        payload.leave_details = form.detail_text
          ? `${optLabel}: ${form.detail_text}`
          : optLabel;
      } else if (detailConfig.options.length === 0 && form.detail_text) {
        payload.leave_details = form.detail_text;
      }
    }

    if (form.leave_type === 'others' && payload.leave_details) {
      payload.reason = form.reason
        ? `${payload.leave_details} — ${form.reason}`
        : payload.leave_details;
      payload.leave_details = null;
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.esignature_consented) {
      setMessage({ type: 'error', text: 'You must agree to the e-signature certification before submitting.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    const payload = buildPayload();
    const result = await submitLeave(payload);
    if (result.success) {
      setForm(INITIAL_FORM);
      setMessage({ type: 'success', text: 'Leave application submitted.' });
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to submit.' });
    }
    setSubmitting(false);
  };

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const resetDetailFields = () => {
    setForm(prev => ({
      ...prev,
      detail_option: '',
      detail_text: '',
      study_type: '',
      others_sub_type: '',
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
    </div>
  );

  const CreditCard = ({ label, value, color }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-4xl font-black ${color}`}>{value || 0}</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic">Leave Application</h1>
        <p className="text-xs font-bold text-slate-400">CS Form 6 — Application for Leave</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CreditCard label="Sick Leave" value={credits?.sick_leave_balance} color="text-blue-600" />
        <CreditCard label="Vacation Leave" value={credits?.vacation_leave_balance} color="text-emerald-600" />
        <CreditCard label="Forced Leave" value={credits?.forced_leave_balance} color="text-amber-600" />
        <CreditCard label="Special Privilege" value={credits?.special_privilege_balance} color="text-purple-600" />
      </div>

      {/* APPLICATION FORM */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-6">New Leave Application</h2>
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 6.A — Leave Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">6.A — Type of Leave</p>
              <select
                value={form.leave_type}
                onChange={e => { setField('leave_type', e.target.value); resetDetailFields(); }}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none"
              >
                {LEAVE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Number of Working Days</p>
              <input
                type="number"
                value={form.num_days}
                onChange={e => setField('num_days', e.target.value)}
                min="0.5"
                step="0.5"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none"
                placeholder="e.g. 5"
              />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date From</p>
              <input
                type="date"
                value={form.date_from}
                onChange={e => setField('date_from', e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none"
              />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date To</p>
              <input
                type="date"
                value={form.date_to}
                onChange={e => setField('date_to', e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none"
              />
            </div>
          </div>

          {/* 6.B — Conditional Detail Fields */}
          {detailConfig && (
            <div className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-100">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">6.B — Details of Leave ({detailConfig.label})</p>
              {detailConfig.options.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {detailConfig.options.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition-all ${
                        form.detail_option === opt.value
                          ? 'border-[#1B3A6B] bg-[#1B3A6B]/5 text-[#1B3A6B]'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="detail_option"
                        value={opt.value}
                        checked={form.detail_option === opt.value}
                        onChange={e => setField('detail_option', e.target.value)}
                        className="sr-only"
                      />
                      <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                        form.detail_option === opt.value ? 'border-[#1B3A6B]' : 'border-slate-300'
                      }`}>
                        {form.detail_option === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-[#1B3A6B]" />}
                      </span>
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}
              {detailConfig.placeholder && (
                <input
                  type="text"
                  value={form.detail_text}
                  onChange={e => setField('detail_text', e.target.value)}
                  placeholder={detailConfig.placeholder}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none"
                />
              )}
              {selectedType === 'study' && (
                <div className="flex gap-3 flex-wrap">
                  {[
                    { value: 'masters_degree', label: "Completion of Master's Degree" },
                    { value: 'bar_review', label: 'BAR Review' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition-all ${
                        form.study_type === opt.value
                          ? 'border-[#1B3A6B] bg-[#1B3A6B]/5 text-[#1B3A6B]'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="study_type"
                        value={opt.value}
                        checked={form.study_type === opt.value}
                        onChange={e => setField('study_type', e.target.value)}
                        className="sr-only"
                      />
                      <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                        form.study_type === opt.value ? 'border-[#1B3A6B]' : 'border-slate-300'
                      }`}>
                        {form.study_type === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-[#1B3A6B]" />}
                      </span>
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}
              {selectedType === 'others' && (
                <div className="flex gap-3 flex-wrap">
                  {[
                    { value: 'monetization', label: 'Monetization of Leave Credits' },
                    { value: 'terminal_leave', label: 'Terminal Leave' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition-all ${
                        form.others_sub_type === opt.value
                          ? 'border-[#1B3A6B] bg-[#1B3A6B]/5 text-[#1B3A6B]'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="others_sub_type"
                        value={opt.value}
                        checked={form.others_sub_type === opt.value}
                        onChange={e => setField('others_sub_type', e.target.value)}
                        className="sr-only"
                      />
                      <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                        form.others_sub_type === opt.value ? 'border-[#1B3A6B]' : 'border-slate-300'
                      }`}>
                        {form.others_sub_type === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-[#1B3A6B]" />}
                      </span>
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Reason {selectedType === 'others' ? '(optional — sub-type will be prepended)' : ''}
            </p>
            <textarea
              value={form.reason}
              onChange={e => setField('reason', e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none resize-none"
            />
          </div>

          {/* 6.D — Commutation (vacation/special_privilege only) */}
          {showCommutation && (
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">6.D — Commutation</p>
              <div className="flex gap-3">
                {[
                  { value: 'requested', label: 'Requested' },
                  { value: 'not_requested', label: 'Not Requested' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-bold cursor-pointer transition-all ${
                      form.commutation === opt.value
                        ? 'border-[#1B3A6B] bg-[#1B3A6B]/5 text-[#1B3A6B]'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="commutation"
                      value={opt.value}
                      checked={form.commutation === opt.value}
                      onChange={e => setField('commutation', e.target.value)}
                      className="sr-only"
                    />
                    <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                      form.commutation === opt.value ? 'border-[#1B3A6B]' : 'border-slate-300'
                    }`}>
                      {form.commutation === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-[#1B3A6B]" />}
                    </span>
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* E-Signature Consent */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.esignature_consented}
                onChange={e => setField('esignature_consented', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1B3A6B] focus:ring-[#1B3A6B]"
              />
              <div className="flex items-start gap-2">
                <ShieldCheck size={16} className="text-[#1B3A6B] mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  I certify that the above information is true and correct to the best of my knowledge.
                  I consent to the use of my electronic signature for this application,
                  with the understanding that this carries the same weight as a physical signature
                  under applicable laws and regulations.
                </p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || !form.esignature_consented}
            className="bg-[#1B3A6B] text-white rounded-xl font-black uppercase text-xs px-8 py-3 hover:bg-[#162E55] disabled:opacity-50 flex items-center gap-2"
          >
            <CalendarCheck size={16} /> {submitting ? 'Submitting...' : 'Submit Leave'}
          </button>
        </form>
      </div>

      {/* LEAVE HISTORY */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-6">Leave History</h2>
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <CalendarCheck size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-400">No leave applications yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">From</th>
                  <th className="pb-3 pr-4">To</th>
                  <th className="pb-3 pr-4">Days</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} className="border-b border-slate-50 text-sm">
                    <td className="py-3 pr-4 font-bold text-slate-700 capitalize">{app.leave_type.replace(/_/g, ' ')}</td>
                    <td className="py-3 pr-4 text-slate-600">{new Date(app.date_from).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 text-slate-600">{new Date(app.date_to).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 text-slate-600">{app.num_days || '—'}</td>
                    <td className="py-3 pr-4">{statusBadge(app.status)}</td>
                    <td className="py-3 pr-4">
                      {(app.status === 'pending' || app.status === 'recommended') && (
                        <button onClick={() => cancelLeave(app.id)} className="text-[10px] font-black text-[#D6402F] uppercase hover:underline">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveApplication;
