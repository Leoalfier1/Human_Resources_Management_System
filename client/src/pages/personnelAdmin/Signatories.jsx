import React, { useState, useEffect } from 'react';
import { Plus, X, Check, Pen, Trash2, Search, UserCheck } from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../utils/api';

const EMPTY_FORM = { full_name: '', position: '', designation: '', is_active: true };

const Signatories = () => {
  const [signatories, setSignatories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [sigFile, setSigFile] = useState(null);
  const [sigPreview, setSigPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchSignatories(); }, []);

  const fetchSignatories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/signatories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSignatories(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const openAdd = () => { setForm(EMPTY_FORM); setSigFile(null); setSigPreview(null); setModal('add'); };

  const openEdit = (s) => {
    setForm({ full_name: s.full_name, position: s.position, designation: s.designation || '', is_active: !!s.is_active });
    setSigFile(null);
    setSigPreview(s.signature_path ? `${SERVER_BASE}${s.signature_path}` : null);
    setModal({ type: 'edit', id: s.id, existing: s });
  };

  const handleSigChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSigFile(file);
    setSigPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.full_name || !form.position) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('full_name', form.full_name);
      fd.append('position', form.position);
      fd.append('designation', form.designation);
      fd.append('is_active', form.is_active ? '1' : '0');
      if (sigFile) fd.append('signature', sigFile);

      const isEdit = modal?.type === 'edit';
      const url = isEdit
        ? `${API_BASE}/api/personnel/signatories/${modal.id}`
        : `${API_BASE}/api/personnel/signatories`;

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      if (res.ok) {
        setModal(null);
        await fetchSignatories();
      }
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/signatories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { setDeleteConfirm(null); await fetchSignatories(); }
    } catch {}
  };

  const filtered = signatories.filter(s => {
    if (filter === 'active' && !s.is_active) return false;
    if (filter === 'inactive' && s.is_active) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.full_name.toLowerCase().includes(q) && !s.position.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] via-[#234E8A] to-[#1B3A6B] px-6 pt-5 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <UserCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">Authorized Officials</h1>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Signatories for CS Form 6</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or position..."
              className="w-full pl-8 pr-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]"
            />
          </div>

          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-0.5">
            {['all', 'active', 'inactive'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  filter === tab ? 'bg-[#1B3A6B] text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#1B3A6B] text-white text-xs font-black rounded-xl hover:bg-[#234E8A] transition-all">
            <Plus size={14} /> Add Signatory
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <UserCheck size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-xs font-bold text-slate-400">No signatories found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Signature</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Position</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      {s.signature_path ? (
                        <img src={`${SERVER_BASE}${s.signature_path}`} alt="sig" className="h-10 w-24 object-contain bg-white border border-slate-200 rounded-lg px-1" />
                      ) : (
                        <div className="h-10 w-24 bg-slate-100 border border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                          <Pen size={12} className="text-slate-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">{s.full_name}</td>
                    <td className="px-4 py-3 text-[11px] font-semibold text-slate-600">{s.position}</td>
                    <td className="px-4 py-3 text-[11px] font-semibold text-slate-500">{s.designation || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                        {s.is_active ? <><Check size={10} /> Active</> : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-[#1B3A6B] hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                          <Pen size={13} />
                        </button>
                        <button onClick={() => setDeleteConfirm(s)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <h3 className="text-sm font-black text-slate-800">{modal?.type === 'edit' ? 'Edit Signatory' : 'Add Signatory'}</h3>
              <button onClick={() => setModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name *</label>
                <input
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]"
                  placeholder="e.g. Juan Dela Cruz"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Position *</label>
                <input
                  value={form.position}
                  onChange={e => setForm({ ...form, position: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]"
                  placeholder="e.g. Schools Division Superintendent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Designation / Office</label>
                <input
                  value={form.designation}
                  onChange={e => setForm({ ...form, designation: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]"
                  placeholder="e.g. Office of the Schools Division Superintendent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Signature Image (JPG/PNG)</label>
                <div className="flex items-center gap-4">
                  {sigPreview ? (
                    <img src={sigPreview} alt="signature preview" className="h-16 w-40 object-contain bg-white border border-slate-200 rounded-xl px-2" />
                  ) : (
                    <div className="h-16 w-40 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-center">
                      <Pen size={16} className="text-slate-300" />
                    </div>
                  )}
                  <label className="cursor-pointer px-3 py-2 text-[10px] font-black bg-slate-100 hover:bg-slate-200 rounded-xl transition-all uppercase tracking-widest">
                    Choose File
                    <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleSigChange} />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`relative w-10 h-5 rounded-full transition-all ${form.is_active ? 'bg-[#1B3A6B]' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-xs font-bold text-slate-600">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-[10px] font-black text-slate-500 hover:text-slate-700 uppercase tracking-widest">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.full_name || !form.position}
                className="px-5 py-2 text-[10px] font-black text-white bg-[#1B3A6B] hover:bg-[#234E8A] rounded-xl disabled:opacity-40 uppercase tracking-widest transition-all"
              >
                {saving ? 'Saving...' : modal?.type === 'edit' ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="text-sm font-black text-slate-800 mb-1">Delete Signatory?</h3>
            <p className="text-xs font-semibold text-slate-500 mb-4">
              This will permanently remove <strong>{deleteConfirm.full_name}</strong> and their signature image.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 text-[10px] font-black text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 uppercase tracking-widest">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 px-4 py-2 text-[10px] font-black text-white bg-red-600 rounded-xl hover:bg-red-700 uppercase tracking-widest">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signatories;
