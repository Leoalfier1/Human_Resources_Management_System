import React, { useState } from 'react';
import { Plane } from 'lucide-react';
import { SERVER_BASE } from '../../utils/api';
import { useTravel } from '../../hooks/useTravel';

const statusBadge = (status) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };
  return `inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase ${styles[status] || 'bg-slate-100 text-slate-500'}`;
};

const TravelAuthority = () => {
  const { requests, loading, submitTravel, cancelTravel } = useTravel();
  const [form, setForm] = useState({ purpose: '', destination: '', date_from: '', date_to: '', transport_mode: '', estimated_expense: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('file', file);
    const result = await submitTravel(fd);
    if (result.success) {
      setForm({ purpose: '', destination: '', date_from: '', date_to: '', transport_mode: '', estimated_expense: '' });
      setFile(null);
      setMessage({ type: 'success', text: 'Travel request submitted.' });
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

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic">Travel Authority</h1>
        <p className="text-xs font-bold text-slate-400">Request and track travel authority</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-6">New Travel Request</h2>
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Purpose</p>
              <textarea value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} required rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none resize-none" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
              <input type="text" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transport Mode</p>
              <input type="text" value={form.transport_mode} onChange={e => setForm({...form, transport_mode: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none" placeholder="e.g. Private vehicle, Bus" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date From</p>
              <input type="date" value={form.date_from} onChange={e => setForm({...form, date_from: e.target.value})} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date To</p>
              <input type="date" value={form.date_to} onChange={e => setForm({...form, date_to: e.target.value})} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Expense (₱)</p>
              <input type="number" value={form.estimated_expense} onChange={e => setForm({...form, estimated_expense: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Supporting File (optional)</p>
            <input type="file" onChange={e => setFile(e.target.files[0])} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#1B3A6B] file:text-white file:text-xs file:font-black file:uppercase" />
          </div>
          <button type="submit" disabled={submitting} className="bg-[#1B3A6B] text-white rounded-xl font-black uppercase text-xs px-8 py-3 hover:bg-[#162E55] disabled:opacity-50 flex items-center gap-2">
            <Plane size={16} /> {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-6">My Travel Requests</h2>
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <Plane size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-400">No travel requests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-3 pr-4">Destination</th>
                  <th className="pb-3 pr-4">From</th>
                  <th className="pb-3 pr-4">To</th>
                  <th className="pb-3 pr-4">Purpose</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 text-sm">
                    <td className="py-3 pr-4 font-bold text-slate-700">{r.destination}</td>
                    <td className="py-3 pr-4 text-slate-600">{new Date(r.date_from).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 text-slate-600">{new Date(r.date_to).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 text-slate-600 max-w-[200px] truncate">{r.purpose}</td>
                    <td className="py-3 pr-4">{statusBadge(r.status)}</td>
                    <td className="py-3 pr-4">
                      {r.status === 'pending' && (
                        <button onClick={() => cancelTravel(r.id)} className="text-[10px] font-black text-[#D6402F] uppercase hover:underline">Cancel</button>
                      )}
                      {r.status === 'approved' && r.travel_order_path && (
                        <a href={`${SERVER_BASE}${r.travel_order_path}`} target="_blank" rel="noreferrer" className="text-[10px] font-black text-[#1B3A6B] uppercase hover:underline">Download Order</a>
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

export default TravelAuthority;
