import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, CheckCircle2, Database, ShieldAlert, Sparkles } from 'lucide-react';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: (scope: 'attempts' | 'all') => void;
  totalSubmissions: number;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  isOpen,
  onClose,
  onConfirmClear,
  totalSubmissions
}) => {
  const [scope, setScope] = useState<'attempts' | 'all'>('attempts');
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleExecute = () => {
    if (!confirmedCheck) return;
    setIsProcessing(true);
    setTimeout(() => {
      onConfirmClear(scope);
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-rose-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs text-white">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Limpar Dados da Avaliação</h3>
              <p className="text-xs text-rose-100">
                Gestão e reinicialização de base de dados e pautas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-rose-100 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sm block">Atenção: Acção Administrativa</span>
              <p className="text-amber-800">
                Esta acção limpa os dados da base de dados Cloud SQL e do armazenamento local.
                Actualmente existem <strong>{totalSubmissions}</strong> submissões/tentativas registadas.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Seleccione o nível de limpeza:
            </label>
            <div className="space-y-2.5">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  scope === 'attempts'
                    ? 'border-rose-500 bg-rose-50/50 shadow-xs ring-1 ring-rose-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="cleanScope"
                  checked={scope === 'attempts'}
                  onChange={() => setScope('attempts')}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900">
                    Limpar apenas submissões e notas (Recomendado)
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Apaga todas as tentativas de teste/ensaio e resultados anteriores. Mantém os estudantes registados e as suas permissões de acesso atribuídas para a prova oficial.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'border-rose-500 bg-rose-50/50 shadow-xs ring-1 ring-rose-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="cleanScope"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900">
                    Reinicialização Geral Completa
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Apaga todas as submissões, notas, rascunhos em curso e reinicia todos os temporizadores de acesso de cada estudante.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmedCheck}
                onChange={(e) => setConfirmedCheck(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <span className="font-semibold text-slate-800">
                Confirmo que desejo apagar os registos seleccionados na base de dados.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!confirmedCheck || isProcessing}
            onClick={handleExecute}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-2 transition-all shadow-sm"
          >
            {isProcessing ? (
              <>A limpar dados...</>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Confirmar Limpeza
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
