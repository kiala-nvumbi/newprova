import React from 'react';
import { ExamItem } from '../../types/exam';
import { Plus, Trash2 } from 'lucide-react';

interface SwotWidgetProps {
  item: ExamItem;
  value: any;
  onChange: (val: any) => void;
}

export const SwotWidget: React.FC<SwotWidgetProps> = ({ item, value, onChange }) => {
  const c = item.config || {};
  const quadrantes = c.quadrantes || [];
  const linhas: Array<{ grupo: string; item: string }> = value?.linhas || [];

  const handleAddItem = (grupoKey: string) => {
    const novasLinhas = [...linhas, { grupo: grupoKey, item: '' }];
    onChange({ ...value, linhas: novasLinhas });
  };

  const handleUpdateItem = (index: number, text: string) => {
    const novasLinhas = [...linhas];
    novasLinhas[index].item = text;
    onChange({ ...value, linhas: novasLinhas });
  };

  const handleRemoveItem = (index: number) => {
    const novasLinhas = linhas.filter((_, i) => i !== index);
    onChange({ ...value, linhas: novasLinhas });
  };

  const getQuadrantStyle = (cor?: string) => {
    switch (cor) {
      case 'verde':
        return {
          borderTop: 'border-t-4 border-t-emerald-600',
          bg: 'bg-emerald-50/20',
          title: 'text-emerald-900',
          sub: 'text-emerald-700',
          btn: 'text-emerald-700 hover:bg-emerald-50 border-emerald-300'
        };
      case 'vermelho':
        return {
          borderTop: 'border-t-4 border-t-rose-600',
          bg: 'bg-rose-50/20',
          title: 'text-rose-900',
          sub: 'text-rose-700',
          btn: 'text-rose-700 hover:bg-rose-50 border-rose-300'
        };
      case 'azul':
        return {
          borderTop: 'border-t-4 border-t-blue-600',
          bg: 'bg-blue-50/20',
          title: 'text-blue-900',
          sub: 'text-blue-700',
          btn: 'text-blue-700 hover:bg-blue-50 border-blue-300'
        };
      case 'laranja':
        return {
          borderTop: 'border-t-4 border-t-amber-600',
          bg: 'bg-amber-50/20',
          title: 'text-amber-900',
          sub: 'text-amber-700',
          btn: 'text-amber-700 hover:bg-amber-50 border-amber-300'
        };
      default:
        return {
          borderTop: 'border-t-4 border-t-slate-600',
          bg: 'bg-slate-50',
          title: 'text-slate-900',
          sub: 'text-slate-600',
          btn: 'text-slate-700 hover:bg-slate-100 border-slate-300'
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {quadrantes.map((qd) => {
        const style = getQuadrantStyle(qd.cor);
        const itensDoGrupo = linhas
          .map((l, originalIndex) => ({ ...l, originalIndex }))
          .filter((l) => l.grupo === qd.key);

        return (
          <div
            key={qd.key}
            className={`p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between ${style.borderTop} ${style.bg}`}
          >
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <h4 className={`text-base font-bold ${style.title}`}>{qd.label}</h4>
                <span className={`text-xs font-semibold uppercase tracking-wider ${style.sub}`}>
                  {qd.sub}
                </span>
              </div>

              <div className="space-y-2 mt-3">
                {itensDoGrupo.map(({ item: texto, originalIndex }, seq) => (
                  <div key={originalIndex} className="flex items-center gap-1.5 group">
                    <span className="text-xs font-bold font-mono text-slate-400 w-5 text-right">
                      {seq + 1}.
                    </span>
                    <input
                      type="text"
                      value={texto || ''}
                      placeholder="Descreva o factor..."
                      onChange={(e) => handleUpdateItem(originalIndex, e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs sm:text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-100 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(originalIndex)}
                      title="Remover factor"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {itensDoGrupo.length === 0 && (
                  <p className="text-xs italic text-slate-400 py-1">Nenhum item adicionado.</p>
                )}
              </div>
            </div>

            <div className="mt-3 pt-2">
              <button
                type="button"
                onClick={() => handleAddItem(qd.key)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md border bg-white shadow-xs transition-colors ${style.btn}`}
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Factor
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
