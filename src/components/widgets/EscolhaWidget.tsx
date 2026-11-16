import React from 'react';
import { ExamItem } from '../../types/exam';

interface EscolhaWidgetProps {
  item: ExamItem;
  value: any;
  onChange: (val: any) => void;
}

export const EscolhaWidget: React.FC<EscolhaWidgetProps> = ({ item, value, onChange }) => {
  const c = item.config || {};
  const opcoes = c.opcoes || [];
  const escolhaVal = value?.escolha || '';
  const justificacaoVal = value?.justificacao || '';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
          {c.rotuloEscolha || 'Seleccione a Opção'}
        </label>
        <div className="flex flex-wrap gap-2.5">
          {opcoes.map((op) => {
            const isSelected = escolhaVal === op;
            return (
              <button
                type="button"
                key={op}
                onClick={() => onChange({ ...value, escolha: op })}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-200'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                }`}
              >
                {op}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
          {c.rotuloJustificacao || 'Justificação Fundamentada'}
        </label>
        <textarea
          rows={c.linhas || 4}
          value={justificacaoVal}
          placeholder="Apresente os motivos técnicos e estratégicos da sua escolha..."
          onChange={(e) => onChange({ ...value, justificacao: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm leading-relaxed focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-y"
        />
      </div>
    </div>
  );
};
