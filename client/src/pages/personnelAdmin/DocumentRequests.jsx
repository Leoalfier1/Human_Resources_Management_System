import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, Download } from 'lucide-react';
import { API_BASE } from '../../utils/api';

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

const DocumentRequests = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: 50 });
      if (filterStatus) params.append('status', filterStatus);
      const res = await fetch(`${API_BASE}/api/personnel/certificates/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  const handleProcess = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/personnel/certificates/${id}/process`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` }
    });
    fetchData();
  };

  const handleRelease = async (id, employeeId, requestType) => {
    const token = localStorage.getItem('token');
    let releasedFilePath = null;

    if (requestType === 'service_record') {
      releasedFilePath = `/api/personnel/certificates/${employeeId}/service-record`;
    } else if (requestType === 'coe' || requestType === 'coe_with_compensation') {
      releasedFilePath = `/api/personnel/certificates/${employeeId}/coe`;
    }

    await fetch(`${API_BASE}/api/personnel/certificates/${id}/release`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ released_file_path: releasedFilePath })
    });
    fetchData();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">Document Requests</h2>
          <p className="text-xs font-bold text-slate-400">Process employee document and certificate requests</p>
        </div>
        <div className="flex gap-2">
          {['pending', 'processing', 'ready', 'released', 'all'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s === 'all' ? '' : s)}
              className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all ${filterStatus === s || (s === 'all' && !filterStatus) ? 'bg-[#1B3A6B] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
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
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 text-sm hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-700">{r.last_name}, {r.first_name}</td>
                    <td className="p-4 capitalize text-slate-600">{r.request_type.replace(/_/g, ' ')}</td>
                    <td className="p-4 text-slate-600 max-w-[200px] truncate">{r.details || '—'}</td>
                    <td className="p-4">{statusBadge(r.status)}</td>
                    <td className="p-4 text-slate-600 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {r.status === 'pending' && (
                          <button onClick={() => handleProcess(r.id)} className="bg-blue-500 text-white rounded-lg font-black text-[10px] uppercase px-3 py-2 hover:bg-blue-600 flex items-center gap-1">
                            <CheckCircle size={14} /> Process
                          </button>
                        )}
                        {r.status === 'processing' && (
                          <button onClick={() => handleRelease(r.id, r.employee_id, r.request_type)} className="bg-emerald-500 text-white rounded-lg font-black text-[10px] uppercase px-3 py-2 hover:bg-emerald-600 flex items-center gap-1">
                            <Download size={14} /> Release
                          </button>
                        )}
                        {r.status === 'released' && (
                          <span className="text-[10px] font-black text-emerald-600">Completed</span>
                        )}
                      </div>
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

export default DocumentRequests;
