import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, CheckCircle2, Clock, FileText, 
  AlertTriangle, Plus, CornerDownRight, Download, RefreshCw, AlertCircle, FileUp, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, api, SOCKET_URL } from '../utils/api';
import io from 'socket.io-client';

const MonitoringCoaching = () => {
  const { token } = useAuth();
  
  // Data States
  const [personnel, setPersonnel] = useState([]);
  const [logs, setLogs] = useState({});
  const [targets, setTargets] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filtering & Selection
  const [posType, setPosType] = useState('all');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);

  // Form State
  const [showLogForm, setShowLogForm] = useState(false);
  const [note, setNote] = useState('');
  const [targetId, setTargetId] = useState('');
  const [customObjective, setCustomObjective] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [evidencePreviewUrl, setEvidencePreviewUrl] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Fetch personnel
  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const periodId = localStorage.getItem('selected_period_id') || '';
      const query = `/pm/coaching/personnel?position_type=${posType}${periodId ? `&period_id=${periodId}` : ''}`;
      const res = await apiGet(query);
      if (res.ok) {
        setPersonnel(await res.json());
      }
    } catch (e) {
      console.error("Fetch Coaching Personnel Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPersonnel();
  }, [token, posType]);

  // Listen for local changes to selected period ID in header
  useEffect(() => {
    const handlePeriodChange = () => {
      setSelectedPerson(null);
      fetchPersonnel();
    };
    window.addEventListener('selected_period_changed', handlePeriodChange);
    return () => window.removeEventListener('selected_period_changed', handlePeriodChange);
  }, []);

  // Keep selectedPerson ref in sync for socket callbacks without stale closures
  const selectedPersonRef = useRef(null);
  useEffect(() => {
    selectedPersonRef.current = selectedPerson;
  }, [selectedPerson]);

  // Real-time socket updates
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.emit('join_admin_room');

    const handleRefresh = () => fetchPersonnel();

    const handleCoachingNew = async (data) => {
      fetchPersonnel();
      
      const currentSelected = selectedPersonRef.current;
      if (currentSelected && data && String(data.commitment_id) === String(currentSelected.commitment_id)) {
        try {
          const res = await apiGet(`/pm/coaching/logs/${currentSelected.commitment_id}`);
          if (res.ok) {
            const logsData = await res.json();
            setLogs(prev => ({ ...prev, [currentSelected.commitment_id]: logsData }));
          }
        } catch (e) {
          console.error("Error refreshing active logs via socket:", e);
        }
      }
    };

    socket.on('notification_received', handleRefresh);
    socket.on('commitment:submitted', handleRefresh);
    socket.on('ipcrf:status_changed', handleRefresh);
    socket.on('coaching:new', handleCoachingNew);
    socket.on('performance_update', handleRefresh);

    return () => {
      socket.off('notification_received', handleRefresh);
      socket.off('commitment:submitted', handleRefresh);
      socket.off('ipcrf:status_changed', handleRefresh);
      socket.off('coaching:new', handleCoachingNew);
      socket.off('performance_update', handleRefresh);
      socket.disconnect();
    };
  }, [token]);

  // Polling fallback every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => { if (token) fetchPersonnel(); }, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Load detailed logs & targets
  const handleSelectPerson = async (p) => {
    if (selectedPerson?.commitment_id === p.commitment_id) {
      setSelectedPerson(null);
      return;
    }
    
    try {
      setLogsLoading(true);
      setSelectedPerson(p);
      
      const [logsRes, targetsRes] = await Promise.all([
        apiGet(`/pm/coaching/logs/${p.commitment_id}`),
        apiGet(`/pm/planning/commitments/${p.commitment_id}/targets`)
      ]);

      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(prev => ({ ...prev, [p.commitment_id]: data }));
      }
      if (targetsRes.ok) {
        const data = await targetsRes.json();
        setTargets(prev => ({ ...prev, [p.commitment_id]: data }));
      }
    } catch (e) {
      console.error("Fetch Logs/Targets Error:", e);
    } finally {
      setLogsLoading(false);
    }
  };

  // Add Coaching Log
  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!note) return;

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('commitment_id', selectedPerson.commitment_id);
      if (targetId && targetId !== 'custom_other') {
        data.append('target_id', targetId);
      }
      
      const notePayload = targetId === 'custom_other' ? `[Objective: ${customObjective}] ${note}` : note;
      data.append('note', notePayload);
      data.append('entry_date', entryDate);
      if (evidenceFile) {
        data.append('evidence', evidenceFile);
      }

      const res = await apiPost('/pm/coaching/logs', data);

      if (res.ok) {
        alert("Coaching log entry added successfully!");
        setNote('');
        setTargetId('');
        setCustomObjective('');
        setEvidenceFile(null);
        setShowLogForm(false);
        
        const logsRes = await apiGet(`/pm/coaching/logs/${selectedPerson.commitment_id}`);
        if (logsRes.ok) {
          const lData = await logsRes.json();
          setLogs(prev => ({ ...prev, [selectedPerson.commitment_id]: lData }));
        }
        fetchPersonnel();
      } else {
        const errBody = await res.json().catch(() => ({ message: 'Unknown error' }));
        alert(`Failed to add coaching entry: ${errBody.message || errBody.error || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Network error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-[#F3F4F6] min-h-[calc(100vh-56px)] space-y-6">
      
      {/* Filter and Content Card */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 space-y-6">
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <select
              value={posType}
              onChange={e => { setPosType(e.target.value); setSelectedPerson(null); }}
              className="bg-yellow-50 border border-yellow-200/80 text-yellow-800 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer transition-colors hover:bg-yellow-100/50"
            >
              <option value="all">All Position Types</option>
              <option value="non_teaching">Non-Teaching Staff</option>
              <option value="teaching">Teaching Staff</option>
              <option value="teaching_related">Teaching-Related Staff</option>
            </select>
          </div>
          
          <button 
            onClick={fetchPersonnel}
            className="flex items-center gap-1.5 border border-[#D6402F]/20 bg-[#D6402F]/5 text-[#D6402F] hover:bg-[#D6402F]/10 hover:border-[#D6402F]/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors"
          >
            <RefreshCw size={12} /> Sync Data
          </button>
        </div>

        {/* Table List */}
        {loading ? (
          <div className="text-center py-12 text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">Loading personnel list...</div>
        ) : personnel.length === 0 ? (
          <div className="text-center py-12 text-xs font-bold text-slate-600 uppercase tracking-widest">No active personnel commitments found.</div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 text-slate-600">
                    <th className="px-6 py-3.5">Employee Name / Position</th>
                    <th className="px-6 py-3.5 hidden md:table-cell">Unit</th>
                    <th className="px-6 py-3.5 hidden lg:table-cell">Position Type</th>
                    <th className="px-6 py-3.5">Total Logs</th>
                    <th className="px-6 py-3.5 hidden md:table-cell">Last Log Date</th>
                    <th className="px-6 py-3.5">Checkpoint Alert</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {personnel.map(p => {
                    const isExpanded = selectedPerson?.commitment_id === p.commitment_id;

                    return (
                      <React.Fragment key={p.commitment_id}>
                        <tr className={`hover:bg-slate-50/40 transition-colors ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="font-black uppercase text-black">{p.employee_name}</div>
                            <div className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">{p.employee_position}</div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell text-slate-800 font-semibold">{p.employee_unit || '—'}</td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-wider rounded-md border border-slate-200/60">
                              {p.position_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">{p.coaching_count} entries</td>
                          <td className="px-6 py-4 hidden md:table-cell text-slate-600 font-semibold">
                            {p.last_coaching_date ? p.last_coaching_date.split('T')[0] : 'No Logs Yet'}
                          </td>
                          <td className="px-6 py-4">
                            {p.needs_coaching_attention ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 text-[9px] font-black uppercase tracking-wider animate-pulse">
                                <AlertTriangle size={10} /> Midpoint: Needs Coaching
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[9px] font-black uppercase tracking-wider">
                                Monitoring Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleSelectPerson(p)}
                              className="inline-flex items-center gap-1 text-[9px] font-black text-black hover:text-[#D6402F] uppercase tracking-widest transition-colors cursor-pointer"
                            >
                              {isExpanded ? 'Collapse' : 'Timeline'} <ArrowRight size={10} />
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Timeline and Add Log Drawer */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="bg-slate-50/40 p-6 border-t border-b border-slate-200/80">
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                                >
                                  {/* Left/Middle: Timeline */}
                                  <div className="lg:col-span-2 space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                      <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                                        <CornerDownRight size={12} /> Coaching Logs &amp; Progress Timeline
                                      </h4>
                                    </div>

                                    {logsLoading ? (
                                      <div className="text-center py-6 text-slate-600 font-bold uppercase tracking-wider animate-pulse">Loading timeline...</div>
                                    ) : !logs[p.commitment_id] || logs[p.commitment_id].length === 0 ? (
                                      <div className="text-center py-6 text-slate-600 font-bold uppercase tracking-wider">No coaching logs logged yet.</div>
                                    ) : (
                                      <div className="relative border-l-2 border-slate-200 pl-4 ml-2 space-y-6">
                                        {logs[p.commitment_id].map((log) => {
                                          let displayCategory = log.kra_category;
                                          let displayNote = log.note;
                                          if (!displayCategory && log.note && log.note.startsWith('[Objective: ')) {
                                            const match = log.note.match(/^\[Objective:\s*([^\]]+)\]\s*(.*)$/s);
                                            if (match) {
                                              displayCategory = match[1];
                                              displayNote = match[2];
                                            }
                                          }

                                          return (
                                            <div key={log.id} className="relative space-y-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                                              {/* Timeline Bullet */}
                                              <div className="absolute -left-[23px] top-[18px] w-2.5 h-2.5 rounded-full bg-[#D6402F] border-2 border-white" />
                                              
                                              <div className="flex justify-between items-start flex-wrap gap-2">
                                                <div>
                                                  <span className="text-[10px] font-black text-black uppercase">{log.author_name}</span>
                                                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider block">{log.author_position}</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{log.entry_date.split('T')[0]}</span>
                                              </div>
                                              
                                              {displayCategory && (
                                                <span className="inline-block bg-orange-50 text-[#D6402F] text-[8px] font-black uppercase px-2 py-0.5 rounded">
                                                  Objective: {displayCategory}
                                                </span>
                                              )}
                                              
                                              <p className="text-xs font-semibold text-black leading-relaxed mt-1 italic">"{displayNote}"</p>

                                              {log.evidence_file_path && (
                                                <div className="pt-2">
                                                  <button
                                                    onClick={() => {
                                                      setEvidencePreviewUrl(`${SOCKET_URL}${log.evidence_file_path}`);
                                                      setZoomLevel(1);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest cursor-pointer"
                                                  >
                                                    <Download size={10} /> View/Download Evidence
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* Right: Add Log Form */}
                                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 h-fit">
                                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-100 pb-2">Add New Coaching Entry</h4>
                                    
                                    <form onSubmit={handleAddLog} className="space-y-3">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Linked Objective (Optional)</label>
                                        <select
                                          value={targetId}
                                          onChange={e => {
                                            setTargetId(e.target.value);
                                            if (e.target.value !== 'custom_other') {
                                              setCustomObjective('');
                                            }
                                          }}
                                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 font-bold text-black"
                                        >
                                          <option value="" className="text-black">General Coaching Note (No specific KRA)</option>
                                          {targets[p.commitment_id] && targets[p.commitment_id].length > 0 ? (
                                            targets[p.commitment_id].map(t => (
                                              <option key={t.id} value={t.id} className="text-black">
                                                {t.kra_category}: {(t.target_description || '').substring(0, 45)}{(t.target_description || '').length > 45 ? '...' : ''}
                                              </option>
                                            ))
                                          ) : null}
                                          <option value="custom_other" className="text-black">Others (Specify target objective)</option>
                                        </select>
                                      </div>

                                      {targetId === 'custom_other' && (
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Specify Target Objective</label>
                                          <input
                                            type="text"
                                            required
                                            placeholder="Type custom objective/KRA label here..."
                                            value={customObjective}
                                            onChange={e => setCustomObjective(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 font-bold"
                                          />
                                        </div>
                                      )}

                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Coaching Dialog Date</label>
                                        <input
                                          type="date"
                                          required
                                          value={entryDate}
                                          onChange={e => setEntryDate(e.target.value)}
                                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Coaching Dialog Notes / Agreed Actions</label>
                                        <textarea
                                          required
                                          value={note}
                                          onChange={e => setNote(e.target.value)}
                                          placeholder="Type performance feedback, targets discussed, or agreed interventions..."
                                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 h-24"
                                        />
                                      </div>

                                       <div className="space-y-1">
                                         <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest block">Evidence File (PDF/Excel/PNG)</label>
                                         <input
                                           type="file"
                                           onChange={e => setEvidenceFile(e.target.files[0])}
                                           className="w-full text-xs font-bold text-blue-900 bg-blue-50/80 border border-blue-300 rounded-xl p-2 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-600 file:text-white hover:file:bg-blue-800 transition-all shadow-sm"
                                         />
                                       </div>

                                      <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full flex items-center justify-center gap-1 bg-[#D6402F] hover:bg-[#c13222] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Plus size={14} /> {submitting ? 'Adding...' : 'Post Coaching Entry'}
                                      </button>
                                    </form>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* EVIDENCE PREVIEW MODAL WITH BACK BUTTON */}
      {evidencePreviewUrl && (
        <div className="fixed inset-0 bg-black/60 flex flex-col items-center justify-center z-[250] p-4">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full flex flex-col max-h-[85vh] shadow-2xl relative">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-4 border-b pb-2 flex flex-wrap justify-between items-center gap-4">
              <span>Evidence File Preview</span>
              
              {/* Zoom Controls */}
              {!evidencePreviewUrl.toLowerCase().endsWith('.pdf') && (
                <div className="flex gap-2 items-center">
                  <button 
                    onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer border border-slate-200"
                  >
                    Zoom In (+)
                  </button>
                  <button 
                    onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer border border-slate-200"
                  >
                    Zoom Out (-)
                  </button>
                  <button 
                    onClick={() => setZoomLevel(1)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer border border-slate-200"
                  >
                    Reset ({Math.round(zoomLevel * 100)}%)
                  </button>
                </div>
              )}
            </h3>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-100/50 rounded-2xl p-4 border border-slate-200 min-h-[50vh]">
              {evidencePreviewUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={evidencePreviewUrl} 
                  className="w-full h-[55vh] border-0 rounded-xl"
                  title="Evidence PDF Preview"
                />
              ) : (
                <div className="overflow-auto max-w-full max-h-[50vh] flex items-center justify-center cursor-zoom-in">
                  <img 
                    src={evidencePreviewUrl} 
                    alt="Evidence Document Preview" 
                    className="object-contain rounded-xl shadow-md border border-slate-200 origin-center"
                    style={{ 
                      transform: `scale(${zoomLevel})`, 
                      transition: 'transform 0.15s ease-out',
                      maxHeight: '45vh'
                    }}
                  />
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <a
                href={evidencePreviewUrl}
                download
                className="bg-[#D6402F] hover:bg-[#c13222] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow text-center inline-block transition-colors"
              >
                Download File
              </a>
              <button 
                onClick={() => setEvidencePreviewUrl(null)}
                className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MonitoringCoaching;
