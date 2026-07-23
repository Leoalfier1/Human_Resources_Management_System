import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, ChevronUp, ChevronDown, Download, X } from 'lucide-react';
import { useHREmployees } from '../../hooks/useEmployeeProfile';
import { API_BASE, downloadFile } from '../../utils/api';

const SORT_COLUMNS = [
    { key: 'employee_no', label: 'Employee No.' },
    { key: 'last_name', label: 'Name' },
    { key: 'position_title', label: 'Position' },
    { key: 'years_of_service', label: 'Years of Service' },
];

const jobStatusColor = (s) => {
    switch (s) {
        case 'active': return 'bg-green-50 text-green-700';
        case 'on_leave': return 'bg-amber-50 text-amber-700';
        case 'suspended': return 'bg-orange-50 text-orange-700';
        case 'resigned': case 'terminated': case 'retired': return 'bg-red-50 text-red-700';
        default: return 'bg-slate-100 text-slate-600';
    }
};

const categoryColor = (t) => {
    switch (t) {
        case 'teaching': return 'bg-blue-50 text-blue-700';
        case 'teaching_related': return 'bg-violet-50 text-violet-700';
        case 'non_teaching': return 'bg-purple-50 text-purple-700';
        default: return 'bg-slate-100 text-slate-600';
    }
};

const empStatusColor = (s) => {
    switch (s) {
        case 'permanent': return 'bg-emerald-50 text-emerald-700';
        case 'temporary': return 'bg-sky-50 text-sky-700';
        case 'casual': return 'bg-amber-50 text-amber-700';
        case 'contractual': case 'coterminous': return 'bg-rose-50 text-rose-700';
        default: return 'bg-slate-100 text-slate-600';
    }
};

const selectClass = 'border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none';

