import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import { API_BASE } from '../../utils/api';
import ResizableTable from '../../components/shared/ResizableTable';

const DEFAULT_WIDTHS = [
  50, 120, 200, 200, 50, 60, 100, 100, 100, 100,
  200, 130, 200, 200, 70, 70, 200, 130
];
const COL_WIDTHS_KEY = 'eligibilityTableColWidths';

const COLUMNS = [
  { key: 'no', label: 'No.', width: 50, align: 'center' },
  { key: 'code', label: 'App. Code', width: 120 },
  { key: 'name', label: 'Name of Applicant', width: 200 },
  { key: 'address', label: 'Address', width: 200 },
  { key: 'age', label: 'Age', width: 50, align: 'center' },
  { key: 'sex', label: 'Sex', width: 60, align: 'center' },
  { key: 'civil_status', label: 'Civil Status', width: 100 },
  { key: 'religion', label: 'Religion', width: 100 },
  { key: 'disability', label: 'Disability', width: 100 },
  { key: 'ethnic_group', label: 'Ethnic Group', width: 100 },
  { key: 'email', label: 'Email Address', width: 200 },
  { key: 'contact_no', label: 'Contact No.', width: 130 },
  { key: 'title', label: 'Title', width: 200 },
  { key: 'details', label: 'Details', width: 200 },
  { key: 'hours', label: 'Hours', width: 70, align: 'center' },
  { key: 'years', label: 'Years', width: 70, align: 'center' },
  { key: 'eligibility', label: 'Eligibility', width: 200 },
  { key: 'remarks', label: 'Remarks', width: 130, align: 'center', renderHeader: () => (
    <span>Remarks<span className="block text-[7px] font-bold opacity-70">Qualified / Disqualified</span></span>
  )},
];

const GROUP_HEADERS = [
  { label: 'No.', cs: 1 },
  { label: 'Application Code', cs: 1 },
  { label: 'Name of Applicant', cs: 1 },
  { label: 'Address', cs: 1 },
  { label: 'Age', cs: 1 },
  { label: 'Sex', cs: 1 },
  { label: 'Civil Status', cs: 1 },
  { label: 'Religion', cs: 1 },
  { label: 'Disability', cs: 1 },
  { label: 'Ethnic Group', cs: 1 },
  { label: 'Email Address', cs: 1 },
  { label: 'Contact No.', cs: 1 },
  { label: 'Education', cs: 1 },
  { label: 'Training', cs: 2 },
  { label: 'Experience', cs: 1 },
  { label: 'Eligibility', cs: 2 },
];

const QS = [
  { label: 'Education', key: 'minimum_qualifications' },
  { label: 'Training', key: null },
  { label: 'Experience', key: null },
  { label: 'Eligibility', key: null },
];

