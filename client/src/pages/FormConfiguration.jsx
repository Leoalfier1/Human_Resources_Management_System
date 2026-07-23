import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, AlertTriangle, Calendar, Settings, Check, HelpCircle, AlertCircle, Edit2, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

const FormConfiguration = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('kras'); // 'kras', 'periods', 'bands', 'rewards'
  const [posType, setPosType] = useState('non_teaching'); // 'non_teaching', 'teaching', 'teaching_related'
  
  // Data States
  const [kras, setKras] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [bands, setBands] = useState([]);
  const [rewards, setRewards] = useState([]);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modal Forms States
  const [showKraModal, setShowKraModal] = useState(false);
  const [currentKra, setCurrentKra] = useState({ kra_name: '', weight_percent: 20, description: '' });
  
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState({ school_year: '2026-2027', period_label: '', start_date: '', end_date: '' });

  const [showBandModal, setShowBandModal] = useState(false);
  const [currentBand, setCurrentBand] = useState({ min_score: 0, max_score: 5, label: '', sort_order: 1 });

  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState({ name: '', description: '', is_active: true });

  const [editingId, setEditingId] = useState(null);

  // Fetch Config Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [krasRes, periodsRes, bandsRes, rewardsRes] = await Promise.all([
        apiGet('/pm/config/kra-templates'),
        apiGet('/pm/config/rating-periods'),
        apiGet('/pm/config/adjectival-bands'),
        apiGet('/pm/config/reward-types')
      ]);

      if (krasRes.ok) setKras(await krasRes.json());
      if (periodsRes.ok) setPeriods(await periodsRes.json());
      if (bandsRes.ok) setBands(await bandsRes.json());
      if (rewardsRes.ok) setRewards(await rewardsRes.json());
    } catch (e) {
      console.error("Failed to fetch PM configurations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // Live weights validator
  const filteredKras = kras.filter(k => k.position_type === posType);
  const runningWeightTotal = filteredKras.reduce((sum, k) => sum + parseFloat(k.weight_percent || 0), 0);

  // KRA CRUD
  const handleSaveKra = async (e) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `/pm/config/kra-templates/${editingId}`
        : '/pm/config/kra-templates';

      const res = editingId
        ? await apiPut(url, { ...currentKra, position_type: posType })
        : await apiPost(url, { ...currentKra, position_type: posType });
      
      if (res.ok) {
        setShowKraModal(false);
        setEditingId(null);
        setCurrentKra({ kra_name: '', weight_percent: 20, description: '' });
        fetchData();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteKra = async (id) => {
    if (!confirm("Are you sure you want to delete this KRA template?")) return;
    try {
      const res = await apiDelete(`/pm/config/kra-templates/${id}`);
      if (res.ok) fetchData();
    } catch(err) {
      console.error(err);
    }
  };

  // Periods CRUD
  const handleSavePeriod = async (e) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `/pm/config/rating-periods/${editingId}`
        : '/pm/config/rating-periods';

      const res = editingId
        ? await apiPut(url, currentPeriod)
        : await apiPost(url, currentPeriod);
      
      if (res.ok) {
        setShowPeriodModal(false);
        setEditingId(null);
        setCurrentPeriod({ school_year: '2026-2027', period_label: '', start_date: '', end_date: '' });
        fetchData();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleActivatePeriod = async (p) => {
    if (!confirm(`Are you sure you want to activate ${p.period_label}? This will deactivate all other cycles.`)) return;
    try {
      const res = await apiPut(`/pm/config/rating-periods/${p.id}`, { ...p, is_active: true });
      if (res.ok) fetchData();
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeletePeriod = async (id) => {
    if (!confirm("Are you sure you want to delete this rating period?")) return;
    try {
      const res = await apiDelete(`/pm/config/rating-periods/${id}`);
      if (res.ok) fetchData();
    } catch(err) {
      console.error(err);
    }
  };

  // Bands CRUD
  const handleSaveBand = async (e) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `/pm/config/adjectival-bands/${editingId}`
        : '/pm/config/adjectival-bands';

      const res = editingId
        ? await apiPut(url, currentBand)
        : await apiPost(url, currentBand);
      
      if (res.ok) {
        setShowBandModal(false);
        setEditingId(null);
        setCurrentBand({ min_score: 0, max_score: 5, label: '', sort_order: 1 });
        fetchData();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteBand = async (id) => {
    if (!confirm("Are you sure you want to delete this adjectival band?")) return;
    try {
      const res = await apiDelete(`/pm/config/adjectival-bands/${id}`);
      if (res.ok) fetchData();
    } catch(err) {
      console.error(err);
    }
  };

  // Rewards CRUD
  const handleSaveReward = async (e) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `/pm/config/reward-types/${editingId}`
        : '/pm/config/reward-types';

      const res = editingId
        ? await apiPut(url, currentReward)
        : await apiPost(url, currentReward);
      
      if (res.ok) {
        setShowRewardModal(false);
        setEditingId(null);
        setCurrentReward({ name: '', description: '', is_active: true });
        fetchData();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteReward = async (id) => {
    if (!confirm("Are you sure you want to delete this reward type?")) return;
    try {
      const res = await apiDelete(`/pm/config/reward-types/${id}`);
      if (res.ok) fetchData();
    } catch(err) {
      console.error(err);
    }
  };

  // Access Control check
  if (user && user.role !== 'admin' && user.role !== 'hr_staff') {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 text-red-700 font-bold uppercase rounded-3xl m-8">
        Access Denied. Only Admins and HR Staff may access PM System Configurations.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-[#F3F4F6] min-h-[calc(100vh-56px)] space-y-6">
      

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200/80 bg-white px-4 md:px-6 py-3 md:py-2.5 rounded-2xl shadow-sm gap-3 md:gap-4">
        {[
          { key: 'kras', label: 'KRA Rubric Templates' },
          { key: 'periods', label: 'Rating Periods' },
          { key: 'rewards', label: 'Reward Types' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setEditingId(null); }}
            className={`flex-1 text-center px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === t.key 
                ? 'bg-[#1B3A6B] text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-black'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[250px] bg-white rounded-3xl border border-slate-200 shadow-sm text-xs font-bold uppercase tracking-widest text-slate-600 animate-pulse">
          Loading configs...
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 space-y-6">
          
          {/* TAB 1: KRA TEMPLATES */}
          {activeTab === 'kras' && (
            <div className="space-y-6">
              


              {/* Live Weight Validator Banner */}
              <div className={`p-4 rounded-2xl flex items-center justify-between border text-xs font-bold ${
                runningWeightTotal === 100
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800 animate-pulse'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>
                    Running weight sum total for this position type: <strong className="text-sm">{runningWeightTotal}%</strong> (Must sum to exactly 100%)
                  </span>
                </div>
                {runningWeightTotal !== 100 && (
                  <span className="text-[10px] uppercase font-black tracking-widest bg-red-600 text-white px-2 py-1 rounded">Weight Warning</span>
                )}
              </div>

              {/* Content Grid */}
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider">KRA Template List</h3>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setCurrentKra({ kra_name: '', weight_percent: 20, description: '' });
                        setShowKraModal(true);
                      }}
                      className="flex items-center gap-1 bg-[#1B3A6B] hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <Plus size={14} /> Add KRA Category
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                          <th className="px-6 py-3">Category Name</th>
                          <th className="px-6 py-3">Default Weight</th>
                          <th className="px-6 py-3">Description</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredKras.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-6 text-center text-slate-600 font-bold uppercase">No KRA categories created yet</td>
                          </tr>
                        ) : (
                          filteredKras.map(k => (
                            <tr key={k.id} className="hover:bg-slate-50/50">
                              <td className="px-6 py-4 font-black uppercase text-black">{k.kra_name}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">{k.weight_percent}%</td>
                              <td className="px-6 py-4 text-slate-600 font-semibold">{k.description || '—'}</td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingId(k.id);
                                    setCurrentKra({ kra_name: k.kra_name, weight_percent: k.weight_percent, description: k.description || '' });
                                    setShowKraModal(true);
                                  }}
                                  className="text-slate-600 hover:text-black font-black uppercase tracking-widest text-[9px] cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteKra(k.id)}
                                  className="text-red-600 hover:text-red-800 font-black uppercase tracking-widest text-[9px] cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>
          )}

          {/* TAB 2: RATING PERIODS */}
          {activeTab === 'periods' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider">Rating Cycles</h3>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setCurrentPeriod({ school_year: '2026-2027', period_label: '', start_date: '', end_date: '' });
                    setShowPeriodModal(true);
                  }}
                  className="flex items-center gap-1 bg-[#1B3A6B] hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  <Plus size={14} /> Add Rating Period
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                      <th className="px-6 py-3">School Year</th>
                      <th className="px-6 py-3">Label</th>
                      <th className="px-6 py-3">Duration</th>
                      <th className="px-6 py-3">Active Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {periods.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-6 text-center text-slate-600 font-bold uppercase">No rating periods created yet</td>
                      </tr>
                    ) : (
                      periods.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-black text-black">{p.school_year}</td>
                          <td className="px-6 py-4 font-black uppercase text-slate-600">{p.period_label || 'Annual Cycle'}</td>
                          <td className="px-6 py-4 font-semibold text-slate-600">
                            {p.start_date ? p.start_date.split('T')[0] : '—'} &bull; {p.end_date ? p.end_date.split('T')[0] : '—'}
                          </td>
                          <td className="px-6 py-4">
                            {p.is_active ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 text-[9px] font-black uppercase tracking-wider rounded-full">Active Cycle</span>
                            ) : (
                              <button 
                                onClick={() => handleActivatePeriod(p)}
                                className="px-2 py-0.5 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 text-[9px] font-black uppercase tracking-wider rounded-full border border-slate-200 cursor-pointer"
                              >
                                Activate
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingId(p.id);
                                setCurrentPeriod({ school_year: p.school_year, period_label: p.period_label || '', start_date: p.start_date ? p.start_date.split('T')[0] : '', end_date: p.end_date ? p.end_date.split('T')[0] : '' });
                                setShowPeriodModal(true);
                              }}
                              className="text-slate-600 hover:text-black font-black uppercase tracking-widest text-[9px] cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePeriod(p.id)}
                              className="text-red-600 hover:text-red-800 font-black uppercase tracking-widest text-[9px] cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}



          {/* TAB 4: REWARDS */}
          {activeTab === 'rewards' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider">Recognition Nominations Settings</h3>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setCurrentReward({ name: '', description: '', is_active: true });
                    setShowRewardModal(true);
                  }}
                  className="flex items-center gap-1 bg-[#1B3A6B] hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  <Plus size={14} /> Add Reward Type
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                      <th className="px-6 py-3">Award Name</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3">Active Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {rewards.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-6 text-center text-slate-600 font-bold uppercase">No reward types created yet</td>
                      </tr>
                    ) : (
                      rewards.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-black uppercase text-black">{r.name}</td>
                          <td className="px-6 py-4 text-slate-600 font-semibold">{r.description || '—'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${
                              r.is_active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {r.is_active ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingId(r.id);
                                setCurrentReward({ name: r.name, description: r.description || '', is_active: r.is_active });
                                setShowRewardModal(true);
                              }}
                              className="text-slate-600 hover:text-black font-black uppercase tracking-widest text-[9px] cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReward(r.id)}
                              className="text-red-600 hover:text-red-800 font-black uppercase tracking-widest text-[9px] cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
        </div>
      )}

      {/* MODAL 1: KRA MODAL */}
      {showKraModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
          <form onSubmit={handleSaveKra} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-black uppercase text-black tracking-tight">{editingId ? 'Edit KRA Template' : 'Add KRA Template'}</h3>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">KRA Category Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50"
                value={currentKra.kra_name}
                onChange={e => setCurrentKra({ ...currentKra, kra_name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Default Weight Percentage (%)</label>
              <input 
                type="number" 
                step="0.01"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50"
                value={currentKra.weight_percent}
                onChange={e => setCurrentKra({ ...currentKra, weight_percent: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Description / Notes</label>
              <textarea 
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 h-20"
                value={currentKra.description}
                onChange={e => setCurrentKra({ ...currentKra, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowKraModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-[#1B3A6B] hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: PERIOD MODAL */}
      {showPeriodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
          <form onSubmit={handleSavePeriod} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-black uppercase text-black tracking-tight">{editingId ? 'Edit Rating Period' : 'Add Rating Period'}</h3>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">School Year (e.g. 2026-2027)</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50"
                value={currentPeriod.school_year}
                onChange={e => setCurrentPeriod({ ...currentPeriod, school_year: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Period Label</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50"
                value={currentPeriod.period_label}
                onChange={e => setCurrentPeriod({ ...currentPeriod, period_label: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Start Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50"
                  value={currentPeriod.start_date}
                  onChange={e => setCurrentPeriod({ ...currentPeriod, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">End Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50"
                  value={currentPeriod.end_date}
                  onChange={e => setCurrentPeriod({ ...currentPeriod, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowPeriodModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-[#1B3A6B] hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}



      {/* MODAL 4: REWARD MODAL */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
          <form onSubmit={handleSaveReward} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-black uppercase text-black tracking-tight">{editingId ? 'Edit Reward Type' : 'Add Reward Type'}</h3>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Award Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50"
                value={currentReward.name}
                onChange={e => setCurrentReward({ ...currentReward, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Description</label>
              <textarea 
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 h-20"
                value={currentReward.description}
                onChange={e => setCurrentReward({ ...currentReward, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowRewardModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-[#1B3A6B] hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default FormConfiguration;
