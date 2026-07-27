import React, { useState, useEffect } from 'react';
import { Check, X, Plane } from 'lucide-react';
import { API_BASE } from '../../utils/api';

const statusBadge = (status) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };
  return `inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase ${styles[status] || 'bg-slate-100 text-slate-500'}`;
};

const TravelManagement = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: 50 });
      if (filterStatus) params.append('status', filterStatus);
      const res = await fetch(`${API_BASE}/api/personnel/travel/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  const handleApprove = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/personnel/travel/${id}/approve`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` }
    });
    fetchData();
  };

  const handleReject = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/personnel/travel/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rejection_reason: rejectReason })
    });
    setRejectModal(null);
    setRejectReason('');
    fetchData();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">Travel Management</h2>
          <p className="text-xs font-bold text-slate-400">Review and process travel authority requests</p>
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'all'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s === 'all' ? '' : s)}
              className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all ${filterStatus === s || (s === 'all' && !filterStatus) ? 'bg-[#1B3A6B] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
            >
              {s || 'all'}
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
            <Plane size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-400">No travel requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Destination</th>
                  <th className="p-4">From</th>
                  <th className="p-4">To</th>
                  <th className="p-4">Purpose</th>
                  <th className="p-4">Expense</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 text-sm hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-700">{r.last_name}, {r.first_name}</td>
                    <td className="p-4 text-slate-600">{r.destination}</td>
                    <td className="p-4 text-slate-600">{new Date(r.date_from).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-600">{new Date(r.date_to).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-600 max-w-[200px] truncate">{r.purpose}</td>
                    <td className="p-4 text-slate-600">{r.estimated_expense ? `₱${parseFloat(r.estimated_expense).toLocaleString()}` : '—'}</td>
                    <td className="p-4">{statusBadge(r.status)}</td>
                    <td className="p-4">
                      {r.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(r.id)} className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"><Check size={16} /></button>
                          <button onClick={() => setRejectModal(r)} className="bg-[#D6402F] text-white p-2 rounded-lg hover:bg-[#b53526] transition-colors"><X size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-4">Reject Travel</h3>
            <p className="text-sm font-bold text-slate-600 mb-4">Reason for rejection:</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none resize-none mb-6" placeholder="Optional reason..." />
            <div className="flex gap-3">
              <button onClick={() => handleReject(rejectModal.id)} className="bg-[#D6402F] text-white rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-[#b53526] flex-1">Confirm Reject</button>
              <button onClick={() => setRejectModal(null)} className="border border-slate-200 text-slate-500 rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-slate-50 flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelManagement;
