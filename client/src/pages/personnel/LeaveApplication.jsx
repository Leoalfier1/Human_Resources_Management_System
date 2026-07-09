import React, { useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { useLeave } from '../../hooks/useLeave';

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'vacation', label: 'Vacation Leave' },
  { value: 'special_privilege', label: 'Special Privilege Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'forced', label: 'Forced Leave' },
  { value: 'study', label: 'Study Leave' },
  { value: 'rehabilitation', label: 'Rehabilitation Leave' },
  { value: 'vawc', label: 'VAWC Leave' },
  { value: 'solo_parent', label: 'Solo Parent Leave' },
];

const statusBadge = (status) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };
  return `inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase ${styles[status] || 'bg-slate-100 text-slate-500'}`;
};

const LeaveApplication = () => {
  const { credits, applications, loading, submitLeave, cancelLeave } = useLeave();
  const [form, setForm] = useState({ leave_type: 'sick', date_from: '', date_to: '', num_days: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const result = await submitLeave(form);
    if (result.success) {
      setForm({ leave_type: 'sick', date_from: '', date_to: '', num_days: '', reason: '' });
      setMessage({ type: 'success', text: 'Leave application submitted.' });
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to submit.' });
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
    </div>
  );

  const CreditCard = ({ label, value, color }) => (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center`}>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-4xl font-black ${color}`}>{value || 0}</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic">Leave Application</h1>
        <p className="text-xs font-bold text-slate-400">Manage your leave credits and applications</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CreditCard label="Sick Leave" value={credits?.sick_leave_balance} color="text-blue-600" />
        <CreditCard label="Vacation Leave" value={credits?.vacation_leave_balance} color="text-emerald-600" />
        <CreditCard label="Forced Leave" value={credits?.forced_leave_balance} color="text-amber-600" />
        <CreditCard label="Special Privilege" value={credits?.special_privilege_balance} color="text-purple-600" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-6">New Leave Application</h2>
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leave Type</p>
              <select value={form.leave_type} onChange={e => setForm({...form, leave_type: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none">
                {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Number of Days</p>
              <input type="number" value={form.num_days} onChange={e => setForm({...form, num_days: e.target.value})} min="0.5" step="0.5" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none" placeholder="e.g. 5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date From</p>
              <input type="date" value={form.date_from} onChange={e => setForm({...form, date_from: e.target.value})} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date To</p>
              <input type="date" value={form.date_to} onChange={e => setForm({...form, date_to: e.target.value})} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reason</p>
            <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none resize-none" />
          </div>
          <button type="submit" disabled={submitting} className="bg-[#1B3A6B] text-white rounded-xl font-black uppercase text-xs px-8 py-3 hover:bg-[#162E55] disabled:opacity-50 flex items-center gap-2">
            <CalendarCheck size={16} /> {submitting ? 'Submitting...' : 'Submit Leave'}
          </button>
        </form>
      </div>

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
                      {app.status === 'pending' && (
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
