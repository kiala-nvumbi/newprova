import React from 'react';
import { ExamItem } from '../../types/exam';
import { Plus, Trash2 } from 'lucide-react';

interface TableWidgetProps {
  item: ExamItem;
  value: any;
  onChange: (val: any) => void;
}

export const TableWidget: React.FC<TableWidgetProps> = ({ item, value, onChange }) => {
  const c = item.config || {};
  const colunas = c.colunas || [];
  const linhas: any[] = value?.linhas || [];

  const handleAddLine = () => {
    const novaLinha: Record<string, any> = {};
    colunas.forEach((col) => {
      if (!col.bloqueado && col.tipo !== 'produto') {
        novaLinha[col.key] = '';
      }
    });
    onChange({ ...value, linhas: [...linhas, novaLinha] });
  };

  const handleRemoveLine = (index: number) => {
    if (linhas.length <= (c.minLinhas || 1)) {
      alert(`É necessário manter pelo menos ${c.minLinhas || 1} linha(s).`);
      return;
    }
    const novasLinhas = linhas.filter((_, i) => i !== index);
    onChange({ ...value, linhas: novasLinhas });
  };

  const handleCellChange = (rowIndex: number, colKey: string, cellVal: any) => {
    const novasLinhas = linhas.map((row, idx) => {
      if (idx !== rowIndex) return row;
      const updatedRow = { ...row, [colKey]: cellVal };

      // Recalculate any product columns
      colunas.forEach((col) => {
        if (col.tipo === 'produto' && col.fonte) {
          let prod = 1;
          let valid = true;
          col.fonte.forEach((fKey) => {
            const v = parseFloat(updatedRow[fKey]);
            if (isNaN(v)) {
              valid = false;
            } else {
              prod *= v;
            }
          });
          updatedRow[col.key] = valid ? prod : '';
        }
      });

      return updatedRow;
    });

    onChange({ ...value, linhas: novasLinhas });
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs bg-white">
        <table className="w-full text-left border-collapse min-w-[550px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <th className="py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-400 w-10 text-center">
                #
              </th>
              {colunas.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.largura }}
                  className="py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  {col.label}
                </th>
              ))}
              {c.remover && (
                <th className="py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-700 w-12 text-center">
                  Acções
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm">
            {linhas.map((row, rIndex) => (
              <tr key={rIndex} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-2.5 px-3 font-mono text-xs text-slate-400 text-center select-none">
                  {rIndex + 1}
                </td>

                {colunas.map((col) => {
                  const cellVal = row[col.key] ?? '';

                  if (col.tipo === 'produto') {
                    // Compute product on the fly
                    let prod = 1;
                    let valid = true;
                    (col.fonte || []).forEach((fKey) => {
                      const v = parseFloat(row[fKey]);
                      if (isNaN(v)) valid = false;
                      else prod *= v;
                    });
                    return (
                      <td key={col.key} className="py-2.5 px-3 text-center">
                        <span className="font-extrabold font-mono text-blue-700 text-base bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                          {valid ? prod : '—'}
                        </span>
                      </td>
                    );
                  }

                  if (col.bloqueado) {
                    return (
                      <td key={col.key} className="py-2.5 px-3 font-semibold text-slate-900">
                        {cellVal}
                      </td>
                    );
                  }

                  if (col.tipo === 'select') {
                    return (
                      <td key={col.key} className="py-2 px-2.5">
                        <select
                          value={cellVal}
                          onChange={(e) => handleCellChange(rIndex, col.key, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs sm:text-sm font-medium focus:border-blue-600 focus:ring-1 focus:ring-blue-100 outline-none"
                        >
                          <option value="">—</option>
                          {(col.opcoes || []).map((op) => (
                            <option key={op} value={op}>
                              {op}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  }

                  if (col.tipo === 'textarea') {
                    return (
                      <td key={col.key} className="py-2 px-2.5">
                        <textarea
                          rows={2}
                          value={cellVal}
                          onChange={(e) => handleCellChange(rIndex, col.key, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs sm:text-sm leading-relaxed focus:border-blue-600 focus:ring-1 focus:ring-blue-100 outline-none resize-y"
                        />
                      </td>
                    );
                  }

                  return (
                    <td key={col.key} className="py-2 px-2.5">
                      <input
                        type={col.tipo === 'numero' ? 'number' : 'text'}
                        value={cellVal}
                        onChange={(e) => handleCellChange(rIndex, col.key, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs sm:text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-100 outline-none"
                      />
                    </td>
                  );
                })}

                {c.remover && (
                  <td className="py-2 px-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(rIndex)}
                      title="Remover linha"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        {c.adicionar ? (
          <button
            type="button"
            onClick={handleAddLine}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            {c.rotuloAdicionar || 'Adicionar Linha'}
          </button>
        ) : (
          <div />
        )}

        {c.legenda && <span className="text-xs text-slate-500 italic">{c.legenda}</span>}
      </div>
    </div>
  );
};
