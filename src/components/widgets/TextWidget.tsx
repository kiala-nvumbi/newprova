import React from 'react';
import { ExamItem } from '../../types/exam';
import { Link2 } from 'lucide-react';

interface TextWidgetProps {
  item: ExamItem;
  value: any;
  onChange: (val: any) => void;
  allAnswers?: Record<string, any>;
}

export const TextWidget: React.FC<TextWidgetProps> = ({ item, value, onChange, allAnswers }) => {
  const c = item.config || {};
  const currentVal = value?.valor || '';

  const handleUseMarkedPath = () => {
    if (!c.usarCaminhoMarcado || !allAnswers) return;
    const fonte = allAnswers[c.usarCaminhoMarcado];
    if (!fonte || !fonte.caminho || !fonte.caminho.length) {
      alert('Ainda não marcou nenhuma actividade no diagrama da rede PERT acima. Clique nas setas do diagrama para marcar as actividades críticas.');
      return;
    }
    const caminhoStr = fonte.caminho.join(' – ');
    onChange({ ...value, valor: caminhoStr });
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={currentVal}
        placeholder={c.placeholder || 'Resposta...'}
        onChange={(e) => onChange({ ...value, valor: e.target.value })}
        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
      />

      {c.usarCaminhoMarcado && (
        <button
          type="button"
          onClick={handleUseMarkedPath}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Link2 className="w-3.5 h-3.5" />
          Usar o caminho marcado no diagrama PERT
        </button>
      )}
    </div>
  );
};
