import React, { useState } from 'react';
import { FileSignature, Download, ShieldCheck } from 'lucide-react';
import { API_BASE } from '../../utils/api';
import { useCertificates } from '../../hooks/useCertificates';

const CATEGORIES = [
  { value: 'service_record', label: 'Service Record for:' },
  { value: 'retrieval_of_folders', label: 'Retrieval of Application Folders' },
  { value: 'certificate_of_employment', label: 'Certificate of Employment' },
  { value: 'service_credits', label: 'Service Credits' },
  { value: 'personnel_forms', label: 'Copy of Personnel Forms/Documents' },
  { value: 'other', label: 'Other' },
];

const SUBTYPES = {
  service_record: [
    'Promotion', 'Loan Application', 'Retirement', 'Early Retirement',
    'Resignation', 'Termination', 'Transfer', 'Others (specify)'
  ],
  personnel_forms: [
    'CTC of NOSI', 'CTC of NOSA', 'CTC of Appointment'
  ],
};

const statusBadge = (status) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-700',
    processing: 'bg-blue-50 text-blue-700',
    ready: 'bg-green-50 text-green-700',
    released: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
  };
  const label = { pending: 'Pending', processing: 'Processing', ready: 'Ready', released: 'Released', rejected: 'Rejected' };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase ${styles[status] || 'bg-slate-100 text-slate-500'}`}>
      {label[status] || status}
    </span>
  );
};

const CATEGORY_LABELS = {
  service_record: 'Service Record',
  retrieval_of_folders: 'Retrieval of Application Folders',
  certificate_of_employment: 'Certificate of Employment',
  service_credits: 'Service Credits',
  personnel_forms: 'Copy of Personnel Forms/Documents',
  other: 'Other',
};

const CertificateRequests = () => {
  const { requests, loading, submitRequest, downloadServiceRecord, downloadCOE } = useCertificates();
  const [form, setForm] = useState({
    request_category: 'service_record',
    request_subtype: '',
    contact_no: '',
    purpose: '',
    details: '',
    position_applied: '',
    date_applied: '',
    esignature_consented: false,
  });
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

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.esignature_consented) return;
    setSubmitting(true);
    setMessage(null);
    const result = await submitRequest({
      request_category: form.request_category,
      request_subtype: form.request_subtype || null,
      contact_no: form.contact_no || null,
      purpose: form.purpose,
      details: form.details || null,
      position_applied: form.position_applied || null,
      date_applied: form.date_applied || null,
      esignature_consented: form.esignature_consented ? 1 : 0,
    });
    if (result.success) {
      setForm({
        request_category: 'service_record', request_subtype: '', contact_no: '',
        purpose: '', details: '', position_applied: '', date_applied: '',
        esignature_consented: false,
      });
      setMessage({ type: 'success', text: 'Request submitted.' });
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to submit.' });
    }
    setSubmitting(false);
  };

  const showSubtype = SUBTYPES[form.request_category];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic">Document Requests</h1>
        <p className="text-xs font-bold text-slate-400">Request Form (For Personnel Section Only)</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-6">New Request</h2>
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Request Category *</p>
            <select value={form.request_category} onChange={e => { setField('request_category', e.target.value); setField('request_subtype', ''); }} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Sub-type (conditional) */}
          {showSubtype && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Specify *</p>
              <select value={form.request_subtype} onChange={e => setField('request_subtype', e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none">
                <option value="">-- Select --</option>
                {showSubtype.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Contact No. */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact Number</p>
            <input
              type="tel"
              value={form.contact_no}
              onChange={e => setField('contact_no', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none"
              placeholder="e.g. 09123456789"
            />
          </div>

          {/* Purpose (required) */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Purpose *</p>
            <textarea
              value={form.purpose}
              onChange={e => setField('purpose', e.target.value)}
              rows={2}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none resize-none"
              placeholder="State the purpose of this request..."
            />
          </div>

          {/* Retrieval of Folders — conditional fields */}
          {form.request_category === 'retrieval_of_folders' && (
            <>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Position Applied For *</p>
                <input
                  type="text"
                  value={form.position_applied}
                  onChange={e => setField('position_applied', e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none"
                  placeholder="e.g. Teacher I"
                />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Applied *</p>
                <input
                  type="date"
                  value={form.date_applied}
                  onChange={e => setField('date_applied', e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none"
                />
              </div>
            </>
          )}

          {/* Details / Special Instructions (optional) */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Special Instructions (optional)</p>
            <textarea
              value={form.details}
              onChange={e => setField('details', e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none resize-none"
              placeholder="Any special instructions or notes..."
            />
          </div>

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
                  I consent to the use of my electronic signature for this request,
                  with the understanding that this carries the same weight as a physical signature
                  under applicable laws and regulations.
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-4 flex-wrap">
            <button
              type="submit"
              disabled={submitting || !form.esignature_consented}
              className="bg-[#1B3A6B] text-white rounded-xl font-black uppercase text-xs px-8 py-3 hover:bg-[#162E55] disabled:opacity-50 flex items-center gap-2"
            >
              <FileSignature size={16} /> {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            {employeeId && form.request_category === 'service_record' && (
              <button type="button" onClick={() => downloadServiceRecord(employeeId)} className="bg-emerald-600 text-white rounded-xl font-black uppercase text-xs px-8 py-3 hover:bg-emerald-700 flex items-center gap-2">
                <Download size={16} /> Download Service Record
              </button>
            )}
            {employeeId && form.request_category === 'certificate_of_employment' && (
              <button type="button" onClick={() => downloadCOE(employeeId)} className="bg-emerald-600 text-white rounded-xl font-black uppercase text-xs px-8 py-3 hover:bg-emerald-700 flex items-center gap-2">
                <Download size={16} /> Download CoE
              </button>
            )}
          </div>
        </form>
      </div>

      {/* My Requests Table */}
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
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Sub-type</th>
                  <th className="pb-3 pr-4">Purpose</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 text-sm">
                    <td className="py-3 pr-4 font-bold text-slate-700">{CATEGORY_LABELS[r.request_category] || r.request_category}</td>
                    <td className="py-3 pr-4 text-slate-600">{r.request_subtype || '—'}</td>
                    <td className="py-3 pr-4 text-slate-600 max-w-[300px] truncate">{r.purpose || '—'}</td>
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
