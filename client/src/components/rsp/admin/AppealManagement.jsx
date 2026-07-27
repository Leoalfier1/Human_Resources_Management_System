import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const AppealManagement = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondForm, setRespondForm] = useState({ id: null, decision: '', adminResponse: '' });

  const token = () => localStorage.getItem('token');

  const fetchAppeals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/rsp/appeals`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setAppeals(await res.json());
    } catch (err) {
      console.error('Failed to fetch appeals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppeals(); }, []);

  const handleRespond = async (id, decision) => {
    try {
      const res = await fetch(`${API_BASE}/api/rsp/appeals/${id}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ decision, adminResponse: respondForm.adminResponse || `Appeal ${decision}` }),
      });
      if (res.ok) {
        setRespondForm({ id: null, decision: '', adminResponse: '' });
        fetchAppeals();
      }
    } catch (err) {
      console.error('Failed to respond:', err);
    }
  };

  if (loading) {
    return <div className="flex justify-center pt-32"><div className="w-8 h-8 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RSP Process</p>
        <h2 className="text-2xl font-black text-[#1B3A6B]">Appeal Management</h2>
      </div>

      {appeals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <Shield size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 font-black text-sm">No pending appeals</p>
          <p className="text-slate-300 text-xs mt-1">All appeals have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appeals.map((appeal) => (
            <motion.div
              key={appeal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-black text-[#1B3A6B]">{appeal.full_name}</p>
                  <p className="text-xs text-slate-400">{appeal.email}</p>
                  <p className="text-xs font-bold text-slate-500 mt-1">{appeal.position_title} — {appeal.vacancy_ref}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                  Pending Review
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <div className="flex gap-2">
                  <MessageSquare size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-600">{appeal.reason}</p>
                </div>
              </div>

              {respondForm.id === appeal.id ? (
                <div className="space-y-3">
                  <textarea
                    value={respondForm.adminResponse}
                    onChange={(e) => setRespondForm({ ...respondForm, adminResponse: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
                    placeholder="Admin response (optional)"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleRespond(appeal.id, 'approved')} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all">
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => handleRespond(appeal.id, 'rejected')} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all">
                      <XCircle size={14} /> Reject
                    </button>
                    <button onClick={() => setRespondForm({ id: null, decision: '', adminResponse: '' })} className="text-slate-400 hover:text-slate-600 px-4 py-2 text-xs font-bold">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setRespondForm({ id: appeal.id, decision: '', adminResponse: '' })}
                  className="text-[#1B3A6B] hover:text-[#122a4f] text-xs font-black transition-all"
                >
                  Review Appeal →
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppealManagement;
