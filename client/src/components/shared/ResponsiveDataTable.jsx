import React from 'react';
import { AlertCircle, Inbox } from 'lucide-react';

/**
 * Reusable Responsive Data Table Component.
 * Automatically renders a clean HTML table on desktop (md:) and stacked cards on mobile (< md).
 *
 * @param {Array} columns - Column configs: [{ key, label, className, render, align }]
 * @param {Array} data - Array of row items
 * @param {string} keyField - Unique ID field name in item (default: 'id')
 * @param {Function} renderMobileCard - Custom card renderer: (item, index) => ReactNode
 * @param {boolean} loading - Loading state flag
 * @param {string} error - Error message string
 * @param {string} emptyMessage - Custom empty state message
 * @param {Function} onRowClick - Optional row click handler
 */
export const ResponsiveDataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  renderMobileCard,
  loading = false,
  error = null,
  emptyMessage = 'No records found.',
  onRowClick,
  className = ''
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#1B3A6B] border-t-transparent mb-3" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-2xl p-6 border border-red-200 text-red-700 flex items-center gap-3">
        <AlertCircle className="shrink-0" size={20} />
        <p className="text-sm font-bold">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-sm">
        <Inbox className="mx-auto text-slate-300 mb-3" size={40} />
        <p className="text-sm font-bold text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* MOBILE STACKED CARDS (< md) */}
      <div className="block md:hidden space-y-3">
        {data.map((item, index) => {
          const itemKey = item[keyField] ?? index;
          if (renderMobileCard) {
            return <React.Fragment key={itemKey}>{renderMobileCard(item, index)}</React.Fragment>;
          }

          // Fallback automatic mobile card layout
          return (
            <div
              key={itemKey}
              onClick={() => onRowClick && onRowClick(item)}
              className={`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 ${
                onRowClick ? 'cursor-pointer hover:border-[#1B3A6B] transition-all' : ''
              }`}
            >
              {columns.map((col) => {
                const value = col.render ? col.render(item[col.key], item) : item[col.key];
                return (
                  <div key={col.key || col.label} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <span className="font-black text-slate-400 uppercase text-[10px] tracking-wider shrink-0 mr-2">
                      {col.label}
                    </span>
                    <span className="font-bold text-slate-700 text-right overflow-hidden text-ellipsis">
                      {value !== undefined && value !== null && value !== '' ? value : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* DESKTOP DATA TABLE (>= md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {columns.map((col) => (
                  <th key={col.key || col.label} className={`px-6 py-4 ${col.className || ''}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              {data.map((item, index) => {
                const itemKey = item[keyField] ?? index;
                return (
                  <tr
                    key={itemKey}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {columns.map((col) => (
                      <td key={col.key || col.label} className={`px-6 py-4 ${col.className || ''}`}>
                        {col.render ? col.render(item[col.key], item) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveDataTable;
