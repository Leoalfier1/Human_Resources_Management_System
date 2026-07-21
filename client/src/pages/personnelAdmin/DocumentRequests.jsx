import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE } from '../../utils/api';
import { usePersonnelRealtime } from '../../hooks/usePersonnelRealtime';

const CATEGORY_LABELS = {
  service_record: 'Service Record',
  retrieval_of_folders: 'Retrieval of Application Folders',
  certificate_of_employment: 'Certificate of Employment',
  service_credits: 'Service Credits',
  personnel_forms: 'Copy of Personnel Forms/Documents',
  other: 'Other',
};

const FILTER_TABS = ['pending', 'processing', 'ready', 'released', 'rejected', 'all'];

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

const DetailRow = ({ label, value }) => (
  <div className="flex items-baseline gap-2">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest w-28 shrink-0">{label}</span>
    <span className="text-xs font-bold text-slate-600">{value}</span>
  </div>
);

const DocumentRequests = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [expandedRow, setExpandedRow] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: 50 });
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);
      const res = await fetch(`${API_BASE}/api/personnel/certificates/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  usePersonnelRealtime(['personnel:update', 'personnel:certificate:update'], () => {
    fetchData(true);
  });

  const handleProcess = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/personnel/certificates/${id}/process`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` }
    });
    fetchData();
  };

  const handleRelease = async (id, employeeId, requestCategory) => {
    const token = localStorage.getItem('token');
    let releasedFilePath = null;

    if (requestCategory === 'service_record') {
      releasedFilePath = `/api/personnel/certificates/${employeeId}/service-record`;
    } else if (requestCategory === 'certificate_of_employment') {
      releasedFilePath = `/api/personnel/certificates/${employeeId}/coe`;
    }

    await fetch(`${API_BASE}/api/personnel/certificates/${id}/release`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ released_file_path: releasedFilePath })
    });
    fetchData();
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/personnel/certificates/${rejectModal.id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rejection_reason: rejectReason || null })
    });
    setRejectModal(null);
    setRejectReason('');
    fetchData();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">Document Requests</h2>
          <p className="text-xs font-bold text-slate-400">Process employee document and certificate requests</p>
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-0.5">
          {FILTER_TABS.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${filterStatus === s ? 'bg-[#1B3A6B] text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.requests?.length ? (
          <div className="p-8 text-center">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-400">No document requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Sub-type</th>
                  <th className="p-4">Purpose</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.map(r => (
                  <React.Fragment key={r.id}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-700">{r.last_name}, {r.first_name}</td>
                      <td className="p-4 text-xs font-bold text-slate-600">{CATEGORY_LABELS[r.request_category] || r.request_category}</td>
                      <td className="p-4 text-xs text-slate-500">{r.request_subtype || '—'}</td>
                      <td className="p-4 text-xs text-slate-600 max-w-[200px] truncate">{r.purpose || '—'}</td>
                      <td className="p-4">{statusBadge(r.status)}</td>
                      <td className="p-4 text-slate-600 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {r.status === 'pending' && (
                            <button onClick={() => handleProcess(r.id)} className="bg-blue-500 text-white rounded-lg font-black text-[10px] uppercase px-3 py-2 hover:bg-blue-600 flex items-center gap-1">
                              <CheckCircle size={13} /> Process
                            </button>
                          )}
                          {r.status === 'processing' && (
                            <button onClick={() => handleRelease(r.id, r.employee_id, r.request_category)} className="bg-emerald-500 text-white rounded-lg font-black text-[10px] uppercase px-3 py-2 hover:bg-emerald-600 flex items-center gap-1">
                              <Download size={13} /> Release
                            </button>
                          )}
                          {(r.status === 'pending' || r.status === 'processing') && (
                            <button onClick={() => setRejectModal(r)} className="bg-red-50 text-red-600 rounded-lg font-black text-[10px] uppercase px-3 py-2 hover:bg-red-100 flex items-center gap-1">
                              <XCircle size={13} /> Reject
                            </button>
                          )}
                          {r.status === 'released' && (
                            <span className="text-[10px] font-black text-emerald-600">Completed</span>
                          )}
                          {r.status === 'rejected' && (
                            <span className="text-[10px] font-black text-red-500">Rejected</span>
                          )}
                          <button
                            onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                          >
                            {expandedRow === r.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === r.id && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={7} className="px-6 py-4 space-y-1.5">
                          {r.contact_no && <DetailRow label="Contact" value={r.contact_no} />}
                          {r.position_applied && <DetailRow label="Position Applied" value={r.position_applied} />}
                          {r.date_applied && <DetailRow label="Date Applied" value={r.date_applied} />}
                          {r.purpose && <DetailRow label="Purpose" value={r.purpose} />}
                          {r.details && <DetailRow label="Instructions" value={r.details} />}
                          {r.rejection_reason && <DetailRow label="Reject Reason" value={r.rejection_reason} />}
                          {!r.contact_no && !r.position_applied && !r.date_applied && !r.details && !r.rejection_reason && (
                            <p className="text-xs text-slate-400 italic">No additional details.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <h3 className="text-sm font-black text-slate-800">Reject Request</h3>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><XCircle size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500">
                Rejecting request from <strong>{rejectModal.last_name}, {rejectModal.first_name}</strong> ({CATEGORY_LABELS[rejectModal.request_category] || rejectModal.request_category}).
              </p>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rejection Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none"
                  placeholder="Optional reason for rejection..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="px-4 py-2 text-[10px] font-black text-slate-500 hover:text-slate-700 uppercase tracking-widest">Cancel</button>
              <button onClick={handleReject} className="px-5 py-2 text-[10px] font-black text-white bg-red-600 hover:bg-red-700 rounded-xl uppercase tracking-widest">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentRequests;
