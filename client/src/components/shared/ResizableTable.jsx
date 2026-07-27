import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

const loadWidths = (key, fallback) => {
  try {
    const s = localStorage.getItem(key);
    if (s) {
      const p = JSON.parse(s);
      if (Array.isArray(p) && p.length === fallback.length) return p;
    }
  } catch {}
  return fallback;
};

const ResizableTable = ({
  columns,
  colWidthsKey,
  defaultWidths,
  data = [],
  rowKey = 'id',
  loading = false,
  emptyMessage = 'No records found',
  loadingMessage = 'Loading\u2026',
  stickyCols = 3,
  groupHeaders,
  headerClassName = 'bg-slate-50 text-slate-500',
  renderCell,
  onCellClick,
  tableMinWidth,
}) => {
  const [colWidths, setColWidths] = useState(() => loadWidths(colWidthsKey, defaultWidths));
  const cwRef = useRef(colWidths);
  useEffect(() => { cwRef.current = colWidths; }, [colWidths]);

  const onResize = useCallback((ci, e) => {
    e.preventDefault();
    const sx = e.clientX;
    const sw = cwRef.current[ci];
    const mv = (ev) => {
      const w = Math.max(columns[ci]?.minWidth ?? 30, sw + (ev.clientX - sx));
      setColWidths(p => { const n = [...p]; n[ci] = w; return n; });
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };
    const up = () => {
      localStorage.setItem(colWidthsKey, JSON.stringify(cwRef.current));
      document.removeEventListener('mousemove', mv);
      document.removeEventListener('mouseup', up);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', mv);
    document.addEventListener('mouseup', up);
  }, [columns, colWidthsKey]);

  const colCount = columns.length;
  const minW = tableMinWidth ?? defaultWidths.reduce((a, b) => a + b, 0);

  const stickyLeft = (colIndex) => {
    if (colIndex >= stickyCols) return null;
    let left = 0;
    for (let i = 0; i < colIndex; i++) left += colWidths[i];
    return left;
  };

  const thStyle = (colIndex) => {
    const sl = stickyLeft(colIndex);
    if (sl !== null) return { position: 'sticky', left: sl, zIndex: 15 };
    return { position: 'relative' };
  };

  const tdStyle = (colIndex) => {
    const sl = stickyLeft(colIndex);
    if (sl !== null) return { position: 'sticky', left: sl, zIndex: 10 };
    return {};
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed', minWidth: `${minW}px` }}>
        <thead>
          {groupHeaders && (
            <tr className="bg-[#1B3A6B] text-white text-[9px] font-black uppercase tracking-wider">
              {groupHeaders.map((g, i) => (
                <th
                  key={i}
                  colSpan={g.cs}
                  className="px-3 py-2 whitespace-nowrap text-center border-r border-[#2a4a7a]/40 last:border-r-0"
                >
                  {g.label}
                </th>
              ))}
            </tr>
          )}
          <tr className={`${headerClassName} border-b border-slate-200`}>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap border-r border-slate-100 last:border-r-0 select-none group ${
                  col.align === 'center' ? 'text-center' : ''
                } ${i < stickyCols ? `${headerClassName} z-10` : headerClassName}`}
                style={{
                  width: colWidths[i],
                  minWidth: colWidths[i],
                  ...thStyle(i),
                }}
              >
                {col.renderHeader ? col.renderHeader() : col.label}
                <div
                  className="absolute top-0 right-0 w-[5px] h-full cursor-col-resize z-20 opacity-0 group-hover:opacity-60 hover:opacity-100 bg-blue-300/80 hover:bg-blue-400 transition-opacity"
                  onMouseDown={e => onResize(i, e)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={colCount} className="text-center py-16 text-slate-400 text-xs font-black uppercase tracking-widest">
                <Loader2 className="animate-spin inline mr-2" size={16} />
                {loadingMessage}
              </td>
            </tr>
          ) : !data.length ? (
            <tr>
              <td colSpan={colCount} className="text-center py-16 text-slate-300 text-xs font-black uppercase tracking-widest">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, ri) => (
              <tr key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey]} className="hover:bg-blue-50/30 transition-colors">
                {Array.from({ length: colCount }, (_, ci) => ci).map(ci => {
                  const col = columns[ci];
                  const isFirstCols = ci < stickyCols;
                  return (
                    <td
                      key={ci}
                      className={`px-3 py-3 text-[11px] font-bold text-slate-600 whitespace-nowrap border-r border-slate-50 last:border-r-0 ${
                        col.align === 'center' ? 'text-center' : ''
                      } ${onCellClick ? 'cursor-pointer' : ''} ${isFirstCols ? 'bg-white z-10' : ''}`}
                      style={{
                        width: colWidths[ci],
                        minWidth: colWidths[ci],
                        ...tdStyle(ci),
                      }}
                      onClick={() => onCellClick?.(row, ci)}
                    >
                      {renderCell ? renderCell(row, ci, ri) : row[col.key] ?? '\u2014'}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ResizableTable;
