import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ChevronDown, Loader2, Users, Clock, ArrowRight, FolderOpen } from 'lucide-react';
import { API_BASE } from '../../../utils/api';
import ComparativeAssessmentWorkspace from './workspace/ComparativeAssessmentWorkspace';

const API = API_BASE;

const CATEGORIES = [
  { key: 'teaching',         label: 'Teaching',          icon: '📚' },
  { key: 'teaching_related', label: 'Teaching-Related',   icon: '📋' },
  { key: 'non_teaching',     label: 'Non-Teaching',       icon: '🏢' },
];

const STAGE_LABELS = {
  1: 'Publication', 2: 'Submission', 3: 'Initial Eval', 4: 'Validation',
  5: 'Posting Qual List', 6: 'Individual Evaluation', 7: 'Comparative Assessment',
  8: 'Results Posting', 9: 'Congratulatory Advice', 10: 'Appointment'
};

const daysSince = (dateStr) => {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
};

const RSPComparativeAssessment = () => {
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('teaching');
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

  const categorizedVacancies = useMemo(() => {
    const map = { teaching: [], teaching_related: [], non_teaching: [] };
    eligibleVacancies.forEach(v => {
      const key = v.position_type || 'teaching';
      if (map[key]) map[key].push(v);
    });
    return map;
  }, [eligibleVacancies]);

  const activeVacancies = categorizedVacancies[activeCategory] || [];
  const selectedVacancy = selectedVacancyId
    ? eligibleVacancies.find(v => v.id === selectedVacancyId) || null
    : null;

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setSelectedVacancyId(null);
  };

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
      {/* Category Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {CATEGORIES.map(cat => {
          const count = (categorizedVacancies[cat.key] || []).length;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wide transition-all ${
                isActive
                  ? 'bg-white text-[#1B3A6B] shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-[#1B3A6B] text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Vacancy Selector or Workspace */}
      {selectedVacancyId ? (
        <div className="space-y-4">
          {/* Vacancy breadcrumb bar */}
          <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
            <button
              onClick={() => setSelectedVacancyId(null)}
              className="text-[10px] font-black text-slate-400 hover:text-[#1B3A6B] uppercase tracking-wider transition-colors"
            >
              ← {CATEGORIES.find(c => c.key === activeCategory)?.label || 'Back'}
            </button>
            <span className="text-slate-200">|</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-[#1B3A6B] truncate">
                {selectedVacancy?.position_title || '—'}
              </p>
              <p className="text-[10px] font-bold text-slate-400">
                {selectedVacancy?.ref_no || ''}
                {selectedVacancy?.item_number ? ` · Item ${selectedVacancy.item_number}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
              {selectedVacancy?.applicant_count != null && (
                <span className="inline-flex items-center gap-1">
                  <Users size={11} className="text-slate-300" />
                  {selectedVacancy.applicant_count} applicant{(selectedVacancy.applicant_count) !== 1 ? 's' : ''}
                </span>
              )}
              <span className="text-[9px] font-bold text-slate-300">
                {STAGE_LABELS[selectedVacancy?.current_stage] || `Stage ${selectedVacancy?.current_stage}`}
              </span>
            </div>
          </div>

          <ComparativeAssessmentWorkspace vacancyId={selectedVacancyId} />
        </div>
      ) : (
        <div className="space-y-4">
          {activeVacancies.length > 0 ? (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                {CATEGORIES.find(c => c.key === activeCategory)?.label} Vacancies Ready for Assessment
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence>
                  {activeVacancies.map((v, i) => {
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
                          {v.item_number && (
                            <span className="text-[8px] font-black text-[#1B3A6B] bg-[#1B3A6B]/5 px-2 py-0.5 rounded-full shrink-0 ml-2">
                              Item {v.item_number}
                            </span>
                          )}
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
                  <h3 className="text-xs font-black text-slate-600 uppercase">
                    No {CATEGORIES.find(c => c.key === activeCategory)?.label} Vacancies Ready
                  </h3>
                  <p className="text-[11px] font-bold text-slate-400 mt-2 leading-relaxed">
                    {CATEGORIES.find(c => c.key === activeCategory)?.label} vacancies appear here once
                    Individual Evaluation is finalized for at least one applicant and the vacancy reaches Stage 5.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RSPComparativeAssessment;
