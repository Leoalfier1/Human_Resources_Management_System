import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Clock, FileText,
  Download, ChevronRight, ChevronDown, ChevronLeft,
  Building2, X, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiGet, SOCKET_URL } from '../utils/api';
import io from 'socket.io-client';

const SCHOOLS_DIRECTORY = {
  'Elementary': [
    '--- Dapitan City Central District ---',
    'Dapitan City Central School', 'Ma. Cristina ES', 'Capucao Primary School', 'Dapitan City Experimental ES', 'Lawaan ES', 'Polo ES', 'Sinonoc ES', 'Talisay ES',
    '--- Baylimango District ---',
    'Baylimango Central School', 'Carang ES', 'Banbanan ES', 'Canlucani ES', 'Kauswagan ES', 'Napo ES', 'Bacong ES', 'Oro ES', 'Guimputlan ES', 'Sto. Niño ES', 'Taguilon ES', 'Tag-ulo ES', 'Selinog ES', 'Daro Primary School',
    '--- Barcelona District ---',
    'Barcelona Central School', 'Ba-ao ES', 'Burgos ES', 'Hilltop ES', 'Ilaya ES', 'Ma. Uray ES', 'Oyan ES', 'Tamion ES', 'Yabu Primary School', 'Diwaan ES',
    '--- Potungan District ---',
    'Potungan Central School', 'Aseniero ES', 'Dampalan ES', 'Masidlakon ES', 'Opao ES', 'San Francisco ES', 'San Nicolas ES', 'Sigayan ES',
    '--- Sulangon District ---',
    'Sulangon Central School', 'Aliguay ES', 'Antipolo ES', 'Larayan ES', 'Liyang ES', 'Owaon ES', 'San Pedro ES', 'San Vicente ES', 'Sicayab ES'
  ],
  'Secondary': [
    'Dapitan City National High School',
    'Barcelona National High School',
    'Baylimango National High School',
    'Ilaya National High School',
    'Potungan National High School',
    'Sulangon National High School',
    'Aseniero National High School',
    'Oro National High School',
    'Taguilon National High School'
  ],
  'Integrated': [
    'Kauswagan Integrated School',
    'Guimputlan Integrated School',
    'Aliguay Integrated School',
    'Selinog Integrated School'
  ],
  'SPED': [
    'Dapitan City SPED Center'
  ]
};

const getPersonnelCategory = (p) => {
  const pos = (p.position || '').toLowerCase();

  if (
    pos.includes('principal') ||
    pos.includes('head teacher') ||
    pos.includes('supervisor') ||
    pos.includes('superintendent') ||
    pos.includes('specialist') ||
    pos.includes('chief')
  ) {
    return 'teaching-related';
  }

  if (pos.includes('teacher')) {
    return 'teaching';
  }

  return 'non-teaching';
};

const PMDashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ pendingSubmissions: 0, pendingReviews: 0, finalizedAppraisals: 0, totalPersonnel: 0 });
  const [personnel, setPersonnel] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState({ year: 2026, cycle: 'Midyear' });
  const [filter, setFilter] = useState('all');
  const [expandedPhase, setExpandedPhase] = useState(null);

  // Rating Distribution States
  const [posFilter, setPosFilter] = useState('all'); // 'all', 'teaching', 'non_teaching', 'teaching_related'
  const [distribution, setDistribution] = useState({ outstanding: 0, verySatisfactory: 0, satisfactory: 0, unsatisfactory: 0, poor: 0 });
  const [periodsList, setPeriodsList] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState('all');

  // Custom dropdown selector states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownView, setDropdownView] = useState('categories'); // 'categories' or 'schools'
  const [dropdownCategory, setDropdownCategory] = useState(null);
  const dropdownRef = useRef(null);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef(null);

  const fetchAll = async () => {
    try {
      setError('');
      const params = new URLSearchParams();
      if (selectedPeriodId) params.append('period_id', selectedPeriodId);

      let schoolParam = 'all';
      if (selectedCategory && selectedCategory !== 'all') {
        if (selectedSchool && selectedSchool !== 'all') {
          schoolParam = selectedSchool;
        } else {
          schoolParam = `category:${selectedCategory}`;
        }
      }
      if (schoolParam !== 'all') params.append('school', schoolParam);

      const urlParams = params.toString() ? `?${params.toString()}` : '';

      const [statsRes, personnelRes, periodsRes] = await Promise.all([
        apiGet(`/pm/dashboard/stats${urlParams}`),
        apiGet(`/pm/dashboard/personnel-status${urlParams}`),
        apiGet('/pm/dashboard/periods')
      ]);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setPeriod(data.period);
        setStats(data.stats);
        if (!selectedPeriodId && data.period.id) {
          setSelectedPeriodId(data.period.id);
        }
      }
      if (personnelRes.ok) setPersonnel(await personnelRes.json());
      if (periodsRes.ok) {
        setPeriodsList(await periodsRes.json());
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRef = useRef(fetchAll);
  fetchAllRef.current = fetchAll;

  useEffect(() => {
    if (!token) return;
    fetchAll();

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.emit('join_admin_room');

    const onEvent = () => fetchAllRef.current();
    socket.on('ipcrf:status_changed', onEvent);
    socket.on('notification_received', onEvent);
    socket.on('review:rating_updated', onEvent);
    socket.on('review:finalized', onEvent);
    socket.on('commitment:approved', onEvent);
    socket.on('commitment:submitted', onEvent);
    socket.on('commitment:returned', onEvent);
    socket.on('performance_update', onEvent);
    socket.on('rating:finalized', onEvent);

    return () => {
      socket.off('ipcrf:status_changed', onEvent);
      socket.off('notification_received', onEvent);
      socket.off('review:rating_updated', onEvent);
      socket.off('review:finalized', onEvent);
      socket.off('commitment:approved', onEvent);
      socket.off('commitment:submitted', onEvent);
      socket.off('commitment:returned', onEvent);
      socket.off('performance_update', onEvent);
      socket.off('rating:finalized', onEvent);
      socket.disconnect();
    };
  }, [token]);

  // Sync state whenever selected Period ID, Category or School changes
  useEffect(() => {
    if (token) {
      fetchAll();
    }
  }, [token, selectedPeriodId, selectedCategory, selectedSchool]);

  // Listen for local changes to selected period ID in header
  useEffect(() => {
    const handlePeriodChange = () => {
      setSelectedPeriodId(localStorage.getItem('selected_period_id') || '');
    };
    window.addEventListener('selected_period_changed', handlePeriodChange);
    return () => {
      window.removeEventListener('selected_period_changed', handlePeriodChange);
    };
  }, []);

  // Handle click outside to close the custom dropdown menus
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setDropdownView('categories');
        setDropdownCategory(null);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target)) {
        setYearDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Separate effect to fetch ratings distribution whenever position filter, selected school year, or school changes
  const fetchDistribution = async () => {
    try {
      const params = new URLSearchParams();
      params.append('position_type', posFilter);
      if (selectedPeriodId) params.append('period_id', selectedPeriodId);

      let schoolParam = 'all';
      if (selectedCategory && selectedCategory !== 'all') {
        if (selectedSchool && selectedSchool !== 'all') {
          schoolParam = selectedSchool;
        } else {
          schoolParam = `category:${selectedCategory}`;
        }
      }
      if (schoolParam !== 'all') params.append('school', schoolParam);

      const res = await apiGet(`/pm/dashboard/ratings-distribution?${params.toString()}`);
      if (res.ok) {
        setDistribution(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch distribution:", err);
      setError('Failed to load ratings distribution.');
    }
  };

  const fetchDistributionRef = useRef(fetchDistribution);
  fetchDistributionRef.current = fetchDistribution;

  useEffect(() => {
    if (token) {
      fetchDistribution();
    }
  }, [token, posFilter, selectedPeriodId, selectedCategory, selectedSchool]);

  // Export personnel status list as CSV
  const handleExportReport = () => {
    const yearLabel = period?.school_year || period?.year || '2026-2027';

    // CSV Header row
    const headers = ['Employee Name', 'Position', 'Unit', 'IPCRF Status', 'Rating'];

    // Map filtered personnel to CSV rows
    const rows = filteredPersonnel.map(p => {
      const statusText = p.status ? p.status.replace('_', ' ').toUpperCase() : 'NOT SUBMITTED';
      const ratingText = (p.rating && parseFloat(p.rating) > 0) ? parseFloat(p.rating).toFixed(2) : '—';

      const cleanName = `"${p.name.replace(/"/g, '""')}"`;
      const cleanPosition = `"${p.position.replace(/"/g, '""')}"`;
      const cleanUnit = `"${(p.unit || '').replace(/"/g, '""')}"`;

      return [cleanName, cleanPosition, cleanUnit, statusText, ratingText].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PM_Personnel_Report_SY_${yearLabel}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determine pending submission names for Card 2
  const submittedPersonnel = personnel.filter(p => p.status === 'submitted');
  const pendingSubmissionsText = submittedPersonnel.length > 0
    ? `${submittedPersonnel[0].name} + ${submittedPersonnel.length - 1} other`
    : 'No pending submissions';

  const statCards = [
    { label: `${stats.pendingSubmissions}`, title: 'Pending IPCRF Submissions', desc: pendingSubmissionsText, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: `${stats.pendingReviews}`, title: 'Pending Reviews', desc: 'Under Review / Submitted', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: `${stats.finalizedAppraisals}`, title: 'Finalized Appraisals', desc: `Out of ${stats.totalPersonnel} total personnel`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'under_review':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-purple-100 text-purple-700 border border-purple-200">Under Review</span>;
      case 'submitted':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-blue-100 text-blue-700 border border-blue-200">Submitted</span>;
      case 'committed':
      case 'finalized':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-green-100 text-green-700 border border-green-200">Finalized</span>;
      case 'needs_revision':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-red-100 text-red-700 border border-red-200 animate-pulse">Needs Revision</span>;
      case 'reviewed':
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-green-50 text-green-600 border border-green-200">Reviewed</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-slate-100 text-slate-800 border border-slate-200">Not Submitted</span>;
    }
  };

  const filteredPersonnel = personnel.filter(p => {
    if (filter === 'all') return true;

    // Map database status values to match UI filter options
    let mappedStatus = p.status || 'not_submitted';
    if (mappedStatus === 'draft' || mappedStatus === 'returned') {
      mappedStatus = 'not_submitted';
    } else if (mappedStatus === 'committed') {
      mappedStatus = 'finalized';
    }

    return mappedStatus === filter;
  });

  return (
    <div className="space-y-6 select-none">


      {/* PM Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 bg-white border border-slate-200/60 rounded-3xl shadow-sm">
        {/* Left Side: Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Custom Grouped School Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                setDropdownView('categories');
                setDropdownCategory(null);
              }}
              className="flex items-center gap-2 bg-[#D6402F]/5 border border-[#D6402F]/15 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-[#D6402F]/10 transition-colors outline-none text-[10px] font-black text-[#D6402F] select-none"
            >
              <span className="max-w-[220px] truncate uppercase">
                {selectedSchool && selectedSchool !== 'all'
                  ? selectedSchool
                  : selectedCategory && selectedCategory !== 'all'
                    ? `ALL ${selectedCategory}`
                    : 'DAPITAN SCHOOLS'}
              </span>
              <ChevronDown size={11} className={`text-[#D6402F]/70 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {(selectedCategory !== 'all' || selectedSchool !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSchool('all');
                }}
                className="ml-1 p-1 rounded-full bg-[#D6402F]/10 hover:bg-[#D6402F]/20 transition-colors cursor-pointer"
                title="Clear filter"
              >
                <X size={10} className="text-[#D6402F]" />
              </button>
            )}
            </div>

            {/* Custom Dropdown Menu Panel */}
            {dropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-fadeIn">
                {dropdownView === 'categories' ? (
                  // Categories Level List View
                  <div className="flex flex-col">

                    {[
                      { key: 'Elementary', label: 'Elementary' },
                      { key: 'Secondary', label: 'Secondary' },
                      { key: 'Integrated', label: 'Integrated' },
                      { key: 'SPED', label: 'SPED' }
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => {
                          setDropdownCategory(cat.key);
                          setDropdownView('schools');
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-[10px] font-black text-slate-700 uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <span>{cat.label}</span>
                        <ChevronRight size={12} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                ) : (
                  // Schools List inside selected Category
                  <div className="flex flex-col max-h-72">
                    {/* Header Back Button */}
                    <button
                      onClick={() => {
                        setDropdownView('categories');
                        setDropdownCategory(null);
                      }}
                      className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-500 hover:text-black uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={12} /> Back to Levels
                    </button>

                    {/* Scrollable list of schools */}
                    <div className="overflow-y-auto flex-1 py-1">
                      {/* Select All under this category */}
                      <button
                        onClick={() => {
                          setSelectedCategory(dropdownCategory);
                          setSelectedSchool('all');
                          setDropdownOpen(false);
                          setDropdownView('categories');
                          setDropdownCategory(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-[9px] font-black text-[#D6402F] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        All {dropdownCategory}
                      </button>

                      {SCHOOLS_DIRECTORY[dropdownCategory].map((schoolName) => {
                        if (schoolName.startsWith('---') && schoolName.endsWith('---')) {
                          return (
                            <div key={schoolName} className="px-4 pt-2.5 pb-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                              {schoolName.replace(/---/g, '').trim()}
                            </div>
                          );
                        }
                        const isSelected = selectedSchool === schoolName;
                        return (
                          <button
                            key={schoolName}
                            onClick={() => {
                              setSelectedCategory(dropdownCategory);
                              setSelectedSchool(schoolName);
                              setDropdownOpen(false);
                              setDropdownView('categories');
                              setDropdownCategory(null);
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-[9px] font-bold transition-colors cursor-pointer ${isSelected ? 'bg-orange-50/50 text-[#D6402F] font-black' : 'text-slate-600'
                              }`}
                          >
                            {schoolName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Custom School Year Dropdown */}
          {periodsList.length > 0 && (
            <div className="relative" ref={yearDropdownRef}>
              <button
                onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                className="flex items-center gap-2 bg-[#D6402F]/5 border border-[#D6402F]/15 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-[#D6402F]/10 transition-colors outline-none text-[10px] font-black text-[#D6402F] select-none"
              >
                <span className="max-w-[180px] truncate uppercase">
                  {periodsList.find(p => String(p.id) === selectedPeriodId)?.period_label || 'RATING SY'}
                </span>
                <ChevronDown size={11} className={`text-[#D6402F]/70 transition-transform duration-200 ${yearDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {yearDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-fadeIn">
                  {periodsList.map((p) => {
                    const isSelected = selectedPeriodId === String(p.id);
                    const label = p.period_label || `SCHOOL YEAR ${p.school_year}`;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          const val = String(p.id);
                          setSelectedPeriodId(val);
                          localStorage.setItem('selected_period_id', val);
                          window.dispatchEvent(new Event('selected_period_changed'));
                          setYearDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${isSelected ? 'bg-orange-50/50 text-[#D6402F] font-black' : 'text-slate-700'
                          }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Active Selection Indicator & Export Button */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:justify-end">
          {selectedSchool !== 'all' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#D6402F]/5 border border-[#D6402F]/15 text-black rounded-2xl text-[10px] font-black uppercase tracking-wider animate-fadeIn">
              <Building2 size={12} className="text-[#D6402F]" />
              <span>{selectedSchool}</span>
            </div>
          )}

          <button
            onClick={handleExportReport}
            className="flex items-center justify-center gap-2 px-4 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white border-0 font-black text-[10px] uppercase tracking-wider rounded-xl shadow-sm cursor-pointer transition-all active:scale-95 hover:shadow-md"
          >
            <Download size={12} className="text-white" /> Export Report
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 uppercase tracking-wider">
          {error}
        </div>
      )}

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-black text-black">{card.label}</span>
              <div className={`w-10 h-10 rounded-2xl ${card.bg} flex items-center justify-center`}>
                <card.icon size={20} className={card.color} />
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-black uppercase tracking-tight">{card.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Ratings Distribution Section */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-4">

        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-black text-black uppercase tracking-widest">Overall Ratings Distribution</h2>
          </div>
        </div>

        {/* 5-Column Distribution Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-[#4CAF50] text-white rounded-2xl p-4 text-center shadow-sm border border-[#3E8E41] flex flex-col justify-between min-h-[110px]">
            <span className="text-4xl font-black">{distribution.outstanding}</span>
            <span className="text-[10px] font-black uppercase tracking-wider mt-2 block">Outstanding</span>
          </div>

          <div className="bg-[#FF5722] text-white rounded-2xl p-4 text-center shadow-sm border border-[#E64A19] flex flex-col justify-between min-h-[110px]">
            <span className="text-4xl font-black">{distribution.verySatisfactory}</span>
            <span className="text-[10px] font-black uppercase tracking-wider mt-2 block">Very Satisfactory</span>
          </div>

          <div className="bg-[#00BCD4] text-white rounded-2xl p-4 text-center shadow-sm border border-[#0097A7] flex flex-col justify-between min-h-[110px]">
            <span className="text-4xl font-black">{distribution.satisfactory}</span>
            <span className="text-[10px] font-black uppercase tracking-wider mt-2 block">Satisfactory</span>
          </div>

          <div className="bg-[#E91E63] text-white rounded-2xl p-4 text-center shadow-sm border border-[#C2185B] flex flex-col justify-between min-h-[110px]">
            <span className="text-4xl font-black">{distribution.unsatisfactory}</span>
            <span className="text-[10px] font-black uppercase tracking-wider mt-2 block">Unsatisfactory</span>
          </div>

          <div className="bg-[#FFC107] text-white rounded-2xl p-4 text-center shadow-sm border border-[#FFA000] flex flex-col justify-between min-h-[110px]">
            <span className="text-4xl font-black">{distribution.poor}</span>
            <span className="text-[10px] font-black uppercase tracking-wider mt-2 block">Poor</span>
          </div>
        </div>
      </div>

      {/* School Years Section */}

      {/* Main Bottom Section */}
      <div className="gap-6">

        {/* Personnel Status Table */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-3">
              <h2 className="text-xs font-black text-black uppercase tracking-widest">Personnel IPCRF Status</h2>
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-yellow-50 border border-yellow-200/80 text-yellow-800 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer transition-colors hover:bg-yellow-100/50"
                >
                  <option value="all">All Statuses</option>
                  <option value="under_review">Under Review</option>
                  <option value="submitted">Submitted</option>
                  <option value="finalized">Finalized</option>
                  <option value="needs_revision">Needs Revision</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="not_submitted">Not Submitted</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5 hidden md:table-cell">Position</th>
                    <th className="px-6 py-3.5 hidden md:table-cell">Unit</th>
                    <th className="px-6 py-3.5">IPCRF Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32" /></td>
                        <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                        <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                        <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20" /></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-12 ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredPersonnel.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-xs font-bold text-slate-600 uppercase">No records found matching filter</td>
                    </tr>
                  ) : (
                    filteredPersonnel.map((p) => (
                      <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${p.status === 'needs_revision' ? 'bg-red-50/20' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="text-xs font-black text-black uppercase tracking-tight">{p.name}</div>
                          <div className="text-[9px] text-slate-600 font-bold uppercase mt-0.5 md:hidden">{p.position}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-800 hidden md:table-cell">{p.position}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-800 hidden md:table-cell">{p.unit}</td>
                        <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate('/pm/rewarding')}
                            className="inline-flex items-center gap-1 text-[9px] font-black text-[#1B3A6B] hover:text-[#D6402F] uppercase tracking-widest transition-colors cursor-pointer"
                          >
                            View <ArrowRight size={10} />
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

      </div>



    </div>
  );
};

export default PMDashboard;
