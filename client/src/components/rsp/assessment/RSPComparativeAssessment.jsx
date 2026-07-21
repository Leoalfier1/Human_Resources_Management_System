import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ChevronDown, Loader2, Users, Clock, ArrowRight, FolderOpen } from 'lucide-react';
import { API_BASE } from '../../../utils/api';
import ComparativeAssessmentWorkspace from './workspace/ComparativeAssessmentWorkspace';

const API = API_BASE;

const STAGE_LABELS = {
  1: 'Publication', 2: 'Submission', 3: 'Initial Eval', 4: 'Validation',
  5: 'Posting Qual List', 6: 'Comparative Assessment', 7: 'Post CA Results',
  8: 'Deliberation', 9: 'Selection', 10: 'Doc Submission', 11: 'Issue Appointment'
};

const POSITION_TYPE_BADGES = {
  teaching: 'Teacher I',
  non_teaching: 'Non-Teaching',
  teaching_related: 'Teaching-Related'
};

const daysSince = (dateStr) => {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
};

const RSPComparativeAssessment = () => {
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/rsp/vacancies`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setVacancies(list);
      } catch (e) {
        console.error('Failed to fetch vacancies:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchVacancies();
  }, []);

  const eligibleVacancies = useMemo(() =>
    vacancies.filter(v => v.current_stage >= 5),
    [vacancies]
  );

  if (loading) {
    return (
      <div className="p-20 text-center">
        <div className="inline-flex items-center gap-3 text-sm font-black text-slate-400 animate-pulse">
          <Loader2 size={20} className="animate-spin" />
          Loading vacancies…
        </div>
      </div>
    );
  }

  if (vacancies.length === 0) {
    return (
      <div className="p-20 text-center">
        <div className="inline-flex flex-col items-center gap-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
            <Briefcase size={28} className="text-slate-300" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-600 uppercase">No Active Vacancies</h3>
            <p className="text-[11px] font-bold text-slate-400 mt-2 leading-relaxed">
              No active vacancies found. Create a vacancy to begin the Comparative Assessment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vacancy Selector Bar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedVacancyId || ''}
            onChange={e => setSelectedVacancyId(Number(e.target.value) || null)}
            className="appearance-none pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-[#1B3A6B] outline-none focus:border-[#1B3A6B] cursor-pointer"
          >
            <option value="">Select Vacancy…</option>
            {vacancies.map(v => (
              <option key={v.id} value={v.id}>
                {v.position_title} — {v.ref_no}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Workspace or Empty State */}
      {selectedVacancyId ? (
        <ComparativeAssessmentWorkspace vacancyId={selectedVacancyId} />
      ) : (
        <div className="space-y-4">
          {/* Main empty state prompt */}
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Briefcase size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-black text-slate-500">
              Select a vacancy above to open the Assessment Workspace
            </p>
            <p className="text-[10px] font-bold text-slate-300 mt-1">
              Pick the position you want to evaluate applicants for
            </p>
          </div>

          {eligibleVacancies.length > 0 ? (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                Vacancies Ready for Assessment
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence>
                  {eligibleVacancies.map((v, i) => {
                    const days = daysSince(v.updated_at || v.posting_date);
                    return (
                      <motion.button
                        key={v.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setSelectedVacancyId(v.id)}
                        className="group bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-[#1B3A6B]/30 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-[#1B3A6B] truncate">{v.position_title}</h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{v.ref_no}</p>
                          </div>
                          <span className="text-[8px] font-black text-white bg-[#1B3A6B] px-2 py-0.5 rounded-full uppercase shrink-0 ml-2">
                            {POSITION_TYPE_BADGES[v.position_type] || v.position_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 mb-3">
                          <span className="inline-flex items-center gap-1">
                            <Users size={11} className="text-slate-300" />
                            {v.applicant_count || 0} applicant{(v.applicant_count || 0) !== 1 ? 's' : ''}
                          </span>
                          {days !== null && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} className="text-slate-300" />
                              {days}d in process
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-300">
                            {STAGE_LABELS[v.current_stage] || `Stage ${v.current_stage}`}
                          </span>
                          <ArrowRight size={14} className="text-slate-300 group-hover:text-[#1B3A6B] transition-colors" />
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="inline-flex flex-col items-center gap-4 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                  <FolderOpen size={24} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-600 uppercase">No Vacancies Ready for Assessment</h3>
                  <p className="text-[11px] font-bold text-slate-400 mt-2 leading-relaxed">
                    Vacancies appear here once Initial Evaluation is finalized for at least one applicant
                    and the vacancy reaches Stage 5 (Posting of Qualified List).
                  </p>
                </div>
                {vacancies.some(v => v.current_stage < 5) && (
                  <p className="text-[10px] font-bold text-slate-300">
                    {vacancies.filter(v => v.current_stage < 5).length} vacancy currently awaiting Initial Evaluation completion.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RSPComparativeAssessment;
