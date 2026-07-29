import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users, MapPin, Search, RefreshCw, BookOpen } from 'lucide-react';
import { apiFetch } from '../../../../utils/api';

const filters = ['All', 'Teaching', 'Teaching-related', 'Non-teaching'];

const typeBadge = (t) => {
  const norm = (t || '').toLowerCase();
  if (norm.includes('teaching-related')) return { bg: '#f5f3ff', color: '#7c3aed', label: 'Teaching-related' };
  if (norm.includes('non_teaching') || norm.includes('non-teaching')) return { bg: '#F9FAFB', color: '#6B7280', label: 'Non-teaching' };
  return { bg: '#DBEAFE', color: '#2563EB', label: 'Teaching' };
};

const LDEmployeeBrowsePrograms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState(location.state?.search || '');
  const [activeType, setActiveType] = useState(location.state?.activeType || 'All');
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/ld/programs');
      const data = await res.json();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch browse programs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const filtered = programs.filter(p => {
    const target = (p.target_participants || p.target_position_type || '').toLowerCase();
    const typeLower = activeType.toLowerCase();

    let matchesType = true;
    if (activeType !== 'All') {
      if (typeLower === 'teaching') {
        matchesType = target.includes('teaching') && !target.includes('non') && !target.includes('related');
      } else if (typeLower === 'teaching-related') {
        matchesType = target.includes('related');
      } else if (typeLower === 'non-teaching') {
        matchesType = target.includes('non');
      }
    }

    const matchesSearch = !search.trim() || p.title.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* ── Filter bar ──────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search programs…"
            className="w-full rounded-full pl-9 pr-4 py-2 focus:outline-none transition-colors"
            style={{ border: '1px solid #E5E7EB', fontSize: 11, color: '#374151' }} />
        </div>
        {filters.map(f => (
          <button key={f} onClick={() => setActiveType(f)}
            className="px-4 py-2 rounded-full font-bold transition-all"
            style={{
              fontSize: 11,
              background: activeType === f ? '#1B2A50' : '#fff',
              color: activeType === f ? '#fff' : '#6B7280',
              border: activeType === f ? 'none' : '1px solid #E5E7EB',
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* ── Program cards grid ──────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 p-12 text-center bg-white space-y-2">
          <BookOpen size={32} className="mx-auto text-gray-300" />
          <p className="font-bold text-sm text-[#1B2A50]">No programs match your search/filter</p>
          <p className="text-xs text-gray-400">Try adjusting your category filter or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(p => {
            const enrolledCount = p.enrolled_count || 0;
            const capacity = p.max_slots || p.participant_count || 80;
            const isOpen = enrolledCount < capacity && p.status !== 'cancelled';
            const { bg, color, label } = typeBadge(p.target_participants || p.target_position_type);
            const dateStr = p.start_date ? new Date(p.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD';

            return (
              <div key={p.id} className="rounded-2xl border border-slate-100 p-4 flex flex-col hover:shadow-md transition-shadow"
                style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

                {/* Top badges */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex px-2 py-0.5 rounded-full font-bold" style={{ background: bg, color, fontSize: 9 }}>{label}</span>
                  {isOpen
                    ? <span className="inline-flex px-2 py-0.5 rounded-full font-bold" style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 9 }}>Open</span>
                    : <span className="inline-flex px-2 py-0.5 rounded-full font-bold" style={{ background: '#E5E7EB', color: '#6B7280', fontSize: 9 }}>Full</span>}
                </div>

                {/* Title */}
                <p className="font-bold leading-snug mb-3 line-clamp-2" style={{ fontSize: 13, color: '#1B2A50' }}>{p.title}</p>

                {/* Meta */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: '#6B7280' }}>
                    <Calendar size={11} /> <span>{dateStr} • {p.duration_hours ? `${p.duration_hours} hrs` : '3 days'}</span>
                  </div>
                  <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: '#6B7280' }}>
                    <Users size={11} /> <span>{enrolledCount}/{capacity} enrolled</span>
                  </div>
                  <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: '#6B7280' }}>
                    <MapPin size={11} /> <span>{p.methodology || 'Face-to-face'}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                  <span style={{ fontSize: 9, color: '#6B7280' }}>All Levels</span>
                  <button
                    onClick={() => navigate(`/ld-employee/programs/${p.id}`, { state: { programId: p.id, activeType, search } })}
                    className="px-3.5 py-1.5 rounded-full font-black transition-opacity"
                    style={{
                      background: isOpen ? '#DE4E2A' : '#E5E7EB',
                      color: isOpen ? '#fff' : '#6B7280',
                      fontSize: 10,
                      letterSpacing: '0.06em',
                    }}>
                    {isOpen ? 'Apply' : 'View'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LDEmployeeBrowsePrograms;
