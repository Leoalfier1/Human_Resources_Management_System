import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Award, ExternalLink, GraduationCap } from 'lucide-react';
import useEmployeeSocket from '../../hooks/useEmployeeSocket';
import { apiGet } from '../../utils/api';

const getRatingLabel = (score) => {
  if (score === null || score === undefined) return null;
  if (score >= 4.5) return 'Outstanding';
  if (score >= 3.5) return 'Very Satisfactory';
  if (score >= 2.5) return 'Satisfactory';
  if (score >= 1.5) return 'Unsatisfactory';
  return 'Poor';
};

const badgeStyles = {
  enrolled: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  nominated: 'bg-blue-100 text-blue-800 border-blue-200',
  scheduled: 'bg-amber-100 text-amber-800 border-amber-200',
  completed: 'bg-slate-100 text-black border-slate-200'
};

const RecognitionDevPlan = () => {
  const { token } = useAuth();
  const [ipcrf, setIpcrf] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [devPlanItems, setDevPlanItems] = useState([]);
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiGet('/pm/employee/recognition');
      if (res.ok) {
        const data = await res.json();
        setIpcrf(data.ipcrf || null);
        setRatings(data.ratings || []);
        setDevPlanItems(data.devPlanItems || []);
        setEligible(data.eligible || false);
      }
    } catch (err) {
      console.error('Failed to load recognition:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  useEmployeeSocket({
    'rating:finalized': fetchData,
    'review:finalized': fetchData,
    'performance_update': fetchData,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-[#F3F4F6]">
        <div className="text-xs font-bold text-slate-600 tracking-widest uppercase animate-pulse">Loading Recognition & Dev Plan...</div>
      </div>
    );
  }

  const year = ipcrf?.cycle_year || new Date().getFullYear();
  const war = ratings.length > 0
    ? parseFloat(ratings.reduce((sum, r) => sum + (parseFloat(r.rating) * parseFloat(r.weight) / 100), 0).toFixed(2))
    : null;
  const adjectivalLabel = getRatingLabel(war);
  const notFinalized = !ratings.length;

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-[#F3F4F6] min-h-[calc(100vh-56px)] space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">My Recognition & Development Plan</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Final Rating Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3">
              Final Rating Summary
            </h2>

            {notFinalized ? (
              <p className="text-xs text-slate-800 font-bold py-6">Your final rating has not been released yet. Check back after your rater finalizes your appraisal.</p>
            ) : (
              <div className="mt-4 space-y-6">
                <div className="text-center">
                  <p className="text-5xl md:text-6xl font-black text-black tracking-tighter">{war?.toFixed(2)}</p>
                  {adjectivalLabel && (
                    <p className="text-sm font-black text-blue-600 uppercase tracking-wider mt-1">{adjectivalLabel}</p>
                  )}
                </div>

                <div className="space-y-0 border-t border-slate-100 pt-4">
                  {ratings.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-black font-bold flex-1 truncate uppercase tracking-tight">{r.name}</span>
                      <span className="text-sm font-black text-black mx-4">{parseFloat(r.rating || 0).toFixed(0)}</span>
                      <span className="text-[11px] text-slate-600 font-bold">&times; {parseFloat(r.weight || 0).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recognition & Dev Plan */}
        <div className="space-y-6">
          {/* Recognition Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border-2 border-blue-500/20">
            {notFinalized ? (
              <>
                <h2 className="text-sm font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3">Recognition & Awards</h2>
                <p className="text-xs text-slate-800 font-bold py-4">Your final rating has not been released yet.</p>
              </>
            ) : eligible ? (
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl shrink-0 shadow-sm">
                  <Award size={24} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Eligible for Performance-Based Incentives</h4>
                  <button className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1.5 pt-1 transition-colors cursor-pointer">
                    <ExternalLink size={12} /> View R&R details
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3">Recognition & Awards</h2>
                <p className="text-xs text-slate-800 font-bold py-4">You are not yet eligible for recognition incentives for this rating period.</p>
              </>
            )}
          </div>

          {/* Development Plan Items */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
              <GraduationCap size={16} /> My Development Plan
            </h2>

            {notFinalized ? (
              <p className="text-xs text-slate-800 font-bold py-4">Your development plan will appear here after your Review & Evaluation is completed.</p>
            ) : devPlanItems.length === 0 ? (
              <p className="text-xs text-slate-800 font-bold py-4">No development programs mapped for this cycle.</p>
            ) : (
              <div className="space-y-4 mt-4">
                {devPlanItems.map((item) => (
                  <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-xs font-black text-black uppercase tracking-tight">{item.program_name}</h4>
                        {item.addresses && (
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            Addresses: <span className="font-medium text-black">{item.addresses}</span>
                          </p>
                        )}
                        <button className="text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1 pt-1 transition-colors cursor-pointer">
                          <GraduationCap size={13} /> View in L&D Module
                        </button>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-2 shrink-0">
                        <span className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${badgeStyles[item.status] || badgeStyles.scheduled}`}>
                          {item.status || 'scheduled'}
                        </span>
                        {item.scheduled_date && (
                          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{item.scheduled_date}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecognitionDevPlan;
