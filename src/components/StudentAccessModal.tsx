import React, { useState, useEffect } from 'react';
import { Student, ExamDefinition } from '../types/exam';
import { ShieldCheck, ShieldAlert, X, Clock, CheckCircle2, User, KeyRound, Award } from 'lucide-react';

interface StudentAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  exams: ExamDefinition[];
  onSaveAccess: (studentId: string, updates: Partial<Student>) => void;
}

export const StudentAccessModal: React.FC<StudentAccessModalProps> = ({
  isOpen,
  onClose,
  student,
  exams,
  onSaveAccess
}) => {
  const [acessoPermitido, setAcessoPermitido] = useState<boolean>(true);
  const [provasPermitidas, setProvasPermitidas] = useState<string[]>([]);
  const [tempoExtraMin, setTempoExtraMin] = useState<number>(0);
  const [observacao, setObservacao] = useState<string>('');

  useEffect(() => {
    if (student) {
      setAcessoPermitido(student.acessoPermitido !== false);
      setProvasPermitidas(student.provasPermitidas || exams.map((e) => e.examId));
      setTempoExtraMin(student.tempoExtraMin || 0);
      setObservacao(student.observacao || '');
    }
  }, [student, exams]);

  if (!isOpen || !student) return null;

  const handleToggleExam = (examId: string) => {
    if (provasPermitidas.includes(examId)) {
      setProvasPermitidas(provasPermitidas.filter((id) => id !== examId));
    } else {
      setProvasPermitidas([...provasPermitidas, examId]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAccess(student.studentId, {
      acessoPermitido,
      provasPermitidas,
      tempoExtraMin,
      observacao: observacao.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${acessoPermitido ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40' : 'bg-rose-600/30 text-rose-400 border border-rose-500/40'}`}>
              {acessoPermitido ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Atribuir Acesso ao Aluno</h3>
              <p className="text-xs text-slate-300">
                {student.nome} ({student.studentId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Status banner */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900">Estado de Acesso à Avaliação</div>
              <div className="text-xs text-slate-500">
                {acessoPermitido
                  ? 'O aluno tem permissão para realizar as provas autorizadas.'
                  : 'Acesso bloqueado. O aluno não poderá entrar na prova.'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAcessoPermitido(!acessoPermitido)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                acessoPermitido
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                  : 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs'
              }`}
            >
              {acessoPermitido ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Autorizado
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  Bloqueado
                </>
              )}
            </button>
          </div>

          {/* Allowed Exams */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Provas Permitidas para Este Aluno:
            </label>
            <div className="space-y-2">
              {exams.map((ex) => {
                const isSelected = provasPermitidas.includes(ex.examId);
                return (
                  <label
                    key={ex.examId}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 text-blue-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleExam(ex.examId)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <div>
                        <div className="text-xs font-bold">{ex.titulo}</div>
                        <div className="text-[11px] text-slate-500">{ex.descricao}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {ex.tipo === 'oficial' ? 'Oficial' : 'Ensaio'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Extra time */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Tempo Adicional Concedido (Minutos)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="180"
                step="5"
                value={tempoExtraMin}
                onChange={(e) => setTempoExtraMin(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-28 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold focus:border-blue-600 outline-none"
              />
              <span className="text-xs text-slate-500">
                minutos extras (além do tempo base estipulado na prova)
              </span>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Observação / Justificação do Docente
            </label>
            <input
              type="text"
              value={observacao}
              placeholder="ex.: Acesso especial concedido / Aluno em segunda época"
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-600 outline-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Gravar Permissões
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
