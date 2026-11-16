import React from 'react';
import { ExamItem } from '../../types/exam';
import { Calculator } from 'lucide-react';

interface CalculoWidgetProps {
  item: ExamItem;
  value: any;
  onChange: (val: any) => void;
}

export const CalculoWidget: React.FC<CalculoWidgetProps> = ({ item, value, onChange }) => {
  const c = item.config || {};
  const calculoVal = value?.calculo || '';
  const resultadoVal = value?.valor ?? '';

  return (
    <div className="space-y-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
          <Calculator className="w-4 h-4 text-blue-600" />
          {c.rotuloCalculo || 'Memória de Cálculo (Substituição e Passos)'}
        </label>
        <textarea
          rows={c.linhas || 3}
          value={calculoVal}
          placeholder={c.placeholderCalculo || 'Ex.: Y = -125 + 0.12*(...) + 0.35*(...) = ...'}
          onChange={(e) => onChange({ ...value, calculo: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-mono focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-y"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
          {c.rotuloResultado || 'Resultado Numérico Final'}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            step="any"
            value={resultadoVal}
            placeholder="0"
            onChange={(e) => onChange({ ...value, valor: e.target.value })}
            className="w-48 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-bold font-mono focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          />
          {c.sufixo && (
            <span className="text-sm font-semibold text-slate-600 select-none">
              {c.sufixo}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
