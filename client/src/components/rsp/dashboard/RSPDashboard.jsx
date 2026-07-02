import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Briefcase, Users, ClipboardCheck, Award } from 'lucide-react';
import { useRSPDashboard } from '../../../hooks/useRSPDashboard';
import { StatCard, TATCard, DeadlinesCard, ActivityCard, VacancyProgressTracker } from './DashboardComponents';

const SkeletonLoader = () => (
  <div className="space-y-8 animate-pulse p-4">
    <div className="h-10 bg-slate-200 rounded-xl w-1/4" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-36 bg-slate-200 rounded-2xl" />)}
    </div>
    <div className="h-96 bg-slate-200 rounded-3xl" />
  </div>
);

const RSPDashboard = () => {
  const { data, loading, error, refresh } = useRSPDashboard();
  const [lastUpdated, setLastUpdated] = useState(null);
  const [justUpdated, setJustUpdated] = useState(false);

  // Track when data refreshes so we can show the "just updated" flash
  useEffect(() => {
    if (data) {
      setLastUpdated(new Date());
      setJustUpdated(true);
      const t = setTimeout(() => setJustUpdated(false), 3000);
      return () => clearTimeout(t);
    }
  }, [data]);

  if (loading) return <SkeletonLoader />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-10 flex flex-col items-center text-center gap-4">
        <AlertCircle className="text-red-500" size={32} />
        <p className="font-black text-red-700 uppercase tracking-wide">{error}</p>
        <button
          onClick={refresh}
          className="px-6 py-2 bg-[#1B3A6B] text-white rounded-xl text-xs font-black uppercase tracking-widest"
        >
          Try Again
        </button>
      </div>
    );
  }

  const curMonth = new Date().getMonth();
  const curYear = new Date().getFullYear();
  const schoolYear = curMonth >= 5 ? `${curYear}–${curYear + 1}` : `${curYear - 1}–${curYear}`;
  const formattedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-8 select-none">

      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-[#1B3A6B] uppercase tracking-tight">RSP Module Overview</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            SY {schoolYear} · As of {formattedDate}
          </p>
        </div>

        {/* RIGHT: TAT + Live Indicator + Refresh */}
        <div className="flex items-center gap-3 flex-wrap justify-end">

          {/* LIVE INDICATOR */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all duration-500
            ${justUpdated
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-slate-50 border-slate-200 text-slate-400'}`}
          >
            <div className={`w-2 h-2 rounded-full transition-all duration-500
              ${justUpdated ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}
            />
            {justUpdated ? 'Just Updated' : lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
              : 'Live'
            }
          </div>

          {/* MANUAL REFRESH BUTTON */}
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 transition-all"
          >
            <RefreshCw size={13} /> Refresh
          </button>

          {/* TAT BADGE */}
          <div className="bg-[#1B3A6B] text-white px-6 py-3 rounded-2xl shadow-md flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Target TAT:</span>
            <span className="text-lg font-black text-yellow-400">{data?.summary?.targetTAT} Working Days</span>
          </div>
        </div>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          icon={Briefcase} value={data?.summary?.activePostings} label="Active Postings"
          context={`${data?.summary?.nearDeadlinePostings || 0} near deadline`} colorClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Users} value={data?.summary?.totalApplicants} label="Total Applicants"
          context={`+${data?.summary?.newApplicantsThisWeek || 0} this week`} colorClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={ClipboardCheck} value={data?.summary?.pendingEvaluations} label="Pending Evaluations"
          context={`${data?.summary?.pendingEvaluationsBatch} batch`} colorClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={Award} value={data?.summary?.appointmentsIssuedFY} label="Appointments Issued"
          context={`FY ${curYear} to date`} colorClass="bg-purple-50 text-purple-600"
        />
      </div>

      {/* POSITION TYPE BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Teaching Positions</h4>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-[#1B3A6B]">{data?.summary?.teachingPostings || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Postings</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-emerald-600">{data?.summary?.teachingApplicants || 0}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Applicants</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Non-Teaching Positions</h4>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-amber-600">{data?.summary?.nonTeachingPostings || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Postings</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-amber-600">{data?.summary?.nonTeachingApplicants || 0}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Applicants</p>
            </div>
          </div>
        </div>
      </div>

      {/* 11-STAGE PROGRESS TRACKER */}
      <VacancyProgressTracker vacancies={data?.activePostings} />

      {/* THREE-COLUMN SECONDARY ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TATCard items={data?.turnaroundTime} target={data?.summary?.targetTAT} />
        <DeadlinesCard items={data?.upcomingDeadlines} />
        <ActivityCard items={data?.recentActivity} />
      </div>

    </div>
  );
};

export default RSPDashboard;