const EligibilityScreening = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vacancyId, setVacancyId] = useState('');
  const [vacancies, setVacancies] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const p = new URLSearchParams({ limit: 200 });
      if (vacancyId) p.append('vacancy_id', vacancyId);
      if (search) p.append('search', search);
      const r = await fetch(`${API_BASE}/api/rsp/eligibility?${p}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) setData(await r.json());
    } catch {} finally { setLoading(false); }
  }, [vacancyId, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const r = await fetch(`${API_BASE}/api/vacancies`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) {
          const v = await r.json();
          setVacancies(v.list || v.vacancies || (Array.isArray(v) ? v : []));
        }
      } catch {}
    })();
  }, []);

  const selVac = vacancies.find(v => v.id === Number(vacancyId));

  const toggleRemarks = async (id, cur) => {
    const n = cur === 'qualified' ? 'disqualified' : 'qualified';
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/rsp/eligibility/${id}/remarks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ remarks: n })
    });
    fetchData();
  };

  const exportCSV = () => {
    const token = localStorage.getItem('token');
    const p = new URLSearchParams();
    if (vacancyId) p.append('vacancy_id', vacancyId);
    window.open(`${API_BASE}/api/rsp/eligibility/export-csv?${p}&token=${token}`, '_blank');
  };

  const badge = (remarks) => {
    if (remarks === 'qualified')
      return <span className="inline-block bg-green-50 text-green-700 text-[10px] font-black px-2 py-1 rounded uppercase cursor-pointer hover:bg-green-100">Qualified</span>;
    if (remarks === 'disqualified')
      return <span className="inline-block bg-red-50 text-red-700 text-[10px] font-black px-2 py-1 rounded uppercase cursor-pointer hover:bg-red-100">Disqualified</span>;
    return <span className="inline-block bg-slate-100 text-slate-400 text-[10px] font-black px-2 py-1 rounded uppercase cursor-pointer hover:bg-slate-200">Pending</span>;
  };

  const renderCell = (row, ci, ri) => {
    const base = ((data?.page || 1) - 1) * 100;
    switch (ci) {
      case 0: return <span className="font-bold text-slate-500">{base + ri + 1}</span>;
      case 1: return <span className="font-bold text-slate-700 whitespace-nowrap">{row.application_code || '\u2014'}</span>;
      case 2: return <span className="font-bold text-slate-700 whitespace-nowrap">{row.applicant_name || '\u2014'}</span>;
      case 3: return <span className="text-slate-600">{row.address || '\u2014'}</span>;
      case 4: return <span className="text-slate-600">{row.age ?? '\u2014'}</span>;
      case 5: return row.sex
        ? <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${row.sex === 'male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>{row.sex}</span>
        : <span className="text-slate-400">&mdash;</span>;
      case 6: return <span className="text-slate-600 whitespace-nowrap">{row.civil_status || '\u2014'}</span>;
      case 7: return <span className="text-slate-600">{row.religion || '\u2014'}</span>;
      case 8: return <span className="text-slate-600">{row.disability || '\u2014'}</span>;
      case 9: return <span className="text-slate-600">{row.ethnic_group || '\u2014'}</span>;
      case 10: return <span className="text-slate-600 text-[10px]">{row.email || '\u2014'}</span>;
      case 11: return <span className="text-slate-600 whitespace-nowrap">{row.contact_no || '\u2014'}</span>;
      case 12: return <span className="text-slate-600">{row.education || '\u2014'}</span>;
      case 13: return <span className="text-slate-600">{row.training_title || '\u2014'}</span>;
      case 14: return <span className="text-slate-600">{row.training_hours ?? '\u2014'}</span>;
      case 15: return <span className="text-slate-600">{row.experience_years ?? '\u2014'}</span>;
      case 16: return <span className="text-slate-600">{row.eligibility || '\u2014'}</span>;
      case 17: return badge(row.remarks);
      default: return null;
    }
  };

  const onClickCell = (row, ci) => { if (ci === 17) toggleRemarks(row.id, row.remarks); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">Eligibility Screening</h2>
          <p className="text-xs font-bold text-slate-400">Initial Evaluation Result (IER) &mdash; Applicant Screening Table</p>
        </div>
        <button onClick={exportCSV} className="bg-emerald-600 text-white rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-emerald-700 flex items-center gap-2">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or application code..."
            className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none"
          />
        </div>
        <div className="relative">
          <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={vacancyId}
            onChange={e => setVacancyId(e.target.value)}
            className="border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none min-w-[200px]"
          >
            <option value="">All Vacancies</option>
            {vacancies.map(v => (
              <option key={v.id} value={v.id}>{v.position_title || v.ref_no || `Vacancy #${v.id}`}</option>
            ))}
          </select>
        </div>
      </div>

      {selVac && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-xs font-bold text-slate-700">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">Position</span>
            <span>{selVac.position_title || '\u2014'}</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">Salary Grade</span>
            <span>
              {selVac.salary_grade || '\u2014'}
              {selVac.monthly_salary ? ` / \u20B1${Number(selVac.monthly_salary).toLocaleString()}` : ''}
            </span>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">Qualification Standards</span>
            <span>{selVac.minimum_qualifications || 'None Required'}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-4 gap-2 text-[10px]">
            {QS.map(q => (
              <div key={q.label}>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{q.label}</span>
                <p className="text-[10px] font-bold text-slate-600 mt-0.5">
                  {q.key && selVac[q.key] ? selVac[q.key] : 'None Required'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
          </div>
        ) : !data?.data?.length ? (
          <div className="p-8 text-center">
            <p className="text-sm font-bold text-slate-400">No screening records found. Import data first.</p>
          </div>
        ) : (
          <ResizableTable
            columns={COLUMNS}
            colWidthsKey={COL_WIDTHS_KEY}
            defaultWidths={DEFAULT_WIDTHS}
            data={data.data}
            rowKey="id"
            loading={false}
            groupHeaders={GROUP_HEADERS}
            headerClassName="bg-[#1B3A6B] text-white"
            renderCell={renderCell}
            onCellClick={onClickCell}
          />
        )}

        {data && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <p className="text-[10px] font-bold text-slate-400">{data.total || 0} records</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EligibilityScreening;
