import React, { useState, useEffect, useRef } from 'react';
import { ExamDefinition, ExamItem, Student, StudentAccess } from '../types/exam';
import { itemRespondido, serializar } from '../utils/gradingEngine';
import { getDraft, saveDraft, clearDraft } from '../utils/storage';
import { TextWidget } from './widgets/TextWidget';
import { NumberWidget } from './widgets/NumberWidget';
import { TextareaWidget } from './widgets/TextareaWidget';
import { CalculoWidget } from './widgets/CalculoWidget';
import { EscolhaWidget } from './widgets/EscolhaWidget';
import { SmartWidget } from './widgets/SmartWidget';
import { SwotWidget } from './widgets/SwotWidget';
import { TableWidget } from './widgets/TableWidget';
import { PertWidget } from './widgets/PertWidget';
import { Clock, CheckCircle, AlertTriangle, ArrowLeft, Send, Save, BookOpen } from 'lucide-react';

interface ExamViewProps {
  exam: ExamDefinition;
  currentUser: Student;
  access: StudentAccess;
  onBackToExams: () => void;
  onSubmitExam: (respostas: Record<string, { texto: string; dados: any }>) => void;
}

export const ExamView: React.FC<ExamViewProps> = ({
  exam,
  currentUser,
  access,
  onBackToExams,
  onSubmitExam
}) => {
  // Collect all items across parts and questions
  const allItems: ExamItem[] = [];
  exam.partes.forEach((p) => {
    p.questoes.forEach((q) => {
      q.itens.forEach((it) => {
        allItems.push(it);
      });
    });
  });

  // Initialize state from existing draft or default
  const [respostas, setRespostas] = useState<Record<string, any>>(() => {
    const draft = getDraft(exam.examId, currentUser.studentId);
    if (draft) return draft;

    const initial: Record<string, any> = {};
    allItems.forEach((it) => {
      const c = it.config || {};
      switch (it.widget) {
        case 'tabela':
          initial[it.id] = {
            linhas: (c.linhasPadrao || [{}]).map((l: any) => ({ ...l }))
          };
          break;
        case 'swot': {
          const l: any[] = [];
          (c.quadrantes || []).forEach((qd: any) => {
            for (let i = 0; i < (qd.itens || 3); i++) {
              l.push({ grupo: qd.key, item: '' });
            }
          });
          initial[it.id] = { linhas: l };
          break;
        }
        case 'escolha':
          initial[it.id] = { escolha: '', justificacao: '' };
          break;
        case 'calculo':
          initial[it.id] = { calculo: '', valor: '' };
          break;
        case 'smart': {
          const st: Record<string, any> = { meta: '' };
          (c.campos || []).forEach((cp: any) => {
            st[cp.key] = '';
          });
          initial[it.id] = st;
          break;
        }
        case 'pert':
          initial[it.id] = {
            atividades: (c.atividades || []).map((a: any) => ({ ...a })),
            caminho: [],
            eventos: {}
          };
          break;
        default:
          initial[it.id] = { valor: '' };
      }
    });
    return initial;
  });

  const [lastSaved, setLastSaved] = useState<string>('Guardado automaticamente');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save on answer change
  const handleItemChange = (itemId: string, itemData: any) => {
    setRespostas((prev) => {
      const next = { ...prev, [itemId]: itemData };
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveDraft(exam.examId, currentUser.studentId, next);
        setLastSaved(`Rascunho guardado às ${new Date().toLocaleTimeString('pt-PT').slice(0, 5)}`);
      }, 700);
      return next;
    });
  };

  // Timer countdown
  const expiraTimestamp = new Date(access.expiraEm).getTime();
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    Math.max(0, Math.floor((expiraTimestamp - Date.now()) / 1000))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiraTimestamp - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        alert('O tempo de prova terminou! A sua prova será submetida automaticamente com as respostas dadas até ao momento.');
        handleFinalSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiraTimestamp]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  const answeredCount = allItems.filter((it) => itemRespondido(it, respostas[it.id])).length;
  const progressPercent = allItems.length > 0 ? (answeredCount / allItems.length) * 100 : 0;
  const unansweredCount = allItems.length - answeredCount;

  const handleFinalSubmit = () => {
    setShowConfirmModal(false);
    clearDraft(exam.examId, currentUser.studentId);

    const formattedPayload: Record<string, { texto: string; dados: any }> = {};
    allItems.forEach((it) => {
      const itemData = respostas[it.id];
      formattedPayload[it.id] = {
        texto: serializar(it, itemData),
        dados: itemData
      };
    });

    onSubmitExam(formattedPayload);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 pb-28">
      {/* --- Sticky Top Bar --- */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBackToExams}
                title="Voltar à lista de provas"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 block">
                  {exam.tipo === 'ensaio' ? 'Modo de Treino Livre' : 'Prova Oficial de Avaliação'}
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate max-w-sm sm:max-w-md">
                  {exam.titulo}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Question progress counter */}
              <div className="text-xs font-semibold text-slate-600 hidden sm:flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  <strong>{answeredCount}</strong> / {allItems.length} respondidas
                </span>
              </div>

              {/* Countdown timer badge */}
              <div
                className={`px-3 py-1.5 rounded-xl font-mono font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs border ${
                  timeLeft < 15 * 60
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Navigation tabs for parts */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2.5 pb-1 no-scrollbar">
            {exam.partes.map((p) => (
              <button
                key={p.parte}
                type="button"
                onClick={() => {
                  const target = document.getElementById(`parte-${p.parte}`);
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="px-2.5 py-1 rounded-full text-xs font-bold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 bg-white shrink-0 transition-all cursor-pointer"
              >
                Parte {p.parte}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Exam general context / case study card */}
        {exam.contextoHtml && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              <BookOpen className="w-4 h-4" />
              <span>Cenário Base do Caso Prático</span>
            </div>
            <div
              className="prose prose-sm max-w-none text-slate-800 leading-relaxed [&>h4]:text-slate-900 [&>h4]:font-bold [&>h4]:text-base [&>h4]:mb-2 [&_table.dados]:w-full [&_table.dados]:border-collapse [&_table.dados]:my-3 [&_table.dados_th]:bg-slate-50 [&_table.dados_th]:text-slate-700 [&_table.dados_th]:font-bold [&_table.dados_th]:p-2.5 [&_table.dados_th]:border [&_table.dados_th]:border-slate-200 [&_table.dados_td]:p-2.5 [&_table.dados_td]:border [&_table.dados_td]:border-slate-200 [&_table.dados_td]:text-slate-800"
              dangerouslySetInnerHTML={{ __html: exam.contextoHtml }}
            />
          </div>
        )}

        {/* Parts and Questions */}
        {exam.partes.map((parte) => (
          <section
            key={parte.parte}
            id={`parte-${parte.parte}`}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 scroll-mt-28"
          >
            {/* Part header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-baseline gap-4">
              <span className="text-3xl font-serif font-black text-slate-900">
                {parte.parte}
              </span>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 block">
                  Parte {parte.parte}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {parte.titulo}
                </h3>
              </div>
            </div>

            {/* Part context if present */}
            {parte.contextoHtml && (
              <div
                className="prose prose-sm max-w-none text-slate-800 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 leading-relaxed [&_table.dados]:w-full [&_table.dados]:border-collapse [&_table.dados_th]:p-2 [&_table.dados_th]:bg-slate-100 [&_table.dados_th]:border [&_table.dados_th]:border-slate-200 [&_table.dados_td]:p-2 [&_table.dados_td]:border [&_table.dados_td]:border-slate-200"
                dangerouslySetInnerHTML={{ __html: parte.contextoHtml }}
              />
            )}

            {/* Questions within this part */}
            <div className="space-y-6">
              {parte.questoes.map((questao) => (
                <div
                  key={questao.numero}
                  className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs"
                >
                  <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-200 font-bold text-sm text-slate-800">
                    {questao.numero}
                  </div>

                  <div className="divide-y divide-slate-100">
                    {questao.itens.map((item) => {
                      const isAnswered = itemRespondido(item, respostas[item.id]);

                      return (
                        <div key={item.id} id={`item-${item.id}`} className="p-4 sm:p-5 space-y-3">
                          {/* Item header with alinea, text, and point value */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 flex-1">
                              {item.alinea && (
                                <span className="font-bold font-serif text-blue-700 text-sm mt-0.5">
                                  {item.alinea}
                                </span>
                              )}
                              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                                {item.enunciado}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isAnswered && (
                                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Respondida
                                </span>
                              )}

                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                {item.pontos} {item.pontos === 1 ? 'valor' : 'valores'}
                              </span>
                            </div>
                          </div>

                          {/* Widget Renderer */}
                          <div className="pt-1">
                            {item.widget === 'texto' && (
                              <TextWidget
                                item={item}
                                value={respostas[item.id]}
                                onChange={(val) => handleItemChange(item.id, val)}
                                allAnswers={respostas}
                              />
                            )}

                            {item.widget === 'numero' && (
                              <NumberWidget
                                item={item}
                                value={respostas[item.id]}
                                onChange={(val) => handleItemChange(item.id, val)}
                              />
                            )}

                            {item.widget === 'textarea' && (
                              <TextareaWidget
                                item={item}
                                value={respostas[item.id]}
                                onChange={(val) => handleItemChange(item.id, val)}
                              />
                            )}

                            {item.widget === 'calculo' && (
                              <CalculoWidget
                                item={item}
                                value={respostas[item.id]}
                                onChange={(val) => handleItemChange(item.id, val)}
                              />
                            )}

                            {item.widget === 'escolha' && (
                              <EscolhaWidget
                                item={item}
                                value={respostas[item.id]}
                                onChange={(val) => handleItemChange(item.id, val)}
                              />
                            )}

                            {item.widget === 'smart' && (
                              <SmartWidget
                                item={item}
                                value={respostas[item.id]}
                                onChange={(val) => handleItemChange(item.id, val)}
                              />
                            )}

                            {item.widget === 'swot' && (
                              <SwotWidget
                                item={item}
                                value={respostas[item.id]}
                                onChange={(val) => handleItemChange(item.id, val)}
                              />
                            )}

                            {item.widget === 'tabela' && (
                              <TableWidget
                                item={item}
                                value={respostas[item.id]}
                                onChange={(val) => handleItemChange(item.id, val)}
                              />
                            )}

                            {item.widget === 'pert' && (
                              <PertWidget
                                item={item}
                                value={respostas[item.id]}
                                onChange={(val) => handleItemChange(item.id, val)}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* --- Sticky Bottom Action Bar --- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Save className="w-3.5 h-3.5 text-blue-600" />
            <span>{lastSaved}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Terminar e Submeter Prova</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- Submission Confirmation Modal --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Submeter Prova
                </h3>
                <p className="text-xs text-slate-500">
                  Confirmação de finalização e envio
                </p>
              </div>
            </div>

            {unansweredCount > 0 ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Atenção:</strong> Ainda tem <strong>{unansweredCount}</strong> questão(ões) sem resposta preenchida.
                  <p className="mt-1 text-amber-800">
                    {exam.tipo === 'ensaio'
                      ? 'No ensaio pode submeter e ver a nota imediatamente para treinar.'
                      : 'Depois de submeter a prova oficial não será possível alterar as respostas.'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Todas as <strong>{allItems.length}</strong> questões foram respondidas. Ao submeter, as suas respostas serão corrigidas automaticamente pelo sistema e a nota final será atribuída.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Continuar a Rever
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors"
              >
                Confirmar e Submeter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
