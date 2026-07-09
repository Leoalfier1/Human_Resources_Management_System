import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, Archive } from 'lucide-react';
import { useHREmployees } from '../../hooks/useEmployeeProfile';

const EmployeeDirectory = () => {
  const { data, loading, error, fetchEmployees } = useHREmployees();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ page: 1, limit: 20 });

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEmployees({ ...filters, search, page: 1 });
  };

  React.useEffect(() => {
    fetchEmployees(filters);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">Employee Directory</h2>
          <p className="text-xs font-bold text-slate-400">Manage all personnel records</p>
        </div>
        <Link to="/personnel-admin/employees/new" className="bg-[#1B3A6B] text-white rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-[#162E55] flex items-center gap-2">
          <Plus size={16} /> Add Employee
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or employee no..."
            className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none"
          />
        </div>
        <button type="submit" className="bg-[#1B3A6B] text-white rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-[#162E55]">Search</button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-[#D6402F] font-black">{error}</p>
          </div>
        ) : !data?.employees?.length ? (
          <div className="p-8 text-center">
            <p className="text-sm font-bold text-slate-400">No employees found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50">
                  <th className="p-4">Employee No.</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Position</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">School</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map(emp => (
                  <tr key={emp.id} className="border-b border-slate-50 text-sm hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-700">{emp.employee_no || '—'}</td>
                    <td className="p-4 font-bold text-slate-700">{emp.last_name}, {emp.first_name}</td>
                    <td className="p-4 text-slate-600">{emp.position_title || '—'}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${emp.employment_type === 'teaching' ? 'bg-blue-50 text-blue-700' : emp.employment_type === 'teaching_related' ? 'bg-violet-50 text-violet-700' : 'bg-purple-50 text-purple-700'}`}>
                        {emp.employment_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${emp.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{emp.assigned_school || '—'}</td>
                    <td className="p-4">
                      <Link to={`/personnel-admin/employees/${emp.id}`} className="text-[#1B3A6B] hover:text-[#D6402F] transition-colors">
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">
              Showing {data.employees?.length || 0} of {data.total || 0} employees
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { const p = Math.max(1, (data.page || 1) - 1); setFilters(f => ({...f, page: p})); fetchEmployees({ ...filters, page: p }); }}
                disabled={data.page <= 1}
                className="text-[10px] font-black text-[#1B3A6B] uppercase px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
              >Previous</button>
              <button
                onClick={() => { const p = (data.page || 1) + 1; setFilters(f => ({...f, page: p})); fetchEmployees({ ...filters, page: p }); }}
                disabled={data.page >= data.totalPages}
                className="text-[10px] font-black text-[#1B3A6B] uppercase px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDirectory;
