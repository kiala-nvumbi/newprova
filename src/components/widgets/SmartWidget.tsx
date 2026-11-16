import React from 'react';
import { ExamItem } from '../../types/exam';
import { Target } from 'lucide-react';

interface SmartWidgetProps {
  item: ExamItem;
  value: any;
  onChange: (val: any) => void;
}

export const SmartWidget: React.FC<SmartWidgetProps> = ({ item, value, onChange }) => {
  const c = item.config || {};
  const campos = c.campos || [];
  const metaVal = value?.meta || '';

  const getLetterColor = (letra: string) => {
    switch (letra.toUpperCase()) {
      case 'S':
        return 'bg-blue-600 text-white';
      case 'M':
        return 'bg-emerald-600 text-white';
      case 'A':
        return 'bg-indigo-600 text-white';
      case 'R':
        return 'bg-amber-600 text-white';
      case 'T':
        return 'bg-rose-600 text-white';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {campos.map((cp) => (
          <div
            key={cp.key}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors"
          >
            <div
              className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-black text-lg shadow-sm ${getLetterColor(
                cp.letra
              )}`}
            >
              {cp.letra}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-baseline justify-between flex-wrap gap-1">
                <span className="text-sm font-bold text-slate-900">{cp.label}</span>
                {cp.dica && <span className="text-xs text-slate-500 italic">{cp.dica}</span>}
              </div>

              <textarea
                rows={2}
                value={value?.[cp.key] || ''}
                placeholder={`Defina o critério ${cp.letra}...`}
                onChange={(e) => onChange({ ...value, [cp.key]: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-y"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/40">
        <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 mb-1.5 flex items-center gap-1.5">
          <Target className="w-4 h-4 text-blue-700" />
          {c.rotuloMeta || 'Redacção Final da Meta SMART Sintetizada (Uma Frase)'}
        </label>
        <textarea
          rows={3}
          value={metaVal}
          placeholder="Ex.: Reduzir o tempo médio de espera nas urgências do Hospital de Cabinda de 8 horas para 3 horas até Dezembro de 2027..."
          onChange={(e) => onChange({ ...value, meta: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-lg border border-blue-300 bg-white text-slate-900 text-sm font-medium leading-relaxed focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-y"
        />
      </div>
    </div>
  );
};
