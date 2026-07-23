import React from 'react';
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
  const { data, loading } = useRSPDashboard();

  if (loading) return <SkeletonLoader />;

  // Dynamic School Year computation
  const curMonth = new Date().getMonth();
  const curYear = new Date().getFullYear();
  const schoolYear = curMonth >= 5 ? `${curYear}–${curYear + 1}` : `${curYear - 1}–${curYear}`;
  const formattedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-8 select-none">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">RSP Module Overview</h2>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-0.5">
            SY {schoolYear} · As of {formattedDate}
          </p>
        </div>
        <div className="bg-[#1B3A6B] text-white px-6 py-3 rounded-2xl shadow-md flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Target TAT:</span>
          <span className="text-lg font-black text-yellow-400">{data?.summary?.targetTAT} Working Days</span>
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
