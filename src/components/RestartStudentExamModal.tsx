import React, { useState } from 'react';
import { ExamDefinition, ExamResult, Student } from '../types/exam';
import { RefreshCw, UserCheck, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface RestartStudentExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  exams: ExamDefinition[];
  results: ExamResult[];
  preSelectedStudentId?: string;
  preSelectedExamId?: string;
  onConfirmRestart: (studentId: string, examId: string) => void;
}

export const RestartStudentExamModal: React.FC<RestartStudentExamModalProps> = ({
  isOpen,
  onClose,
  students,
  exams,
  results,
  preSelectedStudentId,
  preSelectedExamId,
  onConfirmRestart
}) => {
  if (!isOpen) return null;

  const nonTeachers = students.filter((s) => s.role !== 'docente');
  const [selectedStudentId, setSelectedStudentId] = useState(
    preSelectedStudentId || nonTeachers[0]?.studentId || 'A001'
  );
  const [selectedExamId, setSelectedExamId] = useState(
    preSelectedExamId || exams[0]?.examId || 'cabinda2027'
  );

  const currentStudent = students.find((s) => s.studentId === selectedStudentId);
  const currentExam = exams.find((e) => e.examId === selectedExamId);

  // Check if student has previous results for this exam
  const previousResult = results.find(
    (r) => r.studentId === selectedStudentId && r.examId === selectedExamId
  );

  const handleRestart = () => {
    if (!selectedStudentId || !selectedExamId) return;
    onConfirmRestart(selectedStudentId, selectedExamId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Reiniciar Prova de Estudante
              </h3>
              <p className="text-xs text-slate-500">
                Ação exclusiva do Docente para nova tentativa limpa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body controls */}
        <div className="space-y-3.5 text-xs">
          {/* Student picker */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Estudante
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 text-xs focus:border-blue-600 outline-none"
            >
              {nonTeachers.map((s) => (
                <option key={s.studentId} value={s.studentId}>
                  [{s.studentId}] {s.nome} ({s.turma})
                </option>
              ))}
            </select>
          </div>

          {/* Exam picker */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Prova / Exame
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 text-xs focus:border-blue-600 outline-none"
            >
              {exams.map((ex) => (
                <option key={ex.examId} value={ex.examId}>
                  {ex.tipo === 'oficial' ? '⭐ Prova Oficial: ' : '🧪 Ensaio: '}
                  {ex.titulo}
                </option>
              ))}
            </select>
          </div>

          {/* Current Status Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">
              Estado Actual do Aluno
            </span>
            {previousResult ? (
              <div className="text-slate-800 flex items-center justify-between">
                <span>
                  Prova submetida ({new Date(previousResult.fimEm).toLocaleDateString('pt-PT')})
                </span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {previousResult.nota20} / 20 val
                </span>
              </div>
            ) : (
              <div className="text-slate-500 italic">
                Nenhum resultado final submetido para esta prova.
              </div>
            )}
          </div>

          {/* Warning banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>O que acontece ao reiniciar:</strong>
              <ul className="list-disc ml-4 mt-1 space-y-0.5 text-amber-800">
                <li>O resultado anterior é anulado.</li>
                <li>O rascunho de respostas no navegador do aluno é limpo.</li>
                <li>A janela de 3 horas é reiniciada para que o aluno comece do zero.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleRestart}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            Confirmar e Reiniciar Prova
          </button>
        </div>
      </div>
    </div>
  );
};
