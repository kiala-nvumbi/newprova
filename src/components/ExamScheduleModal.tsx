import React, { useState } from 'react';
import { ExamDefinition } from '../types/exam';
import { Calendar, Clock, CheckCircle2, AlertCircle, Sparkles, X, Save } from 'lucide-react';
import { verificarDisponibilidadeExame } from '../utils/storage';

interface ExamScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: ExamDefinition[];
  onSaveSchedule: (
    examId: string,
    updates: {
      disponivelEm: string;
      horaInicio: string;
      horaFim: string;
      aberturaImediata: boolean;
      tempoLimiteMin: number;
    }
  ) => void;
}

export const ExamScheduleModal: React.FC<ExamScheduleModalProps> = ({
  isOpen,
  onClose,
  exams,
  onSaveSchedule
}) => {
  if (!isOpen) return null;

  const officialExam = exams.find((e) => e.tipo === 'oficial') || exams[0];
  const [selectedExamId, setSelectedExamId] = useState(officialExam?.examId || 'cabinda2027');

  const currentExam = exams.find((e) => e.examId === selectedExamId) || officialExam;

  // Form states initialized with current exam config
  const [disponivelEm, setDisponivelEm] = useState(
    currentExam.disponivelEm || new Date().toISOString().slice(0, 10)
  );
  const [horaInicio, setHoraInicio] = useState(currentExam.horaInicio || '08:00');
  const [horaFim, setHoraFim] = useState(currentExam.horaFim || '23:59');
  const [tempoLimiteMin, setTempoLimiteMin] = useState(currentExam.tempoLimiteMin || 180);
  const [aberturaImediata, setAberturaImediata] = useState(!!currentExam.aberturaImediata);

  // When exam selection changes
  const handleExamChange = (id: string) => {
    setSelectedExamId(id);
    const ex = exams.find((e) => e.examId === id);
    if (ex) {
      setDisponivelEm(ex.disponivelEm || new Date().toISOString().slice(0, 10));
      setHoraInicio(ex.horaInicio || '08:00');
      setHoraFim(ex.horaFim || '23:59');
      setTempoLimiteMin(ex.tempoLimiteMin || 180);
      setAberturaImediata(!!ex.aberturaImediata);
    }
  };

  // Preview current availability
  const mockUpdatedExam: ExamDefinition = {
    ...currentExam,
    disponivelEm,
    horaInicio,
    horaFim,
    aberturaImediata,
    tempoLimiteMin
  };
  const previewDisp = verificarDisponibilidadeExame(mockUpdatedExam);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSchedule(selectedExamId, {
      disponivelEm,
      horaInicio,
      horaFim,
      aberturaImediata,
      tempoLimiteMin
    });
    onClose();
  };

  const handleSetOpenImmediately = () => {
    const today = new Date().toISOString().slice(0, 10);
    setDisponivelEm(today);
    setHoraInicio('00:00');
    setHoraFim('23:59');
    setAberturaImediata(true);
  };

  const handleSetScheduleTomorrow = () => {
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);
    setDisponivelEm(tomorrow);
    setHoraInicio('08:00');
    setHoraFim('20:00');
    setAberturaImediata(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Configurar Data de Abertura da Prova
              </h3>
              <p className="text-xs text-slate-500">
                Defina o dia e a hora em que os estudantes podem iniciar a prova
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Exam Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
              Seleccionar Prova
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => handleExamChange(e.target.value)}
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

          {/* Quick shortcuts */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSetOpenImmediately}
              className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-[11px] hover:bg-emerald-100 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Abrir Imediatamente Hoje
            </button>

            <button
              type="button"
              onClick={handleSetScheduleTomorrow}
              className="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 font-bold text-[11px] hover:bg-blue-100 flex items-center gap-1 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Agendar para Amanhã às 08:00
            </button>
          </div>

          {/* Date & Times Inputs */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3.5">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Data de Abertura (Dia da Prova)
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={disponivelEm}
                  onChange={(e) => {
                    setDisponivelEm(e.target.value);
                    setAberturaImediata(false);
                  }}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white font-bold font-mono text-xs text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Hora de Início
                </label>
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => {
                    setHoraInicio(e.target.value);
                    setAberturaImediata(false);
                  }}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-xs text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  Hora de Fim (Encerramento)
                </label>
                <input
                  type="time"
                  required
                  value={horaFim}
                  onChange={(e) => {
                    setHoraFim(e.target.value);
                    setAberturaImediata(false);
                  }}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-xs text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Duração da Prova (Minutos)
                </label>
                <input
                  type="number"
                  min={30}
                  max={600}
                  step={15}
                  value={tempoLimiteMin}
                  onChange={(e) => setTempoLimiteMin(parseInt(e.target.value, 10) || 180)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-xs text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-300 bg-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={aberturaImediata}
                    onChange={(e) => setAberturaImediata(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-bold text-[11px] text-slate-800">
                    Abrir Imediatamente
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Status Preview */}
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${
              previewDisp.estado === 'disponivel'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : previewDisp.estado === 'agendada'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {previewDisp.estado === 'disponivel' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            <span>
              <strong>Estado actual para os alunos:</strong> {previewDisp.mensagem}
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
            >
              <Save className="w-4 h-4" />
              Guardar e Aplicar Abertura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
