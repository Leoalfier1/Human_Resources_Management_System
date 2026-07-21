import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Trash2, Clock, Loader2, AlertCircle, Inbox } from 'lucide-react';
import { API_BASE } from '../../../utils/api';
import RestoreConfirmModal from './RestoreConfirmModal';
import PermanentDeleteModal from './PermanentDeleteModal';

const API = `${API_BASE}/api/rsp/vacancies`;

const RecentlyDeletedTable = ({ onCountChange }) => {
    const [deletedVacancies, setDeletedVacancies] = useState([]);
    const [loading, setLoading] = useState(true);

    const [restoreTarget, setRestoreTarget] = useState(null);
    const [restoreLoading, setRestoreLoading] = useState(false);

    const [permDeleteTarget, setPermDeleteTarget] = useState(null);
    const [permDeleteLoading, setPermDeleteLoading] = useState(false);
    const [permDeleteError, setPermDeleteError] = useState('');

    const fetchDeleted = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}?view=deleted`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setDeletedVacancies(data);
                if (onCountChange) onCountChange(data.length);
            }
        } catch (e) {
            console.error('Fetch deleted vacancies error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDeleted(); }, []);

    const handleRestore = async () => {
        if (!restoreTarget) return;
        setRestoreLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/${restoreTarget.id}/restore`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const result = await res.json();
            if (res.ok) {
                setRestoreTarget(null);
                fetchDeleted();
                if (onCountChange) {
                    setTimeout(() => fetchDeleted(), 100);
                }
            } else {
                alert(result.message || 'Failed to restore vacancy.');
            }
        } catch (e) {
            alert('Connection error.');
        } finally {
            setRestoreLoading(false);
        }
    };

    const handlePermanentDelete = async () => {
        if (!permDeleteTarget) return;
        setPermDeleteLoading(true);
        setPermDeleteError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/${permDeleteTarget.id}/permanent`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmRefNo: permDeleteTarget.ref_no })
            });
            const result = await res.json();
            if (res.ok) {
                setPermDeleteTarget(null);
                fetchDeleted();
            } else {
                setPermDeleteError(result.message || 'Failed to permanently delete.');
            }
        } catch (e) {
            setPermDeleteError('Connection error.');
        } finally {
            setPermDeleteLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-PH', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <>
            <AnimatePresence>
                {restoreTarget && (
                    <RestoreConfirmModal
                        isOpen={!!restoreTarget}
                        onClose={() => setRestoreTarget(null)}
                        onConfirm={handleRestore}
                        vacancy={restoreTarget}
                        loading={restoreLoading}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {permDeleteTarget && (
                    <PermanentDeleteModal
                        isOpen={!!permDeleteTarget}
                        onClose={() => { setPermDeleteTarget(null); setPermDeleteError(''); }}
                        onConfirm={handlePermanentDelete}
                        vacancy={permDeleteTarget}
                        loading={permDeleteLoading}
                        error={permDeleteError}
                    />
                )}
            </AnimatePresence>

            <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-20 text-center">
                        <Loader2 className="animate-spin text-slate-300 mx-auto" size={32} />
                    </div>
                ) : deletedVacancies.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-4">
                            <Inbox size={32} />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No deleted vacancies</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-4">Ref No.</th>
                                <th className="px-4 py-4">Position Title</th>
                                <th className="px-4 py-4">Type</th>
                                <th className="px-4 py-4">School / Office</th>
                                <th className="px-4 py-4">No. Vacan.</th>
                                <th className="px-4 py-4">Deadline</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Deleted On</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {deletedVacancies.map((v) => (
                                <motion.tr
                                    key={v.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="hover:bg-slate-50/50 transition-colors"
                                >
                                    <td className="px-8 py-5 font-black text-[#1B3A6B] text-sm">{v.ref_no}</td>
                                    <td className="px-4 py-5 font-black text-[#1B3A6B] text-sm">{v.position_title}</td>
                                    <td className="px-4 py-5">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full tracking-widest ${
                                            v.position_type === 'non_teaching'
                                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                                : v.position_type === 'teaching_related'
                                                    ? 'bg-violet-50 text-violet-600 border border-violet-200'
                                                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                                        }`}>
                                            {v.position_type === 'non_teaching' ? 'Non-Tch' : v.position_type === 'teaching_related' ? 'Tch-Rel' : 'Teaching'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-5 text-[#1B3A6B] text-xs font-bold">{v.assigned_school}</td>
                                    <td className="px-4 py-5 font-bold text-slate-500 text-sm">{v.no_of_vacancies}</td>
                                    <td className="px-4 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-600">{new Date(v.deadline_date).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-black uppercase flex items-center gap-1 text-slate-400">
                                                <Clock size={10} /> Closed
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full tracking-widest bg-slate-100 text-slate-400">
                                            Deleted
                                        </span>
                                    </td>
                                    <td className="px-4 py-5">
                                        <span className="text-xs font-bold text-slate-500">
                                            {formatDate(v.deleted_at)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setRestoreTarget(v)}
                                                title="Restore vacancy"
                                                className="p-2 text-slate-300 hover:bg-[#1B3A6B] hover:text-white rounded-lg transition-all shadow-sm"
                                            >
                                                <RotateCcw size={16} />
                                            </button>
                                            <button
                                                onClick={() => setPermDeleteTarget(v)}
                                                title="Permanently delete"
                                                className="p-2 text-slate-300 hover:bg-red-700 hover:text-white rounded-lg transition-all shadow-sm"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
};

export default RecentlyDeletedTable;
