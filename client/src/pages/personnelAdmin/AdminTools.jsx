import React, { useState, useEffect, useCallback } from 'react';
import {
  Download, CalendarCheck, Lock, RotateCcw, Database, FileSpreadsheet,
  AlertTriangle, CheckCircle, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { API_BASE } from '../../utils/api';
import { usePersonnelRealtime } from '../../hooks/usePersonnelRealtime';

const AdminTools = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accrueForm, setAccrueForm] = useState({ leave_type: 'sick', days: '', reason: '' });
  const [accruing, setAccruing] = useState(false);
  const [lockConfirm, setLockConfirm] = useState(false);
  const [locking, setLocking] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [backing, setBacking] = useState(false);
  const [backups, setBackups] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [showAccrue, setShowAccrue] = useState(false);

  const fetchStats = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/admin-tools/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchBackups = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/admin-tools/backups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setBackups(await res.json());
    } catch {}
  }, []);

  useEffect(() => { fetchStats(); fetchBackups(); }, [fetchStats, fetchBackups]);

  usePersonnelRealtime(['personnel:update', 'personnel:leave:update'], () => {
    fetchStats(true);
  });

  const handleAccrue = async () => {
    if (!accrueForm.days || Number(accrueForm.days) <= 0) return;
    setAccruing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/admin-tools/accrue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...accrueForm, days: Number(accrueForm.days) })
      });
      const data = await res.json();
      if (res.ok) { showMsg(data.message); setAccrueForm({ leave_type: 'sick', days: '', reason: '' }); setShowAccrue(false); fetchStats(); }
      else showMsg(data.message, false);
    } catch { showMsg('Request failed.', false); } finally { setAccruing(false); }
  };

  const handleYearEndLock = async () => {
    setLocking(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/admin-tools/year-end-lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fiscal_year: new Date().getFullYear() })
      });
      const data = await res.json();
      if (res.ok) { showMsg(data.message); setLockConfirm(false); fetchStats(); }
      else showMsg(data.message, false);
    } catch { showMsg('Request failed.', false); } finally { setLocking(false); }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/admin-tools/reset-balances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok) { showMsg(data.message); setResetConfirm(false); }
      else showMsg(data.message, false);
    } catch { showMsg('Request failed.', false); } finally { setResetting(false); }
  };

  const handleBackup = async () => {
    setBacking(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/admin-tools/backup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) { showMsg(data.message + ' — ' + data.filename); fetchBackups(); }
      else showMsg(data.message, false);
    } catch { showMsg('Backup failed.', false); } finally { setBacking(false); }
  };

  const handleExport = async (type) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/personnel/admin-tools/export/${type}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = type + '.csv'; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const Card = ({ icon: Icon, title, desc, children, color = 'blue' }) => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-${color}-50`}>
          <Icon size={16} className={`text-${color}-600`} />
        </div>
        <div>
          <h3 className="text-xs font-black text-slate-800">{title}</h3>
          <p className="text-[10px] font-semibold text-slate-400">{desc}</p>
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] via-[#234E8A] to-[#1B3A6B] px-6 pt-5 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Database size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">Admin Tools</h1>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Leave Management Utilities</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">
        {/* Feedback */}
        {feedback && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold ${feedback.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {feedback.ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {feedback.msg}
          </div>
        )}

        {/* Stats Row */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Applications', value: stats.total, color: 'slate' },
              { label: 'Pending', value: stats.pending, color: 'amber' },
              { label: 'Recommended', value: stats.recommended, color: 'blue' },
              { label: 'Approved', value: stats.approved, color: 'green' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className={`text-xl font-black text-${s.color}-600 mt-0.5`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Automated Functions */}
          <div className="space-y-4">
            {/* Leave Credit Accrual */}
            <Card icon={CalendarCheck} title="Leave Credit Accrual" desc="Manually add credits" color="emerald">
              <button
                onClick={() => setShowAccrue(!showAccrue)}
                className="flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest"
              >
                {showAccrue ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showAccrue ? 'Collapse' : 'Open Panel'}
              </button>
              {showAccrue && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leave Type</label>
                      <select
                        value={accrueForm.leave_type}
                        onChange={e => setAccrueForm({ ...accrueForm, leave_type: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      >
                        <option value="sick">Sick Leave</option>
                        <option value="vacation">Vacation Leave</option>
                        <option value="forced">Forced Leave</option>
                        <option value="special_privilege">Special Privilege</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Days</label>
                      <input
                        type="number"
                        min="0"
                        value={accrueForm.days}
                        onChange={e => setAccrueForm({ ...accrueForm, days: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        placeholder="e.g. 15"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reason</label>
                    <input
                      value={accrueForm.reason}
                      onChange={e => setAccrueForm({ ...accrueForm, reason: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      placeholder="e.g. Annual entitlement"
                    />
                  </div>
                  <button
                    onClick={handleAccrue}
                    disabled={accruing || !accrueForm.days}
                    className="px-4 py-2 text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-40 uppercase tracking-widest"
                  >
                    {accruing ? 'Accruing...' : 'Accrue Credits'}
                  </button>
                </div>
              )}
            </Card>

            {/* Year-End Lock */}
            <Card icon={Lock} title="Year-End Lock" desc="Freeze current balances" color="amber">
              {!stats?.currentYearLocked ? (
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-slate-500">
                    Snapshots current balances into <code className="bg-slate-100 px-1 rounded">leave_carryover</code> for FY {new Date().getFullYear()}, then reduces balances to carryover amounts.
                  </p>
                  {lockConfirm ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                        <AlertTriangle size={14} /> Are you sure? This cannot be undone.
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setLockConfirm(false)} className="px-3 py-1.5 text-[10px] font-black text-slate-500 bg-white border border-slate-200 rounded-lg">Cancel</button>
                        <button onClick={handleYearEndLock} disabled={locking} className="px-3 py-1.5 text-[10px] font-black text-white bg-amber-600 rounded-lg">
                          {locking ? 'Locking...' : 'Confirm Lock'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setLockConfirm(true)} className="px-4 py-2 text-[10px] font-black text-white bg-amber-600 hover:bg-amber-700 rounded-xl uppercase tracking-widest">
                      Execute Year-End Lock
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs font-bold text-green-600">FY {new Date().getFullYear()} is already locked.</p>
              )}
            </Card>

            {/* Reset Balances */}
            <Card icon={RotateCcw} title="Reset Leave Balances" desc="Reset all to defaults" color="red">
              <p className="text-[11px] font-semibold text-slate-500 mb-3">Resets all employees' leave credits to default (15 SL, 15 VL, 0 FL, 0 SPL).</p>
              {resetConfirm ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-700">
                    <AlertTriangle size={14} /> This will overwrite all balances. Continue?
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setResetConfirm(false)} className="px-3 py-1.5 text-[10px] font-black text-slate-500 bg-white border border-slate-200 rounded-lg">Cancel</button>
                    <button onClick={handleReset} disabled={resetting} className="px-3 py-1.5 text-[10px] font-black text-white bg-red-600 rounded-lg">
                      {resetting ? 'Resetting...' : 'Confirm Reset'}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setResetConfirm(true)} className="px-4 py-2 text-[10px] font-black text-white bg-red-600 hover:bg-red-700 rounded-xl uppercase tracking-widest">
                  Reset All Balances
                </button>
              )}
            </Card>
          </div>

          {/* Quick Data */}
          <div className="space-y-4">
            {/* CSV Exports */}
            <Card icon={FileSpreadsheet} title="CSV Exports" desc="Download reports" color="indigo">
              <div className="space-y-2">
                <button
                  onClick={() => handleExport('leave-applications')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all group"
                >
                  <Download size={16} className="text-slate-400 group-hover:text-indigo-600" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-700">Leave Applications</p>
                    <p className="text-[10px] font-semibold text-slate-400">All applications with status</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport('leave-credits')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all group"
                >
                  <Download size={16} className="text-slate-400 group-hover:text-indigo-600" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-700">Leave Credits</p>
                    <p className="text-[10px] font-semibold text-slate-400">Current balances for all employees</p>
                  </div>
                </button>
              </div>
            </Card>

            {/* DB Backup */}
            <Card icon={Database} title="Database Backup" desc="Create a full backup" color="slate">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-slate-500">
                  Runs <code className="bg-slate-100 px-1 rounded">mysqldump</code> and saves a .sql file to the backups folder.
                </p>
                <button
                  onClick={handleBackup}
                  disabled={backing}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-white bg-slate-700 hover:bg-slate-800 rounded-xl disabled:opacity-40 uppercase tracking-widest"
                >
                  {backing ? <RefreshCw size={12} className="animate-spin" /> : <Database size={12} />}
                  {backing ? 'Backing up...' : 'Create Backup'}
                </button>
                {backups.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Backups</p>
                    {backups.slice(0, 5).map((b, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg">
                        <span className="text-[10px] font-semibold text-slate-600 truncate">{b.filename}</span>
                        <span className="text-[10px] font-bold text-slate-400 ml-2 shrink-0">{(b.size / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTools;
