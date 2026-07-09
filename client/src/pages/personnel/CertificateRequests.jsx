import React, { useState } from 'react';
import { FileSignature, Download } from 'lucide-react';
import { API_BASE } from '../../utils/api';
import { useCertificates } from '../../hooks/useCertificates';

const REQUEST_TYPES = [
  { value: 'service_record', label: 'Service Record' },
  { value: 'coe', label: 'Certificate of Employment (CoE)' },
  { value: 'coe_with_compensation', label: 'CoE with Compensation' },
  { value: 'id_replacement', label: 'ID Replacement' },
  { value: 'correction_personal_info', label: 'Correction of Personal Info' },
  { value: 'employment_verification', label: 'Employment Verification' },
  { value: 'other', label: 'Other' },
];

const statusBadge = (status) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-700',
    processing: 'bg-blue-50 text-blue-700',
    ready: 'bg-green-50 text-green-700',
    released: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
  };
  return `inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase ${styles[status] || 'bg-slate-100 text-slate-500'}`;
};

const CertificateRequests = () => {
  const { requests, loading, submitRequest, downloadServiceRecord, downloadCOE } = useCertificates();
  const [form, setForm] = useState({ request_type: 'service_record', details: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);

  React.useEffect(() => {
    const fetchEmpId = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/personnel/employees/my-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEmployeeId(data.id);
        }
      } catch {}
    };
    fetchEmpId();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const result = await submitRequest(form);
    if (result.success) {
      setForm({ request_type: 'service_record', details: '' });
      setMessage({ type: 'success', text: 'Request submitted.' });
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
        <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic">Certificate & Document Requests</h1>
        <p className="text-xs font-bold text-slate-400">Request employment documents and certificates</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-6">New Request</h2>
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Request Type</p>
            <select value={form.request_type} onChange={e => setForm({...form, request_type: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none">
              {REQUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Details (optional)</p>
            <textarea value={form.details} onChange={e => setForm({...form, details: e.target.value})} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none resize-none" placeholder="Any special instructions or notes..." />
          </div>
          <div className="flex gap-4">
            <button type="submit" disabled={submitting} className="bg-[#1B3A6B] text-white rounded-xl font-black uppercase text-xs px-8 py-3 hover:bg-[#162E55] disabled:opacity-50 flex items-center gap-2">
              <FileSignature size={16} /> {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            {employeeId && form.request_type === 'service_record' && (
              <button type="button" onClick={() => downloadServiceRecord(employeeId)} className="bg-emerald-600 text-white rounded-xl font-black uppercase text-xs px-8 py-3 hover:bg-emerald-700 flex items-center gap-2">
                <Download size={16} /> Download Service Record
              </button>
            )}
            {employeeId && form.request_type === 'coe' && (
              <button type="button" onClick={() => downloadCOE(employeeId)} className="bg-emerald-600 text-white rounded-xl font-black uppercase text-xs px-8 py-3 hover:bg-emerald-700 flex items-center gap-2">
                <Download size={16} /> Download CoE
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-6">My Requests</h2>
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <FileSignature size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-400">No requests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Details</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 text-sm">
                    <td className="py-3 pr-4 font-bold text-slate-700 capitalize">{r.request_type.replace(/_/g, ' ')}</td>
                    <td className="py-3 pr-4 text-slate-600 max-w-[300px] truncate">{r.details || '—'}</td>
                    <td className="py-3 pr-4">{statusBadge(r.status)}</td>
                    <td className="py-3 pr-4 text-slate-600 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
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

export default CertificateRequests;
