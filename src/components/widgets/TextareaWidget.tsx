import React, { useRef, useEffect } from 'react';
import { ExamItem } from '../../types/exam';

interface TextareaWidgetProps {
  item: ExamItem;
  value: any;
  onChange: (val: any) => void;
}

export const TextareaWidget: React.FC<TextareaWidgetProps> = ({ item, value, onChange }) => {
  const c = item.config || {};
  const currentVal = value?.valor || '';
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight + 4, (c.linhas || 4) * 24)}px`;
    }
  }, [currentVal, c.linhas]);

  return (
    <div className="w-full">
      <textarea
        ref={textareaRef}
        rows={c.linhas || 4}
        value={currentVal}
        placeholder={c.placeholder || 'Escreva aqui a sua resposta fundamentada...'}
        onChange={(e) => {
          onChange({ ...value, valor: e.target.value });
        }}
        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm leading-relaxed focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-y font-normal"
      />
    </div>
  );
};