const EmployeeDirectory = () => {
    const { data, loading, error, fetchEmployees } = useHREmployees();
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ page: 1, limit: 20 });
    const [sortBy, setSortBy] = useState('last_name');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [filterOptions, setFilterOptions] = useState({ locations: [], positions: [] });

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/personnel/employees/filter-options`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) setFilterOptions(await res.json());
            } catch (_) { /* silent */ }
        };
        loadOptions();
    }, []);

    const buildParams = useCallback((overrides = {}) => {
        const merged = { ...filters, sort_by: sortBy, sort_order: sortOrder, ...overrides };
        const out = {};
        Object.entries(merged).forEach(([k, v]) => {
            if (v !== undefined && v !== '' && v !== null) out[k] = v;
        });
        return out;
    }, [filters, sortBy, sortOrder]);

    useEffect(() => {
        fetchEmployees(buildParams());
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setFilters(f => ({ ...f, page: 1 }));
        fetchEmployees(buildParams({ search, page: 1 }));
    };

    const handleFilterChange = (key, value) => {
        const next = { ...filters, [key]: value, page: 1 };
        setFilters(next);
        fetchEmployees({ ...next, search, sort_by: sortBy, sort_order: sortOrder });
    };

    const handleSort = (col) => {
        const nextOrder = sortBy === col && sortOrder === 'ASC' ? 'DESC' : 'ASC';
        setSortBy(col);
        setSortOrder(nextOrder);
        fetchEmployees({ ...filters, search, sort_by: col, sort_order: nextOrder });
    };

    const handleExport = () => {
        const params = buildParams({ search, format: 'csv', limit: 99999, page: 1 });
        const qs = new URLSearchParams(params).toString();
        downloadFile(`/api/personnel/employees?${qs}`, 'employee_masterlist.csv');
    };

    const clearFilters = () => {
        const reset = { page: 1, limit: 20 };
        setFilters(reset);
        setSearch('');
        setSortBy('last_name');
        setSortOrder('ASC');
        fetchEmployees({ ...reset, sort_by: 'last_name', sort_order: 'ASC' });
    };

    const hasActiveFilters = filters.school_office_id || filters.employment_type || filters.employment_status || filters.job_status || filters.position_title;

    const renderSortIcon = (col) => {
        if (sortBy !== col) return null;
        return sortOrder === 'ASC' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
    };

    const goToPage = (p) => {
        setFilters(f => ({ ...f, page: p }));
        fetchEmployees({ ...filters, search, sort_by: sortBy, sort_order: sortOrder, page: p });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">Employee Directory</h2>
                    <p className="text-xs font-bold text-slate-400">Manage all personnel records</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button onClick={handleExport} className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 text-[#1B3A6B] rounded-xl font-black uppercase text-xs px-4 py-3 hover:bg-slate-50 flex items-center gap-2">
                        <Download size={14} /> Export
                    </button>
                    <Link to="/personnel-admin/employees/new" className="flex-1 sm:flex-none justify-center bg-[#1B3A6B] text-white rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-[#162E55] flex items-center gap-2">
                        <Plus size={16} /> Add Employee
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</label>
                    <select value={filters.school_office_id || ''} onChange={e => handleFilterChange('school_office_id', e.target.value)} className={`${selectClass} w-full`}>
                        <option value="">All Locations</option>
                        {filterOptions.locations.filter(l => l.type === 'school').length > 0 && (
                            <optgroup label="Schools">
                                {filterOptions.locations.filter(l => l.type === 'school').map(l => (
                                    <option key={l.id} value={l.id}>{l.name}{l.district ? ` — ${l.district}` : ''}</option>
                                ))}
                            </optgroup>
                        )}
                        {filterOptions.locations.filter(l => l.type === 'office').length > 0 && (
                            <optgroup label="Offices">
                                {filterOptions.locations.filter(l => l.type === 'office').map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</label>
                    <select value={filters.employment_type || ''} onChange={e => handleFilterChange('employment_type', e.target.value)} className={`${selectClass} w-full`}>
                        <option value="">All</option>
                        <option value="teaching">Teaching</option>
                        <option value="teaching_related">Teaching-Related</option>
                        <option value="non_teaching">Non-Teaching</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Emp. Status</label>
                    <select value={filters.employment_status || ''} onChange={e => handleFilterChange('employment_status', e.target.value)} className={`${selectClass} w-full`}>
                        <option value="">All</option>
                        <option value="permanent">Permanent</option>
                        <option value="temporary">Temporary</option>
                        <option value="casual">Casual</option>
                        <option value="contractual">Contractual</option>
                        <option value="coterminous">Coterminous</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Job Status</label>
                    <select value={filters.job_status || ''} onChange={e => handleFilterChange('job_status', e.target.value)} className={`${selectClass} w-full`}>
                        <option value="">All</option>
                        <option value="active">Active</option>
                        <option value="on_leave">On Leave</option>
                        <option value="suspended">Suspended</option>
                        <option value="resigned">Resigned</option>
                        <option value="retired">Retired</option>
                        <option value="terminated">Terminated</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Position Title</label>
                    <input
                        type="text"
                        value={filters.position_title || ''}
                        onChange={e => handleFilterChange('position_title', e.target.value)}
                        placeholder="e.g. Teacher I"
                        className={`${selectClass} w-full`}
                    />
                </div>
                {hasActiveFilters && (
                    <button onClick={clearFilters} className="sm:col-span-2 md:col-span-1 flex items-center justify-center gap-1 text-[10px] font-black text-[#D6402F] uppercase px-3 py-2 hover:bg-red-50 rounded-xl border border-red-100">
                        <X size={12} /> Clear Filters
                    </button>
                )}
            </div>

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
                    <>
                        {/* MOBILE STACKED CARDS (< md) */}
                        <div className="block md:hidden p-4 space-y-3 divide-y divide-slate-100">
                            {data.employees.map(emp => (
                                <div key={emp.id} className="pt-3 first:pt-0 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-black text-[#1B3A6B]">{emp.last_name}, {emp.first_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">No: {emp.employee_no || '—'}</p>
                                        </div>
                                        <Link to={`/personnel-admin/employees/${emp.id}`} className="bg-slate-100 p-2 rounded-xl text-[#1B3A6B] hover:bg-slate-200">
                                            <Eye size={16} />
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Position</span>
                                            <span className="font-bold text-slate-700">{emp.position_title || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Location</span>
                                            <span className="font-bold text-slate-700 truncate block">{emp.location_name || emp.assigned_school || emp.office || '—'}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${categoryColor(emp.employment_type)}`}>
                                            {(emp.employment_type || '').replace(/_/g, ' ')}
                                        </span>
                                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${empStatusColor(emp.employment_status)}`}>
                                            {emp.employment_status || '—'}
                                        </span>
                                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${jobStatusColor(emp.job_status)}`}>
                                            {(emp.job_status || 'active').replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* DESKTOP DATA TABLE (>= md) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50">
                                        {SORT_COLUMNS.map(col => (
                                            <th key={col.key} className="p-4 cursor-pointer select-none hover:text-[#1B3A6B] transition-colors" onClick={() => handleSort(col.key)}>
                                                <span className="flex items-center gap-1">{col.label}{renderSortIcon(col.key)}</span>
                                            </th>
                                        ))}
                                        <th className="p-4">Location</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Emp. Status</th>
                                        <th className="p-4">Job Status</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.employees.map(emp => (
                                        <tr key={emp.id} className="border-b border-slate-50 text-sm hover:bg-slate-50">
                                            <td className="p-4 font-bold text-slate-700">{emp.employee_no || '—'}</td>
                                            <td className="p-4 font-bold text-slate-700">{emp.last_name}, {emp.first_name}</td>
                                            <td className="p-4 text-slate-600">{emp.position_title || '—'}</td>
                                            <td className="p-4 text-slate-600">{emp.years_of_service || '—'}</td>
                                            <td className="p-4 text-slate-600">{emp.location_name || emp.assigned_school || emp.office || '—'}</td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${categoryColor(emp.employment_type)}`}>
                                                    {(emp.employment_type || '').replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${empStatusColor(emp.employment_status)}`}>
                                                    {emp.employment_status || '—'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${jobStatusColor(emp.job_status)}`}>
                                                    {(emp.job_status || 'active').replace(/_/g, ' ')}
                                                </span>
                                            </td>
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
                    </>
                )}

                {data && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400">
                            Showing {data.employees?.length || 0} of {data.total || 0} employees
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => goToPage(Math.max(1, (data.page || 1) - 1))}
                                disabled={data.page <= 1}
                                className="text-[10px] font-black text-[#1B3A6B] uppercase px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
                            >Previous</button>
                            <button
                                onClick={() => goToPage((data.page || 1) + 1)}
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
