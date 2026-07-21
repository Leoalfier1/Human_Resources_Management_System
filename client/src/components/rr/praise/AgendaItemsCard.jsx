import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, X } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({
    'Authorization': `Bearer ${token()}`,
    'Content-Type': 'application/json'
});

const AgendaItemsCard = ({ meetingId, items, onToggle, onAdd, isFinalized }) => {
    const [adding, setAdding] = useState(false);
    const [newItemText, setNewItemText] = useState('');

    const handleToggle = async (item) => {
        try {
            const res = await fetch(
                `${API_BASE}/api/rr/praise-meetings/${meetingId}/agenda/${item.id}`,
                {
                    method: 'PATCH',
                    headers: headers(),
                    body: JSON.stringify({ isResolved: !item.is_resolved })
                }
            );
            if (res.ok) {
                const data = await res.json();
                onToggle(item.id, data.is_resolved);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAdd = async () => {
        if (!newItemText.trim()) return;
        try {
            const res = await fetch(
                `${API_BASE}/api/rr/praise-meetings/${meetingId}/agenda`,
                {
                    method: 'POST',
                    headers: headers(),
                    body: JSON.stringify({ itemText: newItemText.trim() })
                }
            );
            if (res.ok) {
                const item = await res.json();
                onAdd(item);
                setNewItemText('');
                setAdding(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
            <h3 className="text-sm font-black uppercase tracking-widest text-[#1B3A6B] mb-4">
                Agenda Items
            </h3>

            <div className="space-y-2">
                {items.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                        <button
                            onClick={() => handleToggle(item)}
                            disabled={isFinalized}
                            className="mt-0.5 shrink-0"
                        >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                item.is_resolved
                                    ? 'bg-[#D6402F] border-[#D6402F]'
                                    : 'border-slate-300 hover:border-[#D6402F]'
                            }`}>
                                {item.is_resolved ? (
                                    <Check size={12} className="text-white" strokeWidth={3} />
                                ) : null}
                            </div>
                        </button>
                        <span className={`text-sm font-medium transition-all ${
                            item.is_resolved
                                ? 'text-slate-400 line-through'
                                : 'text-[#1B3A6B]'
                        }`}>
                            {item.item_text}
                        </span>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {adding ? (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                    >
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newItemText}
                                onChange={(e) => setNewItemText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                placeholder="Enter agenda item..."
                                autoFocus
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-[#1B3A6B] placeholder-slate-300 focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-colors"
                            />
                            <button
                                onClick={handleAdd}
                                className="px-4 py-2.5 rounded-xl bg-[#D6402F] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#c03525] transition-colors"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => { setAdding(false); setNewItemText(''); }}
                                className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </motion.div>
                ) : !isFinalized ? (
                    <motion.button
                        onClick={() => setAdding(true)}
                        className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#D6402F] hover:text-[#c03525] transition-colors"
                    >
                        <Plus size={14} />
                        Add Agenda Item
                    </motion.button>
                ) : null}
            </AnimatePresence>
        </motion.div>
    );
};

export default AgendaItemsCard;
