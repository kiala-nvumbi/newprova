import React from 'react';
import { ExamItem } from '../../types/exam';

interface NumberWidgetProps {
  item: ExamItem;
  value: any;
  onChange: (val: any) => void;
}

export const NumberWidget: React.FC<NumberWidgetProps> = ({ item, value, onChange }) => {
  const c = item.config || {};
  const currentVal = value?.valor ?? '';

  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        step="any"
        value={currentVal}
        placeholder="0"
        onChange={(e) => onChange({ ...value, valor: e.target.value })}
        className="w-44 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
      />
      {c.sufixo && (
        <span className="text-sm font-medium text-slate-600 select-none">
          {c.sufixo}
        </span>
      )}
    </div>
  );
};
